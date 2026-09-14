import { useState, useEffect } from "react";
import { Star, X, CheckCircle } from "lucide-react";

export default function AddReviewModal({
  isOpen,
  onClose,
  item,
  orderItems = [],
  onSubmit,
}) {
  const [activeItem, setActiveItem] = useState(item || (orderItems.length > 0 ? orderItems[0] : null));
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setActiveItem(item);
    } else if (orderItems.length > 0) {
      setActiveItem(orderItems[0]);
    }
  }, [item, orderItems]);

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setHoverRating(0);
      setReviewText("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen, activeItem]);

  if (!isOpen || !activeItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }
    const val = reviewText.trim();
    if (!val) {
      setError("Please write your review before submitting.");
      return;
    }
    if (val.length < 10) {
      setError("Review must be at least 10 characters long.");
      return;
    }
    if (val.length > 1000) {
      setError("Review must not exceed 1000 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    if (onSubmit) {
      onSubmit({
        itemId: activeItem.id || activeItem.productId,
        productName: activeItem.name || activeItem.title,
        rating,
        reviewText: val,
      });
    }
    setIsSubmitting(false);
    onClose();
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 1:
        return "1 Star - Poor";
      case 2:
        return "2 Stars - Fair";
      case 3:
        return "3 Stars - Good";
      case 4:
        return "4 Stars - Very Good";
      case 5:
        return "5 Stars - Excellent";
      default:
        return "Select a Rating";
    }
  };

  const currentDisplayRating = hoverRating || rating;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-outline shadow-2xl relative transition-all duration-300 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-charcoal-text hover:text-secondary transition p-1 rounded-full hover:bg-neutral-100 cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-3 py-1 rounded-full">
            Verified Purchase
          </span>
          <h3 className="text-2xl font-black text-on-background mt-2">Write a Review</h3>
          <p className="text-xs text-charcoal-text mt-1">
            Share your experience to help other pet owners make informed choices.
          </p>
        </div>

        {/* Product selector if multiple items exist */}
        {orderItems.length > 1 && !item && (
          <div className="mb-5">
            <label className="block text-xs font-bold text-on-background mb-1.5">
              Select Item to Review
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {orderItems.map((orderItem) => {
                const isSelected = activeItem?.id === orderItem.id;
                return (
                  <button
                    key={orderItem.id}
                    type="button"
                    onClick={() => setActiveItem(orderItem)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                      isSelected
                        ? "bg-secondary/10 border-secondary text-secondary"
                        : "bg-surface border-outline hover:border-secondary/40 text-charcoal-text"
                    }`}
                  >
                    {orderItem.image && (
                      <img
                        src={orderItem.image}
                        alt={orderItem.name || orderItem.title}
                        className="w-7 h-7 rounded-lg object-cover border border-outline"
                      />
                    )}
                    <span className="truncate max-w-[120px]">{orderItem.name || orderItem.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Product Card Preview */}
        <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-surface-soft border border-outline mb-6">
          {activeItem.image ? (
            <img
              src={activeItem.image}
              alt={activeItem.name || activeItem.title}
              className="h-16 w-16 rounded-xl object-cover border border-outline shrink-0 bg-white"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl border border-outline bg-secondary/10 flex items-center justify-center shrink-0 text-secondary font-bold text-xl">
              🐾
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-on-background text-sm truncate">
              {activeItem.name || activeItem.title}
            </h4>
            {activeItem.quantity && (
              <p className="text-xs text-charcoal-text mt-0.5">Quantity: {activeItem.quantity}</p>
            )}
            {activeItem.price && (
              <p className="text-xs font-extrabold text-secondary mt-0.5">
                ${Number(activeItem.price).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="mb-4 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Star Rating Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-on-background">
                Overall Rating <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-bold text-amber-600">
                {getRatingLabel(currentDisplayRating)}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-100 justify-center">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= currentDisplayRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform transform hover:scale-125 focus:outline-none cursor-pointer"
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    <Star
                      size={32}
                      className={`transition-colors duration-150 ${
                        isFilled
                          ? "fill-amber-400 text-amber-500 drop-shadow-xs"
                          : "fill-none text-neutral-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="order-review-textarea" className="block text-xs font-bold text-on-background">
                Your Review <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-charcoal-text/60">Min 10, Max 1000 chars</span>
            </div>
            <textarea
              id="order-review-textarea"
              rows={4}
              maxLength={1000}
              placeholder="What did you like or dislike about this product? How did your pet react to it?"
              value={reviewText}
              onChange={(e) => {
                setReviewText(e.target.value);
                if (error) setError("");
              }}
              className="w-full text-xs bg-surface-soft border border-outline rounded-2xl p-4 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition resize-none text-on-background placeholder:text-neutral-400"
            />
            <p className="text-[10px] text-charcoal-text mt-1 text-right">
              {reviewText.length} / 1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-outline hover:bg-neutral-100 text-on-background py-3 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-secondary hover:bg-secondary/90 text-white py-3 text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
