import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sections } from "../../utils/Legel/legel";
export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen text-brand-purple pb-20 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFF7EF 0%, #FAF6FE 50%, #FFFDFB 100%)",
      }}
    >
      {/* Decorative background vectors/orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-brand-peach/10 blur-[100px] sm:blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] rounded-full bg-brand-purple/5 blur-[120px] sm:blur-[160px] pointer-events-none"></div>

      {/* Navigation / Header Area */}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Side - Breadcrumb */}
          <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] flex items-center gap-1.5">
            <Link to="/" className="hover:text-brand-purple transition-colors">
              Home
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />

            <Link
              to="/privacy-policy"
              className="hover:text-brand-purple transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 text-left animate-in fade-in duration-500">
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-brand-purple leading-tight mb-4">
          Privacy Policy
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-brand-brown/65 mt-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-peach" />
            Last Updated: July 13, 2026
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#a855f7]" />
            HIPAA-grade Pet Confidentiality
          </span>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {/* Intro Card */}
        <div className="bg-white/70 backdrop-blur-md border border-brand-purple/10 rounded-[14px] p-6 sm:p-8 shadow-sm mb-8 text-left">
          <p className="text-xs sm:text-sm font-semibold text-brand-brown/85 leading-relaxed">
            At <strong>Happy PetRx</strong>, your pet's wellness is our top
            priority—and that includes safeguarding the personal, veterinary,
            and prescription information you share with us. This Privacy Policy
            details how we collect, verify, process, and secure your
            information. By using our website and pharmacy services, you consent
            to the practices described below.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-brand-purple/10 hover:border-brand-purple/15 rounded-[14px] p-6 sm:p-8 transition-all duration-300 shadow-sm text-left flex gap-5 items-start"
              >
                <div className="w-10 h-10 rounded-2xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-extrabold text-brand-purple mb-2">
                    {section.title}
                  </h3>
                  <p className="text-xs sm:text-[13.5px] text-brand-brown/80 leading-relaxed font-semibold">
                    {section.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
