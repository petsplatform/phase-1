import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getOrderByIdApi } from "../../helper/axiosInstance";
import { orderHistory } from "../../data/profile";
import { Search, Package, ExternalLink, Calendar, Barcode, FileText, Truck } from "lucide-react";

const SHIPMENT_STEPS = ["Pending", "Packed", "Shipped", "OutForDelivery", "Delivered"];
const SHIPMENT_STEP_LABELS = {
  Pending: "Order Placed",
  Packed: "Processing",
  Shipped: "Shipped",
  OutForDelivery: "Out for Delivery",
  Delivered: "Delivered",
};

function getShipmentActiveIndex(statusRaw = "") {
  const status = String(statusRaw).toLowerCase().replace(/_/g, "").replace(/\s+/g, "");
  if (status.includes("delivered") || status.includes("completed")) return 4;
  if (status.includes("outfor")) return 3;
  if (status.includes("shipped") || status.includes("intransit") || status.includes("dispatched")) return 2;
  if (status.includes("packed") || status.includes("processing") || status.includes("ready")) return 1;
  return 0;
}

const getStatusColor = (status) => {
  switch (String(status).toLowerCase()) {
    case "delivered":
      return "#00b894"; // green
    case "cancelled":
      return "#d63031"; // red
    case "processing":
    case "confirmed":
    case "shipped":
      return "#0984e3"; // blue
    case "pending":
      return "#fdcb6e"; // orange
    default:
      return "#7d5fff"; // purple
  }
};

export default function OrderTrackingTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const performSearch = async (queryId) => {
    if (!queryId) return;
    const cleanId = queryId.trim();

    // Check mock history first
    const found = orderHistory.find(
      (o) => o.id.toLowerCase() === cleanId.toLowerCase()
    );
    if (found) {
      const rawStatus = found.shipmentStatus || found.status || "Pending";
      setSelectedOrder({
        ...found,
        courierName: found.courierName || found.courier || "N/A",
        trackingNumber: found.trackingNumber || found.trackingId || "N/A",
        awbNumber: found.awbNumber || found.awb || "N/A",
        trackingUrl: found.trackingUrl || found.tracking_url || null,
        rawStatus: rawStatus,
        estimatedDelivery: found.estimatedDeliveryDate || found.estimatedDelivery || null,
        activeStepIndex: getShipmentActiveIndex(rawStatus)
      });
      return;
    }

    // Otherwise check backend API
    try {
      const res = await getOrderByIdApi(cleanId);
      const apiOrder = res?.data || res;
      if (apiOrder) {
        const rawStatus =
          apiOrder.shipmentStatus ||
          apiOrder.shipment_status ||
          apiOrder.shipment?.status ||
          apiOrder.shipment?.shipmentStatus ||
          apiOrder.status ||
          "Pending";
        const itemsList = apiOrder.items 
          ? apiOrder.items.map((it) => `${it.productName || it.name || "Product"} (x${it.quantity || 1})`).join(", ") 
          : "No items";
        
        const transformed = {
          id: apiOrder.id || apiOrder.orderNumber,
          items: itemsList,
          price: Number(apiOrder.totalAmount || apiOrder.total || 0),
          status: rawStatus,
          rawStatus: rawStatus,
          statusColor: getStatusColor(rawStatus),
          courierName: apiOrder.courierName || apiOrder.courier || apiOrder.shipment?.courierName || "N/A",
          trackingNumber: apiOrder.trackingNumber || apiOrder.trackingId || apiOrder.shipment?.trackingNumber || "N/A",
          awbNumber: apiOrder.awbNumber || apiOrder.awb || apiOrder.shipment?.awbNumber || "N/A",
          trackingUrl: apiOrder.trackingUrl || apiOrder.tracking_url || apiOrder.shipment?.trackingUrl || null,
          estimatedDelivery: apiOrder.estimatedDeliveryDate || apiOrder.estimated_delivery_date || apiOrder.estimatedDelivery || null,
          activeStepIndex: getShipmentActiveIndex(rawStatus)
        };
        setSelectedOrder(transformed);
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error("Failed to fetch order tracking:", err);
      setSelectedOrder(null);
    }
  };

  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setSearchQuery(orderIdParam);
      performSearch(orderIdParam);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setSearchParams({ tab: "tracking", orderId: trimmed });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
          Order Tracking
        </h2>
        <p className="text-sm sm:text-base font-semibold text-deep-navy/50 mt-1.5">
          Enter your order ID to track your shipment in real time.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="rounded-2xl border border-[#e8eef3] bg-white p-6 sm:p-8 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-deep-navy/30" />
            <input
              type="text"
              maxLength={50}
              placeholder="Enter Order ID (e.g., BP-3042)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#e0e5ec] bg-white pl-12 pr-4 py-3.5 text-base font-bold text-deep-navy outline-none focus:border-primary-green focus:ring-2 focus:ring-primary-green/10 transition-all placeholder:text-deep-navy/35"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto rounded-xl bg-primary-green px-8 py-3.5 text-sm font-black text-white hover:bg-dark-green transition-colors cursor-pointer shrink-0"
          >
            Track Order
          </button>
        </div>
      </form>

      {/* Tracking Result */}
      {selectedOrder ? (
        (() => {
          const isCancelled = ["cancelled", "canceled", "failed", "rejected"].includes(
            String(selectedOrder.rawStatus || selectedOrder.status || "")
              .toLowerCase()
              .trim(),
          );
          return (
            <div className="rounded-2xl border border-[#e8eef3] bg-white overflow-hidden space-y-6 p-6 sm:p-8">
              {/* Order Summary Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eef3] pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl font-black text-deep-navy">
                      {selectedOrder.id}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-4 py-1 text-[11px] font-black text-white uppercase tracking-wider"
                      style={{ backgroundColor: selectedOrder.statusColor || "#0984e3" }}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-deep-navy/55">
                    {selectedOrder.items}
                  </p>
                  <p className="text-lg font-black text-deep-navy mt-1">
                    ${Number(selectedOrder.price || 0).toFixed(2)}
                  </p>
                </div>

                {!isCancelled && selectedOrder.trackingUrl && (
                  <a
                    href={selectedOrder.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-primary-green px-5 py-2.5 text-xs font-black text-white hover:bg-dark-green transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    Track Shipment
                  </a>
                )}
              </div>

              {/* 4-Card Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-[#e8eef3]">
                <div className="p-3.5 bg-white rounded-xl border border-[#e8eef3] min-w-0">
                  <p className="text-[10px] font-black text-deep-navy/50 uppercase flex items-center gap-1">
                    <Truck size={12} className="text-primary-green shrink-0" /> Courier
                  </p>
                  <p className="text-xs font-black text-deep-navy capitalize mt-1 truncate">
                    {selectedOrder.courierName}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#e8eef3] min-w-0">
                  <p className="text-[10px] font-black text-deep-navy/50 uppercase flex items-center gap-1">
                    <Barcode size={12} className="text-primary-green shrink-0" /> Tracking #
                  </p>
                  <p className="text-xs font-black text-deep-navy font-mono mt-1 break-all">
                    {selectedOrder.trackingNumber}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#e8eef3] min-w-0">
                  <p className="text-[10px] font-black text-deep-navy/50 uppercase flex items-center gap-1">
                    <FileText size={12} className="text-primary-green shrink-0" /> AWB #
                  </p>
                  <p className="text-xs font-black text-deep-navy font-mono mt-1 break-all">
                    {selectedOrder.awbNumber}
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-[#e8eef3] min-w-0">
                  <p className="text-[10px] font-black text-deep-navy/50 uppercase flex items-center gap-1">
                    <Calendar size={12} className="text-primary-green shrink-0" /> Est. Delivery
                  </p>
                  <p className="text-xs font-black text-deep-navy mt-1 truncate">
                    {selectedOrder.estimatedDelivery
                      ? new Date(selectedOrder.estimatedDelivery).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Shipment Progress Bar */}
              <div className="border border-[#e8eef3] bg-white p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs font-black text-deep-navy">
                  <span>Shipment Progress</span>
                  <span className={`font-bold ${isCancelled ? "text-rose-600" : "text-deep-navy/60"}`}>
                    {selectedOrder.rawStatus}
                  </span>
                </div>

                {isCancelled ? (
                  <div className="rounded-xl px-4 py-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm font-bold text-center">
                    This order has been cancelled. Shipment tracking is no longer active.
                  </div>
                ) : (
                  <>
                    <div className="h-2.5 overflow-hidden rounded-full bg-deep-navy/10">
                      <div
                        className="h-full rounded-full bg-primary-green transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(15, (((selectedOrder.activeStepIndex ?? 0) + 1) / SHIPMENT_STEPS.length) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {SHIPMENT_STEPS.map((stepKey, idx) => (
                        <span
                          key={stepKey}
                          className={`rounded-xl px-1 h-9 flex items-center justify-center text-center text-[9px] sm:text-[10px] font-black transition-all ${
                            idx <= (selectedOrder.activeStepIndex ?? 0)
                              ? "bg-primary-green/15 text-primary-green"
                              : "bg-slate-100 text-deep-navy/35"
                          }`}
                        >
                          <span className="hidden sm:inline">
                            {SHIPMENT_STEP_LABELS[stepKey] || stepKey}
                          </span>
                          <span className="inline sm:hidden truncate">
                            {stepKey === "Pending"
                              ? "Placed"
                              : stepKey === "Packed"
                                ? "Packed"
                                : stepKey === "OutForDelivery"
                                  ? "Out"
                                  : stepKey === "Delivered"
                                    ? "Delivered"
                                    : stepKey}
                          </span>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()
      ) : searchQuery && !selectedOrder ? (
        <div className="rounded-2xl border border-[#e8eef3] bg-white p-12 text-center">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-slate-50 mb-5">
            <Package className="h-8 w-8 text-deep-navy/30" />
          </div>
          <h3 className="text-lg font-black text-deep-navy mb-1.5">
            No order found
          </h3>
          <p className="text-sm font-semibold text-deep-navy/50">
            Please check your order ID and try again. Try: BP-3042, BP-2981, or
            BP-2710
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-white/60 p-12 text-center">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-soft-mint mb-5">
            <Truck className="h-8 w-8 text-primary-green" />
          </div>
          <h3 className="text-lg font-black text-deep-navy mb-1.5">
            Track Your Order
          </h3>
          <p className="text-sm font-semibold text-deep-navy/50">
            Enter your order ID above to see real-time tracking updates
          </p>
        </div>
      )}
    </div>
  );
}

