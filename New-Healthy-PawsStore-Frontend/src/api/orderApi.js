import { apiRequest } from "./client";

function formatAddress(address) {
  if (!address) return "Address not available";

  if (typeof address === "string") {
    const trimmed = address.trim();
    if (!trimmed) return "Address not available";

    try {
      return formatAddress(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }

  if (typeof address === "object") {
    const fullName = address.fullName || address.name;
    const street = address.address || address.line1 || address.street;
    const cityLine = [
      address.city,
      address.state,
      address.postalCode || address.zip,
    ]
      .filter(Boolean)
      .join(", ");
    return (
      [fullName, address.phone, street, cityLine].filter(Boolean).join(", ") ||
      "Address not available"
    );
  }

  return String(address);
}

function normalizeOrderItem(item = {}, index = 0) {
  const title =
    item.title ||
    item.name ||
    item.productName ||
    item.product?.name ||
    item.product?.title ||
    "Product";

  return {
    ...item,
    id: item.id || item.productId || item.sku || `order-item-${index}`,
    productId:
      item.productId ||
      item.product?._id ||
      item.product?.id ||
      item.id ||
      `prod-${index}`,
    title,
    name: item.name || title,
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    image: item.image || item.product?.image || item.product?.images?.[0] || "",
  };
}

function normalizeOrder(order = {}) {
  const rawStatus = String(
    order.shipmentStatus ||
      order.shipment_status ||
      order.shipment?.shipmentStatus ||
      order.orderStatus ||
      order.status ||
      "pending",
  )
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/\s+/g, "");

  let status = "pending";
  if (rawStatus.includes("delivered") || rawStatus.includes("completed"))
    status = "delivered";
  else if (rawStatus.includes("outfor")) status = "out-for-delivery";
  else if (rawStatus.includes("shipped") || rawStatus.includes("intransit"))
    status = "shipped";
  else if (rawStatus.includes("processing") || rawStatus.includes("packed"))
    status = "processing";
  else if (rawStatus.includes("cancelled") || rawStatus.includes("canceled"))
    status = "cancelled";
  else if (rawStatus.includes("confirmed")) status = "confirmed";
  else status = "pending";

  const items = Array.isArray(order.items)
    ? order.items.map(normalizeOrderItem)
    : [];

  const rawEstDate =
    order.estimatedDeliveryDate ||
    order.shipment?.estimatedDeliveryDate ||
    order.estimatedDelivery ||
    order.estimated_delivery;
  let formattedEstDate = null;
  if (rawEstDate && rawEstDate !== "N/A" && rawEstDate !== "—" && rawEstDate !== "Processing") {
    const d = new Date(rawEstDate);
    if (!isNaN(d.getTime())) {
      formattedEstDate = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else {
      formattedEstDate = String(rawEstDate);
    }
  }

  const courierName =
    order.courierName ||
    order.courier ||
    order.shipment?.courierName ||
    order.carrier ||
    null;

  const trackingNumber =
    order.trackingNumber ||
    order.trackingId ||
    order.shipment?.trackingNumber ||
    null;

  const awbNumber =
    order.awbNumber ||
    order.awb ||
    order.shipment?.awbNumber ||
    null;

  return {
    ...order,
    id: order.orderId || order.id,
    date: order.orderDate || order.date || order.createdAt,
    status,
    total: Number(order.total || order.pricing?.total || 0),
    items,
    courierName,
    trackingNumber,
    awbNumber,
    trackingUrl:
      order.trackingUrl ||
      order.tracking_url ||
      order.shipment?.trackingUrl ||
      null,
    estimatedDelivery: formattedEstDate,
    carrier: courierName,
    address: formatAddress(order.shippingAddress || order.address),
  };
}

export const orderApi = {
  async getOrders() {
    const result = await apiRequest("/customer-panel/orders");
    return (Array.isArray(result) ? result : []).map(normalizeOrder);
  },

  async getOrder(id) {
    return normalizeOrder(await apiRequest(`/customer-panel/orders/${id}`));
  },

  async cancelOrder(id) {
    return apiRequest(`/customer-panel/orders/${id}/cancel`, { method: "PATCH" });
  },
};
