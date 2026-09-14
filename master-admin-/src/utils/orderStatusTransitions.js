export const ORDER_STATUS_FLOW = {
  pending: ["processing"],
  confirmed: ["processing"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const FINAL_ORDER_STATUSES = new Set(["delivered", "cancelled"]);

export function normalizeOrderStatus(status) {
  return String(status || "").toLowerCase();
}

export function getAllowedOrderStatuses(status) {
  const currentStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_FLOW[currentStatus] || [];
}

export function canChangeOrderStatus(currentStatus, nextStatus) {
  const current = normalizeOrderStatus(currentStatus);
  const next = normalizeOrderStatus(nextStatus);
  return current === next || getAllowedOrderStatuses(current).includes(next);
}

export function getStatusSelectOptions(status) {
  const currentStatus = normalizeOrderStatus(status);
  return [currentStatus, ...getAllowedOrderStatuses(currentStatus)];
}

export function isFinalOrderStatus(status) {
  return FINAL_ORDER_STATUSES.has(normalizeOrderStatus(status));
}
