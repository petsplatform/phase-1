import { useState } from "react";
import { Edit2, Plus, Trash2, Phone } from "lucide-react";
import CountryDropdown from "../common/CountryDropdown";

export default function SavedAddressesTab({
  addresses,
  showAddressForm,
  setShowAddressForm,
  addressTitle,
  setAddressTitle,
  addressName,
  setAddressName,
  addressStreet,
  setAddressStreet,
  addressCity,
  setAddressCity,
  addressState,
  setAddressState,
  addressZip,
  setAddressZip,
  addressCountry = "United States",
  setAddressCountry,
  addressPhone,
  setAddressPhone,
  handleAddAddress,
  handleDeleteAddress,
  handleUpdateAddress,
  handleSetDefaultAddress,
}) {
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editValues, setEditValues] = useState(null);
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const startEdit = (addr) => {
    setEditError("");
    setEditingAddressId(addr.id);
    setEditValues({
      title: addr.title || "Saved Address",
      name: addr.name || "",
      phone: addr.phone || "",
      address: addr.address || addr.street || "",
      apartment: addr.apartment || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || addr.zipCode || "",
      country: addr.country || "United States",
      isDefault: Boolean(addr.isDefault),
    });
  };

  const updateEditValue = (key, value) => {
    setEditValues((current) => ({ ...current, [key]: value }));
  };

  const validateAddress = (values) => {
    const requiredFields = [
      "address",
      "city",
      "state",
      "zip",
      "country",
    ];
    const missingField = requiredFields.find(
      (field) => !String(values[field] || "").trim(),
    );
    if (missingField) return "Please fill in all required address fields.";

    if (!/^[a-zA-Z0-9\s-]{3,12}$/.test(values.zip.trim())) {
      return "Please enter a valid ZIP / Postal Code.";
    }

    const tooLong = Object.entries(values).find(
      ([key, value]) =>
        typeof value === "string" && key !== "apartment" && value.length > 120,
    );
    if (tooLong) return "Address fields must be 120 characters or fewer.";

    return "";
  };

  const submitEdit = async (addr) => {
    if (!editValues || isSavingEdit) return;
    const validationMessage = validateAddress(editValues);
    if (validationMessage) {
      setEditError(validationMessage);
      return;
    }

    setIsSavingEdit(true);
    setEditError("");
    try {
      await handleUpdateAddress(addr, editValues);
      setEditingAddressId(null);
      setEditValues(null);
    } catch (error) {
      setEditError(
        error.response?.data?.message ||
          error.message ||
          "Address could not be updated.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between border-b border-outline pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-background">
            Saved Addresses
          </h2>
          <p className="text-xs text-charcoal-text mt-0.5">
            Manage your shipping and billing destinations
          </p>
        </div>
        {!showAddressForm && (
          <button
            onClick={() => setShowAddressForm(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/90 px-4 py-2 text-xs font-bold text-white transition cursor-pointer shadow-sm"
          >
            <Plus size={14} />
            <span>Add New</span>
          </button>
        )}
      </div>

      {showAddressForm && (
        <form
          onSubmit={handleAddAddress}
          className="border border-outline bg-surface-tint/10 rounded-2xl p-5 mb-6 space-y-4"
        >
          <h3 className="font-bold text-on-background">New Address</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text">
                  Full Name
                </label>
                <span className="text-[9px] text-charcoal-text/60">Min 2, Max 50 chars</span>
              </div>
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={addressName}
                onChange={(e) => setAddressName(e.target.value)}
                placeholder="John Smith"
                className={`w-full rounded-xl border ${
                  addressName.trim().length > 0 &&
                  (addressName.trim().length < 2 || addressName.trim().length > 50)
                    ? "border-red-400 focus:border-red-500"
                    : "border-outline-strong focus:border-secondary"
                } bg-white px-4 py-2.5 text-xs text-on-background outline-none transition`}
              />
              {addressName.trim().length > 0 &&
                (addressName.trim().length < 2 || addressName.trim().length > 50) && (
                  <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                    Full name must be 2 to 50 characters.
                  </span>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text">
                  Phone Number
                </label>
                <span className="text-[9px] text-charcoal-text/60">Exact 10 digits</span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={addressPhone}
                onChange={(e) => setAddressPhone(e.target.value)}
                placeholder="10 digit phone number"
                className={`w-full rounded-xl border ${
                  addressPhone.trim().length > 0 &&
                  addressPhone.replace(/\D/g, "").length !== 10
                    ? "border-red-400 focus:border-red-500"
                    : "border-outline-strong focus:border-secondary"
                } bg-white px-4 py-2.5 text-xs text-on-background outline-none transition`}
              />
              {addressPhone.trim().length > 0 &&
                addressPhone.replace(/\D/g, "").length !== 10 && (
                  <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                    Phone number must be exactly 10 digits.
                  </span>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text">
                Street Address
              </label>
              <span className="text-[9px] text-charcoal-text/60">Min 5, Max 100 chars</span>
            </div>
            <input
              type="text"
              required
              minLength={5}
              maxLength={100}
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              placeholder="Street Address, P.O. box, apt"
              className={`w-full rounded-xl border ${
                addressStreet.trim().length > 0 &&
                (addressStreet.trim().length < 5 || addressStreet.trim().length > 100)
                  ? "border-red-400 focus:border-red-500"
                  : "border-outline-strong focus:border-secondary"
              } bg-white px-4 py-2.5 text-xs text-on-background outline-none transition`}
            />
            {addressStreet.trim().length > 0 &&
              (addressStreet.trim().length < 5 || addressStreet.trim().length > 100) && (
                <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                  Address must be between 5 and 100 characters.
                </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text">
                  City
                </label>
                <span className="text-[9px] text-charcoal-text/60">Min 2, Max 50 chars</span>
              </div>
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="e.g. Austin"
                className={`w-full rounded-xl border ${
                  addressCity.trim().length > 0 &&
                  (addressCity.trim().length < 2 || addressCity.trim().length > 50)
                    ? "border-red-400 focus:border-red-500"
                    : "border-outline-strong focus:border-secondary"
                } bg-white px-4 py-2.5 text-xs text-on-background outline-none transition`}
              />
              {addressCity.trim().length > 0 &&
                (addressCity.trim().length < 2 || addressCity.trim().length > 50) && (
                  <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                    City must be between 2 and 50 characters.
                  </span>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text">
                  State / Province
                </label>
                <span className="text-[9px] text-charcoal-text/60">Min 2, Max 50 chars</span>
              </div>
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                placeholder="e.g. TX"
                className={`w-full rounded-xl border ${
                  addressState.trim().length > 0 &&
                  (addressState.trim().length < 2 || addressState.trim().length > 50)
                    ? "border-red-400 focus:border-red-500"
                    : "border-outline-strong focus:border-secondary"
                } bg-white px-4 py-2.5 text-xs text-on-background outline-none transition`}
              />
              {addressState.trim().length > 0 &&
                (addressState.trim().length < 2 || addressState.trim().length > 50) && (
                  <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                    State must be between 2 and 50 characters.
                  </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text">
                  ZIP / Postal Code
                </label>
                <span className="text-[9px] text-charcoal-text/60">Min 3, Max 10 chars</span>
              </div>
              <input
                type="text"
                required
                minLength={3}
                maxLength={10}
                value={addressZip}
                onChange={(e) => setAddressZip(e.target.value)}
                placeholder="e.g. 78701"
                className={`w-full rounded-xl border ${
                  addressZip.trim().length > 0 &&
                  (addressZip.trim().length < 3 || addressZip.trim().length > 10)
                    ? "border-red-400 focus:border-red-500"
                    : "border-outline-strong focus:border-secondary"
                } bg-white px-4 py-2.5 text-xs text-on-background outline-none transition`}
              />
              {addressZip.trim().length > 0 &&
                (addressZip.trim().length < 3 || addressZip.trim().length > 10) && (
                  <span className="text-[10px] font-semibold text-red-500 mt-0.5 block">
                    ZIP code must be between 3 and 10 characters.
                  </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text mb-1">
                Country
              </label>
              <CountryDropdown
                value={addressCountry || "United States"}
                onChange={(c) => setAddressCountry && setAddressCountry(c)}
                dropUp={true}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button
              type="button"
              onClick={() => setShowAddressForm(false)}
              className="rounded-full border border-outline-strong bg-white px-4 py-2 text-xs font-bold text-charcoal-text hover:bg-surface-soft cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-secondary hover:bg-secondary/90 px-5 py-2 text-xs font-bold text-white cursor-pointer transition"
            >
              Save Address
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="border border-outline rounded-2xl p-5 relative bg-white hover:border-secondary/40 transition text-left"
          >
            <h4 className="font-extrabold text-on-background">{addr.name}</h4>
            <p className="text-xs text-charcoal-text mt-1.5 leading-relaxed">
              {addr.street}
              <br />
              {addr.city}, {addr.state} {addr.zip}
            </p>
            <p className="text-xs font-semibold text-charcoal-text mt-2 flex items-center gap-1.5">
              <Phone size={11} className="text-secondary" />
              <span>{addr.phone}</span>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => startEdit(addr)}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-strong bg-white px-3 py-1.5 text-[11px] font-bold text-charcoal-text transition hover:border-secondary hover:text-secondary cursor-pointer"
              >
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAddress(addr.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                title="Delete Address"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>

            {editingAddressId === addr.id && editValues ? (
              <div className="mt-5 rounded-2xl border border-outline bg-surface-tint/10 p-4">
                <div className="grid gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={editValues.name}
                      onChange={(event) =>
                        updateEditValue("name", event.target.value)
                      }
                      placeholder="Full Name"
                      className="rounded-xl border border-outline-strong bg-white px-3 py-2.5 text-xs outline-none focus:border-secondary"
                    />
                    <input
                      type="tel"
                      value={editValues.phone}
                      onChange={(event) =>
                        updateEditValue("phone", event.target.value)
                      }
                      placeholder="Phone"
                      className="rounded-xl border border-outline-strong bg-white px-3 py-2.5 text-xs outline-none focus:border-secondary"
                    />
                  </div>
                  <input
                    type="text"
                    value={editValues.address}
                    onChange={(event) =>
                      updateEditValue("address", event.target.value)
                    }
                    placeholder="Street"
                    className="rounded-xl border border-outline-strong bg-white px-3 py-2.5 text-xs outline-none focus:border-secondary"
                  />
                  <input
                    type="text"
                    value={editValues.apartment}
                    onChange={(event) =>
                      updateEditValue("apartment", event.target.value)
                    }
                    placeholder="Apartment, suite, unit (optional)"
                    className="rounded-xl border border-outline-strong bg-white px-3 py-2.5 text-xs outline-none focus:border-secondary"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      value={editValues.city}
                      onChange={(event) =>
                        updateEditValue("city", event.target.value)
                      }
                      placeholder="City"
                      className="rounded-xl border border-outline-strong bg-white px-3 py-2.5 text-xs outline-none focus:border-secondary"
                    />
                    <input
                      type="text"
                      value={editValues.state}
                      onChange={(event) =>
                        updateEditValue("state", event.target.value)
                      }
                      placeholder="State"
                      className="rounded-xl border border-outline-strong bg-white px-3 py-2.5 text-xs outline-none focus:border-secondary"
                    />
                    <input
                      type="text"
                      value={editValues.zip}
                      onChange={(event) =>
                        updateEditValue("zip", event.target.value)
                      }
                      placeholder="ZIP"
                      className="rounded-xl border border-outline-strong bg-white px-3 py-2.5 text-xs outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-charcoal-text mb-1">
                      Country
                    </label>
                    <CountryDropdown
                      value={editValues.country || "United States"}
                      onChange={(c) => updateEditValue("country", c)}
                      dropUp={true}
                    />
                  </div>

                  {editError ? (
                    <p className="text-xs font-semibold text-rose-600">
                      {editError}
                    </p>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setEditValues(null);
                        setEditError("");
                      }}
                      className="rounded-full border border-outline-strong bg-white px-4 py-2 text-xs font-bold text-charcoal-text hover:bg-surface-soft cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingEdit}
                      onClick={() => submitEdit(addr)}
                      className="rounded-full bg-secondary px-5 py-2 text-xs font-bold text-white transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingEdit ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
