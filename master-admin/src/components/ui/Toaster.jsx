import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { onToast } from "../../lib/toast";

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

const styles = {
  error: "border-red-200 bg-red-50 text-red-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

function getToastTitle(toast) {
  const type = toast.type || "info";
  const title = String(toast.title || "").trim();
  if (type === "error") {
    if (!title || /backend\s+error|validation\s+error/i.test(title)) {
      return "Error";
    }
  }
  return title || (type === "error" ? "Error" : "Notice");
}

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return onToast((toast) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nextToast = {
        id,
        title: getToastTitle(toast),
        message: toast.message,
        type: toast.type || "info",
        duration: toast.duration ?? 4500,
      };

      setToasts((current) => [...current, nextToast].slice(-4));

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, nextToast.duration);
    });
  }, []);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg shadow-black/10 ${styles[toast.type] || styles.info}`}
            >
              <Icon size={20} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-5">{toast.title}</p>
                {toast.message && (
                  <p className="mt-1 break-words text-sm leading-5 opacity-85">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-md p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

