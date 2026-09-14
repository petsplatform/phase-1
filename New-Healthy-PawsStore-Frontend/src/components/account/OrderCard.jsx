import { ChevronDown, Star } from "lucide-react";
import { useState } from "react";
import OrderDetailsDrawer from "./OrderDetailsDrawer";
import OrderStatusBadge from "./OrderStatusBadge";
import AddReviewModal from "./AddReviewModal";
import { Link } from "react-router-dom";

const formatOrderDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function OrderCard({ order }) {
  const [open, setOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const orderStatus = order.status?.toLowerCase();
  const isDelivered = orderStatus === "delivered";
  const isCancelled = orderStatus === "cancelled" || orderStatus === "canceled";

  return (
    <article className="rounded-[16px] border border-borderSoft bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
            <div className="flex items-center gap-2.5">
              <strong className="text-[14px] font-extrabold text-secondaryDark sm:text-[15px]">
                Order #{order.id}
              </strong>
              <OrderStatusBadge status={order.status} />
            </div>
            <strong className="text-[15px] font-extrabold text-textMain md:hidden">
              ${order.total.toFixed(2)}
            </strong>
          </div>
          <p className="mt-1 text-[12px] font-semibold text-muted">
            {formatOrderDate(order.date)} | {order.items.length}{" "}
            {order.items.length === 1 ? "Item" : "Items"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {order.items.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="size-12 rounded-xl border border-borderSoft bg-sageLight/30 p-1"
              >
                <img
                  src={item.image}
                  alt={item.title || "Order item"}
                  className="size-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        <strong className="hidden text-[17px] font-extrabold text-textMain md:block">
          ${order.total.toFixed(2)}
        </strong>

        <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
          {!isCancelled && (
            <Link
              to={`/account/track-order?orderId=${order.id}`}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondaryDark px-4 text-[13px] font-extrabold text-white !text-white shadow-sm transition hover:bg-opacity-90 md:flex-none"
            >
              Track Order
            </Link>
          )}

          {isDelivered && (
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 text-[13px] font-extrabold text-white shadow-sm transition hover:bg-amber-600 md:flex-none"
            >
              <Star size={15} className="fill-white" />
              Add Review
            </button>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-borderSoft px-4 text-[13px] font-extrabold transition hover:bg-sageLight ${
              isDelivered ? "w-full md:w-auto" : "flex-1 md:flex-none"
            }`}
          >
            View Details{" "}
            <ChevronDown
              size={16}
              className={
                open
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </button>
        </div>
      </div>

      {open && (
        <OrderDetailsDrawer
          order={order}
          onAddReview={() => setShowReviewModal(true)}
        />
      )}

      {showReviewModal && (
        <AddReviewModal
          order={order}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </article>
  );
}
