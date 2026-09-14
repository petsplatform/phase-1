import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const toastStyles = {
  success: "border-secondary/30 bg-white text-textMain",
  error: "border-error/30 bg-white text-textMain",
  info: "border-borderSoft bg-white text-textMain",
};

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nextToast = {
        id,
        message: message || "Something happened.",
        type: toastStyles[type] ? type : "info",
      };

      setToasts((current) => [nextToast, ...current].slice(0, 4));
      window.setTimeout(() => removeToast(id), 4200);
      return id;
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-4 top-4 z-[100] grid w-[min(92vw,360px)] gap-3"
      >
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type] || Info;

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_14px_34px_rgba(36,49,47,0.16)] ${toastStyles[toast.type]}`}
              role={toast.type === "error" ? "alert" : "status"}
            >
              <Icon
                size={19}
                className={toast.type === "error" ? "mt-0.5 shrink-0 text-error" : "mt-0.5 shrink-0 text-secondaryDark"}
              />
              <p className="min-w-0 flex-1 text-[13px] font-bold leading-relaxed">
                {toast.message}
              </p>
              <button
                type="button"
                aria-label="Close notification"
                onClick={() => removeToast(toast.id)}
                className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition hover:bg-sageLight hover:text-textMain"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}
