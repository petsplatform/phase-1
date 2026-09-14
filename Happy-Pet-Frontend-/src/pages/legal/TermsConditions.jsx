import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { termssections } from "../../utils/Legel/legel";

export default function TermsConditions() {
  const navigate = useNavigate();
  const [activeSectionId, setActiveSectionId] = useState("accounts");

  // Set active section when scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
      },
    );

    termssections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      termssections.forEach((sec) => {
        const el = document.getElementById(sec.id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSectionId(id);
    }
  };

  return (
    <div className="min-h-screen text-brand-purple pb-28 bg-brand-cream/15 font-sans relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Side - Breadcrumb */}
          <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] flex items-center gap-1.5">
            <Link to="/" className="hover:text-brand-purple transition-colors">
              Home
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />

            <Link
              to="/terms-conditions"
              className="hover:text-brand-purple transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 text-left animate-in fade-in duration-500">
        <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-brand-purple leading-tight mb-4">
          Terms & Conditions
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

      {/* Main Split Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Panel: Sticky Contents Sidebar */}
          <div className="lg:col-span-4 text-left lg:sticky lg:top-24 self-start">
            <div className="text-[11px] font-extrabold text-brand-brown/40 tracking-widest uppercase mb-6 block pl-4">
              Contents
            </div>
            <nav className="flex flex-col gap-1">
              {termssections.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`flex items-center gap-4.5 w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                      isActive
                        ? "bg-brand-purple/5 text-brand-purple"
                        : "text-brand-brown/60 hover:text-brand-purple bg-transparent"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-extrabold transition-colors duration-300 ${
                        isActive ? "text-[#a855f7]" : "text-brand-brown/30"
                      }`}
                    >
                      {sec.num}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Panel: Content */}
          <div className="lg:col-span-8 text-left">
            {/* Intro text block */}
            <div className="pb-8 border-b border-brand-purple/5 mb-10">
              <p className="text-xs sm:text-sm font-semibold text-brand-brown/85 leading-relaxed">
                Welcome to Happy PetRx. By using our website and services, you
                agree to comply with and be bound by the following Terms &
                Conditions. Please read them carefully before placing an order.
              </p>
            </div>

            {/* termssections Flow */}
            <div className="space-y-12 sm:space-y-16">
              {termssections.map((sec) => (
                <div key={sec.id} id={sec.id} className="scroll-mt-28 group">
                  <div className="flex items-start gap-4 mb-3.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-brand-purple/15 leading-none transition-colors group-hover:text-brand-purple/25">
                      {sec.num}
                    </span>
                    <h2 className="text-lg sm:text-xl font-display font-extrabold text-brand-purple pt-0.5">
                      {sec.title}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-brand-brown/80 leading-relaxed font-semibold pl-10.5 sm:pl-12">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
