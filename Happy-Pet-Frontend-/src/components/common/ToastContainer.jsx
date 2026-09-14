import React, { useEffect } from "react";
import { Toaster, useToasterStore, toast } from "react-hot-toast";

export default function ToastContainer() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    const visibleToasts = toasts.filter((t) => t.visible);
    if (visibleToasts.length > 1) {
      // Sort visible toasts by createdAt descending (newest first)
      const sorted = [...visibleToasts].sort((a, b) => b.createdAt - a.createdAt);
      // Dismiss all but the newest one (index 0)
      sorted.slice(1).forEach((t) => toast.dismiss(t.id));
    }
  }, [toasts]);

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#FFFFFF",
          color: "#4B004B", // brand-purple
          border: "1px solid rgba(75, 0, 75, 0.1)",
          borderRadius: "1.2rem",
          fontSize: "13px",
          fontWeight: "600",
          fontFamily: "Manrope, sans-serif",
          boxShadow: "0 12px 30px rgba(75, 0, 75, 0.08)",
          padding: "12px 20px",
        },
        success: {
          iconTheme: {
            primary: "#4B004B", // brand-purple
            secondary: "#FFF7EF", // brand-cream
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FFFFFF",
          },
        },
      }}
    />
  );
}

