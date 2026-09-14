"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Minus, Plus, Truck, RotateCcw, Shield, ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import ProductReviews from "@/components/products/ProductReviews";

interface ProductClientProps {
  productId: string;
  initialProduct: any;
}

export default function ProductClient({ productId, initialProduct }: ProductClientProps) {
  const [product, setProduct] = useState<any>(initialProduct);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(!initialProduct);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { addToCart, setIsOpen, setBuyNowItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data);
          if (!initialProduct) {
            const found = data.find((p: any) => p.id === productId);
            setProduct(found || null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchProducts();
  }, [productId, initialProduct]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, 4);
  }, [product, allProducts]);

  if (pageLoading) {
    return (
      <div className="bg-[#050505] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#050505] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-6xl mb-6">🔍</p>
          <p className="text-white/60 font-bold tracking-[0.2em] text-xs uppercase mb-6">
            Product not found
          </p>
          <Link
            href="/shop"
            className="text-xs font-bold tracking-wider uppercase text-white border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all rounded-sm"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2500);
      return;
    }
    setSizeError(false);
    setIsAdding(true);
    const cartProduct = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.image,
      selectedSize: selectedSize,
      quantity: quantity,
    };
    addToCart(cartProduct);
    setTimeout(() => {
      setIsAdding(false);
    }, 1200);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 2500);
      return;
    }
    setSizeError(false);
    const buyProduct = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || product.image,
      selectedSize: selectedSize,
      quantity: quantity,
    };
    setBuyNowItem(buyProduct);
    setIsOpen(false);
    router.push("/checkout");
  };

  const nextImage = () => {
    if (product.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-white pt-24 pb-32">
      <div className="max-w-[1400px] mx-auto px-5 lg:px-16">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-10"
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Shop
          </Link>
        </motion.div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="relative aspect-[3/4] bg-[#0a0a0a] rounded-sm overflow-hidden lg:sticky lg:top-28 shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={product.images?.[currentImageIndex] || product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </div>

              {/* Slider Controls */}
              {product.images?.length > 1 && (
                <>
                  <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.preventDefault(); prevImage(); }}
                      className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-xl"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); nextImage(); }}
                      className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white hover:text-black transition-all shadow-xl"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {/* Indicators */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          currentImageIndex === i ? "w-8 bg-white" : "w-2 bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {product.status && product.status !== "none" && product.status.trim() !== "" && (
                <span className={cn(
                  "absolute top-5 left-5 text-[10px] font-bold tracking-[0.2em] uppercase text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-sm border border-white/10 shadow-lg z-10",
                  product.status.toLowerCase().includes("coming") && "text-indigo-400 border-indigo-500/30",
                  product.status.toLowerCase().includes("limited") && "text-amber-400 border-amber-500/30",
                  product.status.toLowerCase().includes("sold") && "text-neutral-500 border-neutral-700"
                )}>
                  {product.status}
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative aspect-square rounded-sm overflow-hidden border-2 transition-all ${
                      currentImageIndex === i ? "border-white scale-95 shadow-lg" : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col"
          >
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60 mb-3">
              {product.category}
            </p>
            <h1 className="text-brand-red text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-syncopate tracking-tighter uppercase mb-4 md:mb-6 leading-[1.1]">
              {product.name}
            </h1>
            <p className="text-2xl font-black text-white mb-8">
              ₹{product.price}
            </p>

            <p className="text-white/50 text-base leading-relaxed mb-10 max-w-md">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/60">
                  Select Size
                </p>
                {selectedSize && (
                  <span className="text-[10px] font-mono text-brand-red font-bold">
                    ✓ Size {selectedSize} Selected
                  </span>
                )}
              </div>

              {sizeError && (
                <motion.div 
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-[10px] font-black text-brand-red mb-3 uppercase tracking-widest bg-brand-red/10 border border-brand-red/30 px-3 py-2 rounded-xl"
                >
                  <span>⚠ Please select a size first to continue!</span>
                </motion.div>
              )}

              <motion.div 
                animate={sizeError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                transition={{ duration: 0.35 }}
                className={cn(
                  "flex flex-wrap gap-3 p-1 rounded-2xl transition-all",
                  sizeError ? "ring-2 ring-brand-red/60 bg-brand-red/5" : ""
                )}
              >
                {(product.sizes || (product.variants || []).map((v: any) => v.size)).map((size: string) => {
                  const variant = product.variants?.find((v: any) => v.size === size);
                  const outOfStock = variant ? variant.stock === 0 : false;
                  return (
                    <button
                      key={size}
                      disabled={outOfStock}
                      onClick={() => {
                        if (!outOfStock) { 
                          setSelectedSize(size); 
                          setSizeError(false); 
                        }
                      }}
                      className={cn(
                        "relative min-w-[54px] h-12 px-4 rounded-xl text-xs font-bold border transition-all overflow-hidden cursor-pointer",
                        selectedSize === size
                          ? "bg-white text-black border-white shadow-[0_0_25px_rgba(255,255,255,0.25)] scale-[1.05]"
                          : outOfStock
                          ? "border-white/5 bg-white/[0.02] text-white/20 cursor-not-allowed line-through"
                          : "border-white/20 text-white/70 hover:border-white/50 hover:text-white hover:scale-[1.02]"
                      )}
                    >
                      <span className={outOfStock ? "line-through opacity-30" : ""}>{size}</span>
                      {outOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                          <span className="text-[7px] tracking-[0.2em] font-black text-red-400 -rotate-12 border border-red-500/30 px-1.5 py-0.5 rounded-full bg-red-950/40">✕ SOLD</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </motion.div>
            </div>

            {/* Quantity */}
            <div className="mb-10">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/30 mb-4">
                Quantity
              </p>
              <div className="flex items-center border border-white/15 rounded-xl w-fit overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 h-12 flex items-center justify-center text-sm font-bold border-x border-white/15">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Actions (Myntra-style reactive highlight) */}
            <div className="flex flex-col gap-3 mb-12">
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
                    <span className="text-[9px] tracking-widest uppercase font-mono text-white/70">
                      Ready to Bag • Fast Dispatch
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                {/* ADD TO BAG (Myntra Hero CTA) */}
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={cn(
                    "relative flex-1 py-4 sm:py-5 rounded-xl font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer overflow-hidden",
                    !selectedSize
                      ? "bg-white/[0.05] border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                      : isAdding
                      ? "bg-emerald-600 text-white shadow-[0_12px_35px_rgba(16,185,129,0.4)]"
                      : "bg-gradient-to-r from-brand-red via-red-600 to-[#d9121b] text-white shadow-[0_12px_35px_rgba(255,30,39,0.45)] hover:shadow-[0_16px_45px_rgba(255,30,39,0.65)] hover:scale-[1.02] active:scale-[0.98] ring-2 ring-brand-red/40 hover:ring-brand-red"
                  )}
                >
                  {isAdding ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 font-black tracking-[0.25em]"
                    >
                      <Check size={16} className="stroke-[3]" />
                      <span>ADDED TO BAG</span>
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingBag size={16} className={cn("transition-transform duration-300", selectedSize ? "group-hover:-translate-y-0.5 group-hover:scale-110" : "")} />
                      <span>{selectedSize ? "ADD TO BAG" : "SELECT SIZE TO BAG"}</span>
                      {selectedSize && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-mono tracking-widest">
                          {selectedSize}
                        </span>
                      )}
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    toggleWishlist({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                    })
                  }
                  className={cn(
                    "w-12 sm:w-14 h-auto rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                    wishlisted
                      ? "bg-white text-black border-white"
                      : "border-white/15 text-white/50 hover:text-white hover:border-white/40"
                  )}
                >
                  <Heart size={16} className="sm:w-[18px] sm:h-[18px]" fill={wishlisted ? "currentColor" : "none"} />
                </button>
              </div>

              {/* BUY IT NOW */}
              <button
                onClick={handleBuyNow}
                className={cn(
                  "w-full py-5 rounded-xl font-black text-[10px] sm:text-xs tracking-[0.35em] uppercase transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer group",
                  !selectedSize
                    ? "bg-white/10 text-white/30 border border-white/5 hover:bg-white/15"
                    : "bg-white text-black shadow-[0_12px_35px_rgba(255,255,255,0.25)] hover:shadow-[0_16px_45px_rgba(255,255,255,0.4)] hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                <span>BUY NOW — ₹{product.price * quantity}</span>
                <ArrowRight size={16} className={cn("transition-transform duration-300", selectedSize ? "group-hover:translate-x-1" : "")} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="border-t border-white/[0.06] pt-8 space-y-4">
              {[
                { icon: Truck, text: "Standard delivery at ₹69" },
                { icon: Truck, text: "Free delivery on orders above ₹999" },
                { icon: RotateCcw, text: "7-day hassle-free returns" },
                { icon: Shield, text: "100% secure payment" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/35 text-sm">
                  <Icon size={16} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Customer Reviews & Ratings (1 to 10 with pictures) */}
        {product && (
          <ProductReviews productId={product.id} productName={product.name} />
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-32">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl md:text-3xl font-black font-syncopate tracking-tight uppercase">
                You May Also Like
              </h2>
              <Link
                href="/shop"
                className="text-xs font-bold tracking-[0.15em] uppercase text-white/40 hover:text-white transition-colors border-b border-white/20 pb-1"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-8">
              {relatedProducts.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="group">
                  <div className="relative aspect-[3/4] bg-[#0f0f0f] overflow-hidden mb-4 rounded-sm">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase truncate">
                    {p.name}
                  </h3>
                  <p className="text-sm text-white/50">₹{p.price}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
