import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Truck,
  ExternalLink,
  Package,
  Calendar,
  Barcode,
  FileText,
  Clock,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { orderApi } from "../../api/orderApi";
import {
  getOrderStatus,
  formatStatusText,
  canCancelOrder,
  getPaymentStatus,
  getPaymentStatusStyle,
  getDiscountAmount,
  getTotalPrice,
} from "../../utils/orderUtils";

function formatDate(date) {
  if (!date) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

function formatDateTime(date) {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

function getOrderItems(order) {
  return Array.isArray(order.items) ? order.items : [];
}

function findOrder(orders, queryId) {
  if (!queryId || !Array.isArray(orders)) return null;
  const q = String(queryId).trim().toLowerCase();
  return (
    orders.find((o) => {
      const id = String(o.id || "").toLowerCase();
      const orderNum = String(o.orderNumber || "").toLowerCase();
      const orderId = String(o.orderId || "").toLowerCase();
      const trackingId = String(o.trackingId || "").toLowerCase();
      const trackingNum = String(o.trackingNumber || "").toLowerCase();
      const awb = String(o.awbNumber || "").toLowerCase();
      return (
        id === q ||
        orderNum === q ||
        orderId === q ||
        trackingId === q ||
        trackingNum === q ||
        awb === q
      );
    }) || null
  );
}

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

function buildSteps(order) {
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];
  if (timeline.length) {
    return timeline.map((entry, index) => {
      const title =
        typeof entry === "string"
          ? entry
          : entry?.title ||
            entry?.status ||
            entry?.orderStatus ||
            "Status update";
      return {
        title: formatStatusText(title),
        desc:
          typeof entry === "object" && entry?.description
            ? entry.description
            : index === timeline.length - 1
              ? "Latest shipment update"
              : "Order progress update",
        time: formatDateTime(
          entry?.date ||
            entry?.createdAt ||
            order.updatedAt ||
            order.orderDate ||
            order.createdAt,
        ),
        done: true,
      };
    });
  }

  const stepsList = [];
  const currentStatus = order.shipmentStatus || getOrderStatus(order);
  const activeIdx = getShipmentActiveIndex(currentStatus);

  // Step 1: Order Placed / Created
  stepsList.push({
    title: "Order Placed & Shipment Created",
    desc: `Courier assignment: ${order.courierName || order.courier || "Standard Dispatch"}`,
    time: formatDateTime(
      order.shipmentCreatedAt ||
        order.createdAt ||
        order.orderDate ||
        order.date,
    ),
    done: true,
  });

  // Step 2: Processing / Shipped
  stepsList.push({
    title: "Shipped",
    desc: order.shippedAt
      ? "Shipment departed transit hub"
      : activeIdx >= 2
        ? "Order is on the way with courier"
        : "Pending carrier dispatch",
    time: formatDateTime(order.shippedAt),
    done: activeIdx >= 2 || Boolean(order.shippedAt),
  });

  // Step 3: Out for Delivery
  stepsList.push({
    title: "Out for Delivery",
    desc: order.outForDeliveryAt
      ? "Courier agent is out for final delivery"
      : activeIdx >= 3
        ? "Package loaded into delivery vehicle"
        : "Awaiting arrival at destination facility",
    time: formatDateTime(order.outForDeliveryAt),
    done: activeIdx >= 3 || Boolean(order.outForDeliveryAt),
  });

  // Step 4: Delivered
  stepsList.push({
    title: "Delivered",
    desc: order.deliveredAt
      ? "Package safely delivered"
      : activeIdx >= 4
        ? "Delivered to customer"
        : "Estimated delivery: " +
          formatDate(order.estimatedDeliveryDate || order.estimatedDelivery),
    time: formatDateTime(order.deliveredAt),
    done: activeIdx >= 4 || Boolean(order.deliveredAt),
  });

  return stepsList;
}

export default function OrderTrackingTab() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    orderApi
      .getMyOrders()
      .then((data) => {
        if (!active) return;
        const apiOrders = Array.isArray(data) ? data : [];
        let localOrders = [];
        try {
          const stored = localStorage.getItem("happypet_orders");
          if (stored) localOrders = JSON.parse(stored);
        } catch {
          localOrders = [];
        }

        const mergedMap = new Map();
        apiOrders.forEach((ord) => {
          const key = String(ord.id || ord.orderNumber || ord.orderId || "");
          if (key) mergedMap.set(key, ord);
        });
        localOrders.forEach((ord) => {
          const key = String(ord.id || ord.orderNumber || ord.orderId || "");
          if (key && !mergedMap.has(key)) {
            mergedMap.set(key, ord);
          }
        });

        setOrders(Array.from(mergedMap.values()));
      })
      .catch((error) => {
        console.error("Orders could not be loaded via API:", error);
        let localOrders = [];
        try {
          const stored = localStorage.getItem("happypet_orders");
          if (stored) localOrders = JSON.parse(stored);
        } catch {
          localOrders = [];
        }
        if (active) setOrders(localOrders);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeOrder = useMemo(
    () => findOrder(orders, activeOrderId),
    [activeOrderId, orders],
  );

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId || orders.length === 0) return;

    const match = findOrder(orders, orderId);
    if (match) {
      const targetId = match.orderNumber || match.id;
      queueMicrotask(() => {
        setActiveOrderId(targetId);
        setSearchQuery(targetId);
        setErrorMsg("");
      });
    }
  }, [orders, searchParams]);

  useEffect(() => {
    if (!activeOrderId) return;
    let isMounted = true;
    orderApi
      .getOrderById(activeOrderId)
      .then((updated) => {
        if (!isMounted || !updated) return;
        setOrders((prev) =>
          prev.map((ord) => {
            const key = String(ord.id || ord.orderNumber || ord.orderId || "");
            const matchKey = String(
              updated.id || updated.orderNumber || updated.orderId || "",
            );
            return key && key === matchKey ? { ...ord, ...updated } : ord;
          }),
        );
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [activeOrderId]);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (!query) {
      setErrorMsg("Please enter an Order ID or Tracking Number.");
      setActiveOrderId(null);
      return;
    }

    const match = findOrder(orders, query);
    if (!match) {
      setErrorMsg("No matching order found in your account.");
      setActiveOrderId(null);
      return;
    }

    setActiveOrderId(match.orderNumber || match.id);
    setErrorMsg("");
  };

  const handleQuickClick = (id) => {
    setSearchQuery(id);
    setActiveOrderId(id);
    setErrorMsg("");
  };

  const handleCancelOrder = async () => {
    if (!activeOrder || !canCancelOrder(activeOrder)) return;

    try {
      setIsCancelling(true);
      const targetId = activeOrder.id || activeOrder.orderNumber;
      const updatedOrder = await orderApi.cancelOrder(targetId);
      setOrders((prev) =>
        prev.map((order) =>
          (order.id && order.id === updatedOrder.id) ||
          (order.orderNumber && order.orderNumber === updatedOrder.orderNumber)
            ? updatedOrder
            : order,
        ),
      );
      toast.success("Order cancelled successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Order could not be cancelled.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const steps = activeOrder ? buildSteps(activeOrder) : [];
  const firstItem = activeOrder ? getOrderItems(activeOrder)[0] : null;

  // Shipment Detail Extractor
  const courierName =
    activeOrder?.courierName ||
    activeOrder?.courier ||
    activeOrder?.shipment?.courierName ||
    activeOrder?.shipment?.courier ||
    "N/A";
  const trackingNumber =
    activeOrder?.trackingNumber ||
    activeOrder?.trackingId ||
    activeOrder?.shipment?.trackingNumber ||
    activeOrder?.shipment?.trackingId ||
    "N/A";
  const awbNumber =
    activeOrder?.awbNumber ||
    activeOrder?.awb ||
    activeOrder?.shipment?.awbNumber ||
    activeOrder?.shipment?.awb ||
    "N/A";
  const trackingUrl =
    activeOrder?.trackingUrl ||
    activeOrder?.tracking_url ||
    activeOrder?.shipment?.trackingUrl ||
    (trackingNumber && trackingNumber !== "N/A"
      ? `https://www.google.com/search?q=${encodeURIComponent(trackingNumber)}`
      : null);
  const rawShipmentStatus =
    activeOrder?.shipmentStatus ||
    activeOrder?.shipment_status ||
    activeOrder?.shipment?.status ||
    activeOrder?.shipment?.shipmentStatus ||
    getOrderStatus(activeOrder);
  const isCancelled =
    ["cancelled", "canceled", "failed", "rejected"].includes(
      String(rawShipmentStatus || "").toLowerCase().trim(),
    ) ||
    ["cancelled", "canceled", "failed", "rejected"].includes(
      String(getOrderStatus(activeOrder) || "").toLowerCase().trim(),
    );
  const activeStepIndex = getShipmentActiveIndex(rawShipmentStatus);
  const estimatedDelivery = formatDate(
    activeOrder?.estimatedDeliveryDate ||
      activeOrder?.estimated_delivery_date ||
      activeOrder?.estimatedDelivery,
  );

  return (
    <div className="animate-in fade-in duration-300 text-left flex-grow flex flex-col justify-between">
      <div>
        <div className="border-b border-brand-purple/5 pb-5 mb-6">
          <h2 className="text-2xl font-display font-extrabold text-brand-purple tracking-tight">
            Order Tracking
          </h2>
          <p className="text-xs text-brand-brown/60 mt-1 font-semibold">
            Real-time shipment status and courier tracking for your account
            orders
          </p>
        </div>

        <div className="border border-gray-200 p-6 rounded-[24px] mb-6 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
          <form onSubmit={handleTrackSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-brand-purple/80">
              Enter one of your HappyPetRx order IDs or Tracking Numbers below:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                maxLength={50}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="e.g., ORD-123456 or Tracking Number"
                className="flex-grow px-4.5 py-3.5 bg-white border border-[#5C3EBA]/20 focus:border-[#5C3EBA] focus:ring-1 focus:ring-[#5C3EBA]/30 rounded-2xl text-brand-purple text-xs font-semibold outline-none transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-brand-purple hover:bg-brand-purple/80 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer flex-shrink-0"
              >
                Track Order
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-500 mt-1">{errorMsg}</p>
            )}

            <div className="text-[10px] text-brand-brown/65 font-bold">
              {isLoading ? (
                "Loading your orders..."
              ) : orders.length > 0 ? (
                <>
                  Recent order IDs:{" "}
                  {orders.slice(0, 3).map((order, index) => {
                    const displayId =
                      order.orderNumber || order.orderId || order.id;
                    return (
                      <span key={order.id || displayId}>
                        {index > 0 && " "}
                        <button
                          type="button"
                          onClick={() => handleQuickClick(displayId)}
                          className="text-[#6D53C6] hover:underline font-extrabold cursor-pointer"
                        >
                          {displayId}
                        </button>
                      </span>
                    );
                  })}
                </>
              ) : (
                "No orders found in your account."
              )}
            </div>
          </form>
        </div>

        {activeOrder && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Box with Track Button */}
            <div className="border border-gray-200 p-6 rounded-[20px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm">
              <div className="space-y-1.5 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-brand-brown/60 font-bold">
                    Active Order
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getPaymentStatusStyle(getPaymentStatus(activeOrder))}`}
                  >
                    Payment: {getPaymentStatus(activeOrder)}
                  </span>
                </div>
                <h4 className="font-extrabold text-brand-purple text-base mt-0.5">
                  {activeOrder.orderNumber ||
                    activeOrder.orderId ||
                    activeOrder.id}{" "}
                  -{" "}
                  {firstItem?.name ||
                    firstItem?.product?.name ||
                    firstItem?.title ||
                    "HappyPetRx order"}
                </h4>
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-brand-brown/60">
                  <span>
                    Placed{" "}
                    {formatDate(
                      activeOrder.orderDate ||
                        activeOrder.createdAt ||
                        activeOrder.date,
                    )}
                  </span>
                  {getDiscountAmount(activeOrder) > 0 && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      Discount: -${getDiscountAmount(activeOrder).toFixed(2)}
                    </span>
                  )}
                  <span className="text-brand-purple font-extrabold">
                    Total: ${getTotalPrice(activeOrder).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] text-brand-brown/60 font-bold uppercase tracking-wider">
                    Shipment Status
                  </p>
                  <p
                    className={`font-extrabold text-sm mt-0.5 ${
                      isCancelled ? "text-red-500" : "text-[#a855f7]"
                    }`}
                  >
                    {formatStatusText(rawShipmentStatus)}
                  </p>
                </div>

                {!isCancelled && trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Track Shipment
                  </a>
                )}
              </div>
            </div>

            {/* Shipment Metadata Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="border border-gray-100 bg-[#fffdf7] p-3.5 sm:p-4 rounded-[16px]">
                <div className="flex items-center gap-1.5 text-brand-purple/60 mb-1">
                  <Truck className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider truncate">
                    Courier
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-brand-purple capitalize truncate">
                  {courierName}
                </p>
              </div>

              <div className="border border-gray-100 bg-[#fffdf7] p-3.5 sm:p-4 rounded-[16px]">
                <div className="flex items-center gap-1.5 text-brand-purple/60 mb-1">
                  <Barcode className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider truncate">
                    Tracking Number
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-brand-purple font-mono break-all">
                  {trackingNumber}
                </p>
              </div>

              <div className="border border-gray-100 bg-[#fffdf7] p-3.5 sm:p-4 rounded-[16px]">
                <div className="flex items-center gap-1.5 text-brand-purple/60 mb-1">
                  <FileText className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider truncate">
                    AWB Number
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-brand-purple font-mono break-all">
                  {awbNumber}
                </p>
              </div>

              <div className="border border-gray-100 bg-[#fffdf7] p-3.5 sm:p-4 rounded-[16px]">
                <div className="flex items-center gap-1.5 text-brand-purple/60 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider truncate">
                    Est. Delivery
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-brand-purple truncate">
                  {estimatedDelivery}
                </p>
              </div>
            </div>

            {/* Shipment Progress Bar */}
            <div className="border border-gray-200 bg-white p-4 sm:p-5 rounded-[20px] space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-brand-purple">
                <span>Shipment Progress</span>
                <span
                  className={`font-semibold ${
                    isCancelled ? "text-red-500" : "text-brand-purple/60"
                  }`}
                >
                  {formatStatusText(rawShipmentStatus)}
                </span>
              </div>

              {isCancelled ? (
                <div className="rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold text-center">
                  This order has been cancelled. Shipment tracking is no longer active.
                </div>
              ) : (
                <>
                  <div className="h-2.5 overflow-hidden rounded-full bg-brand-purple/10">
                    <div
                      className="h-full rounded-full bg-brand-purple transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(15, ((activeStepIndex + 1) / SHIPMENT_STEPS.length) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {SHIPMENT_STEPS.map((stepKey, idx) => (
                      <span
                        key={stepKey}
                        className={`rounded-xl px-1 h-9 flex items-center justify-center text-center text-[9px] sm:text-[10px] font-extrabold transition-all ${
                          idx <= activeStepIndex
                            ? "bg-brand-purple/10 text-brand-purple"
                            : "bg-gray-100 text-brand-brown/40"
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
        )}
      </div>
    </div>
  );
}
