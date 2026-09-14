import { useCallback, useEffect, useState } from "react";
import { Edit3, Lock, MapPin, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/authApi";
import { accountApi } from "../../api/accountApi";
import { useToast } from "../../context/ToastContext";
import CountryDropdown from "../common/CountryDropdown";
import AddressAssist from "../address/AddressAssist";
import ConfirmModal from "../common/ConfirmModal";

const DEFAULT_COUNTRY = "United States";

const INPUT_FIELDS = [
  { key: "name", labelName: "Full Name", placeholder: "John Doe", hint: "Min 2, Max 50 chars", minLength: 2, maxLength: 50 },
  { key: "phone", labelName: "Phone Number", placeholder: "10 digit phone number", hint: "Exact 10 digits", minLength: 10, maxLength: 10 },
  { key: "address", labelName: "Street Address", placeholder: "123 Paw Street", hint: "Min 5, Max 100 chars", minLength: 5, maxLength: 100 },
  { key: "area", labelName: "Area / Locality", placeholder: "Downtown", hint: "Optional", maxLength: 80, optional: true },
  { key: "landmark", labelName: "Landmark", placeholder: "Near city park", hint: "Optional", maxLength: 80, optional: true },
  { key: "city", labelName: "City", placeholder: "Austin", hint: "Min 2, Max 50", minLength: 2, maxLength: 50 },
  { key: "state", labelName: "State", placeholder: "TX", hint: "Min 2, Max 50", minLength: 2, maxLength: 50 },
  { key: "postalCode", labelName: "Postal Code", placeholder: "78701", hint: "Min 3, Max 10", minLength: 3, maxLength: 10 },
];

const initialForm = {
  name: "",
  phone: "",
  address: "",
  area: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  country: DEFAULT_COUNTRY,
};

const addressToForm = (address = {}) => ({
  name: address.name || address.fullName || "",
  phone: address.phone || "",
  address: address.address || address.line1 || "",
  area: address.area || "",
  landmark: address.landmark || "",
  city: address.city || "",
  state: address.state || "",
  postalCode: address.postalCode || address.zip || "",
  country: address.country || DEFAULT_COUNTRY,
  latitude: address.latitude,
  longitude: address.longitude,
  placeId: address.placeId || "",
  formattedAddress: address.formattedAddress || "",
});

const normalizeForm = (form) =>
  Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, String(value || "").trim()]),
  );

const validateAddress = (form) => {
  const nextErrors = {};

  INPUT_FIELDS.forEach(({ key, labelName, minLength, maxLength, optional }) => {
    const val = String(form[key] || "").trim();
    if (optional) return;
    if (!val) {
      nextErrors[key] = `${labelName} is required.`;
    } else if (minLength && val.length < minLength) {
      nextErrors[key] = `${labelName} must be at least ${minLength} characters.`;
    } else if (maxLength && val.length > maxLength) {
      nextErrors[key] = `${labelName} must not exceed ${maxLength} characters.`;
    }
  });

  const phoneDigits = String(form.phone || "").replace(/\D/g, "");
  if (!nextErrors.phone && phoneDigits.length !== 10) {
    nextErrors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!String(form.country || "").trim()) {
    nextErrors.country = "Country is required.";
  }

  return nextErrors;
};

const normalizeApiAddress = (addr, index) => {
  if (addr.address && !addr.name && !addr.line1 && !addr.city) {
    const normalizedIndex = addr.index ?? index;
    return {
      id: normalizedIndex,
      index: normalizedIndex,
      name: "My Address",
      phone: "",
      address: addr.address,
      city: "",
      state: "",
      postalCode: "",
      country: addr.country || DEFAULT_COUNTRY,
      isDefault: false,
    };
  }

  return {
    id: addr.index ?? index,
    index: addr.index ?? index,
    name: addr.fullName || addr.name || "Saved Address",
    phone: addr.phone || "",
    address: addr.line1 || addr.address || "",
    area: addr.area || "",
    landmark: addr.landmark || "",
    city: addr.city || "",
    state: addr.state || "",
    postalCode: addr.postalCode || addr.zip || "",
    country: addr.country || DEFAULT_COUNTRY,
    latitude: addr.latitude,
    longitude: addr.longitude,
    placeId: addr.placeId || "",
    formattedAddress: addr.formattedAddress || "",
    isDefault: addr.isDefault || false,
  };
};

const AddressStep = ({ selectedAddress, setSelectedAddress, locked = false }) => {
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const resetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setEditingIndex(null);
  }, []);

  useEffect(() => {
    let active = true;
    const clearAddressState = () => {
      if (!active) return;
      setAddresses([]);
      setShowForm(false);
      setSelectedAddress(null);
      setLoading(false);
    };

    if (!isLoggedIn) {
      queueMicrotask(clearAddressState);
      return () => {
        active = false;
      };
    }
    const session = authApi.getSession?.();
    const token = session?.token;
    if (!token) {
      queueMicrotask(clearAddressState);
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    accountApi
      .getAddresses()
      .then((list) => {
        if (!active) return;
        const normalized = list.map(normalizeApiAddress);
        setAddresses(normalized);
        if (normalized.length === 0) setShowForm(true);
      })
      .catch(() => {
        if (!active) return;
        setAddresses([]);
        setShowForm(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isLoggedIn, setSelectedAddress]);

  const saveAddress = async () => {
    const normalized = normalizeForm(form);
    const nextErrors = validateAddress(normalized);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showToast("Please fix errors before saving address", "warning");
      return;
    }

    setSaving(true);
    try {
      const list =
        editingIndex === null
          ? await accountApi.addAddress(normalized)
          : await accountApi.updateAddress(editingIndex, normalized);
      const nextAddresses = list.map(normalizeApiAddress);
      const nextSelected =
        editingIndex === null
          ? nextAddresses[nextAddresses.length - 1]
          : nextAddresses.find((addr) => addr.index === editingIndex);

      setAddresses(nextAddresses);
      if (nextSelected) setSelectedAddress(nextSelected);
      resetForm();
      setShowForm(false);
      showToast(editingIndex === null ? "Address added" : "Address updated");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not save address", "error");
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleCountryChange = (country) => {
    setForm((current) => ({ ...current, country }));
    setErrors((current) => {
      if (!current.country) return current;
      const next = { ...current };
      delete next.country;
      return next;
    });
  };

  const applyGoogleAddress = (address) => {
    setForm((current) => ({
      ...current,
      address: address.address || current.address,
      area: address.area || current.area,
      city: address.city || current.city,
      state: address.state || current.state,
      postalCode: address.postalCode || current.postalCode,
      country: address.country || current.country,
      latitude: address.latitude,
      longitude: address.longitude,
      placeId: address.placeId || current.placeId,
      formattedAddress: address.formattedAddress || current.formattedAddress,
    }));
    setErrors((current) => {
      const next = { ...current };
      ["address", "city", "state", "postalCode", "country"].forEach((key) => delete next[key]);
      return next;
    });
  };

  const startAddAddress = () => {
    resetForm();
    setShowForm(true);
  };

  const startEditAddress = (address) => {
    setEditingIndex(address.index);
    setForm(addressToForm(address));
    setErrors({});
    setShowForm(true);
  };

  const cancelForm = () => {
    resetForm();
    setShowForm(addresses.length === 0);
  };

  const removeAddress = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const list = await accountApi.removeAddress(removeTarget.index);
      const nextAddresses = list.map(normalizeApiAddress);
      setAddresses(nextAddresses);
      if (selectedAddress?.index === removeTarget.index) {
        setSelectedAddress(null);
      }
      if (editingIndex === removeTarget.index) {
        resetForm();
        setShowForm(nextAddresses.length === 0);
      }
      setRemoveTarget(null);
      showToast("Address removed");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not remove address", "error");
    } finally {
      setRemoving(false);
    }
  };

  const hasRequiredFields =
    INPUT_FIELDS.every(({ key, optional }) => optional || String(form[key] || "").trim()) &&
    Boolean(String(form.country || "").trim());

  return (
    <div
      className={`rounded-2xl border border-[#17345f1a] bg-white shadow-sm transition-opacity ${
        locked ? "pointer-events-none opacity-50 grayscale-[0.4]" : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#17345f1a] px-5 py-4">
        <h2 className="flex items-center gap-2 font-extrabold text-[#122a50]">
          <MapPin className="h-5 w-5 text-[#d9aa3d]" />
          Delivery Address
        </h2>
        {locked && <Lock className="h-4 w-4 text-[#122a50]/40" />}
      </div>

      <div className="space-y-3 p-5">
        {loading ? (
          <div className="rounded-xl border border-[#17345f1a] p-4 text-sm font-bold text-[#122a50b2]">
            Loading addresses...
          </div>
        ) : (
          addresses.map((addr) => (
            <article
              key={addr.id}
              className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${
                selectedAddress?.id === addr.id
                  ? "border-[#17345f] bg-[#f8f1df]"
                  : "border-[#17345f1a] hover:border-[#17345f]/30"
              }`}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                <input
                  type="radio"
                  name="address"
                  className="mt-1 accent-[#17345f]"
                  checked={selectedAddress?.id === addr.id}
                  onChange={() => setSelectedAddress(addr)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="break-words text-sm font-extrabold text-[#122a50] [overflow-wrap:anywhere]">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="rounded-full bg-[#17345f] px-2 py-0.5 text-[10px] font-extrabold text-white">
                        Default
                      </span>
                    )}
                  </div>
                  {addr.phone && <p className="mt-0.5 break-words text-xs font-semibold text-[#122a50]/60 [overflow-wrap:anywhere]">{addr.phone}</p>}
                  <p className="break-words text-xs font-semibold text-[#122a50]/60 [overflow-wrap:anywhere]">
                    {addr.address}
                    {addr.area ? `, ${addr.area}` : ""}
                    {addr.landmark ? `, ${addr.landmark}` : ""}
                  </p>
                  <p className="break-words text-xs font-semibold text-[#122a50]/60 [overflow-wrap:anywhere]">{formatCityStatePostal(addr)}</p>
                </div>
              </label>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => startEditAddress(addr)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#17345f1a] text-[#17345f] transition-colors hover:bg-white"
                  aria-label={`Edit ${addr.name}`}
                  title="Edit address"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(addr)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50"
                  aria-label={`Delete ${addr.name}`}
                  title="Delete address"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}

        {showForm ? (
          <div className="space-y-4 rounded-xl border border-[#17345f1a] p-4 text-left">
            <AddressAssist onAddressSelect={applyGoogleAddress} />
            <div className="grid gap-3 sm:grid-cols-2">
              {INPUT_FIELDS.slice(0, 2).map(({ key, labelName, placeholder, hint, maxLength }) => (
                <label key={key} className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#122a50]">{labelName} *</span>
                    {hint && <span className="text-[10px] font-semibold text-[#122a50]/50">{hint}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    maxLength={maxLength}
                    onChange={updateForm(key)}
                    aria-invalid={Boolean(errors[key])}
                    className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold text-[#122a50] outline-none placeholder:text-[#122a50]/40 focus:border-[#17345f] ${
                      errors[key] ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                    }`}
                  />
                  {errors[key] && (
                    <span className="mt-1 block text-xs font-semibold text-red-600">
                      {errors[key]}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {INPUT_FIELDS.slice(2, 3).map(({ key, labelName, placeholder, hint, maxLength }) => (
              <label key={key} className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#122a50]">{labelName} *</span>
                  {hint && <span className="text-[10px] font-semibold text-[#122a50]/50">{hint}</span>}
                </div>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={form[key]}
                  maxLength={maxLength}
                  onChange={updateForm(key)}
                  aria-invalid={Boolean(errors[key])}
                  className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold text-[#122a50] outline-none placeholder:text-[#122a50]/40 focus:border-[#17345f] ${
                    errors[key] ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                  }`}
                />
                {errors[key] && (
                  <span className="mt-1 block text-xs font-semibold text-red-600">
                    {errors[key]}
                  </span>
                )}
              </label>
            ))}

            <div className="grid gap-3 sm:grid-cols-2">
              {INPUT_FIELDS.slice(3, 5).map(({ key, labelName, placeholder, hint, maxLength }) => (
                <label key={key} className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#122a50]">{labelName}</span>
                    {hint && <span className="text-[10px] font-semibold text-[#122a50]/50">{hint}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    maxLength={maxLength}
                    onChange={updateForm(key)}
                    className="h-10 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-semibold text-[#122a50] outline-none placeholder:text-[#122a50]/40 focus:border-[#17345f]"
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {INPUT_FIELDS.slice(5, 7).map(({ key, labelName, placeholder, hint, maxLength }) => (
                <label key={key} className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#122a50]">{labelName} *</span>
                    {hint && <span className="text-[10px] font-semibold text-[#122a50]/50">{hint}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    maxLength={maxLength}
                    onChange={updateForm(key)}
                    aria-invalid={Boolean(errors[key])}
                    className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold text-[#122a50] outline-none placeholder:text-[#122a50]/40 focus:border-[#17345f] ${
                      errors[key] ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                    }`}
                  />
                  {errors[key] && (
                    <span className="mt-1 block text-xs font-semibold text-red-600">
                      {errors[key]}
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {INPUT_FIELDS.slice(7, 8).map(({ key, labelName, placeholder, hint, maxLength }) => (
                <label key={key} className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#122a50]">{labelName} *</span>
                    {hint && <span className="text-[10px] font-semibold text-[#122a50]/50">{hint}</span>}
                  </div>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={form[key]}
                    maxLength={maxLength}
                    onChange={updateForm(key)}
                    aria-invalid={Boolean(errors[key])}
                    className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold text-[#122a50] outline-none placeholder:text-[#122a50]/40 focus:border-[#17345f] ${
                      errors[key] ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                    }`}
                  />
                  {errors[key] && (
                    <span className="mt-1 block text-xs font-semibold text-red-600">
                      {errors[key]}
                    </span>
                  )}
                </label>
              ))}

              <div className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#122a50]">Country *</span>
                </div>
                <CountryDropdown
                  value={form.country}
                  dropUp={true}
                  onChange={handleCountryChange}
                />
                {errors.country && (
                  <span className="mt-1 block text-xs font-semibold text-red-600">
                    {errors.country}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={saveAddress}
                disabled={!hasRequiredFields || saving}
                className={`flex-1 rounded-lg py-2.5 text-sm font-extrabold text-white transition-colors cursor-pointer ${
                  hasRequiredFields && !saving
                    ? "bg-[#17345f] hover:bg-[#d9aa3d]"
                    : "cursor-not-allowed bg-[#17345f]/40"
                }`}
              >
                {saving ? "Saving..." : editingIndex === null ? "Save Address" : "Update Address"}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                disabled={saving}
                className="flex-1 rounded-lg border border-[#17345f1a] py-2.5 text-sm font-semibold text-[#122a50] hover:bg-[#f8f1df] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startAddAddress}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#17345f1a] py-3 text-sm font-extrabold text-[#17345f] transition-colors hover:border-[#17345f] hover:bg-[#f8f1df] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add New Address
          </button>
        )}
      </div>

      <div className="border-t border-[#17345f1a] px-5 py-4">
        <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#122a50]/40">
          <ShieldCheck className="h-3.5 w-3.5" />
          Your information is safe with us
        </p>
      </div>
      <ConfirmModal
        open={Boolean(removeTarget)}
        title="Delete address?"
        message={`Do you want to delete ${removeTarget?.name || "this address"}?`}
        confirmLabel="Delete"
        loading={removing}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={removeAddress}
      />
    </div>
  );
};

function formatCityStatePostal(address = {}) {
  return [address.city, address.state, address.postalCode || address.zip, address.country]
    .filter(Boolean)
    .join(", ");
}

export default AddressStep;
