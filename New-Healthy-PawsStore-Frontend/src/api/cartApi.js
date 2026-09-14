import { apiRequest, getCustomerToken } from "./client";

export const CART_UPDATED_EVENT = "healthyPawsCartChange";
const GUEST_CART_KEY = "healthyPaws.guestCart";

function hasWindow() {
  return typeof window !== "undefined";
}

function notifyCartUpdated(items = []) {
  if (!hasWindow()) return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: items }));
}

function hasCustomerToken() {
  return Boolean(getCustomerToken());
}

function normalizeCartItem(item = {}) {
  const maxQuantity = Math.max(
    0,
    Number(item.maxQuantity ?? item.variantStock ?? item.stock ?? item.stockQuantity ?? 0) || 0,
  );
  const requestedQuantity = Math.max(1, Number(item.quantity) || 1);

  const prescriptionRequired = Boolean(
    item.prescriptionRequired ??
      item.product?.prescriptionRequired ??
      item.prescription_required ??
      false,
  );

  return {
    ...item,
    id: item.id || item.productId || item.slug,
    productId: item.productId || item.id,
    title: item.title || item.name || "Product",
    name: item.name || item.title || "Product",
    price: Number(item.price || item.pricing?.finalPrice || 0),
    maxQuantity,
    variantStock: maxQuantity || item.variantStock,
    quantity: maxQuantity > 0 ? Math.min(requestedQuantity, maxQuantity) : requestedQuantity,
    prescriptionRequired,
  };
}

function normalizeCartResult(result) {
  const items = Array.isArray(result)
    ? result
    : Array.isArray(result?.items)
      ? result.items
      : [];

  return items.map(normalizeCartItem);
}

function readGuestCart() {
  if (!hasWindow()) return [];

  try {
    return normalizeCartResult(JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) || "[]"));
  } catch {
    return [];
  }
}

function writeGuestCart(items = []) {
  const nextItems = normalizeCartResult(items);

  if (hasWindow()) {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(nextItems));
  }

  notifyCartUpdated(nextItems);
  return nextItems;
}

function addGuestCartItem(item) {
  const nextItem = normalizeCartItem(item);
  const items = readGuestCart();
  const existingIndex = items.findIndex((cartItem) => cartItem.id === nextItem.id);

  if (existingIndex >= 0) {
    const existingItem = items[existingIndex];
    const maxQuantity = Number(nextItem.maxQuantity || existingItem.maxQuantity || 0);
    const quantity = (Number(existingItem.quantity) || 0) + (Number(nextItem.quantity) || 1);

    items[existingIndex] = normalizeCartItem({
      ...existingItem,
      ...nextItem,
      quantity: maxQuantity > 0 ? Math.min(quantity, maxQuantity) : quantity,
    });
  } else {
    items.push(nextItem);
  }

  return writeGuestCart(items);
}

function updateGuestCartItem(id, quantity) {
  return writeGuestCart(
    readGuestCart().map((item) =>
      item.id === id ? normalizeCartItem({ ...item, quantity }) : item,
    ),
  );
}

function removeGuestCartItem(id) {
  return writeGuestCart(readGuestCart().filter((item) => item.id !== id));
}

async function writeCart(path, options = {}) {
  const result = await apiRequest(path, options);
  const items = normalizeCartResult(result);
  notifyCartUpdated(items);
  return items;
}

export const cartApi = {
  async getCart() {
    if (!hasCustomerToken()) return readGuestCart();

    const result = await apiRequest("/customer-panel/cart");
    return normalizeCartResult(result);
  },
  syncCart: (items) => {
    if (!hasCustomerToken()) return Promise.resolve(writeGuestCart(items));

    return writeCart("/customer-panel/cart", {
      method: "PUT",
      body: JSON.stringify({ items }),
    });
  },
  addItem: (item) => {
    if (!hasCustomerToken()) return Promise.resolve(addGuestCartItem(item));

    return writeCart("/customer-panel/cart/items", {
      method: "POST",
      body: JSON.stringify({ item }),
    });
  },
  updateItem: (id, quantity) => {
    if (!hasCustomerToken()) return Promise.resolve(updateGuestCartItem(id, quantity));

    return writeCart(`/customer-panel/cart/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },
  removeItem: (id) => {
    if (!hasCustomerToken()) return Promise.resolve(removeGuestCartItem(id));

    return writeCart(`/customer-panel/cart/items/${id}`, { method: "DELETE" });
  },
  clear: () => {
    if (!hasCustomerToken()) return Promise.resolve(writeGuestCart([]));

    return writeCart("/customer-panel/cart", { method: "DELETE" });
  },
};
