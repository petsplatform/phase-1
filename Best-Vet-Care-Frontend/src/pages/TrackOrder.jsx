import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Circle, Home, MapPin, Package, Truck } from "lucide-react";
import AccountLayout from "../components/account/AccountLayout";
import { orderApi } from "../api/orderApi";
import { useToast } from "../context/ToastContext";

const fmt = (value) => `$${Number(value || 0).toFixed(2)}`;

const activeStatuses = new Set(["Pending", "Confirmed", "Processing", "Shipped", "OutForDelivery", "Out for Delivery", "Delivered"]);

const trackingSteps = [
  { id: 1, label: "Order Placed", icon: CheckCircle, statuses: ["Pending", "Confirmed"] },
  { id: 2, label: "Processing", icon: Package, statuses: ["Processing"] },
  { id: 3, label: "Shipped", icon: Truck, statuses: ["Shipped"] },
  { id: 4, label: "Out for Delivery", icon: MapPin, statuses: ["Out for Delivery"] },
  { id: 5, label: "Delivered", icon: Home, statuses: ["Delivered"] },
];

const statusToStep = {
  Pending: 1,
  Confirmed: 1,
  Processing: 2,
  Shipped: 3,
  OutForDelivery: 4,
  "Out for Delivery": 4,
  Delivered: 5,
  Cancelled: 1,
};

const labelStatus = (status) => String(status || "Pending").replace(/([A-Z])/g, " $1").trim();

const getTrackingStatus = (order) => {
  const shipmentStatus = order?.shipmentStatus && order.shipmentStatus !== "Pending"
    ? order.shipmentStatus
    : "";
  return shipmentStatus || order?.orderStatus || "Pending";
};

const addDays = (dateValue, days) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const parseAddress = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return { address: value };
  }
};

const shortAddress = (value) => {
  const address = parseAddress(value);
  if (!address) return "No delivery address saved";
  return [address.address || address.line1, address.city, address.state, address.postalCode || address.zip]
    .filter(Boolean)
    .join(", ");
};

const TrackOrder = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    orderApi
      .getMyOrders()
      .then((data) => {
        if (cancelled) return;
        const orderList = Array.isArray(data) ? data : [];
        const activeOrders = orderList.filter((order) => activeStatuses.has(getTrackingStatus(order)));
        setOrders(activeOrders);
        setSelectedOrderId((current) => current || activeOrders[0]?.id || "");
      })
      .catch((error) => showToast(error.response?.data?.message || "Could not load your orders", "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId],
  );

  const selectedTrackingStatus = getTrackingStatus(selectedOrder);
  const currentStep = statusToStep[selectedTrackingStatus] || 1;
  const orderDate = selectedOrder?.orderDate || selectedOrder?.createdAt;
  const estimatedStart = addDays(orderDate, 4);
  const estimatedEnd = addDays(orderDate, 7);

  return (
    <AccountLayout title="Track Order" description="Select one of your active orders to view its current tracking status.">
      <div className="grid min-w-0 gap-6 pr-2 sm:pr-0 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
          <div className="border-b border-[#17345f1a] px-5 py-4">
            <h2 className="text-lg font-extrabold text-[#122a50]">Select Order</h2>
            <p className="mt-1 text-xs font-semibold text-[#122a50b2]">Pending and in-progress orders only.</p>
          </div>

          {loading ? (
            <div className="p-5 text-sm font-bold text-[#122a50b2]">Loading active orders...</div>
          ) : orders.length ? (
            <div className="space-y-4 p-5">
              {/* <label className="block">
                <span className="text-xs font-extrabold uppercase text-[#122a50b2]">Choose an order</span>
                <select
                  value={selectedOrderId}
                  onChange={(event) => setSelectedOrderId(event.target.value)}
                  className="mt-2 h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-3 text-sm font-extrabold text-[#122a50] outline-none focus:border-[#d9aa3d]"
                >
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.id} - {labelStatus(getTrackingStatus(order))} - {fmt(order.total)}
                    </option>
                  ))}
                </select>
              </label> */}

              <div className="space-y-3">
                {orders.map((order) => {
                  const active = order.id === selectedOrder?.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`w-full min-w-0 rounded-xl border p-4 text-left transition-all ${
                        active
                          ? "border-[#d9aa3d] bg-[#f8f1df]"
                          : "border-[#17345f1a] bg-white hover:border-[#d9aa3d] hover:bg-[#fffdf7]"
                      }`}
                    >
                      <span className="flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0 truncate font-extrabold text-[#122a50]">{order.id}</span>
                        <span className="shrink-0 rounded-full bg-[#17345f] px-3 py-1 text-[11px] font-extrabold text-white">{labelStatus(getTrackingStatus(order))}</span>
                      </span>
                      <span className="mt-2 block text-xs font-semibold text-[#122a50b2]">
                        {formatDate(order.orderDate)} - {fmt(order.total)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Package className="mx-auto h-11 w-11 text-[#d9aa3d]" />
              <h2 className="mt-4 text-lg font-extrabold text-[#122a50]">No pending orders</h2>
              <p className="mt-2 text-sm font-semibold text-[#122a50b2]">You do not have any active orders to track right now.</p>
              <Link to="/account/orders" className="mt-5 inline-flex rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d]">
                View All Orders
              </Link>
            </div>
          )}
        </section>

        {selectedOrder && (
          <section className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="break-all text-xl font-extrabold text-[#122a50]">{selectedOrder.id}</h2>
                  <p className="mt-1 text-sm font-semibold text-[#122a50b2]">
                    Placed {formatDate(orderDate)} - Payment {selectedOrder.paymentStatus}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[#f8f1df] px-4 py-2 text-xs font-extrabold text-[#17345f]">
                  {labelStatus(selectedTrackingStatus)}
                </span>
              </div>

              <div className="mt-8">
                <div className="relative flex items-start justify-between">
                  <div className="absolute left-[8%] right-[8%] top-4 h-0.5 bg-[#17345f1a]" />
                  <div
                    className="absolute left-[8%] top-4 h-0.5 bg-[#d9aa3d] transition-all"
                    style={{
                      width: `${((currentStep - 1) / (trackingSteps.length - 1)) * 84}%`,
                    }}
                  />

                  {trackingSteps.map((step) => {
                    const done = currentStep >= step.id;
                    const Icon = done ? CheckCircle : Circle;
                    return (
                      <div key={step.id} className="relative z-10 flex flex-1 flex-col items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-all ${
                            done ? "border-[#d9aa3d] text-[#d9aa3d]" : "border-[#17345f1a] text-[#122a50]/30"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className={`text-center text-[10px] font-extrabold leading-tight ${done ? "text-[#17345f]" : "text-[#122a50]/40"}`}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-[#122a50]/60">Estimated Delivery</p>
                <p className="mt-1 text-base font-extrabold text-[#122a50]">
                  {formatDate(estimatedStart)} - {formatDate(estimatedEnd)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-[#122a50]/60">Delivery Address</p>
                <p className="mt-1 text-sm font-extrabold leading-6 text-[#122a50]">{shortAddress(selectedOrder.shippingAddress)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-extrabold text-[#122a50]">Order Items ({selectedOrder.items?.length || 0})</p>
              <div className="space-y-3">
                {(selectedOrder.items || []).map((item, index) => (
                  <div key={`${selectedOrder.id}-${item.productId || item.name}-${index}`} className="flex items-center gap-3 rounded-xl bg-[#fffdf7] p-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-[#17345f1a] bg-white p-1">
                      {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain" /> : <Package className="h-full w-full p-2 text-[#d9aa3d]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#122a50]">{item.name}</p>
                      <p className="text-xs font-semibold text-[#122a50b2]">Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-extrabold text-[#122a50]">{fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </AccountLayout>
  );
};

export default TrackOrder;
