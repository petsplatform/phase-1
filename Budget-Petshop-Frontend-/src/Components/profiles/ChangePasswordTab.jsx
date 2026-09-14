import { Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordTab({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showPass1,
  setShowPass1,
  showPass2,
  setShowPass2,
  passError,
  passSuccess,
  handleChangePassword
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-on-background border-b border-outline pb-4 mb-6">Change Password</h2>

      {passError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm font-bold mb-6">
          {passError}
        </div>
      )}
      {passSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-bold mb-6">
          {passSuccess}
        </div>
      )}

      <form onSubmit={handleChangePassword} className="max-w-md space-y-4 text-left">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showPass1 ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-outline-strong bg-white py-3 pl-4 pr-10 text-sm text-on-background outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
            />
            <button
              type="button"
              onClick={() => setShowPass1(!showPass1)}
              className="absolute inset-y-0 right-3 flex items-center text-charcoal-text/60 hover:text-on-background cursor-pointer"
            >
              {showPass1 ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPass2 ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-outline-strong bg-white py-3 pl-4 pr-10 text-sm text-on-background outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
            />
            <button
              type="button"
              onClick={() => setShowPass2(!showPass2)}
              className="absolute inset-y-0 right-3 flex items-center text-charcoal-text/60 hover:text-on-background cursor-pointer"
            >
              {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text mb-2">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-outline-strong bg-white py-3 px-4 text-sm text-on-background outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10"
          />
        </div>

        <button
          type="submit"
          className="rounded-full bg-secondary hover:bg-secondary/90 px-6 py-3 text-xs font-bold text-white transition cursor-pointer shadow-sm mt-4"
        >
          Change Password
        </button>
      </form>
    </div>
  )
}
