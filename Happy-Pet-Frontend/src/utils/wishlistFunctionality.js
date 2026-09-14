import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import { wishlistApi } from "../api/wishlistApi";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const skipNextRemoteSync = useRef(false);

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const stored = localStorage.getItem("happypet_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("happypet_wishlist", JSON.stringify(wishlistIds));
    if (skipNextRemoteSync.current) {
      skipNextRemoteSync.current = false;
      return;
    }
    if (authApi.getSession()) {
      wishlistApi
        .syncWishlist(
          wishlistIds.map((id) => ({
            id,
            productId: String(id).split("__")[0],
          })),
        )
        .catch(() => {});
    }
  }, [wishlistIds]);

  useEffect(() => {
    const hydrateRemoteWishlist = async () => {
      if (!authApi.getSession()) return;

      try {
        const serverItems = await wishlistApi.getWishlist();
        const serverIds = serverItems
          .map((item) => item.productId || item.id || item.product?.id)
          .filter(Boolean);

        if (!serverIds.length && wishlistIds.length) {
          await wishlistApi.syncWishlist(
            wishlistIds.map((id) => ({ id, productId: id })),
          );
        }

        skipNextRemoteSync.current = true;
        setWishlistIds(serverIds.length ? serverIds : wishlistIds);
      } catch {
        // Keep guest/local wishlist available if the backend is temporarily unreachable.
      }
    };

    hydrateRemoteWishlist();
    window.addEventListener("happypetrx-auth-change", hydrateRemoteWishlist);
    return () =>
      window.removeEventListener(
        "happypetrx-auth-change",
        hydrateRemoteWishlist,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleWishlist = (productId, productOverride = null) => {
    const product = productOverride;
    const productName = product ? product.name : "Product";

    const isCurrentlyWishlisted = wishlistIds.includes(productId);
    if (isCurrentlyWishlisted) {
      toast(`${productName} removed from your wishlist.`, {
        icon: "🤍",
      });
      try {
        const meta = JSON.parse(
          localStorage.getItem("happypet_wishlist_meta") || "{}",
        );
        delete meta[productId];
        localStorage.setItem("happypet_wishlist_meta", JSON.stringify(meta));
      } catch {}
    } else {
      toast.success(`${productName} added to your wishlist!`, {
        icon: "💖",
      });
      if (productOverride) {
        try {
          const meta = JSON.parse(
            localStorage.getItem("happypet_wishlist_meta") || "{}",
          );
          meta[productId] = {
            name: productOverride.name,
            sellPrice: productOverride.sellPrice || productOverride.price,
            image: productOverride.image,
            variantLabel:
              productOverride.selectedOption || productOverride.variantLabel,
          };
          localStorage.setItem("happypet_wishlist_meta", JSON.stringify(meta));
        } catch {}
      }
    }

    setWishlistIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [productId, ...prev.filter((id) => id !== productId)],
    );
  };

  const clearWishlist = () => {
    try {
      localStorage.removeItem("happypet_wishlist_meta");
    } catch {}
    setWishlistIds([]);
  };

  const wishlistItemCount = wishlistIds.length;

  return React.createElement(
    WishlistContext.Provider,
    {
      value: {
        wishlistIds,
        wishlistItemCount,
        toggleWishlist,
        clearWishlist,
      },
    },
    children,
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
