import { normalizeProduct } from "../api/catalogApi";
import { getCustomerToken } from "../api/client";
import { wishlistApi } from "../api/wishlistApi";

export const WISHLIST_STORAGE_KEY = "healthyPaws.wishlist.items";
export const WISHLIST_UPDATED_EVENT = "healthyPawsWishlistChange";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getWishlistItemId(item = {}) {
  return String(item.id || item.productId || item.slug || item.title || "");
}

export function normalizeWishlistProduct(product = {}) {
  const normalized = normalizeProduct(product);
  const id = String(product.id || normalized.id || product.productId || normalized.productId || "");

  return {
    ...normalized,
    ...product,
    id,
    productId: normalized.productId || id,
    title: product.title || normalized.title || normalized.name || "Product",
    price: Number(product.price ?? normalized.price) || 0,
    oldPrice: Number.isFinite(Number(product.oldPrice ?? normalized.oldPrice))
      ? Number(product.oldPrice ?? normalized.oldPrice)
      : Number(product.price ?? normalized.price) || 0,
    image: product.image || normalized.image,
  };
}

export function getStoredWishlist() {
  if (!hasWindow()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]");
    return dedupeWishlistItems(Array.isArray(parsed) ? parsed.map(normalizeWishlistProduct) : []);
  } catch {
    return [];
  }
}

export function saveStoredWishlist(items) {
  if (!hasWindow()) return [];
  const normalized = dedupeWishlistItems(Array.isArray(items) ? items.map(normalizeWishlistProduct) : []);
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, { detail: normalized }));
  return normalized;
}

function dedupeWishlistItems(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const id = getWishlistItemId(item);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function isWishlistItemSaved(productOrId) {
  const id = typeof productOrId === "string" ? productOrId : getWishlistItemId(productOrId);
  if (!id) return false;
  return getStoredWishlist().some((item) => getWishlistItemId(item) === String(id));
}

export function addStoredWishlistItem(product) {
  const item = normalizeWishlistProduct(product);
  const current = getStoredWishlist();
  const exists = current.some((wishlistItem) => getWishlistItemId(wishlistItem) === getWishlistItemId(item));
  return saveStoredWishlist(exists ? current : [item, ...current]);
}

export function removeStoredWishlistItem(productOrId) {
  const id = typeof productOrId === "string" ? productOrId : getWishlistItemId(productOrId);
  return saveStoredWishlist(
    getStoredWishlist().filter((item) => getWishlistItemId(item) !== String(id)),
  );
}

export async function refreshWishlistFromApi() {
  if (!getCustomerToken()) return getStoredWishlist();
  const items = await wishlistApi.getWishlist();
  return saveStoredWishlist(items);
}

export async function addWishlistItem(product) {
  const item = normalizeWishlistProduct(product);
  const id = getWishlistItemId(item);
  if (!id) {
    throw new Error("Could not add product to wishlist.");
  }

  const optimisticItems = addStoredWishlistItem(item);
  if (!getCustomerToken()) return getStoredWishlist();

  const items = await wishlistApi.addItem(item);
  let savedItems = saveStoredWishlist(items.length ? items : optimisticItems);
  let saved = savedItems.some((wishlistItem) => getWishlistItemId(wishlistItem) === id);

  if (!saved) {
    const repairedItems = await wishlistApi.syncWishlist([item, ...savedItems]);
    savedItems = saveStoredWishlist(repairedItems.length ? repairedItems : [item, ...savedItems]);
    saved = savedItems.some((wishlistItem) => getWishlistItemId(wishlistItem) === id);
  }

  if (!saved) {
    throw new Error("Wishlist was not updated. Please try again.");
  }

  return savedItems;
}

export async function removeWishlistItem(productOrId) {
  const id = typeof productOrId === "string" ? productOrId : getWishlistItemId(productOrId);
  removeStoredWishlistItem(id);
  if (!getCustomerToken()) return getStoredWishlist();
  const items = await wishlistApi.removeItem(id);
  return saveStoredWishlist(items);
}

export async function toggleWishlistItem(product) {
  const id = getWishlistItemId(product);
  if (!id) {
    throw new Error("Could not update wishlist for this product.");
  }

  if (isWishlistItemSaved(id)) {
    await removeWishlistItem(id);
    return { saved: false, items: getStoredWishlist() };
  }

  await addWishlistItem(product);
  return { saved: true, items: getStoredWishlist() };
}
