import { Package, MapPin, Truck, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardTab({
  orders = [],
  addresses = [],
  handleTabChange,
  setSelectedOrder,
  isLoading = false,
}) {
  const pendingOrders = orders.filter(
    (o) => o.status?.toLowerCase() !== "delivered" && o.status?.toLowerCase() !== "cancelled",
  ).length;

  const deliveredOrders = orders.filter(
    (o) => o.status?.toLowerCase() === "delivered",
  ).length;

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div>
        <h2 className="text-2xl font-bold text-on-background">My Dashboard</h2>
        <p className="text-xs text-charcoal-text mt-0.5">
          Track your orders, saved details, and account activity in one place.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="border border-outline rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-[#8a8f88] uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-3xl font-extrabold text-on-background mt-2">
            {isLoading ? "..." : orders.length}
          </p>
        </div>

        {/* Pending Orders */}
        <div className="border border-outline rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-[#8a8f88] uppercase tracking-wider">
            Pending Orders
          </p>
          <p className="text-3xl font-extrabold text-on-background mt-2">
            {isLoading ? "..." : pendingOrders}
          </p>
        </div>

        {/* Delivered Orders */}
        <div className="border border-outline rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-[#8a8f88] uppercase tracking-wider">
            Delivered Orders
          </p>
          <p className="text-3xl font-extrabold text-on-background mt-2">
            {isLoading ? "..." : deliveredOrders}
          </p>
        </div>

        {/* Saved Addresses */}
        <div className="border border-outline rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-[#8a8f88] uppercase tracking-wider">
            Saved Addresses
          </p>
          <p className="text-3xl font-extrabold text-on-background mt-2">
            {addresses.length}
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="border border-outline rounded-2xl bg-white overflow-hidden shadow-sm">
        <div className="border-b border-outline px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-lg text-on-background">
            Recent Orders
          </h3>
          {orders.length > 0 && (
            <button
              onClick={() => handleTabChange("orders")}
              className="text-xs font-bold text-secondary hover:underline cursor-pointer flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          )}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="py-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                <Loader2 className="animate-spin" size={16} />
                <span>Loading recent activity...</span>
              </div>
              <div className="h-10 bg-surface-soft animate-pulse rounded-xl"></div>
              <div className="h-10 bg-surface-soft animate-pulse rounded-xl"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package
                className="mx-auto text-[#8a8f88] mb-3 opacity-60"
                size={40}
              />
              <p className="text-[#8a8f88] text-sm">No orders yet.</p>
              <Link
                to="/shop"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary btn-primary-link px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:opacity-90 transition cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Shop Products</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-outline -my-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-background">
                        {order.id}
                      </span>
                      <span className="text-xs text-[#8a8f88]">&bull;</span>
                      <span className="text-xs text-charcoal-text">
                        {order.date}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-text mt-1 truncate max-w-md">
                      {order.items
                        .map((item) => `${item.name} (x${item.quantity})`)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        order.status.toLowerCase() === "delivered"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : order.status.toLowerCase() === "cancelled"
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-indigo-50 border-indigo-200 text-indigo-700"
                      }`}
                    >
                      {order.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        handleTabChange("orders");
                      }}
                      className="rounded-full bg-surface-soft hover:bg-surface-tint border border-outline px-3.5 py-1.5 text-xs font-bold text-primary transition cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
