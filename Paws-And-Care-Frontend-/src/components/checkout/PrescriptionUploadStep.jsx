import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  File, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function PrescriptionUploadStep({
  items = [],
  prescriptions = {},
  onUpload,
  onRemove,
  onContinue,
  onBack,
  validationError = ''
}) {
  const [dragActiveId, setDragActiveId] = useState(null);

  const getItemId = (item) => item.id || item.productId || item._id;

  const handleDragOver = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(itemId);
  };

  const handleDragLeave = (e, itemId) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragActiveId === itemId) {
      setDragActiveId(null);
    }
  };

  const handleDrop = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const itemId = getItemId(item);
    setDragActiveId(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (onUpload) {
        onUpload(item, file);
      }
    }
  };

  const handleFileChange = (e, item) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onUpload) {
        onUpload(item, file);
      }
    }
  };

  const allItemsUploaded = items.every((item) => {
    const itemId = getItemId(item);
    const pres = prescriptions[itemId];
    return pres && (pres.status === 'success' || pres.url);
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text mb-1 flex items-center gap-2">
          <FileText size={22} className="text-brand-teal" />
          <span>Upload Prescription</span>
        </h2>
        <p className="font-sans text-xs sm:text-sm text-brand-muted">
          The following product(s) require a valid prescription from a licensed veterinarian. Please upload a clear copy for each item.
        </p>
      </div>

      {/* Global Validation Error Banner */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-heading font-semibold animate-shake">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Prescription Items List */}
      <div className="space-y-5">
        {items.map((item, idx) => {
          const itemId = getItemId(item);
          const presState = prescriptions[itemId] || { status: 'idle' };
          const isUploaded = presState.status === 'success' || Boolean(presState.url);
          const isUploading = presState.status === 'uploading';
          const isError = presState.status === 'error';
          const isDragging = dragActiveId === itemId;

          return (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl border transition-all duration-200 ${
                isUploaded 
                  ? 'border-emerald-300 bg-emerald-50/40' 
                  : isError 
                    ? 'border-red-300 bg-red-50/30'
                    : isDragging 
                      ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/20' 
                      : 'border-brand-border bg-white shadow-xs'
              }`}
            >
              {/* Item Info Header */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-brand-border/40 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.product?.image || item.image || '/vite.svg'}
                    alt={item.product?.name || item.name}
                    className="w-14 h-14 object-cover rounded-xl border border-brand-border/40 bg-white shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-sm text-brand-text truncate">
                      {item.product?.name || item.name}
                    </h3>
                    <p className="font-sans text-xs text-brand-muted mt-0.5">
                      Qty: {item.quantity} {item.option && `· ${item.option}`}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-heading font-bold bg-amber-100 text-amber-800 border border-amber-200/80 shrink-0">
                  <FileText size={13} className="text-amber-700" />
                  Prescription Required
                </span>
              </div>

              {/* Upload Zone / Status Display */}
              <div className="mt-4">
                {isUploaded ? (
                  /* UPLOADED SUCCESS STATE */
                  <div className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-xs text-brand-text truncate">
                            {presState.fileName || presState.file?.name || 'Prescription Uploaded'}
                          </span>
                          <span className="text-[10px] font-heading font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Verified
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-emerald-700 mt-0.5">
                          Prescription successfully uploaded & attached
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Change File Button */}
                      <label 
                        htmlFor={`file-input-change-${itemId}`} 
                        className="p-2 text-brand-muted hover:text-brand-teal hover:bg-brand-bg rounded-lg transition-colors cursor-pointer"
                        title="Change file"
                      >
                        <RefreshCw size={16} />
                        <input
                          id={`file-input-change-${itemId}`}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, item)}
                        />
                      </label>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemove && onRemove(itemId)}
                        className="p-2 text-brand-muted hover:text-brand-coral hover:bg-brand-coral/10 rounded-lg transition-colors"
                        title="Remove prescription"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : isUploading ? (
                  /* UPLOADING STATE */
                  <div className="flex items-center justify-center gap-3 p-6 bg-brand-bg/40 rounded-xl border border-brand-teal/30 text-brand-teal">
                    <Loader2 size={20} className="animate-spin text-brand-teal" />
                    <span className="font-heading font-bold text-xs">
                      Uploading prescription for {item.product?.name || item.name}...
                    </span>
                  </div>
                ) : isError ? (
                  /* ERROR STATE */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-700 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0 text-red-500" />
                        <span>{presState.error || 'Failed to upload prescription. Please try again.'}</span>
                      </div>
                    </div>
                    <label 
                      htmlFor={`file-input-retry-${itemId}`} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-heading font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      <UploadCloud size={14} />
                      <span>Try Uploading Again</span>
                      <input
                        id={`file-input-retry-${itemId}`}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, item)}
                      />
                    </label>
                  </div>
                ) : (
                  /* IDLE / DROPZONE UPLOAD STATE */
                  <label
                    htmlFor={`file-input-${itemId}`}
                    onDragOver={(e) => handleDragOver(e, itemId)}
                    onDragLeave={(e) => handleDragLeave(e, itemId)}
                    onDrop={(e) => handleDrop(e, item)}
                    className={`block border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none ${
                      isDragging 
                        ? 'border-brand-teal bg-brand-teal/10 scale-[1.01]' 
                        : 'border-brand-border hover:border-brand-teal/60 bg-brand-bg/20 hover:bg-white'
                    }`}
                  >
                    <input
                      id={`file-input-${itemId}`}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, item)}
                    />

                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center pointer-events-none">
                        <UploadCloud size={20} />
                      </div>

                      <div className="pointer-events-none">
                        <span className="font-heading font-bold text-xs text-brand-teal hover:underline">
                          Click to upload prescription
                        </span>
                        <span className="font-sans text-xs text-brand-muted"> or drag & drop file here</span>
                      </div>

                      <p className="font-sans text-[11px] text-brand-muted pointer-events-none">
                        Accepted formats: JPG, PNG, WEBP, PDF (Max 10MB)
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Step Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-brand-border/60">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-brand-border hover:bg-brand-bg text-brand-text font-heading font-bold text-xs sm:text-sm transition-all"
        >
          <ChevronLeft size={16} />
          <span>Back to Delivery Address</span>
        </button>

        <button
          type="button"
          onClick={onContinue}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all shadow-xs ${
            allItemsUploaded
              ? 'bg-brand-teal hover:bg-brand-deep-teal text-white cursor-pointer'
              : 'bg-brand-teal/80 hover:bg-brand-teal text-white cursor-pointer'
          }`}
        >
          <span>Continue to Payment</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
