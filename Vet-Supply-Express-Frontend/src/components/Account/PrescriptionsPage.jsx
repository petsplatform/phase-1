import React, { useState, useEffect, useContext } from "react";
import {
  FileText, Upload, Clock, CheckCircle2, AlertCircle,
  Plus, X, Eye, MessageSquare, PawPrint
} from "lucide-react";
import AccountLayout from "./AccountLayout";
import { AppContext } from "../../context/AppContext";

const STATUS_CONFIG = {
  Pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3.5 h-3.5" /> },
  "Under Review": { color: "bg-blue-50 text-blue-700 border-blue-200", icon: <Eye className="w-3.5 h-3.5" /> },
  Approved: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  Rejected: { color: "bg-red-50 text-red-700 border-red-200", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const DEMO_REVIEW_NOTES = [
  "Prescription is valid. Approved for dispensing.",
  "Under pharmacist review — typically completed within 24 hours.",
  "Additional documentation required. Please contact clinic support.",
];

const PrescriptionsPage = () => {
  const { addToast } = useContext(AppContext);
  const [requests, setRequests] = useState(() => {
    try { return JSON.parse(localStorage.getItem("vet_prescriptions") || "[]"); }
    catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ petName: "", medicine: "", notes: "", fileName: "" });
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem("vet_prescriptions", JSON.stringify(requests));
  }, [requests]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: "File must be JPG, PNG, or PDF format." }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: "File size must be 10MB or smaller." }));
        return;
      }
      setForm(f => ({ ...f, fileName: file.name }));
      setErrors(prev => ({ ...prev, file: null }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const allowed = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        setErrors(prev => ({ ...prev, file: "File must be JPG, PNG, or PDF format." }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: "File size must be 10MB or smaller." }));
        return;
      }
      setForm(f => ({ ...f, fileName: file.name }));
      setErrors(prev => ({ ...prev, file: null }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    const petVal = form.petName.trim();
    if (!petVal) {
      nextErrors.petName = "Pet name is required.";
    } else if (petVal.length < 2 || petVal.length > 50) {
      nextErrors.petName = "Pet name must be between 2 and 50 characters.";
    }

    const medVal = form.medicine.trim();
    if (!medVal) {
      nextErrors.medicine = "Medicine / Product name is required.";
    } else if (medVal.length < 2 || medVal.length > 100) {
      nextErrors.medicine = "Medicine name must be between 2 and 100 characters.";
    }

    if (form.notes && form.notes.trim().length > 300) {
      nextErrors.notes = "Notes cannot exceed 300 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      addToast({ title: "Validation Error", message: "Please correct the highlighted fields before submitting.", type: "error" });
      return;
    }
    const newRequest = {
      id: `RX-${Date.now().toString(36).toUpperCase()}`,
      petName: form.petName.trim(),
      medicine: form.medicine.trim(),
      notes: form.notes.trim(),
      fileName: form.fileName || null,
      status: "Pending",
      submittedAt: new Date().toISOString(),
      pharmacistNote: null,
    };
    setRequests(prev => [newRequest, ...prev]);
    setForm({ petName: "", medicine: "", notes: "", fileName: "" });
    setErrors({});
    setShowForm(false);
    addToast({ title: "Request Submitted", message: "Your prescription request is under review.", type: "cart" });
  };

  const simulateReview = (id) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const statuses = ["Under Review", "Approved", "Rejected"];
      const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
      return {
        ...r,
        status: nextStatus,
        pharmacistNote: DEMO_REVIEW_NOTES[Math.floor(Math.random() * DEMO_REVIEW_NOTES.length)],
      };
    }));
  };

  const deleteRequest = (id) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    addToast({ title: "Request Removed", message: "Prescription request has been deleted.", type: "wishlist" });
  };

  return (
    <AccountLayout title="Prescription Requests" subtitle="Submit and track veterinary prescription approvals.">
      <div className="flex justify-end mb-5">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {requests.length === 0 && !showForm ? (
        <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm p-16 text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#EAF5FC] flex items-center justify-center">
            <FileText className="w-10 h-10 text-[#9FB3C8]" />
          </div>
          <h3 className="font-heading font-black text-xl text-[#102A43]">No prescription requests</h3>
          <p className="text-sm text-[#627D98] max-w-xs">Submit your veterinary prescriptions for quick pharmacist approval and dispensing.</p>
          <button onClick={() => setShowForm(true)} className="mt-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 cursor-pointer">
            Submit Prescription
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
            return (
              <div key={req.id} className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm overflow-hidden hover:border-[#0874C9]/30 transition-all duration-200">
                <div className="bg-[#F7FAFC] border-b border-[#D9E8F2] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8]">Request ID</p>
                      <p className="font-heading font-bold text-sm text-[#0874C9]">{req.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8]">Submitted</p>
                      <p className="text-xs font-bold text-[#102A43]">{new Date(req.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cfg.color}`}>
                    {cfg.icon} {req.status}
                  </span>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl px-4 py-2.5">
                      <PawPrint className="w-4 h-4 text-[#9FB3C8]" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8]">Pet Name</p>
                        <p className="text-sm font-bold text-[#102A43]">{req.petName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl px-4 py-2.5">
                      <FileText className="w-4 h-4 text-[#9FB3C8]" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8]">Medicine</p>
                        <p className="text-sm font-bold text-[#102A43]">{req.medicine}</p>
                      </div>
                    </div>
                  </div>

                  {req.fileName && (
                    <div className="flex items-center gap-2 text-xs text-[#627D98] bg-[#EAF5FC] border border-[#0874C9]/20 rounded-xl px-4 py-2">
                      <Upload className="w-3.5 h-3.5 text-[#0874C9]" />
                      <span className="font-semibold text-[#0874C9] truncate">{req.fileName}</span>
                    </div>
                  )}

                  {req.notes && (
                    <p className="text-xs text-[#627D98] bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl px-4 py-2">{req.notes}</p>
                  )}

                  {req.pharmacistNote && (
                    <div className="flex gap-2 bg-[#EAF5FC] border border-[#0874C9]/20 rounded-xl px-4 py-3">
                      <MessageSquare className="w-4 h-4 text-[#0874C9] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-[#0874C9] mb-1">Pharmacist Note</p>
                        <p className="text-xs text-[#102A43] font-semibold">{req.pharmacistNote}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {req.status === "Pending" && (
                      <button onClick={() => simulateReview(req.id)} className="text-xs font-bold text-[#0874C9] hover:bg-[#EAF5FC] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                        Simulate Review
                      </button>
                    )}
                    <button onClick={() => deleteRequest(req.id)} className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ml-auto">
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#D9E8F2] overflow-hidden">
            <div className="bg-gradient-to-r from-[#0B2D4F] to-[#0874C9] px-6 py-4 flex items-center justify-between">
              <h3 className="font-heading font-black text-white text-lg">New Prescription Request</h3>
              <button onClick={() => setShowForm(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              {[
                { label: "Pet Name *", key: "petName", placeholder: "Buddy", type: "text" },
                { label: "Medicine / Product *", key: "medicine", placeholder: "Apoquel 16mg — 30 tablets", type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] block mb-1.5">{label}</label>
                  <input
                    value={form[key]}
                    onChange={e => {
                      setForm(f => ({ ...f, [key]: e.target.value }));
                      if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }));
                    }}
                    placeholder={placeholder}
                    type={type}
                    className={`w-full bg-[#F7FAFC] border ${
                      errors[key] ? "border-red-400 bg-red-50/40 focus:border-red-500" : "border-[#D9E8F2] focus:border-[#0874C9]"
                    } focus:ring-2 focus:ring-[#0874C9]/20 rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8]`}
                  />
                  {errors[key] && <p className="text-[11px] font-bold text-red-500 mt-1">{errors[key]}</p>}
                </div>
              ))}

              {/* File upload */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] block mb-1.5">Upload Prescription (Optional)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl px-6 py-8 text-center transition-all cursor-pointer ${
                    errors.file
                      ? "border-red-400 bg-red-50/40"
                      : dragging
                        ? "border-[#0874C9] bg-[#EAF5FC]"
                        : "border-[#D9E8F2] hover:border-[#0874C9]/50 hover:bg-[#F7FAFC]"
                  }`}
                >
                  <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${errors.file ? "text-red-500" : dragging ? "text-[#0874C9]" : "text-[#9FB3C8]"}`} />
                  {form.fileName ? (
                    <p className="text-sm font-bold text-[#0874C9]">{form.fileName}</p>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#627D98]">Drag & drop or click to upload</p>
                      <p className="text-xs text-[#9FB3C8] mt-1">JPG, PNG, PDF up to 10 MB</p>
                    </>
                  )}
                </div>
                {errors.file && <p className="text-[11px] font-bold text-red-500 mt-1">{errors.file}</p>}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] block mb-1.5">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => {
                    setForm(f => ({ ...f, notes: e.target.value }));
                    if (errors.notes) setErrors(prev => ({ ...prev, notes: null }));
                  }}
                  placeholder="e.g. Refill request, dosage notes, vet contact..."
                  rows={3}
                  className={`w-full bg-[#F7FAFC] border ${
                    errors.notes ? "border-red-400 bg-red-50/40 focus:border-red-500" : "border-[#D9E8F2] focus:border-[#0874C9]"
                  } focus:ring-2 focus:ring-[#0874C9]/20 rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all placeholder:text-[#9FB3C8] resize-none`}
                />
                {errors.notes && <p className="text-[11px] font-bold text-red-500 mt-1">{errors.notes}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmit} className="flex-1 bg-[#0874C9] hover:bg-[#0B2D4F] text-white font-bold py-3 rounded-xl transition-all cursor-pointer">
                  Submit Request
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 border border-[#D9E8F2] text-[#627D98] font-bold py-3 rounded-xl transition-all cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
};

export default PrescriptionsPage;
