"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Camera,
  CheckCircle2,
  X,
  Upload,
  User,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Loader2,
  Maximize2,
  ShieldCheck,
  Lock
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface ReviewItem {
  _id?: string;
  productId: string;
  userName: string;
  userImage?: string;
  rating: number; // 1 to 10
  comment: string;
  image?: string;
  isVerifiedPurchase?: boolean;
  createdAt?: string;
}

interface ProductReviewsProps {
  productId: string;
  productName?: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Review eligibility state (verified buyers only)
  const [eligibility, setEligibility] = useState<{
    isLoggedIn: boolean;
    hasPurchased: boolean;
    alreadyReviewed: boolean;
    canReview: boolean;
    message: string;
  } | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState<number>(10);
  const [comment, setComment] = useState("");
  const [customName, setCustomName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Lightbox states
  const [filterWithPhotos, setFilterWithPhotos] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // Fetch reviews & eligibility
  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      try {
        setLoading(true);
        const res = await fetch(`/api/reviews/${productId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setReviews(Array.isArray(data) ? data : []);
          }
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function checkEligibility() {
      if (!session?.user) {
        if (isMounted) {
          setEligibility({
            isLoggedIn: false,
            hasPurchased: false,
            alreadyReviewed: false,
            canReview: false,
            message: "Sign in to write a review. Only customers who purchased this product can leave a review.",
          });
        }
        return;
      }
      try {
        const res = await fetch(`/api/reviews/${productId}/eligibility`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setEligibility(data);
        }
      } catch (err) {
        console.error("Failed to check review eligibility:", err);
      }
    }

    loadReviews();
    checkEligibility();
    return () => {
      isMounted = false;
    };
  }, [productId, session]);

  // Calculations
  const stats = useMemo(() => {
    if (!reviews.length) {
      return {
        average: "0.0",
        total: 0,
        photoCount: 0,
        breakdown: { exceptional: 0, great: 0, standard: 0 },
      };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const average = (sum / total).toFixed(1);
    const photoCount = reviews.filter((r) => !!r.image).length;
    const exceptional = Math.round(
      (reviews.filter((r) => Number(r.rating) >= 9).length / total) * 100
    );
    const great = Math.round(
      (reviews.filter((r) => Number(r.rating) >= 7 && Number(r.rating) < 9).length / total) * 100
    );
    const standard = Math.round(
      (reviews.filter((r) => Number(r.rating) < 7).length / total) * 100
    );
    return { average, total, photoCount, breakdown: { exceptional, great, standard } };
  }, [reviews]);

  // Filtered reviews
  const displayedReviews = useMemo(() => {
    if (filterWithPhotos) {
      return reviews.filter((r) => !!r.image);
    }
    return reviews;
  }, [reviews, filterWithPhotos]);

  // Handle local image upload preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image size should be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg("Please write a review comment.");
      return;
    }
    if (rating < 1 || rating > 10) {
      setErrorMsg("Rating must be between 1 and 10.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/reviews/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          image: imagePreview || undefined,
          userName: customName.trim() || session?.user?.name || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setReviews((prev) => [data, ...prev]);
      setSuccessMsg("Review submitted successfully! Thank you.");
      setEligibility((prev) =>
        prev ? { ...prev, canReview: false, alreadyReviewed: true } : null
      );
      setComment("");
      setImagePreview(null);
      setTimeout(() => {
        setIsFormOpen(false);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-28 pt-16 border-t border-white/[0.08]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
              COMMUNITY FEEDBACK & ARCHIVE
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black font-syncopate tracking-tight text-white uppercase">
            Customer Reviews {stats.total > 0 && `(${stats.total})`}
          </h2>
        </div>

        {/* Action Button */}
        <div>
          {!session ? (
            <button
              onClick={() => router.push('/login')}
              className="bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 px-6 py-4 rounded-xl font-black font-syncopate text-xs tracking-[0.2em] uppercase transition-all flex items-center gap-2.5 w-fit group"
            >
              <Lock size={14} className="text-white/60 group-hover:text-black" />
              <span>Sign In to Review</span>
            </button>
          ) : eligibility?.alreadyReviewed ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Review Submitted</span>
            </div>
          ) : eligibility && !eligibility.hasPurchased ? (
            <div className="flex items-center gap-2.5 px-6 py-4 rounded-xl bg-white/[0.03] border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wider">
              <Lock size={14} className="text-amber-400" />
              <span>Verified Buyers Only</span>
            </div>
          ) : (
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-white text-black px-8 py-4 rounded-xl font-black font-syncopate text-xs tracking-[0.2em] uppercase hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(255,255,255,0.15)] flex items-center gap-3 w-fit"
            >
              <Sparkles size={16} />
              {isFormOpen ? "Close Form" : "Write a Review"}
            </button>
          )}
        </div>
      </div>

      {/* Score Overview Card (Only shown if genuine reviews exist) */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Rating Score */}
          <div className="bg-[#121212] border border-white/[0.08] rounded-2xl p-8 flex flex-col justify-center">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-6xl font-black font-syncopate text-white tracking-tighter">
                {stats.average}
              </span>
              <span className="text-2xl font-bold font-syncopate text-white/40">/ 10</span>
            </div>
            <div className="flex items-center gap-1.5 mb-3 text-brand-red">
              {Array.from({ length: 10 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.round(Number(stats.average)) ? "currentColor" : "none"}
                  className={i < Math.round(Number(stats.average)) ? "text-brand-red" : "text-white/10"}
                />
              ))}
            </div>
            <p className="text-xs text-white/40 font-medium tracking-wide">
              Based on {stats.total} verified customer {stats.total === 1 ? "rating" : "ratings"}
            </p>
          </div>

          {/* Dynamic Rating Breakdown */}
          <div className="bg-[#121212] border border-white/[0.08] rounded-2xl p-8 flex flex-col justify-center gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70 font-bold uppercase tracking-wider">Exceptional (9–10★)</span>
              <span className="text-white font-mono font-bold">{stats.breakdown.exceptional}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-red rounded-full transition-all duration-500"
                style={{ width: `${stats.breakdown.exceptional}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-white/70 font-bold uppercase tracking-wider">Recommended (7–8★)</span>
              <span className="text-white font-mono font-bold">{stats.breakdown.great}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${stats.breakdown.great}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-white/70 font-bold uppercase tracking-wider">Standard (&lt;7★)</span>
              <span className="text-white font-mono font-bold">{stats.breakdown.standard}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all duration-500"
                style={{ width: `${stats.breakdown.standard}%` }}
              />
            </div>
          </div>

          {/* Customer Photos Strip */}
          <div className="bg-[#121212] border border-white/[0.08] rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Customer Photos
                </span>
                <span className="text-[10px] font-mono text-white/40 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {stats.photoCount} Photos
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {reviews
                  .filter((r) => !!r.image)
                  .slice(0, 4)
                  .map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePhotoModal(r.image!)}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 group hover:border-white transition-all cursor-pointer"
                    >
                      <Image
                        src={r.image!}
                        alt="Review photo"
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={12} className="text-white" />
                      </div>
                    </button>
                  ))}
                {stats.photoCount === 0 && (
                  <div className="text-xs text-white/30 italic py-3">No customer photos yet.</div>
                )}
              </div>
            </div>

            {stats.photoCount > 0 && (
              <button
                onClick={() => setFilterWithPhotos(!filterWithPhotos)}
                className={`text-xs font-bold uppercase tracking-wider mt-4 flex items-center gap-2 transition-colors ${
                  filterWithPhotos ? "text-brand-red" : "text-white/60 hover:text-white"
                }`}
              >
                <Camera size={14} />
                {filterWithPhotos ? "Showing photo reviews only (Show All)" : "Filter by photo reviews"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Informational banner for visitors & non-purchasers */}
      {!session && (
        <div className="mb-10 p-5 rounded-2xl bg-[#121212] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 flex-shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-white">Verified Customer Reviews</p>
              <p className="text-[11px] text-white/40 mt-0.5">Reviews are exclusive to verified customers who ordered this item. All collectors can browse authentic feedback and photos.</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black font-black text-[10px] tracking-widest uppercase transition-all whitespace-nowrap"
          >
            Sign In to Review
          </button>
        </div>
      )}

      {session && eligibility && !eligibility.hasPurchased && (
        <div className="mb-10 p-5 rounded-2xl bg-[#121212] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Lock size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">Verified Buyers Only</span>
                <span className="text-[9px] bg-white/10 text-white/70 px-2 py-0.5 rounded font-mono">Purchase Required</span>
              </div>
              <p className="text-[11px] text-white/40 mt-0.5">
                Only customers who have placed an order for this piece can leave a review. All visitors can browse verified ratings and real customer photos below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Form (Expandable) */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden mb-16"
          >
            <div className="bg-[#121212] border border-white/15 rounded-3xl p-8 md:p-12 shadow-2xl relative">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-xl font-black font-syncopate uppercase text-white tracking-tight">
                    Add Your Experience
                  </h3>
                  <p className="text-xs text-white/50 mt-1">
                    Reviewing: <span className="text-white font-bold">{productName || "Product"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold py-3.5 px-4 rounded-xl mb-6 tracking-wide">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold py-3.5 px-4 rounded-xl mb-6 tracking-wide flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1 to 10 Rating Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-black uppercase tracking-widest text-white">
                      Rating: <span className="text-brand-red font-mono font-black text-sm">{rating} / 10</span>
                    </label>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {rating === 10 ? "★ 10/10 Masterpiece" : rating >= 8 ? "★ Highly Recommended" : rating >= 6 ? "★ Solid" : "★ Needs Improvement"}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const value = i + 1;
                      const isSelected = rating === value;
                      const isPast = rating >= value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`h-12 rounded-xl font-mono font-black text-sm transition-all flex flex-col items-center justify-center gap-0.5 border ${
                            isSelected
                              ? "bg-brand-red text-white border-brand-red scale-105 shadow-[0_0_20px_rgba(255,40,40,0.4)]"
                              : isPast
                              ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                              : "bg-white/[0.02] text-white/40 border-white/[0.06] hover:bg-white/5"
                          }`}
                        >
                          <span>{value}</span>
                          <span className="text-[8px] opacity-60">★</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reviewer Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-white/70 mb-2">
                      Your Name or Handle
                    </label>
                    <input
                      type="text"
                      placeholder={session?.user?.name || "e.g. Alex K."}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                    />
                  </div>

                  {/* Photo Upload Attachment */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-white/70 mb-2">
                      Attach Product Photo (Optional)
                    </label>
                    <label className="w-full bg-white/[0.04] border border-white/10 border-dashed rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white hover:border-white/30 cursor-pointer transition-all flex items-center justify-center gap-2.5">
                      <Camera size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider truncate">
                        {imagePreview ? "Change Photo" : "Upload Picture"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Image Preview Thumbnail */}
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-red group shadow-xl">
                    <Image
                      src={imagePreview}
                      alt="Uploaded preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 hover:bg-brand-red transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Comment / Review Body */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/70">
                      Review Comment
                    </label>
                    <span className="text-[10px] font-mono text-white/30">
                      {comment.length}/1000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    maxLength={1000}
                    placeholder="Describe the fabric weight, drape, stitching, print quality, and overall vibe..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-red text-white px-8 py-4 rounded-xl font-black font-syncopate text-xs tracking-widest uppercase hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-[0_10px_30px_rgba(255,40,40,0.3)]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Post Review"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-white/30">
          <Loader2 size={24} className="animate-spin mr-3" />
          <span className="text-xs uppercase tracking-widest font-bold">Loading reviews...</span>
        </div>
      ) : displayedReviews.length === 0 ? (
        <div className="text-center py-20 bg-[#121212] border border-white/[0.06] rounded-3xl p-8">
          <MessageSquare size={32} className="text-white/20 mx-auto mb-4" />
          <h4 className="text-base font-black font-syncopate uppercase text-white mb-1">
            {filterWithPhotos ? "No Photo Reviews" : "No Reviews Yet"}
          </h4>
          <p className="text-xs text-white/40 mb-6">
            {filterWithPhotos
              ? "None of the verified reviews include customer photos yet."
              : "Be the first to rate and review this piece."}
          </p>
          {filterWithPhotos ? (
            <button
              onClick={() => setFilterWithPhotos(false)}
              className="bg-white text-black px-6 py-3 rounded-xl font-black font-syncopate text-xs tracking-widest uppercase hover:bg-white/90"
            >
              Show All Reviews
            </button>
          ) : !session ? (
            <button
              onClick={() => router.push('/login')}
              className="bg-white text-black px-6 py-3 rounded-xl font-black font-syncopate text-xs tracking-widest uppercase hover:bg-white/90"
            >
              Sign In to Review
            </button>
          ) : eligibility && !eligibility.hasPurchased ? (
            <span className="text-xs text-white/40 uppercase font-bold tracking-widest">
              Available to Verified Buyers
            </span>
          ) : (
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-white text-black px-6 py-3 rounded-xl font-black font-syncopate text-xs tracking-widest uppercase hover:bg-white/90"
            >
              Leave a Review
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedReviews.map((review, idx) => (
            <div
              key={review._id || idx}
              className="bg-[#121212] border border-white/[0.08] hover:border-white/20 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Review Header: User & Rating */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs">
                      {review.userImage ? (
                        <Image
                          src={review.userImage}
                          alt={review.userName}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        review.userName?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {review.userName}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30 tracking-wider">
                        {review.createdAt
                          ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Verified Drop"}
                      </span>
                    </div>
                  </div>

                  {/* Rating Badge 1 to 10 */}
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                    <Star size={13} className="text-brand-red fill-brand-red" />
                    <span className="text-xs font-mono font-black text-white">
                      {review.rating}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">/10</span>
                  </div>
                </div>

                {/* Review Comment ("commit") */}
                <p className="text-sm text-white/70 leading-relaxed font-normal mb-4">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Review Photo Attachment */}
              {review.image && (
                <div className="pt-3 border-t border-white/[0.06] mt-2">
                  <div
                    onClick={() => setActivePhotoModal(review.image!)}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 hover:border-brand-red transition-all cursor-pointer group/photo"
                  >
                    <Image
                      src={review.image}
                      alt="Customer review picture"
                      fill
                      className="object-cover group-hover/photo:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 size={16} className="text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-Screen Image Lightbox Modal */}
      <AnimatePresence>
        {activePhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePhotoModal(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full aspect-square rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
            >
              <Image
                src={activePhotoModal}
                alt="Enlarged review photo"
                fill
                className="object-contain bg-black"
              />
              <button
                onClick={() => setActivePhotoModal(null)}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/70 border border-white/20 text-white hover:bg-brand-red transition-colors"
              >
                <X size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
