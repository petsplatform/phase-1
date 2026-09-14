import { orderApi } from "../api/orderApi";

export function getOrders() {
  return orderApi.getOrders();
}

export async function trackOrder(query) {
  const normalized = query.trim().replace(/^#/, "").toUpperCase();
  const orders = await orderApi.getOrders();
  const order = orders.find(
    (item) =>
      String(item.id).toUpperCase() === normalized ||
      String(item.trackingNumber).toUpperCase() === normalized,
  );

  if (!order) throw new Error("Order not found.");
  return order;
}

