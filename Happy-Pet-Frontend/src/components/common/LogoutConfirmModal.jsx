import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X, PawPrint } from "lucide-react";

export default function LogoutConfirmModal({ isOpen, onConfirm, onCancel }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after mount
      const timer = setTimeout(() => setAnimate(true), 10);
      // Disable body scroll when modal is open
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "unset";
      };
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        animate
          ? "bg-black/50 backdrop-blur-md"
          : "bg-transparent backdrop-blur-none"
      }`}
      onClick={onCancel}
    >
      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md p-8 bg-brand-cream border border-brand-purple/10 rounded-[2rem] shadow-2xl transition-all duration-300 transform ${
          animate
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 rounded-full text-brand-brown/40 hover:text-brand-brown/80 hover:bg-brand-purple/5 transition-all duration-200 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative Top Icon */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-[1.25rem] bg-red-50 border border-red-100">
          <LogOut className="w-8 h-8 text-red-500" />
          <span className="absolute -bottom-1 -right-1 bg-brand-purple text-brand-cream p-1.5 rounded-xl border-2 border-brand-cream shadow-sm">
            <PawPrint className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Modal Text */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-extrabold text-brand-purple mb-3 tracking-tight">
            Confirm Logout
          </h3>
          <p className="text-sm leading-relaxed text-brand-brown/70">
            Are you sure you want to log out? You'll need to enter your email
            and password to access your account again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 px-6 rounded-2xl border-2 border-brand-purple/15 text-sm font-bold text-brand-purple hover:bg-brand-purple/5 hover:border-brand-purple/30 active:scale-98 transition-all duration-200 cursor-pointer text-center"
          >
            No, Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-500/20 active:scale-98 transition-all duration-200 cursor-pointer text-center"
          >
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
