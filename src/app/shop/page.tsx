"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { SlidersHorizontal, ChevronDown, X, Heart, Search, Save, ImageIcon, Package } from "lucide-react";
import { Product } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductModal from "@/components/products/ProductModal";
import ProductCard from "@/components/products/ProductCard";
import ImageUpload from "@/components/admin/ImageUpload";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { getAvailableSizesByCategory, filterSizesByCategory } from "@/lib/sizeUtils";

const CATEGORIES = ["All", "Tshirts", "Hoodies", "Bottoms", "Outerwear", "Accessories"];
const SIZES = ["S", "M", "L", "XL", "XXL"];
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low → High", value: "price-asc" },
  { label: "Price: High → Low", value: "price-desc" },
  { label: "Name: A → Z", value: "name-asc" },
];

function ShopPageInner() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSize, setActiveSize] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlist();

  // Keep searchTerm and filter in sync when URL param changes
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchTerm(q);

    const filter = searchParams.get("filter");
    if (filter) {
      if (filter === "new") {
        setSortBy("newest");
      } else {
        setSearchTerm(filter);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });
      if (res.ok) {
        const updated = await res.json();
        setAllProducts(allProducts.map(p => p.id === updated.id ? { ...p, ...editingProduct, name: editingProduct.name, image: editingProduct.image } : p));
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("Failed to update product:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = useMemo(() => {
    let result = [...allProducts];

    // Category Filter
    if (activeCategory !== "All") {
      result = result.filter(
        (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    // Size Filter
    if (activeSize) {
      result = result.filter((p) => p.sizes?.includes(activeSize));
    }

    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerSearch) ||
          p.category?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        result.sort((a, b) => {
          const aNew = a.isNewDrop || (a.status && (a.status.toLowerCase().includes("new") || a.status.toLowerCase().includes("latest")));
          const bNew = b.isNewDrop || (b.status && (b.status.toLowerCase().includes("new") || b.status.toLowerCase().includes("latest")));
          return (bNew ? 1 : 0) - (aNew ? 1 : 0);
        });
    }

    return result;
  }, [allProducts, activeCategory, activeSize, sortBy, searchTerm]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center pt-28">
        <div className="text-brand-red font-syncopate text-xl animate-pulse uppercase">Corase Shop</div>
      </div>
    );
  }

  const activeFilterCount =
    (activeCategory !== "All" ? 1 : 0) + (activeSize ? 1 : 0);

  return (
    <div className="bg-background min-h-screen text-foreground pt-28 pb-32">
      <div className="max-w-[1600px] mx-auto px-5 lg:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 md:mb-12"
        >
          <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-foreground/70 mb-2 md:mb-3">
            {filtered.length} Products
          </p>
          <h1 className="text-brand-red text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black font-syncopate tracking-tighter uppercase">
            Shop
          </h1>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between border-b border-foreground/10 pb-5 mb-10 gap-4"
        >
          <div className="flex items-center gap-8 w-full md:w-auto">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-foreground/60 hover:text-foreground transition-colors shrink-0"
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-foreground text-background text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Search Input */}
            <div className="relative flex-1 md:w-80 group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-foreground/30 transition-colors group-focus-within:text-foreground" size={14} />
              <input 
                type="text" 
                placeholder="SEARCH PRODUCTS..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none pl-6 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none placeholder:text-foreground/20 transition-all"
              />
              <div className={`absolute bottom-0 left-0 h-[1px] bg-foreground/10 transition-all duration-500 ${searchTerm ? 'w-full bg-foreground' : 'w-0 group-focus-within:w-full'}`} />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-foreground/80 hover:text-foreground transition-colors"
            >
              Sort by: {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
              <ChevronDown
                size={14}
                className={`transition-transform ${showSort ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-8 bg-background border border-foreground/10 rounded-lg overflow-hidden z-30 min-w-[180px] shadow-xl"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowSort(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-xs font-bold tracking-wider uppercase transition-colors ${
                        sortBy === opt.value
                          ? "bg-foreground text-background"
                          : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-10"
            >
              <div className="bg-background border border-foreground/[0.06] rounded-xl p-5 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                  {/* Category */}
                  <div className="flex-1">
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50 mb-4">
                      Category
                    </p>
                    <div className="flex flex-nowrap overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-2 px-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black tracking-widest uppercase border transition-all ${
                            activeCategory === cat
                              ? "bg-foreground text-background border-foreground"
                              : "border-foreground/10 text-foreground/50 hover:border-foreground/30 hover:text-foreground"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size */}
                  <div className="flex-1">
                    <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-foreground/50 mb-4">
                      Size
                    </p>
                    <div className="flex flex-nowrap overflow-x-auto pb-2 gap-2 scrollbar-hide -mx-2 px-2">
                      {getAvailableSizesByCategory(activeCategory).map((size) => (
                        <button
                          key={size}
                          onClick={() =>
                            setActiveSize(activeSize === size ? null : size)
                          }
                          className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-[10px] font-black border transition-all ${
                            activeSize === size
                              ? "bg-foreground text-background border-foreground"
                              : "border-foreground/10 text-foreground/50 hover:border-foreground/30 hover:text-foreground"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setActiveCategory("All");
                      setActiveSize(null);
                    }}
                    className="flex items-center gap-1 mt-6 text-xs font-bold tracking-wider uppercase text-foreground/40 hover:text-foreground transition-colors"
                  >
                    <X size={12} /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + activeSize + sortBy}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-14 md:gap-x-8 md:gap-y-16"
          >
            {filtered.map((product, index) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelect={setSelectedProduct} 
                isAdmin={isAdmin} 
                onEdit={setEditingProduct} 
                priority={index < 8}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-40 text-center">
            <p className="text-foreground/20 font-bold tracking-[0.3em] text-xs uppercase mb-4">
              No products match your filters
            </p>
            <button
              onClick={() => {
                setActiveCategory("All");
                setActiveSize(null);
              }}
              className="text-xs font-bold tracking-wider uppercase text-foreground border border-foreground/20 px-6 py-3 hover:bg-foreground hover:text-background transition-all rounded-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Product Edit Modal (In-place) */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm"
              onClick={() => setEditingProduct(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-background border border-foreground/10 rounded-2xl overflow-hidden shadow-2xl glass-morphism"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-foreground/10 bg-foreground/5">
                <h3 className="text-sm font-black font-syncopate uppercase tracking-tight">Edit Product</h3>
                <button onClick={() => setEditingProduct(null)} className="text-foreground/40 hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdateProduct} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Name</label>
                    <input 
                      type="text" value={editingProduct.name} 
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:border-foreground focus:outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Price</label>
                      <input 
                        type="number" value={editingProduct.price} 
                        onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:border-foreground focus:outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Category</label>
                      <input 
                        type="text" value={editingProduct.category} 
                        onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:border-foreground focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
                      <Package size={12} /> Stock by Size
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {filterSizesByCategory(
                        editingProduct.variants?.map((v: any) => v.size) || [],
                        editingProduct.category
                      ).map((size: string) => {
                        const v = editingProduct.variants.find((variant: any) => variant.size === size);
                        const idx = editingProduct.variants.indexOf(v);
                        return (
                          <div key={size} className="bg-foreground/5 border border-foreground/10 p-2 rounded-lg text-center">
                            <p className="text-[9px] font-black text-foreground/30 uppercase mb-1">{size}</p>
                            <input 
                              type="number" value={v.stock} 
                              onChange={(e) => {
                                const newVariants = [...editingProduct.variants];
                                newVariants[idx].stock = Number(e.target.value);
                                setEditingProduct({...editingProduct, variants: newVariants});
                              }}
                              className="w-full bg-transparent text-center text-foreground font-bold text-xs focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <ImageUpload 
                    label="Product Image"
                    currentImage={editingProduct.image}
                    onUploadComplete={(url) => setEditingProduct({...editingProduct, image: url})}
                  />
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 flex items-center gap-2">
                      <ImageIcon size={12} /> Or Image URL
                    </label>
                    <input 
                      type="text" value={editingProduct.image} 
                      onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:border-foreground focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Product Status</label>
                    <input 
                      type="text" value={editingProduct.status === 'none' ? '' : editingProduct.status} 
                      onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value})}
                      placeholder="e.g. New Drop, Coming Soon"
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-lg px-4 py-2.5 text-foreground focus:border-foreground focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <button 
                    type="submit" disabled={isSaving}
                    className="flex-1 bg-foreground text-background py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  >
                    <Save size={14} /> {isSaving ? 'Updating...' : 'Save Product'}
                  </button>
                  <button 
                    type="button" onClick={() => setEditingProduct(null)}
                    className="flex-1 bg-foreground/5 text-foreground py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center pt-28">
        <div className="text-brand-red font-syncopate text-xl animate-pulse uppercase">Corase Shop</div>
      </div>
    }>
      <ShopPageInner />
    </Suspense>
  );
}
