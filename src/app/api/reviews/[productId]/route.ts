import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";
import Product from "@/models/Product";
import mongoose from "mongoose";

// GET all reviews for a product
export async function GET(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    await connectToDatabase();
    const { productId } = await params;
    
    // Find real reviews submitted to DB
    const dbReviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(dbReviews || []);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json([]);
  }
}

// POST a new review
export async function POST(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { productId } = await params;
    const body = await req.json();
    const { rating, comment, image, userName: customName } = body;

    if (!rating || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 10" },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: "Review comment is required" },
        { status: 400 }
      );
    }

    // Only authenticated users can write reviews
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to write a review. Only customers who purchased this product can leave a review." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    const isAdmin = (session.user as any).role === "admin";
    const authorName = session.user.name || (customName && customName.trim()) || "Verified Collector";
    const authorImage = session.user.image || "";

    // 1. Resolve product identifiers to match both custom ID (slug) and MongoDB ObjectId
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

    // 2. Verify customer has an order containing this product
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

    if (!purchasedOrder && !isAdmin) {
      return NextResponse.json(
        { error: "Only verified buyers who purchased this product can write a review." },
        { status: 403 }
      );
    }

    // 3. Prevent duplicate reviews by the same user for this product
    if (userId) {
      const existingReview = await Review.findOne({ productId, userId });
      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this product" },
          { status: 409 }
        );
      }
    }

    const review = await Review.create({
      productId,
      userId,
      userName: authorName,
      userImage: authorImage,
      rating: Math.min(10, Math.max(1, Math.round(rating))),
      comment: comment.trim().slice(0, 1000),
      image: image || undefined,
      isVerifiedPurchase: true,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "You have already reviewed this product" },
        { status: 409 }
      );
    }
    console.error("Failed to create review:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
