"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, ArrowRight, Check, Star, Send, MessageSquare, Camera, Trash2, Lock } from 'lucide-react';
import { Product, useCart } from '@/context/CartContext';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { filterSizesByCategory } from '@/lib/sizeUtils';
import SizeChartModal from './SizeChartModal';
import { useWishlist } from '@/context/WishlistContext';
import { Heart } from 'lucide-react';

interface Review {
    _id: string;
    userName: string;
    rating: number;
    comment: string;
    image?: string;
    createdAt: string;
}

interface ProductModalProps {
    product: Product | null;
    onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const { addToCart, setIsOpen, setBuyNowItem } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const router = useRouter();
    const { data: session } = useSession();
    
    const wishlisted = product ? isWishlisted(product.id) : false;

    // Review state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewRating, setReviewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewImage, setReviewImage] = useState<string | null>(null);
    const [reviewEligibility, setReviewEligibility] = useState<{
        isLoggedIn: boolean;
        hasPurchased: boolean;
        alreadyReviewed: boolean;
        canReview: boolean;
        message: string;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
    const [showSizeError, setShowSizeError] = useState(false);

    // Reset selection and image index when product changes
    useEffect(() => {
        setSelectedSize('');
        setCurrentImageIndex(0);
        setShowSizeError(false);
        setReviewRating(0);
        setReviewComment('');
        setReviewImage(null);
        setReviewError('');
        setReviewSuccess('');

        if (product?.id) {
            fetch(`/api/reviews/${product.id}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setReviews(data);
                })
                .catch(() => setReviews([]));

            if (session?.user) {
                fetch(`/api/reviews/${product.id}/eligibility`)
                    .then(res => res.json())
                    .then(data => setReviewEligibility(data))
                    .catch(() => setReviewEligibility(null));
            } else {
                setReviewEligibility(null);
            }
        }
    }, [product?.id, session]);

    const handleAddToCart = () => {
        if (!selectedSize) {
            setShowSizeError(true);
            setTimeout(() => setShowSizeError(false), 2000);
            return;
        }
        
        setIsAdding(true);
        setTimeout(() => {
            addToCart({
                productId: product!.id,
                name: product!.name,
                price: product!.price,
                image: product!.images?.[0] || product!.image,
                selectedSize: selectedSize,
                quantity: 1
            });
            setIsAdding(false);
            onClose();
        }, 1000);
    };

    const handleBuyNow = () => {
        if (!product) return;
        if (!selectedSize) {
            setShowSizeError(true);
            setTimeout(() => setShowSizeError(false), 2000);
            return;
        }
        
        const price = Number(product.price);
        if (isNaN(price) || price <= 0) {
            alert("This product's price is not valid. Please contact support.");
            return;
        }

        setBuyNowItem({
            productId: product.id,
            name: product.name || "Product",
            price: price,
            image: product.images?.[0] || product.image || "/placeholder.jpg",
            selectedSize: selectedSize,
            quantity: 1
        });
        setIsOpen(false);
        onClose();
        router.push('/checkout');
    };

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (product?.images?.length) {
            setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (product?.images?.length) {
            setCurrentImageIndex((prev) => (prev - 1 + product.images!.length) % product.images!.length);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewRating || !reviewComment.trim()) {
            setReviewError('Please add a rating and comment');
            return;
        }

        setIsSubmitting(true);
        setReviewError('');
        setReviewSuccess('');

        try {
            const res = await fetch(`/api/reviews/${product!.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: reviewRating,
                    comment: reviewComment.trim(),
                    image: reviewImage || undefined
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setReviewError(data.error || 'Failed to submit review');
                return;
            }

            setReviews(prev => [data, ...prev]);
            setReviewComment('');
            setReviewRating(0);
            setReviewImage(null);
            setReviewEligibility(prev => prev ? { ...prev, canReview: false, alreadyReviewed: true } : null);
            setReviewSuccess('Review submitted!');
            setTimeout(() => setReviewSuccess(''), 3000);
        } catch {
            setReviewError('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <AnimatePresence>
            {product && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/90 backdrop-blur-md"
                    />

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative bg-background w-full max-w-6xl h-full max-h-[850px] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-foreground/5"
                    >
                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 md:top-8 md:right-8 z-50 text-foreground/50 hover:text-foreground transition-colors p-2 bg-background/50 backdrop-blur-md rounded-full md:bg-transparent"
                        >
                            <X size={24} className="md:w-8 md:h-8" />
                        </button>

                        {/* Image Section */}
                        <div className="flex-1 relative bg-white/5 flex items-center justify-center p-6 md:p-12 overflow-hidden min-h-[300px] md:min-h-0 group/gallery">
                            <div 
                                className="absolute inset-0 opacity-10 blur-[120px]" 
                                style={{ backgroundColor: product.color }}
                            />
                            <motion.div 
                                key={currentImageIndex}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x > 50) prevImage({ stopPropagation: () => {} } as any);
                                    else if (info.offset.x < -50) nextImage({ stopPropagation: () => {} } as any);
                                }}
                                className="relative w-full h-full cursor-grab active:cursor-grabbing"
                            >
                                <Image 
                                    src={product.images?.[currentImageIndex] || product.image} 
                                    alt={product.name} 
                                    fill 
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.1)] pointer-events-none"
                                    priority
                                />
                            </motion.div>

                            {/* Slider Controls */}
                            {product.images && product.images.length > 1 && (
                                <>
                                    <button 
                                        onClick={prevImage}
                                        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-background/50 backdrop-blur-md text-foreground/40 hover:text-foreground hover:bg-background transition-all opacity-0 group-hover/gallery:opacity-100 hidden md:flex"
                                    >
                                        <ArrowRight size={24} className="rotate-180" />
                                    </button>
                                    <button 
                                        onClick={nextImage}
                                        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-background/50 backdrop-blur-md text-foreground/40 hover:text-foreground hover:bg-background transition-all opacity-0 group-hover/gallery:opacity-100 hidden md:flex"
                                    >
                                        <ArrowRight size={24} />
                                    </button>

                                    {/* Indicators */}
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                                        {product.images.map((_: any, i: number) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={cn(
                                                    "h-1 rounded-full transition-all duration-500",
                                                    currentImageIndex === i ? "w-8 bg-foreground" : "w-2 bg-foreground/20"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                            
                            {/* Watermark Logo */}
                            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-[12vw] md:text-[8vw] font-bold font-syncopate tracking-tighter opacity-[0.02] select-none pointer-events-none text-foreground">
                                CORASE
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="w-full md:w-[480px] p-6 sm:p-10 md:p-16 flex flex-col justify-start bg-foreground/[0.02] overflow-y-auto relative">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="flex items-center space-x-4 mb-4 md:mb-6">
                                    <div className="flex items-center space-x-2">
                                        <span className="w-6 md:w-8 h-px bg-foreground" />
                                        <span className="text-[8px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.5em] text-foreground uppercase leading-none">
                                            Collection 26
                                        </span>
                                    </div>
                                    {product.status && product.status !== "none" && product.status.trim() !== "" && (
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-xl transition-all duration-500",
                                            product.status.toLowerCase().includes("coming") ? "bg-red-600 border-red-600 text-white" :
                                            product.status.toLowerCase().includes("limited") ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                            product.status.toLowerCase().includes("sold") ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                            "bg-foreground/10 border-foreground/20 text-foreground"
                                        )}>
                                            <span className={cn(
                                                "w-1 h-1 rounded-full",
                                                product.status.toLowerCase().includes("coming") ? "bg-white animate-pulse" :
                                                product.status.toLowerCase().includes("limited") ? "bg-amber-400" :
                                                product.status.toLowerCase().includes("sold") ? "bg-red-400" :
                                                "bg-foreground"
                                            )} />
                                            <span className="text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase">
                                                {product.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-start justify-between gap-4 mb-2 md:mb-4">
                                    <h2 className="text-xl sm:text-4xl md:text-5xl font-bold font-syncopate tracking-tighter text-foreground leading-tight uppercase italic flex-1 pr-2">
                                        {product.name}
                                    </h2>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWishlist({
                                                productId: product.id,
                                                name: product.name,
                                                price: product.price,
                                                image: product.images?.[0] || product.image,
                                            });
                                        }}
                                        className={cn(
                                            "p-2.5 sm:p-3 rounded-full transition-all duration-500 shadow-xl flex-shrink-0",
                                            wishlisted
                                                ? "bg-brand-red text-white scale-110"
                                                : "bg-foreground/5 text-foreground/40 hover:bg-foreground/10 hover:text-brand-red"
                                        )}
                                    >
                                        <Heart 
                                            size={16} 
                                            className="sm:w-5 sm:h-5"
                                            fill={wishlisted ? "currentColor" : "none"} 
                                            strokeWidth={2.5} 
                                        />
                                    </button>
                                </div>

                                {/* Price + Rating Summary */}
                                <div className="flex items-center gap-4 mb-6 md:mb-10">
                                    <p className="text-xl md:text-2xl font-bold text-foreground/70 tracking-widest">₹{product.price}</p>
                                    {avgRating && (
                                        <div className="flex items-center gap-1.5 bg-foreground/5 px-3 py-1.5 rounded-full">
                                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                            <span className="text-[10px] font-black text-foreground tracking-wider">{avgRating}</span>
                                            <span className="text-[9px] text-foreground/40 font-bold">({reviews.length})</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-10">
                                    <div>
                                        <div className="flex justify-between mb-4">
                                            <p className="text-[10px] font-black tracking-[0.3em] text-foreground uppercase">Select Size</p>
                                            <button 
                                                onClick={() => setIsSizeChartOpen(true)}
                                                className="text-[10px] font-bold text-foreground uppercase underline cursor-pointer hover:text-foreground transition-colors"
                                            >
                                                Size Guide
                                            </button>
                                        </div>
                                        {showSizeError && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center gap-2 text-[10px] font-black text-brand-red mb-3 uppercase tracking-widest bg-brand-red/10 border border-brand-red/30 px-3 py-2 rounded-xl"
                                            >
                                                <span>⚠ Please select a size first to continue!</span>
                                            </motion.div>
                                        )}
                                        <motion.div 
                                            animate={showSizeError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                                            transition={{ duration: 0.35 }}
                                            className={cn(
                                                "grid grid-cols-4 gap-3 p-1 rounded-2xl transition-all",
                                                showSizeError ? "ring-2 ring-brand-red/60 bg-brand-red/5" : ""
                                            )}
                                        >
                                            {filterSizesByCategory(
                                                (product.variants || product.sizes || []).map((v: any) => typeof v === 'string' ? v : v.size),
                                                product.category
                                            ).map((size: string) => {
                                                const variant = product.variants?.find((v: any) => (typeof v === 'string' ? v : v.size) === size);
                                                const isOutOfStock = typeof variant === 'string' ? false : variant?.stock === 0;
                                                return (
                                                    <button
                                                        key={size}
                                                        disabled={isOutOfStock}
                                                        onClick={() => {
                                                            if (!isOutOfStock) {
                                                                setSelectedSize(size);
                                                                setShowSizeError(false);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "relative h-14 border font-bold font-syncopate text-[10px] transition-all duration-300 rounded-xl overflow-hidden cursor-pointer",
                                                            selectedSize === size 
                                                                ? "bg-foreground text-background border-foreground shadow-[0_0_25px_rgba(255,255,255,0.25)] scale-[1.03]" 
                                                                : isOutOfStock 
                                                                    ? "bg-foreground/5 text-foreground/25 border-foreground/5 cursor-not-allowed line-through" 
                                                                    : "bg-transparent text-foreground/70 border-foreground/10 hover:border-foreground/40 hover:text-foreground hover:scale-[1.02]"
                                                        )}
                                                    >
                                                        <span className={isOutOfStock ? "line-through opacity-30" : ""}>{size}</span>
                                                        {isOutOfStock && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                                                <span className="text-[7px] tracking-[0.2em] font-black text-red-400 -rotate-12 border border-red-500/30 px-2 py-0.5 rounded-full bg-red-950/40">✕ SOLD</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                        {selectedSize && (() => {
                                            const variant = product.variants?.find((v: { size: string; stock: number }) => v.size === selectedSize);
                                            if (variant && variant.stock <= 3 && variant.stock > 0) {
                                                return (
                                                    <p className="mt-3 text-[10px] font-bold text-red-400 tracking-widest uppercase animate-pulse">
                                                        Only {variant.stock} left in stock!
                                                    </p>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black tracking-[0.3em] text-foreground uppercase mb-4">Story</p>
                                        <p className="text-sm text-foreground leading-relaxed font-bold tracking-tight">
                                            {product.description}
                                        </p>
                                    </div>

                                    {/* ══ MYNTRA-STYLE REACTIVE ACTION BUTTONS ══ */}
                                    <div className="flex flex-col gap-3 pt-2">
                                        <AnimatePresence>
                                            {selectedSize && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -6, height: 0 }}
                                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                    exit={{ opacity: 0, y: -6, height: 0 }}
                                                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red text-[11px] font-bold overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Check size={14} className="stroke-[3]" />
                                                        <span>Size <span className="underline font-black">{selectedSize}</span> Selected</span>
                                                    </div>
                                                    <span className="text-[9px] tracking-widest uppercase font-mono text-foreground/70">
                                                        Ready to Bag • Fast Dispatch
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* ADD TO BAG (Myntra Hero CTA) */}
                                        <button 
                                            type="button"
                                            onClick={handleAddToCart}
                                            disabled={isAdding}
                                            className={cn(
                                                "relative w-full py-5 rounded-xl font-black tracking-[0.2em] text-[10px] flex items-center justify-center space-x-3 transition-all duration-300 group overflow-hidden cursor-pointer",
                                                !selectedSize 
                                                    ? "bg-foreground/5 text-foreground/40 border border-foreground/10 hover:border-foreground/20 hover:text-foreground/60" 
                                                    : isAdding 
                                                        ? "bg-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.4)]" 
                                                        : "bg-gradient-to-r from-brand-red via-red-600 to-[#d9121b] text-white shadow-[0_12px_35px_rgba(255,30,39,0.45)] hover:shadow-[0_16px_45px_rgba(255,30,39,0.65)] hover:scale-[1.02] active:scale-[0.98] ring-2 ring-brand-red/40 hover:ring-brand-red"
                                            )}
                                        >
                                            {isAdding ? (
                                                <motion.div 
                                                    initial={{ scale: 0 }} 
                                                    animate={{ scale: 1 }} 
                                                    className="flex items-center space-x-2 font-black tracking-[0.25em]"
                                                >
                                                    <Check size={16} className="stroke-[3]" />
                                                    <span>ADDED TO BAG</span>
                                                </motion.div>
                                            ) : (
                                                <>
                                                    <ShoppingBag size={16} className={cn("transition-transform duration-300", selectedSize ? "group-hover:-translate-y-0.5 group-hover:scale-110" : "")} />
                                                    <span>{selectedSize ? "ADD TO BAG" : "SELECT SIZE TO BAG"}</span>
                                                    {selectedSize && (
                                                        <span className="absolute right-4 px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-mono tracking-widest hidden sm:inline-block">
                                                            {selectedSize}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </button>

                                        {/* BUY IT NOW */}
                                        <button 
                                            type="button"
                                            onClick={handleBuyNow}
                                            disabled={isAdding}
                                            className={cn(
                                                "w-full py-5 rounded-xl font-black tracking-[0.3em] text-[10px] flex items-center justify-center space-x-3 transition-all duration-300 group cursor-pointer",
                                                !selectedSize 
                                                    ? "bg-foreground/10 text-foreground/30 border border-foreground/5 hover:bg-foreground/15" 
                                                    : "bg-foreground text-background shadow-[0_12px_35px_rgba(255,255,255,0.25)] hover:shadow-[0_16px_45px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                                            )}
                                        >
                                            <span>BUY IT NOW</span>
                                            <ArrowRight size={16} className={cn("transition-transform duration-300", selectedSize ? "group-hover:translate-x-1" : "")} />
                                        </button>
                                    </div>

                                    {/* ══ REVIEWS SECTION ══ */}
                                    <div className="border-t border-foreground/5 pt-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare size={14} className="text-foreground/40" />
                                                <p className="text-[10px] font-black tracking-[0.3em] text-foreground uppercase">
                                                    Reviews {reviews.length > 0 && `(${reviews.length})`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Scrollable Reviews */}
                                        {reviews.length > 0 ? (
                                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-2 px-2">
                                                {reviews.map((review) => (
                                                    <div
                                                        key={review._id}
                                                        className="min-w-[260px] max-w-[280px] bg-foreground/[0.03] border border-foreground/5 rounded-2xl p-4 flex-shrink-0 snap-start hover:border-foreground/10 transition-all flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2.5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-full bg-brand-red/10 flex items-center justify-center">
                                                                        <span className="text-[9px] font-black text-brand-red uppercase">
                                                                            {review.userName.charAt(0)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-foreground uppercase tracking-wider truncate max-w-[110px]">
                                                                        {review.userName}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                                                                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                                                    <span className="text-[10px] font-black text-yellow-400">
                                                                        {review.rating}/10
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-foreground/75 leading-relaxed line-clamp-3 mb-2.5">
                                                                {review.comment}
                                                            </p>
                                                            {review.image && (
                                                                <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2 border border-foreground/10 bg-black/20">
                                                                    <Image
                                                                        src={review.image}
                                                                        alt={`Review by ${review.userName}`}
                                                                        fill
                                                                        sizes="280px"
                                                                        className="object-cover hover:scale-105 transition-transform duration-300"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] text-foreground/20 font-bold uppercase tracking-widest mt-1">
                                                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Drop'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-foreground/[0.02] rounded-2xl border border-foreground/5">
                                                <MessageSquare size={20} className="mx-auto text-foreground/10 mb-2" />
                                                <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">
                                                    No reviews yet
                                                </p>
                                            </div>
                                        )}

                                        {/* Write Review Form / Eligibility Gate */}
                                        {!session?.user ? (
                                            <div className="mt-6 text-center py-4 bg-foreground/[0.02] rounded-xl border border-foreground/5">
                                                <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                                                    Purchased this piece? <button onClick={() => router.push('/login')} className="text-brand-red hover:underline">Sign in</button> to write a verified review
                                                </p>
                                            </div>
                                        ) : reviewEligibility?.alreadyReviewed ? (
                                            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
                                                <Check size={14} className="text-emerald-400" />
                                                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                                                    Thank you! You have already reviewed this piece.
                                                </p>
                                            </div>
                                        ) : reviewEligibility && !reviewEligibility.hasPurchased ? (
                                            <div className="mt-6 p-4 bg-foreground/[0.02] rounded-xl border border-foreground/5 flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                                                    <Lock size={12} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-foreground">Verified Buyers Only</p>
                                                    <p className="text-[9px] text-foreground/40 mt-0.5">Only customers who have ordered this item can leave a review.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-6 bg-foreground/[0.03] border border-foreground/5 rounded-2xl p-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-black tracking-[0.2em] text-foreground uppercase">
                                                        Write a Review
                                                    </p>
                                                    <span className="text-[10px] font-black text-yellow-400">
                                                        {reviewRating > 0 ? `${reviewRating}/10 Rating` : 'Select score 1-10'}
                                                    </span>
                                                </div>

                                                {/* 1-10 Rating Input Grid */}
                                                <div>
                                                    <div className="grid grid-cols-10 gap-1">
                                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                onClick={() => setReviewRating(s)}
                                                                onMouseEnter={() => setHoverRating(s)}
                                                                onMouseLeave={() => setHoverRating(0)}
                                                                className={cn(
                                                                    "py-1.5 rounded-lg text-[10px] font-black transition-all border",
                                                                    (hoverRating || reviewRating) >= s
                                                                        ? "bg-yellow-400 text-black border-yellow-400 shadow-sm"
                                                                        : "bg-foreground/5 border-foreground/10 text-foreground/50 hover:border-foreground/30"
                                                                )}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Comment Input */}
                                                <div className="relative">
                                                    <textarea
                                                        value={reviewComment}
                                                        onChange={(e) => setReviewComment(e.target.value)}
                                                        placeholder="Share your thoughts on the fit, fabric, and styling..."
                                                        maxLength={500}
                                                        rows={3}
                                                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-xs text-foreground placeholder-foreground/20 focus:outline-none focus:border-foreground/20 transition-all resize-none"
                                                    />
                                                    <span className="absolute bottom-3 right-3 text-[9px] text-foreground/15 font-bold">
                                                        {reviewComment.length}/500
                                                    </span>
                                                </div>

                                                {/* Picture Attachment */}
                                                <div>
                                                    {reviewImage ? (
                                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-foreground/10 group">
                                                            <Image
                                                                src={reviewImage}
                                                                alt="Review preview"
                                                                fill
                                                                className="object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setReviewImage(null)}
                                                                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/10 cursor-pointer text-[10px] font-black uppercase tracking-wider transition-all">
                                                            <Camera size={14} className="text-foreground/40" />
                                                            <span>Attach Picture</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (!file) return;
                                                                    if (file.size > 5 * 1024 * 1024) {
                                                                        setReviewError("Image must be under 5MB");
                                                                        return;
                                                                    }
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        setReviewImage(reader.result as string);
                                                                        setReviewError("");
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </div>

                                                {/* Error / Success */}
                                                {reviewError && (
                                                    <p className="text-[10px] font-bold text-red-400 tracking-wider">{reviewError}</p>
                                                )}
                                                {reviewSuccess && (
                                                    <p className="text-[10px] font-bold text-green-400 tracking-wider">{reviewSuccess}</p>
                                                )}

                                                {/* Submit */}
                                                <button
                                                    onClick={handleSubmitReview}
                                                    disabled={isSubmitting || !reviewRating || !reviewComment.trim()}
                                                    className="w-full py-3 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground font-black text-[10px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 hover:bg-foreground/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    <Send size={12} />
                                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
            <SizeChartModal 
                isOpen={isSizeChartOpen} 
                onClose={() => setIsSizeChartOpen(false)} 
            />
        </AnimatePresence>
    );
};

export default ProductModal;
