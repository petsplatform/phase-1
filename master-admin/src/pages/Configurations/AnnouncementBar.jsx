import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Loader2, Megaphone, RotateCcw, Save } from "lucide-react";
import { motion } from "framer-motion";
import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";
import { adminApi, isSuperAdmin } from "../../lib/api";
import { showValidationError, validateRequiredFields } from "../../utils/formValidation";

const emptyAnnouncement = {
  text: "",
  link: "",
  startDate: "",
  endDate: "",
  status: "Active",
};

const toDateInput = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
};

const getTodayDateInput = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AnnouncementBar() {
  const readOnly = isSuperAdmin();
  const [form, setForm] = useState(emptyAnnouncement);
  const [initialForm, setInitialForm] = useState(emptyAnnouncement);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadAnnouncement = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.announcement();
      const next = {
        ...emptyAnnouncement,
        ...(data || {}),
        startDate: toDateInput(data?.startDate),
        endDate: toDateInput(data?.endDate),
        status: data?.status || "Active",
      };
      setForm(next);
      setInitialForm(next);
    } catch (err) {
      setError(err.message || "Unable to load announcement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const todayDate = getTodayDateInput();
  const endDateMin = form.startDate && form.startDate > todayDate ? form.startDate : todayDate;

  const update = (field) => (event) => {
    if (readOnly) return;
    setMessage("");
    setError("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const reset = () => {
    if (readOnly) return;
    setForm(initialForm);
    setMessage("");
    setError("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setMessage("");
    setError("");

    if (!validateRequiredFields([
      { label: "Announcement text", value: form.text },
      { label: "Start date", value: form.startDate },
      { label: "End date", value: form.endDate },
      { label: "Status", value: form.status },
    ])) {
      setSaving(false);
      return;
    }

    const todayDate = getTodayDateInput();

    if (form.startDate < todayDate) {
      showValidationError("Start date must be today or a future date.");
      setError("Start date must be today or a future date.");
      setSaving(false);
      return;
    }

    if (form.endDate < todayDate) {
      showValidationError("End date must be today or a future date.");
      setError("End date must be today or a future date.");
      setSaving(false);
      return;
    }

    if (form.endDate < form.startDate) {
      showValidationError("End date must be on or after start date.");
      setError("End date must be on or after start date.");
      setSaving(false);
      return;
    }

    try {
      const saved = await adminApi.updateAnnouncement({
        text: form.text,
        link: form.link || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        status: form.status,
      });
      const next = {
        ...emptyAnnouncement,
        ...(saved || {}),
        startDate: toDateInput(saved?.startDate),
        endDate: toDateInput(saved?.endDate),
        status: saved?.status || form.status,
      };
      setForm(next);
      setInitialForm(next);
      setMessage("Announcement bar saved successfully.");
    } catch (err) {
      setError(err.message || "Unable to save announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcement Bar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the slim promotional message shown at the top of the customer store.
          </p>
        </div>
        <StatusBadge status={form.status || "Inactive"} />
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div className="bg-primary px-4 py-3 text-center text-sm font-semibold text-white">
          {form.text || "Announcement preview text"}
          {form.link && (
            <span className="ml-2 inline-flex items-center gap-1 underline">
              Shop now <ExternalLink size={13} />
            </span>
          )}
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <form noValidate onSubmit={save} className="grid gap-5 p-5 md:grid-cols-2">
            <div className="flex items-center gap-3 md:col-span-2">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Megaphone size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bar Content</h2>
                <p className="text-sm text-gray-500">Keep it short, direct, and action oriented.</p>
              </div>
            </div>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Announcement Text</span>
              <input
                required
                disabled={readOnly}
                value={form.text}
                onChange={update("text")}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Free shipping on orders over $75"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Link</span>
              <input
                value={form.link || ""}
                disabled={readOnly}
                onChange={update("link")}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="/products"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Status</span>
              <select
                value={form.status}
                disabled={readOnly}
                onChange={update("status")}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Start Date</span>
              <input
                type="date"
                value={form.startDate || ""}
                min={todayDate}
                disabled={readOnly}
                onChange={update("startDate")}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">End Date</span>
              <input
                type="date"
                value={form.endDate || ""}
                min={endDateMin}
                disabled={readOnly}
                onChange={update("endDate")}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </label>

            {(message || error) && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium md:col-span-2 ${error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                {error || message}
              </div>
            )}

            {!readOnly && (
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 md:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={reset}
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <RotateCcw size={16} /> Reset
                </button>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:opacity-70"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Announcement
                </button>
              </div>
            )}
          </form>

          <div className="border-t border-gray-100 bg-gray-50/60 p-5 lg:border-l lg:border-t-0">
            <div className="grid gap-4">
              <Card padding="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <CalendarDays size={19} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Schedule</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {form.startDate || "Start date"} to {form.endDate || "End date"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card padding="p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Storefront Preview</p>
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="bg-primary px-3 py-2 text-center text-xs font-semibold text-white">
                    {form.text || "Announcement text"}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-2/3 rounded-full bg-gray-100" />
                    <div className="h-24 rounded-xl bg-gray-100" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-14 rounded-lg bg-gray-100" />
                      <div className="h-14 rounded-lg bg-gray-100" />
                      <div className="h-14 rounded-lg bg-gray-100" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
