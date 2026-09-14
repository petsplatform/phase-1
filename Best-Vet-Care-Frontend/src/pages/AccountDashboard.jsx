import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Gift, PawPrint, RefreshCw, ShieldCheck } from "lucide-react";
import AccountLayout from "../components/account/AccountLayout";
import { featureFlags } from "../config/siteNavigation";
import { accountApi } from "../api/accountApi";
import { orderApi } from "../api/orderApi";
import { useToast } from "../context/ToastContext";

const currency = (value) => `$${Number(value || 0).toFixed(2)}`;

const statusClass = (status) => {
  if (status === "Delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "Cancelled") return "bg-red-50 text-red-600";
  return "bg-[#f8f1df] text-[#17345f]";
};

const AccountDashboard = () => {
  const { showToast } = useToast();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    accountApi
      .getDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((error) => showToast(error.response?.data?.message || "Could not load dashboard", "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const stats = dashboard?.stats || {};
  const recentOrders = dashboard?.recentOrders || [];
  const cards = [
    { label: "Total Orders", value: stats.totalOrders || 0 },
    { label: "Pending Orders", value: stats.pendingOrders || 0 },
    { label: "Delivered Orders", value: stats.deliveredOrders || 0 },
    { label: "Saved Addresses", value: stats.savedAddresses || 0 },
    featureFlags.rewardPoints && { label: "Reward Points", value: stats.rewardPoints || 0, to: "/reward-points" },
  ].filter(Boolean);
  const sections = [
    featureFlags.rewardPoints && {
      title: "Rewards",
      text: `${stats.rewardPoints || 0} points available`,
      to: "/reward-points",
      icon: Gift,
    },
    {
      title: "Login & Security",
      text: "Manage profile, password, and account access.",
      to: "/account/details",
      icon: ShieldCheck,
    },
    featureFlags.autoOrder && {
      title: "Repeat Delivery",
      text: `${stats.repeatDeliveryCount || 0} active or paused repeat deliveries`,
      to: "/account/auto-orders",
      icon: RefreshCw,
    },
    featureFlags.petDetails && {
      title: "Pet Details",
      text: `${stats.petCount || 0} pet profiles saved`,
      to: "/account/pets",
      icon: PawPrint,
    },
  ].filter(Boolean);

  return (
    <AccountLayout title="My Dashboard" description="Track your orders, saved details, and account activity in one place.">
      {loading ? (
        <div className="rounded-2xl border border-[#17345f1a] bg-white p-8 text-sm font-bold text-[#122a50b2] shadow-sm">Loading dashboard...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const content = (
                <>
                  <p className="text-sm font-extrabold text-[#122a50b2]">{card.label}</p>
                  <p className="mt-3 text-3xl font-extrabold text-[#17345f]">{card.value}</p>
                </>
              );

              return card.to ? (
                <Link key={card.label} to={card.to} className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm transition hover:border-[#d9aa3d]">
                  {content}
                </Link>
              ) : (
                <div key={card.label} className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                  {content}
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.title} to={section.to} className="rounded-lg border border-[#17345f1a] bg-white p-5 shadow-sm transition hover:border-[#d9aa3d]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f1df] text-[#d9aa3d]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-base font-extrabold text-[#122a50]">{section.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">{section.text}</p>
                </Link>
              );
            })}
          </div>

          <div className="rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#17345f1a] px-5 py-4">
              <h2 className="text-lg font-extrabold text-[#122a50]">Recent Orders</h2>
              <Link to="/account/orders" className="text-sm font-extrabold text-[#17345f] hover:text-[#d9aa3d]">View All</Link>
            </div>
            {recentOrders.length ? (
              <div className="divide-y divide-[#17345f1a]">
                {recentOrders.map((order) => (
                  <div key={order.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div>
                      <p className="font-extrabold text-[#122a50]">{order.id}</p>
                      <p className="mt-1 text-xs font-semibold text-[#122a50b2]">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(order.status)}`}>{order.status}</span>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <p className="font-extrabold text-[#17345f]">{currency(order.total)}</p>
                      <a
                        href={orderApi.invoiceUrl(order.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9aa3d] text-[#17345f] transition-colors hover:bg-[#d9aa3d] hover:text-white"
                        aria-label={`View invoice for order ${order.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-[#122a50b2]">No orders yet.</p>
                <Link to="/products" className="mt-4 inline-flex rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d]">Shop Products</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default AccountDashboard;
