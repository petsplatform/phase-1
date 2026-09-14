import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Truck,
  Heart,
  MapPin,
  User,
  ShoppingBag,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Eye,
  Star,
} from "lucide-react";
import AccountLayout from "./AccountLayout";
import { AuthContext } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import { OrderContext } from "../../context/OrderContext";

const STATUS_META = {
  Pending: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    icon: Clock,
  },
  Processing: {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    icon: Clock,
  },
  Shipped: {
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    icon: Truck,
  },
  Delivered: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: Package,
  },
};

const getStatusMeta = (status) => {
  if (!status) return STATUS_META.Pending;
  const key = Object.keys(STATUS_META).find(
    (k) => k.toLowerCase() === status.toLowerCase()
  );
  return STATUS_META[key] || STATUS_META.Pending;
};

const StatCard = ({ label, value, icon: Icon, accent, sub }) => (
  <div className="bg-white rounded-2xl border border-[#D9E8F2] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-black text-[#073B66] leading-none">{value}</p>
      <p className="text-xs font-semibold text-[#627D98] mt-1 truncate">{label}</p>
      {sub && <p className="text-[10px] text-[#9FB3C8] mt-0.5">{sub}</p>}
    </div>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { wishlist } = useContext(AppContext);
  const { orders } = useContext(OrderContext);

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(
    (o) => o.status?.toLowerCase() === "delivered"
  ).length;
  const pendingOrders = orders.filter(
    (o) =>
      o.status?.toLowerCase() === "pending" ||
      o.status?.toLowerCase() === "processing" ||
      o.status?.toLowerCase() === "shipped"
  ).length;
  const wishlistCount = wishlist ? wishlist.length : 0;

  const recentOrders = orders.slice(0, 3);

  return (
    <AccountLayout
      title={`Welcome back, ${user?.name || "Valued Customer"}!`}
      subtitle="Manage your orders, track shipments, update profiles, and view your prescription details."
    >
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Orders"
          value={totalOrders}
          icon={ShoppingBag}
          accent="bg-[#EAF5FC] text-[#087BC1]"
          sub="All time orders"
        />
        <StatCard
          label="In Transit / Active"
          value={pendingOrders}
          icon={Truck}
          accent="bg-blue-50 text-blue-600"
          sub="Processing or Shipped"
        />
        <StatCard
          label="Delivered"
          value={deliveredOrders}
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-600"
          sub="Completed deliveries"
        />
        <StatCard
          label="Wishlist Items"
          value={wishlistCount}
          icon={Heart}
          accent="bg-pink-50 text-pink-600"
          sub="Saved items"
        />
      </div>

      {/* Quick Navigation Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/account/orders"
          className="bg-white border border-[#D9E8F2] hover:border-[#087BC1]/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF5FC] text-[#087BC1] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-[#073B66] group-hover:text-[#087BC1] transition-colors">
                My Orders
              </h4>
              <p className="text-xs text-[#627D98]">View and track all orders</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9FB3C8] group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/account/profile"
          className="bg-white border border-[#D9E8F2] hover:border-[#087BC1]/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-[#073B66] group-hover:text-[#087BC1] transition-colors">
                Profile Settings
              </h4>
              <p className="text-xs text-[#627D98]">Update personal info</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9FB3C8] group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/account/addresses"
          className="bg-white border border-[#D9E8F2] hover:border-[#087BC1]/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm text-[#073B66] group-hover:text-[#087BC1] transition-colors">
                Shipping Addresses
              </h4>
              <p className="text-xs text-[#627D98]">Manage delivery locations</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9FB3C8] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-2xl border border-[#D9E8F2] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading font-black text-lg text-[#073B66]">
              Recent Orders
            </h3>
            <p className="text-xs text-[#627D98] mt-0.5">
              Your latest purchases and tracking details
            </p>
          </div>
          <Link
            to="/account/orders"
            className="text-xs font-bold text-[#087BC1] hover:text-[#F28A16] flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-3 bg-[#F7FAFC] rounded-xl border border-dashed border-[#D9E8F2]">
            <ShoppingBag className="w-8 h-8 text-[#9FB3C8]" />
            <p className="text-sm font-semibold text-[#627D98]">
              No orders placed yet.
            </p>
            <Link
              to="/shop"
              className="text-xs font-bold text-white bg-[#073B66] hover:bg-[#087BC1] px-5 py-2 rounded-xl transition-all"
            >
              Explore Shop Catalog
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentOrders.map((order) => {
              const meta = getStatusMeta(order.status);
              const StatusIcon = meta.icon;
              return (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-[#D9E8F2] bg-[#F7FAFC] hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-[#D9E8F2] flex items-center justify-center text-[#087BC1] shrink-0 font-bold">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-[#073B66]">
                          {order.id}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {order.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-[#627D98] mt-0.5">
                        {order.items ? `${order.items.length} item(s)` : "1 item"} · $
                        {Number(order.grandTotal || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => navigate(`/order-success/${order.id}`)}
                      className="text-xs font-bold text-[#073B66] hover:text-[#087BC1] border border-[#D9E8F2] hover:border-[#087BC1]/30 bg-white px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

export default DashboardPage;
