import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  tone = "danger",
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-error text-white hover:bg-red"
      : "bg-secondaryDark text-white hover:bg-primaryDark";

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-textMain/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[430px] overflow-hidden rounded-[18px] border border-borderSoft bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 bg-sageLight px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-orange shadow-sm">
              <AlertTriangle size={22} />
            </span>
            <div>
              <h2
                id="confirm-modal-title"
                className="font-display text-[22px] font-extrabold leading-tight text-textMain"
              >
                {title}
              </h2>
              {message && (
                <p className="mt-2 text-[13px] font-semibold leading-relaxed text-muted">
                  {message}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-borderSoft bg-white text-textMain transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close confirmation"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-3 px-5 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-xl border border-borderSoft px-5 text-[14px] font-extrabold text-textMain transition hover:bg-sageLight disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 rounded-xl px-5 text-[14px] font-extrabold shadow-card transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
