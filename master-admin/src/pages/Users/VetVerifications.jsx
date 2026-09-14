import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Search, XCircle } from "lucide-react";
import { vetVerificationApi } from "../../api/vetVerificationApi";
import { showToast } from "../../lib/toast";
import { isSuperAdmin } from "../../lib/api";
import { ADMIN_SEARCH_PLACEHOLDER } from "../../constants/search";

const statuses = ["All", "Pending", "Approved", "Rejected", "Expired"];
const badge = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
  Expired: "bg-slate-100 text-slate-700",
};

const formatDate = (date) => date ? new Date(date).toLocaleDateString() : "N/A";

export default function VetVerifications() {
  const readOnly = isSuperAdmin();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("Pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approving, setApproving] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const loadRows = () => {
    setLoading(true);
    vetVerificationApi.list({ status, q })
      .then((data) => setRows(data.items || []))
      .catch((error) => showToast({ type: "error", title: "Unable to load", message: error.response?.data?.message || "Vet verification requests could not be loaded." }))
      .finally(() => setLoading(false));
  };

  useEffect(loadRows, [status]);

  const openDetails = async (id) => {
    const data = await vetVerificationApi.getById(id);
    setSelected(data);
  };

  const openApproveModal = (application) => {
    setApproveTarget(application);
  };

  const closeApproveModal = () => {
    if (approving) return;
    setApproveTarget(null);
  };

  const submitApprove = async () => {
    setApproving(true);
    try {
      await vetVerificationApi.approve(approveTarget.id);
      showToast({ type: "success", title: "Approved", message: "Customer is now a verified veterinarian." });
      setSelected(null);
      setApproveTarget(null);
      loadRows();
    } finally {
      setApproving(false);
    }
  };

  const openRejectModal = (application) => {
    setRejectTarget(application);
    setRejectRemarks("");
  };

  const closeRejectModal = () => {
    if (rejecting) return;
    setRejectTarget(null);
    setRejectRemarks("");
  };

  const submitReject = async (event) => {
    event.preventDefault();
    const remarks = rejectRemarks.trim();
    if (remarks.length < 3) {
      showToast({ type: "error", title: "Remarks required", message: "Enter rejection remarks before rejecting." });
      return;
    }

    setRejecting(true);
    try {
      await vetVerificationApi.reject(rejectTarget.id, remarks);
      showToast({ type: "success", title: "Rejected", message: "Customer has been notified." });
      setSelected(null);
      setRejectTarget(null);
      setRejectRemarks("");
      loadRows();
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vet Verification</h1>
          <p className="text-sm text-gray-500">
            {readOnly
              ? "View veterinarian license applications across all stores."
              : "Review veterinarian license applications."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadRows()} placeholder={ADMIN_SEARCH_PLACEHOLDER} className="h-10 w-64 rounded-lg border border-gray-200 pl-9 pr-3 text-sm" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              {readOnly && <th className="px-4 py-3">Store</th>}
              <th className="px-4 py-3">Clinic</th>
              <th className="px-4 py-3">License Number</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Submitted Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={readOnly ? 8 : 7} className="px-4 py-8 text-center font-semibold text-gray-500">Loading requests...</td></tr>
            ) : rows.length ? rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3"><p className="font-bold text-gray-900">{row.customer?.name || row.fullName}</p><p className="text-xs text-gray-500">{row.email}</p></td>
                {readOnly && <td className="px-4 py-3"><p className="font-bold text-gray-900">{row.storeName || row.store?.storeName || "N/A"}</p><p className="text-xs text-gray-500">{row.storeKey || row.store?.storeKey}</p></td>}
                <td className="px-4 py-3">{row.clinicName}</td>
                <td className="px-4 py-3 font-mono text-xs">{row.licenseNumber}</td>
                <td className="px-4 py-3">{row.licenseState}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge[row.status]}`}>{row.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openDetails(row.id)} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" title="View"><Eye size={16} /></button>
                    {!readOnly && row.status === "Pending" && <button onClick={() => openApproveModal(row)} className="rounded-lg border border-green-200 p-2 text-green-700 hover:bg-green-50" title="Approve"><CheckCircle2 size={16} /></button>}
                    {!readOnly && row.status === "Pending" && <button onClick={() => openRejectModal(row)} className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50" title="Reject"><XCircle size={16} /></button>}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={readOnly ? 8 : 7} className="px-4 py-8 text-center font-semibold text-gray-500">No vet verification requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-gray-900">{selected.fullName}</h2><p className="text-sm text-gray-500">{selected.email}</p></div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><XCircle size={18} /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Customer Information", selected.customer?.name || selected.fullName],
                ...(readOnly ? [["Store", `${selected.storeName || selected.store?.storeName || "N/A"} (${selected.storeKey || selected.store?.storeKey || "N/A"})`]] : []),
                ["Clinic Information", selected.clinicName],
                ["License Number", selected.licenseNumber],
                ["License State", selected.licenseState],
                ["Expiry Date", formatDate(selected.licenseExpiry)],
                ["Phone", selected.phone],
                ["Email", selected.email],
                ["Status", selected.status],
              ].map(([label, value]) => <div key={label} className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-bold uppercase text-gray-400">{label}</p><p className="mt-1 text-sm font-semibold text-gray-900">{value}</p></div>)}
            </div>
            <div className="mt-5 rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">Uploaded License Preview</p>
              <a href={selected.documentUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-bold text-primary underline">Open license document</a>
            </div>
            {selected.remarks && <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">Application History: {selected.remarks}</div>}
            {!readOnly && selected.status === "Pending" && <div className="mt-6 flex justify-end gap-3"><button onClick={() => openRejectModal(selected)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700">Reject</button><button onClick={() => openApproveModal(selected)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">Approve</button></div>}
          </div>
        </div>
      )}

      {approveTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Approve Vet Verification</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Approve this vet verification request for {approveTarget.fullName}?
                </p>
              </div>
              <button type="button" onClick={closeApproveModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" disabled={approving}>
                <XCircle size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-800">
              This will mark the customer as a verified veterinarian and allow purchases of vet-only products.
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={closeApproveModal} disabled={approving} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={submitApprove} disabled={approving} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">
                {approving ? "Approving..." : "Approve Application"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitReject} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reject Vet Verification</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {rejectTarget.fullName} will receive these remarks.
                </p>
              </div>
              <button type="button" onClick={closeRejectModal} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" disabled={rejecting}>
                <XCircle size={18} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Rejection Remarks</span>
              <textarea
                required
                rows={5}
                value={rejectRemarks}
                onChange={(event) => setRejectRemarks(event.target.value)}
                placeholder="Explain why this application is being rejected..."
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={closeRejectModal} disabled={rejecting} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="submit" disabled={rejecting || rejectRemarks.trim().length < 3} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {rejecting ? "Rejecting..." : "Reject Application"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
