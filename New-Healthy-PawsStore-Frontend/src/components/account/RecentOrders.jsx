import { ChevronRight } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";

export default function RecentOrders({ orders }) {
  return (
    <section className="rounded-[16px] bg-white">
      <h2 className="mb-4 font-display text-[18px] font-extrabold text-textMain">Recent Orders</h2>
      <div className="overflow-hidden rounded-[14px] border border-borderSoft">
        {orders.slice(0, 3).map((order) => (
          <a key={order.id} href="/account/orders" className="grid min-h-[54px] gap-3 border-b border-borderSoft px-4 py-3 text-[12px] font-semibold last:border-b-0 sm:grid-cols-[1.2fr_1fr_1fr_auto_auto] sm:items-center">
            <strong>Order #{order.id}</strong>
            <span className="text-muted">{order.date}</span>
            <OrderStatusBadge status={order.status} />
            <strong>${order.total.toFixed(2)}</strong>
            <ChevronRight size={16} />
          </a>
        ))}
      </div>
    </section>
  );
}
