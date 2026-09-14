import { useState } from "react";
import { CircleUserRound, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { trimFormValues } from "../../utils/phoneValidation";

const VerifyContactStep = ({ verified, onVerified }) => {
  const { checkoutContact, customer, isLoggedIn } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetFormState = () => {
    setServerError("");
    setErrors({});
  };

  const validate = (data) => {
    const nextErrors = {};

    const nameVal = String(data.name || "").trim();
    if (!nameVal) {
      nextErrors.name = "Full name is required.";
    } else if (nameVal.length < 2) {
      nextErrors.name = "Full name must be at least 2 characters.";
    } else if (nameVal.length > 50) {
      nextErrors.name = "Full name must not exceed 50 characters.";
    }

    const emailVal = String(data.email || "").trim();
    if (!emailVal) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (emailVal.length > 100) {
      nextErrors.email = "Email address must not exceed 100 characters.";
    }

    const phoneDigits = String(data.phone || "").replace(/\D/g, "");
    if (!phoneDigits) {
      nextErrors.phone = "Mobile number is required.";
    } else if (phoneDigits.length !== 10) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitContact = async (event) => {
    event.preventDefault();
    setServerError("");
    const nextForm = trimFormValues(form);

    if (!validate(nextForm)) return;

    setLoading(true);

    try {
      await checkoutContact(nextForm);
      setEditing(false);
      resetFormState();
      onVerified();
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || "Could not continue checkout");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  if (verified && isLoggedIn && customer && !editing) {
    const info = { name: customer.name, email: customer.email, phone: customer.phone };

    return (
      <div className="rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#d9aa3d]" />
            <div>
              <h2 className="font-extrabold text-[#122a50]">Contact</h2>
              <p className="text-xs font-semibold text-[#122a50]/60">
                {[info.name, info.email, info.phone].filter(Boolean).join(" - ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm({
                name: customer?.name || form.name,
                email: customer?.email || form.email,
                phone: customer?.phone || form.phone,
              });
              resetFormState();
              setEditing(true);
            }}
            className="text-xs font-extrabold text-[#d9aa3d] transition-colors hover:text-[#17345f]"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#17345f1a] px-5 py-4">
        <CircleUserRound className="h-5 w-5 text-[#d9aa3d]" />
        <h2 className="font-extrabold text-[#122a50]">Contact</h2>
      </div>
      <div className="p-5 text-left">
        <p className="mb-4 rounded-lg bg-[#f8f1df] px-3 py-2 text-sm font-semibold text-[#122a50]">
          Add your details to continue. If this email is already registered, we will log you in; otherwise we will create your account.
        </p>

        {serverError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{serverError}</p>
        )}

        <form className="space-y-4" onSubmit={submitContact} noValidate>
          <label className="block text-left">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#122a50]">Full Name *</span>
              <span className="text-[10px] font-semibold text-[#122a50]/50">Min 2, Max 50 chars</span>
            </div>
            <input
              type="text"
              value={form.name}
              maxLength={50}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Enter your full name"
              aria-invalid={Boolean(errors.name)}
              className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                errors.name ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>
            )}
          </label>

          <label className="block text-left">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#122a50]">Email Address *</span>
              <span className="text-[10px] font-semibold text-[#122a50]/50">Valid email</span>
            </div>
            <input
              type="email"
              value={form.email}
              maxLength={100}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="Enter your email"
              aria-invalid={Boolean(errors.email)}
              className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                errors.email ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>
            )}
          </label>

          <label className="block text-left">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-extrabold text-[#122a50]">Mobile Number *</span>
              <span className="text-[10px] font-semibold text-[#122a50]/50">Exact 10 digits</span>
            </div>
            <input
              type="tel"
              value={form.phone}
              maxLength={10}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="Enter 10 digit mobile number"
              aria-invalid={Boolean(errors.phone)}
              className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                errors.phone ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs font-semibold text-red-600">{errors.phone}</p>
            )}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-lg bg-[#17345f] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.24)] transition-all duration-200 hover:bg-[#d9aa3d] disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Continuing..." : "Continue to Checkout"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyContactStep;
