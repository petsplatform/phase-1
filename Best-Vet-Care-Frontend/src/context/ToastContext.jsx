/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, TriangleAlert, X } from "lucide-react";

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const dismissTimerRef = useRef(null);

  const showToast = useCallback((message, type = "success") => {
    const id = ++toastId;

    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
    }

    setToasts([{ id, message, type }]);
    dismissTimerRef.current = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      dismissTimerRef.current = null;
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed right-4 top-5 z-[9999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3 sm:right-6"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-[0_12px_30px_rgba(18,42,80,0.14)] transition-all duration-300 ${
              toast.type === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : toast.type === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                toast.type === "error"
                  ? "bg-red-100 text-red-600"
                  : toast.type === "warning"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
              ) : toast.type === "warning" ? (
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.08em] opacity-65">
                {toast.type === "error" ? "Something went wrong" : toast.type === "warning" ? "Please note" : "Success"}
              </span>
              <span className="mt-1 block break-words text-sm font-semibold leading-5">
                {toast.message}
              </span>
            </span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
