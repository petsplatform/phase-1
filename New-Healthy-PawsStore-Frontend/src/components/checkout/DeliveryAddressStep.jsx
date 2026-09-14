import { useState, useEffect } from "react";
import { CheckCircle2, MapPin, Plus, ShieldCheck, Lock, Edit2, Trash2 } from "lucide-react";
import CountryDropdown from "../common/CountryDropdown";
import { addressApi } from "../../api/addressApi";
import { getStoredAuthUser } from "../../services/authService";

export default function DeliveryAddressStep({
  register,
  errors,
  values,
  setValue,
  complete,
  editing,
  locked,
  onSave,
  onEdit,
  onCancel,
  onSelectSavedAddress,
}) {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);

  const storedUser = getStoredAuthUser();

  // Load saved addresses for authenticated users
  const loadAddresses = async () => {
    if (!storedUser) return;
    try {
      setLoadingAddresses(true);
      const list = await addressApi.getAddresses();
      setSavedAddresses(Array.isArray(list) ? list : []);
    } catch {
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const hasSavedAddresses = savedAddresses.length > 0;

  // Auto-open form if user has no saved addresses and is editing
  useEffect(() => {
    if (editing && !hasSavedAddresses && !loadingAddresses) {
      setShowForm(true);
    }
  }, [editing, hasSavedAddresses, loadingAddresses]);

  // Handle Edit button click on a saved address card
  const handleStartEdit = (e, addr, index) => {
    e.stopPropagation();
    setEditingAddressIndex(index);
    if (setValue) {
      setValue("fullName", addr.fullName || addr.name || "", { shouldValidate: true });
      setValue("phone", addr.phone || "", { shouldValidate: true });
      setValue("address", addr.line1 || addr.address || "", { shouldValidate: true });
      setValue("city", addr.city || "", { shouldValidate: true });
      setValue("state", addr.state || "", { shouldValidate: true });
      setValue("postalCode", addr.postalCode || addr.zip || "", { shouldValidate: true });
      setValue("country", addr.country || "United States", { shouldValidate: true });
    }
    setShowForm(true);
  };

  // Handle Delete button click on a saved address card
  const handleDeleteAddress = async (e, addr, index) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this delivery address?")) return;
    setDeletingIndex(index);
    try {
      await addressApi.deleteAddress(index);
      await loadAddresses();
    } catch (err) {
      console.error("Failed to delete address:", err);
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleAddNew = () => {
    setEditingAddressIndex(null);
    if (setValue) {
      setValue("address", "");
      setValue("city", "");
      setValue("state", "");
      setValue("postalCode", "");
    }
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingAddressIndex(null);
    if (hasSavedAddresses) {
      setShowForm(false);
    }
    onCancel?.();
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    try {
      await onSave?.(editingAddressIndex);
      setEditingAddressIndex(null);
      setShowForm(false);
      await loadAddresses();
    } finally {
      setSaving(false);
    }
  };

  // 1. Locked state
  if (locked) {
    return (
      <section className="rounded-[20px] border border-borderSoft/60 bg-white/70 p-5 opacity-60">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-sageLight text-muted">
            <Lock className="size-4" />
          </div>
          <div>
            <h2 className="font-display text-[16px] font-bold text-muted">Delivery Address</h2>
            <p className="text-[12px] font-medium text-muted">Complete previous steps first</p>
          </div>
        </div>
      </section>
    );
  }

  // 2. Completed / Collapsed state
  if (complete && !editing) {
    const displayStreet = values.address;
    const displayCityStateZip = formatCityStatePostal(values);
    const displayCountry = values.country;

    return (
      <section id="address-section" className="rounded-[20px] border border-borderSoft bg-white shadow-contact">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 border-b border-borderSoft/60 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="size-5 shrink-0 text-orange" />
              <h2 className="font-display text-[18px] font-extrabold text-textMain sm:text-[20px]">Delivery Address</h2>
            </div>
            <button
              type="button"
              onClick={onEdit}
              className="shrink-0 text-[13px] font-extrabold text-orange transition hover:text-primaryDark sm:text-[14px] cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="mt-3 min-w-0 sm:pl-7">
            {values.fullName && (
              <p className="truncate text-[13px] font-extrabold text-textMain">{values.fullName}</p>
            )}
            {values.phone && (
              <p className="truncate text-[12px] font-semibold text-muted">{values.phone}</p>
            )}
            {displayStreet && (
              <p className="mt-1 truncate text-[13px] font-semibold text-textMain">{displayStreet}</p>
            )}
            {displayCityStateZip && (
              <p className="truncate text-[12px] font-medium text-muted">{displayCityStateZip}</p>
            )}
            {displayCountry && (
              <p className="truncate text-[12px] font-medium text-muted">{displayCountry}</p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // 3. Active / Editing state
  return (
    <section id="address-section" className="rounded-[20px] border border-borderSoft bg-white shadow-contact">
      <div className="flex items-center gap-2 border-b border-borderSoft px-5 py-4 sm:px-7">
        <MapPin className="size-5 text-orange" />
        <h2 className="font-display text-[20px] font-extrabold text-textMain">Delivery Address</h2>
      </div>

      <div className="p-5 sm:p-7">
        {/* Saved Addresses List (for logged-in users) */}
        {hasSavedAddresses && !showForm && (
          <div className="space-y-4">
            <p className="text-[14px] font-semibold text-muted text-left">Choose a saved delivery destination or enter a new one:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {savedAddresses.map((addr, idx) => {
                const isSelected =
                  values.address === (addr.line1 || addr.address) &&
                  values.postalCode === (addr.postalCode || addr.zip);

                return (
                  <div
                    key={addr.id || idx}
                    onClick={() => onSelectSavedAddress?.(addr)}
                    className={`relative rounded-2xl border p-4 text-left cursor-pointer transition ${
                      isSelected
                        ? "border-secondaryDark bg-secondaryDark/5 shadow-sm"
                        : "border-borderSoft bg-white hover:border-secondaryDark/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-extrabold text-textMain truncate">
                            {addr.fullName || addr.label || `Address ${idx + 1}`}
                          </span>
                          {addr.isDefault && (
                            <span className="rounded-full bg-secondaryDark/10 px-2 py-0.5 text-[10px] font-extrabold text-secondaryDark">
                              Default
                            </span>
                          )}
                        </div>
                        {addr.phone && (
                          <p className="mt-0.5 text-[12px] font-semibold text-muted">{addr.phone}</p>
                        )}
                        <p className="mt-2 text-[13px] font-semibold text-textMain leading-snug">
                          {addr.line1 || addr.address}
                        </p>
                        <p className="text-[12px] font-medium text-muted">
                          {formatCityStatePostal(addr)}
                        </p>
                        {addr.country && (
                          <p className="text-[11px] font-medium text-muted">{addr.country}</p>
                        )}
                      </div>

                      {/* Action buttons: Edit & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleStartEdit(e, addr, idx)}
                          title="Edit address"
                          className="rounded-lg p-1.5 text-muted hover:bg-sageLight hover:text-secondaryDark transition cursor-pointer"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={deletingIndex === idx}
                          onClick={(e) => handleDeleteAddress(e, addr, idx)}
                          title="Delete address"
                          className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddNew}
              className="mt-2 flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-dashed border-secondaryDark/40 text-[13px] font-extrabold text-secondaryDark transition hover:bg-secondaryDark/5 cursor-pointer"
            >
              <Plus size={16} /> Add New Address
            </button>
          </div>
        )}

        {/* Inline Address Form */}
        {(!hasSavedAddresses || showForm) && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-borderSoft pb-2">
              <h3 className="text-[15px] font-extrabold text-textMain">
                {editingAddressIndex !== null ? "Edit Delivery Address" : "Enter New Address Details"}
              </h3>
              {hasSavedAddresses && (
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-[12px] font-bold text-muted hover:text-textMain transition cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="fullName"
                label="Full Name *"
                hint="Min 2, Max 50 chars"
                placeholder="John Doe"
                register={register}
                error={errors.fullName?.message}
                minLength={2}
                maxLength={50}
              />
              <Field
                name="phone"
                label="Phone Number *"
                hint="Exact 10 digits"
                placeholder="10 digit phone number"
                register={register}
                error={errors.phone?.message}
                maxLength={10}
              />
            </div>

            <Field
              name="address"
              label="Street Address *"
              hint="Min 5, Max 100 chars"
              placeholder="123 Paw Street"
              register={register}
              error={errors.address?.message}
              minLength={5}
              maxLength={100}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="city"
                label="City *"
                hint="Min 2, Max 50"
                placeholder="Austin"
                register={register}
                error={errors.city?.message}
                minLength={2}
                maxLength={50}
              />
              <Field
                name="state"
                label="State *"
                hint="Min 2, Max 50"
                placeholder="TX"
                register={register}
                error={errors.state?.message}
                minLength={2}
                maxLength={50}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="postalCode"
                label="Postal Code *"
                hint="Min 3, Max 10"
                placeholder="78701"
                register={register}
                error={errors.postalCode?.message}
                minLength={3}
                maxLength={10}
              />
              <div className="block text-left">
                <span className="mb-2 block text-[13px] font-extrabold text-textMain uppercase tracking-wider">Country *</span>
                <CountryDropdown
                  value={values?.country || "United States"}
                  dropUp={true}
                  onChange={(c) => {
                    if (setValue) setValue("country", c, { shouldValidate: true });
                  }}
                  className="h-11 w-full rounded-xl border border-borderSoft bg-white px-4 text-[13px] font-semibold text-textMain outline-none flex items-center justify-between transition cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAddress}
                className="h-11 flex-1 rounded-xl bg-secondaryDark text-[14px] font-extrabold text-white transition hover:bg-primaryDark disabled:opacity-60 cursor-pointer"
              >
                {saving ? "Saving..." : (editingAddressIndex !== null ? "Update Address" : "Save Address")}
              </button>
              {(complete || hasSavedAddresses) && (
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="h-11 flex-1 rounded-xl border border-borderSoft text-[14px] font-extrabold text-textMain transition hover:bg-sageLight cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-borderSoft px-5 py-4">
        <p className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-muted">
          <ShieldCheck className="size-3.5" />
          Your information is safe with us
        </p>
      </div>
    </section>
  );
}

function formatCityStatePostal(address = {}) {
  return [address.city, address.state, address.postalCode || address.zip]
    .filter(Boolean)
    .join(", ");
}

function Field({ name, label, hint, placeholder, register, error, ...props }) {
  return (
    <label className="block text-left">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] font-extrabold text-textMain">{label}</span>
        {hint && <span className="text-[10px] text-muted font-semibold">{hint}</span>}
      </div>
      <input
        {...register(name)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`h-11 w-full rounded-xl border ${error ? "border-error bg-error/5" : "border-borderSoft bg-white"} px-4 text-[13px] font-semibold text-textMain outline-none placeholder:text-muted focus:border-secondary focus:ring-2 focus:ring-sage`}
        {...props}
      />
      {error && <span className="mt-1 block text-[12px] font-bold text-error">{error}</span>}
    </label>
  );
}
