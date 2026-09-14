import { useState } from "react";
import { StarIcon, XIcon } from "./common/HeaderIcons";
import { reviewApi } from "../api/reviewApi";
import { useToast } from "../context/ToastContext";

const ReviewModal = ({ isOpen, onClose, product, orderId, onSubmitSuccess }) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = comment.trim();
    if (!val) {
      setError("Please write a comment for your review.");
      return;
    }
    if (val.length < 10) {
      setError("Review comment must be at least 10 characters.");
      return;
    }
    if (val.length > 1000) {
      setError("Review comment must not exceed 1000 characters.");
      return;
    }

    const productId = product?.productId || product?.id || product?._id;
    const finalOrderId = orderId || product?.orderId;

    if (!productId) {
      setError("Product ID is missing.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await reviewApi.submitReview({
        productId,
        orderId: finalOrderId,
        rating: Number(rating),
        comment: val,
      });

      showToast("Review submitted successfully!");
      if (onSubmitSuccess) {
        onSubmitSuccess({ productId, orderId: finalOrderId });
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStars = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#111111]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-[500px] rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-2xl transition-all text-left">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#17345f1a] pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-[#122a50]">Add Review</h3>
            <p className="mt-1 text-xs font-semibold text-[#122a50b2]">
              {product?.name ? `For ${product.name}` : `Order #${orderId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#17345f1a] text-[#122a50] transition-colors hover:border-[#d9aa3d] hover:text-[#d9aa3d] cursor-pointer"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
          {/* Star Rating Picker */}
          <div>
            <label className="mb-2 block text-sm font-extrabold text-[#122a50]">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                >
                  <StarIcon
                    className={`h-7 w-7 transition-colors ${
                      star <= currentStars
                        ? "fill-[#d9aa3d] text-[#d9aa3d]"
                        : "fill-[#17345f1a] text-[#17345f1a]"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-xs font-bold text-[#17345f]">
                {currentStars} / 5 Stars
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#122a50]">
                Review Comment <span className="text-red-500">*</span>
              </span>
              <span className="text-[10px] font-semibold text-[#122a50]/50">Min 10, Max 1000 chars</span>
            </div>
            <textarea
              rows={4}
              value={comment}
              maxLength={1000}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError("");
              }}
              placeholder="Share details of your experience with this product..."
              className={`w-full rounded-xl border bg-white p-3.5 text-sm font-semibold text-[#122a50] outline-none transition-colors focus:border-[#d9aa3d] ${
                error ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
              }`}
            />
          </div>

          {/* Error display */}
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-xs font-extrabold text-red-600">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-[#17345f1a] px-4 py-2.5 text-sm font-extrabold text-[#122a50] transition-colors hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#17345f] px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-[#d9aa3d] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
