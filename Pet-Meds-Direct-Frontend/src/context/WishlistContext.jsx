import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getWishlistApi,
  syncWishlistApi,
  transformProduct,
} from "../helper/axiosInstance";
import cosequinImg from "../assets/Home/Products/cosequin.png";

const WishlistContext = createContext();

const DEFAULT_WISHLIST_ITEMS = [
  {
    id: "cosequin-mobility",
    name: "Cosequin Hip & Joint Strength",
    category: "Hip & Joint Mobility",
    description:
      "Glucosamine, chondroitin, and MSM supplement for dog joint health and mobility.",
    image: cosequinImg,
    actualPrice: 34.99,
    sellingPrice: 29.99,
    discount: "14% OFF",
    inStock: true,
  },
];

export function WishlistProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem("pet_meds_wishlist");
    return saved ? JSON.parse(saved) : DEFAULT_WISHLIST_ITEMS;
  });
  const [loading, setLoading] = useState(true);

  // Load wishlist on mount or login status change
  useEffect(() => {
    let active = true;

    const loadWishlist = async () => {
      setLoading(true);
      if (isLoggedIn) {
        try {
          const res = await getWishlistApi();
          if (active) {
            if (res && res.success && res.data) {
              const backendItems = (res.data.items || [])
                .map((item) => {
                  const prod = item.product || item;
                  if (!prod) return null;
                  const transformed = transformProduct(prod);
                  return {
                    ...transformed,
                    id: prod.id || item.id || item.productId,
                  };
                })
                .filter(Boolean);

              // Merge guest wishlist with backend wishlist if guest items exist
              const guestWishlistStr =
                localStorage.getItem("pet_meds_wishlist");
              if (guestWishlistStr) {
                const guestItems = JSON.parse(guestWishlistStr);
                if (
                  guestItems.length > 0 &&
                  JSON.stringify(guestItems) !==
                    JSON.stringify(DEFAULT_WISHLIST_ITEMS)
                ) {
                  const merged = [...backendItems];
                  guestItems.forEach((gItem) => {
                    const exist = merged.find((bItem) => bItem.id === gItem.id);
                    if (!exist) {
                      merged.push(gItem);
                    }
                  });

                  // Sync merged wishlist to backend
                  const payload = {
                    items: merged.map((item) => ({
                      productId: String(item.id || item.productId || "").split("__")[0],
                    })),
                  };
                  await syncWishlistApi(payload);
                  setWishlistItems(merged);
                  localStorage.removeItem("pet_meds_wishlist");
                  setLoading(false);
                  return;
                }
              }

              setWishlistItems(backendItems);
            } else {
              setWishlistItems([]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch wishlist from backend:", err);
          if (active) {
            const saved = localStorage.getItem("pet_meds_wishlist");
            setWishlistItems(
              saved ? JSON.parse(saved) : DEFAULT_WISHLIST_ITEMS,
            );
          }
        }
      } else {
        const saved = localStorage.getItem("pet_meds_wishlist");
        setWishlistItems(saved ? JSON.parse(saved) : DEFAULT_WISHLIST_ITEMS);
      }
      if (active) setLoading(false);
    };

    loadWishlist();

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  // Sync wishlist to localStorage and backend on changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("pet_meds_wishlist", JSON.stringify(wishlistItems));

      if (isLoggedIn) {
        const payload = {
          items: wishlistItems.map((item) => ({
            productId: String(item.id || item.productId || "").split("__")[0],
          })),
        };
        syncWishlistApi(payload).catch((err) => {
          console.error("Failed to sync wishlist to backend:", err);
        });
      }
    }
  }, [wishlistItems, isLoggedIn, loading]);

  const toggleWishlist = (product) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      // Prepend to top of wishlist
      return [product, ...prev];
    });
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const isWishlisted = (id) => {
    return wishlistItems.some((item) => item.id === id);
  };

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        toggleWishlist,
        isWishlisted,
        wishlistCount,
        clearWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
