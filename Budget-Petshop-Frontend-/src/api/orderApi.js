import api from "./axios";

const parseJsonMaybe = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return { address: String(value) };
  }
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatAddress = (address) => {
  const parsed = parseJsonMaybe(address);
  if (!parsed) return "";
  return [
    parsed.address,
    parsed.street,
    parsed.city,
    parsed.state,
    parsed.zip,
    parsed.zipCode,
    parsed.country,
  ]
    .filter(Boolean)
    .join(", ");
};

export const normalizeOrder = (order = {}) => {
  if (!order || typeof order !== "object") return null;
  const id = String(
    order.id ||
      order._id ||
      order.orderId ||
      order.orderNumber ||
      order.reference ||
      order.trackingId ||
      order.trackingNumber ||
      `ORD-${Date.now()}`
  );

  const status =
    order.status || order.orderStatus || order.deliveryStatus || "Pending";

  const rawItems = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.orderItems)
    ? order.orderItems
    : Array.isArray(order.products)
    ? order.products
    : [];

  const items = rawItems.map((item, index) => {
    const p = item.product || (typeof item.productId === "object" ? item.productId : {});
    const price = Number(
      item.price ??
        item.sellPrice ??
        item.salePrice ??
        item.unitPrice ??
        (typeof p === "object" ? p.price ?? p.salePrice ?? p.sellPrice : 0) ??
        0
    );
    const quantity = Number(item.quantity || item.qty || item.count || 1);
    const productName =
      item.name ||
      item.title ||
      item.productName ||
      (typeof p === "object" ? p.name || p.title : "") ||
      "Product";

    const image =
      item.image ||
      item.thumbnail ||
      item.productImage ||
      (typeof p === "object"
        ? p.image || p.thumbnail || (Array.isArray(p.images) ? p.images[0] : "")
        : "") ||
      "";

    return {
      id:
        item.id ||
        item._id ||
        (typeof item.productId === "string" || typeof item.productId === "number"
          ? item.productId
          : typeof p === "object"
          ? p._id || p.id
          : null) ||
        `${id}-${index}`,
      productId:
        (typeof item.productId === "string" || typeof item.productId === "number"
          ? item.productId
          : typeof p === "object"
          ? p._id || p.id
          : null) ||
        item.id ||
        item._id,
      name: productName,
      title: productName,
      quantity,
      price,
      image,
      sku: item.sku || (typeof p === "object" ? p.sku : "") || "",
    };
  });

  const total = Number(
    order.total ?? order.totalAmount ?? order.grandTotal ?? order.amount ?? 0
  );
  const subtotal = Number(order.subtotal ?? order.subTotal ?? total);
  const shipping = Number(
    order.shipping ?? order.shippingCost ?? order.shippingFee ?? 0
  );
  const tax = Number(order.tax ?? order.taxAmount ?? 0);
  const discount = Number(order.discount ?? order.discountAmount ?? 0);

  return {
    ...order,
    id,
    status,
    date: formatDate(
      order.date || order.orderDate || order.createdAt || order.updatedAt
    ),
    total,
    subtotal,
    shipping,
    tax,
    discount,
    address:
      order.address || formatAddress(order.shippingAddress || order.address),
    shippingAddress:
      parseJsonMaybe(order.shippingAddress) || order.shippingAddress,
    trackingId: order.trackingId || order.trackingNumber || id,
    items,
  };
};

export const uploadPrescription = async (file) => {
  const formData = new FormData();
  formData.append("prescription", file);

  const res = await api.post("/customer-panel/checkout/prescription", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data || res.data;
};

export const orderApi = {
  uploadPrescription,

  createOrder: async (payload) => {
    const res = await api.post("/customer-panel/orders", payload);
    const data = res.data?.data ?? res.data;
    return normalizeOrder(data);
  },

  getMyOrders: async () => {
    const res = await api.get("/customer-panel/orders");
    const rawData = res.data?.data ?? res.data;
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.orders)
      ? rawData.orders
      : Array.isArray(res.data?.orders)
      ? res.data.orders
      : [];
    return list.map(normalizeOrder).filter(Boolean);
  },

  getOrderById: async (id) => {
    const res = await api.get(`/customer-panel/orders/${encodeURIComponent(id)}`);
    const data = res.data?.data ?? res.data;
    return normalizeOrder(data);
  },

  cancelOrder: async (id) => {
    const res = await api.patch(`/customer-panel/orders/${encodeURIComponent(id)}/cancel`);
    const data = res.data?.data ?? res.data;
    return normalizeOrder(data);
  },
};

