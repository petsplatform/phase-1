import { orderStatuses } from "../../data/accountNavigation";

export default function OrderStatusBadge({ status }) {
  const config = orderStatuses[status] || orderStatuses.pending;

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${config.className}`}>
      {config.label}
    </span>
  );
}
