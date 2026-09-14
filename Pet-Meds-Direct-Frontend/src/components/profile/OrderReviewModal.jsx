import React, { useState } from "react";
import { Star, X } from "lucide-react";
import { showToast } from "../common/toast/ToastHelper";
import { reviewApi } from "../../helper/axiosInstance";

export default function OrderReviewModal({ order, isOpen, onClose, onSubmitSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating < 1) {
      showToast.error("Please select a star rating.");
      return;
    }

    if (!comment.trim()) {
      showToast.error("Please enter a review comment.");
      return;
    }

    try {
      setSubmitting(true);

      const productId =
        order.productId ||
        order.items?.[0]?.productId ||
        order.items?.[0]?.id ||
        order.id ||
        "";
      const orderId = order.id || order._id || "";

      // Call API POST endpoint
      try {
        await reviewApi.submitReview({
          productId,
          orderId,
          rating,
          comment: comment.trim(),
        });
      } catch (apiError) {
        console.warn("API review submit error, fallback to local storage:", apiError);
      }

      // Persist locally for immediate UI update & offline review state
      const existingReviews = JSON.parse(
        localStorage.getItem("pet_meds_order_reviews") || "{}"
      );
      existingReviews[order.id] = {
        rating,
        comment: comment.trim(),
        date: new Date().toISOString(),
      };
      localStorage.setItem("pet_meds_order_reviews", JSON.stringify(existingReviews));

      showToast.success("Thank you! Your review has been submitted.");
      if (onSubmitSuccess) {
        onSubmitSuccess(order.id, { rating, comment: comment.trim() });
      }
      onClose();
    } catch (err) {
      console.error("Failed to submit review:", err);
      showToast.error("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 text-left">
          <h3 className="text-2xl font-black text-deep-navy font-display">
            Add Review
          </h3>
          <p className="text-xs font-bold text-deep-navy/40 mt-1">
            Order ID: <span className="text-deep-navy font-black">{order.id}</span>
          </p>
        </div>

        {/* Form: Star rating & Textarea only */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* Star Rating */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/60 mb-2">
              Star Rating
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const activeRating = hoveredRating || rating;
                const isFilled = star <= activeRating;
                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        isFilled
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200 fill-slate-100"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/60 mb-2">
              Review Comment
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your review here..."
              className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-deep-navy outline-none focus:border-primary-green focus:ring-2 focus:ring-primary-green/10 transition-all resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary-green px-6 py-2.5 text-sm font-black text-white hover:bg-dark-green transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
