import { motion } from "framer-motion";
import {
  ArrowRight,
  Users,
  Package,
  ShoppingCart,
  Shield,
  Wrench,
  HeadphonesIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../common/Card";

const quickLinks = [
  {
    label: "Manage Customers",
    icon: Users,
    path: "/users/customers",
    color: "#3b82f6",
  },
  {
    label: "View Products",
    icon: Package,
    path: "/products/list",
    color: "#10b981",
  },
  {
    label: "Recent Orders",
    icon: ShoppingCart,
    path: "/orders/list",
    color: "#f59e0b",
  },
  {
    label: "Shipping Plans",
    icon: Shield,
    path: "/amc/plans",
    color: "#6366f1",
  },
  {
    label: "Fulfillment Tasks",
    icon: Wrench,
    path: "/services/list",
    color: "#ef4444",
  },
  // {
  //   label: "Support Tickets",
  //   icon: HeadphonesIcon,
  //   path: "/support/tickets",
  //   color: "#8b5cf6",
  // },
];

export default function HomePortal() {
  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <section className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-display font-black text-gray-900 mb-4"
          >
            Welcome back, <span style={{ color: "var(--primary)" }}>Admin</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg mb-6 leading-relaxed"
          >
            Manage your ecommerce store with ease. Monitor sales, track
            fulfillment, and support your customers all in one place.
          </motion.p>
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 text-white font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
              style={{ background: "var(--primary)" }}
            >
              Go to Dashboard <ArrowRight size={18} />
            </motion.button>
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
          <Shield size={256} style={{ color: "var(--primary)" }} />
        </div>
      </section>

      {/* Quick Access */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-gray-700 text-xl pl-1">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link, i) => (
            <Link key={link.path} to={link.path}>
              <Card hover className="h-full group">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                    style={{ background: `${link.color}15` }}
                  >
                    <link.icon size={24} style={{ color: link.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-gray-800">
                      {link.label}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Manage and track your {link.label.toLowerCase()}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 group-hover:text-primary transition-colors group-hover:translate-x-1"
                  />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
