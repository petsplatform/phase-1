import React, { useState } from "react";
import {
  FileText, Upload, CheckCircle2, AlertCircle, Loader2,
  Trash2, ArrowLeft, ChevronRight
} from "lucide-react";
import ProductImage from "../Common/ProductImage";

const PrescriptionUploadStep = ({
  cart = [],
  prescriptions = {},
  onUploadPrescription,
  onRemovePrescription,
  onNext,
  onBack,
  uploadingMap = {},
  errorMap = {},
}) => {
  const rxItems = cart.filter(
    (item) => item.prescriptionRequired || item.product?.prescriptionRequired
  );

  const [dragActiveMap, setDragActiveMap] = useState({});

  const handleDrag = (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveMap((prev) => ({ ...prev, [itemId]: true }));
    } else if (e.type === "dragleave") {
      setDragActiveMap((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDrop = (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveMap((prev) => ({ ...prev, [itemId]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadPrescription(itemId, e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (itemId, e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadPrescription(itemId, e.target.files[0]);
    }
  };


  const uploadedCount = rxItems.filter(
    (item) => Boolean(prescriptions[item.productId || item.id])
  ).length;

  const allUploaded = uploadedCount === rxItems.length && rxItems.length > 0;

  return (
    <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6 md:p-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-[#EAF5FC] flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-[#0874C9]" />
        </div>
        <div>
          <h2 className="font-heading font-black text-xl text-[#102A43]">
            Upload Veterinarian Prescription
          </h2>
          <p className="text-xs text-[#627D98]">
            Federal law requires a valid veterinary prescription before dispensing regulated pet medications.
          </p>
        </div>
      </div>


      {/* Progress status */}
      <div className="flex items-center justify-between bg-[#F7FAFC] border border-[#D9E8F2] rounded-2xl px-4 py-3 mb-6">
        <span className="text-xs font-bold text-[#102A43]">
          Prescription Verification Status
        </span>
        <span
          className={`text-xs font-extrabold px-3 py-1 rounded-full ${
            allUploaded
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {uploadedCount} of {rxItems.length} Products Documented
        </span>
      </div>

      {/* List of prescription-required products */}
      <div className="space-y-6">
        {rxItems.map((item) => {
          const itemKey = item.productId || item.id;
          const rxData = prescriptions[itemKey];
          const isUploading = uploadingMap[itemKey];
          const errorMsg = errorMap[itemKey];
          const isDragActive = dragActiveMap[itemKey];

          return (
            <div
              key={itemKey}
              className="border border-[#D9E8F2] rounded-2xl p-4 md:p-5 bg-white transition-all shadow-xs"
            >
              {/* Product header */}
              <div className="flex items-center gap-4 mb-4 pb-3 border-b border-[#F0F6FA]">
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  product={item}
                  className="w-14 h-14 rounded-xl object-cover border border-[#D9E8F2] bg-[#F7FAFC] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      Rx Required
                    </span>
                    {item.sku && (
                      <span className="text-[10px] text-[#627D98] font-mono">
                        SKU: {item.sku}
                      </span>
                    )}
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#102A43] truncate mt-1">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#627D98]">
                    Qty: {item.quantity} {item.selectedVariantName ? `• ${item.selectedVariantName}` : ""}
                  </p>
                </div>
              </div>

              {/* Upload Dropzone or Success Box */}
              {rxData ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900 truncate">
                          {rxData.filename || "Prescription Document"}
                        </span>
                        <span className="text-[10px] font-extrabold bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full">
                          Uploaded
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        {rxData.size ? `${rxData.size} • ` : ""}Ready for pharmacist review
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200/60">
                    <button
                      type="button"
                      onClick={() => onRemovePrescription(itemKey)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove prescription file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragEnter={(e) => handleDrag(itemKey, e)}
                  onDragOver={(e) => handleDrag(itemKey, e)}
                  onDragLeave={(e) => handleDrag(itemKey, e)}
                  onDrop={(e) => handleDrop(itemKey, e)}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDragActive
                      ? "border-[#0874C9] bg-[#EAF5FC]"
                      : errorMsg
                      ? "border-red-300 bg-red-50/30"
                      : "border-[#D9E8F2] bg-[#F7FAFC] hover:border-[#0874C9]/60 hover:bg-white"
                  }`}
                >
                  <input
                    type="file"
                    id={`rx-input-${itemKey}`}
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => handleFileSelect(itemKey, e)}
                    className="hidden"
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-2 gap-2">
                      <Loader2 className="w-7 h-7 text-[#0874C9] animate-spin" />
                      <span className="text-xs font-bold text-[#102A43]">
                        Uploading prescription file...
                      </span>
                    </div>
                  ) : (
                    <label
                      htmlFor={`rx-input-${itemKey}`}
                      className="flex flex-col items-center justify-center cursor-pointer py-1"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white border border-[#D9E8F2] shadow-xs flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5 text-[#0874C9]" />
                      </div>
                      <p className="text-xs font-bold text-[#102A43] mb-1">
                        Click to upload or drag & drop prescription file
                      </p>
                      <p className="text-[11px] text-[#627D98]">
                        PDF, JPG, PNG, or WEBP up to 10MB
                      </p>
                    </label>
                  )}

                  {errorMsg && (
                    <p className="text-xs text-red-500 font-semibold mt-3 flex items-center justify-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errorMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#F0F6FA]">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto border border-[#D9E8F2] text-[#627D98] hover:text-[#102A43] font-bold text-sm px-6 py-3 rounded-2xl hover:bg-[#F7FAFC] transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Delivery Address
        </button>

        <button
          type="button"
          onClick={onNext}
          className="w-full sm:w-auto bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition-colors shadow-md shadow-[#0874C9]/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          Continue to Payment
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PrescriptionUploadStep;
