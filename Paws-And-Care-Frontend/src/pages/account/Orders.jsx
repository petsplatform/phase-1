import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import AccountSidebar from "../../components/account/AccountSidebar";
import AddReviewModal from "../../components/account/AddReviewModal";
import Pagination from "../../components/shop/Pagination";
import { useOrders } from "../../context/OrderContext";
import {
  Calendar,
  Package,
  ArrowRight,
  Truck,
  Star,
  CheckCircle,
} from "lucide-react";

const ORDERS_PER_PAGE = 4;

export default function Orders() {
  const { orders = [] } = useOrders();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState({});

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [orders.length, totalPages, currentPage]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ORDERS_PER_PAGE;
    return orders.slice(start, start + ORDERS_PER_PAGE);
  }, [orders, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper function to color code order status
  const statusColor = (status) => {
    switch (status) {
      case "Order Confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Processing":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Packed":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Out for Delivery":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-brand-teal/10 text-brand-teal border-brand-teal/20";
    }
  };

  const handleReviewSuccess = (orderId, reviewData) => {
    setReviewedOrders((prev) => ({
      ...prev,
      [orderId]: reviewData,
    }));
  };

  const getDisplayStatus = (order) => {
    const raw =
      order.shipmentStatus ||
      order.shipment_status ||
      order.shipment?.shipmentStatus ||
      order.orderStatus ||
      order.status ||
      "";
    const clean = String(raw)
      .toLowerCase()
      .replace(/_/g, "")
      .replace(/\s+/g, "");
    if (clean.includes("delivered") || clean.includes("completed"))
      return "Delivered";
    if (clean.includes("outfor")) return "Out for Delivery";
    if (
      clean.includes("shipped") ||
      clean.includes("intransit") ||
      clean.includes("dispatched")
    )
      return "Shipped";
    if (
      clean.includes("processing") ||
      clean.includes("packed") ||
      clean.includes("ready")
    )
      return "Processing";
    return raw || "Order Confirmed";
  };

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans overflow-x-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 text-left w-full min-w-0">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start min-w-0 w-full">
          <AccountSidebar />

          <div className="flex-1 space-y-6 min-w-0 w-full">
            <div className="border-b border-brand-border/40 pb-3 min-w-0 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-brand-text">
                  My Orders
                </h1>
                <p className="font-sans text-xs sm:text-sm text-brand-muted mt-1 leading-relaxed">
                  View your complete order history, track live shipments, and
                  write product reviews.
                </p>
              </div>
              {orders.length > 0 && (
                <span className="text-xs font-sans text-brand-muted shrink-0">
                  Total Orders:{" "}
                  <strong className="text-brand-text">{orders.length}</strong>
                </span>
              )}
            </div>

            {orders.length > 0 ? (
              <div className="space-y-4 sm:space-y-6 min-w-0 w-full">
                {paginatedOrders.map((order, idx) => {
                  const displayStatus = getDisplayStatus(order);
                  const isDelivered =
                    displayStatus.toLowerCase() === "delivered";
                  const isCancelled =
                    String(order.orderStatus || order.status || displayStatus).toLowerCase().includes("cancel");
                  const hasReviewed = !!reviewedOrders[order.orderId];

                  return (
                    <div
                      key={idx}
                      className="bg-brand-surface border border-brand-border/60 p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-xs space-y-4 hover:shadow-md transition-shadow min-w-0 w-full"
                    >
                      {/* Top order summary row */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center justify-between gap-3 border-b border-brand-border/40 pb-3 text-xs min-w-0">
                        <div className="min-w-0">
                          <span className="block text-[9px] uppercase font-bold text-brand-muted">
                            Order ID
                          </span>
                          <strong
                            className="font-heading text-brand-text text-xs sm:text-sm truncate block"
                            title={order.orderId}
                          >
                            {order.orderId}
                          </strong>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[9px] uppercase font-bold text-brand-muted">
                            Placed Date
                          </span>
                          <strong className="text-brand-text font-sans text-xs truncate block">
                            {order.orderDate
                              ? String(order.orderDate).split("T")[0]
                              : ""}
                          </strong>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[9px] uppercase font-bold text-brand-muted">
                            Payment status
                          </span>
                          <span className="text-brand-teal font-semibold font-sans text-xs truncate block">
                            {order.paymentStatus}
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-start sm:justify-end mt-1 sm:mt-0">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] uppercase font-heading font-black border shrink-0 ${statusColor(displayStatus)}`}
                          >
                            {displayStatus}
                          </span>
                        </div>
                      </div>

                      {/* Timeline forecast or estimated delivery date */}
                      <div className="flex items-start gap-3 bg-brand-bg/40 p-3 sm:p-4 rounded-xl border border-brand-border/40 text-xs min-w-0">
                        <Truck
                          size={16}
                          className="text-brand-teal shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[9px] uppercase font-bold text-brand-muted">
                            Delivery Timeline
                          </span>
                          <p className="text-brand-text mt-0.5 truncate">
                            {isDelivered
                              ? "Delivered successfully."
                              : order.deliveryEstimate &&
                                  order.deliveryEstimate !== "—" &&
                                  order.deliveryEstimate !== "N/A"
                                ? `Est. Delivery: ${order.deliveryEstimate}`
                                : "Pending dispatch"}
                          </p>
                        </div>
                      </div>

                      {/* Items preview details list */}
                      <div className="space-y-2.5 pt-1.5 min-w-0">
                        {order.items.map((item, id) => (
                          <div
                            key={id}
                            className="flex justify-between items-center text-xs font-sans gap-2 min-w-0"
                          >
                            <span className="text-brand-muted truncate flex-1 min-w-0">
                              {item.name}{" "}
                              <strong className="text-brand-text">
                                x{item.quantity}
                              </strong>{" "}
                              {item.option && `(${item.option})`}
                            </span>
                            <span className="font-semibold text-brand-text shrink-0 text-xs">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer options and details action buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-brand-border/40 gap-3 min-w-0">
                        <div className="text-xs font-heading font-black text-brand-text shrink-0">
                          <span>Total Paid: </span>
                          <span className="text-brand-coral text-sm sm:text-base">
                            ${order.pricing.total.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                          {isDelivered &&
                            (hasReviewed ? (
                              <button
                                onClick={() => setSelectedOrderForReview(order)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-heading font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <CheckCircle
                                  size={13}
                                  className="text-emerald-600 shrink-0"
                                />
                                <span>
                                  Reviewed (
                                  {reviewedOrders[order.orderId].rating}★)
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedOrderForReview(order)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-heading font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                              >
                                <Star
                                  size={13}
                                  className="text-amber-500 fill-amber-500 shrink-0"
                                />
                                <span>Add Review</span>
                              </button>
                            ))}

                          {!isCancelled && (
                            <Link
                              to={`/account/track-order?orderId=${order.orderId}`}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full font-heading font-bold text-xs transition-colors shadow-xs hover:shadow cursor-pointer"
                            >
                              <span>Track Order</span>
                              <ArrowRight size={13} className="shrink-0" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-border/40 min-w-0 w-full">
                    <p className="text-xs font-sans text-brand-muted">
                      Showing{" "}
                      <strong>{(currentPage - 1) * ORDERS_PER_PAGE + 1}</strong>{" "}
                      to{" "}
                      <strong>
                        {Math.min(currentPage * ORDERS_PER_PAGE, orders.length)}
                      </strong>{" "}
                      of <strong>{orders.length}</strong> orders
                    </p>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-brand-surface border border-brand-border/60 p-12 rounded-[2rem] text-center shadow-xs text-brand-muted text-sm max-w-lg mx-auto">
                <Package size={36} className="mx-auto mb-3" />
                <h3 className="font-heading font-black text-brand-text text-base mb-1">
                  No Orders Placed Yet
                </h3>
                <p className="font-sans text-xs">
                  Browse our catalogue pages to find the perfect spoil for your
                  pet!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Review Modal */}
      <AddReviewModal
        isOpen={!!selectedOrderForReview}
        onClose={() => setSelectedOrderForReview(null)}
        order={selectedOrderForReview}
        onSubmitSuccess={handleReviewSuccess}
      />
    </div>
  );
}
