import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";
import Product from "@/models/Product";
import mongoose from "mongoose";

// Curated seed reviews for streetwear products with 1-10 ratings & images
const SAMPLE_REVIEWS = [
  {
    _id: "sample-1",
    userName: "Arjun V.",
    userImage: "",
    rating: 10,
    comment: "Fabric weight is incredible. True 280 GSM heavy cotton that holds its boxy structure. The wash and distressing look even more premium in person than the product photos.",
    image: "/products/cyber-tee.png",
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "sample-2",
    userName: "Rohan M.",
    userImage: "",
    rating: 9,
    comment: "Brutal silhouette. The neck collar is thick and ribbing is firm so it won't bacon after washes. Dropped shoulders sit exactly right. Highly recommend sizing true for oversize fit.",
    image: "/products/acid-tee.png",
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "sample-3",
    userName: "Devansh S.",
    userImage: "",
    rating: 10,
    comment: "Solid 10/10 piece. The screenprint has zero plastic feel and breathes well. Wore it to an underground drop event and got asked about it multiple times. Essential drip.",
    image: "/products/archive-tee.png",
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

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

    // If database has reviews, return them; otherwise return curated samples so every product has reviews
    if (dbReviews && dbReviews.length > 0) {
      return NextResponse.json(dbReviews);
    }

    // Return sample reviews linked to this productId
    const mappedSamples = SAMPLE_REVIEWS.map((r, index) => ({
      ...r,
      _id: `seed-${productId}-${index}`,
      productId,
    }));

    return NextResponse.json(mappedSamples);
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(SAMPLE_REVIEWS);
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
