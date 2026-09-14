import { useEffect, useState, useCallback, useRef } from "react";
import { ClipboardList, RefreshCw, Download } from "lucide-react";
import PageWrapper from "../../components/common/PageWrapper";
import Table from "../../components/common/Table";
import api from "../../api/axios";
import { showToast } from "../../lib/toast";
import { isSuperAdmin } from "../../lib/api";
import { ADMIN_SEARCH_PLACEHOLDER } from "../../constants/search";
import StoreChooser, {
  useSelectedSuperAdminStore,
  useSuperAdminStores,
} from "../../components/SuperAdmin/StoreChooser";

const ACTION_COLORS = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  login: "bg-purple-100 text-purple-700",
  logout: "bg-gray-100 text-gray-600",
  export: "bg-yellow-100 text-yellow-700",
  import: "bg-orange-100 text-orange-700",
};

function ActionBadge({ action }) {
  const key = String(action || "").toLowerCase();
  const cls = ACTION_COLORS[key] || "bg-gray-100 text-gray-600";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${cls}`}>
      {action || "—"}
    </span>
  );
}

function formatDate(val) {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COLUMNS = [
  {
    key: "createdAt",
    label: "Timestamp",
    render: (v) => (
      <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{formatDate(v)}</span>
    ),
  },
  {
    key: "action",
    label: "Action",
    render: (v) => <ActionBadge action={v} />,
  },
  {
    key: "module",
    label: "Module",
    render: (v) => (
      <span className="text-xs font-medium text-[var(--text-primary)]">{v || "—"}</span>
    ),
  },
  {
    key: "description",
    label: "Description",
    render: (v) => (
      <span className="text-xs text-[var(--text-muted)] max-w-xs truncate block" title={v}>
        {v || "—"}
      </span>
    ),
  },
  {
    key: "entityName",
    label: "Record Detail",
    render: (_, row) => {
      const details = [
        row.entityName,
        row.entityEmail,
        row.entityId,
      ].filter(Boolean);
      return (
        <span className="block max-w-xs truncate text-xs font-medium text-[var(--text-primary)]" title={details.join(" · ")}>
          {details.length ? details.join(" · ") : "—"}
        </span>
      );
    },
  },
  {
    key: "performedBy",
    label: "Performed By",
    render: (v) => (
      <span className="text-xs font-medium text-[var(--text-primary)]">{v || "—"}</span>
    ),
  },
];

const ACTION_OPTIONS = ["all", "create", "update", "delete", "login", "logout", "export", "import"];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [error, setError] = useState(null);

  const superAdmin = isSuperAdmin();
  const stores = useSuperAdminStores();
  const { selectedKey: selectedStore } = useSelectedSuperAdminStore(stores);

  const fetchLogs = useCallback(
    async (storeKey) => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (actionFilter !== "all") query.set("action", actionFilter);
        if (moduleFilter !== "all") query.set("module", moduleFilter);
        if (dateFrom) query.set("from", dateFrom);
        if (dateTo) query.set("to", dateTo);
        if (superAdmin && storeKey && storeKey !== "ALL_STORES") {
          query.set("storeKey", storeKey);
        }
        const qs = query.toString();
        const res = await api.get(`/audit-logs${qs ? `?${qs}` : ""}`, {
          suppressToast: true,
        });
        const data = res.data;
        if (data?.success === false) throw new Error(data.message || "Failed to load logs");
        const list =
          Array.isArray(data)
            ? data
            : data?.data?.logs ?? data?.logs ?? data?.data ?? [];
        setLogs(list);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || "Failed to load audit logs");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [actionFilter, moduleFilter, dateFrom, dateTo, superAdmin],
  );

  // Stable ref so the effect below always calls the latest fetchLogs
  const fetchLogsRef = useRef(fetchLogs);
  useEffect(() => {
    fetchLogsRef.current = fetchLogs;
  }, [fetchLogs]);

  // Re-run when the store list changes as well as when the selected store or
  // filters change. The store list is loaded asynchronously for Super Admins;
  // including it here ensures the first navigation retries with the resolved
  // store context instead of requiring a page refresh.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) {
        await fetchLogsRef.current(selectedStore);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [fetchLogs, selectedStore, stores, superAdmin]);

  const moduleOptions = [
    "all",
    ...Array.from(new Set(logs.map((l) => l.module).filter(Boolean))),
  ];

  function exportCSV() {
    const headers = ["Timestamp", "Action", "Module", "Description", "Record Name", "Record Email", "Record ID", "Performed By"];
    const rows = logs.map((l) => [
      formatDate(l.createdAt),
      l.action,
      l.module,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      `"${(l.entityName || "").replace(/"/g, '""')}"`,
      l.entityEmail || "",
      l.entityId || "",
      l.performedBy,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: "success", title: "Exported", message: "Audit logs exported as CSV." });
  }

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      {superAdmin && <StoreChooser compact />}
      <select
        value={actionFilter}
        onChange={(e) => setActionFilter(e.target.value)}
        className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)]"
        style={{ borderColor: "var(--border-color)" }}
      >
        {ACTION_OPTIONS.map((a) => (
          <option key={a} value={a}>
            {a === "all" ? "All Actions" : a.charAt(0).toUpperCase() + a.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={moduleFilter}
        onChange={(e) => setModuleFilter(e.target.value)}
        className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)]"
        style={{ borderColor: "var(--border-color)" }}
      >
        {moduleOptions.map((m) => (
          <option key={m} value={m}>
            {m === "all" ? "All Modules" : m}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)]"
        style={{ borderColor: "var(--border-color)" }}
        title="From date"
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="py-1.5 px-3 text-xs bg-[var(--bg-soft)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-gold-soft)]"
        style={{ borderColor: "var(--border-color)" }}
        title="To date"
      />
    </div>
  );

  const tableActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => fetchLogs(selectedStore)}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--bg-soft)] border text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors disabled:opacity-50"
        style={{ borderColor: "var(--border-color)" }}
      >
        <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
      <button
        onClick={exportCSV}
        disabled={logs.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        <Download size={13} />
        Export CSV
      </button>
    </div>
  );

  return (
    <PageWrapper>
      <div className="mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
          <ClipboardList size={20} />
        </div>
        <div>
          <h1 className="font-display font-bold text-[var(--text-primary)] text-xl leading-tight">
            Audit Trail &amp; Activity Logs
          </h1>
          <p className="text-xs text-[var(--text-soft)] mt-0.5">
            {loading ? "Loading…" : error ? "Could not load logs" : `${logs.length} log entries`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--text-soft)]">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading audit logs…
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm text-red-500 font-medium">{error}</p>
          <button
            onClick={() => fetchLogs(selectedStore)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : (
        <Table
          columns={COLUMNS}
          data={logs}
          title="Activity Logs"
          searchKey="performedBy"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={ADMIN_SEARCH_PLACEHOLDER}
          filterControls={filterControls}
          actions={tableActions}
          emptyMessage="No audit logs found."
        />
      )}
    </PageWrapper>
  );
}
