import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardApi } from "../../helper/axiosInstance";
import { ArrowRight, Star } from "lucide-react";
import OrderReviewModal from "./OrderReviewModal";

export default function DashboardTab() {
  const [, setSearchParams] = useSearchParams();
  const { isLoggedIn } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pet_meds_order_reviews") || "{}");
      setReviewedOrders(saved);
    } catch (e) {
      console.error("Failed to parse reviews:", e);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await getDashboardApi();
        if (res && res.success && res.data) {
          setStats(res.data.stats || null);
          setOrders(res.data.recentOrders || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-primary-green rounded-full animate-spin" />
      </div>
    );
  }

  // Stat Card configuration
  const dashboardStats = [
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      color: "#5c33f6", // premium indigo
    },
    {
      label: "Pending Orders",
      value: stats?.pendingOrders ?? 0,
      color: "#ff7675", // coral/red
    },
    {
      label: "Delivered Orders",
      value: stats?.deliveredOrders ?? 0,
      color: "#00b894", // mint green
    },
    {
      label: "Saved Addresses",
      value: stats?.savedAddresses ?? 0,
      color: "#0984e3", // vibrant blue
    },
  ];

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
    if (typeof items === "string") return items;
    return items
      .map((it) => `${it.productName || it.name || "Product"} (x${it.quantity || 1})`)
      .join(", ");
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-left">
        <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
          My Dashboard
        </h2>
        <p className="text-sm sm:text-base font-semibold text-deep-navy/50 mt-1.5">
          Track your orders, saved details, and account activity in one place.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10 text-left">
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#e8eef3] bg-white p-5 sm:p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-deep-navy/45">
              {stat.label}
            </span>
            <div
              className="text-3xl sm:text-4xl font-black mt-2 font-display"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-[#e8eef3] bg-white overflow-hidden text-left">
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[#e8eef3]">
          <h3 className="text-lg sm:text-xl font-black text-deep-navy font-display">
            Recent Orders
          </h3>
          <button
            onClick={() => setSearchParams({ tab: "orders" })}
            className="flex items-center gap-1.5 text-sm font-bold text-medical-teal hover:text-dark-green transition-colors cursor-pointer"
          >
            View All <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-[#e8eef3]">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-semibold">
              No recent orders found.
            </div>
          ) : (
            orders.slice(0, 3).map((order) => {
              const currentStatus = order.status || order.orderStatus || "";
              const isDelivered = String(currentStatus).toLowerCase() === "delivered";
              const isReviewed = Boolean(reviewedOrders[order.id]);

              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 sm:px-8 py-5 gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-base font-black text-deep-navy">
                        {order.id}
                      </span>
                      <span className="text-xs font-semibold text-deep-navy/40">
                        • {order.date ? new Date(order.date).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-deep-navy/55 truncate">
                      {getItemsSummary(order.items)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-black text-white"
                      style={{ backgroundColor: getStatusColor(currentStatus) }}
                    >
                      {currentStatus}
                    </span>
                    {isDelivered && (
                      <button
                        onClick={() => {
                          setSelectedOrderForReview(order);
                          setReviewModalOpen(true);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-colors cursor-pointer ${
                          isReviewed
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-amber-500 text-white hover:bg-amber-600 shadow-xs"
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isReviewed ? "fill-amber-500 text-amber-500" : "fill-white text-white"}`} />
                        {isReviewed ? "Reviewed" : "Add Review"}
                      </button>
                    )}
                    <button
                      onClick={() => setSearchParams({ tab: "orders" })}
                      className="rounded-xl border border-deep-navy/12 px-5 py-2 text-xs font-black text-deep-navy hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Modal */}
      <OrderReviewModal
        order={selectedOrderForReview}
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedOrderForReview(null);
        }}
        onSubmitSuccess={(orderId, reviewData) => {
          setReviewedOrders((prev) => ({
            ...prev,
            [orderId]: reviewData,
          }));
        }}
      />
    </div>
  );
}
