import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, ShoppingCart, Heart } from "lucide-react";

const Toast = ({ id, title, message, type, image, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 3500; // 3.5 seconds
    const interval = 10;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    if (progress <= 0) {
      onClose(id);
    }
  }, [id, onClose, progress]);

  // Determine styling color and icon based on type
  let themeColor = "#0874C9"; // Default blue
  let Icon = CheckCircle;
  let progressBg = "bg-[#0874C9]";

  if (type === "cart") {
    themeColor = "#0874C9";
    Icon = ShoppingCart;
    progressBg = "bg-[#0874C9]";
  } else if (type === "wishlist") {
    themeColor = "#F28C18";
    Icon = Heart;
    progressBg = "bg-[#F28C18]";
  } else if (type === "error") {
    themeColor = "#D32F2F";
    Icon = AlertCircle;
    progressBg = "bg-red-500";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-white border border-[#D9E8F2] shadow-xl rounded-2xl p-4 flex gap-3 relative overflow-hidden transition-all duration-300 transform translate-y-0 scale-100 max-w-sm w-full mx-auto md:mx-0 select-none text-left"
    >
      {/* Icon section */}
      <div className="flex-shrink-0 mt-0.5" style={{ color: themeColor }}>
        <Icon className="w-5 h-5 stroke-[2]" />
      </div>

      {/* Content section */}
      <div className="flex-grow flex gap-3 min-w-0">
        {image && (
          <img
            src={image}
            alt="Product thumbnail"
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#D9E8F2]"
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-heading font-extrabold text-sm text-[#102A43] truncate">
            {title}
          </span>
          <p className="text-xs text-[#627D98] leading-relaxed break-words">
            {message}
          </p>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-[#627D98] hover:text-[#102A43] transition-colors self-start p-0.5 rounded-lg hover:bg-[#F7FAFC] cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F7FAFC]">
        <div
          className={`h-full ${progressBg} transition-all ease-linear`}
          style={{ width: `${progress}%`, transitionDuration: "10ms" }}
        />
      </div>
    </div>
  );
};

export default Toast;
