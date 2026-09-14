import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import crypto from "crypto";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderId,
      isBuyNow
    } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || "";

    // Verify signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return NextResponse.json({ message: "Transaction not legit!" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the order and update status
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.status = "Processing";
    order.razorpayPaymentId = razorpay_payment_id;
    order.transactionId = razorpay_payment_id;
    await order.save();

    // Deduct stock for purchased variants
    for (const item of order.items) {
      const isValidObjId = mongoose.Types.ObjectId.isValid(item.productId);
      await Product.findOneAndUpdate(
        { 
          $or: [
            { id: item.productId },
            ...(isValidObjId ? [{ _id: item.productId }] : []),
          ],
          "variants.size": item.selectedSize 
        },
        { $inc: { "variants.$.stock": -item.quantity } }
      );
    }

    // Trigger Email Notification (Async)
    sendOrderConfirmationEmail(order).catch(err => console.error("Email failed:", err));

    // Increment coupon usage
    if (order.coupon) {
      await Coupon.findOneAndUpdate(
        { code: order.coupon.toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // Clear user cart only if checkout was from cart (not Buy Now)
    if (!isBuyNow) {
      const user = await User.findById((session.user as any).id);
      if (user) {
        user.cart = [];
        await user.save();
      }
    }

    

    return NextResponse.json({ message: "Payment verified successfully", orderId: order._id }, { status: 200 });
  } catch (error) {
    console.error("Order verification error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
