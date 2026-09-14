import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Card from "../common/Card";
import { Gift, Settings, Shield, Wrench, Save, Check, MailCheck } from "lucide-react";
import { adminApi, isSuperAdmin } from "../../lib/api";
import { featureFlags } from "../../config/featureFlags";
import {
  getSelectedSuperAdminStore,
  isAllStoresSelected,
  SUPER_ADMIN_STORE_EVENT,
} from "../../lib/superAdminStore";

function SettingField({ label, type = "text", value, onChange, placeholder, min, max, step, hint }) {
  const [enabled, setEnabled] = useState(Boolean(value));

  useEffect(() => {
    if (type === "toggle") setEnabled(Boolean(value));
  }, [type, value]);

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          rows={3}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none bg-white"
          style={{ borderColor: "var(--border-color)" }}
        />
      ) : type === "toggle" ? (
        <div className="flex items-center gap-2">
          <div
            onClick={() => { setEnabled(e => !e); onChange?.({ target: { value: !enabled } }); }}
            className="w-10 h-5 rounded-full relative cursor-pointer transition-colors"
            style={{ background: enabled ? "var(--primary)" : "#e5e7eb" }}
          >
            <motion.div
              animate={{ x: enabled ? 20 : 0 }}
              className="w-4 h-4 bg-white rounded-full absolute left-0.5 top-0.5 shadow"
            />
          </div>
          <span className="text-sm text-gray-700">
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 bg-white"
          style={{ borderColor: "var(--border-color)" }}
        />
      )}
      {hint && <p className="mt-1 text-[11px] font-medium text-gray-400">{hint}</p>}
    </div>
  );
}

export function GeneralSettingsForm() {
  const [selectedStoreKey, setSelectedStoreKey] = useState(getSelectedSuperAdminStore);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [runningCartEmails, setRunningCartEmails] = useState(false);
  const [cartRunResult, setCartRunResult] = useState("");
  const [form, setForm] = useState({
    storeName: "",
    supportEmail: "",
    supportPhone: "",
    currency: "USD",
    timezone: "UTC",
    rewardsEnabled: true,
    rewardSignupPoints: 40,
    rewardPointsPerCurrencyUnit: 1,
    rewardPointValue: 0.25,
    rewardMaxRedeemPercent: 20,
    rewardMinRedeemPoints: 1,
    abandonedCartEmailEnabled: false,
    abandonedCartDelayHours: 24,
    abandonedCartDiscountPercent: 10,
    abandonedCartMinimumAmount: 25,
    abandonedCartMaxEmails: 2,
    mobileAppEnabled: false,
    appStoreUrl: "",
    playStoreUrl: "",
  });

  const needsSpecificStore = isSuperAdmin() && isAllStoresSelected(selectedStoreKey);

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
    if (needsSpecificStore) {
      setError("Select one store before editing general settings.");
      return;
    }
    setError("");
    adminApi.settings().then(data => {
      if (data) setForm(f => ({ ...f, ...data }));
    }).catch(() => {});
  }, [needsSpecificStore, selectedStoreKey]);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const updateNumber = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value === "" ? "" : Number(e.target.value) }));
  const updateBoolean = (field) => (e) => setForm(f => ({ ...f, [field]: Boolean(e.target.value) }));

  const handleSave = async () => {
    if (needsSpecificStore) {
      setError("Select one store before saving general settings.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminApi.updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRunAbandonedCartEmails = async () => {
    if (needsSpecificStore) {
      setError("Select one store before running abandoned cart emails.");
      return;
    }
    setRunningCartEmails(true);
    setError("");
    setCartRunResult("");
    try {
      const result = await adminApi.runAbandonedCartEmails({ force: true, limit: 20 });
      const sent = Number(result?.sent || 0);
      const failed = Number(result?.failed || 0);
      const skipped = Number(result?.skipped || 0);
      setCartRunResult(`Checked ${result?.checked || 0} carts. Sent ${sent}, skipped ${skipped}, failed ${failed}.`);
    } catch (err) {
      setError(err.message || "Failed to run abandoned cart emails");
    } finally {
      setRunningCartEmails(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Settings size={16} style={{ color: "var(--primary)" }} />
          <h3 className="font-display font-semibold text-gray-800">
            General Settings
          </h3>
        </div>
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="space-y-4">
          <SettingField label="Store Name" value={form.storeName} onChange={update("storeName")} />
          <SettingField label="Support Email" type="email" value={form.supportEmail} onChange={update("supportEmail")} />
          <SettingField label="Support Phone" value={form.supportPhone} onChange={update("supportPhone")} />
          <SettingField label="Currency" value={form.currency} onChange={update("currency")} />
          <SettingField label="Timezone" value={form.timezone} onChange={update("timezone")} />
        </div>
        <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} style={{ color: "var(--primary)" }} />
            <h3 className="font-display font-semibold text-gray-800">
              Mobile App
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SettingField label="Download Our App" type="toggle" value={form.mobileAppEnabled} onChange={updateBoolean("mobileAppEnabled")} />
            <SettingField
              label="Apple App Store URL"
              type="url"
              value={form.appStoreUrl}
              onChange={update("appStoreUrl")}
              placeholder="https://apps.apple.com/..."
            />
            <SettingField
              label="Google Play URL"
              type="url"
              value={form.playStoreUrl}
              onChange={update("playStoreUrl")}
              placeholder="https://play.google.com/store/apps/..."
            />
          </div>
        </div>
        {/* Temporarily hidden while the Rewards Signup Incentive feature is paused. */}
        {featureFlags.rewardSignupIncentive && <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Gift size={16} style={{ color: "var(--primary)" }} />
            <h3 className="font-display font-semibold text-gray-800">
              Reward Points
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SettingField label="Rewards Program" type="toggle" value={form.rewardsEnabled} onChange={updateBoolean("rewardsEnabled")} />
            <SettingField
              label="Signup Points"
              type="number"
              min="0"
              step="1"
              value={form.rewardSignupPoints}
              onChange={updateNumber("rewardSignupPoints")}
              hint="Default 40 points."
            />
            <SettingField
              label="Points Earned Per $1"
              type="number"
              min="0"
              step="0.01"
              value={form.rewardPointsPerCurrencyUnit}
              onChange={updateNumber("rewardPointsPerCurrencyUnit")}
            />
            <SettingField
              label="Value Per Point ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.rewardPointValue}
              onChange={updateNumber("rewardPointValue")}
              hint="40 points at $0.25 equals $10."
            />
            <SettingField
              label="Max Redeem % Of Order"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.rewardMaxRedeemPercent}
              onChange={updateNumber("rewardMaxRedeemPercent")}
            />
            <SettingField
              label="Minimum Redeem Points"
              type="number"
              min="0"
              step="1"
              value={form.rewardMinRedeemPoints}
              onChange={updateNumber("rewardMinRedeemPoints")}
            />
          </div>
        </div>}
        <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Gift size={16} style={{ color: "var(--primary)" }} />
            <h3 className="font-display font-semibold text-gray-800">
              Abandoned Cart Email
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SettingField label="Reminder Email" type="toggle" value={form.abandonedCartEmailEnabled} onChange={updateBoolean("abandonedCartEmailEnabled")} />
            <SettingField
              label="Send After Hours"
              type="number"
              min="0.05"
              step="0.25"
              value={form.abandonedCartDelayHours}
              onChange={updateNumber("abandonedCartDelayHours")}
              hint="Default 24 hours after cart is inactive."
            />
            <SettingField
              label="Discount Percent"
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.abandonedCartDiscountPercent}
              onChange={updateNumber("abandonedCartDiscountPercent")}
              hint="Creates a CARTSAVE coupon for reminder emails."
            />
            <SettingField
              label="Minimum Cart Amount"
              type="number"
              min="0"
              step="1"
              value={form.abandonedCartMinimumAmount}
              onChange={updateNumber("abandonedCartMinimumAmount")}
            />
            <SettingField
              label="Max Emails Per Customer"
              type="number"
              min="0"
              step="1"
              value={form.abandonedCartMaxEmails}
              onChange={updateNumber("abandonedCartMaxEmails")}
            />
          </div>
          {cartRunResult && (
            <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {cartRunResult}
            </p>
          )}
          <button
            type="button"
            onClick={handleRunAbandonedCartEmails}
            disabled={runningCartEmails || !form.abandonedCartEmailEnabled || needsSpecificStore}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-5 py-2 rounded-xl border bg-white hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-60"
            style={{ borderColor: "var(--border-color)", color: "var(--primary)" }}
          >
            {runningCartEmails ? (
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              <MailCheck size={14} />
            )}
            {runningCartEmails ? "Sending..." : "Run Reminder Emails Now"}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || needsSpecificStore}
          className="mt-5 flex items-center gap-2 text-white text-sm font-medium px-6 py-2 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-md disabled:opacity-70"
          style={{ background: saved ? "#059669" : "var(--primary)" }}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </Card>
    </div>
  );
}

export function AMCSettingsForm() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} style={{ color: "var(--primary)" }} />
          <h3 className="font-display font-semibold text-gray-800">
            Shipping Settings
          </h3>
        </div>
        <div className="space-y-4">
          <SettingField label="Low Stock Alert Days" value="30" type="number" />
          <SettingField label="Shipment Notification" type="toggle" />
          <SettingField label="Return Window (Days)" value="7" type="number" />
          <SettingField
            label="Cart Recovery Discount (%)"
            value="10"
            type="number"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 flex items-center gap-2 text-white text-sm font-medium px-6 py-2 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-md disabled:opacity-70"
          style={{ background: saved ? "#059669" : "var(--primary)" }}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </Card>
    </div>
  );
}

export function ServiceTypeSettingsList() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [typesState, setTypesState] = useState([
    { name: "Standard Fulfillment", active: true },
    { name: "Express Fulfillment", active: true },
    { name: "Return Pickup", active: true },
    { name: "Gift Wrap", active: false },
  ]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const toggleType = (index) => {
    setTypesState((prev) =>
      prev.map((t, i) => (i === index ? { ...t, active: !t.active } : t)),
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Wrench size={16} style={{ color: "var(--primary)" }} />
          <h3 className="font-display font-semibold text-gray-800">
            Fulfillment Type Settings
          </h3>
        </div>
        <div className="space-y-3">
          {typesState.map((t, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <span className="text-sm font-medium text-gray-700">
                {t.name}
              </span>
              <div className="flex items-center gap-3">
                <div
                  onClick={() => toggleType(i)}
                  className="w-9 h-4 rounded-full relative cursor-pointer transition-colors"
                  style={{
                    background: t.active ? "var(--primary)" : "#e5e7eb",
                  }}
                >
                  <motion.div
                    animate={{ x: t.active ? 20 : 0 }}
                    className="w-3 h-3 bg-white rounded-full absolute left-0.5 top-0.5 shadow"
                  />
                </div>
                <span className="text-xs text-gray-500 w-12">
                  {t.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 flex items-center gap-2 text-white text-sm font-medium px-6 py-2 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-md disabled:opacity-70"
          style={{ background: saved ? "#059669" : "var(--primary)" }}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </Card>
    </div>
  );
}
