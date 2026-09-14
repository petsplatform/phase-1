import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, X, Loader2, CheckCircle2 } from "lucide-react";
import { reviewApi } from "../../api/reviewApi";

const ReviewModal = ({ isOpen, onClose, order, product, onSuccess }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* ── Lock body scroll when modal is open ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setComment("");
      setError("");
      setSuccessMsg("");
      if (product) {
        setSelectedItem(product);
      } else if (order && order.items && order.items.length > 0) {
        setSelectedItem(order.items[0]);
      }
    }
  }, [isOpen, order, product]);

  if (!isOpen) return null;

  const items = order?.items || (product ? [product] : []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      setError("Please select a product to review.");
      return;
    }
    if (!rating || rating < 1) {
      setError("Please select a star rating.");
      return;
    }

    const productId = selectedItem.productId || selectedItem.product || selectedItem.id || selectedItem._id;
    const orderId = order?.id || order?._id || selectedItem.orderId || "";

    setLoading(true);
    setError("");

    try {
      await reviewApi.submitReview({
        productId,
        orderId,
        rating: Number(rating),
        comment: comment.trim(),
      });
      setSuccessMsg("Thank you! Your review has been submitted successfully.");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to submit review:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to submit review. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto overflow-x-hidden w-full h-full"
      style={{
        backgroundColor: "rgba(7, 59, 102, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (!loading && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#D9E8F2] overflow-hidden flex flex-col max-h-[90vh] my-auto relative animate-scale-up shrink-0"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 25px 60px -15px rgba(7, 59, 102, 0.3)",
        }}
      >
        {/* Header */}
        <div className="bg-[#F3F9FD] border-b border-[#D9E8F2] px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#087BC1]/10 flex items-center justify-center text-[#087BC1] shrink-0">
              <Star className="w-4 h-4 fill-[#087BC1]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-sm sm:text-base text-[#073B66] truncate">
                Write a Review
              </h3>
              {order?.id && (
                <p className="text-[11px] font-medium text-[#627D98] truncate">
                  Order ID: {order.id}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white border border-[#D9E8F2] text-[#627D98] hover:text-[#073B66] hover:bg-[#EAF5FC] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Item Selector if order has multiple items */}
          {items.length > 1 && (
            <div className="mb-5">
              <label className="block text-xs font-bold text-[#073B66] uppercase tracking-wider mb-2">
                Select Product to Review
              </label>
              <div className="grid grid-cols-1 gap-2">
                {items.map((item, idx) => {
                  const isSelected =
                    (selectedItem?.id || selectedItem?.productId) === (item.id || item.productId);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#087BC1] bg-[#EAF5FC]"
                          : "border-[#D9E8F2] hover:border-[#087BC1]/40 bg-white"
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#073B66] truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#627D98]">
                          Qty: {item.quantity || 1}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Product Card preview if 1 item */}
          {items.length === 1 && selectedItem && (
            <div className="flex items-center gap-3 p-3 bg-[#F7FAFC] border border-[#D9E8F2] rounded-2xl mb-5 text-left w-full min-w-0">
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#D9E8F2]/60"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#073B66] truncate">
                  {selectedItem.name}
                </p>
                <p className="text-[11px] text-[#627D98]">
                  Verified Purchase
                </p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center flex flex-col items-center gap-3 my-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              <p className="text-sm font-bold text-emerald-800">{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-4 py-3 rounded-xl text-center">
                  {error}
                </div>
              )}

              {/* INPUT 1: Star Rating */}
              <div className="flex flex-col items-center gap-2 py-3.5 px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl w-full">
                <label className="text-xs font-bold text-[#073B66] uppercase tracking-wider text-center">
                  Rating
                </label>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                            isFilled
                              ? "fill-[#F28A16] text-[#F28A16]"
                              : "text-[#CBD5E1] fill-transparent"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-semibold text-[#627D98] text-center">
                  {hoverRating || rating || 0} out of 5 stars
                </p>
              </div>

              {/* INPUT 2: Textarea for Review / Comment */}
              <div>
                <label className="block text-xs font-bold text-[#073B66] uppercase tracking-wider mb-2">
                  Review
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  className="w-full bg-white border border-[#D9E8F2] rounded-2xl p-3.5 text-xs sm:text-sm text-[#073B66] placeholder-[#9FB3C8] focus:outline-none focus:ring-2 focus:ring-[#087BC1]/30 focus:border-[#087BC1] transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-[#D9E8F2] text-xs font-bold text-[#627D98] hover:text-[#073B66] hover:bg-[#F7FAFC] transition-colors cursor-pointer disabled:opacity-50 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#073B66] hover:bg-[#087BC1] text-white text-xs font-bold transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Review
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReviewModal;
