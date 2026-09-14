import React, { useContext } from "react";
import { AppContext } from "../../context/AppContext";
import Toast from "./Toast";

const ToastContainer = () => {
  const { toasts, removeToast } = useContext(AppContext);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 md:top-6 left-4 right-4 md:left-auto md:right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            image={toast.image}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
