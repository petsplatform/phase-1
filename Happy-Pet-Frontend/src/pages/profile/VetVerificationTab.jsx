import { useEffect, useState } from "react";
import { accountApi } from "../../api/accountApi";
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
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Expired: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : "N/A";

function getRejectionReason(application) {
  if (!application) return "";

  const extractString = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "object") {
      return (
        val.note ||
        val.reason ||
        val.comment ||
        val.remark ||
        val.description ||
        val.statusReason ||
        val.rejectionReason ||
        val.history ||
        ""
      ).trim();
    }
    return String(val).trim();
  };

  const directCandidate =
    application.statusReason ||
    application.status_reason ||
    application.rejectionReason ||
    application.rejection_reason ||
    application.rejectReason ||
    application.reject_reason ||
    application.rejectionNote ||
    application.rejection_note ||
    application.rejectedNote ||
    application.historyNote ||
    application.applicationHistory ||
    application.application_history ||
    application.adminNote ||
    application.admin_note ||
    application.note ||
    application.notes ||
    application.comment ||
    application.comments ||
    application.remark ||
    application.remarks ||
    application.reason;

  const directStr = extractString(directCandidate);
  if (directStr) return directStr;

  if (application.history) {
    if (Array.isArray(application.history) && application.history.length > 0) {
      for (let i = application.history.length - 1; i >= 0; i--) {
        const str = extractString(application.history[i]);
        if (str) return str;
      }
    } else {
      const str = extractString(application.history);
      if (str) return str;
    }
  }

  return "";
}

export default function VetVerificationTab({ toast }) {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullName = String(form.fullName || "").trim();
    const clinicName = String(form.clinicName || "").trim();
    const licenseNumber = String(form.licenseNumber || "").trim();
    const licenseState = String(form.licenseState || "").trim();
    const email = String(form.email || "").trim();
    const phoneDigits = String(form.phone || "").replace(/\D/g, "");

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

    if (!email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (!phoneDigits) {
      newErrors.phone = "Phone number is required.";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!form.licenseExpiry) {
      newErrors.licenseExpiry = "License expiry date is required.";
    } else {
      const selectedDate = new Date(form.licenseExpiry);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.licenseExpiry = "License expiry date cannot be in the past.";
      }
    }

    const file = form.document;
    if (!file && !application) {
      newErrors.document = "Veterinary license document is required.";
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
      toast.error("Please fix the validation errors in the form.");
      return;
    }

    setErrors({});
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
    <div className="animate-in fade-in duration-300 text-left flex-grow flex flex-col justify-between">
      <div>
        {/* Tab Header */}
        <div className="border-b border-brand-purple/5 pb-5 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-purple/10 text-brand-purple flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-extrabold text-brand-purple tracking-tight">
                Vet Verification
              </h2>
              <p className="text-xs text-brand-brown/60 mt-0.5 font-semibold">
                Apply for licensed veterinarian purchasing access and
                verification credentials.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-brand-purple/10 bg-white p-8 text-center text-sm font-bold text-brand-purple/70 shadow-sm">
            <div className="inline-block w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mb-2"></div>
            <p>Loading verification status...</p>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Form Section */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-3xl border border-brand-purple/10 bg-white p-5 sm:p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-extrabold text-brand-purple mb-1">
                  Become a Verified Veterinarian
                </h3>
                <p className="text-xs text-brand-brown/60 mb-6 font-medium">
                  Submit your practice license and contact details below for
                  admin approval.
                </p>

                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    ["fullName", "Full Name", "Dr. Jane Doe", 50],
                    [
                      "clinicName",
                      "Clinic Name",
                      "Happy Paws Veterinary Hospital",
                      100,
                    ],
                    ["licenseNumber", "License Number", "VET-12345678", 30],
                    ["licenseState", "License State", "California", 50],
                    ["phone", "Phone Number", "10 digit phone number", 10],
                    ["email", "Email Address", "vet@clinic.com", 100],
                  ].map(([name, label, placeholder, maxLen]) => (
                    <div key={name} className="space-y-1 text-left">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-purple/70">
                        {label} <span className="text-red-500">*</span>
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
                            ? "border-red-500 focus:border-red-500"
                            : "border-brand-purple/15 focus:border-brand-purple"
                        } px-3.5 py-2.5 text-sm font-semibold text-brand-purple placeholder-brand-purple/30 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors`}
                      />
                      {errors[name] && (
                        <span className="text-[10px] font-bold text-red-500 mt-1 block">
                          {errors[name]}
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Expiry Date */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-purple/70">
                      License Expiry Date{" "}
                      <span className="text-red-500">*</span>
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
                          ? "border-red-500 focus:border-red-500"
                          : "border-brand-purple/15 focus:border-brand-purple"
                      } px-3.5 py-2.5 text-sm font-semibold text-brand-purple focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors`}
                    />
                    {errors.licenseExpiry && (
                      <span className="text-[10px] font-bold text-red-500 mt-1 block">
                        {errors.licenseExpiry}
                      </span>
                    )}
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-brand-purple/70">
                      Upload Veterinary License{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name="document"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handleChange}
                        disabled={!canApply || submitting}
                        className={`w-full rounded-xl border ${
                          errors.document
                            ? "border-red-500"
                            : "border-brand-purple/15"
                        } px-3.5 py-2 text-xs font-semibold text-brand-purple file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-purple/10 file:text-brand-purple hover:file:bg-brand-purple/20 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors`}
                      />
                    </div>
                    {errors.document && (
                      <span className="text-[10px] font-bold text-red-500 mt-1 block">
                        {errors.document}
                      </span>
                    )}
                  </div>
                </div>

                {form.document && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-purple/5 text-brand-purple text-xs font-bold border border-brand-purple/10 max-w-full">
                    <FileText className="w-4 h-4 text-brand-purple/60 shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[240px]">
                      {form.document.name}
                    </span>
                    <span className="text-[10px] text-brand-brown/50 font-semibold shrink-0">
                      ({(form.document.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-brand-purple/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {canApply ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-purple text-brand-cream hover:bg-brand-peach hover:text-brand-purple font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:bg-brand-purple/40 disabled:text-white/70 text-center"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
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
                  <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl w-full sm:w-auto">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Verified Veterinarian Active</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-2xl w-full sm:w-auto">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Application Pending Admin Review</span>
                  </div>
                )}
              </div>
            </form>

            {/* Application Status Card */}
            {application && (
              <div className="rounded-3xl border border-brand-purple/10 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-fit space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-brand-purple/5 pb-4">
                  <span className="text-xs font-extrabold text-brand-purple uppercase tracking-wider">
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
                    <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-wider block">
                      Submitted Date
                    </span>
                    <span className="font-semibold text-brand-purple">
                      {formatDate(application.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-wider block">
                      License State & Number
                    </span>
                    <span className="font-semibold text-brand-purple">
                      {application.licenseState || "N/A"} -{" "}
                      {application.licenseNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-wider block">
                      License Expiry Date
                    </span>
                    <span className="font-semibold text-brand-purple">
                      {formatDate(
                        application.licenseExpiry ||
                          application.licenseExpiryDate ||
                          application.expiryDate ||
                          application.expirationDate,
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-brown/50 uppercase tracking-wider block">
                      Clinic
                    </span>
                    <span className="font-semibold text-brand-purple">
                      {application.clinicName || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Rejection / Admin Note Box */}
                {(() => {
                  const reasonText = getRejectionReason(application);
                  const showBox =
                    application.status === "Rejected" || Boolean(reasonText);
                  if (!showBox) return null;

                  const displayText =
                    reasonText ||
                    (application.status === "Rejected"
                      ? "Your application was not approved. Please review your license information and re-apply."
                      : "");

                  return (
                    <div
                      className={`rounded-2xl p-3.5 text-xs space-y-1 ${
                        application.status === "Rejected"
                          ? "bg-red-50 border border-red-200 text-red-800"
                          : "bg-amber-50 border border-amber-200 text-amber-800"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 ${
                            application.status === "Rejected"
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        />
                        <span>
                          {application.status === "Rejected"
                            ? "Rejection Reason"
                            : "Admin Note"}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed break-words">
                        {displayText}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
