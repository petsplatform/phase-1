import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AccountSidebar from "../../components/account/AccountSidebar";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrderContext";
import {
  Truck,
  Search,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

// --- Timeline step definitions ---
const STEPS = [
  { key: "Order Confirmed", label: "Order Placed", icon: CheckCircle2 },
  { key: "Processing", label: "Processing", icon: Package },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Out for Delivery", label: "Out for Delivery", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

// Given orderStatus string, return how many steps are "done"
function getStepIndex(status = "") {
  const s = String(status).toLowerCase().replace(/_/g, "").replace(/\s+/g, "");
  if (s.includes("delivered") || s.includes("completed")) return 4;
  if (s.includes("outfor") || s.includes("outfordelivery")) return 3;
  if (s.includes("shipped") || s.includes("intransit") || s.includes("dispatched")) return 2;
  if (s.includes("processing") || s.includes("packed") || s.includes("ready")) return 1;
  return 0; // Order Confirmed
}

// Format ISO date string to a readable label
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TrackOrderDashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const [searchParams] = useSearchParams();

  const activeUser = user || {
    firstName: "Guest",
    email: "guest@pawsandcare.com",
    mobile: "9876543210",
  };

  // Pre-fill from query param ?orderId=XXX (e.g. from My Orders page)
  const prefillId = searchParams.get("orderId") || "";

  const [orderId, setOrderId] = useState(prefillId);
  const [contact, setContact] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-track if prefill ID is present and user is logged in
  useEffect(() => {
    if (prefillId && orders.length > 0) {
      const found = orders.find(
        (o) => o.orderId.toLowerCase() === prefillId.toLowerCase(),
      );
      if (found) {
        setResult(found);
        setContact(found.contactDetails?.email || activeUser.email || "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillId, orders]);

  const handleTrack = (e) => {
    e?.preventDefault();
    setError("");
    setResult(null);

    const trimId = orderId.trim();

    if (!trimId) {
      setError("Please enter your Order ID.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const found = orders.find((o) => {
        return o.orderId.toLowerCase() === trimId.toLowerCase();
      });

      if (found) {
        setResult(found);
      } else {
        setError(
          `No order found for "${trimId}". Please check the order ID and try again.`,
        );
      }
      setLoading(false);
    }, 400);
  };

  const activeStatus = result?.shipmentStatus || result?.shipment_status || result?.shipment?.shipmentStatus || result?.orderStatus || result?.status || "";
  const stepIndex = result ? getStepIndex(activeStatus) : -1;
  const courierName = result?.courierName || result?.courier || result?.shipment?.courierName || result?.shipment?.courier || "N/A";
  const trackingNumber = result?.trackingNumber || result?.trackingId || result?.shipment?.trackingNumber || result?.shipment?.trackingId || "N/A";
  const awbNumber = result?.awbNumber || result?.awb || result?.shipment?.awbNumber || result?.shipment?.awb || "N/A";
  const trackingUrl = result?.trackingUrl || result?.tracking_url || result?.shipment?.trackingUrl || null;

  const handleCopyTracking = () => {
    if (!result || trackingNumber === "N/A") return;
    navigator.clipboard.writeText(trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const estimatedDeliveryRaw =
    result?.estimatedDeliveryDate ||
    result?.estimatedDelivery ||
    result?.shipment?.estimatedDeliveryDate ||
    "";

  const estimatedDelivery = (() => {
    if (result?.deliveryEstimate && result.deliveryEstimate !== "3-5 business days" && result.deliveryEstimate !== "N/A") {
      return result.deliveryEstimate;
    }
    if (estimatedDeliveryRaw && estimatedDeliveryRaw !== "—" && estimatedDeliveryRaw !== "3-5 business days") {
      const d = new Date(estimatedDeliveryRaw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return estimatedDeliveryRaw;
    }
    return "N/A";
  })();
  const totalItems = result
    ? result.items.reduce((s, i) => s + i.quantity, 0)
    : 0;
  const fullAddress = result?.shippingAddress
    ? [
        result.shippingAddress.streetAddress || result.shippingAddress.addressLine1 || result.shippingAddress.address,
        result.shippingAddress.apartment || result.shippingAddress.addressLine2,
        result.shippingAddress.city,
        result.shippingAddress.state,
        result.shippingAddress.postalCode || result.shippingAddress.zip,
        result.shippingAddress.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 text-left w-full min-w-0">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start min-w-0 w-full">
          {/* Sidebar */}
          <AccountSidebar />

          {/* Main Content */}
          <div className="flex-1 space-y-6 min-w-0 w-full">
            {/* Header */}
            <div className="min-w-0">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-brand-text">
                Track Order
              </h1>
              <p className="font-sans text-xs sm:text-sm text-brand-muted mt-1 leading-relaxed">
                Enter your order details to view the latest delivery status.
              </p>
            </div>

            {/* ── Tracking Form Card ─────────────────────────────── */}
            <div className="bg-brand-surface border border-brand-border/60 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm min-w-0 w-full">
              <form onSubmit={handleTrack} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="track-order-id"
                    className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide"
                  >
                    Order ID
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <ShoppingBag
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none"
                      />
                      <input
                        id="track-order-id"
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="e.g. PAC-984321"
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-brand-border bg-brand-bg/50 text-brand-text text-sm font-sans placeholder:text-brand-muted/50 focus:outline-none focus:border-brand-teal focus:bg-white transition-all duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-deep-teal disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 font-heading font-black text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 shrink-0 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Tracking…</span>
                        </>
                      ) : (
                        <>
                          <Search size={15} />
                          <span>Track Order</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-brand-muted font-sans pl-0.5">
                    Find this in your order confirmation email.
                  </p>
                </div>

                {/* Inline error */}
                {error && (
                  <div className="flex items-start gap-2.5 bg-brand-coral/5 border border-brand-coral/25 text-brand-coral rounded-xl px-4 py-3 text-xs font-sans">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </form>
            </div>

            {/* ── Result Area ────────────────────────────────────── */}
            {result && (
              <div className="space-y-5 min-w-0 w-full">
                {/* ── Shipment Details Card (TOP) ──────────────────────── */}
                <div className="bg-brand-surface border border-brand-border/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-sm space-y-4 min-w-0 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-heading font-black text-base sm:text-lg text-brand-text">
                      Shipment Details
                    </h3>
                    {trackingUrl && (
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-deep-teal text-white text-xs font-heading font-black transition-colors"
                      >
                        <ExternalLink size={13} />
                        Track Shipment
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 min-w-0">
                    {[
                      {
                        label: "Courier",
                        value: courierName,
                      },
                      {
                        label: "Tracking Number",
                        value: trackingNumber,
                      },
                      { label: "AWB Number", value: awbNumber },
                      {
                        label: "Est. Delivery",
                        value: estimatedDelivery,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="bg-brand-bg/50 rounded-2xl p-3 sm:p-3.5 border border-brand-border/40 space-y-0.5 min-w-0"
                      >
                        <p className="text-[9px] uppercase font-heading font-bold text-brand-muted tracking-wider truncate">
                          {label}
                        </p>
                        <p className="font-heading font-black text-xs text-brand-text leading-snug truncate" title={value}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Shipment Progress Card (BOTTOM) ───────────────────────── */}
                <div className="bg-brand-surface border border-brand-border/60 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-sm space-y-6 min-w-0 w-full">
                  <h3 className="font-heading font-black text-base sm:text-lg text-brand-text">
                    Shipment Progress
                  </h3>

                  {/* Desktop: Horizontal Timeline */}
                  <div className="hidden sm:block">
                    <div className="relative">
                      {/* Connector line */}
                      <div className="absolute top-5 left-0 right-0 h-0.5 bg-brand-border/60" />
                      {/* Progress fill */}
                      <div
                        className="absolute top-5 left-0 h-0.5 bg-brand-teal transition-all duration-700"
                        style={{
                          width: `${(stepIndex / (STEPS.length - 1)) * 100}%`,
                        }}
                      />
                      <div className="relative flex justify-between">
                        {STEPS.map((step, i) => {
                          const done = i <= stepIndex;
                          const current = i === stepIndex;
                          return (
                            <div
                              key={step.key}
                              className="flex flex-col items-center gap-2 flex-1"
                            >
                              {/* Dot */}
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-300 ${
                                  done
                                    ? current
                                      ? "bg-brand-coral border-brand-coral text-white shadow-lg ring-4 ring-brand-coral/20"
                                      : "bg-brand-teal border-brand-teal text-white shadow-sm"
                                    : "bg-white border-brand-border text-brand-muted"
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 size={17} />
                                ) : (
                                  <Clock size={15} />
                                )}
                              </div>
                              {/* Label */}
                              <p
                                className={`font-heading font-bold text-[10px] sm:text-xs text-center leading-tight max-w-[80px] ${
                                  current
                                    ? "text-brand-coral"
                                    : done
                                      ? "text-brand-teal"
                                      : "text-brand-muted"
                                }`}
                              >
                                {step.label}
                              </p>
                              {/* Date under done steps */}
                              {done && (
                                <p className="font-sans text-[9px] text-brand-muted text-center leading-none">
                                  {current
                                    ? "In Progress"
                                    : fmtDate(result.orderDate)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Vertical Timeline */}
                  <div className="sm:hidden relative">
                    <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-brand-border/60" />
                    <div
                      className="absolute left-[19px] top-0 w-0.5 bg-brand-teal transition-all duration-700"
                      style={{
                        height: `${((stepIndex + 0.5) / STEPS.length) * 100}%`,
                      }}
                    />
                    <div className="space-y-5">
                      {STEPS.map((step, i) => {
                        const done = i <= stepIndex;
                        const current = i === stepIndex;
                        return (
                          <div
                            key={step.key}
                            className="flex items-start gap-4 relative"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 shrink-0 transition-all duration-300 ${
                                done
                                  ? current
                                    ? "bg-brand-coral border-brand-coral text-white shadow-md ring-4 ring-brand-coral/20"
                                    : "bg-brand-teal border-brand-teal text-white shadow-sm"
                                  : "bg-white border-brand-border text-brand-muted"
                              }`}
                            >
                              {done ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <Clock size={14} />
                              )}
                            </div>
                            <div className="pt-2">
                              <p
                                className={`font-heading font-bold text-sm leading-none ${
                                  current
                                    ? "text-brand-coral"
                                    : done
                                      ? "text-brand-text"
                                      : "text-brand-muted"
                                }`}
                              >
                                {step.label}
                              </p>
                              {done && (
                                <p className="font-sans text-[10px] text-brand-muted mt-0.5">
                                  {current
                                    ? "In Progress"
                                    : fmtDate(result.orderDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Reset tracker */}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setOrderId("");
                    setContact("");
                    setError("");
                  }}
                  className="inline-flex items-center gap-1.5 text-brand-muted hover:text-brand-coral font-heading font-bold text-xs transition-colors duration-200"
                >
                  <RotateCcw size={12} />
                  <span>Track a different order</span>
                </button>
              </div>
            )}

            {/* Empty state when not yet tracked */}
            {!result && !loading && !error && (
              <div className="bg-brand-surface border border-dashed border-brand-border/60 rounded-[2rem] p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-brand-teal/10 flex items-center justify-center">
                  <Truck size={28} className="text-brand-teal" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <p className="font-heading font-black text-base sm:text-lg text-brand-text">
                    No tracking result yet
                  </p>
                  <p className="font-sans text-xs text-brand-muted leading-relaxed">
                    Enter your Order ID and the email or phone number you used
                    at checkout, then click "Track Order".
                  </p>
                </div>
                <Link
                  to="/account/orders"
                  className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-brand-teal hover:text-brand-coral transition-colors"
                >
                  <ChevronRight size={13} />
                  View My Orders
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
