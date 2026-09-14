import React, { useEffect, useRef, useCallback } from "react";
import { LogOut } from "lucide-react";

/**
 * LogoutConfirmationModal
 * Props:
 *   isOpen    {boolean}  – whether the modal is visible
 *   onClose   {fn}       – called when user cancels / closes
 *   onConfirm {fn}       – called when user confirms logout
 *   isLoading {boolean}  – shows loading state during logout
 */
const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);

  /* ── Lock body scroll when open ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => cancelBtnRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* ── Keyboard focus trap ── */
  const handleKeyDown = useCallback((e) => {
    if (!isOpen || isLoading) return;
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Tab") {
      const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean);
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    }
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes vet-modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes vet-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .vet-modal-panel    { animation: vet-modal-in    0.28s cubic-bezier(0.16,1,0.3,1) forwards; }
        .vet-modal-backdrop { animation: vet-backdrop-in 0.22s ease forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className="vet-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(7,59,102,0.42)", backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)" }}
        onClick={(e) => { if (!isLoading && e.target === e.currentTarget) onClose(); }}
        aria-hidden="true"
      >
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          aria-describedby="logout-modal-desc"
          className="vet-modal-panel relative bg-white w-full flex flex-col p-8 items-center text-center gap-6"
          style={{
            maxWidth: "420px",
            borderRadius: "24px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100/60 flex items-center justify-center shrink-0">
            <LogOut className="w-6 h-6 text-[#FF2E54]" />
          </div>

          {/* Title + Description */}
          <div className="flex flex-col gap-3">
            <h2
              id="logout-modal-title"
              className="font-heading font-black text-xl text-[#102A43] tracking-tight leading-tight"
            >
              Confirm Logout
            </h2>
            <p
              id="logout-modal-desc"
              className="text-xs md:text-sm text-[#66788A] leading-relaxed max-w-[340px] mx-auto font-semibold"
            >
              Are you sure you want to log out of your account? You will need to verify your email again next time.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 w-full">
            {/* Cancel Button */}
            <button
              ref={cancelBtnRef}
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center py-3.5 px-6 rounded-xl text-xs sm:text-sm font-extrabold text-[#627D98] bg-[#F4FAFD] hover:bg-[#EAF5FC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#087BC1]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            {/* Yes, Logout Button */}
            <button
              ref={confirmBtnRef}
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-xs sm:text-sm font-extrabold text-white transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF2E54]/30 disabled:opacity-60 disabled:cursor-not-allowed bg-[#FF2E54] hover:bg-[#E02446]"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Logging Out...</span>
                </>
              ) : (
                <span>Yes, Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogoutConfirmationModal;
