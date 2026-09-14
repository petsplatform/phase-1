import React from 'react';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PawIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.8 1.5 3 3 3s3-1.2 3-3c0-1.66-1.34-3-3-3z" />
    <circle cx="7.2" cy="10" r="1.8" />
    <circle cx="10.2" cy="7" r="1.8" />
    <circle cx="13.8" cy="7" r="1.8" />
    <circle cx="16.8" cy="10" r="1.8" />
  </svg>
);

export default function ConfirmLogoutModal() {
  const { logout, showLogoutConfirm, setShowLogoutConfirm } = useAuth() || {};
  const navigate = useNavigate();

  if (!showLogoutConfirm) return null;

  const handleConfirm = () => {
    setShowLogoutConfirm(false);
    navigate('/');
    setTimeout(() => {
      logout();
    }, 50);
  };

  const handleCancel = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-text/45 backdrop-blur-xs transition-opacity duration-300"
        onClick={handleCancel}
      />

      {/* Modal Box */}
      <div className="relative bg-white rounded-[28px] max-w-sm w-full p-8 shadow-2xl border border-brand-border/40 text-center z-10 transform transition-all duration-300 scale-100 animate-fade-in-up">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Icons Overlay Stack */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Soft pink circular container */}
            <div className="w-16 h-16 rounded-[20px] bg-brand-coral/5 flex items-center justify-center text-brand-coral">
              <LogOut size={24} />
            </div>
            {/* Small purple circle with white paw print */}
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-brand-text border-2 border-white flex items-center justify-center text-white">
              <PawIcon className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-heading font-black text-xl text-brand-text mb-2.5">
          Confirm Logout
        </h3>

        {/* Description Message */}
        <p className="font-sans text-xs text-brand-muted leading-relaxed mb-8 px-2">
          Are you sure you want to log out? You'll need to enter your email and verification code to access your account again.
        </p>

        {/* Actions Button Row */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 h-11 border border-brand-border hover:bg-brand-bg/40 text-brand-text rounded-xl font-heading font-black text-xs transition-colors cursor-pointer"
          >
            No, Stay Here
          </button>
          
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 h-11 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-xl font-heading font-black text-xs transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
          >
            Yes, Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
