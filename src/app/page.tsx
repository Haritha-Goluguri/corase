"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import ProductCard from "@/components/products/ProductCard";
import ProductModal from "@/components/products/ProductModal";
import { useWishlist } from "@/context/WishlistContext";
import { HeroSection } from "@/components/home/HeroSection";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.8, ease: "easeOut" as const },
};

export default function Home() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, settingsRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/admin/settings")
        ]);
        const productsData = await productsRes.json();
        const settingsData = await settingsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
        setSettings(settingsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);



  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-brand-red font-syncopate text-xl animate-pulse">CORASE</div>
      </div>
    );
  }

  const trendingProducts = products.filter((p: any) => 
    p.isFeatured || (p.status && p.status.toLowerCase().includes("trending"))
  ).slice(0, 4);

  const newArrivals = products.filter((p: any) => 
    p.isNewDrop || (p.status && (p.status.toLowerCase().includes("new") || p.status.toLowerCase().includes("drop")))
  ).slice(0, 4);

  return (
    <div className="bg-background min-h-screen text-foreground">
      {/* ══ HERO ══ */}
      <HeroSection 
        settings={settings} 
        isAdmin={isAdmin} 
        onEdit={() => {}} 
      />

      {/* ══ TRENDING ══ */}
      <section className="py-12 md:py-32 px-5 lg:px-16 max-w-[1600px] mx-auto">
        <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-4">
          <div>
            <h2 className="text-2xl md:text-5xl font-black font-syncopate uppercase tracking-tight mb-1">Trending</h2>
            <p className="text-foreground/60 text-[10px] md:text-sm tracking-widest uppercase">Most Wanted Pieces</p>
          </div>
          <Link href="/shop" className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-foreground/80 hover:text-foreground transition-colors border-b border-foreground/20 pb-1 w-fit">
            View All
          </Link>
        </motion.div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
          {trendingProducts.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} isAdmin={isAdmin} />
          ))}
        </div>
      </section>

      {/* ══ BRAND PROMO ══ */}
      <section className="relative py-24 md:py-40 border-y border-foreground/[0.05] overflow-hidden">
        <div className="absolute inset-0 bg-background/5" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.h2 {...fadeUp} className="text-3xl sm:text-4xl md:text-6xl font-black font-syncopate tracking-tight uppercase leading-[1.1] mb-8">
            Minimalism <br className="hidden md:block"/> is an attitude
          </motion.h2>
          <motion.p {...fadeUp} className="text-foreground/70 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto mb-12 font-medium">
            We believe in creating pieces that speak for themselves. Heavyweight fabrics, meticulous construction, and a strict adherence to minimal, impactful design.
          </motion.p>
          <motion.div {...fadeUp}>
            <Link href="/about" className="text-[10px] md:text-xs font-black tracking-[0.2em] uppercase text-foreground border border-foreground/20 px-6 md:px-8 py-3 md:py-4 hover:bg-foreground hover:text-background transition-all rounded-sm">
              Read Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ NEW ARRIVALS ══ */}
      <section className="py-12 md:py-32 px-5 lg:px-16 max-w-[1600px] mx-auto">
        <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-4">
          <div>
            <h2 className="text-2xl md:text-5xl font-black font-syncopate uppercase tracking-tight mb-1">New Drops</h2>
            <p className="text-foreground/60 text-[10px] md:text-sm tracking-widest uppercase">Latest Additions</p>
          </div>
          <Link href="/shop?filter=new" className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-foreground/80 hover:text-foreground transition-colors border-b border-foreground/20 pb-1 w-fit">
            Shop New
          </Link>
        </motion.div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={setSelectedProduct} isAdmin={isAdmin} />
          ))}
        </div>
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
