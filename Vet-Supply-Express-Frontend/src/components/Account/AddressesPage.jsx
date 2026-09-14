import React, { useContext, useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Star,
  Check,
  X,
  Home,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import AccountLayout from "./AccountLayout";
import { OrderContext } from "../../context/OrderContext";
import { AppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import CountryDropdown from "../Common/CountryDropdown";

const EMPTY_FORM = {
  id: null,
  fullName: "",
  phone: "",
  label: "Home",
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  isDefault: false,
};

const AddressesPage = () => {
  const { savedAddresses, saveAddress, deleteAddress, fetchAddresses } =
    useContext(OrderContext);
  const { addToast } = useContext(AppContext);
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const sync = async () => {
      if (fetchAddresses) {
        setIsRefreshing(true);
        try {
          await fetchAddresses();
        } catch (err) {
          console.warn("Addresses sync notice:", err);
        } finally {
          if (isMounted) setIsRefreshing(false);
        }
      }
    };
    sync();
    return () => {
      isMounted = false;
    };
  }, []);

  const openAdd = () => {
    setForm({
      ...EMPTY_FORM,
      fullName: user?.name || "",
      phone: user?.phone || "",
    });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setForm({
      id: addr.id || addr._id,
      fullName: addr.fullName || user?.name || "",
      phone: addr.phone || user?.phone || "",
      label: addr.label || "Home",
      street: addr.street || addr.addressLine1 || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "United States",
      isDefault: addr.isDefault || false,
    });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const name = form.fullName.trim();
    const phoneDigits = form.phone.replace(/\D/g, "");
    const street = form.street.trim();
    const city = form.city.trim();
    const state = form.state.trim();
    const zip = form.zip.trim();

    if (name.length < 2 || name.length > 50) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid full name (2 to 50 characters).",
        type: "error",
      });
      return;
    }
    if (!form.phone.trim() || phoneDigits.length !== 10) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid 10-digit phone number.",
        type: "error",
      });
      return;
    }
    if (street.length < 5 || street.length > 100) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid street address (5 to 100 characters).",
        type: "error",
      });
      return;
    }
    if (city.length < 2 || city.length > 50) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid city (2 to 50 characters).",
        type: "error",
      });
      return;
    }
    if (state.length < 2 || state.length > 50) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid state/province (2 to 50 characters).",
        type: "error",
      });
      return;
    }
    if (zip.length < 3 || zip.length > 10) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid ZIP/Postal code (3 to 10 characters).",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        fullName: name,
        phone: form.phone,
        street,
        city,
        state,
        zip,
        country: form.country || "United States",
      };
      await saveAddress(payload);
      setShowForm(false);
      addToast({
        title: form.id ? "Address Updated" : "Address Added",
        message: form.id
          ? "Your address has been updated."
          : "New delivery address saved.",
        type: "cart",
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Save address error:", err);
      addToast({
        title: "Error",
        message: "Failed to save address. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    try {
      await deleteAddress(id);
      setDeleteId(null);
      addToast({
        title: "Address Removed",
        message: "The address has been deleted.",
        type: "wishlist",
      });
    } catch (err) {
      console.error("Delete address failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountLayout
      title="Saved Addresses"
      subtitle="Manage your delivery addresses for faster checkout."
    >
      {/* Add button */}
      <div className="flex justify-end mb-5">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {/* Address Cards */}
      {savedAddresses.length === 0 && !showForm ? (
        <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm p-16 text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#EAF5FC] flex items-center justify-center">
            <MapPin className="w-10 h-10 text-[#9FB3C8]" />
          </div>
          <h3 className="font-heading font-black text-xl text-[#102A43]">
            No saved addresses
          </h3>
          <p className="text-sm text-[#627D98] max-w-xs">
            Add your delivery address to speed up checkout.
          </p>
          <button
            onClick={openAdd}
            className="mt-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedAddresses.map((addr, idx) => {
            const addrKey = addr.id || addr._id || idx;
            return (
              <div
                key={addrKey}
                className="bg-white rounded-2xl border border-[#D9E8F2] shadow-sm p-5 flex flex-col gap-3 relative"
              >
                <div className="text-sm text-[#627D98] leading-relaxed">
                  <p className="font-bold text-[#102A43]">{addr.fullName}</p>
                  <p>{addr.street}</p>
                  <p>
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                  <p>{addr.country}</p>
                  {addr.phone && <p className="mt-1 text-xs">{addr.phone}</p>}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openEdit(addr)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0874C9] hover:bg-[#EAF5FC] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(addr.id || addr._id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-[#D9E8F2] p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-[#102A43] text-lg">
                {form.id ? "Edit Address" : "New Address"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-[#F7FAFC] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-[#627D98]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">
                      Full Name *
                    </label>
                    <span className="text-[10px] text-[#9FB3C8] font-semibold">Min 2, Max 50</span>
                  </div>
                  <input
                    type="text"
                    minLength={2}
                    maxLength={50}
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    placeholder="John Smith"
                    className={`w-full bg-[#F7FAFC] border ${
                      form.fullName.trim().length > 0 &&
                      (form.fullName.trim().length < 2 || form.fullName.trim().length > 50)
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                  />
                  {form.fullName.trim().length > 0 &&
                    (form.fullName.trim().length < 2 || form.fullName.trim().length > 50) && (
                      <span className="text-xs font-bold text-red-500 mt-1 block">
                        Full name must be 2-50 chars.
                      </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">
                      Phone Number *
                    </label>
                    <span className="text-[10px] text-[#9FB3C8] font-semibold">Exact 10 digits</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="10 digit phone"
                    className={`w-full bg-[#F7FAFC] border ${
                      form.phone.trim().length > 0 &&
                      form.phone.replace(/\D/g, "").length !== 10
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                  />
                  {form.phone.trim().length > 0 &&
                    form.phone.replace(/\D/g, "").length !== 10 && (
                      <span className="text-xs font-bold text-red-500 mt-1 block">
                        Phone must be 10 digits.
                      </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">
                    Street Address *
                  </label>
                  <span className="text-[10px] text-[#9FB3C8] font-semibold">Min 5, Max 100 chars</span>
                </div>
                <input
                  type="text"
                  minLength={5}
                  maxLength={100}
                  value={form.street}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, street: e.target.value }))
                  }
                  placeholder="123 Wellness Way, Suite 400"
                  className={`w-full bg-[#F7FAFC] border ${
                    form.street.trim().length > 0 &&
                    (form.street.trim().length < 5 || form.street.trim().length > 100)
                      ? "border-red-400 focus:border-red-500"
                      : "border-[#D9E8F2] focus:border-[#0874C9]"
                  } rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                />
                {form.street.trim().length > 0 &&
                  (form.street.trim().length < 5 || form.street.trim().length > 100) && (
                    <span className="text-xs font-bold text-red-500 mt-1 block">
                      Address must be between 5 and 100 characters.
                    </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">
                      City *
                    </label>
                    <span className="text-[10px] text-[#9FB3C8] font-semibold">Min 2, Max 50</span>
                  </div>
                  <input
                    type="text"
                    minLength={2}
                    maxLength={50}
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    placeholder="e.g. Austin"
                    className={`w-full bg-[#F7FAFC] border ${
                      form.city.trim().length > 0 &&
                      (form.city.trim().length < 2 || form.city.trim().length > 50)
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                  />
                  {form.city.trim().length > 0 &&
                    (form.city.trim().length < 2 || form.city.trim().length > 50) && (
                      <span className="text-xs font-bold text-red-500 mt-1 block">
                        City must be 2-50 chars.
                      </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">
                      State / Province *
                    </label>
                    <span className="text-[10px] text-[#9FB3C8] font-semibold">Min 2, Max 50</span>
                  </div>
                  <input
                    type="text"
                    minLength={2}
                    maxLength={50}
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    placeholder="e.g. TX"
                    className={`w-full bg-[#F7FAFC] border ${
                      form.state.trim().length > 0 &&
                      (form.state.trim().length < 2 || form.state.trim().length > 50)
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                  />
                  {form.state.trim().length > 0 &&
                    (form.state.trim().length < 2 || form.state.trim().length > 50) && (
                      <span className="text-xs font-bold text-red-500 mt-1 block">
                        State must be 2-50 chars.
                      </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">
                      ZIP / Postal Code *
                    </label>
                    <span className="text-[10px] text-[#9FB3C8] font-semibold">Min 3, Max 10</span>
                  </div>
                  <input
                    type="text"
                    minLength={3}
                    maxLength={10}
                    value={form.zip}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, zip: e.target.value }))
                    }
                    placeholder="e.g. 78701"
                    className={`w-full bg-[#F7FAFC] border ${
                      form.zip.trim().length > 0 &&
                      (form.zip.trim().length < 3 || form.zip.trim().length > 10)
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                  />
                  {form.zip.trim().length > 0 &&
                    (form.zip.trim().length < 3 || form.zip.trim().length > 10) && (
                      <span className="text-xs font-bold text-red-500 mt-1 block">
                        ZIP must be 3-10 chars.
                      </span>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] block mb-1">
                    Country *
                  </label>
                  <CountryDropdown
                    value={form.country || "United States"}
                    dropUp={true}
                    onChange={(c) => setForm((f) => ({ ...f, country: c }))}
                    className="w-full bg-[#F7FAFC] border border-[#D9E8F2] focus:border-[#0874C9] rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all cursor-pointer flex items-center justify-between"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowForm(false)}
                disabled={isSubmitting}
                className="flex-1 border border-[#D9E8F2] text-[#627D98] hover:text-[#102A43] font-bold py-3 rounded-2xl transition-all cursor-pointer bg-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 bg-[#0874C9] hover:bg-[#0B2D4F] text-white font-bold py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                <span>{isSubmitting ? "Saving..." : "Save Address"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm"
            onClick={() => !isSubmitting && setDeleteId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-[#D9E8F2] p-8 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="font-heading font-black text-xl text-[#102A43]">
              Delete Address?
            </h3>
            <p className="text-sm text-[#627D98]">
              This address will be permanently removed from your account.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isSubmitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                <span>{isSubmitting ? "Deleting..." : "Delete"}</span>
              </button>
              <button
                onClick={() => setDeleteId(null)}
                disabled={isSubmitting}
                className="flex-1 border border-[#D9E8F2] text-[#627D98] font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default AddressesPage;
