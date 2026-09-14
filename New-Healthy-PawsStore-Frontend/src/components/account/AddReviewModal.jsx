import { useState } from "react";
import { Star, X, CheckCircle2 } from "lucide-react";
import { reviewApi } from "../../api/reviewApi";
import { useToast } from "../../context/ToastContext";

export default function AddReviewModal({ order, onClose, onSuccess }) {
  const { showToast } = useToast();
  const items = order?.items || [];
  
  // Default to first product if available
  const [selectedItem, setSelectedItem] = useState(items[0] || null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      setError("Please enter your review comment.");
      return;
    }

    const productId = selectedItem?.productId || selectedItem?.id || order?.id;

    try {
      setSubmitting(true);
      setError("");

      await reviewApi.submitReview({
        productId,
        orderId: order.id,
        rating,
        comment: comment.trim(),
      });

      setSubmitted(true);
      showToast("Thank you! Your review has been submitted.", "success");
      
      if (onSuccess) {
        onSuccess(productId);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to submit review:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to submit review. Please try again.";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent!";
      default: return "Select Rating";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderSoft pb-4">
          <div>
            <h3 className="font-display text-[20px] font-extrabold text-textMain">Add Review</h3>
            <p className="text-[12px] font-semibold text-muted">Order #{order.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-sageLight hover:text-textMain"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <div className="grid size-14 place-items-center rounded-full bg-sageLight text-secondaryDark">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="mt-3 font-display text-[18px] font-extrabold text-textMain">Review Submitted!</h4>
            <p className="mt-1 text-[13px] font-medium text-muted">
              Thank you for sharing your feedback with us.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Product Selector if multiple items */}
            {items.length > 1 && (
              <div>
                <label className="block text-[12px] font-extrabold uppercase tracking-wider text-muted mb-1.5">
                  Select Product to Review
                </label>
                <div className="grid max-h-36 gap-2 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isSelected = (selectedItem?.id === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className={`flex items-center gap-3 rounded-xl border p-2 text-left transition ${
                          isSelected
                            ? "border-secondaryDark bg-sageLight/50"
                            : "border-borderSoft hover:bg-sageLight/20"
                        }`}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="size-10 rounded-lg object-cover border border-borderSoft shrink-0"
                          />
                        )}
                        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-textMain">
                          {item.title || item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Currently selected product preview if single or selected */}
            {selectedItem && items.length === 1 && (
              <div className="flex items-center gap-3 rounded-xl border border-borderSoft bg-sageLight/30 p-3">
                {selectedItem.image && (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="size-12 rounded-lg object-cover border border-borderSoft shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-[14px] font-bold text-textMain">
                    {selectedItem.title || selectedItem.name}
                  </h4>
                  <p className="text-[12px] font-semibold text-muted">Qty: {selectedItem.quantity}</p>
                </div>
              </div>
            )}

            {/* Field 1: Star Rating */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-extrabold text-textMain">
                  Star Rating <span className="text-error">*</span>
                </label>
                <span className="text-[12px] font-extrabold text-secondaryDark">
                  {getRatingLabel(activeRating)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-amber-400 transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <Star
                      size={28}
                      className={
                        star <= activeRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 fill-transparent"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Field 2: Textarea for Review */}
            <div>
              <label className="block text-[13px] font-extrabold text-textMain mb-1.5">
                Your Review <span className="text-error">*</span>
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review here... How was the quality and experience?"
                className="w-full rounded-xl border border-borderSoft bg-white p-3 text-[13px] font-medium text-textMain placeholder:text-muted focus:border-secondaryDark focus:outline-none focus:ring-1 focus:ring-secondaryDark"
              />
            </div>

            {error && (
              <p className="text-[12px] font-bold text-error">{error}</p>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-borderSoft px-4 text-[13px] font-extrabold text-muted transition hover:bg-sageLight hover:text-textMain"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-secondaryDark px-5 text-[13px] font-extrabold text-white shadow-button transition hover:bg-secondaryDark/90 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
