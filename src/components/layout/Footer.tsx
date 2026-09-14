import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, PlayCircle, Share2 } from 'lucide-react';

const InstagramIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
);

const LINKS = {
    Shop: [
        { label: 'All Products',   href: '/shop' },
        { label: 'New Arrivals',   href: '/shop?filter=new' },
        { label: 'Oversized Tees', href: '/shop?filter=oversized' },
        { label: 'Graphic Tees',   href: '/shop?filter=graphic' },
    ],
    Company: [
        { label: 'Our Story',          href: '/about' },
        { label: 'Contact Us',         href: '/contact' },
        { label: 'Privacy Policy',     href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'Shipping & Returns', href: '/terms' },
    ]
};

const SOCIALS = [
    { name: 'Instagram', icon: InstagramIcon, href: 'https://www.instagram.com/corase.co?igsh=MXBvY3dxZTN2Ym9oag==' },
    { name: 'YouTube',   icon: PlayCircle, href: '#' },
    { name: 'Twitter',   icon: Share2,     href: '#' },
];

export default function Footer() {
    return (
        <footer className="bg-black text-white pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-red/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    {/* Brand Section */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-2xl font-black font-syncopate tracking-tighter mb-4">CORASE<span className="text-brand-red">.</span></h2>
                            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
                                Redefining street aesthetics through brutalist design and premium craftsmanship.
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Connect</h4>
                            <div className="space-y-3">
                                <a href="mailto:hellocorase@gmail.com" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-red/20 transition-all">
                                        <Mail size={14} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">hellocorase@gmail.com</span>
                                </a>
                                <div className="flex items-center gap-3 text-white/60 group">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Phone size={14} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">+91 9959735776 / +91 9652128339 / +91 9618390632 </span>
                                </div>
                                <a href="https://www.instagram.com/corase.co?igsh=MXBvY3dxZTN2Ym9oag==" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/60 hover:text-white transition-colors group">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-brand-red/20 transition-all">
                                        <InstagramIcon size={14} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">@corase.co</span>
                                </a>
                                <div className="flex items-center gap-3 text-white/60">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <MapPin size={14} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">Hyd, India</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Links Sections */}
                    {Object.entries(LINKS).map(([title, items]) => (
                        <div key={title} className="space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{title}</h4>
                            <ul className="space-y-4">
                                {items.map((item) => (
                                    <li key={item.label}>
                                        <Link 
                                            href={item.href} 
                                            className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all hover:translate-x-1 inline-block"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Newsletter */}
                    <div className="space-y-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Newsletter</h4>
                        <div className="space-y-4">
                            <p className="text-white/40 text-xs leading-relaxed">
                                Join the archive for early access and exclusive drops.
                            </p>
                            <div className="relative group">
                                <input 
                                    type="email" 
                                    placeholder="EMAIL ADDRESS" 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-[10px] font-bold tracking-widest focus:outline-none focus:border-brand-red transition-all"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all">
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">
                        &copy; {new Date().getFullYear()} Corase. All Rights Reserved.
                    </p>
                    
                    <div className="flex items-center gap-6">
                        {SOCIALS.map((social) => (
                            <a 
                                key={social.name}
                                href={social.href}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-brand-red hover:text-white transition-all group"
                                aria-label={social.name}
                            >
                                <social.icon size={18} className="group-hover:scale-110 transition-transform" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
