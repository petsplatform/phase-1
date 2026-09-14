import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AccountSidebar from "../../components/account/AccountSidebar";
import AddReviewModal from "../../components/account/AddReviewModal";
import { useOrders } from "../../context/OrderContext";
import {
  ChevronRight,
  ArrowLeft,
  Calendar,
  MapPin,
  Printer,
  ShieldCheck,
  Check,
  Star,
  CheckCircle,
} from "lucide-react";

export default function OrderDetails() {
  const { orderId } = useParams();
  const { lookupOrder } = useOrders();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  const order = useMemo(() => {
    return lookupOrder(orderId);
  }, [orderId, lookupOrder]);

  const isDelivered = order?.orderStatus?.toLowerCase() === "delivered";

  const timelineSteps = [
    { label: "Confirmed", key: "Order Confirmed" },
    { label: "Packed", key: "Packed" },
    { label: "Shipped", key: "Shipped" },
    { label: "Delivered", key: "Delivered" },
  ];

  // Find index of current status in timeline
  const activeTimelineIdx = useMemo(() => {
    if (!order) return -1;
    if (order.orderStatus === "Cancelled") return -1;
    const current = order.orderStatus;
    if (current === "Processing") return 0; // mapped to Confirmed
    if (current === "Out for Delivery") return 2; // mapped to Shipped
    return timelineSteps.findIndex((s) => s.key === current);
  }, [order]);

  if (!order) {
    return (
      <div className="bg-brand-bg min-h-screen pb-16 font-sans">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 text-left flex flex-col items-center justify-center">
          <h1 className="font-heading font-black text-2xl text-brand-text mb-4">
            Order Details Not Found
          </h1>
          <Link
            to="/account/orders"
            className="bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-6 py-2.5 font-heading font-bold text-sm transition-colors"
          >
            Back to Orders List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 text-left">
        {/* Navigation Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-brand-muted mb-6 flex-wrap"
        >
          <Link to="/" className="hover:text-brand-teal transition-colors">
            Home
          </Link>
          <ChevronRight size={10} className="text-brand-border" />
          <Link
            to="/account"
            className="hover:text-brand-teal transition-colors"
          >
            Account
          </Link>
          <ChevronRight size={10} className="text-brand-border" />
          <Link
            to="/account/orders"
            className="hover:text-brand-teal transition-colors"
          >
            Orders
          </Link>
          <ChevronRight size={10} className="text-brand-border" />
          <span className="text-brand-coral font-semibold">
            {order.orderId}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AccountSidebar />

          <div className="flex-1 space-y-6 w-full">
            {/* Header toolbar */}
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3 flex-wrap gap-4">
              <div className="space-y-1">
                <Link
                  to="/account/orders"
                  className="inline-flex items-center gap-1 text-xs font-heading font-bold text-brand-teal hover:underline mb-1"
                >
                  <ArrowLeft size={12} />
                  <span>Back to Orders List</span>
                </Link>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                  Order Details: {order.orderId}
                </h1>
              </div>

              {isDelivered && (
                <div>
                  {reviewData ? (
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-heading font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span>Reviewed ({reviewData.rating}★)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-heading font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                    >
                      <Star
                        size={14}
                        className="text-amber-500 fill-amber-500"
                      />
                      <span>Add Review</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Visual Timeline Stepper ─────────────────────────────────── */}
            {order.orderStatus !== "Cancelled" && (
              <div className="bg-brand-surface border border-brand-border/60 p-6 rounded-[2.5rem] shadow-xs space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/30 pb-2">
                  <h4 className="font-heading font-black text-sm text-brand-text uppercase tracking-wide">
                    Order Tracking & Shipment Details
                  </h4>
                  <Link
                    to={`/account/track-order?orderId=${order.orderId}`}
                    className="text-xs font-heading font-bold text-brand-teal hover:underline flex items-center gap-1"
                  >
                    Live Tracker <ChevronRight size={12} />
                  </Link>
                </div>

                {/* Shipment Details Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                  <div className="bg-brand-bg/50 rounded-xl p-3 border border-brand-border/40 space-y-0.5">
                    <p className="text-[9px] uppercase font-heading font-bold text-brand-muted">Courier</p>
                    <p className="font-heading font-black text-xs text-brand-text truncate">{order.courierName || "N/A"}</p>
                  </div>
                  <div className="bg-brand-bg/50 rounded-xl p-3 border border-brand-border/40 space-y-0.5">
                    <p className="text-[9px] uppercase font-heading font-bold text-brand-muted">Tracking Number</p>
                    <p className="font-heading font-black text-xs text-brand-text truncate">{order.trackingNumber || "N/A"}</p>
                  </div>
                  <div className="bg-brand-bg/50 rounded-xl p-3 border border-brand-border/40 space-y-0.5">
                    <p className="text-[9px] uppercase font-heading font-bold text-brand-muted">AWB Number</p>
                    <p className="font-heading font-black text-xs text-brand-text truncate">{order.awbNumber || "N/A"}</p>
                  </div>
                  <div className="bg-brand-bg/50 rounded-xl p-3 border border-brand-border/40 space-y-0.5">
                    <p className="text-[9px] uppercase font-heading font-bold text-brand-muted">Est. Delivery</p>
                    <p className="font-heading font-black text-xs text-brand-teal truncate">{order.deliveryEstimate || "N/A"}</p>
                  </div>
                </div>

                <div className="max-w-xl mx-auto flex items-center justify-between relative pt-2">
                  <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-0.5 bg-brand-border z-0">
                    <div
                      className="h-full bg-brand-teal transition-all duration-300 rounded-full"
                      style={{
                        width: `${activeTimelineIdx >= 0 ? (activeTimelineIdx / (timelineSteps.length - 1)) * 100 : 0}%`,
                      }}
                    />
                  </div>

                  {timelineSteps.map((step, idx) => {
                    const isCompleted = idx <= activeTimelineIdx;
                    const isActive = idx === activeTimelineIdx;

                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center relative z-10 select-none"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-black text-sm border-2 transition-all duration-300 ${
                            isCompleted
                              ? "bg-brand-teal border-brand-teal text-white"
                              : "bg-brand-surface border-brand-border text-brand-muted"
                          }`}
                        >
                          {isCompleted ? <Check size={16} /> : idx + 1}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-heading font-extrabold mt-1.5 transition-colors duration-300 ${
                            isActive
                              ? "text-brand-teal"
                              : isCompleted
                                ? "text-brand-text"
                                : "text-brand-muted"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grid display layout (Items lists on left, Address summaries on right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Item lists summaries (Left, 7 Cols) */}
              <div className="lg:col-span-7 bg-white border border-brand-border/60 p-6 rounded-[2rem] shadow-xs space-y-4">
                <h4 className="font-heading font-black text-sm text-brand-text border-b border-brand-border/40 pb-2 uppercase tracking-wide">
                  Order Items
                </h4>

                <div className="space-y-4 pr-1">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center gap-4 text-xs font-sans"
                    >
                      <div className="min-w-0">
                        <h5 className="font-heading font-black text-brand-text truncate flex items-center gap-1.5">
                          <span className="truncate">{item.name}</span>
                          {(item.prescriptionRequired || item.prescriptionUrl) && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                              Rx Required
                            </span>
                          )}
                        </h5>
                        <span className="block text-[10px] text-brand-muted mt-0.5">
                          Quantity: {item.quantity}{" "}
                          {item.option && `· Option: ${item.option}`}
                        </span>
                        {item.prescriptionUrl && (
                          <a
                            href={item.prescriptionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-teal hover:underline mt-1"
                          >
                            <span>View Uploaded Prescription</span>
                          </a>
                        )}
                      </div>
                      <span className="font-semibold text-brand-text shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <hr className="border-brand-border/40" />

                {/* Billing Summary info */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-brand-muted">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-brand-text">
                      ${order.pricing.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-brand-muted">
                    <span>Tax</span>
                    <span className="font-semibold text-brand-text">
                      ${order.pricing.tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-heading font-black text-brand-text pt-2 border-t border-brand-border/30">
                    <span>Grand Total</span>
                    <span className="text-brand-coral">
                      ${order.pricing.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Details side summary (Right, 5 Cols) */}
              <div className="lg:col-span-5 bg-brand-surface border border-brand-border/60 p-6 rounded-[2rem] shadow-xs space-y-6">
                {/* Shipping Destination summary */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-heading font-black text-brand-text border-b border-brand-border/40 pb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin size={14} className="text-brand-teal" />
                    <span>Shipping Destination</span>
                  </h4>
                  <p className="font-sans text-brand-muted leading-relaxed">
                    {order.shippingAddress?.streetAddress || order.shippingAddress?.addressLine1 || order.shippingAddress?.address || 'Address on file'}{" "}
                    {(order.shippingAddress?.apartment || order.shippingAddress?.addressLine2) &&
                      `, ${order.shippingAddress?.apartment || order.shippingAddress?.addressLine2}`}
                    <br />
                    {[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(', ')}{" "}
                    {order.shippingAddress?.postalCode || order.shippingAddress?.zip}
                    <br />
                    {order.shippingAddress?.country || 'United States'}
                  </p>
                </div>

                {/* Contact details summary */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-heading font-black text-brand-text border-b border-brand-border/40 pb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar size={14} className="text-brand-teal" />
                    <span>Delivery Contact</span>
                  </h4>
                  <p className="font-sans text-brand-muted leading-relaxed">
                    <strong>Name:</strong> {order.contactDetails.firstName}{" "}
                    {order.contactDetails.lastName}
                    <br />
                    <strong>Email:</strong> {order.contactDetails.email}
                    <br />
                    <strong>Mobile:</strong> {order.contactDetails.mobile}
                  </p>
                </div>

                <div className="bg-brand-bg/50 p-4 rounded-xl border border-brand-border/40 flex items-start gap-2.5 text-[10px] text-brand-muted">
                  <ShieldCheck
                    size={16}
                    className="text-brand-teal shrink-0 mt-0.5"
                  />
                  <p className="font-sans leading-relaxed">
                    This order is security verified. For support, returns or
                    cancellations, contact PawsAndCare customer care desk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        order={order}
        onSubmitSuccess={(orderId, data) => setReviewData(data)}
      />
    </div>
  );
}
