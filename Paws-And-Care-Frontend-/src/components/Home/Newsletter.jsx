import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Sparkles,
  Check,
  Heart,
  ShieldCheck,
  Gift,
  Award,
} from "lucide-react";

const PawIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.8 1.5 3 3 3s3-1.2 3-3c0-1.66-1.34-3-3-3z" />
    <circle cx="7.2" cy="10" r="1.8" />
    <circle cx="10.2" cy="7" r="1.8" />
    <circle cx="13.8" cy="7" r="1.8" />
    <circle cx="16.8" cy="10" r="1.8" />
  </svg>
);

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setIsSubscribed(true);
  };

  return (
    <section className="bg-brand-bg pt-12 pb-12 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-20 border-t border-brand-border/40 relative overflow-hidden select-none">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-1/2 left-[-100px] w-96 h-96 bg-brand-coral/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-brand-teal/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Floating Paw and Heart outlines */}
      <div className="absolute top-10 right-10 text-brand-teal/10 pointer-events-none rotate-12 hidden md:block">
        <PawIcon className="w-16 h-16" />
      </div>
      <div className="absolute bottom-10 left-10 text-brand-coral/10 pointer-events-none -rotate-12 hidden md:block">
        <Heart size={48} className="fill-current" />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Asymmetrical Layout Card */}
        <div className="relative bg-gradient-to-br from-brand-peach/40 via-[#FFEFE4] to-[#FFF6E9] border border-brand-border/80 rounded-[3rem] p-8 sm:p-12 lg:p-16 max-w-5xl mx-auto shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"></div>
        </div>
      </div>
    </section>
  );
}
