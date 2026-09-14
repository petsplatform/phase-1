import React, { useContext, useState } from "react";
import { Search, Truck, ExternalLink, Calendar, Barcode, FileText, ChevronRight, Package } from "lucide-react";
import AccountLayout from "./AccountLayout";
import { OrderContext } from "../../context/OrderContext";

const SHIPMENT_STEPS = ["Pending", "Packed", "Shipped", "OutForDelivery", "Delivered"];
const SHIPMENT_STEP_LABELS = {
  Pending: "Order Placed",
  Packed: "Processing",
  Shipped: "Shipped",
  OutForDelivery: "Out for Delivery",
  Delivered: "Delivered",
};

const normalizeStatus = (status) => String(status || "").toLowerCase().replace(/_/g, "").replace(/\s+/g, "");

const isCancelledOrder = (order) => {
  const statuses = [
    order?.shipmentStatus,
    order?.shipment_status,
    order?.shipment?.status,
    order?.shipment?.shipmentStatus,
    order?.shipment?.shipment_status,
    order?.status,
    order?.orderStatus,
  ];

  return statuses.some((status) => {
    const normalized = normalizeStatus(status);
    return normalized === "cancelled" || normalized === "canceled";
  });
};

function getShipmentActiveIndex(statusRaw = "") {
  const status = normalizeStatus(statusRaw);
  if (status.includes("delivered") || status.includes("completed")) return 4;
  if (status.includes("outfor")) return 3;
  if (status.includes("shipped") || status.includes("intransit") || status.includes("dispatched")) return 2;
  if (status.includes("packed") || status.includes("processing") || status.includes("ready")) return 1;
  return 0;
}

const TrackOrderPage = () => {
  const { orders, getOrder } = useContext(OrderContext);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const order = getOrder(trimmed);
    setFound(order || null);
    setSearched(true);
  };

  const selectOrder = (order) => {
    setQuery(order.id);
    setFound(order);
    setSearched(true);
  };

  const courierName = found?.courierName || found?.courier || found?.shipment?.courierName || "N/A";
  const trackingNumber = found?.trackingNumber || found?.trackingId || found?.shipment?.trackingNumber || "N/A";
  const awbNumber = found?.awbNumber || found?.awb || found?.shipment?.awbNumber || "N/A";
  const trackingUrl = found?.trackingUrl || found?.tracking_url || found?.shipment?.trackingUrl || null;
  const rawStatus = found?.shipmentStatus || found?.shipment_status || found?.status || "Pending";
  const estimatedDelivery = found?.estimatedDeliveryDate || found?.estimatedDelivery || null;
  const activeStepIndex = getShipmentActiveIndex(rawStatus);
  const isCancelled = isCancelledOrder(found);

  return (
    <AccountLayout title="Track Orders" subtitle="Enter your order ID to see real-time delivery status.">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#627D98] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
            placeholder="Enter Order ID (e.g. ORD-1785742315305)"
            className="w-full bg-white border border-[#D9E8F2] rounded-xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0874C9]/30 focus:border-[#0874C9] transition-all"
          />
        </div>
        <button type="submit" className="bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all duration-300 cursor-pointer shrink-0">
          Track Order
        </button>
      </form>

      {/* Quick select from order history */}
      {orders.length > 0 && !searched && (
        <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] mb-3">Recent Orders</p>
          <div className="flex flex-col gap-2">
            {orders.slice(0, 5).map((order) => (
              <button
                key={order.id}
                onClick={() => selectOrder(order)}
                className="flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl border border-[#D9E8F2] hover:border-[#0874C9]/40 hover:bg-[#EAF5FC] transition-all cursor-pointer group min-w-0"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs sm:text-sm font-bold text-[#0874C9] font-heading truncate">{order.id}</p>
                  <p className="text-[11px] text-[#627D98]">{new Date(order.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-[#102A43]">${order.grandTotal.toFixed(2)}</span>
                  <ChevronRight className="w-4 h-4 text-[#9FB3C8] group-hover:text-[#0874C9] transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {searched && !found && (
        <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm p-8 sm:p-12 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <Search className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="font-heading font-black text-base sm:text-lg text-[#102A43]">Order not found</h3>
          <p className="text-xs sm:text-sm text-[#627D98] max-w-xs">No order matches <strong className="break-all">{query}</strong>. Please check the ID and try again.</p>
        </div>
      )}

      {found && (
        <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm overflow-hidden space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0B2D4F] to-[#0874C9] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Order Tracking</p>
              <p className="font-heading font-black text-lg sm:text-xl text-white truncate">{found.id}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-white/80">
                <span>Placed: {new Date(found.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="hidden sm:inline">•</span>
                <span>Status: <strong className={isCancelled ? "text-rose-300 font-black" : "text-emerald-300 font-black"}>{isCancelled ? "Cancelled" : (rawStatus === "Pending" ? "Order Placed" : rawStatus)}</strong></span>
              </div>
            </div>

            {trackingUrl && !isCancelled && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#F28C18] hover:bg-[#d9790f] text-white font-black px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors w-full sm:w-auto shrink-0 shadow-xs"
              >
                <ExternalLink size={14} />
                Track Shipment
              </a>
            )}
          </div>

          {/* 4-Card Info Grid */}
          <div className="px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 bg-[#F7FAFC] p-3 sm:p-4 rounded-2xl border border-[#D9E8F2]">
              <div className="p-3 bg-white rounded-xl border border-[#D9E8F2] min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
                  <Truck size={12} className="text-[#0874C9] shrink-0" /> Courier
                </p>
                <p className="text-xs font-black text-[#102A43] capitalize mt-1 truncate" title={courierName}>
                  {courierName}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D9E8F2] min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
                  <Barcode size={12} className="text-[#0874C9] shrink-0" /> Tracking #
                </p>
                <p className="text-xs font-black text-[#102A43] font-mono mt-1 truncate" title={trackingNumber}>
                  {trackingNumber}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D9E8F2] min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
                  <FileText size={12} className="text-[#0874C9] shrink-0" /> AWB #
                </p>
                <p className="text-xs font-black text-[#102A43] font-mono mt-1 truncate" title={awbNumber}>
                  {awbNumber}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#D9E8F2] min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
                  <Calendar size={12} className="text-[#0874C9] shrink-0" /> Est. Delivery
                </p>
                <p className="text-xs font-black text-[#102A43] mt-1 truncate">
                  {estimatedDelivery
                    ? new Date(estimatedDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Shipment Progress Bar */}
          <div className="px-4 sm:px-6 pb-6">
            {isCancelled ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700 sm:p-5">
                This order has been cancelled. Shipment tracking is no longer available.
              </div>
            ) : (
              <div className="border border-[#D9E8F2] bg-white p-4 sm:p-5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-xs font-black text-[#102A43]">
                <span>Shipment Progress</span>
                <span className="text-[#627D98] font-bold">{rawStatus}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#D9E8F2]">
                <div
                  className="h-full rounded-full bg-[#0874C9] transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(15, ((activeStepIndex + 1) / SHIPMENT_STEPS.length) * 100))}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-5 gap-1 pt-1">
                {SHIPMENT_STEPS.map((stepKey, idx) => {
                  const labelFull = SHIPMENT_STEP_LABELS[stepKey] || stepKey;
                  const labelShort =
                    stepKey === "Pending" ? "Placed" :
                    stepKey === "Packed" ? "Packed" :
                    stepKey === "Shipped" ? "Shipped" :
                    stepKey === "OutForDelivery" ? "Out" : "Delivered";
                  return (
                    <span
                      key={stepKey}
                      className={`rounded-lg px-1 py-1.5 text-center text-[9px] sm:text-[10px] font-black leading-tight transition-colors truncate ${
                        idx <= activeStepIndex
                          ? "bg-[#0874C9]/15 text-[#0874C9]"
                          : "bg-[#F7FAFC] text-[#9FB3C8]"
                      }`}
                      title={labelFull}
                    >
                      <span className="sm:hidden">{labelShort}</span>
                      <span className="hidden sm:inline">{labelFull}</span>
                    </span>
                  );
                })}
              </div>
              </div>
            )}

            {/* Items */}
            <div className="mt-6 border-t border-[#D9E8F2] pt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] mb-3">Items in this Order</p>
              <div className="flex flex-col gap-2">
                {found.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl p-3 min-w-0">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#D9E8F2]/60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#102A43] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#627D98]">Qty: {item.quantity} · ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state (no orders at all) */}
      {orders.length === 0 && !searched && (
        <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm p-8 sm:p-14 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#EAF5FC] flex items-center justify-center">
            <Truck className="w-8 h-8 text-[#9FB3C8]" />
          </div>
          <h3 className="font-heading font-black text-lg sm:text-xl text-[#102A43]">No orders to track</h3>
          <p className="text-xs sm:text-sm text-[#627D98] max-w-xs">You haven't placed any orders yet. Enter an order ID above or start shopping.</p>
        </div>
      )}
    </AccountLayout>
  );
};

export default TrackOrderPage;
