import React, { createContext, useContext } from "react";
import { ShoppingCart, Heart, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const showNotification = (
    message,
    type = "success",
    product = null,
    actionLink = null,
  ) => {
    // Dismiss existing notifications to satisfy the "only show one time" criteria
    toast.dismiss();

    const toastOptions = {
      duration: 4000,
      style: {
        border: "1px solid #eee4d6",
        padding: "12px 16px",
        color: "#1d2823",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        borderRadius: "16px",
        fontSize: "13px",
        fontWeight: "700",
        boxShadow: "0 16px 40px rgba(28,40,33,0.12)",
        maxWidth: "380px",
      },
    };

    // Render the message content with potential Action link
    const content = (
      <div className="flex flex-col gap-0.5 text-left">
        <span className="leading-snug">{message}</span>
        {actionLink && (
          <Link
            to={actionLink.to}
            className="text-[#8a72c7] font-black hover:underline uppercase text-[10px] tracking-wider mt-1 block select-none cursor-pointer"
            onClick={() => toast.dismiss()}
          >
            {actionLink.label}
          </Link>
        )}
      </div>
    );

    // Map custom icons to types using lucide-react icons
    switch (type) {
      case "cart":
      case "cart-bulk":
        toast.success(content, {
          ...toastOptions,
          icon: <ShoppingCart size={18} className="text-primary" />,
        });
        break;
      case "wishlist-add":
        toast.success(content, {
          ...toastOptions,
          icon: <Heart size={18} fill="#e8546a" className="text-[#e8546a]" />,
        });
        break;
      case "wishlist-remove":
        toast(content, {
          ...toastOptions,
          icon: <Heart size={18} className="text-neutral-400" />,
        });
        break;
      case "error":
        toast.error(content, {
          ...toastOptions,
          icon: <AlertCircle size={18} className="text-rose-500" />,
        });
        break;
      default:
        toast.success(content, {
          ...toastOptions,
          icon: <CheckCircle2 size={18} className="text-[#176b59]" />,
        });
        break;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Toaster
        position="top-right"
        containerStyle={{
          top: 24,
          right: 24,
        }}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}
