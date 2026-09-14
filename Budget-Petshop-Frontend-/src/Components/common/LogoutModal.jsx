import React, { useEffect } from "react";
import { LogOut, X } from "lucide-react";

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white/95 rounded-[32px] p-6 border border-[#e7ddd0] shadow-[0_24px_60px_rgba(28,40,33,0.12)] relative text-center transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a8f88] hover:text-[#1d2823] p-1.5 rounded-full hover:bg-neutral-100 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Icon Header */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#rose-50] text-[#e8546a] mb-5 border border-red-100 shadow-[0_8px_20px_rgba(232,84,106,0.15)] bg-rose-50 animate-pulse">
          <LogOut size={22} className="mr-0.5" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-extrabold text-[#1d2823] mb-2 leading-tight">
          Confirm Logout
        </h3>

        {/* Subtext */}
        <p className="text-xs text-charcoal-text/90 leading-relaxed mb-6 px-2">
          Are you sure you want to log out? You'll need to enter your email and password to access your account again.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-outline-strong hover:bg-surface-soft py-3 text-xs font-bold text-charcoal-text transition hover:border-[#d7cbbe] cursor-pointer shadow-sm active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 rounded-full text-white py-3 text-xs font-extrabold bg-[#e8546a] hover:bg-[#d43f54] transition cursor-pointer shadow-md shadow-rose-200 hover:shadow-none active:scale-95"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
}
