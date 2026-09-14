const ConfirmModal = ({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  loading = false,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="min-w-0 w-full max-w-[420px] rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-[0_24px_70px_rgba(18,42,80,0.28)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 9v4M12 17h.01M10.3 4.9 2.9 17.8A2 2 0 0 0 4.6 21h14.8a2 2 0 0 0 1.7-3.2L13.7 4.9a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h2 id="confirm-modal-title" className="mt-4 break-words text-xl font-extrabold text-[#122a50] [overflow-wrap:anywhere]">
          {title}
        </h2>
        <p className="mt-2 max-w-full break-words text-sm font-semibold leading-6 text-[#122a50b2] [overflow-wrap:anywhere]">
          {message}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[#17345f1a] px-5 py-3 text-sm font-extrabold text-[#17345f] transition-colors hover:bg-[#f8f1df] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
