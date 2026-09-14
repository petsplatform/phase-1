import { useState } from "react";
import AccountSidebar from "../../components/account/AccountSidebar";
import { useAuth } from "../../context/AuthContext";
import CountryDropdown from "../../components/common/CountryDropdown";
import { MapPin, Trash2, Plus, Check, Pencil, Loader2 } from "lucide-react";

const emptyAddress = (phone = "", name = "") => ({
  fullName: name,
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  phone,
  deliveryInstructions: "",
});

export default function Addresses() {
  const { user, saveAddress, updateAddress, deleteAddress } = useAuth();

  const activeUser = user || {
    firstName: "Guest",
    lastName: "Pet Parent",
    email: "guest@pawsandcare.com",
    mobile: "9876543210",
    addresses: [],
  };

  const [isEditingForm, setIsEditingForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [addressForm, setAddressForm] = useState(() => emptyAddress(activeUser.mobile || "", activeUser.name || activeUser.firstName || ""));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);

  const resetForm = () => {
    setIsEditingForm(false);
    setEditingIndex(null);
    setAddressForm(emptyAddress(activeUser.mobile || "", activeUser.name || activeUser.firstName || ""));
    setErrors({});
    setSubmitError("");
  };

  const updateField = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSubmitError("");
    setMessage("");
  };

  const startAdd = () => {
    setMessage("");
    setSubmitError("");
    setEditingIndex(null);
    setAddressForm(emptyAddress(activeUser.mobile || "", activeUser.name || activeUser.firstName || ""));
    setErrors({});
    setIsEditingForm(true);
  };

  const startEdit = (address, fallbackIndex) => {
    setMessage("");
    setSubmitError("");
    setEditingIndex(Number.isInteger(address.index) ? address.index : fallbackIndex);
    setAddressForm({
      ...emptyAddress(activeUser.mobile || "", activeUser.name || activeUser.firstName || ""),
      ...address,
      phone: address.phone || activeUser.mobile || "",
      fullName: address.fullName || activeUser.name || activeUser.firstName || "",
    });
    setErrors({});
    setIsEditingForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitError("");

    const eObj = {};
    const name = (addressForm.fullName || "").trim();
    const phoneDigits = (addressForm.phone || "").replace(/\D/g, "");
    const street = (addressForm.streetAddress || "").trim();
    const city = (addressForm.city || "").trim();
    const state = (addressForm.state || "").trim();
    const zip = (addressForm.postalCode || "").trim();

    if (!name) {
      eObj.fullName = "Full name is required";
    } else if (name.length < 2 || name.length > 50) {
      eObj.fullName = "Full name must be between 2 and 50 characters";
    }
    if (!addressForm.phone || !addressForm.phone.trim()) {
      eObj.phone = "Phone number is required";
    } else if (phoneDigits.length !== 10) {
      eObj.phone = "Phone number must be exactly 10 digits";
    }
    if (!street) {
      eObj.streetAddress = "Street address is required";
    } else if (street.length < 5 || street.length > 100) {
      eObj.streetAddress = "Street address must be between 5 and 100 characters";
    }
    if (!city) {
      eObj.city = "City is required";
    } else if (city.length < 2 || city.length > 50) {
      eObj.city = "City must be between 2 and 50 characters";
    }
    if (!state) {
      eObj.state = "State is required";
    } else if (state.length < 2 || state.length > 50) {
      eObj.state = "State must be between 2 and 50 characters";
    }
    if (!zip) {
      eObj.postalCode = "ZIP Code is required";
    } else if (zip.length < 3 || zip.length > 10) {
      eObj.postalCode = "ZIP/Postal code must be between 3 and 10 characters";
    }

    if (Object.keys(eObj).length > 0) {
      setErrors(eObj);
      setSubmitError("Please fill out all required address fields correctly.");
      return;
    }

    const payload = {
      ...addressForm,
      fullName: name,
      phone: addressForm.phone,
    };

    setIsSubmitting(true);
    try {
      if (editingIndex === null) {
        await saveAddress(payload);
        setMessage("Address saved successfully.");
      } else {
        await updateAddress(editingIndex, payload);
        setMessage("Address updated successfully.");
      }
      resetForm();
    } catch (error) {
      setSubmitError(error?.message || "Address could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (index) => {
    setMessage("");
    setSubmitError("");
    setDeletingIndex(index);
    try {
      await deleteAddress(index);
      setMessage("Address deleted successfully.");
    } catch (error) {
      setSubmitError(error?.message || "Address could not be deleted. Please try again.");
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 text-left">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AccountSidebar />

          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3 flex-wrap gap-4">
              <div className="space-y-1">
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-brand-text">
                  Saved Addresses
                </h1>
                <p className="font-sans text-xs sm:text-sm text-brand-muted">
                  Manage your delivery destinations for faster secure checkout
                  steps.
                </p>
              </div>

              {!isEditingForm && (
                <button
                  type="button"
                  onClick={startAdd}
                  className="inline-flex items-center gap-1 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-5 py-2.5 font-heading font-bold text-xs transition-colors shadow-xs hover:shadow cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Address</span>
                </button>
              )}
            </div>

            {message && (
              <div className="bg-brand-teal/10 border border-brand-teal/20 text-brand-teal rounded-2xl p-4 flex gap-2 text-xs font-heading font-bold max-w-2xl">
                <Check size={16} />
                <span>{message}</span>
              </div>
            )}

            {submitError && (
              <div className="bg-brand-coral/10 border border-brand-coral/20 text-brand-coral rounded-2xl p-4 text-xs font-heading font-bold max-w-2xl">
                {submitError}
              </div>
            )}

            {isEditingForm ? (
              <div className="bg-brand-surface border border-brand-border/60 p-6 sm:p-8 rounded-[2rem] shadow-sm max-w-2xl">
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <h3 className="font-heading font-black text-lg text-brand-text border-b border-brand-border/40 pb-2">
                    {editingIndex === null ? "Add New Address" : "Edit Address"}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          Full Name *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Min 2, Max 50 chars</span>
                      </div>
                      <input
                        type="text"
                        minLength={2}
                        maxLength={50}
                        value={addressForm.fullName}
                        onChange={(e) => updateField("fullName", e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          errors.fullName || ((addressForm.fullName || "").trim().length > 0 && ((addressForm.fullName || "").trim().length < 2 || (addressForm.fullName || "").trim().length > 50))
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all disabled:opacity-70`}
                        placeholder="John Smith"
                      />
                      {(errors.fullName || ((addressForm.fullName || "").trim().length > 0 && ((addressForm.fullName || "").trim().length < 2 || (addressForm.fullName || "").trim().length > 50))) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {errors.fullName || "Full name must be between 2 and 50 characters."}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          Phone Number *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Exact 10 digits</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={addressForm.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          errors.phone || ((addressForm.phone || "").trim().length > 0 && (addressForm.phone || "").replace(/\D/g, "").length !== 10)
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all disabled:opacity-70`}
                        placeholder="10 digit phone number"
                      />
                      {(errors.phone || ((addressForm.phone || "").trim().length > 0 && (addressForm.phone || "").replace(/\D/g, "").length !== 10)) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {errors.phone || "Phone number must be exactly 10 digits."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          Street Address *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Min 5, Max 100 chars</span>
                      </div>
                      <input
                        type="text"
                        minLength={5}
                        maxLength={100}
                        value={addressForm.streetAddress}
                        onChange={(e) => updateField("streetAddress", e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          errors.streetAddress || ((addressForm.streetAddress || "").trim().length > 0 && ((addressForm.streetAddress || "").trim().length < 5 || (addressForm.streetAddress || "").trim().length > 100))
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all disabled:opacity-70`}
                        placeholder="123 Paw Street"
                      />
                      {(errors.streetAddress || ((addressForm.streetAddress || "").trim().length > 0 && ((addressForm.streetAddress || "").trim().length < 5 || (addressForm.streetAddress || "").trim().length > 100))) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {errors.streetAddress || "Street address must be between 5 and 100 characters."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          City *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Min 2, Max 50</span>
                      </div>
                      <input
                        type="text"
                        minLength={2}
                        maxLength={50}
                        value={addressForm.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          errors.city || ((addressForm.city || "").trim().length > 0 && ((addressForm.city || "").trim().length < 2 || (addressForm.city || "").trim().length > 50))
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all disabled:opacity-70`}
                        placeholder="Austin"
                      />
                      {(errors.city || ((addressForm.city || "").trim().length > 0 && ((addressForm.city || "").trim().length < 2 || (addressForm.city || "").trim().length > 50))) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {errors.city || "City must be 2-50 chars."}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          State *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Min 2, Max 50</span>
                      </div>
                      <input
                        type="text"
                        minLength={2}
                        maxLength={50}
                        value={addressForm.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          errors.state || ((addressForm.state || "").trim().length > 0 && ((addressForm.state || "").trim().length < 2 || (addressForm.state || "").trim().length > 50))
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all disabled:opacity-70`}
                        placeholder="TX"
                      />
                      {(errors.state || ((addressForm.state || "").trim().length > 0 && ((addressForm.state || "").trim().length < 2 || (addressForm.state || "").trim().length > 50))) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {errors.state || "State must be 2-50 chars."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                          ZIP Code *
                        </label>
                        <span className="text-[10px] text-brand-muted font-semibold">Min 3, Max 10</span>
                      </div>
                      <input
                        type="text"
                        minLength={3}
                        maxLength={10}
                        value={addressForm.postalCode}
                        onChange={(e) => updateField("postalCode", e.target.value)}
                        disabled={isSubmitting}
                        className={`w-full px-4 py-2.5 rounded-xl border ${
                          errors.postalCode || ((addressForm.postalCode || "").trim().length > 0 && ((addressForm.postalCode || "").trim().length < 3 || (addressForm.postalCode || "").trim().length > 10))
                            ? "border-brand-coral focus:border-brand-coral bg-brand-coral/5"
                            : "border-brand-border bg-brand-bg/10 focus:border-brand-teal focus:bg-white"
                        } focus:outline-none text-sm transition-all disabled:opacity-70`}
                        placeholder="78701"
                      />
                      {(errors.postalCode || ((addressForm.postalCode || "").trim().length > 0 && ((addressForm.postalCode || "").trim().length < 3 || (addressForm.postalCode || "").trim().length > 10))) && (
                        <p className="text-[10px] text-brand-coral font-bold pl-1">
                          {errors.postalCode || "ZIP must be 3-10 chars."}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                        Country *
                      </label>
                      <CountryDropdown
                        value={addressForm.country || "United States"}
                        onChange={(c) => updateField("country", c)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand-teal text-sm transition-all cursor-pointer flex items-center justify-between text-brand-text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-brand-border/40">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-deep-teal disabled:bg-brand-muted/60 disabled:cursor-not-allowed text-white rounded-full font-heading font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                      {isSubmitting
                        ? "Saving..."
                        : editingIndex === null
                          ? "Save Address"
                          : "Update Address"}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={resetForm}
                      className="px-5 py-2.5 bg-brand-bg hover:bg-brand-peach text-brand-text font-heading font-bold text-xs rounded-full border border-brand-border transition-colors cursor-pointer disabled:opacity-70"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {activeUser.addresses && activeUser.addresses.length > 0 ? (
                  activeUser.addresses.map((address, idx) => (
                    <div
                      key={address.index ?? `${address.streetAddress}-${idx}`}
                      className="bg-white border border-brand-border/60 p-5 rounded-2xl shadow-xs space-y-3 relative group"
                    >
                      <div className="flex gap-2 items-start">
                        <div className="w-8 h-8 rounded-full bg-brand-teal/15 flex items-center justify-center text-brand-teal shrink-0">
                          <MapPin size={16} />
                        </div>
                        <div className="text-xs space-y-1 pr-16">
                          <strong className="block text-brand-text font-heading text-sm">
                            Delivery Destination
                          </strong>
                          <p className="font-sans text-brand-muted leading-relaxed">
                            {address.streetAddress}{" "}
                            {address.apartment && `, ${address.apartment}`}
                            <br />
                            {address.city}, {address.state} {address.postalCode}
                            <br />
                            {address.country}
                            {address.phone && (
                              <>
                                <br />
                                Phone: {address.phone}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(address, idx)}
                          className="text-brand-border hover:text-brand-teal transition-colors cursor-pointer"
                          aria-label="Edit address"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(Number.isInteger(address.index) ? address.index : idx)}
                          disabled={deletingIndex === (Number.isInteger(address.index) ? address.index : idx)}
                          className="text-brand-border hover:text-brand-coral transition-colors cursor-pointer disabled:opacity-60"
                          aria-label="Delete address"
                        >
                          {deletingIndex === (Number.isInteger(address.index) ? address.index : idx) ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sm:col-span-2 bg-white border border-brand-border/60 p-10 rounded-[2.5rem] text-center shadow-xs text-brand-muted text-sm">
                    <MapPin
                      size={32}
                      className="mx-auto mb-3 text-brand-border"
                    />
                    <h3 className="font-heading font-black text-brand-text text-base mb-1">
                      No Saved Addresses
                    </h3>
                    <p className="font-sans text-xs">
                      Add a default address to experience faster checkouts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
