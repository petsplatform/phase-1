import React from "react";

export default function ChangePasswordTab({
  passwordForm,
  setPasswordForm,
  handlePasswordChangeSubmit,
  isChangingPassword
}) {
  return (
    <div className="animate-in fade-in duration-300 text-left flex-grow flex flex-col justify-between">
      <div>
        <div className="border-b border-brand-purple/5 pb-5 mb-6">
          <h2 className="text-2xl font-display font-extrabold text-brand-purple tracking-tight">
            Change Password
          </h2>
          <p className="text-xs text-brand-brown/60 mt-1 font-semibold">
            Keep your account secure
          </p>
        </div>

        <form onSubmit={handlePasswordChangeSubmit} noValidate className="max-w-md space-y-5">
          <div>
            <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
              Old Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={50}
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#FCF9F6] border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-[16px] text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={50}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#FCF9F6] border border-brand-purple/10 hover:border-[#4B004B] focus:border-[#4B004B] rounded-[16px] text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={50}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#FCF9F6] border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-[16px] text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 text-brand-cream font-bold rounded-full transition-all duration-200 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? (
              <div className="w-5 h-5 border-2 border-brand-cream border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
