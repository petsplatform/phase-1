import { ExternalLink } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";

function buildTrackingUrl(order) {
  if (order.trackingUrl) return order.trackingUrl;

  const trackingId = order.trackingNumber || order.awbNumber;
  if (!trackingId) return "";

  return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodeURIComponent(
    trackingId,
  )}`;
}

export default function TrackingOrderDetails({ order }) {
  if (!order) return null;

  const status = order.status?.toLowerCase();
  const isCancelled = status === "cancelled" || status === "canceled";
  const trackingUrl = isCancelled ? "" : buildTrackingUrl(order);

  const validCards = [
    {
      label: "Courier",
      value: order.courierName || order.carrier,
      isMono: false,
    },
    {
      label: "Tracking #",
      value: order.trackingNumber,
      isMono: true,
    },
    {
      label: "AWB #",
      value: order.awbNumber,
      isMono: true,
    },
    {
      label: "Est. Delivery",
      value: order.estimatedDelivery,
      isMono: false,
    },
  ].filter(
    ({ value }) =>
      value &&
      value !== "N/A" &&
      value !== "—" &&
      value !== "Processing" &&
      value !== "Address not available",
  );

  return (
    <section className="mt-6 rounded-[16px] border border-borderSoft bg-white p-5 shadow-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-[22px] font-extrabold">
            Shipment Details
          </h2>
          <OrderStatusBadge status={order.status} />
        </div>
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-teal text-brand-text px-4 text-[12px] font-extrabold transition hover:bg-opacity-90"
          >
            <ExternalLink size={14} />
            Track Shipment
          </a>
        )}
      </div>

      {validCards.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {validCards.map(({ label, value, isMono }) => (
            <div
              key={label}
              className="rounded-xl border border-borderSoft bg-sageLight/40 p-3"
            >
              <p className="text-[10px] font-extrabold uppercase text-muted">
                {label}
              </p>
              <p
                className={`mt-1 text-[13px] font-extrabold text-textMain ${isMono ? "font-mono" : "capitalize"}`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
