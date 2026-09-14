import { motion } from "framer-motion";
import { PawPrint } from "lucide-react";

export default function Button({ children, variant = "primary", className = "" }) {
  const styles = {
    primary: "bg-orange text-white hover:bg-secondary",
    secondary: "bg-secondaryDark text-white hover:bg-primary",
    light: "bg-white text-secondaryDark hover:bg-card",
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-extrabold shadow-card transition-colors ${styles[variant]} ${className}`}
    >
      {children}
      <PawPrint size={15} fill="currentColor" />
    </motion.button>
  );
}
