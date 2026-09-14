import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  X,
  Search,
  ShoppingBag,
  ChevronRight,
  Download,
  Eye,
  CreditCard,
  Tag,
  AlertCircle,
  Filter,
  Star,
} from "lucide-react";
import AccountLayout from "./AccountLayout";
import { OrderContext } from "../../context/OrderContext";
import ReviewModal from "../Orders/ReviewModal";

/* ─── Status Config ──────────────────────────────────────────────────────── */
const STATUS_META = {
  Pending: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    icon: Clock,
    label: "Pending",
  },
  Processing: {
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    icon: Clock,
    label: "Processing",
  },
  Shipped: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    icon: Truck,
    label: "Shipped",
  },
  Delivered: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: Package,
    label: "Delivered",
  },
  Cancelled: {
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    icon: X,
    label: "Cancelled",
  },
};

const getStatusMeta = (status) => {
  if (!status) return STATUS_META.Pending;
  const key = Object.keys(STATUS_META).find(
    (k) => k.toLowerCase() === status.toLowerCase()
  );
  return STATUS_META[key] || STATUS_META.Pending;
};

const PAYMENT_META = {
  Paid: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Pending: { badge: "bg-amber-50 text-amber-700 border-amber-200" },
  Failed: { badge: "bg-red-50 text-red-700 border-red-200" },
  Refunded: { badge: "bg-slate-50 text-slate-700 border-slate-200" },
};

const ALL_STATUSES = [
  "All",
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

/* ─── Invoice Print Helper ───────────────────────────────────────────────── */
const printInvoice = (order) => {
  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  const itemRows = order.items
    .map(
      (i) => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${i.price.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`,
    )
    .join("");

  win.document.write(`<!DOCTYPE html>
<html><head><title>Invoice — ${order.id}</title>
<style>
  body { font-family: system-ui, sans-serif; color: #073B66; margin: 0; padding: 32px; }
  h1   { font-size: 22px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #627D98; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th   { background: #073B66; color: white; padding: 10px 12px; text-align: left; }
  .total { text-align: right; font-size: 15px; font-weight: 900; margin-top: 16px; color: #087BC1; }
  .footer { margin-top: 32px; font-size: 11px; color: #9FB3C8; border-top: 1px solid #eee; padding-top: 12px; }
</style></head><body>
<h1>VetSupply<span style="color:#F28A16">Express</span></h1>
<div class="meta">Order ID: <strong>${order.id}</strong> &nbsp;|&nbsp; Date: ${new Date(order.date).toLocaleDateString()} &nbsp;|&nbsp; Status: ${order.status}</div>
<table>
  <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${itemRows}</tbody>
</table>
<div class="total">Grand Total: $${order.grandTotal.toFixed(2)}</div>
<div class="footer">Thank you for shopping with VetSupplyExpress · support@vetsupplyexpress.com</div>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
};

/* ─── Single Order Card ──────────────────────────────────────────────────── */
const OrderCard = ({ order, onOpenReview }) => {
  const navigate = useNavigate();
  const meta = getStatusMeta(order.status);
  const StatusIcon = meta.icon;
  const payMeta = PAYMENT_META[order.paymentStatus] || PAYMENT_META.Paid;
  const isDelivered = order.status?.toLowerCase() === "delivered";
  const isCancelled = order.status?.toLowerCase() === "cancelled";

  const orderDate = new Date(order.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const estDate = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  return (
    <div className="bg-white rounded-2xl border border-[#D9E8F2] shadow-sm overflow-hidden hover:border-[#087BC1]/30 hover:shadow-md transition-all duration-200">
      {/* Card Header */}
      <div className="bg-[#F3F9FD] border-b border-[#D9E8F2] p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 w-full sm:w-auto">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8]">
              Order ID
            </p>
            <p className="font-heading font-bold text-xs sm:text-sm text-[#087BC1] truncate">
              {order.id}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8]">
              Placed
            </p>
            <p className="text-xs font-bold text-[#073B66]">{orderDate}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8]">
              Total
            </p>
            <p className="text-xs sm:text-sm font-black text-[#073B66]">
              ${order.grandTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${payMeta.badge}`}
          >
            <CreditCard className="w-3 h-3" />
            {order.paymentStatus || "Paid"}
          </span>
          <span
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${meta.badge}`}
          >
            <StatusIcon className="w-3 h-3" />
            {order.status || meta.label}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5">
        {/* Product Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {order.items.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2.5 bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl p-2.5"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#D9E8F2]/60"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#073B66] truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-[#9FB3C8]">
                  Qty {item.quantity} · $
                  {(item.price * item.quantity).toFixed(2)}
                </p>
                {isDelivered && (
                  <button
                    type="button"
                    onClick={() => onOpenReview && onOpenReview(order, item)}
                    className="text-[10px] font-bold text-[#087BC1] hover:text-[#F28A16] flex items-center gap-1 mt-0.5 cursor-pointer"
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    Review item
                  </button>
                )}
              </div>
            </div>
          ))}
          {order.items.length > 4 && (
            <div className="bg-[#EAF5FC] border border-[#D9E8F2] rounded-xl p-2.5 flex items-center justify-center text-xs font-black text-[#087BC1]">
              +{order.items.length - 4} more
            </div>
          )}
        </div>

        {/* Footer: Delivery + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-[#F0F6FA]">
          {estDate && estDate !== "Invalid Date" && estDate !== "—" && estDate !== "N/A" ? (
            <div className="flex items-center gap-1.5 text-xs text-[#627D98]">
              <Truck className="w-3.5 h-3.5 text-[#F28A16] shrink-0" />
              <span>
                {order.status === "Delivered" ? "Delivered on " : "Est. Delivery: "}
                <strong className="text-[#073B66]">{estDate}</strong>
              </span>
            </div>
          ) : (
            <div />
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {isDelivered && (
              <button
                onClick={() => onOpenReview && onOpenReview(order)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                Add Review
              </button>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!isCancelled && (
                <Link
                  to="/account/track-order"
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold text-[#627D98] hover:text-[#087BC1] border border-[#D9E8F2] hover:border-[#087BC1]/30 px-3.5 py-2.5 rounded-xl transition-all duration-150 whitespace-nowrap"
                >
                  <Truck className="w-3.5 h-3.5 shrink-0" /> Track
                </Link>
              )}
              <button
                onClick={() => navigate(`/order-success/${order.id}`)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#073B66] hover:bg-[#087BC1] px-4 py-2.5 rounded-xl transition-all duration-150 cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" /> View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Orders Page ───────────────────────────────────────────────────── */
const OrdersPage = () => {
  const { orders } = useContext(OrderContext);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewProduct, setReviewProduct] = useState(null);

  const handleOpenReview = (order, product = null) => {
    setReviewOrder(order);
    setReviewProduct(product);
    setReviewModalOpen(true);
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      activeFilter === "All" ||
      o.status?.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <AccountLayout
      title="My Orders"
      subtitle="View, track, download invoices, and manage all your VetSupplyExpress orders."
    >
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E8F2] shadow-sm p-16 text-center flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#EAF5FC] flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-[#9FB3C8]" />
          </div>
          <div>
            <h3 className="font-heading font-black text-xl text-[#073B66]">
              No orders yet
            </h3>
            <p className="text-sm text-[#627D98] max-w-xs mt-1.5">
              Your order history will appear here once you place your first
              order.
            </p>
          </div>
          <Link
            to="/shop"
            className="bg-[#073B66] hover:bg-[#087BC1] text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" /> Start Shopping
          </Link>
        </div>
      ) : (
        <>
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#627D98] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID or product name…"
                className="w-full bg-[#EAF5FC]/40 border border-[#D9E8F2] rounded-xl pl-11 pr-4 py-3 text-sm text-[#073B66] focus:outline-none focus:ring-2 focus:ring-[#087BC1]/30 focus:border-[#087BC1] transition-all"
              />
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1.5 mb-5 whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-[#9FB3C8] shrink-0 pr-1">
              <Filter className="w-3.5 h-3.5" />
            </div>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setActiveFilter(s)}
                className={`text-[11px] font-bold px-3.5 py-1.5 rounded-full border transition-all duration-150 cursor-pointer shrink-0 whitespace-nowrap ${
                  activeFilter === s
                    ? "bg-[#073B66] text-white border-[#073B66]"
                    : "bg-white text-[#627D98] border-[#D9E8F2] hover:border-[#087BC1]/30 hover:text-[#073B66]"
                }`}
              >
                {s}
                {s !== "All" && (
                  <span className="ml-1 opacity-60">
                    ({orders.filter((o) => o.status?.toLowerCase() === s.toLowerCase()).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#D9E8F2] shadow-sm p-12 text-center flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-[#D9E8F2]" />
              <p className="text-sm text-[#627D98] font-medium">
                No orders match your filters.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All");
                }}
                className="text-xs font-bold text-[#087BC1] hover:text-[#F28A16] transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-[#9FB3C8] font-medium">
                Showing {filtered.length} of {orders.length} order
                {orders.length !== 1 ? "s" : ""}
              </p>
              {filtered.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onOpenReview={handleOpenReview}
                />
              ))}
            </div>
          )}

          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            order={reviewOrder}
            product={reviewProduct}
          />
        </>
      )}
    </AccountLayout>
  );
};

export default OrdersPage;
