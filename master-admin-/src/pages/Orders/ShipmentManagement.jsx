import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Link as LinkIcon, Plus, Search, XCircle } from "lucide-react";
import { shipmentApi } from "../../api/shipmentApi";
import { showToast } from "../../lib/toast";
import { ADMIN_SEARCH_PLACEHOLDER } from "../../constants/search";

const statusOptions = ["All", "Pending", "Packed", "ReadyToShip", "Shipped", "OutForDelivery", "Delivered", "Cancelled"];

const formatDate = (date) => date ? new Date(date).toLocaleDateString() : "-";
const labelStatus = (status) => String(status || "Pending").replace(/([A-Z])/g, " $1").trim();

export default function ShipmentManagement() {
  const [shipments, setShipments] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [q, setQ] = useState("");
  const [shipmentStatus, setShipmentStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [courierForm, setCourierForm] = useState({ name: "", trackingUrlPattern: "" });
  const [linkTarget, setLinkTarget] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      shipmentApi.listShipments({ q, shipmentStatus }),
      shipmentApi.listCouriers(),
    ])
      .then(([shipmentData, courierData]) => {
        setShipments(shipmentData.items || []);
        setCouriers(courierData || []);
      })
      .catch((error) => showToast({ type: "error", title: "Unable to load", message: error.response?.data?.message || "Shipment data could not be loaded." }))
      .finally(() => setLoading(false));
  }, [q, shipmentStatus]);

  useEffect(() => {
    const timer = window.setTimeout(load, q.trim() ? 350 : 0);
    return () => window.clearTimeout(timer);
  }, [load, q]);

  const saveCourier = async (event) => {
    event.preventDefault();
    await shipmentApi.createCourier(courierForm);
    showToast({ type: "success", title: "Courier saved", message: "Courier company is available for shipments." });
    setCourierForm({ name: "", trackingUrlPattern: "" });
    setShowCourierForm(false);
    load();
  };

  const openLinkModal = (shipment) => {
    setLinkTarget(shipment);
    setTrackingUrl(shipment.trackingUrl || "");
  };

  const closeLinkModal = () => {
    if (savingLink) return;
    setLinkTarget(null);
    setTrackingUrl("");
  };

  const saveTrackingLink = async (event) => {
    event.preventDefault();
    if (!linkTarget) return;
    if (!linkTarget.courierName || !linkTarget.trackingNumber) {
      showToast({ type: "error", title: "Shipment details required", message: "Add courier and tracking number before saving a tracking link." });
      return;
    }
    setSavingLink(true);
    try {
      await shipmentApi.saveShipment(
        linkTarget.orderId,
        {
          courierName: linkTarget.courierName,
          trackingNumber: linkTarget.trackingNumber,
          awbNumber: linkTarget.awbNumber || "",
          estimatedDeliveryDate: linkTarget.estimatedDeliveryDate
            ? new Date(linkTarget.estimatedDeliveryDate).toISOString().split("T")[0]
            : "",
          trackingUrl: trackingUrl.trim(),
          notes: "Tracking link updated",
        },
        true,
      );
      showToast({ type: "success", title: "Tracking link saved", message: "Customer can now open the shipment tracking link." });
      setLinkTarget(null);
      setTrackingUrl("");
      load();
    } finally {
      setSavingLink(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipment Management</h1>
          <p className="text-sm text-gray-500">Manage couriers, tracking numbers, and customer tracking links.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder={ADMIN_SEARCH_PLACEHOLDER} className="h-10 w-72 rounded-lg border border-gray-200 pl-9 pr-3 text-sm" />
          </div>
          <select value={shipmentStatus} onChange={(e) => setShipmentStatus(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
            {statusOptions.map((item) => <option key={item} value={item}>{labelStatus(item)}</option>)}
          </select>
          <button onClick={() => setShowCourierForm(true)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white"><Plus size={16} /> Courier</button>
        </div>
      </div>

      <div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Courier</th>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Estimated</th>
                <th className="px-4 py-3">Tracking Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center font-semibold text-gray-500">Loading shipments...</td></tr>
              ) : shipments.length ? shipments.map((shipment) => (
                <tr key={shipment.orderId}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700">{shipment.orderId}</td>
                  <td className="px-4 py-3"><p className="font-semibold text-gray-900">{shipment.customerName}</p><p className="text-xs text-gray-500">{shipment.email}</p></td>
                  <td className="px-4 py-3">{shipment.courierName || "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs">{shipment.trackingNumber || "-"}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{labelStatus(shipment.shipmentStatus)}</span></td>
                  <td className="px-4 py-3">{formatDate(shipment.estimatedDeliveryDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openLinkModal(shipment)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        <LinkIcon size={13} />
                        {shipment.trackingUrl ? "Edit Link" : "Add Link"}
                      </button>
                      {shipment.trackingUrl && (
                        <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">
                          <ExternalLink size={13} />
                          Open
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="px-4 py-8 text-center font-semibold text-gray-500">No shipments found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCourierForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveCourier} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Add Courier</h2>
            <input required value={courierForm.name} onChange={(e) => setCourierForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Courier name" className="mt-4 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm" />
            <input value={courierForm.trackingUrlPattern} onChange={(e) => setCourierForm((prev) => ({ ...prev, trackingUrlPattern: e.target.value }))} placeholder="https://site.com/track/{trackingNumber}" className="mt-3 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm" />
            <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setShowCourierForm(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold">Cancel</button><button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">Save</button></div>
          </form>
        </div>
      )}

      {linkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveTrackingLink} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add Tracking Link</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Order {linkTarget.orderId} - {linkTarget.courierName || "Courier"}
                </p>
              </div>
              <button type="button" onClick={closeLinkModal} disabled={savingLink} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                <XCircle size={18} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Tracking URL</span>
              <input
                required
                type="url"
                value={trackingUrl}
                onChange={(event) => setTrackingUrl(event.target.value)}
                placeholder="https://courier.com/track/123456789"
                className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs font-semibold text-gray-600">
              Tracking Number: <span className="font-mono text-gray-900">{linkTarget.trackingNumber || "-"}</span>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={closeLinkModal} disabled={savingLink} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="submit" disabled={savingLink} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
                {savingLink ? "Saving..." : "Save Link"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
