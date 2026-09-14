import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AccountLayout from "../components/account/AccountLayout";
import { orderApi } from "../api/orderApi";
import { useToast } from "../context/ToastContext";

const steps = ["Packed", "ReadyToShip", "Shipped", "InTransit", "OutForDelivery", "Delivered"];
const labelStatus = (status) => String(status || "Pending").replace(/([A-Z])/g, " $1").trim();
const formatDate = (date) => date ? new Date(date).toLocaleString() : "N/A";

const formatShippingAddress = (value) => {
  if (!value) return "N/A";
  let address = value;
  if (typeof value === "string") {
    try {
      address = JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (!address || typeof address !== "object") return String(value);

  return [
    address.name,
    address.phone,
    address.address || address.line1,
    address.city,
    address.state,
    address.postalCode || address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
};

export default function ShipmentTracking() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getTracking(id)
      .then(setTracking)
      .catch((error) => showToast(error.response?.data?.message || "Could not load shipment tracking", "error"))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  const activeIndex = Math.max(0, steps.indexOf(tracking?.shipmentStatus));

  return (
    <AccountLayout title="Shipment Tracking" description="Track your courier movement and delivery progress.">
      {loading ? (
        <div className="rounded-2xl border border-[#17345f1a] bg-white p-8 text-sm font-bold text-[#122a50b2]">Loading tracking...</div>
      ) : tracking ? (
        <div className="min-w-0 space-y-5 rounded-2xl border border-[#17345f1a] bg-white p-4 shadow-sm sm:space-y-6 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase text-[#122a50b2]">Order Number</p>
              <h2 className="mt-1 break-all text-xl font-extrabold text-[#122a50] sm:text-2xl">{tracking.orderId}</h2>
              <p className="mt-2 text-sm font-bold text-[#17345f]">{labelStatus(tracking.shipmentStatus)}</p>
            </div>
            {tracking.trackingUrl && (
              <a href={tracking.trackingUrl} target="_blank" rel="noreferrer" className="w-fit rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d]">Track Shipment</a>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Info label="Courier" value={tracking.courierName || "N/A"} />
            <Info label="Tracking Number" value={tracking.trackingNumber || "N/A"} />
            <Info label="Estimated Delivery" value={tracking.estimatedDeliveryDate ? new Date(tracking.estimatedDeliveryDate).toLocaleDateString() : "N/A"} />
          </div>

          <div>
            <div className="h-2 overflow-hidden rounded-full bg-[#17345f1a]">
              <div className="h-full rounded-full bg-[#d9aa3d]" style={{ width: `${Math.min(100, ((activeIndex + 1) / steps.length) * 100)}%` }} />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {steps.map((step, index) => (
                <span key={step} className={`rounded-lg px-2 py-2 text-center text-[11px] font-extrabold ${index <= activeIndex ? "bg-[#f8f1df] text-[#17345f]" : "bg-[#17345f0d] text-[#122a50b2]"}`}>{labelStatus(step)}</span>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-xl bg-[#fffdf7] p-4">
            <p className="text-xs font-extrabold uppercase text-[#122a50b2]">Shipping Address</p>
            <p className="mt-2 overflow-wrap-anywhere text-sm font-semibold leading-6 text-[#122a50] [overflow-wrap:anywhere]">
              {formatShippingAddress(tracking.shippingAddress)}
            </p>
          </div>

          <div>
            <p className="text-sm font-extrabold text-[#122a50]">Shipment Timeline</p>
            <div className="mt-3 space-y-3">
              {(tracking.timeline || []).length ? tracking.timeline.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[#17345f1a] px-4 py-3">
                  <p className="text-sm font-extrabold text-[#122a50]">{labelStatus(entry.status)}</p>
                  <p className="mt-1 text-xs font-semibold text-[#122a50b2]">{formatDate(entry.createdAt)} {entry.location ? `- ${entry.location}` : ""}</p>
                  {entry.description && <p className="mt-2 text-sm font-semibold text-[#122a50]">{entry.description}</p>}
                </div>
              )) : <p className="text-sm font-semibold text-[#122a50b2]">No shipment updates yet.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#17345f1a] bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#122a50b2]">Tracking details were not found.</p>
          <Link to="/account/orders" className="mt-4 inline-flex rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white">Back to Orders</Link>
        </div>
      )}
    </AccountLayout>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#fffdf7] p-4">
      <p className="text-xs font-extrabold uppercase text-[#122a50b2]">{label}</p>
      <p className="mt-2 break-words text-sm font-extrabold text-[#122a50] [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}
