import api from "./axios";

const capitalizeStatus = (status) => {
  if (!status || typeof status !== "string") return null;
  const lower = status.trim().toLowerCase();
  if (lower === "delivered") return "Delivered";
  if (lower === "shipped") return "Shipped";
  if (lower === "processing") return "Processing";
  if (lower === "pending") return "Pending";
  if (lower === "confirmed") return "Processing";
  if (lower === "cancelled" || lower === "canceled") return "Cancelled";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const normalizeOrder = (order) => {
  if (!order) return order;

  const rawStatus =
    order.status ||
    order.orderStatus ||
    order.order_status ||
    order.deliveryStatus ||
    order.currentStatus ||
    order.state;

  const status = capitalizeStatus(rawStatus) || "Pending";

  const isStripe =
    order.payment?.method?.toLowerCase()?.includes("stripe") ||
    order.paymentMethod?.toLowerCase()?.includes("stripe") ||
    order.payment?.paymentIntentId ||
    order.paymentStatus?.toLowerCase() === "paid";

  return {
    ...order,
    id: order.id || order._id || order.orderId,
    status: status,
    paymentStatus: isStripe ? "Paid" : (order.paymentStatus || "Pending"),
    grandTotal: Number(order.grandTotal ?? order.total ?? order.amount ?? 0),
    date: order.date ?? order.createdAt ?? new Date().toISOString(),
  };
};

export const orderApi = {
  createOrder: async (payload) => {
    const res = await api.post("/customer-panel/orders", payload);
    return normalizeOrder(res.data.data);
  },

  getMyOrders: async () => {
    const res = await api.get("/customer-panel/orders");
    const list = res.data.data || res.data || [];
    return Array.isArray(list) ? list.map(normalizeOrder) : [];
  },

  getOrders: async () => {
    const res = await api.get("/customer-panel/orders");
    const list = res.data.data || res.data || [];
    return Array.isArray(list) ? list.map(normalizeOrder) : [];
  },

  getOrderById: async (id) => {
    const res = await api.get(`/customer-panel/orders/${encodeURIComponent(id)}`);
    return normalizeOrder(res.data.data || res.data);
  },

  uploadPrescription: async (file) => {
    try {
      const formData = new FormData();
      formData.append('prescription', file);

      const res = await api.post('/customer-panel/checkout/prescription', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("API prescription upload failed or endpoint missing, using local fallback URL:", err);
        return {
          url: URL.createObjectURL(file),
          filename: file.name,
          uploadedAt: new Date().toISOString(),
        };
      }
      throw err;
    }
  },
};

