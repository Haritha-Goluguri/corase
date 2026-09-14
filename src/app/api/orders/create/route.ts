import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import Razorpay from "razorpay";
import mongoose from "mongoose";

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in environment variables.");
  }
  return new Razorpay({ key_id, key_secret });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { items, shippingAddress, coupon: couponCode, paymentMethod } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "No order items" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Authoritative price & stock verification against DB
    const productIds = items.map((it: any) => it.productId);
    const validObjectIds = productIds.filter((pid: any) => mongoose.Types.ObjectId.isValid(pid));
    const dbProducts = await Product.find({
      $or: [
        { id: { $in: productIds } },
        ...(validObjectIds.length > 0 ? [{ _id: { $in: validObjectIds } }] : []),
      ],
    });

    const productMap = new Map();
    for (const p of dbProducts) {
      productMap.set(p.id, p);
      productMap.set((p as any)._id?.toString(), p);
    }

    let calculatedSubtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json({ message: `Product ${item.name || item.productId} not found` }, { status: 400 });
      }

      const variant = dbProduct.variants?.find((v: any) => v.size === item.selectedSize);
      if (!variant || variant.stock < item.quantity) {
        return NextResponse.json({
          message: `${dbProduct.title} (${item.selectedSize}) does not have enough stock`
        }, { status: 400 });
      }

      calculatedSubtotal += dbProduct.price * item.quantity;
      verifiedItems.push({
        productId: item.productId,
        name: dbProduct.title,
        price: dbProduct.price,
        image: item.image || dbProduct.images?.[0] || "",
        selectedSize: item.selectedSize,
        quantity: item.quantity,
      });
    }

    // 2. Validate Coupon
    let serverDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          return NextResponse.json({ message: "Coupon has expired" }, { status: 400 });
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return NextResponse.json({ message: "Coupon usage limit reached" }, { status: 400 });
        }
        if (calculatedSubtotal < coupon.minOrderAmount) {
          return NextResponse.json({
            message: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`
          }, { status: 400 });
        }

        if (coupon.discountType === "percentage") {
          serverDiscount = (calculatedSubtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && serverDiscount > coupon.maxDiscount) {
            serverDiscount = coupon.maxDiscount;
          }
        } else {
          serverDiscount = Math.min(coupon.discountValue, calculatedSubtotal);
        }
      }
    }

    // Standardized shipping rule
    const calculatedShipping = calculatedSubtotal >= 999 ? 0 : 69;
    const expectedTotal = Math.max(calculatedSubtotal + calculatedShipping - serverDiscount, 0);

    // 3. If order total is 0 (100% coupon / promotional), bypass gateway
    if (expectedTotal === 0) {
      const newOrder = await Order.create({
        user: (session.user as any).id,
        items: verifiedItems,
        shippingAddress,
        paymentMethod: "Promotional / Free",
        subtotal: calculatedSubtotal,
        shippingPrice: calculatedShipping,
        totalPrice: 0,
        discount: serverDiscount,
        coupon: couponCode,
        isPaid: true,
        paidAt: new Date(),
        status: "Processing",
      });

      // Deduct stock for zero-total orders
      for (const item of verifiedItems) {
        const isValidObjId = mongoose.Types.ObjectId.isValid(item.productId);
        await Product.findOneAndUpdate(
          {
            $or: [
              { id: item.productId },
              ...(isValidObjId ? [{ _id: item.productId }] : []),
            ],
            "variants.size": item.selectedSize,
          },
          { $inc: { "variants.$.stock": -item.quantity } }
        );
      }

      if (couponCode) {
        await Coupon.findOneAndUpdate(
          { code: couponCode.toUpperCase() },
          { $inc: { usedCount: 1 } }
        );
      }

      return NextResponse.json({
        orderId: newOrder._id,
        isFree: true,
        amount: 0,
        currency: "INR",
      }, { status: 201 });
    }

    // 4. Create Razorpay Payment Gateway Order
    let rzpOrder;
    try {
      const razorpay = getRazorpayInstance();
      rzpOrder = await razorpay.orders.create({
        amount: Math.round(expectedTotal * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      });
    } catch (gatewayErr: any) {
      console.error("Razorpay order creation failed:", gatewayErr);
      return NextResponse.json({
        message: gatewayErr?.message || "Payment gateway configuration error. Please ensure Razorpay keys are configured."
      }, { status: 500 });
    }

    // 5. Create Order in MongoDB
    const newOrder = await Order.create({
      user: (session.user as any).id,
      items: verifiedItems,
      shippingAddress,
      paymentMethod: "Razorpay Gateway",
      subtotal: calculatedSubtotal,
      shippingPrice: calculatedShipping,
      totalPrice: expectedTotal,
      discount: serverDiscount,
      coupon: couponCode,
      isPaid: false,
      status: "Pending",
      razorpayOrderId: rzpOrder.id,
    });

    return NextResponse.json({
      orderId: newOrder._id,
      razorpayOrderId: rzpOrder.id,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      amount: rzpOrder.amount,
      currency: rzpOrder.currency || "INR",
    }, { status: 201 });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ message: error?.message || "Internal server error" }, { status: 500 });
  }
}