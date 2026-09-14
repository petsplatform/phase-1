import { toast } from "react-hot-toast";

// Reusable minimal styling configuration
const toastStyle = {
  borderRadius: "12px",
  background: "#ffffff",
  color: "#0f2d52",
  border: "1px solid rgba(15, 45, 82, 0.08)",
  boxShadow: "0 10px 30px rgba(15, 45, 82, 0.06)",
  fontWeight: "600",
  fontSize: "14px",
};

export const showToast = {
  success: (message) => {
    toast.dismiss();
    toast.success(message, {
      style: toastStyle,
      iconTheme: {
        primary: "#58b947",
        secondary: "#ffffff",
      },
    });
  },

  error: (message) => {
    toast.dismiss();
    toast.error(message, {
      style: toastStyle,
    });
  },

  wishlist: (message, isActive = true) => {
    toast.dismiss();
    toast(message, {
      icon: isActive ? "❤️" : "🤍",
      style: toastStyle,
    });
  },
};
