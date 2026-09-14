"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Minus, Plus, ArrowRight, Ticket, Tag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const CartDrawer: React.FC = () => {
    const { 
        cart, isCartOpen, setIsOpen, removeFromCart, updateQuantity, 
        totalPrice, appliedCoupon, applyCoupon, removeCoupon, discountedTotal, clearBuyNowItem 
    } = useCart();

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-foreground/40 backdrop-blur-md z-[1000]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-[1001] shadow-2xl flex flex-col border-l border-foreground/5"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-foreground/5 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <ShoppingBag className="text-foreground" size={24} />
                                <h2 className="text-xl font-bold font-syncopate tracking-tighter text-foreground uppercase italic brand-glow">
                                    YOUR BAG
                                </h2>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-foreground/80 hover:text-foreground transition-colors">
                                <X size={28} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <ShoppingBag size={64} className="mb-4 text-foreground" />
                                    <p className="font-bold font-syncopate tracking-widest text-[10px] text-foreground uppercase">BAG IS EMPTY</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={`${item.productId}-${item.selectedSize}`} className="flex space-x-6 group">
                                        <div className="relative w-24 h-24 bg-foreground/5 rounded-2xl overflow-hidden flex-shrink-0 border border-foreground/5">
                                            <Image 
                                                src={item.image} 
                                                alt={item.name} 
                                                fill
                                                sizes="96px"
                                                className="object-contain p-2"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-xs font-bold font-syncopate text-foreground uppercase tracking-tight">{item.name}</h3>
                                                <button 
                                                    onClick={() => removeFromCart(item.productId, item.selectedSize)}
                                                    className="text-foreground/20 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] font-bold text-foreground/90 mb-3 uppercase tracking-widest">SIZE: {item.selectedSize} — ₹{item.price}</p>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-3 bg-foreground/5 px-3 py-1 rounded-full border border-foreground/5">
                                                    <button 
                                                        onClick={() => updateQuantity(item.productId, item.selectedSize, item.quantity - 1)}
                                                        className="text-foreground/40 hover:text-foreground"
                                                    ><Minus size={10} /></button>
                                                    <span className="text-[10px] font-black text-foreground w-4 text-center">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => updateQuantity(item.productId, item.selectedSize, item.quantity + 1)}
                                                        className="text-foreground/40 hover:text-foreground"
                                                    ><Plus size={10} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                             <div className="p-8 bg-foreground/[0.02] border-t border-foreground/5 space-y-6">
                                  {/* Coupon Section */}
                                  <div className="space-y-3">
                                     <div className="flex items-center justify-between">
                                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                                             <Tag size={12} /> Promo Code
                                         </label>
                                         {appliedCoupon && (
                                             <button 
                                                 onClick={removeCoupon}
                                                 className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                             >
                                                 Remove
                                             </button>
                                         )}
                                     </div>
                                     
                                     {!appliedCoupon ? (
                                         <div className="flex gap-2">
                                             <input 
                                                 type="text"
                                                 placeholder="ENTER CODE..."
                                                 id="coupon-input"
                                                 className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground/30 transition-all"
                                             />
                                             <button 
                                                 onClick={async () => {
                                                     const input = document.getElementById('coupon-input') as HTMLInputElement;
                                                     if (!input.value) return;
                                                     const res = await applyCoupon(input.value);
                                                     if (!res.success) alert(res.message);
                                                 }}
                                                 className="bg-foreground text-background px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                                             >
                                                 Apply
                                             </button>
                                         </div>
                                     ) : (
                                         <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
                                             <div className="flex items-center gap-2">
                                                 <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                                     <Ticket size={14} className="text-emerald-500" />
                                                 </div>
                                                 <div>
                                                     <p className="text-xs font-black text-emerald-500 uppercase tracking-tight">{appliedCoupon.code}</p>
                                                     <p className="text-[9px] font-bold text-emerald-500/60 uppercase">Applied successfully</p>
                                                 </div>
                                             </div>
                                             <span className="text-xs font-black text-emerald-500">-₹{totalPrice - discountedTotal}</span>
                                         </div>
                                     )}
                                  </div>

                                  <div className="space-y-2 pt-2 border-t border-foreground/5">
                                     <div className="flex justify-between text-[10px] font-bold text-foreground/90 uppercase tracking-widest">
                                         <span>Subtotal</span>
                                         <span>₹{totalPrice}</span>
                                     </div>
                                     {appliedCoupon && (
                                         <div className="flex justify-between text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                             <span>Discount</span>
                                             <span>-₹{totalPrice - discountedTotal}</span>
                                         </div>
                                     )}
                                                                          {(() => {
                                         const shipping = cart.length === 0 ? 0 : (totalPrice >= 999 ? 0 : 69);
                                         return (
                                             <>
                                                 <div className="flex justify-between text-[10px] font-bold text-foreground/50 uppercase tracking-widest">
                                                     <span>Shipping</span>
                                                     <span>{shipping === 0 ? <span className="text-emerald-400">FREE</span> : `₹${shipping}`}</span>
                                                 </div>
                                                 <div className="flex justify-between text-xs font-bold font-syncopate text-foreground uppercase italic border-t border-foreground/5 pt-4">
                                                     <span>Total</span>
                                                     <span className="text-foreground font-black">₹{discountedTotal + shipping}</span>
                                                 </div>
                                             </>
                                         );
                                     })()}
                                 </div>
                                 <Link
                                     href="/checkout"
                                     onClick={() => {
                                         clearBuyNowItem();
                                         setIsOpen(false);
                                     }}
                                     className="w-full bg-foreground text-background py-5 rounded-full font-black tracking-[0.4em] text-[10px] hover:bg-foreground/80 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center space-x-2 group uppercase cursor-pointer"
                                 >
                                    <span>PROCEED TO CHECKOUT</span>
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
