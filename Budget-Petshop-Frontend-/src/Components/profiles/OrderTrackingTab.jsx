import {
  Truck,
  CheckCircle,
  Clock,
  ExternalLink,
  Calendar,
  Barcode,
  FileText,
} from "lucide-react";

const SHIPMENT_STEPS = [
  "Pending",
  "Packed",
  "Shipped",
  "OutForDelivery",
  "Delivered",
];

const SHIPMENT_STEP_LABELS = {
  Pending: "Order Placed",
  Packed: "Processing",
  Shipped: "Shipped",
  OutForDelivery: "Out for Delivery",
  Delivered: "Delivered",
};

const SHIPMENT_STEP_SHORT_LABELS = {
  Pending: "Placed",
  Packed: "Packed",
  Shipped: "Shipped",
  OutForDelivery: "Out",
  Delivered: "Delivered",
};

function getShipmentActiveIndex(statusRaw = "") {
  const status = String(statusRaw)
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/\s+/g, "");
  if (status.includes("delivered") || status.includes("completed")) return 4;
  if (status.includes("outfor")) return 3;
  if (
    status.includes("shipped") ||
    status.includes("intransit") ||
    status.includes("dispatched")
  )
    return 2;
  if (
    status.includes("packed") ||
    status.includes("processing") ||
    status.includes("ready")
  )
    return 1;
  return 0;
}

export default function OrderTrackingTab({
  trackIdInput,
  setTrackIdInput,
  trackingInfo,
  trackingError,
  handleTrackOrder,
}) {
  const courierName =
    trackingInfo?.courierName || trackingInfo?.courier || "N/A";
  const trackingNumber =
    trackingInfo?.trackingNumber || trackingInfo?.trackingId || "N/A";
  const awbNumber = trackingInfo?.awbNumber || trackingInfo?.awb || "N/A";
  const trackingUrl =
    trackingInfo?.trackingUrl || trackingInfo?.tracking_url || null;
  const estimatedDelivery =
    trackingInfo?.estimatedDeliveryDate || trackingInfo?.estimatedDelivery;
  const rawStatus =
    trackingInfo?.shipmentStatus ||
    trackingInfo?.shipment_status ||
    trackingInfo?.shipment?.status ||
    trackingInfo?.shipment?.shipmentStatus ||
    trackingInfo?.status ||
    "Pending";
  const isCancelled = ["cancelled", "canceled", "failed", "rejected"].includes(
    String(rawStatus || "").toLowerCase().trim()
  );

  return (
    <div className="text-left w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-on-background border-b border-outline pb-4 mb-6">
        Order Tracking
      </h2>

      <form
        onSubmit={handleTrackOrder}
        className="bg-surface-tint/20 border border-outline rounded-3xl p-4 sm:p-5 mb-6"
      >
        <p className="text-xs text-charcoal-text font-semibold mb-3">
          Enter your Budget PetShop order ID or tracking number below:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g., order_123456 or Tracking Number"
            value={trackIdInput}
            onChange={(e) => setTrackIdInput(e.target.value)}
            className="flex-1 min-w-0 rounded-xl border border-outline-strong bg-white px-4 py-3 text-sm text-on-background outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
          />
          <button
            type="submit"
            className="rounded-full bg-secondary hover:bg-secondary/90 px-6 py-3 text-xs font-bold text-white transition cursor-pointer whitespace-nowrap shadow-sm active:scale-95 shrink-0"
          >
            Track Shipment
          </button>
        </div>
        {trackingError && (
          <p className="text-xs text-accent font-medium mt-2">
            {trackingError}
          </p>
        )}
        <p className="text-[10px] text-charcoal-text mt-2 font-medium">
          Use the order ID shown in your order history or confirmation email.
        </p>
      </form>

      {trackingInfo ? (
        <div className="border border-outline rounded-3xl p-4 sm:p-6 bg-white space-y-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-4">
            <div className="min-w-0">
              <h3 className="font-bold text-on-background text-base sm:text-lg break-words">
                Tracking Status for{" "}
                <span className="text-secondary font-black font-mono">
                  {trackingInfo.id || trackingInfo.orderNumber}
                </span>
              </h3>
              <p className="text-xs text-charcoal-text mt-0.5 truncate" title={trackingNumber}>
                Carrier Tracking ID: {trackingNumber}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold border ${
                  isCancelled
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : rawStatus === "Delivered"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}
              >
                {rawStatus}
              </span>

              {!isCancelled && trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-white hover:bg-secondary/90 flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink size={13} />
                  Live Track
                </a>
              )}
            </div>
          </div>

          {/* Shipment Detail Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 bg-surface-tint/10 p-3 sm:p-3.5 rounded-2xl border border-outline/50">
            <div className="p-3 bg-white rounded-xl border border-outline/30 min-w-0 overflow-hidden">
              <p className="text-[10px] font-bold text-charcoal-text uppercase flex items-center gap-1">
                <Truck size={12} className="shrink-0" /> Courier
              </p>
              <p className="text-xs font-bold text-on-background capitalize mt-0.5 truncate" title={courierName}>
                {courierName}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-outline/30 min-w-0 overflow-hidden">
              <p className="text-[10px] font-bold text-charcoal-text uppercase flex items-center gap-1">
                <Barcode size={12} className="shrink-0" /> Tracking #
              </p>
              <p className="text-xs font-bold text-on-background font-mono mt-0.5 truncate" title={trackingNumber}>
                {trackingNumber}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-outline/30 min-w-0 overflow-hidden">
              <p className="text-[10px] font-bold text-charcoal-text uppercase flex items-center gap-1">
                <FileText size={12} className="shrink-0" /> AWB #
              </p>
              <p className="text-xs font-bold text-on-background font-mono mt-0.5 truncate" title={awbNumber}>
                {awbNumber}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-outline/30 min-w-0 overflow-hidden">
              <p className="text-[10px] font-bold text-charcoal-text uppercase flex items-center gap-1">
                <Calendar size={12} className="shrink-0" /> Est. Delivery
              </p>
              <p className="text-xs font-bold text-on-background mt-0.5 truncate">
                {estimatedDelivery
                  ? new Date(estimatedDelivery).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Shipment Progress Bar */}
          <div className="border border-outline/60 bg-surface-tint/5 p-4 sm:p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center text-xs font-bold text-on-background">
              <span>Shipment Progress</span>
              <span className={`font-extrabold ${isCancelled ? "text-rose-600" : "text-secondary"}`}>{rawStatus}</span>
            </div>

            {isCancelled ? (
              <div className="rounded-xl px-4 py-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm font-bold text-center">
                This order has been cancelled. Shipment tracking is no longer active.
              </div>
            ) : (
              <>
                {/* Progress Bar Line */}
                <div className="h-2.5 overflow-hidden rounded-full bg-outline/40">
                  <div
                    className="h-full rounded-full bg-secondary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((activeStepIndex + 1) / SHIPMENT_STEPS.length) * 100))}%`,
                    }}
                  />
                </div>

                {/* Step Badges Row */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {SHIPMENT_STEPS.map((stepKey, idx) => (
                    <span
                      key={stepKey}
                      className={`rounded-xl px-1 h-9 flex items-center justify-center text-center text-[9px] sm:text-[10px] font-extrabold transition-all ${
                        idx <= activeStepIndex
                          ? "bg-secondary/10 text-secondary"
                          : "bg-surface border border-outline/60 text-charcoal-text/40"
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
      ) : (
        <div className="text-center py-12 border border-outline rounded-3xl bg-surface-tint/5">
          <Truck
            size={36}
            className="mx-auto text-charcoal-text/40 mb-3 animate-bounce"
          />
          <h3 className="font-bold text-on-background">No Active Tracking</h3>
          <p className="text-xs text-charcoal-text mt-1 max-w-sm mx-auto">
            Enter an order code above to trace your packages in real time.
          </p>
        </div>
      )}
    </div>
  );
}
