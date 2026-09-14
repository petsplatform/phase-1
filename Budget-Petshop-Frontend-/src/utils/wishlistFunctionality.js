import { useEffect, useState } from "react";
import { wishlistApi } from "../api/wishlistApi";

const WISHLIST_STORAGE_KEY = "budget-petshop-wishlist";

/**
 * Checks if two products/IDs refer to the exact same product.
 * Compares IDs (id or productId) and normalized titles.
 */
export function isSameProduct(a, b) {
  if (!a || !b) return false;

  const idA = typeof a === "object" ? String(a.id ?? a.productId ?? "") : String(a);
  const idB = typeof b === "object" ? String(b.id ?? b.productId ?? "") : String(b);

  if (idA && idB && idA === idB) return true;

  const titleA = typeof a === "object" ? (a.title || a.name || "").toLowerCase().trim() : "";
  const titleB = typeof b === "object" ? (b.title || b.name || "").toLowerCase().trim() : "";

  if (titleA && titleB && titleA === titleB) return true;

  return false;
}

/**
 * Deduplicates wishlist products by ID and Title.
 */
export function deduplicateWishlistItems(items = []) {
  const seenIds = new Set();
  const seenTitles = new Set();
  const result = [];

  for (const item of items) {
    if (!item) continue;
    const idKey = String(item.id ?? item.productId ?? "");
    const titleKey = (item.title || item.name || "").toLowerCase().trim();

    if (idKey && seenIds.has(idKey)) continue;
    if (titleKey && seenTitles.has(titleKey)) continue;

    if (idKey) seenIds.add(idKey);
    if (titleKey) seenTitles.add(titleKey);
    result.push(item);
  }

  return result;
}

export function useWishlist(authStatus = "guest") {
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);
  const [wishlistItems, setWishlistItems] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const resolved = parsed
          .map((itemOrId) => (typeof itemOrId === "object" ? itemOrId : null))
          .filter(Boolean);
        return deduplicateWishlistItems(resolved);
      }
      return [];
    } catch {
      return [];
    }
  });

  // Persist deduplicated wishlist objects/IDs to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const deduplicated = deduplicateWishlistItems(wishlistItems);
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(deduplicated));
    }
  }, [wishlistItems]);

  // Load & Sync from API when authenticated
  useEffect(() => {
    let isMounted = true;

    const loadServerWishlist = async () => {
      if (authStatus === "checking") {
        if (isMounted) setIsLoadingWishlist(true);
        return;
      }
      if (authStatus !== "authenticated") {
        if (isMounted) setIsLoadingWishlist(false);
        return;
      }

      try {
        setIsLoadingWishlist(true);
        const serverItems = await wishlistApi.getWishlist();
        if (!isMounted) return;
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          setWishlistItems(deduplicateWishlistItems(serverItems));
        } else if (wishlistItems.length > 0) {
          await wishlistApi.syncWishlist(wishlistItems);
        }
      } catch (error) {
        console.error("Failed to load customer wishlist from API:", error);
      } finally {
        if (isMounted) setIsLoadingWishlist(false);
      }
    };

    loadServerWishlist();
    window.addEventListener("auth-state-change", loadServerWishlist);
    return () => {
      isMounted = false;
      window.removeEventListener("auth-state-change", loadServerWishlist);
    };
  }, [authStatus]);

  function isInWishlist(productOrId) {
    if (!productOrId) return false;
    return wishlistItems.some((item) => isSameProduct(item, productOrId));
  }

  function toggleWishlist(productOrId) {
    if (!productOrId) return;

    const product =
      typeof productOrId === "object"
        ? productOrId
        : getProductById(productOrId);

    const target = product || productOrId;

    setWishlistItems((prevItems) => {
      const currentlyExists = prevItems.some((item) => isSameProduct(item, target));

      let nextItems;
      if (currentlyExists) {
        // Remove matching item
        nextItems = prevItems.filter((item) => !isSameProduct(item, target));
        if (authStatus === "authenticated") {
          const itemId = String(target.id || target.productId || target);
          wishlistApi.removeItem(itemId).catch((err) =>
            console.error("Failed to remove item via wishlist API:", err),
          );
        }
      } else {
        // Add item uniquely
        const itemToAdd =
          product ||
          (typeof target === "object"
            ? target
            : { id: target, title: `Product ${target}` });
        nextItems = deduplicateWishlistItems([itemToAdd, ...prevItems]);
        if (authStatus === "authenticated") {
          wishlistApi.addItem(itemToAdd).catch((err) =>
            console.error("Failed to add item via wishlist API:", err),
          );
        }
      }

      return nextItems;
    });
  }

  function clearWishlist() {
    setWishlistItems([]);
    if (authStatus === "authenticated") {
      wishlistApi.clearWishlist().catch((err) =>
        console.error("Failed to clear wishlist via API:", err),
      );
    }
  }

  const wishlistIds = wishlistItems.map((i) => String(i.id || i.productId));
  const wishlistItemCount = wishlistItems.length;

  return {
    wishlistIds,
    wishlistItems,
    wishlistItemCount,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    isLoadingWishlist,
  };
}
