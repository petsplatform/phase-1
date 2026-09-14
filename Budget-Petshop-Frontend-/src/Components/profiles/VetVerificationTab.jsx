import { useEffect, useState } from "react";
import { accountApi } from "../../api/accountApi";
import { useNotification } from "../../utils/NotificationContext";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

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
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  Expired: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");

export default function VetVerificationTab() {
  const { showNotification } = useNotification();
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canApply = !application || ["Rejected", "Expired"].includes(application.status);

  useEffect(() => {
    let active = true;
    accountApi
      .getVetVerification()
      .then((data) => {
        if (active) {
          setApplication(data || null);
          if (data) {
            setForm({
              fullName: data.fullName || "",
              clinicName: data.clinicName || "",
              licenseNumber: data.licenseNumber || "",
              licenseState: data.licenseState || "",
              licenseExpiry: data.licenseExpiry
                ? new Date(data.licenseExpiry).toISOString().split("T")[0]
                : "",
              phone: data.phone || "",
              email: data.email || "",
              document: null,
            });
          }
        }
      })
      .catch(() => {
        if (active) setApplication(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : files ? files[0] : value;
    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
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
    if (!application && !file) {
      nextErrors.document = "Veterinary license document is required.";
    } else if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        nextErrors.document = "License file must be JPG, PNG, or PDF format.";
      } else if (file.size > 10 * 1024 * 1024) {
        nextErrors.document = "License file size must be 10MB or smaller.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const rejectionReason = application
    ? application.rejectionReason ||
      application.rejectedReason ||
      application.reason ||
      application.adminNotes ||
      application.remarks ||
      application.notes ||
      application.rejection_reason ||
      null
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showNotification("Please fix validation errors before submitting.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await accountApi.submitVetVerification(
        form,
        Boolean(application)
      );
      setApplication(saved);
      if (saved) {
        setForm({
          fullName: saved.fullName || saved.name || form.fullName || "",
          clinicName: saved.clinicName || saved.clinic || form.clinicName || "",
          licenseNumber: saved.licenseNumber || saved.license || form.licenseNumber || "",
          licenseState: saved.licenseState || saved.state || form.licenseState || "",
          licenseExpiry: saved.licenseExpiry
            ? String(saved.licenseExpiry).split("T")[0]
            : form.licenseExpiry || "",
          phone: saved.phone || saved.phoneNumber || form.phone || "",
          email: saved.email || saved.emailAddress || form.email || "",
          document: null,
        });
      }
      setErrors({});
      showNotification("Vet verification application submitted successfully!", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          "Unable to submit verification application.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Tab Header */}
      <div className="border-b border-outline pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-on-background">
              Vet Verification
            </h2>
            <p className="text-xs text-charcoal-text mt-1 font-medium">
              Apply for licensed veterinarian purchasing access and verification credentials.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-outline bg-white p-8 text-center text-sm font-bold text-charcoal-text shadow-sm">
          <div className="inline-block w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mb-2"></div>
          <p>Loading verification status...</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Main Form Section */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-8 rounded-3xl border border-outline bg-white p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div>
              <h3 className="text-lg font-bold text-on-background">
                Become a Verified Veterinarian
              </h3>
              <p className="text-xs text-charcoal-text mt-1">
                Submit your practice license and contact details below for admin approval.
              </p>
            </div>

            {application?.status === "Approved" && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs font-semibold flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-emerald-900 text-sm">
                    Veterinary License Approved & Active
                  </p>
                  <p className="mt-0.5 text-emerald-700 font-medium">
                    Your verification is verified and approved. You have full purchasing access for vet-restricted products.
                  </p>
                </div>
              </div>
            )}

            {application?.status === "Pending" && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-800 text-xs font-semibold flex items-center gap-3">
                <Clock size={20} className="text-amber-600 shrink-0 animate-pulse" />
                <div>
                  <p className="font-extrabold text-amber-900 text-sm">
                    Application Under Admin Review
                  </p>
                  <p className="mt-0.5 text-amber-700 font-medium">
                    Your veterinary license application has been submitted and is currently being reviewed by our administrative team.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-charcoal-text/60">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  maxLength={50}
                  placeholder="Dr. Jane Doe"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  className={`w-full rounded-2xl border ${
                    errors.fullName ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-3 text-sm font-medium text-on-background placeholder-charcoal-text/40 focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.fullName && <p className="text-xs font-semibold text-rose-600">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                    Clinic Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-charcoal-text/60">Min 2, Max 100 chars</span>
                </div>
                <input
                  type="text"
                  name="clinicName"
                  value={form.clinicName}
                  maxLength={100}
                  placeholder="Budget Pet Hospital"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-2xl border ${
                    errors.clinicName ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-3 text-sm font-medium text-on-background placeholder-charcoal-text/40 focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.clinicName && <p className="text-xs font-semibold text-rose-600">{errors.clinicName}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                    License Number <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-charcoal-text/60">Min 3, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  name="licenseNumber"
                  value={form.licenseNumber}
                  maxLength={50}
                  placeholder="VET-12345678"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-2xl border ${
                    errors.licenseNumber ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-3 text-sm font-medium text-on-background placeholder-charcoal-text/40 focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.licenseNumber && <p className="text-xs font-semibold text-rose-600">{errors.licenseNumber}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                    License State <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-charcoal-text/60">Min 2, Max 50</span>
                </div>
                <input
                  type="text"
                  name="licenseState"
                  value={form.licenseState}
                  maxLength={50}
                  placeholder="California"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-2xl border ${
                    errors.licenseState ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-3 text-sm font-medium text-on-background placeholder-charcoal-text/40 focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.licenseState && <p className="text-xs font-semibold text-rose-600">{errors.licenseState}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-charcoal-text/60">Exact 10 digits</span>
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  maxLength={10}
                  placeholder="10 digit phone number"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-2xl border ${
                    errors.phone ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-3 text-sm font-medium text-on-background placeholder-charcoal-text/40 focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.phone && <p className="text-xs font-semibold text-rose-600">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-charcoal-text/60">Valid email</span>
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  maxLength={100}
                  placeholder="vet@clinic.com"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-2xl border ${
                    errors.email ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-3 text-sm font-medium text-on-background placeholder-charcoal-text/40 focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.email && <p className="text-xs font-semibold text-rose-600">{errors.email}</p>}
              </div>

              {/* License Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                  License Expiry Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={form.licenseExpiry}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-2xl border ${
                    errors.licenseExpiry ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-3 text-sm font-medium text-on-background focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.licenseExpiry && <p className="text-xs font-semibold text-rose-600">{errors.licenseExpiry}</p>}
              </div>

              {/* Document Upload */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-charcoal-text">
                    Upload Veterinary License <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-charcoal-text/60">JPG, PNG, PDF (Max 10MB)</span>
                </div>
                <input
                  type="file"
                  name="document"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-2xl border ${
                    errors.document ? "border-rose-400 bg-rose-50" : "border-outline focus:border-secondary"
                  } px-4 py-2.5 text-xs font-semibold text-on-background file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 focus:outline-none disabled:bg-surface-tint/10 disabled:cursor-not-allowed transition`}
                />
                {errors.document && <p className="text-xs font-semibold text-rose-600">{errors.document}</p>}
              </div>
            </div>

            {form.document && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-secondary/10 text-secondary text-xs font-bold border border-secondary/20">
                <FileText size={16} />
                <span className="truncate max-w-[240px]">{form.document.name}</span>
                <span className="text-[10px] text-charcoal-text font-semibold">
                  ({(form.document.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            )}

            {application?.status === "Rejected" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-rose-900">
                <div className="flex items-center gap-2.5 font-extrabold text-rose-900 text-sm">
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <span>Application Rejected & Needs Revision</span>
                </div>
                {rejectionReason ? (
                  <p className="text-xs font-semibold text-rose-800 leading-relaxed bg-white/70 p-3 rounded-xl border border-rose-200/60">
                    <strong className="text-rose-900 font-bold">Reason for Rejection: </strong>
                    {rejectionReason}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-rose-700 leading-relaxed">
                    Your previous application was not approved. Please review your details and reapply below.
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-outline flex flex-wrap items-center justify-between gap-3">
              {canApply ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3.5 rounded-2xl bg-secondary text-white font-bold text-sm hover:opacity-90 transition cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Submitting...
                    </span>
                  ) : application?.status === "Rejected" ? (
                    "Reapply for Verification"
                  ) : application?.status === "Expired" ? (
                    "Renew Verification"
                  ) : (
                    "Submit Application"
                  )}
                </button>
              ) : application?.status === "Approved" ? (
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Verified Veterinarian Active
                </span>
              ) : (
                <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-4 py-3 rounded-2xl border border-amber-200 flex items-center gap-2">
                  <Clock size={16} className="text-amber-600 animate-pulse" /> Application Pending Admin Review
                </span>
              )}
            </div>
          </form>

          {/* Sidebar Status Card */}
          <div className="lg:col-span-4 rounded-3xl border border-outline bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-on-background border-b border-outline pb-4">
              Verification Status
            </h3>

            {application ? (
              <div className="space-y-4 text-xs font-medium text-charcoal-text">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-on-background">Current Status</span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
                      statusStyles[application.status] || statusStyles.Pending
                    }`}
                  >
                    {application.status === "Approved" ? (
                      <>
                        <CheckCircle2 size={14} />
                        Verified Veterinarian
                      </>
                    ) : application.status === "Rejected" ? (
                      <>
                        <XCircle size={14} />
                        Rejected
                      </>
                    ) : application.status === "Expired" ? (
                      <>
                        <AlertCircle size={14} />
                        Expired
                      </>
                    ) : (
                      <>
                        <Clock size={14} className="animate-pulse" />
                        Pending Review
                      </>
                    )}
                  </span>
                </div>

                <div className="divide-y divide-outline rounded-2xl bg-surface-tint/10 p-4 space-y-2.5">
                  <div className="flex justify-between pt-1">
                    <span className="font-bold text-charcoal-text">Submission Date:</span>
                    <span className="font-extrabold text-on-background">
                      {formatDate(application.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-charcoal-text">License Expiry:</span>
                    <span className="font-extrabold text-on-background">
                      {formatDate(application.licenseExpiry)}
                    </span>
                  </div>
                  {application.verifiedAt && (
                    <div className="flex justify-between pt-2">
                      <span className="font-bold text-charcoal-text">Verified Date:</span>
                      <span className="font-extrabold text-emerald-700">
                        {formatDate(application.verifiedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {(rejectionReason || application.remarks) && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-left space-y-1">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-rose-800">
                      {application.status === "Rejected" ? "Rejection Reason:" : "Admin Remarks:"}
                    </span>
                    <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                      {rejectionReason || application.remarks}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-medium text-charcoal-text space-y-2">
                <ShieldCheck size={36} className="text-secondary/30 mx-auto" />
                <p className="font-bold text-on-background">No application submitted yet.</p>
                <p className="text-[11px] text-charcoal-text/70">
                  Fill out the form on the left to request veterinarian purchasing credentials.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
