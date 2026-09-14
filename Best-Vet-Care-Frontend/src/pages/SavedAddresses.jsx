import { useEffect, useState } from "react";
import AccountLayout from "../components/account/AccountLayout";
import { accountApi } from "../api/accountApi";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";
import CountryDropdown from "../components/common/CountryDropdown";
import AddressAssist from "../components/address/AddressAssist";
import { trimFormValues } from "../utils/phoneValidation";

const DEFAULT_COUNTRY = "United States";

const INPUT_FIELDS = [
  { key: "name", labelName: "Full Name", hint: "Min 2, Max 50 chars", minLength: 2, maxLength: 50 },
  { key: "phone", labelName: "Phone Number", hint: "Exact 10 digits", minLength: 10, maxLength: 10 },
  { key: "address", labelName: "Street Address", hint: "Min 5, Max 100 chars", minLength: 5, maxLength: 100 },
  { key: "area", labelName: "Area / Locality", hint: "Optional", maxLength: 80, optional: true },
  { key: "landmark", labelName: "Landmark", hint: "Optional", maxLength: 80, optional: true },
  { key: "city", labelName: "City", hint: "Min 2, Max 50", minLength: 2, maxLength: 50 },
  { key: "state", labelName: "State", hint: "Min 2, Max 50", minLength: 2, maxLength: 50 },
  { key: "postalCode", labelName: "Postal Code", hint: "Min 3, Max 10", minLength: 3, maxLength: 10 },
];

const emptyForm = {
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

const validateAddressForm = (form) => {
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

const SavedAddresses = () => {
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    accountApi
      .getAddresses()
      .then(setAddresses)
      .catch((error) => showToast(error.response?.data?.message || "Could not load addresses", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const handleCountryChange = (country) => {
    setForm((current) => ({ ...current, country }));
    if (errors.country) {
      setErrors((current) => {
        const next = { ...current };
        delete next.country;
        return next;
      });
    }
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

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setEditingIndex(null);
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    const nextForm = trimFormValues(form);
    const formErrors = validateAddressForm(nextForm);

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      showToast("Please fix errors before saving address", "warning");
      return;
    }

    try {
      const nextAddresses =
        editingIndex === null
          ? await accountApi.addAddress(nextForm)
          : await accountApi.updateAddress(editingIndex, nextForm);
      setAddresses(nextAddresses);
      resetForm();
      showToast(editingIndex === null ? "Address added" : "Address updated");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not save address", "error");
    }
  };

  const editAddress = (address) => {
    setEditingIndex(address.index);
    setForm({
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
    setErrors({});
  };

  const requestRemoveAddress = (address) => {
    setRemoveTarget(address);
  };

  const removeAddress = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const nextAddresses = await accountApi.removeAddress(removeTarget.index);
      setAddresses(nextAddresses);
      if (editingIndex === removeTarget.index) resetForm();
      setRemoveTarget(null);
      showToast("Address removed");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not remove address", "error");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <AccountLayout title="Saved Addresses" description="Add and manage addresses used during checkout.">
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="min-w-0 rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
          <div className="border-b border-[#17345f1a] px-5 py-4">
            <h2 className="text-lg font-extrabold text-[#122a50]">Your Addresses</h2>
          </div>
          {loading ? (
            <div className="p-8 text-sm font-bold text-[#122a50b2]">Loading addresses...</div>
          ) : addresses.length ? (
            <div className="grid min-w-0 gap-4 p-5 md:grid-cols-2">
              {addresses.map((address) => (
                <article key={address.index} className="min-w-0 rounded-2xl border border-[#17345f1a] bg-[#fffdf7] p-4">
                  <h3 className="break-words font-extrabold text-[#122a50]">{address.name || address.fullName || "Saved Address"}</h3>
                  {address.phone && <p className="mt-2 break-words text-sm font-bold text-[#17345f] [overflow-wrap:anywhere]">{address.phone}</p>}
                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#122a50b2] [overflow-wrap:anywhere]">
                    {address.address || address.line1}
                    {address.area ? `, ${address.area}` : ""}
                    {address.landmark ? `, ${address.landmark}` : ""}
                    {address.city ? `, ${address.city}` : ""}
                    {address.state ? `, ${address.state}` : ""}
                    {address.postalCode || address.zip ? ` ${address.postalCode || address.zip}` : ""}
                    {address.country ? `, ${address.country}` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => editAddress(address)} className="rounded-lg border border-[#17345f] px-4 py-2 text-sm font-extrabold text-[#17345f] hover:bg-[#f8f1df]">
                      Edit
                    </button>
                    <button type="button" onClick={() => requestRemoveAddress(address)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-extrabold text-red-600 hover:bg-red-50">
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm font-semibold text-[#122a50b2]">No saved addresses yet.</div>
          )}
        </div>

        <form onSubmit={saveAddress} className="min-w-0 rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#122a50]">{editingIndex === null ? "Add Address" : "Edit Address"}</h2>
          <div className="mt-4 space-y-3">
            <AddressAssist onAddressSelect={applyGoogleAddress} />
            {INPUT_FIELDS.map(({ key, labelName, hint, maxLength }) => (
              <label key={key} className="block text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50b2]">
                    {labelName}{["area", "landmark"].includes(key) ? "" : " *"}
                  </span>
                  {hint && <span className="text-[10px] font-semibold text-[#122a50]/50">{hint}</span>}
                </div>
                <input
                    name={key}
                    value={form[key]}
                    maxLength={maxLength}
                    onChange={updateField}
                    aria-invalid={Boolean(errors[key])}
                    className={`mt-1 h-11 w-full rounded-lg border px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d] ${
                      errors[key] ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                    }`}
                  />
                {errors[key] && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {errors[key]}
                  </p>
                )}
              </label>
            ))}

            <div className="block text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold uppercase text-[#122a50b2]">Country *</span>
              </div>
              <CountryDropdown
                value={form.country}
                dropUp={true}
                onChange={handleCountryChange}
              />
              {errors.country && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errors.country}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" className="rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d] cursor-pointer">
              {editingIndex === null ? "Save Address" : "Update Address"}
            </button>
            {editingIndex !== null && (
              <button type="button" onClick={resetForm} className="rounded-lg border border-[#17345f1a] px-5 py-3 text-sm font-extrabold text-[#17345f] hover:bg-[#f8f1df] cursor-pointer">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      <ConfirmModal
        open={Boolean(removeTarget)}
        title="Remove address?"
        message={`Do you want to remove ${removeTarget?.name || "this address"}?`}
        confirmLabel="OK"
        loading={removing}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={removeAddress}
      />
    </AccountLayout>
  );
};

export default SavedAddresses;
