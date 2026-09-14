export function getOrderStatus(order) {
  if (!order) return "Pending";
  const rawStatus =
    order.shipmentStatus ||
    order.shipment_status ||
    order.deliveryStatus ||
    order.trackingStatus ||
    order.status ||
    order.orderStatus ||
    order.order_status ||
    "Pending";

  if (typeof rawStatus === "object" && rawStatus !== null) {
    return (
      rawStatus.name ||
      rawStatus.status ||
      rawStatus.title ||
      rawStatus.label ||
      "Pending"
    );
  }
  return String(rawStatus);
}

export function formatStatusText(status = "") {
  if (!status) return "Order Placed";
  const norm = String(status).toLowerCase().replace(/_/g, " ").trim();
  if (["pending", "placed", "order placed", "created"].includes(norm)) {
    return "Order Placed";
  }
  if (["packed", "processing"].includes(norm)) {
    return "Processing";
  }
  if (["outfordelivery", "out for delivery"].includes(norm)) {
    return "Out for Delivery";
  }
  if (["shipped", "in transit", "intransit", "dispatched"].includes(norm)) {
    return "Shipped";
  }
  if (["delivered", "completed"].includes(norm)) {
    return "Delivered";
  }
  return String(status).replace(/_/g, " ").trim();
}

export function getStatusStyle(status = "") {
  const normalized = String(status).toLowerCase().replace(/_/g, " ");

  if (["cancelled", "canceled", "failed", "rejected"].includes(normalized)) {
    return "bg-red-50 text-red-500 border-red-200";
  }
  if (["delivered", "completed"].includes(normalized)) {
    return "bg-[#EBF5EB] text-[#2E7D32] border-[#E2EFE2]";
  }
  if (
    [
      "shipped",
      "out for delivery",
      "in transit",
      "dispatched",
      "dispatch",
    ].includes(normalized)
  ) {
    return "bg-blue-50 text-blue-600 border-blue-200";
  }
  if (
    [
      "pending",
      "processing",
      "confirmed",
      "placed",
      "order placed",
      "paid",
      "on hold",
    ].includes(normalized)
  ) {
    return "bg-amber-50 text-amber-600 border-amber-100";
  }
  return "bg-amber-50 text-amber-600 border-amber-100";
}

export function canCancelOrder(order) {
  if (!order) return false;
  const status = getOrderStatus(order).toLowerCase().replace(/_/g, " ");
  return ![
    "delivered",
    "completed",
    "shipped",
    "cancelled",
    "canceled",
  ].includes(status);
}

export function getPaymentStatus(order) {
  if (!order) return "Paid";
  const raw =
    order.paymentStatus ||
    order.payment_status ||
    order.paymentState ||
    order.paymentInfo?.status ||
    (order.isPaid ? "Paid" : null) ||
    order.paymentMethod ||
    order.paymentMode ||
    "Paid";

  if (typeof raw === "object" && raw !== null) {
    return raw.name || raw.status || raw.label || "Paid";
  }
  const str = String(raw).trim();
  if (!str || str.toLowerCase() === "undefined") return "Paid";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getPaymentStatusStyle(paymentStatus = "") {
  const norm = String(paymentStatus).toLowerCase();
  if (["paid", "success", "completed", "succeeded", "cod"].includes(norm)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (["pending", "unpaid", "awaiting", "processing"].includes(norm)) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  if (["failed", "refused", "refunded", "cancelled"].includes(norm)) {
    return "bg-red-50 text-red-600 border-red-200";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export function getDiscountAmount(order) {
  if (!order) return 0;
  const directDiscount = Number(
    order.discountAmount ??
      order.discount ??
      order.discountPrice ??
      order.couponDiscount ??
      order.savings ??
      0,
  );
  if (directDiscount > 0) return directDiscount;

  const items = order.items || order.orderItems || order.products || [];
  if (Array.isArray(items)) {
    return items.reduce((sum, item) => {
      const orig = Number(item.originalPrice || item.mrp || 0);
      const price = Number(item.price || item.sellPrice || 0);
      const qty = Number(item.quantity || 1);
      if (orig > price) {
        return sum + (orig - price) * qty;
      }
      return sum;
    }, 0);
  }
  return 0;
}

export function getTotalPrice(order) {
  if (!order) return 0;
  const total = Number(
    order.totalAmount ??
      order.grandTotal ??
      order.total ??
      order.finalAmount ??
      order.amount ??
      0,
  );
  if (total > 0) return total;

  const items = order.items || order.orderItems || order.products || [];
  if (Array.isArray(items)) {
    return items.reduce((sum, item) => {
      const price = Number(item.price || item.sellPrice || 0);
      const qty = Number(item.quantity || 1);
      return sum + price * qty;
    }, 0);
  }
  return 0;
}
