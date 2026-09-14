import { useState } from "react";
import { StarIcon, XIcon } from "./common/HeaderIcons";
import { useToast } from "../context/ToastContext";

const customerReviews = [
  {
    id: 1,
    name: "Alicia Morgan",
    date: "May 18, 2026",
    image: "/images/img_ellipse_1.png",
    petImage: "/images/img_product_item_image_1.png",
    text: "My adult dog loves this food and the kibble size is perfect. Delivery was quick, packaging was clean, and the price was better than my local store.",
  },
  {
    id: 2,
    name: "Daniel Reed",
    date: "May 11, 2026",
    image: "/images/img_ellipse_1_1.png",
    petImage: "/images/img_trending_item_image.png",
    text: "Good nutrition profile and no stomach issues after switching. The 3kg pack is a nice trial size before moving to the bigger bag.",
  },
];

const Stars = ({ rating = 5 }) => (
  <span className="flex items-center gap-0.5 text-[#d9aa3d]">
    {Array.from({ length: 5 }).map((_, index) => (
      <StarIcon
        key={index}
        className={`h-3.5 w-3.5 ${
          index < rating
            ? "fill-[#d9aa3d] text-[#d9aa3d]"
            : "fill-[#17345f1a] text-[#17345f1a]"
        }`}
      />
    ))}
  </span>
);

const CustomerReviews = () => {
  const [reviews, setReviews] = useState(customerReviews);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rating: "5",
    text: "",
  });
  const [errors, setErrors] = useState({});
  const { showToast } = useToast();

  const validate = () => {
    const nextErrors = {};
    const nameVal = formData.name.trim();
    if (!nameVal) {
      nextErrors.name = "Your name is required.";
    } else if (nameVal.length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    } else if (nameVal.length > 50) {
      nextErrors.name = "Name must not exceed 50 characters.";
    }

    const textVal = formData.text.trim();
    if (!textVal) {
      nextErrors.text = "Review message is required.";
    } else if (textVal.length < 10) {
      nextErrors.text = "Review message must be at least 10 characters.";
    } else if (textVal.length > 1000) {
      nextErrors.text = "Review message must not exceed 1000 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const nextReview = {
      id: Date.now(),
      name: formData.name.trim(),
      date: "Just now",
      image: "/images/img_ellipse_1.png",
      petImage: "/images/img_product_item_image.png",
      text: formData.text.trim(),
      rating: Number(formData.rating),
    };

    setReviews((items) => [nextReview, ...items]);
    setFormData({ name: "", rating: "5", text: "" });
    setErrors({});
    setReviewOpen(false);
    showToast("Review submitted successfully!");
  };

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold text-[#122a50]">
          Customer Reviews
        </h2>
        <button
          type="button"
          className="inline-flex rounded-lg border border-[#17345f] px-4 py-2 text-sm font-extrabold text-[#17345f] transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d] cursor-pointer"
          onClick={() => setReviewOpen(true)}
        >
          Write a Review
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-left"
          >
            <div className="flex items-start gap-3">
              <img
                src={review.image}
                alt={review.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#122a50]">
                    {review.name}
                  </h3>
                  <span className="rounded-full bg-[#f8f1df] px-2 py-1 text-[10px] font-extrabold uppercase text-[#17345f]">
                    Verified Purchase
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Stars rating={review.rating || 5} />
                  <span className="text-xs font-semibold text-[#122a50b2]">
                    {review.date}
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold leading-7 text-[#122a50]">
              {review.text}
            </p>

            <img
              src={review.petImage}
              alt={`${review.name} uploaded pet product`}
              className="mt-4 h-24 w-24 rounded-xl border border-[#17345f1a] object-cover"
            />
          </article>
        ))}
      </div>

      {reviewOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#111111]/45"
            onClick={() => setReviewOpen(false)}
            aria-label="Close review form backdrop"
          />
          <form
            className="relative z-10 w-full max-w-[520px] rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-[0_24px_80px_rgba(18,42,80,0.22)] text-left"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#122a50]">
                  Write a Review
                </h3>
                <p className="mt-1 text-sm font-semibold text-[#122a50b2]">
                  Share your experience with this product.
                </p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#17345f1a] text-[#122a50] transition-colors hover:border-[#d9aa3d] hover:text-[#d9aa3d] cursor-pointer"
                onClick={() => setReviewOpen(false)}
                aria-label="Close review form"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#122a50]">Your Name *</span>
                  <span className="text-[10px] font-semibold text-[#122a50]/50">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  maxLength={50}
                  onChange={(event) => {
                    setFormData((data) => ({ ...data, name: event.target.value }));
                    if (errors.name) setErrors((e) => ({ ...e, name: "" }));
                  }}
                  className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-colors focus:border-[#d9aa3d] ${
                    errors.name ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                  }`}
                  placeholder="Enter your name"
                />
                {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#122a50]">Rating *</span>
                </div>
                <select
                  value={formData.rating}
                  onChange={(event) =>
                    setFormData((data) => ({ ...data, rating: event.target.value }))
                  }
                  className="h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-colors focus:border-[#d9aa3d]"
                >
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#122a50]">Review *</span>
                  <span className="text-[10px] font-semibold text-[#122a50]/50">Min 10, Max 1000 chars</span>
                </div>
                <textarea
                  value={formData.text}
                  maxLength={1000}
                  onChange={(event) => {
                    setFormData((data) => ({ ...data, text: event.target.value }));
                    if (errors.text) setErrors((e) => ({ ...e, text: "" }));
                  }}
                  className={`min-h-32 w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm font-semibold text-[#122a50] outline-none transition-colors focus:border-[#d9aa3d] ${
                    errors.text ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                  }`}
                  placeholder="Write your review..."
                />
                {errors.text && <p className="mt-1 text-xs font-semibold text-red-600">{errors.text}</p>}
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 h-12 w-full rounded-lg bg-[#17345f] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.22)] transition-colors hover:bg-[#d9aa3d] cursor-pointer"
            >
              Submit Review
            </button>
          </form>
        </div>
      )}
    </section>
  );
};

export default CustomerReviews;
