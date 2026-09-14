"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { CheckCircle2, Truck, Shield, ArrowLeft, Tag, Ticket, ArrowRight, ChevronDown, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type PaymentMethod = 'gateway';

export const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"
] as const;

const PAYMENT_OPTIONS = [
    { 
        id: 'gateway', 
        label: 'Online Payment Gateway (Razorpay)', 
        sub: 'UPI (GPay, PhonePe, Paytm, QR), Cards, NetBanking & Wallets',
        badge: 'Instant & Secure' 
    },
] as const;

export default function CheckoutPage() {
    const { 
        cart, totalPrice, clearCart, 
        appliedCoupon, applyCoupon, removeCoupon, discountedTotal,
        checkoutItems, checkoutTotal, checkoutDiscountedTotal,
        buyNowItem, clearBuyNowItem, isInitialized
    } = useCart();
    const { data: session, status } = useSession();
    const router = useRouter();

    const [step, setStep] = useState<'details' | 'success'>('details');
    const [isLoading, setIsLoading] = useState(false);
    const [couponInput, setCouponInput] = useState('');
    const [form, setForm] = useState<Record<string, string>>({
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        city: '', 
        state: '', 
        pincode: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gateway');
    const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

    const updateFormField = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Keep only digits and optional leading +
        let val = e.target.value.replace(/[^\d+]/g, '');
        if (val.startsWith('+')) {
            val = '+' + val.slice(1).replace(/\+/g, '').slice(0, 12);
        } else {
            val = val.slice(0, 12);
        }
        updateFormField('phone', val);
    };

    const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
        updateFormField('pincode', val);
    };

    const shipping = (checkoutTotal >= 999 || (buyNowItem && buyNowItem.price * buyNowItem.quantity >= 999)) ? 0 : 69;
    const finalTotal = Math.max((checkoutDiscountedTotal || 0) + (checkoutItems.length > 0 ? shipping : 0), 0);

    // Pre-fill user profile info if logged in
    useEffect(() => {
        if (session?.user) {
            setForm(prev => ({
                ...prev,
                name: prev.name || session.user?.name || '',
                email: prev.email || session.user?.email || '',
            }));
        }
    }, [session]);

    const handlePayment = async () => {
        if (!session) {
            alert("Please log in to checkout.");
            router.push("/login");
            return;
        }

        // Strict field validation
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = "Full name is required";
        }
        if (!form.email.trim()) {
            newErrors.email = "Email address is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            newErrors.email = "Please enter a valid email address";
        }

        const phoneDigits = form.phone.replace(/\D/g, '');
        if (!form.phone.trim()) {
            newErrors.phone = "Phone number is required (12 digits)";
        } else if (phoneDigits.length !== 12) {
            newErrors.phone = `Phone number must be exactly 12 digits (currently ${phoneDigits.length}/12 digits)`;
        }

        if (!form.address.trim()) {
            newErrors.address = "Delivery address is required";
        }

        if (!form.city.trim()) {
            newErrors.city = "City is required";
        }

        if (!form.state.trim()) {
            newErrors.state = "Please select your State";
        }

        const pincodeDigits = form.pincode.replace(/\D/g, '');
        if (!form.pincode.trim()) {
            newErrors.pincode = "PIN code is required (6 digits)";
        } else if (pincodeDigits.length !== 6) {
            newErrors.pincode = `PIN code must be exactly 6 digits (currently ${pincodeDigits.length}/6 digits)`;
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstKey = Object.keys(newErrors)[0];
            alert(newErrors[firstKey]);
            return;
        }

        setIsLoading(true);

        try {
            // 1. Create order on backend
            const orderRes = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: checkoutItems,
                    shippingAddress: {
                        fullName: form.name.trim(),
                        email: form.email.trim(),
                        phone: form.phone.trim(),
                        address: form.address.trim(),
                        city: form.city.trim(),
                        state: form.state.trim(),
                        zipCode: form.pincode.trim(),
                        country: "India"
                    },
                    subtotal: checkoutTotal,
                    shippingPrice: shipping,
                    totalPrice: finalTotal,
                    discount: checkoutTotal - checkoutDiscountedTotal,
                    coupon: appliedCoupon?.code,
                    paymentMethod: paymentMethod, // Send selected method
                }),
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                alert(orderData.message || "Failed to create order");
                setIsLoading(false);
                return;
            }

            // If order was 100% covered by coupon/promotion, skip gateway
            if (orderData.isFree) {
                setSuccessOrderId(orderData.orderId);
                if (buyNowItem) {
                    clearBuyNowItem();
                } else {
                    clearCart();
                }
                setStep('success');
                setIsLoading(false);
                return;
            }

            // 2. Open Razorpay Payment Gateway Widget
            if (typeof (window as any).Razorpay === 'undefined') {
                alert("Payment gateway is initializing. Please wait a moment and try again.");
                setIsLoading(false);
                return;
            }

            const razorpayKey = orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
            if (!razorpayKey) {
                alert("Payment gateway configuration error. Please contact store support.");
                setIsLoading(false);
                return;
            }

            const options = {
                key: razorpayKey, 
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "CORASE",
                description: "DRIP, DETAIL, DOMINANCE",
                order_id: orderData.razorpayOrderId,
                modal: {
                    ondismiss: function () {
                        setIsLoading(false);
                    },
                },
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch("/api/orders/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: orderData.orderId,
                                isBuyNow: Boolean(buyNowItem),
                            }),
                        });

                        if (verifyRes.ok) {
                            setSuccessOrderId(orderData.orderId);
                            if (buyNowItem) {
                                clearBuyNowItem();
                            } else {
                                clearCart();
                            }
                            setStep('success');
                        } else {
                            const errData = await verifyRes.json().catch(() => ({}));
                            alert(errData.message || "Payment verification failed. Please contact support.");
                        }
                    } catch (verifyErr) {
                        console.error("Verification network error:", verifyErr);
                        alert("Network error during payment verification. Please contact support.");
                    } finally {
                        setIsLoading(false);
                    }
                },
                prefill: {
                    name: form.name,
                    email: form.email,
                    contact: form.phone,
                },
                theme: {
                    color: "#000000",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert(`Payment Failed: ${response.error?.description || "Transaction cancelled or failed"}`);
                setIsLoading(false);
            });
            rzp.open();

        } catch (error) {
            console.error("Checkout error:", error);
            alert("Something went wrong during checkout.");
            setIsLoading(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 text-center">
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 22 }}
                    className="max-w-sm w-full"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, type: 'spring', damping: 16 }}
                        className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto mb-8"
                    >
                        <CheckCircle2 size={40} className="text-emerald-400" />
                    </motion.div>

                    <h1 className="text-3xl font-black font-syncopate tracking-tight text-brand-red uppercase mb-2">
                        Order Placed!
                    </h1>
                    <p className="text-foreground/60 font-medium text-sm mb-1">Your order has been confirmed.</p>
                    <p className="text-foreground font-black text-xs tracking-[0.2em] uppercase mb-8">
                        #{successOrderId?.slice(-6) || "Pending"}
                    </p>

                    <div className="flex items-center justify-center gap-2 text-foreground/40 text-sm font-medium mb-10">
                        <Truck size={15} className="text-foreground" />
                        <span>Estimated delivery: 3–5 business days</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/account"
                            className="bg-foreground text-background px-7 py-3 rounded-full font-black font-syncopate text-xs tracking-widest uppercase hover:bg-foreground/90 transition-all"
                        >
                            Track Order
                        </Link>
                        <Link
                            href="/"
                            className="bg-foreground/[0.06] border border-foreground/10 text-foreground px-7 py-3 rounded-full font-semibold text-sm hover:bg-foreground/10 transition-all"
                        >
                            Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Loading state while cart and session initialize
    if (!isInitialized || status === 'loading') {
        return (
            <div className="bg-background min-h-screen pt-32 pb-24 text-foreground flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold tracking-[0.2em] text-foreground/40 uppercase font-syncopate">Loading Checkout...</p>
                </div>
            </div>
        );
    }

    // Empty bag view: instead of an abrupt and confusing silent redirect to /shop, show a clear, friendly empty bag screen
    if (checkoutItems.length === 0) {
        return (
            <div className="bg-background min-h-screen pt-32 pb-24 text-foreground flex items-center justify-center px-4">
                <div className="max-w-md mx-auto text-center">
                    <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={28} className="text-foreground/40" />
                    </div>
                    <h1 className="text-xl font-black font-syncopate uppercase tracking-wider mb-2">Your Bag is Empty</h1>
                    <p className="text-xs text-foreground/50 mb-8 leading-relaxed">
                        Looks like you haven&apos;t added any items to your bag yet. Browse our collections and find your style.
                    </p>
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-3 bg-foreground text-background font-black text-xs tracking-[0.2em] uppercase px-8 py-4 rounded-xl hover:bg-foreground/80 transition-all cursor-pointer"
                    >
                        <span>Explore Shop</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pt-28 pb-20 px-5 lg:px-10">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <Link href="/shop" className="text-foreground/40 hover:text-foreground transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-black font-syncopate tracking-tight text-brand-red uppercase">
                        Checkout
                    </h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* ── Left: Forms ── */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* Delivery */}
                        <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-[2rem] p-8 shadow-2xl">
                            <h2 className="text-lg font-black font-syncopate uppercase tracking-tight mb-8 flex items-center gap-4 text-foreground">
                                <span className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.1)]">1</span>
                                Delivery Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* 1. Full Name */}
                                <div className="sm:col-span-2">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-[0.2em]">
                                            Full Name <span className="text-brand-red">*</span>
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => updateFormField('name', e.target.value)}
                                        placeholder="Arjun Mehta"
                                        className={`w-full bg-foreground/[0.02] border ${errors.name ? 'border-red-500/60 bg-red-500/[0.03]' : 'border-foreground/[0.1]'} text-foreground placeholder-foreground/20 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.04] transition-all`}
                                    />
                                    {errors.name && (
                                        <p className="text-[10px] font-bold text-red-400 tracking-wider mt-1.5">{errors.name}</p>
                                    )}
                                </div>

                                {/* 2. Email Address */}
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-[0.2em]">
                                            Email Address <span className="text-brand-red">*</span>
                                        </label>
                                    </div>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => updateFormField('email', e.target.value)}
                                        placeholder="you@example.com"
                                        className={`w-full bg-foreground/[0.02] border ${errors.email ? 'border-red-500/60 bg-red-500/[0.03]' : 'border-foreground/[0.1]'} text-foreground placeholder-foreground/20 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.04] transition-all`}
                                    />
                                    {errors.email && (
                                        <p className="text-[10px] font-bold text-red-400 tracking-wider mt-1.5">{errors.email}</p>
                                    )}
                                </div>

                                {/* 3. Phone Number (12 Digits) */}
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-[0.2em]">
                                            Phone Number <span className="text-brand-red">*</span>
                                        </label>
                                        <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                            form.phone.replace(/\D/g, '').length === 12
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-foreground/5 text-foreground/40'
                                        }`}>
                                            {form.phone.replace(/\D/g, '').length}/12 Digits
                                        </span>
                                    </div>
                                    <input
                                        type="tel"
                                        maxLength={13}
                                        value={form.phone}
                                        onChange={handlePhoneChange}
                                        placeholder="919876543210"
                                        className={`w-full bg-foreground/[0.02] border ${errors.phone ? 'border-red-500/60 bg-red-500/[0.03]' : 'border-foreground/[0.1]'} text-foreground placeholder-foreground/20 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.04] transition-all`}
                                    />
                                    {errors.phone ? (
                                        <p className="text-[10px] font-bold text-red-400 tracking-wider mt-1.5">{errors.phone}</p>
                                    ) : (
                                        <p className="text-[10px] text-foreground/40 font-medium mt-1.5">Include 91 country code (12 digits total)</p>
                                    )}
                                </div>

                                {/* 4. Delivery Address */}
                                <div className="sm:col-span-2">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-[0.2em]">
                                            Delivery Address <span className="text-brand-red">*</span>
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={form.address}
                                        onChange={e => updateFormField('address', e.target.value)}
                                        placeholder="Flat/House No., Building, Street Name, Landmark"
                                        className={`w-full bg-foreground/[0.02] border ${errors.address ? 'border-red-500/60 bg-red-500/[0.03]' : 'border-foreground/[0.1]'} text-foreground placeholder-foreground/20 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.04] transition-all`}
                                    />
                                    {errors.address && (
                                        <p className="text-[10px] font-bold text-red-400 tracking-wider mt-1.5">{errors.address}</p>
                                    )}
                                </div>

                                {/* 5. City */}
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-[0.2em]">
                                            City <span className="text-brand-red">*</span>
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={form.city}
                                        onChange={e => updateFormField('city', e.target.value)}
                                        placeholder="Bangalore"
                                        className={`w-full bg-foreground/[0.02] border ${errors.city ? 'border-red-500/60 bg-red-500/[0.03]' : 'border-foreground/[0.1]'} text-foreground placeholder-foreground/20 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.04] transition-all`}
                                    />
                                    {errors.city && (
                                        <p className="text-[10px] font-bold text-red-400 tracking-wider mt-1.5">{errors.city}</p>
                                    )}
                                </div>

                                {/* 6. State (Dropdown of all States & UTs in India) */}
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-[0.2em]">
                                            State / UT <span className="text-brand-red">*</span>
                                        </label>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={form.state}
                                            onChange={e => updateFormField('state', e.target.value)}
                                            className={`w-full appearance-none bg-background text-foreground border ${errors.state ? 'border-red-500/60 bg-red-500/[0.03]' : 'border-foreground/[0.1]'} rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-foreground/40 transition-all cursor-pointer`}
                                        >
                                            <option value="" disabled className="bg-background text-foreground/40">Select State *</option>
                                            {INDIAN_STATES.map(s => (
                                                <option key={s} value={s} className="bg-background text-foreground py-2 font-medium">
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none" />
                                    </div>
                                    {errors.state && (
                                        <p className="text-[10px] font-bold text-red-400 tracking-wider mt-1.5">{errors.state}</p>
                                    )}
                                </div>

                                {/* 7. PIN Code (6 Digits) */}
                                <div className="sm:col-span-2">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="block text-[11px] font-black text-foreground/70 uppercase tracking-[0.2em]">
                                            PIN Code <span className="text-brand-red">*</span>
                                        </label>
                                        <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                            form.pincode.replace(/\D/g, '').length === 6
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-foreground/5 text-foreground/40'
                                        }`}>
                                            {form.pincode.replace(/\D/g, '').length}/6 Digits
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={form.pincode}
                                        onChange={handlePincodeChange}
                                        placeholder="560001"
                                        className={`w-full bg-foreground/[0.02] border ${errors.pincode ? 'border-red-500/60 bg-red-500/[0.03]' : 'border-foreground/[0.1]'} text-foreground placeholder-foreground/20 rounded-2xl px-5 py-4 text-sm font-bold focus:outline-none focus:border-foreground/40 focus:bg-foreground/[0.04] transition-all`}
                                    />
                                    {errors.pincode ? (
                                        <p className="text-[10px] font-bold text-red-400 tracking-wider mt-1.5">{errors.pincode}</p>
                                    ) : (
                                        <p className="text-[10px] text-foreground/40 font-medium mt-1.5">Enter 6-digit postal code</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-[2rem] p-8 shadow-2xl">
                            <h2 className="text-lg font-black font-syncopate uppercase tracking-tight mb-8 flex items-center gap-4 text-foreground">
                                <span className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 shadow-[0_0_20px_rgba(0,0,0,0.1)]">2</span>
                                Payment Method
                            </h2>
                            <div className="space-y-4">
                                {PAYMENT_OPTIONS.map(option => (
                                    <div
                                        key={option.id}
                                        className="w-full p-5 rounded-2xl border border-foreground/20 bg-foreground/[0.04] transition-all text-left space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-5 h-5 rounded-full border-2 border-foreground bg-foreground flex items-center justify-center flex-shrink-0">
                                                    <div className="w-2 h-2 rounded-full bg-background" />
                                                </div>
                                                <div>
                                                    <p className="font-black font-syncopate text-xs uppercase tracking-wider text-foreground">{option.label}</p>
                                                    <p className="text-xs text-foreground/60 font-medium mt-0.5">{option.sub}</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap">
                                                Instant
                                            </span>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-foreground/[0.08]">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-foreground/40 mr-1">Accepted:</span>
                                            <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-[9px] font-bold text-foreground/80">UPI / QR</span>
                                            <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-[9px] font-bold text-foreground/80">Google Pay</span>
                                            <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-[9px] font-bold text-foreground/80">PhonePe</span>
                                            <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-[9px] font-bold text-foreground/80">Paytm</span>
                                            <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-[9px] font-bold text-foreground/80">Cards (Debit / Credit)</span>
                                            <span className="px-2 py-0.5 rounded-md bg-foreground/5 border border-foreground/10 text-[9px] font-bold text-foreground/80">NetBanking</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security note */}
                        <div className="flex items-center gap-3 text-foreground/40 text-xs font-medium bg-foreground/[0.02] rounded-xl p-4 border border-foreground/[0.05]">
                            <Shield size={15} className="text-emerald-500 flex-shrink-0" />
                            <span>Your payment info is encrypted and secure. We never store card details.</span>
                        </div>
                    </div>

                    {/* ── Right: Summary ── */}
                    <div className="lg:col-span-2">
                        <div className="bg-foreground/[0.03] border border-foreground/[0.08] rounded-2xl p-5 sticky top-24">
                            <h2 className="font-black font-syncopate text-sm uppercase tracking-tight mb-5 text-foreground">
                                Order Summary
                            </h2>

                            {/* Cart items */}
                            <div className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
                                {checkoutItems.length === 0 ? (
                                    <p className="text-white/25 text-sm font-medium text-center py-6">Your cart is empty</p>
                                ) : checkoutItems.map(item => (
                                    <div key={`${item.productId}-${item.selectedSize}`} className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 bg-foreground/[0.04] rounded-lg overflow-hidden flex-shrink-0">
                                            <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill sizes="48px" className="object-contain p-1" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                                            <p className="text-[10px] text-foreground/60 font-medium">Size: {item.selectedSize} × {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-bold text-foreground flex-shrink-0">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Coupon */}
                            <div className="space-y-3 mb-5">
                                {!appliedCoupon ? (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
                                            <input
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                placeholder="Coupon code"
                                                className="w-full bg-foreground/[0.04] border border-foreground/[0.1] text-foreground placeholder-foreground/20 rounded-xl pl-9 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:border-foreground/40 transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                const res = await applyCoupon(couponInput);
                                                if (!res.success) alert(res.message);
                                                else setCouponInput('');
                                            }}
                                            className="bg-foreground text-background px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-foreground/90 transition-all"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Ticket size={14} className="text-emerald-400" />
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">{appliedCoupon.code}</p>
                                                <p className="text-[8px] text-emerald-400/60 uppercase">Applied</p>
                                            </div>
                                        </div>
                                        <button onClick={removeCoupon} className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:underline">
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 border-t border-foreground/[0.06] pt-5 mb-6">
                                <div className="flex justify-between text-xs text-foreground/60 font-medium">
                                    <span>Subtotal</span>
                                    <span>₹{checkoutTotal}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-xs text-emerald-500 font-bold">
                                        <span>Discount</span>
                                        <span>- ₹{checkoutTotal - checkoutDiscountedTotal}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-foreground/60 font-medium">
                                    <span>Shipping</span>
                                    <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                                </div>
                                <div className="flex justify-between text-base font-black font-syncopate pt-3 border-t border-foreground/[0.06] text-foreground">
                                    <span>Total</span>
                                    <span>₹{finalTotal}</span>
                                </div>
                            </div>

                            {shipping === 0 && checkoutItems.length > 0 && (
                                <p className="text-emerald-400 text-xs font-bold text-center bg-emerald-500/10 rounded-lg py-2 mb-4">
                                    🎉 You qualify for free shipping!
                                </p>
                            )}

                            <button
                                onClick={handlePayment}
                                disabled={checkoutItems.length === 0 || isLoading}
                                className="w-full bg-foreground text-background py-5 rounded-2xl font-black font-syncopate text-[10px] tracking-[0.4em] uppercase hover:bg-foreground/90 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                ) : (
                                    <>Place Order <ArrowRight size={14} /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

