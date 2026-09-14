import { wishlistApi } from "../api/wishlistApi";

const WISHLIST_STORAGE_KEY = "petcare_wishlist_items";
export const WISHLIST_UPDATED_EVENT = "petcare-wishlist-change";

export const createWishlistSlug = (name = "") =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const optionalId = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
};

export const normalizeWishlistProduct = (product) => {
  const name = product?.name || "PetCare Product";
  const slug = product?.slug || createWishlistSlug(name);

  return {
    id: product?.id || slug,
    productId: product?.productId || product?.id || slug,
    slug,
    name,
    description: product?.description || "Premium pet product",
    image: product?.image || product?.images?.[0] || "/images/img_product_item_image.png",
    rating: product?.rating,
    reviews: product?.reviews || 0,
    price: product?.price || "0.00",
    oldPrice: product?.oldPrice || "",
    discount: product?.discount || "",
    badge: product?.badge || "",
    stock: product?.stock,
    inventory: product?.inventory || null,
    status: product?.status || "",
    variantId: optionalId(product?.variantId || product?.selectedSize?.id),
    selectedSize: product?.selectedSize || null,
    selectedColor: product?.selectedColor || null,
    optionLabel: product?.optionLabel || "",
    optionVariants: product?.optionVariants || [],
  };
};

export const getWishlistItems = () => {
  try {
    const storedItems = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    return storedItems ? JSON.parse(storedItems) : [];
  } catch {
    return [];
  }
};

export const hasStoredWishlist = () => {
  try {
    return window.localStorage.getItem(WISHLIST_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
};

export const saveWishlistItems = (items) => {
  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
};

const isCustomerLoggedIn = () => {
  try {
    return Boolean(JSON.parse(window.localStorage.getItem("petcare_customer_session") || "null")?.token);
  } catch {
    return false;
  }
};

const mergeWishlistItems = (serverItems = [], localItems = []) => {
  const merged = [];
  [...localItems, ...serverItems].forEach((rawItem) => {
    const item = normalizeWishlistProduct(rawItem);
    const exists = merged.some(
      (wishlistItem) =>
        wishlistItem.id === item.id ||
        wishlistItem.slug === item.slug ||
        wishlistItem.productId === item.productId,
    );
    if (!exists) merged.push(item);
  });
  return merged;
};

export const isWishlistItemSaved = (product) => {
  const item = normalizeWishlistProduct(product);
  return getWishlistItems().some(
    (wishlistItem) =>
      wishlistItem.id === item.id ||
      wishlistItem.slug === item.slug ||
      wishlistItem.productId === item.productId,
  );
};

const removeWishlistMatch = (items, product) => {
  const item = normalizeWishlistProduct(product);
  return items.filter(
    (wishlistItem) =>
      wishlistItem.id !== item.id &&
      wishlistItem.slug !== item.slug &&
      wishlistItem.productId !== item.productId,
  );
};

const removeWishlistMatches = (items, products = []) => {
  const removeItems = products.map(normalizeWishlistProduct);
  return items.filter(
    (wishlistItem) =>
      !removeItems.some(
        (item) =>
          wishlistItem.id === item.id ||
          wishlistItem.slug === item.slug ||
          wishlistItem.productId === item.productId,
      ),
  );
};

const persistWishlistRemote = (items) => {
  if (!isCustomerLoggedIn()) return;
  wishlistApi.syncWishlist(items).catch(() => {});
};

export const syncWishlistFromApi = async () => {
  if (!isCustomerLoggedIn()) return getWishlistItems();

  try {
    const hasLocalWishlist = hasStoredWishlist();
    const localItems = getWishlistItems();
    if (hasLocalWishlist) {
      const normalizedLocalItems = mergeWishlistItems([], localItems);
      saveWishlistItems(normalizedLocalItems);
      await wishlistApi.syncWishlist(normalizedLocalItems).catch(() => {});
      return normalizedLocalItems;
    }

    const serverItems = await wishlistApi.getWishlist();
    const normalizedServerItems = mergeWishlistItems(serverItems, []);
    saveWishlistItems(normalizedServerItems);
    return normalizedServerItems;
  } catch {
    return getWishlistItems();
  }
};

export const addWishlistItem = (product) => {
  const item = normalizeWishlistProduct(product);
  const items = getWishlistItems();
  const exists = items.some(
    (wishlistItem) =>
      wishlistItem.id === item.id ||
      wishlistItem.slug === item.slug ||
      wishlistItem.productId === item.productId,
  );

  if (exists) {
    return { items, added: false, item };
  }

  const nextItems = [item, ...items];
  saveWishlistItems(nextItems);
  if (isCustomerLoggedIn()) {
    wishlistApi.addItem(item).catch(() => persistWishlistRemote(nextItems));
  }
  return { items: nextItems, added: true, item };
};

export const removeWishlistItem = (productIdOrSlug) => {
  const nextItems = getWishlistItems().filter(
    (item) =>
      item.id !== productIdOrSlug &&
      item.slug !== productIdOrSlug &&
      item.productId !== productIdOrSlug,
  );
  saveWishlistItems(nextItems);
  if (isCustomerLoggedIn()) {
    wishlistApi.removeItem(productIdOrSlug).catch(() => persistWishlistRemote(nextItems));
  }
  return nextItems;
};

export const removeWishlistProduct = (product) => {
  const item = normalizeWishlistProduct(product);
  const currentItems = getWishlistItems();
  const nextItems = removeWishlistMatch(currentItems, item);
  if (nextItems.length === currentItems.length) return currentItems;

  saveWishlistItems(nextItems);
  if (isCustomerLoggedIn()) {
    wishlistApi.removeItem(item.id).catch(() => persistWishlistRemote(nextItems));
  }
  return nextItems;
};

export const removeWishlistProducts = (products = []) => {
  const currentItems = getWishlistItems();
  const nextItems = removeWishlistMatches(currentItems, products);
  if (nextItems.length === currentItems.length) return currentItems;

  saveWishlistItems(nextItems);
  persistWishlistRemote(nextItems);
  return nextItems;
};

export const toggleWishlistItem = (product) => {
  const item = normalizeWishlistProduct(product);
  const items = getWishlistItems();
  const exists = isWishlistItemSaved(item);

  if (!exists) {
    return addWishlistItem(item);
  }

  const nextItems = removeWishlistMatch(items, item);
  saveWishlistItems(nextItems);
  if (isCustomerLoggedIn()) {
    wishlistApi.removeItem(item.id).catch(() => persistWishlistRemote(nextItems));
  }
  return { items: nextItems, added: false, removed: true, item };
};
