import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  X,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  FileCheck,
  Trash2,
  Loader2,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { usePrescriptionModal } from "../../utils/prescriptionContext";
import { prescriptionApi } from "../../api/prescriptionApi";
import { authApi } from "../../api/authApi";

export default function PrescriptionModal() {
  const navigate = useNavigate();
  const {
    isOpen,
    modalConfig,
    prescriptionData,
    closePrescriptionModal,
    savePrescription,
    clearPrescription,
  } = usePrescriptionModal();

  const fileInputRef = useRef(null);

  // Form states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [vetClinic, setVetClinic] = useState("");
  const [vetName, setVetName] = useState("");
  const [vetPhone, setVetPhone] = useState("");
  const [isUploadLater, setIsUploadLater] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prescriptionData.filePreview) {
        setFilePreview(prescriptionData.filePreview);
      }
      setVetClinic(prescriptionData.vetClinic || "");
      setVetName(prescriptionData.vetName || "");
      setVetPhone(prescriptionData.vetPhone || "");
      setIsUploadLater(Boolean(prescriptionData.isUploadLater));
    }
  }, [isOpen, prescriptionData]);

  if (!isOpen) return null;

  const { actionType, product, quantity, title, subtitle, onConfirm } =
    modalConfig;

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const isLoggedIn = Boolean(authApi.getSession());

  const processFile = (file) => {
    if (!isLoggedIn) {
      toast.error("Please log in to your account to upload a prescription.", {
        icon: "🔒",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(
        "File size exceeds 10MB limit. Please upload a smaller file.",
      );
      return;
    }

    setSelectedFile(file);
    setIsUploadLater(false);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview("");
    }
    toast.success(`Selected file: ${file.name}`);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedFile(null);
    setFilePreview("");
    clearPrescription();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Prescription removed.");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please log in to your account to upload a prescription.", {
        icon: "🔒",
      });
      return;
    }

    if (!selectedFile && !prescriptionData.fileName && !filePreview) {
      toast.error("Please upload a prescription document first.");
      return;
    }

    let remotePrescriptionData = null;

    if (selectedFile) {
      try {
        setIsUploading(true);
        remotePrescriptionData =
          await prescriptionApi.uploadPrescription(selectedFile);
        toast.success("Prescription uploaded successfully!");
      } catch (error) {
        console.error("Prescription API upload failed:", error);
        let errMsg =
          error.response?.data?.message ||
          error.message ||
          "Failed to upload prescription. Please try again.";
        if (
          errMsg.toLowerCase().includes("authentication token") ||
          errMsg.toLowerCase().includes("unauthorized") ||
          error.response?.status === 401
        ) {
          errMsg = "Please log in to your account to upload a prescription.";
        }
        toast.error(errMsg, { icon: "🔒" });
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const fileName = selectedFile
      ? selectedFile.name
      : prescriptionData.fileName || "";
    const fileType = selectedFile
      ? selectedFile.type
      : prescriptionData.fileType || "";

    // Save prescription details
    const savedRxData = savePrescription({
      fileName,
      filePreview: filePreview || prescriptionData.filePreview || null,
      fileType,
      remoteData: remotePrescriptionData,
    });

    if (onConfirm && typeof onConfirm === "function") {
      onConfirm(savedRxData);
    }

    closePrescriptionModal();
  };

  // Determine dynamic modal copy
  const modalTitle = title || "Upload Your Prescription";
  const modalSubtitle =
    subtitle ||
    "Upload your prescription document or clinic details to process your pet pharmacy order.";

  const getActionButtonText = () => {
    if (actionType === "buy_now") {
      return "Confirm & Proceed to Buy Now";
    }
    if (actionType === "checkout") {
      return "Confirm & Proceed to Checkout";
    }
    return "Confirm & Add to Cart";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      {/* Glassmorphic Backdrop */}
      <div
        className="fixed inset-0 bg-brand-purple/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={closePrescriptionModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white border border-[#f0ebf8] rounded-[28px] shadow-2xl max-w-lg w-full p-6 sm:p-8 z-10 overflow-hidden text-left transform transition-all animate-in zoom-in-95 duration-200">
        {/* Subtle Decorative Glows */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand-peach/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-brand-purple/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closePrescriptionModal}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-brand-purple/5 text-brand-purple/60 hover:text-brand-purple hover:bg-brand-purple/10 flex items-center justify-center transition-all cursor-pointer outline-none"
          aria-label="Close prescription modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="flex items-start gap-4 mb-5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-purple/10 text-brand-purple flex items-center justify-center shrink-0 shadow-inner">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#a855f7] mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Happy Pet Rx Pharmacy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-brand-purple leading-tight">
              {modalTitle}
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-brand-brown/70 font-medium leading-relaxed mb-6">
          {modalSubtitle}
        </p>

        {/* Login Required Alert Banner */}
        {!isLoggedIn && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 mb-6 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Please log in to your account to upload a prescription.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                closePrescriptionModal();
                navigate("/login");
              }}
              className="text-xs font-extrabold text-white bg-brand-purple hover:bg-[#3a0038] px-3.5 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer transition-all"
            >
              Log In
            </button>
          </div>
        )}

        {/* Target Product Summary (If applicable) */}
        {product && (
          <div className="bg-[#FAF8FF] border border-[#f0ebf8] rounded-2xl p-3.5 mb-6 flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 rounded-xl object-cover border border-brand-purple/5 bg-white shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-extrabold text-brand-purple/60 uppercase tracking-wider block">
                Selected Item ({quantity}x)
              </span>
              <h4 className="text-xs font-extrabold text-brand-purple truncate">
                {product.name}
              </h4>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* File Upload Dropzone */}
          <div>
            <label className="block text-xs font-extrabold text-brand-purple uppercase tracking-wider mb-2">
              Upload Prescription Scan / Document
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 relative ${
                isDragging
                  ? "border-brand-purple bg-brand-purple/10"
                  : selectedFile || filePreview
                    ? "border-green-400 bg-green-50/50"
                    : "border-brand-purple/20 bg-[#FAF8FF] hover:border-brand-purple hover:bg-brand-purple/5"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile || filePreview || prescriptionData.fileName ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Prescription preview"
                        className="w-12 h-12 rounded-lg object-cover border border-green-300 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                        <FileCheck className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block mb-1">
                        Prescription Attached
                      </span>
                      <p className="text-xs font-bold text-brand-purple truncate">
                        {selectedFile?.name ||
                          prescriptionData.fileName ||
                          "prescription_file.pdf"}
                      </p>
                      {selectedFile && (
                        <p className="text-[10px] text-brand-brown/50 font-semibold">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveFile(e)}
                    className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0 z-20 cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-10 h-10 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center mb-2">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-brand-purple">
                    Click to browse or drag & drop prescription
                  </p>
                  <p className="text-[10px] text-brand-brown/50 font-medium mt-1">
                    Supports JPG, PNG, WEBP, or PDF (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={closePrescriptionModal}
              className="w-1/3 py-3.5 px-4 rounded-xl border border-[#e5ddf0] bg-[#faf8ff] text-brand-purple font-bold text-xs hover:bg-brand-purple/5 transition-all text-center cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="w-2/3 py-3.5 px-4 rounded-xl bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Prescription...</span>
                </>
              ) : (
                <>
                  <span>{getActionButtonText()}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
