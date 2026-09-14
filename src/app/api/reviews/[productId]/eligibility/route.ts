import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Review } from "@/models/Review";
import Product from "@/models/Product";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { productId } = await params;

    if (!session || !session.user) {
      return NextResponse.json({
        isLoggedIn: false,
        hasPurchased: false,
        alreadyReviewed: false,
        canReview: false,
        message: "Sign in to write a review. Only customers who purchased this product can leave a review.",
      });
    }

    await connectToDatabase();

    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    const isAdmin = (session.user as any).role === "admin";

    // Find product identifiers
    const productDoc = await Product.findOne({
      $or: [
        { id: productId },
        ...(mongoose.Types.ObjectId.isValid(productId) ? [{ _id: productId }] : []),
      ],
    }).lean();

    const productIdentifiers = Array.from(
      new Set(
        [productId, (productDoc as any)?.id, (productDoc as any)?._id?.toString()].filter(Boolean)
      )
    );

    // Check if user purchased this product
    const orderQuery: any = {
      "items.productId": { $in: productIdentifiers },
      status: { $ne: "Cancelled" },
    };

    if (userId && userEmail) {
      orderQuery.$or = [{ user: userId }, { "shippingAddress.email": userEmail }];
    } else if (userId) {
      orderQuery.user = userId;
    } else if (userEmail) {
      orderQuery["shippingAddress.email"] = userEmail;
    }

    const purchasedOrder = await Order.findOne(orderQuery);
    const hasPurchased = Boolean(purchasedOrder) || isAdmin;

    // Check if user already reviewed
    const existingReview = userId
      ? await Review.findOne({ productId, userId })
      : null;
    const alreadyReviewed = Boolean(existingReview);

    const canReview = hasPurchased && !alreadyReviewed;

    return NextResponse.json({
      isLoggedIn: true,
      hasPurchased,
      alreadyReviewed,
      canReview,
      message: alreadyReviewed
        ? "You have already reviewed this product."
        : hasPurchased
        ? "You are eligible to review this product."
        : "Only verified buyers who purchased this product can write a review.",
    });
  } catch (error) {
    console.error("Failed to check review eligibility:", error);
    return NextResponse.json(
      { error: "Failed to check eligibility" },
      { status: 500 }
    );
  }
}
