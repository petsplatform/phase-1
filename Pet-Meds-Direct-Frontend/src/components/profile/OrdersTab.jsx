import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getOrdersApi } from "../../helper/axiosInstance";
import { Eye, MapPin, Check, Circle, Star } from "lucide-react";
import OrderReviewModal from "./OrderReviewModal";

export default function OrdersTab() {
  const { isLoggedIn } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  
  // Review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState({});

  useEffect(() => {
    // Load reviewed orders from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("pet_meds_order_reviews") || "{}");
      setReviewedOrders(saved);
    } catch (e) {
      console.error("Failed to parse order reviews from localStorage:", e);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getOrdersApi();
        if (res && res.success && Array.isArray(res.data)) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error("Failed to load orders from API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isLoggedIn]);

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleOpenReviewModal = (order) => {
    setSelectedOrderForReview(order);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = (orderId, reviewData) => {
    setReviewedOrders((prev) => ({
      ...prev,
      [orderId]: reviewData,
    }));
  };

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

  const getItemsSummary = (items = []) => {
    if (!items || !items.length) return "No items";
    return items
      .map((it) => `${it.productName || it.name || "Product"} (x${it.quantity || 1})`)
      .join(", ");
  };

  const getTrackingSteps = (order) => {
    const status = String(order.orderStatus || "").toLowerCase();
    const isCancelled = status === "cancelled";
    
    if (isCancelled) {
      return [
        { label: "Order Placed", done: true },
        { label: "Cancelled", done: true, date: order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : "" }
      ];
    }

    return [
      { 
        label: "Order Placed", 
        done: true, 
        date: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "" 
      },
      { 
        label: "Processing", 
        done: ["processing", "confirmed", "shipped", "delivered"].includes(status) 
      },
      { 
        label: "Shipped", 
        done: ["shipped", "delivered"].includes(status) 
      },
      { 
        label: "Delivered", 
        done: ["delivered"].includes(status) 
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-primary-green rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-left">
        <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
          Order History
        </h2>
      </div>

      {/* Orders List */}
      <div className="space-y-5 text-left">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 py-16 text-center">
            <p className="text-slate-500 font-semibold">You haven't placed any orders yet.</p>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const trackingSteps = getTrackingSteps(order);
            const isDelivered = String(order.orderStatus || order.status || "").toLowerCase() === "delivered";
            const isReviewed = Boolean(reviewedOrders[order.id]);

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-[#e8eef3] bg-white overflow-hidden transition-all hover:shadow-sm"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-8 py-5 sm:py-6 gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <span className="text-base sm:text-lg font-black text-deep-navy">
                        {order.id}
                      </span>
                      <span className="text-xs font-semibold text-deep-navy/40 shrink-0">
                        • {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : ""}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full px-3 py-1 text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider shrink-0"
                        style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-deep-navy/55 mb-2 leading-relaxed break-words">
                      {getItemsSummary(order.items)}
                    </p>

                    <div>
                      <span className="text-lg sm:text-xl font-black text-deep-navy">
                        ${Number(order.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className={`grid ${isDelivered ? "grid-cols-3" : "grid-cols-2"} sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100`}>
                    {isDelivered && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviewModal(order)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-black transition-colors cursor-pointer text-center ${
                          isReviewed
                            ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100/60"
                            : "bg-amber-500 text-white hover:bg-amber-600 shadow-xs"
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${isReviewed ? "fill-amber-500 text-amber-500" : "fill-white text-white"}`} />
                        <span className="truncate">{isReviewed ? "Reviewed" : "Review"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleOrder(order.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-deep-navy/12 px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-deep-navy hover:bg-slate-50 transition-colors cursor-pointer text-center"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">View Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchParams({ tab: "tracking", orderId: order.id })}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-green px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-black text-white hover:bg-dark-green transition-colors cursor-pointer text-center"
                    >
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">Track</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Tracking */}
                {isExpanded && (
                  <div className="border-t border-[#e8eef3] bg-slate-50/50 px-6 sm:px-8 py-6">
                    <h4 className="text-xs font-black uppercase tracking-wider text-deep-navy/50 mb-5">
                      Order History
                    </h4>
                    <div className="space-y-0">
                      {trackingSteps.map((step, i) => {
                        const isLast = i === trackingSteps.length - 1;
                        return (
                          <div key={step.label} className="flex gap-4">
                            {/* Timeline Line + Dot */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
                                  step.done
                                    ? "bg-primary-green text-white"
                                    : "border-2 border-deep-navy/15 bg-white"
                                }`}
                              >
                                {step.done ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Circle className="h-3 w-3 text-deep-navy/20" />
                                )}
                              </div>
                              {!isLast && (
                                <div
                                  className={`w-0.5 h-9 ${
                                    step.done
                                      ? "bg-primary-green"
                                      : "bg-deep-navy/10"
                                  }`}
                                />
                              )}
                            </div>

                            {/* Step Content */}
                            <div className="pb-5">
                              <span
                                className={`text-sm font-black ${
                                  step.done
                                    ? "text-deep-navy"
                                    : "text-deep-navy/40"
                                }`}
                              >
                                {step.label}
                              </span>
                              {step.date && (
                                <span className="block text-xs font-semibold text-deep-navy/40 mt-0.5">
                                  {step.date}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Review Modal */}
      <OrderReviewModal
        order={selectedOrderForReview}
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedOrderForReview(null);
        }}
        onSubmitSuccess={handleReviewSuccess}
      />
    </div>
  );
}
