import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, XCircle,
  AlertTriangle, Clock, ChevronDown, RefreshCw, FileDown, Trash2,
} from "lucide-react";
import { bulkImportApi } from "../../api/bulkImportApi";

const IMPORT_MODES = [
  { value: "AddNew", label: "Add New Only", desc: "Skip rows with existing SKUs" },
  // { value: "UpdateExisting", label: "Update Existing Only", desc: "Skip rows with new SKUs" },
  // { value: "AddOrUpdate", label: "Add or Update", desc: "Insert new, update existing" },
];

const STATUS_COLORS = {
  Completed: "text-green-600 bg-green-50",
  Failed: "text-red-600 bg-red-50",
  Processing: "text-blue-600 bg-blue-50",
  PartialSuccess: "text-yellow-600 bg-yellow-50",
};

function StepBadge({ step, active, done }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${done ? "bg-green-500 text-white" : active ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-soft)] text-[var(--text-soft)]"}`}>
      {done ? <CheckCircle2 size={16} /> : step}
    </div>
  );
}

export default function BulkImport() {
  const [tab, setTab] = useState("import"); // import | history
  const [importMode, setImportMode] = useState("AddNew");
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1); // 1=upload 2=preview 3=done
  const [validation, setValidation] = useState(null); // { valid, invalid, validRows, errors, summary }
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef();

  const reset = () => {
    setFile(null); setStep(1); setValidation(null); setResult(null); setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) { setError("Only .xlsx or .xls files are supported."); return; }
    setFile(f); setError(null); setValidation(null); setStep(1);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleValidate = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const data = await bulkImportApi.validateFile(file, importMode);
      setValidation(data);
      setStep(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!validation?.validRowsData?.length) return;
    setLoading(true); setError(null);
    try {
      const data = await bulkImportApi.executeImport(validation.validRowsData, importMode, file.name);
      setResult(data);
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await bulkImportApi.getHistory();
      setHistory(data);
    } catch (e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === "history" && history === null) loadHistory();
  };

  const handleExport = async () => {
    setExporting(true);
    try { await bulkImportApi.exportProducts(); } catch (e) { setError(e.message); }
    finally { setExporting(false); }
  };

  const handleTemplate = async () => {
    setDownloading(true);
    try { await bulkImportApi.downloadTemplate(); } catch (e) { setError(e.message); }
    finally { setDownloading(false); }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--primary)]">Bulk Product Import</h1>
          <p className="text-sm text-[var(--text-soft)] mt-0.5">Import the same Simple and Product Family structures supported by Add Product.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleTemplate} disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-white text-[var(--primary)] text-sm font-medium hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-60">
            <Download size={16} /> {downloading ? "Downloading..." : "Template"}
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-white text-[var(--primary)] text-sm font-medium hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-60">
            <FileDown size={16} /> {exporting ? "Exporting..." : "Export Products"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-soft)] rounded-xl w-fit">
        {[{ id: "import", label: "Import" }, { id: "history", label: "History" }].map((t) => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--primary)]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "import" ? (
          <motion.div key="import" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Steps indicator */}
            <div className="flex items-center gap-3">
              {["Upload File", "Preview & Validate", "Done"].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <StepBadge step={i + 1} active={step === i + 1} done={step > i + 1} />
                  <span className={`text-sm font-medium hidden sm:block ${step === i + 1 ? "text-[var(--primary)]" : step > i + 1 ? "text-green-600" : "text-[var(--text-soft)]"}`}>{label}</span>
                  {i < 2 && <div className="w-8 h-px bg-[var(--border-color)] mx-1" />}
                </div>
              ))}
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <XCircle size={18} className="shrink-0" /> {error}
              </div>
            )}

            {/* Step 1: Upload */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Import Mode */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-white">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Import Mode</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {IMPORT_MODES.map((m) => (
                      <button key={m.value} onClick={() => setImportMode(m.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${importMode === m.value ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border-color)] hover:border-[var(--primary)]/40"}`}>
                        <p className={`text-sm font-semibold ${importMode === m.value ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>{m.label}</p>
                        <p className="text-xs text-[var(--text-soft)] mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${file ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border-color)] hover:border-[var(--primary)]/60 hover:bg-[var(--bg-soft)]"}`}>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileSpreadsheet size={40} className="text-[var(--primary)]" />
                      <p className="font-semibold text-[var(--primary)]">{file.name}</p>
                      <p className="text-xs text-[var(--text-soft)]">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[var(--text-soft)]">
                      <Upload size={36} />
                      <p className="font-semibold text-[var(--text-primary)]">Drop your Excel file here</p>
                      <p className="text-xs">or click to browse · .xlsx / .xls · max 10MB</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  {file && <button onClick={reset} className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition-colors"><Trash2 size={14} className="inline mr-1" />Clear</button>}
                  <button onClick={handleValidate} disabled={!file || loading}
                    className="px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                    {loading ? <><RefreshCw size={15} className="animate-spin" /> Validating...</> : "Validate File →"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Preview */}
            {step === 2 && validation && (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Rows", value: validation.totalRows || 0, color: "text-[var(--primary)]" },
                    { label: "Valid", value: validation.validRows || 0, color: "text-green-600" },
                    { label: "Invalid", value: validation.invalidRows || 0, color: "text-red-600" },
                    { label: "Mode", value: importMode, color: "text-[var(--accent-gold)]" },
                  ].map((c) => (
                    <div key={c.label} className="p-4 rounded-xl border border-[var(--border-color)] bg-white text-center">
                      <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                      <p className="text-xs text-[var(--text-soft)] mt-1">{c.label}</p>
                    </div>
                  ))}
                </div>

                {/* Errors */}
                {validation.errors?.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-red-200">
                      <AlertTriangle size={16} className="text-red-600" />
                      <span className="text-sm font-semibold text-red-700">{validation.errors.length} Validation Error{validation.errors.length > 1 ? "s" : ""}</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-red-100">
                      {validation.errors.map((e, i) => (
                        <div key={i} className="px-4 py-2 text-xs text-red-700 flex gap-3">
                          <span className="font-semibold shrink-0">Row {e.rowNumber}{e.sku ? ` · ${e.sku}` : ""}</span>
                          <span>{Array.isArray(e.reasons) ? e.reasons.join("; ") : e.reason || e.message || "Unknown error"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid rows preview */}
                {validation.validRowsData?.length > 0 && (
                  <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
                    <div className="px-4 py-3 bg-[var(--bg-soft)] border-b border-[var(--border-color)] flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">Preview — {validation.validRowsData.length} rows ready to import</span>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="bg-[var(--bg-soft)] sticky top-0">
                          <tr>
                            {["#", "Name", "SKU", "Structure", "Category", "Price", "Stock"].map((h) => (
                              <th key={h} className="px-3 py-2 text-left font-semibold text-[var(--text-soft)] uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {validation.validRowsData.slice(0, 50).map((row, i) => (
                            <tr key={i} className="hover:bg-[var(--bg-soft)]">
                              <td className="px-3 py-2 text-[var(--text-soft)]">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-[var(--text-primary)] max-w-[180px] truncate">{row.data?.name || row.name}</td>
                              <td className="px-3 py-2 font-mono text-[var(--text-soft)]">{row.data?.sku || row.sku}</td>
                              <td className="px-3 py-2 text-[var(--text-soft)]">{row.data?.productType || "SIMPLE"}</td>
                              <td className="px-3 py-2 text-[var(--text-soft)]">{row.data?.category || "—"}</td>
                              <td className="px-3 py-2 text-green-700 font-semibold">${row.data?.price || row.price}</td>
                              <td className="px-3 py-2">{row.data?.stock ?? row.stock ?? 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {validation.validRowsData.length > 50 && (
                        <p className="text-center text-xs text-[var(--text-soft)] py-2">Showing first 50 of {validation.validRowsData.length} rows</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-between">
                  <button onClick={reset} className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition-colors">← Start Over</button>
                  <button onClick={handleExecute} disabled={!validation.validRowsData?.length || loading}
                    className="px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                    {loading ? <><RefreshCw size={15} className="animate-spin" /> Importing...</> : `Import ${validation.validRowsData?.length || 0} Products →`}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && result && (
              <div className="space-y-4">
                <div className="p-8 rounded-2xl border border-[var(--border-color)] bg-white text-center space-y-3">
                  <CheckCircle2 size={48} className="text-green-500 mx-auto" />
                  <h2 className="text-xl font-bold text-[var(--primary)]">Import Complete!</h2>
                  <p className="text-[var(--text-soft)] text-sm">Products have been saved as <span className="font-semibold text-[var(--text-primary)]">Inactive</span> drafts. Review and publish from the Product List.</p>
                  <div className="flex justify-center gap-6 pt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{result.successRows || 0}</p>
                      <p className="text-xs text-[var(--text-soft)]">Imported</p>
                    </div>
                    {result.failedRows > 0 && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{result.failedRows}</p>
                        <p className="text-xs text-[var(--text-soft)]">Failed</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={reset} className="px-5 py-2 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition-colors">Import Another File</button>
                  <button onClick={() => handleTabChange("history")} className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity">View History</button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex justify-end">
              <button onClick={loadHistory} disabled={historyLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-color)] bg-white text-sm font-medium text-[var(--primary)] hover:bg-[var(--bg-soft)] transition-colors disabled:opacity-60">
                <RefreshCw size={15} className={historyLoading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-16 text-[var(--text-soft)]">
                <RefreshCw size={20} className="animate-spin mr-2" /> Loading history...
              </div>
            ) : !history?.length ? (
              <div className="text-center py-16 text-[var(--text-soft)]">
                <Clock size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No import history yet</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--border-color)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-soft)]">
                    <tr>
                      {["File", "Mode", "Imported", "Failed", "Status", "Date", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-soft)] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-[var(--bg-soft)]">
                        <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[180px] truncate">{h.fileName}</td>
                        <td className="px-4 py-3 text-[var(--text-soft)]">{h.importMode}</td>
                        <td className="px-4 py-3 text-green-700 font-semibold">{h.successRows}</td>
                        <td className="px-4 py-3 text-red-600">{h.failedRows}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[h.status] || "text-gray-600 bg-gray-50"}`}>{h.status}</span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-soft)] text-xs">{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {h.failedRows > 0 && (
                            <button onClick={() => bulkImportApi.downloadErrorReport(h.id, h.fileName)}
                              className="flex items-center gap-1 text-xs text-[var(--primary)] hover:underline font-medium">
                              <FileDown size={13} /> Errors
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
