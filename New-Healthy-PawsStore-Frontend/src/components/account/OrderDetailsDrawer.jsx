import { Star } from "lucide-react";

export default function OrderDetailsDrawer({ order, onAddReview }) {
  const isDelivered = order.status?.toLowerCase() === "delivered";

  return (
    <div className="mt-4 rounded-xl bg-sageLight p-4 text-[13px] font-semibold text-textMain">
      <p><strong>Shipping Address:</strong> {order.address}</p>
      <p className="mt-2"><strong>Payment:</strong> Paid</p>
      {order.trackingNumber && (
        <p className="mt-2"><strong>Tracking:</strong> {order.trackingNumber}</p>
      )}

      <div className="mt-3 grid gap-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4">
            <span className="min-w-0 break-words">
              {item.title || item.name || "Product"} x {item.quantity}
            </span>
            <strong className="shrink-0">${(item.price * item.quantity).toFixed(2)}</strong>
          </div>
        ))}
      </div>

      {isDelivered && onAddReview && (
        <div className="mt-4 border-t border-borderSoft/60 pt-3">
          <button
            type="button"
            onClick={onAddReview}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 text-[12px] font-extrabold text-white shadow-sm transition hover:bg-amber-600"
          >
            <Star size={14} className="fill-white" />
            Add Review
          </button>
        </div>
      )}
    </div>
  );
}
