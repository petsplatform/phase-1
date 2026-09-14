import { useEffect, useState } from "react";
import { Eye, Pause, Play, RefreshCw, XCircle } from "lucide-react";
import Table from "../../components/common/Table";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import { autoOrderApi } from "../../api/autoOrderApi";
import { showToast } from "../../lib/toast";

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

const metricLabels = {
  active: "Active",
  paused: "Paused",
  cancelled: "Cancelled",
  paymentFailed: "Payment Failed",
  dueToday: "Due Today",
  outOfStock: "Out of Stock",
  prescriptionBlocked: "Prescription Blocked",
};

export default function AutoOrders() {
  const [metrics, setMetrics] = useState({});
  const [autoOrders, setAutoOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningDue, setRunningDue] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([autoOrderApi.getMetrics(), autoOrderApi.getAll()])
      .then(([nextMetrics, nextAutoOrders]) => {
        setMetrics(nextMetrics || {});
        setAutoOrders(nextAutoOrders || []);
      })
      .catch((error) => showToast({ type: "error", message: error?.response?.data?.message || "Failed to load automated orders" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([autoOrderApi.getMetrics(), autoOrderApi.getAll()])
      .then(([nextMetrics, nextAutoOrders]) => {
        if (!active) return;
        setMetrics(nextMetrics || {});
        setAutoOrders(nextAutoOrders || []);
      })
      .catch((error) => {
        if (active) showToast({ type: "error", message: error?.response?.data?.message || "Failed to load automated orders" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const runAction = async (id, action) => {
    try {
      await autoOrderApi[action](id);
      showToast({ type: "success", message: "Automated order updated" });
      load();
      if (selected?.id === id) {
        const refreshed = await autoOrderApi.getById(id);
        setSelected(refreshed);
      }
    } catch (error) {
      showToast({ type: "error", message: error?.response?.data?.message || "Failed to update automated order" });
    }
  };

  const runDueOrders = async () => {
    setRunningDue(true);
    try {
      const result = await autoOrderApi.runDue();
      showToast({
        type: "success",
        message: `Processed ${result.processed || 0} due orders: ${result.successful || 0} successful, ${result.failed || 0} failed.`,
      });
      load();
    } catch (error) {
      showToast({ type: "error", message: error?.response?.data?.message || "Failed to process due automated orders" });
    } finally {
      setRunningDue(false);
    }
  };

  const columns = [
    {
      key: "customer",
      label: "Customer",
      render: (_, row) => row.customer?.name || row.customer?.email || "—",
    },
    {
      key: "product",
      label: "Product",
      render: (_, row) => (
        <span>
          <span className="block font-semibold text-[var(--text-primary)]">{row.product?.name || row.productName || "—"}</span>
          {row.variantLabel && <span className="text-xs text-[var(--text-soft)]">{row.variantLabel}</span>}
        </span>
      ),
    },
    { key: "quantity", label: "Qty" },
    { key: "frequencyLabel", label: "Frequency" },
    { key: "nextOrderDate", label: "Next Order", render: (value) => formatDate(value) },
    {
      key: "paymentMethodReference",
      label: "Payment",
      render: (value) => (value ? "Authorized" : "Needs setup"),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-soft)]" title="View" onClick={() => setSelected(row)}>
            <Eye size={16} />
          </button>
          {row.status === "ACTIVE" ? (
            <button className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-soft)]" title="Pause" onClick={() => runAction(row.id, "pause")}>
              <Pause size={16} />
            </button>
          ) : row.status !== "CANCELLED" ? (
            <button className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-soft)]" title="Resume" onClick={() => runAction(row.id, "resume")}>
              <Play size={16} />
            </button>
          ) : null}
          {row.status !== "CANCELLED" && (
            <button className="rounded-lg p-2 text-red-500 hover:bg-red-50" title="Cancel" onClick={() => runAction(row.id, "cancel")}>
              <XCircle size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">Automated Orders</h1>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Recurring customer reorders, Stripe cycle processing, and execution history.</p>
        </div>
        <button
          type="button"
          onClick={runDueOrders}
          disabled={runningDue}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={runningDue ? "animate-spin" : ""} />
          {runningDue ? "Processing..." : "Run Due Orders"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {Object.entries(metricLabels).map(([key, label]) => (
          <div key={key} className="rounded-xl border bg-[var(--card-bg)] p-4" style={{ borderColor: "var(--border-color)" }}>
            <p className="text-xs font-bold uppercase text-[var(--text-soft)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{metrics[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <Table
        title={loading ? "Loading automated orders..." : "Automated Orders"}
        columns={columns}
        data={autoOrders}
        emptyMessage="No automated orders found"
      />

      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Automated Order Details" width="max-w-5xl">
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label="Customer" value={selected.customer?.name || selected.customer?.email} />
              <Detail label="Product" value={selected.product?.name || selected.productName} />
              <Detail label="Frequency" value={selected.frequencyLabel} />
              <Detail label="Next Order" value={formatDate(selected.nextOrderDate)} />
              <Detail label="Payment" value={selected.paymentMethodReference ? "Authorized" : "Needs setup"} />
              <Detail label="Status" value={selected.status} />
            </div>
            {selected.failureReason && (
              <div className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{selected.failureReason}</div>
            )}
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Execution History</h2>
              <div className="mt-3 overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border-color)" }}>
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-soft)]">
                    <tr>
                      <th className="px-3 py-2 text-left">Scheduled</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Payment</th>
                      <th className="px-3 py-2 text-left">Order</th>
                      <th className="px-3 py-2 text-left">Failure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.executions || []).length === 0 ? (
                      <tr><td className="px-3 py-6 text-center text-[var(--text-soft)]" colSpan={5}>No executions yet</td></tr>
                    ) : selected.executions.map((execution) => (
                      <tr key={execution.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                        <td className="px-3 py-2">{formatDate(execution.scheduledDate)}</td>
                        <td className="px-3 py-2">{execution.status}</td>
                        <td className="px-3 py-2">{execution.paymentStatus}</td>
                        <td className="px-3 py-2">{execution.orderId || "—"}</td>
                        <td className="px-3 py-2">{execution.failureReason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg bg-[var(--bg-soft)] p-3">
      <p className="text-xs font-bold uppercase text-[var(--text-soft)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{value || "—"}</p>
    </div>
  );
}
