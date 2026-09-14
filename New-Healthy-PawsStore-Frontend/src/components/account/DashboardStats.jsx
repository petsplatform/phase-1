import { ChevronRight } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const payableStatuses = new Set([
  "paid",
  "succeeded",
  "success",
  "completed",
  "captured",
]);

const unpaidStatuses = new Set([
  "cancelled",
  "canceled",
  "failed",
  "refunded",
  "voided",
]);

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "");
}

function getPaymentStatus(order) {
  return normalizeStatus(
    order.paymentStatus ||
      order.payment_status ||
      order.payment?.status ||
      order.payment?.paymentStatus ||
      order.paymentRecord?.status ||
      order.transactionStatus,
  );
}

function shouldCountTowardSpent(order) {
  const paymentStatus = getPaymentStatus(order);

  if (paymentStatus) return payableStatuses.has(paymentStatus);
  return !unpaidStatuses.has(normalizeStatus(order.status));
}

export default function DashboardStats({ orders = [] }) {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const totalSpent = orders
    .filter(shouldCountTowardSpent)
    .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  const stats = [
    ["Total Orders", totalOrders, "View all orders"],
    ["Pending Orders", pendingOrders, "View orders"],
    ["Delivered Orders", deliveredOrders, "View delivered"],
    ["Total Spent", currencyFormatter.format(totalSpent), "View details"],
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, action]) => (
        <article key={label} className="min-h-[104px] rounded-[13px] border border-borderSoft bg-white px-4 pb-3 pt-4 shadow-card">
          <p className="text-[11px] font-semibold text-muted">{label}</p>
          <strong className="mt-2 block text-[24px] font-extrabold leading-none text-textMain">{value}</strong>
          <a href="/account/orders" className="mt-4 flex items-center justify-between text-[11px] font-extrabold text-secondaryDark">
            {action}
            <ChevronRight size={14} />
          </a>
        </article>
      ))}
    </div>
  );
}
