"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  clearWishlist: () => void;
  totalWishlist: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadWishlist = async () => {
      if (status === "authenticated") {
        try {
          // Get local wishlist before fetching from DB
          const savedWishlist = localStorage.getItem("corase_wishlist");
          const localItems = savedWishlist ? JSON.parse(savedWishlist) : [];

          const res = await fetch("/api/wishlist");
          if (res.ok) {
            const data = await res.json();
            const dbWishlist = data.wishlist || [];

            // Merge guest wishlist into DB wishlist without dropping items
            if (localItems.length > 0) {
              const merged = [...dbWishlist];
              for (const localItem of localItems) {
                if (!merged.some((m: WishlistItem) => m.productId === localItem.productId)) {
                  merged.push(localItem);
                }
              }
              setWishlist(merged);
              localStorage.removeItem("corase_wishlist");
            } else {
              setWishlist(dbWishlist);
            }
          }
        } catch (error) {
          console.error("Failed to load wishlist from DB", error);
        }
      } else if (status === "unauthenticated") {
        const savedWishlist = localStorage.getItem("corase_wishlist");
        if (savedWishlist) {
          try {
            setWishlist(JSON.parse(savedWishlist));
          } catch (e) {
            console.error("Failed to parse local wishlist");
          }
        }
      }
      setIsInitialized(true);
    };

    if (status !== "loading") {
      loadWishlist();
    }
  }, [status]);

  // Sync data when items change (Optimistic with Rollback)
  useEffect(() => {
    if (!isInitialized) return;

    if (status === "authenticated") {
      const syncWishlist = async () => {
        try {
          const res = await fetch("/api/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wishlist: wishlist }),
          });
          if (!res.ok) throw new Error("Failed to sync wishlist");
        } catch (e) {
          console.error("Wishlist sync failed, reverting...", e);
          const res = await fetch("/api/wishlist");
          if (res.ok) {
            const data = await res.json();
            setWishlist(data.wishlist || []);
          }
        }
      };

      const timeout = setTimeout(syncWishlist, 500);
      return () => clearTimeout(timeout);
    } else if (status === "unauthenticated") {
      localStorage.setItem("corase_wishlist", JSON.stringify(wishlist));
    }
  }, [wishlist, status, isInitialized]);

  const addToWishlist = (newItem: WishlistItem) => {
    setWishlist((prevWishlist) => {
      if (!prevWishlist.find((item) => item.productId === newItem.productId)) {
        return [...prevWishlist, newItem];
      }
      return prevWishlist;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.productId !== productId));
  };

  const isWishlisted = (productId: string) => {
    return wishlist.some((item) => item.productId === productId);
  };

  const toggleWishlist = (item: WishlistItem) => {
    if (isWishlisted(item.productId)) {
      removeFromWishlist(item.productId);
    } else {
      addToWishlist(item);
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const totalWishlist = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        toggleWishlist,
        clearWishlist,
        totalWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
