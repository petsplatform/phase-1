import { ShoppingCart } from "lucide-react";
import SectionCard from "./SectionCard";
import MiniTable from "./MiniTable";
import StatusBadge from "../common/StatusBadge";

const formatUSD = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value || 0));

export default function RecentOrders({ orders, onSelect }) {
  return (
    <SectionCard
      title="Recent Orders"
      icon={ShoppingCart}
      badge={orders.length}
    >
      <MiniTable
        rows={orders}
        cols={[
          { key: "id", label: "Order ID" },
          { key: "customer", label: "Customer" },
          {
            key: "amount",
            label: "Amount",
            render: (v) => formatUSD(v),
          },
          {
            key: "status",
            label: "Status",
            render: (v) => <StatusBadge status={v} />,
          },

          {
            key: "id",
            label: "Active",
            render: (_, row) => (
              <button
                onClick={() => onSelect(row)}
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--primary)" }}
              >
                View
              </button>
            ),
          },
        ]}
      />
    </SectionCard>
  );
}
