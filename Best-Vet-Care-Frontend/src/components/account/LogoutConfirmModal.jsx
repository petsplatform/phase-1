const LogoutConfirmModal = ({ open, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#122a50]/55 px-4" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-[0_24px_70px_rgba(18,42,80,0.28)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 17 15 12l-5-5M15 12H3M21 3v18h-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2 id="logout-confirm-title" className="mt-4 text-xl font-extrabold text-[#122a50]">
          Logout from your account?
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
          You will need to login again to view your dashboard, orders, wishlist, and saved addresses.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#17345f1a] px-5 py-3 text-sm font-extrabold text-[#17345f] transition-colors hover:bg-[#f8f1df]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-red-700"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
