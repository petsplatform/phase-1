import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, FlaskConical, Mail, Save, ShieldCheck, Trash2 } from "lucide-react";
import Card from "../../components/common/Card";
import Modal from "../../components/common/Modal";
import { adminApi, isSuperAdmin } from "../../lib/api";
import {
  getSelectedSuperAdminStore,
  isAllStoresSelected,
  SUPER_ADMIN_STORE_EVENT,
} from "../../lib/superAdminStore";

const initialForm = {
  smtpEmail: "",
  smtpPass: "",
  smtpHost: "",
  smtpPort: "587",
};

const providerPresets = [
  { label: "Gmail", host: "smtp.gmail.com", port: "587" },
  { label: "Outlook", host: "smtp.office365.com", port: "587" },
  { label: "Zoho", host: "smtp.zoho.com", port: "465" },
];

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase text-[var(--text-muted)]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs font-medium text-[var(--text-soft)]">{hint}</p>}
    </div>
  );
}

export default function EmailSettings() {
  const [selectedStoreKey, setSelectedStoreKey] = useState(getSelectedSuperAdminStore);
  const readOnly = isSuperAdmin() && isAllStoresSelected(selectedStoreKey);
  const [form, setForm] = useState(initialForm);
  const [baseSettings, setBaseSettings] = useState({});
  const [hasSavedPassword, setHasSavedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const hasCredentials = Boolean(hasSavedPassword || form.smtpEmail || form.smtpHost);

  useEffect(() => {
    const syncStoreSelection = () => setSelectedStoreKey(getSelectedSuperAdminStore());
    window.addEventListener(SUPER_ADMIN_STORE_EVENT, syncStoreSelection);
    window.addEventListener("storage", syncStoreSelection);
    return () => {
      window.removeEventListener(SUPER_ADMIN_STORE_EVENT, syncStoreSelection);
      window.removeEventListener("storage", syncStoreSelection);
    };
  }, []);

  useEffect(() => {
    if (readOnly) {
      setLoading(false);
      setError("Select one store before editing email settings.");
      setBaseSettings({});
      setHasSavedPassword(false);
      setForm(initialForm);
      return undefined;
    }

    let alive = true;
    setLoading(true);
    setError("");

    adminApi
      .settings()
      .then((settings) => {
        if (!alive || !settings) return;
        setBaseSettings(settings);
        setHasSavedPassword(Boolean(settings.hasSmtpPass));
        setForm({
          smtpEmail: settings.smtpEmail || "",
          smtpPass: "",
          smtpHost: settings.smtpHost || "",
          smtpPort: settings.smtpPort ? String(settings.smtpPort) : "587",
        });
      })
      .catch((err) => {
        if (alive) setError(err.message || "Failed to load email settings");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [readOnly, selectedStoreKey]);

  const update = (field) => (event) => {
    if (readOnly) return;
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
  };

  const applyPreset = (preset) => {
    if (readOnly) return;
    setForm((current) => ({
      ...current,
      smtpHost: preset.host,
      smtpPort: preset.port,
    }));
    setSaved(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError("");

    try {
      const payload = {
        storeName: baseSettings.storeName || "Store",
        supportEmail: baseSettings.supportEmail || form.smtpEmail,
        supportPhone: baseSettings.supportPhone || null,
        currency: baseSettings.currency || "USD",
        timezone: baseSettings.timezone || "UTC",
        smtpEmail: form.smtpEmail,
        smtpHost: form.smtpHost,
        smtpPort: Number(form.smtpPort),
      };

      if (form.smtpPass.trim()) {
        payload.smtpPass = form.smtpPass;
      }

      const updated = await adminApi.updateSettings(payload);
      setBaseSettings(updated || {});
      setHasSavedPassword(Boolean(updated?.hasSmtpPass));
      setForm((current) => ({ ...current, smtpPass: "" }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err.message || "Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCredentials = async () => {
    if (readOnly || !hasCredentials || removing) return;

    setRemoving(true);
    setError("");
    setSaved(false);

    try {
      await adminApi.removeSmtpSettings({
        storeName: baseSettings.storeName || "Store",
        supportEmail: baseSettings.supportEmail || "support@example.com",
        supportPhone: baseSettings.supportPhone || null,
        currency: baseSettings.currency || "USD",
        timezone: baseSettings.timezone || "UTC",
      });
      const updated = await adminApi.settings();

      setBaseSettings(updated || {});
      setHasSavedPassword(false);
      setForm(initialForm);
      setConfirmRemoveOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err.message || "Failed to remove email credentials");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[var(--accent-gold)]">Store email</p>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Email Settings
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-[var(--text-muted)]" style={{ borderColor: "var(--border-color)" }}>
          <ShieldCheck size={16} className="text-emerald-600" />
          {hasCredentials ? "SMTP credentials saved" : "SMTP credentials required"}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="mb-5 flex items-center gap-2">
            <Mail size={18} style={{ color: "var(--primary)" }} />
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
              SMTP Credentials
            </h2>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-[var(--text-muted)]">
              Loading email settings...
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="SMTP_EMAIL" required hint="Use the sender email for this store only.">
                <input
                  type="email"
                  required
                  disabled={readOnly}
                  value={form.smtpEmail}
                  onChange={update("smtpEmail")}
                  placeholder="store@example.com"
                  className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-gold-soft)]"
                  style={{ borderColor: "var(--border-color)" }}
                />
              </Field>

              <Field
                label="SMTP_PASS"
                required={!hasSavedPassword}
                hint={hasSavedPassword ? "Leave blank to keep the saved password." : "Use an app password or SMTP password from your mail provider."}
              >
                <div className="flex rounded-lg border bg-white" style={{ borderColor: "var(--border-color)" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!hasSavedPassword}
                    disabled={readOnly}
                    value={form.smtpPass}
                    onChange={update("smtpPass")}
                    placeholder={hasSavedPassword ? "Saved password hidden" : "SMTP password"}
                    className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="flex h-11 w-11 items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)]"
                    aria-label={showPassword ? "Hide SMTP password" : "Show SMTP password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
                <Field label="SMTP_HOST" required>
                  <input
                    type="text"
                    required
                    disabled={readOnly}
                    value={form.smtpHost}
                    onChange={update("smtpHost")}
                    placeholder="smtp.gmail.com"
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-gold-soft)]"
                    style={{ borderColor: "var(--border-color)" }}
                  />
                </Field>
                <Field label="SMTP_PORT" required>
                  <input
                    type="number"
                    required
                    min="1"
                    max="65535"
                    disabled={readOnly}
                    value={form.smtpPort}
                    onChange={update("smtpPort")}
                    placeholder="587"
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-gold-soft)]"
                    style={{ borderColor: "var(--border-color)" }}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-2">
                {providerPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    disabled={readOnly}
                    className="rounded-lg border px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {!readOnly && (
                <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || removing}
                  className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:opacity-70"
                  style={{ background: saved ? "#059669" : "var(--primary)" }}
                >
                  {saving ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : saved ? (
                    <Check size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving..." : saved ? "Saved" : "Save Email Settings"}
                </button>
                {hasCredentials && (
                  <button
                    type="button"
                    onClick={() => { setTestOpen(true); setTestResult(null); setTestEmail(""); }}
                    disabled={saving || removing}
                    className="flex items-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-bold transition hover:bg-[var(--bg-soft)] active:scale-95 disabled:opacity-70"
                    style={{ borderColor: "var(--border-color)", color: "var(--primary)" }}
                  >
                    <FlaskConical size={16} />
                    Test Email
                  </button>
                )}

                {/* {hasCredentials && (
                  <button
                    type="button"
                    onClick={() => setConfirmRemoveOpen(true)}
                    disabled={saving || removing}
                    className="flex items-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-95 disabled:opacity-70"
                    style={{ borderColor: "#fecaca" }}
                  >
                    {removing ? (
                      <span className="h-4 w-4 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    {removing ? "Removing..." : "Remove Credentials"}
                  </button>
                )} */}
                </div>
              )}
            </form>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            How To Get Credentials
          </h2>
          <ol className="mt-4 space-y-4 text-sm font-medium text-[var(--text-muted)]">
            <li>
              <span className="font-bold text-[var(--text-primary)]">1. Open your email provider security page.</span>
              <p className="mt-1">For Gmail, enable 2-Step Verification before creating an app password.</p>
            </li>
            <li>
              <span className="font-bold text-[var(--text-primary)]">2. Create an app password or SMTP password.</span>
              <p className="mt-1">Copy that value into <span className="font-bold">SMTP_PASS</span>. Do not use your normal login password unless your provider requires it.</p>
            </li>
            <li>
              <span className="font-bold text-[var(--text-primary)]">3. Add host and port.</span>
              <p className="mt-1">Gmail: smtp.gmail.com / 587, Outlook: smtp.office365.com / 587, Zoho: smtp.zoho.com / 465.</p>
            </li>
            <li>
              <span className="font-bold text-[var(--text-primary)]">4. Save settings.</span>
              <p className="mt-1">Order emails for this store will use these credentials. Login OTP emails continue using backend env SMTP.</p>
            </li>
          </ol>
        </Card>
      </div>

      <Modal
        isOpen={testOpen}
        onClose={() => !testing && setTestOpen(false)}
        title="Send Test Email"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-[var(--text-muted)]">
            Enter an email address to receive a test message using the saved SMTP credentials.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-[var(--text-muted)]">
              Recipient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
              placeholder="you@example.com"
              disabled={testing}
              className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent-gold-soft)]"
              style={{ borderColor: "var(--border-color)" }}
            />
          </div>
          {testResult && (
            <p className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              testResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}>
              {testResult.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setTestOpen(false)}
              disabled={testing}
              className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] transition hover:bg-[var(--bg-soft)] disabled:opacity-70"
              style={{ borderColor: "var(--border-color)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={testing || !testEmail}
              onClick={async () => {
                setTesting(true);
                setTestResult(null);
                try {
                  await adminApi.testEmail(testEmail);
                  setTestResult({ ok: true, message: "Test email sent! Check your inbox." });
                } catch (err) {
                  setTestResult({ ok: false, message: err.message || "Failed to send test email." });
                } finally {
                  setTesting(false);
                }
              }}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-70"
              style={{ background: "var(--primary)" }}
            >
              {testing ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <FlaskConical size={16} />
              )}
              {testing ? "Sending..." : "Send Test Email"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        onClose={() => !removing && setConfirmRemoveOpen(false)}
        title="Remove SMTP Credentials"
        width="max-w-md"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-bold text-red-700">
              Are you sure you want to remove these SMTP credentials?
            </p>
            <p className="mt-1 text-sm font-medium text-red-600">
              Store order emails will stop sending from this SMTP account until new credentials are saved.
            </p>
          </div>

          <div className="rounded-xl border bg-white px-4 py-3 text-sm font-medium text-[var(--text-muted)]" style={{ borderColor: "var(--border-color)" }}>
            <p>
              <span className="font-bold text-[var(--text-primary)]">SMTP_EMAIL:</span>{" "}
              {form.smtpEmail || "Saved email"}
            </p>
            <p className="mt-1">
              <span className="font-bold text-[var(--text-primary)]">SMTP_HOST:</span>{" "}
              {form.smtpHost || "Saved host"}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmRemoveOpen(false)}
              disabled={removing}
              className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] transition hover:bg-[var(--bg-soft)] disabled:opacity-70"
              style={{ borderColor: "var(--border-color)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRemoveCredentials}
              disabled={removing}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-70"
            >
              {removing ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {removing ? "Removing..." : "Yes, Remove"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
