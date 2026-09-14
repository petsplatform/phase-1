import { useState, useEffect } from "react";
import AccountSidebar from "../../components/account/AccountSidebar";
import { accountApi } from "../../api/accountApi";
import {
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
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

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");

export default function VetVerification() {
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
              fullName: data.fullName || data.name || "",
              clinicName: data.clinicName || data.clinic || "",
              licenseNumber: data.licenseNumber || data.licenseNo || "",
              licenseState: data.licenseState || data.state || "",
              licenseExpiry: data.licenseExpiry
                ? new Date(data.licenseExpiry).toISOString().split("T")[0]
                : "",
              phone: data.phone || data.mobile || "",
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
      application.statusReason ||
      application.rejection_reason ||
      null
    : null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const nextVal = files
      ? files[0]
      : name === "phone"
        ? value.replace(/\D/g, "").slice(0, 10)
        : value;
    setForm((prev) => ({
      ...prev,
      [name]: nextVal,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setMessage("");
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");

    const fullName = String(form.fullName || "").trim();
    const clinicName = String(form.clinicName || "").trim();
    const licenseNumber = String(form.licenseNumber || "").trim();
    const licenseState = String(form.licenseState || "").trim();
    const email = String(form.email || "").trim();
    const phoneDigits = String(form.phone || "").replace(/\D/g, "");
    const licenseExpiry = String(form.licenseExpiry || "").trim();
    const file = form.document;

    const newErrors = {};

    if (!fullName) {
      newErrors.fullName = "Full name is required.";
    } else if (fullName.length < 2 || fullName.length > 50) {
      newErrors.fullName = "Full name must be between 2 and 50 characters.";
    }

    if (!clinicName) {
      newErrors.clinicName = "Clinic name is required.";
    } else if (clinicName.length < 2 || clinicName.length > 100) {
      newErrors.clinicName = "Clinic name must be between 2 and 100 characters.";
    }

    if (!licenseNumber) {
      newErrors.licenseNumber = "License number is required.";
    } else if (licenseNumber.length < 4 || licenseNumber.length > 30) {
      newErrors.licenseNumber = "License number must be between 4 and 30 characters.";
    }

    if (!licenseState) {
      newErrors.licenseState = "License state is required.";
    } else if (licenseState.length < 2 || licenseState.length > 50) {
      newErrors.licenseState = "License state must be between 2 and 50 characters.";
    }

    if (!phoneDigits) {
      newErrors.phone = "Phone number is required.";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!licenseExpiry) {
      newErrors.licenseExpiry = "License expiry date is required.";
    }

    if (!file && !application) {
      newErrors.document = "Please upload your veterinary license document.";
    } else if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        newErrors.document = "License file must be JPG, PNG, or PDF format.";
      } else if (file.size > 10 * 1024 * 1024) {
        newErrors.document = "License file size must be 10MB or smaller.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg("Please resolve the highlighted validation errors.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const saved = await accountApi.submitVetVerification(
        form,
        Boolean(application)
      );
      setApplication(saved);
      setMessage("Vet verification application submitted successfully!");
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message ||
          "Unable to submit verification application."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start min-w-0 w-full">
        <AccountSidebar />

        <div className="flex-1 text-left space-y-6 min-w-0 w-full">
          {/* Header */}
          <div className="bg-brand-surface border border-brand-border/60 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-xs min-w-0 w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-brand-dark">
                  Vet Verification
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-brand-muted mt-0.5">
                  Apply for licensed veterinarian purchasing access and verification credentials.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bg-brand-surface border border-brand-border/60 p-8 text-center text-sm font-bold text-brand-muted rounded-2xl shadow-xs">
              <Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin text-brand-teal" />
              <p>Loading verification status...</p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] min-w-0 w-full">
              {/* Main Form Card */}
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-brand-surface border border-brand-border/60 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-xs flex flex-col justify-between space-y-6 min-w-0 w-full"
              >
                <div>
                  <h2 className="text-xl font-heading font-bold text-brand-dark">
                    Become a Verified Veterinarian
                  </h2>
                  <p className="text-xs text-brand-muted mt-1 mb-6 font-medium">
                    Submit your practice license and contact details below for admin approval.
                  </p>

                  <div className="grid gap-5 sm:grid-cols-2">
                    {[
                      ["fullName", "Full Name", "Dr. Jane Doe", 50],
                      ["clinicName", "Clinic Name", "Paws & Care Veterinary Clinic", 100],
                      ["licenseNumber", "License Number", "VET-12345678", 30],
                      ["licenseState", "License State", "California", 50],
                      ["phone", "Phone Number", "10 digit phone number", 10],
                      ["email", "Email Address", "vet@clinic.com", 100],
                    ].map(([name, label, placeholder, maxLen]) => (
                      <div key={name} className="space-y-1">
                        <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-brand-muted">
                          {label} <span className="text-brand-coral">*</span>
                        </label>
                        <input
                          type={
                            name === "email"
                              ? "email"
                              : name === "phone"
                              ? "tel"
                              : "text"
                          }
                          name={name}
                          maxLength={maxLen}
                          value={form[name]}
                          placeholder={placeholder}
                          onChange={handleChange}
                          disabled={!canApply || submitting}
                          readOnly={!canApply}
                          className={`w-full rounded-xl border ${
                            errors[name]
                              ? "border-brand-coral focus:border-brand-coral"
                              : "border-brand-border focus:border-brand-teal"
                          } px-3.5 py-2.5 text-sm font-semibold text-brand-dark placeholder-brand-muted/40 focus:outline-none disabled:bg-brand-bg/50 disabled:cursor-not-allowed transition-colors`}
                        />
                        {errors[name] && (
                          <span className="text-[10px] font-bold text-brand-coral mt-1 block">
                            {errors[name]}
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Expiry Date */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-brand-muted">
                        License Expiry Date <span className="text-brand-coral">*</span>
                      </label>
                      <input
                        type="date"
                        name="licenseExpiry"
                        value={form.licenseExpiry}
                        onChange={handleChange}
                        disabled={!canApply || submitting}
                        readOnly={!canApply}
                        className={`w-full rounded-xl border ${
                          errors.licenseExpiry
                            ? "border-brand-coral focus:border-brand-coral"
                            : "border-brand-border focus:border-brand-teal"
                        } px-3.5 py-2.5 text-sm font-semibold text-brand-dark focus:outline-none disabled:bg-brand-bg/50 disabled:cursor-not-allowed transition-colors`}
                      />
                      {errors.licenseExpiry && (
                        <span className="text-[10px] font-bold text-brand-coral mt-1 block">
                          {errors.licenseExpiry}
                        </span>
                      )}
                    </div>

                    {/* Document Upload */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-heading font-bold uppercase tracking-wider text-brand-muted">
                        Upload Veterinary License <span className="text-brand-coral">*</span>
                      </label>
                      <input
                        type="file"
                        name="document"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handleChange}
                        disabled={!canApply || submitting}
                        readOnly={!canApply}
                        className={`w-full rounded-xl border ${
                          errors.document
                            ? "border-brand-coral"
                            : "border-brand-border"
                        } px-3.5 py-2 text-xs font-semibold text-brand-dark file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20 focus:outline-none disabled:bg-brand-bg/50 disabled:cursor-not-allowed transition-colors`}
                      />
                      {errors.document && (
                        <span className="text-[10px] font-bold text-brand-coral mt-1 block">
                          {errors.document}
                        </span>
                      )}
                    </div>
                  </div>

                  {form.document && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-teal/10 text-brand-teal text-xs font-bold border border-brand-teal/20">
                      <FileText className="w-4 h-4" />
                      <span className="truncate max-w-[240px]">{form.document.name}</span>
                      <span className="text-[10px] text-brand-muted font-semibold">
                        ({(form.document.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Application Status Banners */}
                {message && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700">
                    {message}
                  </div>
                )}
                {errorMsg && (
                  <div className="rounded-xl bg-brand-coral/10 border border-brand-coral/20 p-4 text-xs font-bold text-brand-coral">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-4 border-t border-brand-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={!canApply || submitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-brand-teal hover:bg-brand-deep-teal disabled:bg-brand-muted/60 disabled:cursor-not-allowed text-white font-heading font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer text-center"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </span>
                    ) : application ? (
                      "Update Application"
                    ) : (
                      "Submit Application"
                    )}
                  </button>

                  {application && (
                    <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Application Saved</span>
                    </div>
                  )}
                </div>
              </form>

              {/* Status Sidebar Card */}
              {application && (
                <div className="bg-brand-surface border border-brand-border/60 p-6 rounded-2xl sm:rounded-[2rem] shadow-xs h-fit space-y-5">
                  <div className="flex items-center justify-between border-b border-brand-border/40 pb-4">
                    <span className="text-xs font-heading font-bold text-brand-muted uppercase tracking-wider">
                      Status
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                        statusStyles[application.status] || statusStyles.Pending
                      }`}
                    >
                      {application.status === "Approved" && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {application.status === "Pending" && (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {application.status === "Rejected" && (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{application.status}</span>
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
                        Submitted Date
                      </span>
                      <span className="font-semibold text-brand-dark">
                        {formatDate(application.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
                        License State & Number
                      </span>
                      <span className="font-semibold text-brand-dark">
                        {application.licenseState || "N/A"} -{" "}
                        {application.licenseNumber || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">
                        Clinic
                      </span>
                      <span className="font-semibold text-brand-dark">
                        {application.clinicName || "N/A"}
                      </span>
                    </div>
                  </div>

                  {rejectionReason && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Admin Note / Reason</span>
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed">
                        {rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
