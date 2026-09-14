import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import Product from "@/models/Product";
import Coupon from "@/models/Coupon";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orderId, transactionId, utrNumber, customerUpiId } = await req.json();

    if (!orderId || !transactionId) {
      return NextResponse.json({ message: "Missing orderId or transactionId" }, { status: 400 });
    }

    await connectToDatabase();
    const userId = (session.user as any).id;

    // Security check: Find order AND ensure it belongs to session user before updating
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return NextResponse.json({ message: "Order not found or unauthorized" }, { status: 404 });
    }

    const isFirstSubmission = !order.transactionId;

    order.transactionId = transactionId;
    order.utrNumber = utrNumber || transactionId;
    order.customerUpiId = customerUpiId || "";
    await order.save();

    if (isFirstSubmission) {
      // Decrement stock for purchased items
      for (const item of order.items) {
        if (item.selectedSize) {
          await Product.findOneAndUpdate(
            {
              $or: [{ id: item.productId }, { _id: item.productId }],
              "variants.size": item.selectedSize,
            },
            {
              $inc: { "variants.$.stock": -item.quantity },
            }
          );
        }
      }

      // Increment coupon usage
      if (order.coupon) {
        await Coupon.findOneAndUpdate(
          { code: order.coupon.toUpperCase() },
          { $inc: { usedCount: 1 } }
        );
      }
    }

    // Clear user cart in MongoDB
    const user = await User.findById(userId);
    if (user) {
      user.cart = [];
      await user.save();
    }

    // Trigger Order Confirmation Email
    sendOrderConfirmationEmail(order).catch(err => console.error("UPI email failed:", err));

    return NextResponse.json({ message: "Transaction ID updated successfully", order });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}