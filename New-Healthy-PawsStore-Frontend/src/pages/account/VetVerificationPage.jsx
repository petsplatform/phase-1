import { useState, useEffect } from "react";
import { accountApi } from "../../api/accountApi";
import { useToast } from "../../context/ToastContext";
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

function normalizeApplicationStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "approved") return "Approved";
  if (value === "rejected") return "Rejected";
  if (value === "expired") return "Expired";
  if (value === "pending") return "Pending";
  return status || "";
}

function getRejectionReason(application = {}) {
  const source = application || {};
  const reason =
    source.rejectionReason ||
    source.rejectReason ||
    source.rejectedReason ||
    source.rejection_note ||
    source.rejectionNote ||
    source.statusReason ||
    source.remarks ||
    source.reason ||
    source.adminNote ||
    source.admin_notes ||
    source.reviewNote ||
    source.review?.reason ||
    source.review?.note ||
    source.verification?.rejectionReason ||
    "";

  return String(reason || "").trim();
}

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
    phone: String(application.phone || "").replace(/\D/g, "").slice(0, 10),
    email: application.email || "",
    document: null,
  };
}

function normalizeVetApplication(application = {}) {
  return {
    ...application,
    status: normalizeApplicationStatus(application.status),
    rejectionReason: getRejectionReason(application),
  };
}

function canEditApplication(application) {
  return !application || !application.status || ["Rejected", "Expired"].includes(application.status);
}

function getApplicationDocumentUrl(application = {}) {
  const source = application || {};
  return (
    source.documentUrl ||
    source.licenseDocumentUrl ||
    source.licenseUrl ||
    source.document ||
    ""
  );
}

export default function VetVerificationPage() {
  const { showToast } = useToast();
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canApply = canEditApplication(application);
  const existingDocumentUrl = getApplicationDocumentUrl(application);
  const rejectionReason = getRejectionReason(application);

  useEffect(() => {
    let active = true;
    accountApi
      .getVetVerification()
      .then((data) => {
        if (active) {
          if (data && data.status) {
            const nextApplication = normalizeVetApplication(data);
            setApplication(nextApplication);
            setForm(canEditApplication(nextApplication) ? getVetApplicationForm(nextApplication) : emptyForm);
          } else {
            setApplication(null);
            setForm(emptyForm);
          }
        }
      })
      .catch(() => {
        if (active) {
          setApplication(null);
          setForm(emptyForm);
        }
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

    if (!file && (!application || !application.status)) {
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
      showToast("Please fix the validation errors in the form.", "error");
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const saved = await accountApi.submitVetVerification(
        form,
        Boolean(application && application.status)
      );
      setApplication(normalizeVetApplication(saved));
      setForm(emptyForm);
      showToast("Vet verification application submitted successfully!", "success");
    } catch (error) {
      showToast(
        error.payload?.message || error.message || "Unable to submit verification application.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Header */}
      <div className="rounded-[16px] border border-borderSoft bg-white p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-sageLight text-secondaryDark shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-[20px] font-extrabold text-secondaryDark">
              Vet Verification
            </h1>
            <p className="text-[12px] font-semibold text-muted mt-0.5">
              Apply for licensed veterinarian purchasing access and verification credentials.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-[16px] border border-borderSoft bg-white p-8 text-center text-[13px] font-bold text-muted shadow-card">
          <Loader2 className="mx-auto mb-2 size-6 animate-spin text-secondaryDark" />
          <p>Loading verification status...</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col justify-between rounded-[16px] border border-borderSoft bg-white p-6 sm:p-8 shadow-card"
          >
            <div>
              <h2 className="text-[17px] font-extrabold text-secondaryDark">
                Become a Verified Veterinarian
              </h2>
              <p className="mb-6 mt-1 text-[12px] font-medium text-muted">
                Submit your practice license and contact details below for admin approval.
              </p>

              <div className="grid gap-5 sm:grid-cols-2">
                {[
                  ["fullName", "Full Name", "Dr. Jane Doe", 50],
                  ["clinicName", "Clinic Name", "Healthy Paws Veterinary Clinic", 100],
                  ["licenseNumber", "License Number", "VET-12345678", 30],
                  ["licenseState", "License State", "California", 50],
                  ["phone", "Phone Number", "10 digit phone number", 10],
                  ["email", "Email Address", "vet@clinic.com", 100],
                ].map(([name, label, placeholder, maxLen]) => (
                  <div key={name} className="space-y-1 text-left">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                      {label} <span className="text-error">*</span>
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
                          ? "border-error focus:border-error"
                          : "border-borderSoft focus:border-secondaryDark"
                      } px-3.5 py-2.5 text-[13px] font-semibold text-textMain placeholder-muted/40 focus:outline-none disabled:bg-sageLight/50 disabled:cursor-not-allowed transition-colors`}
                    />
                    {errors[name] && (
                      <span className="text-[10px] font-bold text-error mt-1 block">
                        {errors[name]}
                      </span>
                    )}
                  </div>
                ))}

                {/* Expiry Date */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                    License Expiry Date <span className="text-error">*</span>
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
                        ? "border-error focus:border-error"
                        : "border-borderSoft focus:border-secondaryDark"
                    } px-3.5 py-2.5 text-[13px] font-semibold text-textMain focus:outline-none disabled:bg-sageLight/50 disabled:cursor-not-allowed transition-colors`}
                  />
                  {errors.licenseExpiry && (
                    <span className="text-[10px] font-bold text-error mt-1 block">
                      {errors.licenseExpiry}
                    </span>
                  )}
                </div>

                {/* Document Upload */}
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
                    Upload Veterinary License <span className="text-error">*</span>
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
                        ? "border-error"
                        : "border-borderSoft"
                    } px-3.5 py-2 text-[12px] font-semibold text-textMain file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-extrabold file:bg-sageLight file:text-secondaryDark hover:file:bg-sageLight/80 focus:outline-none disabled:bg-sageLight/50 disabled:cursor-not-allowed transition-colors`}
                  />
                  {errors.document && (
                    <span className="text-[10px] font-bold text-error mt-1 block">
                      {errors.document}
                    </span>
                  )}
                  {!form.document && existingDocumentUrl && (
                    <a
                      href={existingDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex text-[10px] font-bold text-secondaryDark underline"
                    >
                      Existing license document on file
                    </a>
                  )}
                </div>
              </div>

              {form.document && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-borderSoft bg-sageLight/40 px-3 py-1.5 text-[12px] font-bold text-textMain">
                  <FileText size={16} className="text-secondaryDark shrink-0" />
                  <span className="truncate max-w-[200px]">{form.document.name}</span>
                  <span className="text-[10px] text-muted">
                    ({(form.document.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
              )}
              {application?.status === "Rejected" && (
                <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-left">
                      <h4 className="text-[13px] font-extrabold text-rose-900">
                        Application Needs Revision
                      </h4>
                      <p className="text-[12px] font-semibold text-rose-700 mt-0.5">
                        Your previous application was not approved. Please review your details and reapply below.
                      </p>
                      {rejectionReason && (
                        <div className="mt-2 pt-2 border-t border-rose-200/80">
                          <span className="text-[10px] font-extrabold uppercase text-rose-800 block">
                            Reason for Rejection:
                          </span>
                          <p className="text-[12px] font-bold text-rose-900 mt-0.5">
                            {rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-borderSoft/60 pt-5">
              <button
                type="submit"
                disabled={!canApply || submitting}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-secondaryDark px-6 text-[13px] font-extrabold text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : application && application.status ? (
                  "Update Application"
                ) : (
                  "Submit Application"
                )}
              </button>

              {application && application.status === "Approved" && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-[12px] font-extrabold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={16} />
                  <span>Verified Veterinarian</span>
                </div>
              )}
            </div>
          </form>

          {/* Status Sidebar */}
          <div className="space-y-4">
            <div className="rounded-[16px] border border-borderSoft bg-white p-5 shadow-card">
              <h3 className="text-[14px] font-extrabold text-secondaryDark mb-3 border-b border-borderSoft/60 pb-3">
                Application Status
              </h3>

              {application && application.status ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-muted">Current Status:</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
                        statusStyles[application.status] || statusStyles.Pending
                      }`}
                    >
                      {application.status === "Approved" && <CheckCircle2 size={13} />}
                      {application.status === "Pending" && <Clock size={13} />}
                      {application.status === "Rejected" && <XCircle size={13} />}
                      <span>{application.status}</span>
                    </span>
                  </div>

                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted">Submitted:</span>
                      <span className="font-bold text-textMain">{formatDate(application.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted">License State:</span>
                      <span className="font-bold text-textMain">{application.licenseState || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-muted">License #:</span>
                      <span className="font-bold text-textMain">{application.licenseNumber || "N/A"}</span>
                    </div>
                  </div>

                  {application.status === "Rejected" && rejectionReason && (
                    <div className="rounded-xl bg-amber-50 p-3 text-[12px] font-semibold text-amber-800 border border-amber-200">
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <AlertCircle size={14} className="text-amber-600 shrink-0" />
                        <span>Rejection Reason</span>
                      </div>
                      <p className="text-[11px] leading-snug">{rejectionReason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[12px] font-semibold text-muted">
                  No active vet verification application found. Fill out the form to apply for veterinarian credentials.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
