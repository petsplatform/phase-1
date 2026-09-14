import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import OverviewCards from "../../components/Dashboard/OverviewCards";
import PerformanceCards from "../../components/Dashboard/PerformanceCards";
import RevenueTrendChart from "../../components/Dashboard/RevenueTrendChart";
import SalesTrendChart from "../../components/Dashboard/SalesTrendChart";
import OrderStatusChart from "../../components/Dashboard/OrderStatusChart";
import TopProducts from "../../components/Dashboard/TopProducts";
import TopCategories from "../../components/Dashboard/TopCategories";
import LowStockAlerts from "../../components/Dashboard/LowStockAlerts";
import RecentOrders from "../../components/Dashboard/RecentOrders";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import StoreChooser, {
  useSelectedSuperAdminStore,
  useSuperAdminStores,
} from "../../components/SuperAdmin/StoreChooser";
import { adminApi, getAdminToken, isSuperAdmin } from "../../lib/api";
import { filterBySelectedStore, isAllStoresSelected } from "../../lib/superAdminStore";
import { formatAddress } from "../../utils/addressFormatting";
import { canChangeOrderStatus } from "../../utils/orderStatusTransitions";

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

const normalizeStatus = (s) => String(s || "pending").toLowerCase();
const toApiOrderStatus = (status) =>
  ({
    pending: "Pending",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  })[normalizeStatus(status)] || status;

const isLowStockProduct = (product) => {
  const stock = Number(product.stock || 0);
  return stock > 0 && stock <= 5;
};
const isPendingOrder = (order) => order.orderStatus === "Pending";
const isRevenueOrder = (order) =>
  order.paymentStatus === "Paid" && order.orderStatus !== "Cancelled";
const sumRevenue = (orders) =>
  orders.filter(isRevenueOrder).reduce((sum, order) => sum + Number(order.total || 0), 0);

const formatUSD = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(Number(value || 0));

export default function Dashboard() {
  const readOnly = isSuperAdmin();
  const stores = useSuperAdminStores();
  const { selectedKey, label: selectedStoreLabel } = useSelectedSuperAdminStore(stores);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestRef = useRef(0);

  const loadDashboard = useCallback((showSpinner = true) => {
    const requestId = ++requestRef.current;
    if (showSpinner) {
      setSelectedOrder(null);
    }

    if (!getAdminToken()) {
      setSummary(null);
      setLoading(false);
      return;
    }

    if (showSpinner) {
      setLoading(true);
      setError("");
    }
    const dashboardFilters = {
      range: "all",
      ...(readOnly && !isAllStoresSelected(selectedKey)
        ? { storeKey: selectedKey }
        : {}),
    };

    adminApi
      .dashboard(dashboardFilters)
      .then((data) => {
        if (requestId === requestRef.current) setSummary(data);
      })
      .catch((err) => {
        if (requestId === requestRef.current) setError(err.message || "Unable to load dashboard data");
      })
      .finally(() => {
        if (requestId === requestRef.current && showSpinner) setLoading(false);
      });
  }, [readOnly, selectedKey]);

  useEffect(() => {
    loadDashboard();
    const refreshSilently = () => loadDashboard(false);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshSilently();
    };
    const refreshTimer = window.setInterval(refreshSilently, 30000);

    window.addEventListener("admin-auth-change", loadDashboard);
    window.addEventListener("focus", refreshSilently);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      requestRef.current += 1;
      window.clearInterval(refreshTimer);
      window.removeEventListener("admin-auth-change", loadDashboard);
      window.removeEventListener("focus", refreshSilently);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadDashboard]);

  const allOrders = summary?.orders || summary?.recentOrders || [];
  const shouldClientFilter = readOnly && !summary?.range?.storeKey;
  const selectedOrders = shouldClientFilter ? filterBySelectedStore(allOrders, selectedKey) : allOrders;
  const selectedProducts = shouldClientFilter ? filterBySelectedStore(summary?.products || [], selectedKey) : summary?.products || [];
  const selectedCustomers = shouldClientFilter ? filterBySelectedStore(summary?.customers || [], selectedKey) : summary?.customers || [];
  const selectedCategories = shouldClientFilter ? filterBySelectedStore(summary?.categories || [], selectedKey) : summary?.categories || [];
  const totals = readOnly && !isAllStoresSelected(selectedKey)
    ? {
        revenue: sumRevenue(selectedOrders),
        orders: selectedOrders.length,
        products: selectedProducts.length,
        customers: selectedCustomers.length,
        categories: selectedCategories.length,
        pendingOrders: selectedOrders.filter(isPendingOrder).length,
        lowStock: selectedProducts.filter(isLowStockProduct).length,
      }
    : summary?.totals || {};

  const recentOrders = selectedOrders.slice(0, 8).map((o) => ({
    ...o,
    id: o.originalId || o.id,
    customer: o.customerName || "Customer",
    product: o.items?.[0]?.name || `${o.items?.length || 0} item(s)`,
    amount: o.total || 0,
    date: o.orderDate ? new Date(o.orderDate).toISOString().split("T")[0] : "",
    payment: normalizeStatus(o.paymentStatus),
    status: normalizeStatus(o.orderStatus),
    address: formatAddress(o.shippingAddress),
  }));

  const dashboardStats = {
    totalRevenue: totals.revenue || 0,
    totalOrders: totals.orders || 0,
    pendingOrders: totals.pendingOrders || 0,
    totalCustomers: totals.customers || 0,
    totalProducts: totals.products || 0,
    lowStockItems: totals.lowStock || 0,
    recentOrders,
  };

  const handleStatusUpdate = async (order, status) => {
    if (!canChangeOrderStatus(order?.status, status)) return;

    const updated = await adminApi.updateOrderStatus(
      order.id,
      toApiOrderStatus(status),
    );
    const normalizedStatus = normalizeStatus(updated.orderStatus || status);

    setSelectedOrder((prev) =>
      prev?.id === order.id ? { ...prev, status: normalizedStatus } : prev,
    );
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            orders: (prev.orders || []).map((item) =>
              item.id === order.id || item.originalId === order.id
                ? {
                    ...item,
                    orderStatus:
                      updated.orderStatus || toApiOrderStatus(status),
                  }
                : item,
            ),
            recentOrders: (prev.recentOrders || []).map((item) =>
              item.id === order.id
                ? {
                    ...item,
                    orderStatus:
                      updated.orderStatus || toApiOrderStatus(status),
                  }
                : item,
            ),
          }
        : prev,
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {readOnly && (
        <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
              Super Admin View
            </p>
            <h2 className="mt-1 text-xl font-semibold text-black">
              {selectedStoreLabel}
            </h2>
          </div>
          <StoreChooser compact />
        </div>
      )}

      {!readOnly && (
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Performance Overview</h2>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error} — showing the last known totals below.
        </div>
      )}

      <OverviewCards stats={dashboardStats} />

      {!readOnly && (
        <>
          <PerformanceCards summary={summary} loading={loading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <RevenueTrendChart data={summary?.trend} loading={loading} />
            <SalesTrendChart data={summary?.trend} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <OrderStatusChart counts={summary?.orderStatusCounts} loading={loading} />
            <TopProducts products={summary?.bestSellers} loading={loading} />
            <TopCategories categories={summary?.topCategories} loading={loading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <LowStockAlerts products={summary?.inventory?.lowStockProducts} loading={loading} />
          </div>
        </>
      )}

      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4"
      >
        <motion.div variants={stagger.item}>
          <RecentOrders
            orders={dashboardStats.recentOrders}
            onSelect={setSelectedOrder}
          />
        </motion.div>
      </motion.div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["Order ID", selectedOrder.id],
                ["Customer", selectedOrder.customer],
                ["Product", selectedOrder.product],
                ["Amount", formatUSD(selectedOrder.amount)],
                ["Payment", selectedOrder.payment],
                ["Date", selectedOrder.date],
                ["Delivery Address", selectedOrder.address],
                ["Status", null],
              ].map(([label, val], i) => (
                <div
                  key={i}
                  className={
                    label === "Delivery Address" ? "sm:col-span-2" : ""
                  }
                >
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  {label === "Status" ? (
                    <StatusBadge status={selectedOrder.status} />
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{val}</p>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && <div className="border-t border-gray-100 pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                Update Order Status
              </p>
              <div className="flex flex-wrap gap-2">
                {["pending", "processing", "shipped", "delivered"].map(
                  (status) => {
                    const isAllowed = canChangeOrderStatus(
                      selectedOrder.status,
                      status,
                    );
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={!isAllowed}
                        onClick={() =>
                          handleStatusUpdate(selectedOrder, status)
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                          selectedOrder.status === status
                            ? "bg-gray-900 text-white shadow-md"
                            : isAllowed
                              ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                              : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        {status}
                      </button>
                    );
                  },
                )}
              </div>
            </div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
