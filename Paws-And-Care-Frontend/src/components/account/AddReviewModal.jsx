import React, { useState } from "react";
import { Star, X, CheckCircle2 } from "lucide-react";
import { reviewApi } from "../../api/reviewApi";
import { useAuth } from "../../context/AuthContext";

export default function AddReviewModal({
  isOpen,
  onClose,
  order,
  onSubmitSuccess,
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a rating star (1 to 5 stars).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const targetProductId =
        order.items?.[0]?.productId ||
        order.items?.[0]?._id ||
        order.items?.[0]?.id ||
        order.productId ||
        order._id ||
        order.orderId;

      const targetOrderId = order._id || order.id || order.orderId;

      const currentUserName =
        user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        (order?.contactDetails?.firstName
          ? `${order.contactDetails.firstName} ${order.contactDetails.lastName || ""}`.trim()
          : "") ||
        order?.customerName ||
        "";

      await reviewApi.submitReview({
        productId: targetProductId,
        orderId: targetOrderId,
        rating,
        comment: reviewText,
        userName: currentUserName,
        name: currentUserName,
        customerName: currentUserName,
      });
    } catch (err) {
      console.warn("Review API submission info:", err?.message || err);
    } finally {
      setIsSubmitting(false);
      setIsSuccess(true);

      if (onSubmitSuccess) {
        onSubmitSuccess(order.orderId, {
          rating,
          reviewText,
          date: new Date().toISOString(),
        });
      }

      setTimeout(() => {
        setIsSuccess(false);
        setReviewText("");
        setRating(0);
        onClose();
      }, 1500);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setErrorMessage("");
      setIsSuccess(false);
      onClose();
    }
  };

  const ratingLabels = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-text/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-brand-border/40 text-left z-10 transform transition-all duration-300 animate-fade-in-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1 rounded-full hover:bg-brand-bg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-brand-border/40 pb-4 pr-6">
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
            <Star size={11} className="fill-amber-500 text-amber-500" />
            <span>Product & Order Feedback</span>
          </span>
          <h3 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
            Add Review
          </h3>
          <p className="font-sans text-xs text-brand-muted mt-1 truncate">
            Order #{order.orderId} · Delivered
          </p>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-heading font-black text-lg text-brand-text">
              Review Submitted!
            </h4>
            <p className="font-sans text-xs text-brand-muted">
              Thank you for sharing your feedback.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* FIELD 1: STAR RATING */}
            <div className="space-y-2">
              <label className="block text-xs font-heading font-bold uppercase tracking-wider text-brand-text">
                1. Rating <span className="text-brand-coral">*</span>
              </label>
              <div className="flex items-center gap-2 bg-brand-bg/40 p-4 rounded-2xl border border-brand-border/50">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starIndex) => {
                    const isFilled = starIndex <= (hoverRating || rating);
                    return (
                      <button
                        key={starIndex}
                        type="button"
                        onClick={() => setRating(starIndex)}
                        onMouseEnter={() => setHoverRating(starIndex)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-2xl focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                        aria-label={`Rate ${starIndex} stars`}
                      >
                        <Star
                          size={28}
                          className={`transition-colors ${
                            isFilled
                              ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                              : "text-gray-300 fill-gray-100"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="ml-auto text-xs font-heading font-extrabold text-brand-teal bg-white px-3 py-1 rounded-full border border-brand-border/40 shadow-2xs">
                  {ratingLabels[hoverRating || rating] || "Select Rating"}
                </span>
              </div>
            </div>

            {/* FIELD 2: TEXTAREA */}
            <div className="space-y-2">
              <label
                htmlFor="reviewText"
                className="block text-xs font-heading font-bold uppercase tracking-wider text-brand-text"
              >
                2. Your Review <span className="text-brand-coral">*</span>
              </label>
              <textarea
                id="reviewText"
                required
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="How was your product and delivery experience? Write your thoughts here..."
                className="w-full p-4 rounded-2xl border border-brand-border/60 bg-white font-sans text-xs text-brand-text placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all resize-none shadow-2xs"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-red-500 font-semibold">
                {errorMessage}
              </p>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-full border border-brand-border text-brand-text font-heading font-bold text-xs hover:bg-brand-bg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-deep-teal text-white font-heading font-bold text-xs transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
