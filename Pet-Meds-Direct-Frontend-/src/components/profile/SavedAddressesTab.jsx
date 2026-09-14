import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAddressesApi,
  addAddressApi,
  updateAddressApi,
  removeAddressApi,
} from "../../helper/axiosInstance";
import { Plus, Trash2, Phone, MapPin, ArrowLeft, Pencil } from "lucide-react";
import { showToast } from "../common/toast/ToastHelper";
import CountryDropdown from "../common/CountryDropdown";

const emptyForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
};

export default function SavedAddressesTab() {
  const { isLoggedIn, user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const fetchAddresses = async () => {
    setLoading(true);
    if (isLoggedIn) {
      try {
        const res = await getAddressesApi();
        if (res && res.success && Array.isArray(res.data)) {
          const apiAddresses = res.data.map((addr, idx) => ({
            id: addr._id || addr.id || String(idx),
            _id: addr._id || addr.id,
            fullName: addr.fullName || user?.name || "Customer",
            phone: addr.phone || user?.phone || "",
            addressLine1: addr.addressLine1 || addr.address || "",
            city: addr.city || "",
            state: addr.state || "",
            zip: addr.zip || addr.zipCode || "",
            country: addr.country || "United States",
          }));
          setAddresses(apiAddresses);
        } else {
          setAddresses([]);
        }
      } catch (err) {
        console.error("Failed to load saved addresses from API:", err);
        setAddresses([]);
      }
    } else {
      setAddresses([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, [isLoggedIn]);

  const handleDelete = async (id) => {
    if (isLoggedIn) {
      try {
        await removeAddressApi(id);
        showToast.success("Address deleted successfully!");
        fetchAddresses();
      } catch (err) {
        console.warn("Primary address delete error, trying index fallback:", err);
        const targetIndex = addresses.findIndex(
          (a) => String(a.id) === String(id) || String(a._id) === String(id)
        );
        if (targetIndex >= 0) {
          try {
            await removeAddressApi(targetIndex);
            showToast.success("Address deleted successfully!");
            fetchAddresses();
            return;
          } catch (fallbackErr) {
            console.error("Fallback delete also failed:", fallbackErr);
          }
        }
        showToast.error(err || "Failed to delete address.");
      }
    } else {
      setAddresses(addresses.filter((a) => String(a.id) !== String(id) && String(a._id) !== String(id)));
      showToast.success("Address deleted successfully!");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (addr) => {
    setFormData({
      fullName: addr.fullName || user?.name || "",
      phone: addr.phone || user?.phone || "",
      addressLine1: addr.addressLine1 || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "United States",
    });
    setEditingId(addr.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = String(formData.fullName || "").trim();
    const phoneDigits = String(formData.phone || "").replace(/\D/g, "");
    const addr = String(formData.addressLine1 || "").trim();
    const city = String(formData.city || "").trim();
    const state = String(formData.state || "").trim();
    const zip = String(formData.zip || "").trim();

    if (name.length < 2 || name.length > 50) {
      showToast.error("Please enter a valid full name (2 to 50 characters).");
      return;
    }
    if (!formData.phone || phoneDigits.length !== 10) {
      showToast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (addr.length < 5 || addr.length > 100) {
      showToast.error("Please enter a valid street address (5 to 100 characters).");
      return;
    }
    if (city.length < 2 || city.length > 50) {
      showToast.error("Please enter a valid city name (2 to 50 characters).");
      return;
    }
    if (state.length < 2 || state.length > 50) {
      showToast.error("Please enter a valid state/province (2 to 50 characters).");
      return;
    }
    if (zip.length < 3 || zip.length > 10) {
      showToast.error("Please enter a valid ZIP/Postal code (3 to 10 characters).");
      return;
    }

    const payload = {
      fullName: name,
      phone: formData.phone,
      addressLine1: addr,
      city,
      state,
      zip,
      country: formData.country || "United States",
    };

    if (isLoggedIn) {
      try {
        if (editingId !== null) {
          await updateAddressApi(editingId, payload);
          showToast.success("Address updated successfully!");
        } else {
          await addAddressApi(payload);
          showToast.success("Address added successfully!");
        }
        fetchAddresses();
      } catch (err) {
        console.error("Failed to save address via API:", err);
        showToast.error(err || "Failed to save address.");
      }
    } else {
      if (editingId !== null) {
        setAddresses(
          addresses.map((a, idx) =>
            idx === editingId
              ? {
                  id: idx,
                  ...payload,
                }
              : a
          )
        );
        showToast.success("Address updated successfully!");
      } else {
        const newAddress = {
          id: addresses.length,
          ...payload,
        };
        setAddresses([...addresses, newAddress]);
        showToast.success("Address added successfully!");
      }
    }
    setFormData({ ...emptyForm });
    setEditingId(null);
    setIsAdding(false);
  };

  const openForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setIsAdding(true);
  };

  const cancelForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setIsAdding(false);
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="py-12 flex justify-center items-center text-sm font-semibold text-slate-500">
        Loading saved addresses...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {isAdding ? (
        <div className="rounded-2xl border border-[#e8eef3] bg-white p-6 sm:p-8 text-left">
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-[#e8eef3]">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
                {editingId !== null ? "Edit Address" : "Add New Address"}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-deep-navy/50 mt-1.5">
                {editingId !== null ? "Update the details for this address" : "Fill in the details for your new address"}
              </p>
            </div>
            <button
              onClick={cancelForm}
              className="inline-flex items-center gap-2 rounded-xl border border-deep-navy/12 px-5 py-3 text-sm font-black text-deep-navy hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50">
                    Full Name
                  </label>
                  <span className="text-[10px] text-deep-navy/40 font-bold">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  name="fullName"
                  minLength={2}
                  maxLength={50}
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Smith"
                  required
                  className={`w-full rounded-xl border ${
                    formData.fullName.trim().length > 0 &&
                    (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 50)
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#e0e5ec] focus:border-primary-green"
                  } bg-white px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all placeholder:text-deep-navy/30`}
                />
                {formData.fullName.trim().length > 0 &&
                  (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 50) && (
                    <span className="text-xs font-bold text-red-500 mt-1 block">
                      Full name must be between 2 and 50 characters.
                    </span>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50">
                    Phone Number
                  </label>
                  <span className="text-[10px] text-deep-navy/40 font-bold">Exact 10 digits</span>
                </div>
                <input
                  type="tel"
                  name="phone"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10 digit phone number"
                  required
                  className={`w-full rounded-xl border ${
                    formData.phone.trim().length > 0 &&
                    formData.phone.replace(/\D/g, "").length !== 10
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#e0e5ec] focus:border-primary-green"
                  } bg-white px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all placeholder:text-deep-navy/30`}
                />
                {formData.phone.trim().length > 0 &&
                  formData.phone.replace(/\D/g, "").length !== 10 && (
                    <span className="text-xs font-bold text-red-500 mt-1 block">
                      Phone number must be exactly 10 digits.
                    </span>
                )}
              </div>
            </div>

            {/* Street Address */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50">
                  Street Address
                </label>
                <span className="text-[10px] text-deep-navy/40 font-bold">Min 5, Max 100 chars</span>
              </div>
              <input
                type="text"
                name="addressLine1"
                minLength={5}
                maxLength={100}
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="123 Main Street, Apt 4B"
                required
                className={`w-full rounded-xl border ${
                  formData.addressLine1.trim().length > 0 &&
                  (formData.addressLine1.trim().length < 5 || formData.addressLine1.trim().length > 100)
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#e0e5ec] focus:border-primary-green"
                } bg-white px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all placeholder:text-deep-navy/30`}
              />
              {formData.addressLine1.trim().length > 0 &&
                (formData.addressLine1.trim().length < 5 || formData.addressLine1.trim().length > 100) && (
                  <span className="text-xs font-bold text-red-500 mt-1 block">
                    Address must be between 5 and 100 characters.
                  </span>
              )}
            </div>

            {/* City & State */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50">
                    City
                  </label>
                  <span className="text-[10px] text-deep-navy/40 font-bold">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  name="city"
                  minLength={2}
                  maxLength={50}
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Austin"
                  required
                  className={`w-full rounded-xl border ${
                    formData.city.trim().length > 0 &&
                    (formData.city.trim().length < 2 || formData.city.trim().length > 50)
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#e0e5ec] focus:border-primary-green"
                  } bg-white px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all placeholder:text-deep-navy/30`}
                />
                {formData.city.trim().length > 0 &&
                  (formData.city.trim().length < 2 || formData.city.trim().length > 50) && (
                    <span className="text-xs font-bold text-red-500 mt-1 block">
                      City must be between 2 and 50 characters.
                    </span>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50">
                    State / Province
                  </label>
                  <span className="text-[10px] text-deep-navy/40 font-bold">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  name="state"
                  minLength={2}
                  maxLength={50}
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. TX"
                  required
                  className={`w-full rounded-xl border ${
                    formData.state.trim().length > 0 &&
                    (formData.state.trim().length < 2 || formData.state.trim().length > 50)
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#e0e5ec] focus:border-primary-green"
                  } bg-white px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all placeholder:text-deep-navy/30`}
                />
                {formData.state.trim().length > 0 &&
                  (formData.state.trim().length < 2 || formData.state.trim().length > 50) && (
                    <span className="text-xs font-bold text-red-500 mt-1 block">
                      State must be between 2 and 50 characters.
                    </span>
                )}
              </div>
            </div>

            {/* ZIP Code & Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50">
                    ZIP / Postal Code
                  </label>
                  <span className="text-[10px] text-deep-navy/40 font-bold">Min 3, Max 10 chars</span>
                </div>
                <input
                  type="text"
                  name="zip"
                  minLength={3}
                  maxLength={10}
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="e.g. 78701"
                  required
                  className={`w-full rounded-xl border ${
                    formData.zip.trim().length > 0 &&
                    (formData.zip.trim().length < 3 || formData.zip.trim().length > 10)
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#e0e5ec] focus:border-primary-green"
                  } bg-white px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all placeholder:text-deep-navy/30`}
                />
                {formData.zip.trim().length > 0 &&
                  (formData.zip.trim().length < 3 || formData.zip.trim().length > 10) && (
                    <span className="text-xs font-bold text-red-500 mt-1 block">
                      ZIP code must be between 3 and 10 characters.
                    </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50 mb-2">
                  Country
                </label>
                <CountryDropdown
                  value={formData.country || "United States"}
                  dropUp={true}
                  onChange={(c) => setFormData((prev) => ({ ...prev, country: c }))}
                  className="w-full px-4 py-3.5 bg-white border border-[#e0e5ec] focus:border-primary-green rounded-xl text-base font-bold text-deep-navy flex items-center justify-between outline-none transition-all cursor-pointer select-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[#e8eef3] pt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-xl border border-deep-navy/12 px-7 py-3 text-sm font-black text-deep-navy hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary-green px-7 py-3 text-sm font-black text-white hover:bg-dark-green transition-colors cursor-pointer"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3 text-left">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
                Saved Addresses
              </h2>
              <p className="text-sm sm:text-base font-semibold text-deep-navy/50 mt-1.5">
                Manage your shipping and billing destinations
              </p>
            </div>
            <button
              onClick={openForm}
              className="inline-flex items-center gap-2 rounded-xl bg-deep-navy px-6 py-3 text-sm font-black text-white hover:bg-deep-navy/90 transition-colors cursor-pointer self-start"
            >
              <Plus className="h-4 w-4" />
              Add New
            </button>
          </div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
            {addresses.length === 0 ? (
              <div className="col-span-full py-12 text-center text-sm font-semibold text-slate-400">
                No saved addresses found. Add one above!
              </div>
            ) : (
              addresses.map((addr, idx) => (
                <div
                  key={addr.id}
                  className="rounded-2xl border border-[#e8eef3] bg-white p-6 transition-all hover:shadow-md hover:-translate-y-0.5 relative group text-left"
                >
                  {/* Type Badge + Actions */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center rounded-lg px-3.5 py-1.5 text-[11px] font-black text-white uppercase tracking-wider bg-primary-green">
                      HOME
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(addr)}
                        className="opacity-0 group-hover:opacity-100 grid h-9 w-9 place-items-center rounded-lg text-deep-navy/30 hover:text-primary-green hover:bg-soft-mint transition-all cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="opacity-0 group-hover:opacity-100 grid h-9 w-9 place-items-center rounded-lg text-deep-navy/30 hover:text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-black text-deep-navy mb-3">
                    {addr.fullName}
                  </h3>

                  {/* Address */}
                  <div className="flex items-start gap-2.5 mb-1">
                    <MapPin className="h-4 w-4 text-deep-navy/30 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-deep-navy/60 leading-relaxed">
                        {addr.addressLine1}
                      </p>
                      <p className="text-sm font-semibold text-deep-navy/60">
                        {addr.country}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-[#e8eef3]">
                    <Phone className="h-4 w-4 text-deep-navy/30" />
                    <span className="text-sm font-bold text-deep-navy/60">
                      {addr.phone}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
