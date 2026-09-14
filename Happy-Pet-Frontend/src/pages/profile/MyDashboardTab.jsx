import { useEffect, useState } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  MapPin,
} from "lucide-react";
import { accountApi } from "../../api/accountApi";
import { getOrderStatus, formatStatusText, getStatusStyle } from "../../utils/orderUtils";

const emptyDashboard = {
  stats: {
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    savedAddresses: 0,
  },
  recentOrders: [],
};

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function MyDashboardTab({ handleTabChange, addressesCount }) {
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    accountApi
      .getDashboard()
      .then((data) => {
        if (active) setDashboard(data || emptyDashboard);
      })
      .catch((error) => {
        console.error("Failed to load account dashboard:", error);
        if (active) setDashboard(emptyDashboard);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = {
    ...emptyDashboard.stats,
    ...dashboard.stats,
    savedAddresses: dashboard.stats?.savedAddresses ?? addressesCount,
  };
  const recentOrders = Array.isArray(dashboard.recentOrders)
    ? dashboard.recentOrders
    : [];

  return (
    <div className="animate-in fade-in duration-300 text-left flex-grow flex flex-col justify-between">
      <div>
        <div className="border-b border-brand-purple/5 pb-5 mb-8">
          <h2 className="text-2xl font-display font-extrabold text-brand-purple tracking-tight">
            My Dashboard
          </h2>
          <p className="text-xs text-brand-brown/60 mt-1 font-semibold">
            Track your orders, saved details, and account activity in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Orders",
              value: stats.totalOrders,
              icon: ShoppingBag,
              color: "text-brand-purple/60",
            },
            {
              label: "Pending Orders",
              value: stats.pendingOrders,
              icon: Clock,
              color: "text-amber-600/80",
            },
            {
              label: "Delivered Orders",
              value: stats.deliveredOrders,
              icon: CheckCircle,
              color: "text-emerald-600/85",
            },
            {
              label: "Saved Addresses",
              value: stats.savedAddresses,
              icon: MapPin,
              color: "text-[#5C3EBA]/80",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white border border-brand-purple/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between min-h-[100px]"
            >
              <div className={`flex justify-between items-center ${color}`}>
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  {label}
                </span>
                <Icon className="w-4 h-4 opacity-60" />
              </div>
              <p className="text-3xl font-extrabold text-brand-purple mt-2">
                {isLoading ? "-" : value}
              </p>
            </div>
          ))}
        </div>

        <div className="border border-gray-200 rounded-[24px] bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-brand-purple">
              Recent Orders
            </h3>
            <button
              onClick={() => handleTabChange("orders")}
              className="text-xs font-bold text-brand-purple/75 hover:text-[#5C3EBA] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-6 py-10 text-center text-xs font-semibold text-brand-brown/60">
              {isLoading ? "Loading recent orders..." : "No orders found yet."}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => {
                const orderId = order.orderNumber || order.orderId || order.id;
                const status = getOrderStatus(order);
                const displayStatus = formatStatusText(status);

                return (
                  <div
                    key={order.id || orderId}
                    className="px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="text-left">
                      <h4 className="font-extrabold text-xs text-brand-purple">
                        {orderId}
                      </h4>
                      <span className="text-[10px] text-brand-brown/50 font-bold block mt-0.5">
                        {formatDate(order.date || order.orderDate || order.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusStyle(status)}`}
                      >
                        {displayStatus}
                      </span>
                      <span className="text-xs font-black text-brand-purple">
                        ${Number(order.total || order.totalAmount || order.grandTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

