"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { User, Heart, Package, MapPin, Settings, ChevronRight, Trash2, LogOut, X, Truck, Calendar, ShoppingBag, Plus } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useSession, signOut } from 'next-auth/react';
import ProductModal from '@/components/products/ProductModal';

const TABS = [
    { id: 'orders',    label: 'Orders',    icon: Package },
    { id: 'wishlist',  label: 'Wishlist',  icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'profile',   label: 'Profile',   icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

function AccountPageInner() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<TabId>('orders');
    const { wishlist, toggleWishlist } = useWishlist();
    const { data: session } = useSession();
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [viewingOrder, setViewingOrder] = useState<any>(null);
const [addresses, setAddresses] = useState<any[]>([]);
const [isAddressesLoaded, setIsAddressesLoaded] = useState(false);    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [newAddress, setNewAddress] = useState({
        fullName: '',
        phone: '',
        addressLine: '',
        city: '',
        state: '',
        pincode: '',
    });
    const router = useRouter();

    // Load initial data
    useEffect(() => {
        if (session) {
            fetch('/api/orders/user')
                .then(res => res.json())
                .then(data => {
                    setOrders(Array.isArray(data) ? data : []);
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingOrders(false));

            // Load saved addresses
                      const savedAddresses = localStorage.getItem(`corase_addresses_${session.user?.email}`);
          if (savedAddresses) {
              try {
                  setAddresses(JSON.parse(savedAddresses));
              } catch (e) {
                  console.error("Failed to parse addresses");
              }
          }
          setIsAddressesLoaded(true);
        }
    }, [session]);

      // Save addresses only after initial load from storage completes
  useEffect(() => {
      if (session && isAddressesLoaded) {
          localStorage.setItem(`corase_addresses_${session.user?.email}`, JSON.stringify(addresses));
      }
  }, [addresses, session, isAddressesLoaded]);

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push('/');
    };

    // Fetch products to support modal opening
    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => setAllProducts(Array.isArray(data) ? data : []))
            .catch(err => console.error(err));
    }, []);

    const handleProductClick = (productId: string) => {
        const product = allProducts.find(p => p.id === productId || p._id === productId);
        if (product) {
            setSelectedProduct(product);
        }
    };

    useEffect(() => {
        const tab = searchParams.get('tab') as TabId | null;
        if (tab && TABS.some(t => t.id === tab)) setActiveTab(tab);
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white pt-28 pb-20 px-5 lg:px-10">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white/15 border border-white/25 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black font-syncopate tracking-tight text-brand-red uppercase">
                            Your Account
                        </h1>
                        <p className="text-white/70 text-sm font-medium">{session?.user?.email || 'guest@corase.com'}</p>
                    </div>
                    <button 
                        onClick={handleSignOut}
                        className="ml-auto flex items-center gap-2 text-white/30 hover:text-red-400 transition-colors text-sm font-medium"
                    >
                        <LogOut size={15} />
                        <span className="hidden sm:block">Sign Out</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-7 overflow-x-auto pb-1">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                                activeTab === id
                                    ? 'bg-white text-black font-bold'
                                    : 'bg-white/[0.06] text-white/45 hover:bg-white/[0.1] hover:text-white border border-white/[0.07]'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ─ Orders ─ */}
                {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        {orders.map(order => (
                            <div
                                key={order._id}
                                onClick={() => setViewingOrder(order)}
                                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4 hover:border-white/[0.12] transition-all cursor-pointer group"
                            >
                                <div className="relative w-16 h-16 bg-white/[0.06] rounded-xl overflow-hidden flex-shrink-0">
                                    <Image src={order.items[0].image} alt={order.items[0].name} fill sizes="64px" className="object-contain p-2" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white font-black mb-0.5 uppercase tracking-tighter">#{order._id.slice(-6)}</p>
                                    <p className="text-sm font-bold text-white truncate uppercase">{order.items[0].name}{order.items.length > 1 && ` + ${order.items.length - 1} more`}</p>
                                    <p className="text-xs text-white/70 font-medium mt-1">
                                        ₹{order.totalPrice} · {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <span className={`inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                                        order.status === 'Delivered'
                                            ? 'bg-emerald-500/15 text-emerald-400'
                                            : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                    }`}>
                                        {order.status}
                                    </span>
                                    <p className="text-[10px] text-white/50 font-bold mt-2 flex items-center justify-end gap-0.5 group-hover:text-white transition-colors">
                                        Track <ChevronRight size={9} />
                                    </p>
                                </div>
                            </div>
                        ))}
                        {!loadingOrders && orders.length === 0 && (
                            <div className="text-center py-20">
                                <Package size={40} className="mx-auto mb-4 text-white/15" />
                                <p className="text-white/50 font-bold text-xs uppercase tracking-widest">No orders yet</p>
                            </div>
                        )}
                        {loadingOrders && (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ─ Wishlist ─ */}
                {activeTab === 'wishlist' && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                        {wishlist.length === 0 ? (
                            <div className="text-center py-20">
                                <Heart size={40} className="mx-auto mb-4 text-white/15" />
                                <p className="text-white/50 font-bold text-xs uppercase tracking-widest mb-6">
                                    Your wishlist is empty
                                </p>
                                <Link
                                    href="/collections"
                                    className="inline-block bg-white text-black px-7 py-3 rounded-full font-black font-syncopate text-xs tracking-widest uppercase hover:bg-gray-200 transition-all"
                                >
                                    Browse Collection
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {wishlist.map(item => (
                                    <div
                                        key={item.productId}
                                        onClick={() => handleProductClick(item.productId)}
                                        className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-3.5 hover:border-white/[0.12] transition-all cursor-pointer group"
                                    >
                                        <div className="relative aspect-square bg-white/[0.05] rounded-xl overflow-hidden mb-3">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                sizes="(max-width: 640px) 50vw, 33vw"
                                                className="object-contain p-3 group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <p className="text-xs font-bold text-white truncate mb-1 uppercase tracking-tight">{item.name}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-white/70 font-medium">₹{item.price}</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWishlist(item);
                                                }}
                                                className="text-white/25 hover:text-red-500 transition-colors p-0.5"
                                                title="Remove"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ─ Addresses ─ */}
                {activeTab === 'addresses' && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {!isAddingAddress && addresses.length === 0 ? (
                            <div className="text-center py-20 bg-white/[0.02] border border-white/[0.07] rounded-[2rem]">
                                <MapPin size={40} className="mx-auto mb-4 text-white/10" />
                                <p className="text-white/40 font-bold text-xs uppercase tracking-[0.2em] mb-6">
                                    No addresses saved yet
                                </p>
                                <button
                                    onClick={() => setIsAddingAddress(true)}
                                    className="inline-flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-full font-black font-syncopate text-[10px] tracking-widest uppercase hover:bg-gray-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    Add New Address
                                </button>
                            </div>
                        ) : !isAddingAddress ? (
                            <div className="grid gap-4">
                                {addresses.map((addr, idx) => (
                                    <div key={idx} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 relative group">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <MapPin size={16} className="text-brand-red" />
                                                <p className="font-bold text-sm text-white uppercase tracking-tight">{addr.fullName}</p>
                                            </div>
                                            <button 
                                                onClick={() => setAddresses(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-white/20 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-white/60 font-medium leading-relaxed">
                                            {addr.addressLine}<br />
                                            {addr.city}, {addr.state} {addr.pincode}<br />
                                            Phone: {addr.phone}
                                        </p>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setIsAddingAddress(true)}
                                    className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:border-white/30 hover:text-white transition-all"
                                >
                                    + Add Another Address
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white/[0.04] border border-white/[0.07] rounded-[2rem] p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-black font-syncopate text-white uppercase tracking-tight italic">New Address</h3>
                                    <button onClick={() => setIsAddingAddress(false)} className="text-white/30 hover:text-white"><X size={18}/></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">Full Name</label>
                                        <input 
                                            value={newAddress.fullName}
                                            onChange={e => setNewAddress({...newAddress, fullName: e.target.value})}
                                            placeholder="Enter your name"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">Phone Number</label>
                                        <input 
                                            value={newAddress.phone}
                                            onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                                            placeholder="10-digit mobile number"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">Pincode</label>
                                        <input 
                                            value={newAddress.pincode}
                                            onChange={e => setNewAddress({...newAddress, pincode: e.target.value})}
                                            placeholder="6-digit code"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">Address (Area and Street)</label>
                                        <textarea 
                                            value={newAddress.addressLine}
                                            onChange={e => setNewAddress({...newAddress, addressLine: e.target.value})}
                                            rows={3}
                                            placeholder="Building Name, Road, etc."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-all resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">City</label>
                                        <input 
                                            value={newAddress.city}
                                            onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                                            placeholder="City/Town"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">State</label>
                                        <input 
                                            value={newAddress.state}
                                            onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                                            placeholder="Select State"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="mt-10 flex gap-4">
                                    <button 
                                        onClick={() => {
                                            if (!newAddress.fullName || !newAddress.phone || !newAddress.addressLine) {
                                                alert("Please fill in required fields");
                                                return;
                                            }
                                            setAddresses([...addresses, newAddress]);
                                            setIsAddingAddress(false);
                                            setNewAddress({ fullName: '', phone: '', addressLine: '', city: '', state: '', pincode: '' });
                                        }}
                                        className="flex-1 bg-white text-black py-4 rounded-xl font-black font-syncopate text-[10px] tracking-widest uppercase hover:bg-gray-200 transition-all active:scale-95"
                                    >
                                        Save Address
                                    </button>
                                    <button 
                                        onClick={() => setIsAddingAddress(false)}
                                        className="flex-1 bg-white/5 text-white py-4 rounded-xl font-black font-syncopate text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all border border-white/10"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ─ Profile ─ */}
                {activeTab === 'profile' && (
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-sm">
                        {[
                            ['Full Name', session?.user?.name || 'Guest User'],
                            ['Email', session?.user?.email || 'guest@corase.com'],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <label className="block text-xs font-bold text-white/80 mb-1.5 uppercase tracking-wider">
                                    {label}
                                </label>
                                <input
                                    defaultValue={value}
                                    className="w-full bg-white/[0.06] border border-white/[0.1] text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-white/60 transition-all"
                                />
                            </div>
                        ))}
                        <button className="bg-white text-black px-7 py-3 rounded-xl font-black font-syncopate text-xs tracking-widest uppercase hover:bg-gray-200 hover:shadow-[0_8px_30px_rgba(255,159,67,0.3)] transition-all duration-300">
                            Save Changes
                        </button>
                    </motion.div>
                )}

                {/* ─ Order Tracking Modal ─ */}
                <Suspense fallback={null}>
                    {viewingOrder && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setViewingOrder(null)}
                                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="relative bg-[#0d0d0d] border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-3xl md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
                            >
                                {/* Header */}
                                <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-9 h-9 md:w-10 md:h-10 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center">
                                            <Truck className="text-white" size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-md md:text-lg font-black font-syncopate uppercase tracking-tight">Track Order</h2>
                                            <p className="text-[9px] md:text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5 md:mt-1">#{viewingOrder._id.slice(-8)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 md:space-y-10 scrollbar-hide">
                                    {/* Tracking Status */}
                                    <section>
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Current Status</p>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{viewingOrder.status}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Carrier</p>
                                                <p className="text-sm font-bold text-white uppercase">{viewingOrder.carrier || 'Preparing for dispatch'}</p>
                                            </div>
                                        </div>

                                        {/* Progress Line */}
                                        <div className="relative h-1 bg-white/5 rounded-full overflow-hidden mb-10">
                                            <div 
                                                className="absolute h-full bg-white transition-all duration-1000"
                                                style={{ 
                                                    width: viewingOrder.status === 'Delivered' ? '100%' : 
                                                           viewingOrder.status === 'Shipped' ? '66%' : 
                                                           viewingOrder.status === 'Processing' ? '33%' : '10%' 
                                                }}
                                            />
                                        </div>

                                        {viewingOrder.trackingNumber && (
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Tracking ID</p>
                                                    <p className="text-xs font-mono font-bold text-white select-all">{viewingOrder.trackingNumber}</p>
                                                </div>
                                                <button className="text-[10px] font-black text-black bg-white px-4 py-2 rounded-full uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                                    Copy
                                                </button>
                                            </div>
                                        )}
                                    </section>

                                    {/* Items */}
                                    <section>
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            <ShoppingBag size={12} /> Order Summary
                                        </h4>
                                        <div className="space-y-4">
                                            {viewingOrder.items.map((item: any, i: number) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="relative w-14 h-16 bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
                                                        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-contain p-1" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-white uppercase truncate">{item.name}</p>
                                                        <p className="text-[10px] text-white/50 font-bold uppercase mt-1">{item.selectedSize} × {item.quantity}</p>
                                                    </div>
                                                    <p className="text-xs font-black text-white">₹{item.price * item.quantity}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Shipping Address */}
                                    <section className="pt-8 border-t border-white/5">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                            <MapPin size={12} /> Shipping To
                                        </h4>
                                        <div className="text-sm font-bold text-white/80 leading-relaxed uppercase tracking-tight">
                                            <p>{viewingOrder.shippingAddress.fullName}</p>
                                            <p className="text-white/50">{viewingOrder.shippingAddress.address}</p>
                                            <p className="text-white/50">{viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state} {viewingOrder.shippingAddress.zipCode}</p>
                                        </div>
                                    </section>
                                </div>
                                
                                <div className="p-8 bg-white/[0.02] border-t border-white/5">
                                    <button 
                                        onClick={() => setViewingOrder(null)}
                                        className="w-full bg-white text-black py-4 rounded-2xl font-black font-syncopate text-[10px] tracking-[0.3em] uppercase hover:bg-gray-200 transition-all shadow-xl"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </Suspense>

                {/* Product Modal */}
                {selectedProduct && (
                    <ProductModal 
                        product={selectedProduct}
                        onClose={() => setSelectedProduct(null)}
                    />
                )}
            </div>
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/30 border-t-[#ffffff] rounded-full animate-spin" />
            </div>
        }>
            <AccountPageInner />
        </Suspense>
    );
}

