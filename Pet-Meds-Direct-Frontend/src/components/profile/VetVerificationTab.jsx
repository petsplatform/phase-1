import React, { useEffect, useState } from "react";
import { accountApi } from "../../api/accountApi";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  Upload,
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

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

export default function VetVerificationTab() {
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canApply =
    !application || ["Rejected", "Expired"].includes(application.status);

  useEffect(() => {
    let active = true;
    accountApi
      .getVetVerification()
      .then((data) => {
        if (active && data) {
          setApplication(data);
          setForm({
            fullName: data.fullName || data.name || "",
            clinicName: data.clinicName || data.clinic || "",
            licenseNumber: data.licenseNumber || data.license || "",
            licenseState: data.licenseState || data.state || "",
            licenseExpiry: data.licenseExpiry
              ? String(data.licenseExpiry).split("T")[0]
              : data.expiryDate
                ? String(data.expiryDate).split("T")[0]
                : "",
            phone: data.phone || data.phoneNumber || "",
            email: data.email || data.emailAddress || "",
            document: null,
          });
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
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
      nextErrors.licenseNumber =
        "License number must be at least 3 characters.";
    } else if (licenseNumber.length > 50) {
      nextErrors.licenseNumber =
        "License number must not exceed 50 characters.";
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
        nextErrors.licenseExpiry =
          "License expiry date must be today or in the future.";
      }
    }

    const file = form.document;
    if (!file && !application) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(
        "Please fix the highlighted validation errors before submitting.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const saved = await accountApi.submitVetVerification(
        form,
        Boolean(application),
      );
      setApplication(saved);
      if (saved) {
        setForm({
          fullName: saved.fullName || saved.name || form.fullName || "",
          clinicName: saved.clinicName || saved.clinic || form.clinicName || "",
          licenseNumber:
            saved.licenseNumber || saved.license || form.licenseNumber || "",
          licenseState:
            saved.licenseState || saved.state || form.licenseState || "",
          licenseExpiry: saved.licenseExpiry
            ? String(saved.licenseExpiry).split("T")[0]
            : form.licenseExpiry || "",
          phone: saved.phone || saved.phoneNumber || form.phone || "",
          email: saved.email || saved.emailAddress || form.email || "",
          document: null,
        });
      }
      setErrors({});
      toast.success("Vet verification application submitted successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to submit verification application.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-mint text-primary-green shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
              Vet Verification
            </h2>
            <p className="text-sm font-semibold text-deep-navy/50 mt-1">
              Apply for licensed veterinarian purchasing access and verification
              credentials.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#e8eef3] bg-white p-8 text-center text-sm font-bold text-deep-navy/60">
          <div className="inline-block h-6 w-6 border-2 border-primary-green border-t-transparent rounded-full animate-spin mb-2" />
          <p>Loading verification status...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Form Section */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-8 rounded-2xl border border-[#e8eef3] bg-white p-6 sm:p-8 space-y-6"
          >
            <div>
              <h3 className="text-lg font-black text-deep-navy font-display">
                Become a Verified Veterinarian
              </h3>
              <p className="text-xs font-semibold text-deep-navy/50 mt-1">
                Submit your practice license and contact details below for admin
                approval.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                [
                  "fullName",
                  "Full Name",
                  "Dr. Jane Doe",
                  "Min 2, Max 50 chars",
                ],
                [
                  "clinicName",
                  "Clinic Name",
                  "Pet Meds Animal Hospital",
                  "Min 2, Max 100 chars",
                ],
                [
                  "licenseNumber",
                  "License Number",
                  "VET-12345678",
                  "Min 3, Max 50 chars",
                ],
                [
                  "licenseState",
                  "License State",
                  "California",
                  "Min 2, Max 50 chars",
                ],
                ["phone", "Phone Number", "+1 (555) 000-0000", "10 digits"],
                ["email", "Email Address", "vet@clinic.com", "Valid email"],
              ].map(([name, label, placeholder, hint]) => (
                <div key={name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-deep-navy/60">
                      {label} <span className="text-rose-500">*</span>
                    </label>
                    {hint && (
                      <span className="text-[10px] font-semibold text-deep-navy/40">
                        {hint}
                      </span>
                    )}
                  </div>
                  <input
                    type={
                      name === "email"
                        ? "email"
                        : name === "phone"
                          ? "tel"
                          : "text"
                    }
                    name={name}
                    maxLength={
                      name === "phone"
                        ? 15
                        : name === "email"
                          ? 100
                          : name === "licenseNumber"
                            ? 50
                            : name === "licenseState"
                              ? 50
                              : 50
                    }
                    value={form[name]}
                    placeholder={placeholder}
                    onChange={handleChange}
                    disabled={!canApply || submitting}
                    readOnly={!canApply}
                    className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-deep-navy placeholder-deep-navy/30 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors ${
                      errors[name]
                        ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                        : "border-[#e8eef3] focus:border-primary-green"
                    }`}
                  />
                  {errors[name] && (
                    <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>{errors[name]}</span>
                    </p>
                  )}
                </div>
              ))}

              {/* License Expiry */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-deep-navy/60">
                    License Expiry Date <span className="text-rose-500">*</span>
                  </label>
                </div>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={form.licenseExpiry}
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  readOnly={!canApply}
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold text-deep-navy focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors ${
                    errors.licenseExpiry
                      ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                      : "border-[#e8eef3] focus:border-primary-green"
                  }`}
                />
                {errors.licenseExpiry && (
                  <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.licenseExpiry}</span>
                  </p>
                )}
              </div>

              {/* Document Upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-deep-navy/60">
                    Upload Veterinary License{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-deep-navy/40">
                    JPG, PNG, PDF (Max 10MB)
                  </span>
                </div>
                <input
                  type="file"
                  name="document"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleChange}
                  disabled={!canApply || submitting}
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs font-semibold text-deep-navy file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-primary-green/10 file:text-primary-green hover:file:bg-primary-green/20 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors ${
                    errors.document
                      ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                      : "border-[#e8eef3] focus:border-primary-green"
                  }`}
                />
                {errors.document && (
                  <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{errors.document}</span>
                  </p>
                )}
              </div>
            </div>

            {form.document && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-green/5 text-primary-green text-xs font-bold border border-primary-green/10">
                <FileText className="h-4 w-4 text-primary-green" />
                <span className="truncate max-w-[240px]">
                  {form.document.name}
                </span>
                <span className="text-[10px] text-deep-navy/50 font-semibold">
                  ({(form.document.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
            )}

            {/* Application Status Banner inside form */}
            {application?.status === "Approved" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start sm:items-center gap-3 text-emerald-900">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-900">
                    Verified Veterinarian Credentials Active
                  </h4>
                  <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                    Your license has been verified. You have full purchasing
                    access to veterinarian-restricted items.
                  </p>
                </div>
              </div>
            )}

            {application?.status === "Pending" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start sm:items-center gap-3 text-amber-900">
                <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
                <div>
                  <h4 className="text-sm font-extrabold text-amber-900">
                    Application Under Review
                  </h4>
                  <p className="text-xs font-semibold text-amber-700 mt-0.5">
                    Your verification application has been received and is
                    currently under review by our administration team.
                  </p>
                </div>
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
                    <strong className="text-rose-900 font-bold">
                      Reason for Rejection:{" "}
                    </strong>
                    {rejectionReason}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-rose-700 leading-relaxed">
                    Your previous application was not approved. Please review
                    your details and reapply below.
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-[#e8eef3] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {canApply ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-dark-green transition-colors cursor-pointer shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                <span className="inline-flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-4 py-3 rounded-xl border border-emerald-200 w-full sm:w-auto">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  Verified Veterinarian Active
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2 text-xs font-extrabold text-amber-800 bg-amber-100/80 px-4 py-3 rounded-xl border border-amber-200 w-full sm:w-auto">
                  <Clock className="h-4 w-4 text-amber-600 shrink-0 animate-pulse" />
                  Application Pending Admin Review
                </span>
              )}
            </div>
          </form>

          {/* Sidebar Status Card */}
          <div className="lg:col-span-4 rounded-2xl border border-[#e8eef3] bg-white p-6 space-y-6">
            <h3 className="text-lg font-black text-deep-navy font-display border-b border-[#e8eef3] pb-4">
              Verification Status
            </h3>

            {application ? (
              <div className="space-y-4 text-xs font-semibold text-deep-navy/70">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-deep-navy">
                    Current Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
                      statusStyles[application.status] || statusStyles.Pending
                    }`}
                  >
                    {application.status === "Approved" ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified Veterinarian
                      </>
                    ) : application.status === "Rejected" ? (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        Rejected
                      </>
                    ) : application.status === "Expired" ? (
                      <>
                        <AlertCircle className="h-3.5 w-3.5" />
                        Expired
                      </>
                    ) : (
                      <>
                        <Clock className="h-3.5 w-3.5 animate-pulse" />
                        Pending Review
                      </>
                    )}
                  </span>
                </div>

                <div className="divide-y divide-[#e8eef3] rounded-xl bg-slate-50 p-4 space-y-2.5">
                  <div className="flex justify-between pt-1">
                    <span className="font-bold text-deep-navy/60">
                      Submission Date:
                    </span>
                    <span className="font-extrabold text-deep-navy">
                      {formatDate(application.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-deep-navy/60">
                      License Expiry:
                    </span>
                    <span className="font-extrabold text-deep-navy">
                      {formatDate(application.licenseExpiry)}
                    </span>
                  </div>
                  {application.verifiedAt && (
                    <div className="flex justify-between pt-2">
                      <span className="font-bold text-deep-navy/60">
                        Verified Date:
                      </span>
                      <span className="font-extrabold text-emerald-700">
                        {formatDate(application.verifiedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {(rejectionReason || application.remarks) && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-left space-y-1">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-rose-800">
                      {application.status === "Rejected"
                        ? "Rejection Reason:"
                        : "Admin Remarks:"}
                    </span>
                    <p className="text-xs font-semibold text-rose-900 leading-relaxed">
                      {rejectionReason || application.remarks}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-semibold text-deep-navy/50 space-y-2">
                <ShieldCheck className="h-10 w-10 text-primary-green/30 mx-auto" />
                <p className="font-bold text-deep-navy">
                  No application submitted yet.
                </p>
                <p className="text-[11px] text-deep-navy/40">
                  Fill out the form on the left to request veterinarian
                  purchasing credentials.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
