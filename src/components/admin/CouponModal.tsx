"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Ticket } from 'lucide-react';

interface CouponModalProps {
    coupon?: any;
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function AdminCouponModal({ coupon, onClose, onSave }: CouponModalProps) {
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderAmount: 0,
        maxDiscount: 0,
        expiryDate: '',
        isActive: true,
        usageLimit: 0,
    });

    useEffect(() => {
        if (coupon) {
            setFormData({
                code: coupon.code || '',
                discountType: coupon.discountType || 'percentage',
                discountValue: coupon.discountValue || 0,
                minOrderAmount: coupon.minOrderAmount || 0,
                maxDiscount: coupon.maxDiscount || 0,
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
                isActive: coupon.isActive !== undefined ? coupon.isActive : true,
                usageLimit: coupon.usageLimit || 0,
            });
        }
    }, [coupon]);

        const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = {
            ...formData,
            expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
            maxDiscount: formData.maxDiscount > 0 ? formData.maxDiscount : undefined,
            usageLimit: formData.usageLimit > 0 ? formData.usageLimit : undefined,
        };
        onSave(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-background border border-foreground/10 w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            >
                <div className="p-6 border-b border-foreground/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-foreground/5 rounded-xl">
                            <Ticket size={20} className="text-foreground" />
                        </div>
                        <h2 className="text-lg font-black font-syncopate uppercase tracking-tight">
                            {coupon ? 'Edit Coupon' : 'New Coupon'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Coupon Code</label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-foreground/30 transition-all"
                                placeholder="WELCOME10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Discount Type</label>
                            <select
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-foreground/30 transition-all"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Discount Value</label>
                            <input
                                type="number"
                                required
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-foreground/30 transition-all"
                                placeholder="10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Min Order Amount (₹)</label>
                            <input
                                type="number"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-foreground/30 transition-all"
                                placeholder="499"
                            />
                        </div>
                        {formData.discountType === 'percentage' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Max Discount (₹)</label>
                                <input
                                    type="number"
                                    value={formData.maxDiscount}
                                    onChange={(e) => setFormData({ ...formData, maxDiscount: Number(e.target.value) })}
                                    className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-foreground/30 transition-all"
                                    placeholder="500"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Usage Limit</label>
                            <input
                                type="number"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-foreground/30 transition-all"
                                placeholder="100 (0 for unlimited)"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Expiry Date</label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-bold text-foreground focus:outline-none focus:border-foreground/30 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-4 pt-8">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative w-12 h-6 rounded-full bg-foreground/10 border border-foreground/10 transition-colors group-has-[:checked]:bg-emerald-500/20 group-has-[:checked]:border-emerald-500/20">
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-foreground transition-all ${formData.isActive ? 'translate-x-6 bg-emerald-500' : ''}`} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Active Status</span>
                            </label>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-foreground/5 bg-foreground/[0.02] flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-foreground/10 hover:bg-foreground/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-foreground text-background hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={14} /> Save Coupon
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
