import { useEffect, useState } from "react";
import AccountLayout from "../components/account/AccountLayout";
import { accountApi } from "../api/accountApi";
import { useToast } from "../context/ToastContext";

const emptyForm = {
  fullName: "",
  clinicName: "",
  licenseNumber: "",
  licenseState: "",
  licenseExpiry: "",
  phone: "",
  email: "",
  document: null,
};

const statusStyles = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-green-50 text-green-700",
  Rejected: "bg-red-50 text-red-700",
  Expired: "bg-slate-100 text-slate-700",
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");

function formatDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const datePart = value.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function getVetApplicationForm(application = {}) {
  if (!application) return emptyForm;
  return {
    fullName: application.fullName || application.name || "",
    clinicName: application.clinicName || application.clinic || application.practiceName || "",
    licenseNumber: application.licenseNumber || application.licenseNo || application.license || "",
    licenseState: application.licenseState || application.state || "",
    licenseExpiry: formatDateInputValue(
      application.licenseExpiry ||
        application.licenseExpiryDate ||
        application.expiryDate ||
        application.expiresAt,
    ),
    phone: String(application.phone || application.mobile || "").replace(/\D/g, "").slice(0, 10),
    email: application.email || "",
    document: null,
  };
}

export default function VetVerification() {
  const { showToast } = useToast();
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const canApply = !application || ["Rejected", "Expired"].includes(application.status);

  const rejectionReason = application
    ? application.rejectionReason ||
      application.rejectedReason ||
      application.reason ||
      application.adminNotes ||
      application.adminNote ||
      application.admin_notes ||
      application.remarks ||
      application.notes ||
      application.statusReason ||
      application.rejection_reason ||
      null
    : null;

  useEffect(() => {
    accountApi
      .getVetVerification()
      .then((data) => {
        setApplication(data || null);
        if (data) {
          setForm(getVetApplicationForm(data));
        }
      })
      .catch(() => setApplication(null))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setForm((current) => ({ ...current, [name]: files ? files[0] : value }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors = {};

    const fullName = String(form.fullName || "").trim();
    if (!fullName) {
      nextErrors.fullName = "Full name is required.";
    } else if (fullName.length < 2) {
      nextErrors.fullName = "Full name must be at least 2 characters.";
    } else if (fullName.length > 50) {
      nextErrors.fullName = "Full name must not exceed 50 characters.";
    }

    const clinicName = String(form.clinicName || "").trim();
    if (!clinicName) {
      nextErrors.clinicName = "Clinic name is required.";
    } else if (clinicName.length < 2) {
      nextErrors.clinicName = "Clinic name must be at least 2 characters.";
    } else if (clinicName.length > 100) {
      nextErrors.clinicName = "Clinic name must not exceed 100 characters.";
    }

    const licenseNumber = String(form.licenseNumber || "").trim();
    if (!licenseNumber) {
      nextErrors.licenseNumber = "License number is required.";
    } else if (licenseNumber.length < 3) {
      nextErrors.licenseNumber = "License number must be at least 3 characters.";
    } else if (licenseNumber.length > 50) {
      nextErrors.licenseNumber = "License number must not exceed 50 characters.";
    }

    const licenseState = String(form.licenseState || "").trim();
    if (!licenseState) {
      nextErrors.licenseState = "License state is required.";
    } else if (licenseState.length < 2) {
      nextErrors.licenseState = "License state must be at least 2 characters.";
    } else if (licenseState.length > 50) {
      nextErrors.licenseState = "License state must not exceed 50 characters.";
    }

    const phoneDigits = String(form.phone || "").replace(/\D/g, "");
    if (!phoneDigits) {
      nextErrors.phone = "Phone number is required.";
    } else if (phoneDigits.length !== 10) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    const emailVal = String(form.email || "").trim();
    if (!emailVal) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (emailVal.length > 100) {
      nextErrors.email = "Email address must not exceed 100 characters.";
    }

    if (!form.licenseExpiry) {
      nextErrors.licenseExpiry = "License expiry date is required.";
    } else {
      const selected = new Date(form.licenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        nextErrors.licenseExpiry = "License expiry date must be today or in the future.";
      }
    }

    const file = form.document;
    if (!file) {
      nextErrors.document = "Veterinary license document is required.";
    } else {
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        nextErrors.document = "License file must be JPG, PNG, or PDF.";
      } else if (file.size > 10 * 1024 * 1024) {
        nextErrors.document = "License file must be 10MB or smaller.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      showToast("Please fix the validation errors before submitting.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await accountApi.submitVetVerification(form, Boolean(application));
      setApplication(saved);
      setForm(emptyForm);
      setErrors({});
      showToast("Vet verification submitted successfully.", "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to submit verification.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountLayout title="Vet Verification" description="Apply for licensed veterinarian purchasing access.">
      {loading ? (
        <div className="rounded-2xl border border-[#17345f1a] bg-white p-6 text-sm font-bold text-[#122a50b2]">
          Loading verification status...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-[#122a50]">Become a Verified Veterinarian</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">Full Name *</span>
                  <span className="text-[10px] font-semibold text-[#122a50b2]">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  maxLength={50}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  placeholder="Dr. Jane Doe"
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.fullName ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.fullName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.fullName}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">Clinic Name *</span>
                  <span className="text-[10px] font-semibold text-[#122a50b2]">Min 2, Max 100 chars</span>
                </div>
                <input
                  type="text"
                  name="clinicName"
                  value={form.clinicName}
                  maxLength={100}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  placeholder="Happy Paws Clinic"
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.clinicName ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.clinicName && <p className="mt-1 text-xs font-semibold text-red-600">{errors.clinicName}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">License Number *</span>
                  <span className="text-[10px] font-semibold text-[#122a50b2]">Min 3, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  maxLength={50}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  placeholder="VET-123456"
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.licenseNumber ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.licenseNumber && <p className="mt-1 text-xs font-semibold text-red-600">{errors.licenseNumber}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">License State *</span>
                  <span className="text-[10px] font-semibold text-[#122a50b2]">Min 2, Max 50</span>
                </div>
                <input
                  type="text"
                  name="licenseState"
                  value={form.licenseState}
                  maxLength={50}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  placeholder="California"
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.licenseState ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.licenseState && <p className="mt-1 text-xs font-semibold text-red-600">{errors.licenseState}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">Phone *</span>
                  <span className="text-[10px] font-semibold text-[#122a50b2]">Exact 10 digits</span>
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  maxLength={10}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  placeholder="10 digit phone number"
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.phone ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.phone && <p className="mt-1 text-xs font-semibold text-red-600">{errors.phone}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">Email *</span>
                  <span className="text-[10px] font-semibold text-[#122a50b2]">Valid email</span>
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  maxLength={100}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  placeholder="vet@example.com"
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.email ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">License Expiry *</span>
                </div>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={form.licenseExpiry}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.licenseExpiry ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.licenseExpiry && <p className="mt-1 text-xs font-semibold text-red-600">{errors.licenseExpiry}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-[#122a50a6]">Upload Veterinary License *</span>
                  <span className="text-[10px] font-semibold text-[#122a50b2]">JPG, PNG, PDF (Max 10MB)</span>
                </div>
                <input
                  type="file"
                  name="document"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm font-semibold text-[#122a50] outline-none disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.document ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                  }`}
                />
                {errors.document && <p className="mt-1 text-xs font-semibold text-red-600">{errors.document}</p>}
              </label>
            {application?.status === "Rejected" && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900 text-left">
                <h4 className="text-sm font-extrabold text-red-900">
                  Application Needs Revision
                </h4>
                <p className="text-xs font-semibold text-red-700 mt-1">
                  Your previous application was not approved. Please review your details and reapply below.
                </p>
                {rejectionReason && (
                  <div className="mt-2 pt-2 border-t border-red-200/80">
                    <span className="text-[10px] font-extrabold uppercase text-red-800 block">
                      Reason for Rejection:
                    </span>
                    <p className="text-xs font-bold text-red-900 mt-0.5">
                      {rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            )}
            </div>

            <button
              type="submit"
              disabled={!canApply || submitting}
              className="mt-5 rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d] disabled:cursor-not-allowed disabled:bg-[#17345f]/40 cursor-pointer"
            >
              {submitting ? "Submitting..." : application ? "Reapply" : "Submit"}
            </button>
          </form>

          <aside className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm text-left">
            <h2 className="text-lg font-extrabold text-[#122a50]">Verification Status</h2>
            {application ? (
              <div className="mt-4 space-y-3 text-sm font-semibold text-[#122a50b2]">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${
                    statusStyles[application.status] || statusStyles.Pending
                  }`}
                >
                  {application.status === "Approved" ? "Verified Veterinarian" : application.status}
                </span>
                <p>Submission Date: {formatDate(application.createdAt)}</p>
                <p>License Expiry: {formatDate(application.licenseExpiry)}</p>
                {application.verifiedAt && <p>Verified Date: {formatDate(application.verifiedAt)}</p>}
                {rejectionReason && (
                  <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
                    <span className="font-extrabold block">Admin Notes / Reason:</span>
                    <p className="font-semibold text-amber-800 leading-snug">{rejectionReason}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-[#122a50b2]">No application submitted yet.</p>
            )}
          </aside>
        </div>
      )}
    </AccountLayout>
  );
}
