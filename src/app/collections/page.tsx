"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/context/CartContext';
import Image from 'next/image';
import ProductModal from '@/components/products/ProductModal';
import { Plus, Star, Heart, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';

const cld = (name: string) =>
    `https://res.cloudinary.com/dg0juhz7e/image/upload/f_auto,q_auto,w_800/${name}`;

const FALLBACK: Product[] = [
    { id:'1', category:'Graphic', name:'CYBERPUNK MECHA TEE', price:1499, image:cld('corase/products/cyber-tee'), description:'Jet black oversized tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['S','M','L','XL'], isNewDrop:true, isFeatured:true },
    { id:'2', category:'Graphic', name:'ACID WASH GOTHIC TEE', price:1399, image:cld('corase/products/acid-tee'), description:'Acid wash gothic tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['M','L','XL'], isNewDrop:true, isFeatured:true },
    { id:'3', category:'Oversized', name:'VOID TEE', price:1299, image:cld('corase/products/void-tee'), description:'Minimal void tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['S','M','L','XL'], isNewDrop:false, isFeatured:false },
    { id:'4', category:'Graphic', name:'NEON OVERLOAD', price:1499, image:cld('corase/products/neon-tee'), description:'Neon cyberpunk tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['M','L','XL'], isNewDrop:true, isFeatured:false },
    { id:'5', category:'Oversized', name:'COLLECTIONS 01', price:1199, image:cld('corase/products/archive-tee'), description:'Archive distressed tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['S','M','L'], isNewDrop:true, isFeatured:false },
    { id:'6', category:'Oversized', name:'LINEAR LOGO', price:1099, image:cld('corase/products/neon-tee'), description:'Linear logo tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['S','M','L','XL'], isNewDrop:false, isFeatured:false },
    { id:'7', category:'Graphic', name:'GHOST MASK', price:1399, image:cld('corase/products/void-tee'), description:'Ghost mask tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['L','XL'], isNewDrop:false, isFeatured:false },
    { id:'8', category:'Graphic', name:'NEO TOKYO STREET TEE', price:1299, image:cld('corase/products/archive-tee'), description:'Neo tokyo tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['S','M','L'], isNewDrop:false, isFeatured:false },
    { id:'9', category:'Acid Wash', name:'VINTAGE WASH 02', price:1299, image:cld('corase/products/acid-tee'), description:'Vintage wash tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['M','L','XL'], isNewDrop:false, isFeatured:false },
    { id:'10', category:'Oversized', name:'ESSENTIAL BLANK', price:999, image:cld('corase/products/cyber-tee'), description:'Essential blank tee.', color:'#ffffff', variants:[{size:'M',stock:10}], sizes:['S','M','L','XL'], isNewDrop:false, isFeatured:false },
];

const CollectionsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dbProducts, setDbProducts] = useState<Product[]>(FALLBACK);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toggleWishlist, isWishlisted } = useWishlist();

    useEffect(() => {
        async function fetchProducts() {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 6000);
                const res = await fetch('/api/products', { signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) setDbProducts(data);
                // else keep FALLBACK
            } catch {
                // silently fail — spinner shows below
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const filteredProducts = dbProducts.filter(p => 
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-background min-h-screen pt-40 pb-32 px-6 lg:px-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-foreground rounded-full blur-[200px] opacity-5 pointer-events-none" />

            <div className="max-w-screen-2xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-20">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center space-x-4 mb-5">
                        <span className="w-12 h-px bg-foreground" />
                        <span className="text-xs font-black tracking-[0.4em] text-brand-red uppercase">CORASE 2026</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-bold font-syncopate tracking-tighter text-brand-red !leading-[1.1] uppercase italic overflow-visible"
                    >
                        ALL<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/80 to-foreground/30 inline-block py-1 pr-3">COLLECTIONS</span>
                    </motion.h1>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-5">
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} className="text-foreground/30 font-bold tracking-[0.2em] uppercase text-xs max-w-md">
                            {filteredProducts.length} designs. DRIP, DETAIL, DOMINANCE. Limited stock.
                        </motion.p>
                        
                        {/* Search Bar */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ duration: 0.7, delay: 0.4 }}
                            className="relative group w-full md:w-80"
                        >
                            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-foreground/20 transition-colors group-focus-within:text-foreground" size={14} />
                            <input 
                                type="text" 
                                placeholder="SEARCH COLLECTION..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none pl-6 pr-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none placeholder:text-foreground/20 transition-all"
                            />
                            <div className={cn(
                                "absolute bottom-0 left-0 h-[1px] bg-foreground/10 transition-all duration-700",
                                searchTerm ? "w-full bg-foreground" : "w-0 group-focus-within:w-full"
                            )} />
                        </motion.div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                    {filteredProducts.map((product, index) => {
                        const wishlisted = isWishlisted(product.id);
                        return (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className="group cursor-pointer"
                                onMouseEnter={() => setHoveredId(product.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                <div
                                    className={cn(
                                        "relative aspect-square bg-foreground/5 rounded-2xl overflow-hidden mb-3 border transition-all duration-500",
                                        hoveredId === product.id
                                            ? "border-foreground/40 shadow-[0_20px_50px_rgba(255,159,67,0.12)]"
                                            : "border-foreground/5"
                                    )}
                                    onClick={() => setSelectedProduct(product)}
                                >
                                    {/* Badges */}
                                    {product.status && product.status !== "none" && product.status.trim() !== "" && (
                                        <div className={cn(
                                            "absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full border backdrop-blur-md shadow-2xl transition-all duration-500",
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
                                            <span className="text-[7px] font-black tracking-[0.2em] uppercase">
                                                {product.status}
                                            </span>
                                        </div>
                                    )}

                                    {/* Wishlist heart */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleWishlist({ productId: product.id, name: product.name, price: product.price, image: product.image }); }}
                                        className={cn(
                                            "absolute bottom-2.5 right-2.5 z-10 p-2 rounded-full transition-all duration-300",
                                            wishlisted ? "bg-red-500 text-white" : "bg-foreground/50 text-background/50 opacity-0 group-hover:opacity-100 hover:text-red-400"
                                        )}
                                    >
                                        <Heart size={13} fill={wishlisted ? "currentColor" : "none"} />
                                    </button>

                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        className={cn(
                                            "object-contain p-5 transition-all duration-500",
                                            hoveredId === product.id ? "scale-108" : "scale-100"
                                        )}
                                        loading={index < 6 ? "eager" : "lazy"}
                                    />

                                    {/* Quick add */}
                                    <div className={cn(
                                        "absolute inset-x-0 bottom-8 flex justify-center transition-all duration-400",
                                        hoveredId === product.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                                    )}>
                                        <div className="bg-foreground text-background p-2.5 rounded-full shadow-lg">
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="px-0.5">
                                    <h3 className={cn(
                                        "text-xs sm:text-sm font-semibold font-sans tracking-normal leading-tight mb-1 transition-colors duration-200",
                                        hoveredId === product.id ? "text-foreground" : "text-foreground/75"
                                    )}>
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-foreground/60 font-bold">₹{product.price}</p>
                                        <div className="flex items-center space-x-0.5">
                                            {[1,2,3,4,5].map(s => (
                                                <Star key={s} size={9} fill={s <= 4 ? "currentColor" : "none"} className={s <= 4 ? "text-foreground" : "text-foreground/20"} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {!isLoading && filteredProducts.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="py-40 text-center"
                    >
                        <p className="text-foreground/20 font-black tracking-[0.3em] text-xs uppercase mb-4">
                            No products match your search
                        </p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-[10px] font-black tracking-widest uppercase text-foreground border border-foreground/10 px-8 py-3 hover:bg-foreground hover:text-background transition-all rounded-full"
                        >
                            Reset Search
                        </button>
                    </motion.div>
                )}

                {isLoading && (
                    <div className="py-40 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-5" />
                        <p className="text-foreground/20 font-black tracking-[0.5em] text-xs uppercase">Loading Collection...</p>
                    </div>
                )}

            </div>

            <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        </div>
    );
};

export default CollectionsPage;
