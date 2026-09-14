import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    userName: { type: String, required: true },
    userImage: { type: String },
    rating: { type: Number, required: true, min: 1, max: 10 },
    comment: { type: String, required: true, maxlength: 1000 },
    image: { type: String }, // Reviewer photo/picture attachment
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique index only when userId is provided
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true, sparse: true });

export const Review = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
