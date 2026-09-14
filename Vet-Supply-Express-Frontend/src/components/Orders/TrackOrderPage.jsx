import React, { useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { OrderContext } from "../../context/OrderContext";
import ProductImage from "../Common/ProductImage";
import {
  Truck, Package, ArrowLeft, Check,
  MapPin, Clock, AlertCircle, ExternalLink, Calendar, Barcode, FileText
} from "lucide-react";

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
  const { orderId } = useParams();
  const { getOrder } = useContext(OrderContext);
  const order = getOrder(orderId);

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#EAF5FC] flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-[#9FB3C8]" />
        </div>
        <h2 className="font-heading font-black text-2xl text-[#102A43]">Order Not Found</h2>
        <p className="text-sm text-[#627D98]">No order found with ID: <strong>{orderId}</strong></p>
        <Link to="/my-orders" className="bg-[#0874C9] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#F28C18] transition-colors">
          My Orders
        </Link>
      </div>
    );
  }

  const courierName = order.courierName || order.courier || order.shipment?.courierName || "N/A";
  const trackingNumber = order.trackingNumber || order.trackingId || order.shipment?.trackingNumber || "N/A";
  const awbNumber = order.awbNumber || order.awb || order.shipment?.awbNumber || "N/A";
  const trackingUrl = order.trackingUrl || order.tracking_url || order.shipment?.trackingUrl || null;
  const rawStatus = order.shipmentStatus || order.shipment_status || order.status || "Pending";
  const calcActiveIndex = getShipmentActiveIndex(rawStatus);
  const isCancelled = isCancelledOrder(order);

  const estDate = order.estimatedDelivery
    ? new Date(order.estimatedDelivery).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
      })
    : "N/A";
  const orderDate = order.date
    ? new Date(order.date).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      })
    : "";

  return (
    <div className="min-h-screen bg-[#F7FAFC] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link to="/my-orders" className="inline-flex items-center gap-2 text-sm font-bold text-[#627D98] hover:text-[#0874C9] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        {/* Header card */}
        <div className="bg-[#0B2D4F] rounded-3xl p-6 md:p-8 text-white mb-6 relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[#F28C18] text-xs font-bold uppercase tracking-widest mb-3">
              <Truck className="w-4 h-4" /> Order Tracking
            </div>
            <h1 className="font-heading font-black text-2xl md:text-3xl mb-1">Track Your Order</h1>
            <p className="text-slate-400 text-sm font-heading font-bold">{order.id}</p>

            <div className="flex flex-wrap gap-4 mt-5">
              <div className="bg-white/10 rounded-2xl px-4 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Placed On</p>
                <p className="text-sm font-bold text-white">{orderDate}</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Est. Delivery</p>
                <p className="text-sm font-bold text-[#F28C18]">{estDate}</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-2.5">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status</p>
                <p className="text-sm font-bold text-emerald-400">{rawStatus}</p>
              </div>
            </div>
          </div>

          {trackingUrl && !isCancelled && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="relative z-10 bg-[#F28C18] hover:bg-[#d9790f] text-white font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 transition-colors shrink-0"
            >
              <ExternalLink size={14} />
              Track Shipment
            </a>
          )}
        </div>

        {/* 4-Card Metadata Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-[#D9E8F2] shadow-sm mb-6">
          <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-[#D9E8F2] min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
              <Truck size={12} className="text-[#0874C9] shrink-0" /> Courier
            </p>
            <p className="text-xs font-black text-[#102A43] capitalize mt-1 truncate" title={courierName}>
              {courierName}
            </p>
          </div>

          <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-[#D9E8F2] min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
              <Barcode size={12} className="text-[#0874C9] shrink-0" /> Tracking #
            </p>
            <p className="text-xs font-black text-[#102A43] font-mono mt-1 truncate" title={trackingNumber}>
              {trackingNumber}
            </p>
          </div>

          <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-[#D9E8F2] min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
              <FileText size={12} className="text-[#0874C9] shrink-0" /> AWB #
            </p>
            <p className="text-xs font-black text-[#102A43] font-mono mt-1 truncate" title={awbNumber}>
              {awbNumber}
            </p>
          </div>

          <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-[#D9E8F2] min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-[#627D98] uppercase flex items-center gap-1 truncate">
              <Calendar size={12} className="text-[#0874C9] shrink-0" /> Est. Delivery
            </p>
            <p className="text-xs font-black text-[#102A43] mt-1 truncate">
              {estDate}
            </p>
          </div>
        </div>

        {/* Shipment Progress Bar */}
        {isCancelled ? (
          <div className="mb-6 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700 shadow-sm sm:p-6">
            This order has been cancelled. Shipment tracking is no longer available.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-4 sm:p-6 md:p-8 mb-6 space-y-3">
          <div className="flex justify-between items-center text-xs font-black text-[#102A43]">
            <span>Shipment Progress</span>
            <span className="text-[#627D98] font-bold">{rawStatus}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#D9E8F2]">
            <div
              className="h-full rounded-full bg-[#0874C9] transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(15, ((calcActiveIndex + 1) / SHIPMENT_STEPS.length) * 100))}%`,
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
                    idx <= calcActiveIndex
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

        {/* Delivery Address */}
        {order.address && (
          <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6 mb-6">
            <h3 className="font-heading font-bold text-sm text-[#102A43] uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0874C9]" /> Delivering To
            </h3>
            <p className="font-bold text-sm text-[#102A43]">{order.address.fullName}</p>
            <p className="text-xs text-[#627D98] mt-0.5">{order.address.street}</p>
            <p className="text-xs text-[#627D98]">{order.address.city}, {order.address.state} {order.address.zip}, {order.address.country}</p>
          </div>
        )}

        {/* Items summary */}
        <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6 mb-8">
          <h3 className="font-heading font-bold text-sm text-[#102A43] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#0874C9]" /> Items in This Order
          </h3>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <ProductImage src={item.image} alt={item.name} product={item} className="w-12 h-12 rounded-xl object-cover border border-[#D9E8F2] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#102A43] truncate">{item.name}</p>
                  <p className="text-xs text-[#627D98]">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-black text-[#0874C9] shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/" className="flex-1 flex items-center justify-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold py-3.5 rounded-2xl transition-all duration-300 cursor-pointer">
            Continue Shopping
          </Link>
          <Link to={`/order-confirmation/${order.id}`} className="flex-1 flex items-center justify-center gap-2 border border-[#D9E8F2] text-[#627D98] hover:text-[#0874C9] font-bold py-3.5 rounded-2xl transition-all cursor-pointer">
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
