import { Home, MapPin, Phone, User, X } from "lucide-react";
import { useState } from "react";
import CountryDropdown from "../common/CountryDropdown";

const initialForm = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  isDefault: false,
};

export default function AddressFormModal({ open, onClose, onSubmit, address }) {
  if (!open) return null;
  const formKey = address ? `edit-${address.id}` : "add";

  return (
    <AddressForm
      key={formKey}
      onClose={onClose}
      onSubmit={onSubmit}
      address={address}
    />
  );
}

function AddressForm({ onClose, onSubmit, address }) {
  const [form, setForm] = useState(() => {
    if (!address) return initialForm;
    const line2Parts = String(address.line2 || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      ...initialForm,
      ...address,
      country: address.country && address.country.length > 2 ? address.country : "United States",
      city: address.city || line2Parts[0] || "",
      state: address.state || line2Parts[1] || "",
      postalCode: address.postalCode || address.zip || line2Parts[2] || "",
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const isEditing = Boolean(address);

  const updateField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const name = (form.fullName || "").trim();
    const phoneDigits = (form.phone || "").replace(/\D/g, "");
    const street = (form.line1 || "").trim();
    const city = (form.city || "").trim();
    const state = (form.state || "").trim();
    const zip = (form.postalCode || "").trim();

    if (name.length < 2 || name.length > 50) {
      setFormError("Full name must be between 2 and 50 characters.");
      return;
    }
    if (!form.phone || phoneDigits.length !== 10) {
      setFormError("Phone number must be exactly 10 digits.");
      return;
    }
    if (street.length < 5 || street.length > 100) {
      setFormError("Street address must be between 5 and 100 characters.");
      return;
    }
    if (city.length < 2 || city.length > 50) {
      setFormError("City must be between 2 and 50 characters.");
      return;
    }
    if (state.length < 2 || state.length > 50) {
      setFormError("State must be between 2 and 50 characters.");
      return;
    }
    if (zip.length < 3 || zip.length > 10) {
      setFormError("Postal code must be between 3 and 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        fullName: name,
        phone: form.phone,
        line1: street,
        city,
        state,
        postalCode: zip,
        country: form.country || "United States",
      });
      setForm(initialForm);
    } catch (error) {
      setFormError(error.message || "Could not save address.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/35 px-4">
      <div className="w-full max-w-[520px] rounded-[18px] bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] font-extrabold text-textMain">{isEditing ? "Edit Address" : "Add New Address"}</h2>
            <p className="mt-1 text-[13px] font-semibold text-muted">Save a shipping address for faster checkout.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full border border-borderSoft text-textMain transition hover:bg-sageLight"
            aria-label="Close address form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4">
          {formError && <p className="rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">{formError}</p>}
          
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={User}
              label="Full Name *"
              hint="Min 2, Max 50 chars"
              value={form.fullName}
              onChange={updateField("fullName")}
              placeholder="John Doe"
              minLength={2}
              maxLength={50}
              isInvalid={(form.fullName || "").trim().length > 0 && ((form.fullName || "").trim().length < 2 || (form.fullName || "").trim().length > 50)}
              errorMsg="Full name must be 2-50 chars."
            />
            <Field
              icon={Phone}
              label="Phone Number *"
              hint="Exact 10 digits"
              value={form.phone}
              onChange={(e) => updateField("phone")({ target: { value: e.target.value.replace(/\D/g, "").slice(0, 10) } })}
              placeholder="10 digit phone number"
              maxLength={10}
              isInvalid={(form.phone || "").trim().length > 0 && (form.phone || "").replace(/\D/g, "").length !== 10}
              errorMsg="Phone must be 10 digits."
            />
          </div>

          <Field
            icon={Home}
            label="Street Address *"
            hint="Min 5, Max 100 chars"
            value={form.line1}
            onChange={updateField("line1")}
            placeholder="123 Paw Street"
            minLength={5}
            maxLength={100}
            isInvalid={(form.line1 || "").trim().length > 0 && ((form.line1 || "").trim().length < 5 || (form.line1 || "").trim().length > 100)}
            errorMsg="Address must be 5-100 chars."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={MapPin}
              label="City *"
              hint="Min 2, Max 50"
              value={form.city || ""}
              onChange={updateField("city")}
              placeholder="Austin"
              minLength={2}
              maxLength={50}
              isInvalid={(form.city || "").trim().length > 0 && ((form.city || "").trim().length < 2 || (form.city || "").trim().length > 50)}
              errorMsg="City must be 2-50 chars."
            />
            <Field
              icon={MapPin}
              label="State *"
              hint="Min 2, Max 50"
              value={form.state || ""}
              onChange={updateField("state")}
              placeholder="TX"
              minLength={2}
              maxLength={50}
              isInvalid={(form.state || "").trim().length > 0 && ((form.state || "").trim().length < 2 || (form.state || "").trim().length > 50)}
              errorMsg="State must be 2-50 chars."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={MapPin}
              label="Postal Code *"
              hint="Min 3, Max 10"
              value={form.postalCode || ""}
              onChange={updateField("postalCode")}
              placeholder="78701"
              minLength={3}
              maxLength={10}
              isInvalid={(form.postalCode || "").trim().length > 0 && ((form.postalCode || "").trim().length < 3 || (form.postalCode || "").trim().length > 10)}
              errorMsg="ZIP must be 3-10 chars."
            />
            <div>
              <span className="text-[12px] font-extrabold text-textMain uppercase tracking-wider block mb-1">Country *</span>
              <CountryDropdown
                value={form.country || "United States"}
                dropUp={true}
                onChange={(c) => setForm((curr) => ({ ...curr, country: c }))}
                className="w-full h-11 px-3 bg-white border border-borderSoft focus:border-secondaryDark rounded-lg text-textMain text-[13px] font-semibold flex items-center justify-between outline-none transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-borderSoft px-5 text-[13px] font-extrabold text-textMain transition hover:bg-sageLight"
            >
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="h-10 rounded-lg bg-secondaryDark px-5 text-[13px] font-extrabold text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Saving..." : "Save Address"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, hint, isInvalid, errorMsg, ...props }) {
  return (
    <label className="block text-left">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[12px] font-extrabold text-textMain">{label}</span>
        {hint && <span className="text-[10px] text-muted font-semibold">{hint}</span>}
      </div>
      <span className={`flex h-11 items-center gap-3 rounded-lg border ${isInvalid ? "border-error bg-error/5" : "border-borderSoft bg-white"} px-3`}>
        {Icon && <Icon size={16} className={`shrink-0 ${isInvalid ? "text-error" : "text-muted"}`} />}
        <input className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-semibold outline-none placeholder:text-muted/75" {...props} />
      </span>
      {isInvalid && errorMsg && <span className="text-[10px] font-bold text-error mt-0.5 block">{errorMsg}</span>}
    </label>
  );
}
