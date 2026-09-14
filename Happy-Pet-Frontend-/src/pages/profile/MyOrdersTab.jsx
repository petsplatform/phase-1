import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Star,
  X,
  MessageSquareQuote,
  Truck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { orderApi } from "../../api/orderApi";
import { reviewApi } from "../../api/reviewApi";
import {
  getOrderStatus,
  formatStatusText,
  getStatusStyle,
  getPaymentStatus,
  getPaymentStatusStyle,
  getDiscountAmount,
  getTotalPrice,
} from "../../utils/orderUtils";

const formatOrderDate = (date) => {
  if (!date) return "Recent order";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
};

const ORDERS_PER_PAGE = 4;

export default function MyOrdersTab({ handleTabChange }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Review Modal State (Pure UI)
  const [reviewOrder, setReviewOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

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

  useEffect(() => {
    let isMounted = true;

    orderApi
      .getMyOrders()
      .then((data) => {
        if (!isMounted) return;
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
      .catch((err) => {
        console.error("Failed to fetch customer orders", err);
        let localOrders = [];
        try {
          const stored = localStorage.getItem("happypet_orders");
          if (stored) localOrders = JSON.parse(stored);
        } catch {
          localOrders = [];
        }
        if (isMounted) setOrders(localOrders);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenReview = (order, item) => {
    setReviewOrder({
      id: order.id || order.orderNumber || order.orderId,
      productId: item.productId || item.id,
      productName: item.name || item.product?.name || item.title || "Product",
    });
    setRating(5);
    setHoverRating(0);
    setReviewText("");
  };

  const handleCloseReview = () => {
    setReviewOrder(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toast.error("Please write your review before submitting.");
      return;
    }
    try {
      await reviewApi.submitReview({
        productId: reviewOrder.productId,
        orderId: reviewOrder.id,
        rating,
        comment: reviewText.trim(),
      });
      toast.success("Thank you! Your review has been submitted.");
      handleCloseReview();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit review.");
    }
  };

  return (
    <div className="animate-in fade-in duration-300 text-left flex-grow flex flex-col justify-between">
      <div>
        <div className="border-b border-brand-purple/5 pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-display font-extrabold text-brand-purple tracking-tight">
              My Orders
            </h2>
            <p className="text-xs text-brand-brown/60 mt-1 font-semibold">
              Track your purchase history and prescription status
            </p>
          </div>
          {orders.length > 0 && (
            <span className="text-xs font-bold text-brand-brown/60 shrink-0">
              Total Orders:{" "}
              <strong className="text-brand-purple">{orders.length}</strong>
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="w-9 h-9 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-brand-purple/10 rounded-[20px] bg-white">
            <p className="text-xs font-semibold text-brand-brown/70">
              No orders found yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedOrders.map((order) => {
              const orderItems =
                order.items || order.orderItems || order.products || [];
              const firstItem = orderItems[0] || {};
              const totalQuantity = orderItems.reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0,
              );
              const orderId = order.orderNumber || order.orderId || order.id;
              const trackingId =
                order.trackingNumber || order.trackingId || orderId;
              const status = getOrderStatus(order);
              const displayStatus = formatStatusText(status);
              const normalizedStatus = status.toLowerCase().replace(/_/g, " ");
              const isDelivered = ["delivered", "completed"].includes(
                normalizedStatus,
              );

              const paymentStatus = getPaymentStatus(order);
              const discountAmount = getDiscountAmount(order);
              const totalPrice = getTotalPrice(order);

              const courier =
                order.courierName ||
                order.courier ||
                order.shipment?.courierName;
              const trackingNum =
                order.trackingNumber ||
                order.trackingId ||
                order.shipment?.trackingNumber;
              const awbNum =
                order.awbNumber || order.awb || order.shipment?.awbNumber;
              const trackingUrl =
                order.trackingUrl ||
                order.tracking_url ||
                order.shipment?.trackingUrl;

              const isCancelled = [
                "cancelled",
                "canceled",
                "failed",
                "rejected",
              ].includes(normalizedStatus);

              return (
                <div
                  key={order.id || orderId}
                  className="border border-gray-200 p-5 rounded-[20px] flex flex-col md:flex-row justify-between gap-4 bg-white font-semibold"
                >
                  <div className="space-y-2 text-left flex-1">
                    {/* Header: Order ID, Date & Payment Status Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-brand-purple text-sm sm:text-base">
                        {orderId}
                      </span>
                      <span className="text-xs text-brand-brown/40">•</span>
                      <span className="text-xs font-bold text-brand-brown/60">
                        {formatOrderDate(order.orderDate || order.createdAt)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${getPaymentStatusStyle(paymentStatus)}`}
                      >
                        Payment: {paymentStatus}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h4 className="text-xs sm:text-sm font-extrabold text-brand-purple leading-snug">
                      {firstItem.name ||
                        firstItem.product?.name ||
                        firstItem.title ||
                        "HappyPetRx order"}
                    </h4>

                    {/* Financial Details Row: Qty, Discount, Total */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-brand-brown/75 font-semibold">
                      <span>
                        Qty: {totalQuantity || orderItems.length || 1}
                      </span>
                      {discountAmount > 0 && (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          Discount: -${discountAmount.toFixed(2)}
                        </span>
                      )}
                      <span className="text-brand-purple font-extrabold">
                        Total: ${totalPrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Courier & Tracking Badges */}
                    {(courier || trackingNum || awbNum) && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-brand-brown/70 pt-1">
                        {courier && (
                          <span className="bg-brand-purple/5 text-brand-purple px-2 py-0.5 rounded-md border border-brand-purple/10">
                            Courier: {courier}
                          </span>
                        )}
                        {trackingNum && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md font-mono break-all max-w-full">
                            Trk #: {trackingNum}
                          </span>
                        )}
                        {awbNum && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md font-mono break-all max-w-full">
                            AWB: {awbNum}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-col items-start md:items-end justify-between md:justify-center gap-2.5 shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 mt-1 md:mt-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${getStatusStyle(status)}`}
                    >
                      {displayStatus}
                    </span>
                    <div className="flex flex-wrap items-center gap-3 pt-0.5">
                      {isDelivered && (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(order, firstItem)}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>Add Review</span>
                        </button>
                      )}

                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Live Tracking</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTabChange("tracking", trackingId)}
                        className="text-xs font-bold text-brand-purple hover:underline cursor-pointer"
                      >
                        Track Shipment
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav
                className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-purple/10 pt-5"
                aria-label="Orders pagination"
              >
                <p className="text-xs font-bold text-brand-brown/60">
                  Showing{" "}
                  <strong>{(currentPage - 1) * ORDERS_PER_PAGE + 1}</strong> to{" "}
                  <strong>
                    {Math.min(currentPage * ORDERS_PER_PAGE, orders.length)}
                  </strong>{" "}
                  of <strong>{orders.length}</strong> orders
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                      currentPage === 1
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-brand-purple/15 text-brand-purple hover:bg-brand-purple hover:text-white cursor-pointer shadow-xs"
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      aria-current={page === currentPage ? "page" : undefined}
                      className={`min-w-9 h-9 px-3 rounded-xl border text-xs font-extrabold transition-all duration-200 ${
                        page === currentPage
                          ? "bg-brand-purple border-brand-purple text-white shadow-md shadow-brand-purple/20"
                          : "bg-white border-gray-200 text-brand-purple hover:bg-brand-purple/5 hover:border-brand-purple/20 cursor-pointer"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                      currentPage === totalPages
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-brand-purple/15 text-brand-purple hover:bg-brand-purple hover:text-white cursor-pointer shadow-xs"
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </nav>
            )}
          </div>
        )}
      </div>

      {/* Add Review Popup Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative text-left">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                  <MessageSquareQuote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-brand-purple">
                    Write a Review
                  </h3>
                  <p className="text-[11px] text-brand-brown/60 font-semibold truncate max-w-[240px]">
                    {reviewOrder.productName} ({reviewOrder.orderId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseReview}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-purple/80 mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-brand-brown/70">
                    {hoverRating || rating} / 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-purple/80 mb-1.5">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details about your experience with this product..."
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/30 rounded-2xl text-xs font-semibold text-brand-purple outline-none transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseReview}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-brand-brown/70 hover:bg-gray-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
