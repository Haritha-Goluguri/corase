"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Shield, ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function AdminLoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email: form.email,
                password: form.password,
            });

            if (res?.error) {
                setError("Invalid admin credentials");
            } else {
                router.push('/admin');
                router.refresh();
            }
        } catch (err) {
            setError("Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError(null);
        try {
            await signIn('google', { callbackUrl: '/admin' });
        } catch (err) {
            setError("Google sign-in failed. Please try again.");
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-5 sm:px-6 py-10 relative overflow-hidden">
            {/* Grid background */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Top bar */}
                <div className="flex items-center justify-between mb-12">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-3xl font-black font-syncopate tracking-tight text-brand-red">CORASE</span>
                    </Link>
                    <span className="text-xs uppercase tracking-widest text-white/40 border border-white/10 px-3 py-1.5 rounded-full font-mono">
                        ADMIN
                    </span>
                </div>

                {/* Heading */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
                        Control Center
                    </h1>
                    <p className="text-sm text-white/40 font-medium">
                        Enter your credentials or sign in with your authorized admin Google account.
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold py-3.5 px-4 rounded-xl mb-6 text-center tracking-wide"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-white/60 uppercase tracking-widest">
                            Admin Email
                        </label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="admin@corase.in"
                                autoComplete="email"
                                className="w-full bg-white/[0.06] border border-white/[0.1] text-white text-base placeholder-white/20 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-white focus:bg-white/[0.09] transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-white/60 uppercase tracking-widest">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                placeholder="Enter admin password"
                                autoComplete="current-password"
                                className="w-full bg-white/[0.06] border border-white/[0.1] text-white text-base placeholder-white/20 rounded-2xl pl-12 pr-14 py-4 focus:outline-none focus:border-white focus:bg-white/[0.09] transition-all"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isGoogleLoading}
                        className="w-full bg-white text-black py-4 rounded-2xl font-black text-base tracking-wide uppercase flex items-center justify-center gap-3 hover:bg-gray-200 hover:shadow-[0_12px_40px_rgba(255,159,67,0.4)] transition-all duration-300 active:scale-[0.98] mt-3 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Verifying...
                            </>
                        ) : (
                            <>
                                <Shield size={20} />
                                Access Dashboard
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/[0.08]" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-[0.3em]">
                            <span className="bg-[#080808] px-4 text-white/30 font-bold">Or</span>
                        </div>
                    </div>

                    {/* Google Sign In for Admin */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading || isGoogleLoading}
                        className="w-full bg-white/[0.04] border border-white/[0.1] text-white py-4 rounded-2xl font-bold text-xs tracking-[0.2em] uppercase hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isGoogleLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Connecting to Google...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    />
                                </svg>
                                Continue with Admin Google
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-white/18 font-medium mt-10">
                    © 2026 <span className="text-brand-red">CORASE</span>. All rights reserved.
                </p>
            </motion.div>
        </div>
    );
}
