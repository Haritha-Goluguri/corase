"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  selectedSize: string;
  quantity: number;
}

// Shared Product type used across modals, wishlists, and product pages
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  category: string;
  description?: string;
  status?: string;
  isNewDrop?: boolean;
  isFeatured?: boolean;
  color?: string;
  sizes?: string[];
  variants?: { size: string; stock: number }[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  totalPrice: number;
  totalItems: number;
  appliedCoupon: any | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  discountedTotal: number;
  buyNowItem: CartItem | null;
  setBuyNowItem: (item: CartItem) => void;
  clearBuyNowItem: () => void;
  checkoutItems: CartItem[];
  checkoutTotal: number;
  checkoutDiscountedTotal: number;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("corase_cart");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
      }
    }
    return [];
  });
  const [isCartOpen, setIsOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [buyNowItem, setBuyNowItemState] = useState<CartItem | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("corase_buy_now");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse buyNowItem from sessionStorage");
        }
      }
    }
    return null;
  });

  // Load initial data
  useEffect(() => {
    const loadCart = async () => {
      if (status === "authenticated") {
        try {
          // Get local cart before fetching from DB
          const savedCart = localStorage.getItem("corase_cart");
          const localItems = savedCart ? JSON.parse(savedCart) : [];

          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            const dbCart = data.cart || [];
            
            // Merge guest cart items into DB cart instead of wiping them
            if (localItems.length > 0) {
              const mergedCart = [...dbCart];
              for (const localItem of localItems) {
                const existing = mergedCart.find(
                  (item) => item.productId === localItem.productId && item.selectedSize === localItem.selectedSize
                );
                if (existing) {
                  existing.quantity = Math.max(existing.quantity, localItem.quantity);
                } else {
                  mergedCart.push(localItem);
                }
              }
              setCart(mergedCart);
              localStorage.setItem("corase_cart", JSON.stringify(mergedCart));
            } else {
              setCart(dbCart);
              localStorage.setItem("corase_cart", JSON.stringify(dbCart));
            }
          }
        } catch (error) {
          console.error("Failed to load cart from DB", error);
        }
      } else if (status === "unauthenticated") {
        const savedCart = localStorage.getItem("corase_cart");
        if (savedCart) {
          try {
            setCart(JSON.parse(savedCart));
          } catch (e) {
            console.error("Failed to parse local cart", e);
          }
        }
      }
      setIsInitialized(true);
    };

    if (status !== "loading") {
      loadCart();
    }
  }, [status]);

  // Sync data when items change (Always keep localStorage synced as fast local cache)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("corase_cart", JSON.stringify(cart));
      } catch (e) {}
    }

    if (!isInitialized) return;

    if (status === "authenticated") {
      const syncCart = async () => {
        try {
          const res = await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart: cart }),
          });
          
          if (!res.ok) {
            throw new Error("Failed to sync cart");
          }
        } catch (e) {
          console.error("Cart sync failed, reverting...", e);
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            setCart(data.cart || []);
          }
        }
      };

      // Debounce sync slightly to prevent rapid firing
      const timeout = setTimeout(syncCart, 400);
      return () => clearTimeout(timeout);
    }
  }, [cart, status, isInitialized]);

  const addToCart = (newItem: CartItem) => {
    // Clear buyNowItem if user adds a normal item to cart
    if (buyNowItem) clearBuyNowItem();

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.productId === newItem.productId && item.selectedSize === newItem.selectedSize
      );

      let newCart: CartItem[];
      if (existingItemIndex >= 0) {
        newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + newItem.quantity,
        };
      } else {
        newCart = [...prevCart, newItem];
      }

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("corase_cart", JSON.stringify(newCart));
        } catch (e) {}
      }
      return newCart;
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter(
        (item) => !(item.productId === productId && item.selectedSize === size)
      );
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("corase_cart", JSON.stringify(newCart));
        } catch (e) {}
      }
      return newCart;
    });
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.productId === productId && item.selectedSize === size
          ? { ...item, quantity }
          : item
      );
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("corase_cart", JSON.stringify(newCart));
        } catch (e) {}
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("corase_cart");
      } catch (e) {}
    }
  };

  const applyCoupon = async (code: string) => {
  try {
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, amount: checkoutTotalPrice }),
    });

      const data = await res.json();

      if (res.ok) {
        setAppliedCoupon(data);
        return { success: true, message: "Coupon applied successfully!" };
      } else {
        return { success: false, message: data.error || "Failed to apply coupon" };
      }
    } catch (error) {
      return { success: false, message: "Error validating coupon" };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const setBuyNowItem = (item: CartItem) => {
    setBuyNowItemState(item);
    sessionStorage.setItem("corase_buy_now", JSON.stringify(item));
  };

  const clearBuyNowItem = () => {
    setBuyNowItemState(null);
    sessionStorage.removeItem("corase_buy_now");
  };

  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  const currentDiscount = appliedCoupon ? (
    appliedCoupon.discountType === 'percentage' 
      ? Math.min((totalPrice * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || Infinity)
      : appliedCoupon.discountValue
  ) : 0;

  const discountedTotal = Math.max(totalPrice - currentDiscount, 0);

  // When buyNowItem is set, checkout should use only that item
  const checkoutItems = buyNowItem ? [buyNowItem] : cart;
  const checkoutTotalPrice = buyNowItem ? buyNowItem.price * buyNowItem.quantity : totalPrice;
  const checkoutCurrentDiscount = appliedCoupon ? (
    appliedCoupon.discountType === 'percentage' 
      ? Math.min((checkoutTotalPrice * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || Infinity)
      : appliedCoupon.discountValue
  ) : 0;
  const checkoutDiscountedTotal = Math.max(checkoutTotalPrice - checkoutCurrentDiscount, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsOpen: (open: boolean) => {
          if (open && buyNowItem) clearBuyNowItem();
          setIsOpen(open);
        },
        totalPrice,
        totalItems,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discountedTotal,
        buyNowItem,
        setBuyNowItem,
        clearBuyNowItem,
        checkoutItems,
        checkoutTotal: checkoutTotalPrice,
        checkoutDiscountedTotal,
        isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
