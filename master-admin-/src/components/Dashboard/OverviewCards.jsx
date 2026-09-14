import { motion } from "framer-motion";
import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import { StatCard } from "../common/Card";
import { isSuperAdmin } from "../../lib/api";

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  },
};

export default function OverviewCards({ stats: dashboardStats }) {
  const monochrome = isSuperAdmin();
  const stats = [
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: `$${(dashboardStats.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: "Completed order value",
      color: monochrome ? "#111111" : "#059669",
    },
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: (dashboardStats.totalOrders || 0).toLocaleString(),
      sub: "All customer orders",
      color: "var(--primary)",
    },
    {
      icon: Package,
      label: "Pending Orders",
      value: (dashboardStats.pendingOrders || 0).toLocaleString(),
      sub: "Awaiting action",
      color: monochrome ? "#111111" : "#d97706",
    },
    {
      icon: Users,
      label: "Total Customers",
      value: (dashboardStats.totalCustomers || 0).toLocaleString(),
      sub: "Registered customers",
      color: monochrome ? "#111111" : "#7c3aed",
    },
    {
      icon: Boxes,
      label: "Total Products",
      value: (dashboardStats.totalProducts || 0).toLocaleString(),
      sub: "Catalog items",
      color: monochrome ? "#111111" : "#0891b2",
    },
    {
      icon: AlertTriangle,
      label: "Low Stock Items",
      value: (dashboardStats.lowStockItems || 0).toLocaleString(),
      sub: "Stock at 5 or less",
      color: monochrome ? "#111111" : "#dc2626",
    },
  ];

  return (
    <motion.div
      variants={stagger.container}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-3 sm:gap-4 mb-6"
    >
      {stats.map((s, i) => (
        <motion.div key={i} variants={stagger.item}>
          <StatCard {...s} />
        </motion.div>
      ))}
    </motion.div>
  );
}
