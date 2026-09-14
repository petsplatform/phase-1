import React, { useEffect, useState, useContext } from "react";
import AccountLayout from "./AccountLayout";
import { accountApi } from "../../api/accountApi";
import { AppContext } from "../../context/AppContext";
import {
  ShieldCheck,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Loader2,
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

export default function VetVerificationPage() {
  const { addToast } = useContext(AppContext) || {};
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canApply =
    !application || ["Rejected", "Expired"].includes(application.status);

  const showToast = (message, type = "success") => {
    if (typeof addToast === "function") {
      addToast({
        title: type === "error" ? "Validation Notice" : type === "warning" ? "Notice" : "Success",
        message: message,
        type: type,
      });
    }
  };

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
      showToast("Please correct the highlighted validation errors before submitting.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await accountApi.submitVetVerification(
        form,
        Boolean(application),
      );
      setApplication(saved);
      setErrors({});
      showToast(
        "Vet verification application submitted successfully!",
        "success",
      );
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "Unable to submit verification application.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountLayout
      title="Vet Verification"
      subtitle="Apply for licensed veterinarian purchasing access and verification credentials."
    >
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-600 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#087BC1] mb-2" />
          <p>Loading verification status...</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Main Form Card */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6"
          >
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Become a Verified Veterinarian
              </h2>
              <p className="text-xs text-slate-500 mt-1 mb-6 font-medium">
                Submit your practice license and contact details below for admin
                approval.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  ["fullName", "Full Name", "Dr. Jane Doe", "Min 2, Max 50 chars"],
                  ["clinicName", "Clinic Name", "Vet Supply Express Clinic", "Min 2, Max 100 chars"],
                  ["licenseNumber", "License Number", "VET-12345678", "Min 3, Max 50 chars"],
                  ["licenseState", "License State", "California", "Min 2, Max 50 chars"],
                  ["phone", "Phone Number", "+1 (555) 000-0000", "10 digits"],
                  ["email", "Email Address", "vet@clinic.com", "Valid email"],
                ].map(([name, label, placeholder, hint]) => (
                  <div key={name} className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                        {label} <span className="text-rose-500">*</span>
                      </label>
                      {hint && (
                        <span className="text-[10px] font-semibold text-slate-400">
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
                      value={form[name]}
                      placeholder={placeholder}
                      onChange={handleChange}
                      disabled={!canApply || submitting}
                      readOnly={!canApply}
                      maxLength={
                        name === "fullName"
                          ? 50
                          : name === "clinicName"
                            ? 100
                            : name === "licenseNumber"
                              ? 50
                              : name === "licenseState"
                                ? 50
                                : name === "phone"
                                  ? 15
                                  : name === "email"
                                    ? 100
                                    : undefined
                      }
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors ${
                        errors[name]
                          ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                          : "border-slate-200 focus:border-[#087BC1]"
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

                {/* Expiry Date */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
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
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors ${
                      errors.licenseExpiry
                        ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#087BC1]"
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
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                      Upload Veterinary License{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      JPG, PNG, PDF (Max 10MB)
                    </span>
                  </div>
                  <input
                    type="file"
                    name="document"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={handleChange}
                    disabled={!canApply || submitting}
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs font-semibold text-slate-800 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#087BC1]/10 file:text-[#087BC1] hover:file:bg-[#087BC1]/20 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors ${
                      errors.document
                        ? "border-rose-400 bg-rose-50/40 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#087BC1]"
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
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#087BC1]/10 text-[#087BC1] text-xs font-bold border border-[#087BC1]/20">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[240px]">
                    {form.document.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    ({(form.document.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}
            </div>

            {/* Application Status Banners */}
            {application?.status === "Approved" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start sm:items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-black text-emerald-900">
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
                <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-black text-amber-900">
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
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900">
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-xs sm:text-sm font-black text-rose-900">
                    Application Needs Revision
                  </h4>
                  <p className="text-xs font-semibold text-rose-700 mt-0.5">
                    Your previous application was not approved. Please review
                    your details and reapply below.
                  </p>
                  {rejectionReason && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200/80">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block">
                        Reason for Rejection:
                      </span>
                      <p className="text-xs font-bold text-rose-900 mt-0.5">
                        {rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {canApply ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#073B66] hover:bg-[#087BC1] text-white font-bold text-sm transition-colors cursor-pointer shadow-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
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
                <span className="inline-flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-800 bg-emerald-100/90 px-4 py-3 rounded-xl border border-emerald-200 w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Verified Veterinarian Active
                </span>
              ) : (
                <span className="inline-flex items-center justify-center gap-2 text-xs font-extrabold text-amber-800 bg-amber-100/90 px-4 py-3 rounded-xl border border-amber-200 w-full sm:w-auto">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                  Application Pending Admin Review
                </span>
              )}
            </div>
          </form>

          {/* Verification Status Card */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between h-fit">
            <div>
              <h2 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-4">
                Verification Status
              </h2>

              {application ? (
                <div className="space-y-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">
                      Current Status
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
                        statusStyles[application.status] || statusStyles.Pending
                      }`}
                    >
                      {application.status === "Approved" ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Verified Veterinarian
                        </>
                      ) : application.status === "Rejected" ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Rejected
                        </>
                      ) : application.status === "Expired" ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
                          Expired
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          Pending Review
                        </>
                      )}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 rounded-xl bg-slate-50 p-4 space-y-2.5">
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-500 font-bold">
                        Submission Date:
                      </span>
                      <span className="font-extrabold text-slate-800">
                        {formatDate(application.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-slate-500 font-bold">
                        License Expiry:
                      </span>
                      <span className="font-extrabold text-slate-800">
                        {formatDate(application.licenseExpiry)}
                      </span>
                    </div>
                    {application.verifiedAt && (
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-500 font-bold">
                          Verified Date:
                        </span>
                        <span className="font-extrabold text-emerald-700">
                          {formatDate(application.verifiedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {rejectionReason && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-left">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1">
                        Admin Remarks / Reason:
                      </span>
                      <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                        {rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs font-semibold text-slate-500 space-y-2">
                  <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">
                    No application submitted yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Fill out the form on the left to request veterinarian
                    purchasing access.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </AccountLayout>
  );
}
