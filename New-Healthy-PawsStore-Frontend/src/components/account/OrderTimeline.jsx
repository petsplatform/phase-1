import { CheckCircle, Package, Truck } from "lucide-react";

const timeline = [
  { key: "placed", label: "Order Placed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out-for-delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const statusStepMap = {
  pending: 0,
  placed: 0,
  "order-placed": 0,
  confirmed: 0,
  processing: 1,
  packed: 1,
  shipped: 2,
  "out-for-delivery": 3,
  out_for_delivery: 3,
  delivered: 4,
};

function normalizeStatus(status) {
  return String(status || "placed")
    .toLowerCase()
    .replaceAll("_", "-")
    .replace(/\s+/g, "-");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrderTimeline({ currentStatus, orderDate, estimatedDelivery }) {
  const normalizedStatus = normalizeStatus(currentStatus);
  const isCancelled = normalizedStatus === "cancelled" || normalizedStatus === "canceled";

  if (isCancelled) {
    return (
      <div className="mt-6 rounded-[16px] border border-rose-200 bg-rose-50 p-5 text-center shadow-card">
        <p className="text-[14px] font-extrabold text-rose-700">
          This order has been cancelled. Shipment tracking is no longer active.
        </p>
      </div>
    );
  }

  const activeIndex = statusStepMap[normalizedStatus] ?? 0;
  const placedDate = formatDate(orderDate);
  const deliveryDate = formatDate(estimatedDelivery);

  return (
    <div className="mt-6 rounded-[16px] bg-white p-6 shadow-card space-y-4">
      <h2 className="font-display text-[22px] font-extrabold text-textMain">Shipment Progress</h2>
      
      <div className="relative pt-2">
        {/* Horizontal progress bar (desktop) */}
        <div className="absolute top-[26px] left-[10%] right-[10%] hidden md:block h-1 bg-borderSoft/60 z-0">
          <div
            className="h-full bg-secondaryDark transition-all duration-500 rounded-full"
            style={{
              width: `${(activeIndex / (timeline.length - 1)) * 100}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-5 relative z-10">
          {timeline.map(({ key, label, icon: Icon }, index) => {
            const complete = index <= activeIndex;
            const date =
              index === 0
                ? placedDate
                : index === activeIndex && activeIndex > 0
                ? deliveryDate
                : "";

            return (
              <article key={label} className="relative flex flex-col items-center text-center">
                <span
                  className={`grid size-11 place-items-center rounded-full border-2 transition-all duration-300 ${
                    complete
                      ? "border-secondaryDark bg-secondaryDark text-white shadow-md"
                      : "border-borderSoft bg-white text-muted"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <strong className={`mt-2 block text-[13px] ${complete ? "text-textMain font-extrabold" : "text-muted font-semibold"}`}>
                  {label}
                </strong>
                {date && <span className="text-[11px] font-semibold text-muted mt-0.5">{date}</span>}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
