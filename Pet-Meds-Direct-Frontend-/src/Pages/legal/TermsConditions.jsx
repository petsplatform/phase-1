import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Scale, Clock, ArrowUp, CheckCircle, AlertTriangle } from "lucide-react";
import { termsData } from "../../data/legal";

export default function TermsConditions() {
  const [activeSection, setActiveSection] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Determine active section based on scroll
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      // Scroll to top button visibility
      setShowScrollTop(window.scrollY > 300);

      // Find active section
      for (const section of termsData.sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Trigger once on mount
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offsetTop = el.offsetTop - 120;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <div className="relative min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1200px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs sm:text-sm font-bold text-slate-500 text-left">
          <Link to="/" className="hover:text-primary-green transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-deep-navy">Terms & Conditions</span>
        </div>

        {/* Top Header Section */}
        <div className="text-left flex flex-col items-start mb-12 border-b border-slate-200 pb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-deep-navy bg-white border border-[#e5e9ec] shadow-xs mb-5">
            <Scale className="h-3.5 w-3.5 text-primary-green" /> Legal Agreement
          </span>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight leading-[1.15] mb-5">
            Terms & <span className="text-primary-green font-display">Conditions</span>
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-medical-teal" /> Last Updated: {termsData.lastUpdated}
            </span>
            <span className="h-1.5 w-1.5 bg-slate-300 rounded-full hidden sm:inline" />
            <span className="hidden sm:inline">Licensed Pharmacy Agreement</span>
          </div>

          <p className="mt-6 text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed max-w-4xl">
            {termsData.introduction}
          </p>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Sidebar Table of Contents */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-white border border-[#e5e9ec] rounded-3xl p-6 shadow-xs hidden lg:block text-left">
            <h3 className="font-display text-sm font-black text-deep-navy uppercase tracking-wider mb-5 pb-3 border-b border-slate-100">
              Table of Contents
            </h3>
            <nav className="space-y-1">
              {termsData.sections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                      isActive
                        ? "bg-primary-green/10 text-primary-green translate-x-1"
                        : "text-slate-600 hover:text-deep-navy hover:bg-slate-50"
                    }`}
                  >
                    <span>{section.title.split(". ")[1] || section.title}</span>
                    <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                      isActive ? "text-primary-green translate-x-0.5" : "text-slate-400 group-hover:text-deep-navy opacity-0 group-hover:opacity-100"
                    }`} />
                  </button>
                );
              })}
            </nav>

            {/* Quick Warning / Help Callout inside sidebar */}
            <div className="mt-8 p-4 bg-soft-mint rounded-2rem border border-primary-green/15">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-primary-green shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-deep-navy font-bold text-xs">Prescription Warning</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed mt-1 font-medium">
                    All prescription purchases require verification from a licensed vet before delivery.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Side Content Areas */}
          <main className="lg:col-span-8 space-y-12 text-left">
            {/* Scrollable list for mobile users */}
            <div className="lg:hidden bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
              <h3 className="font-display text-xs font-black text-deep-navy uppercase tracking-wider mb-3">
                Quick Navigation
              </h3>
              <div className="flex flex-wrap gap-2">
                {termsData.sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="py-1.5 px-3 bg-white border border-[#e5e9ec] rounded-lg text-xs font-bold text-slate-700 hover:border-primary-green/30"
                  >
                    {section.title.split(". ")[1] || section.title}
                  </button>
                ))}
              </div>
            </div>

            {termsData.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-32 border border-[#e5e9ec] bg-white rounded-[2rem] p-6 sm:p-8 transition-all hover:shadow-sm"
              >
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy mb-5 pb-3 border-b border-slate-100 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary-green shrink-0" />
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.map((p, idx) => (
                    <p key={idx} className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </main>
        </div>

        {/* Bottom Call to Action or Agreement notice */}
        <div className="mt-16 text-center max-w-xl mx-auto border-t border-slate-200 pt-12">
          <p className="text-slate-500 font-semibold text-xs sm:text-sm mb-4">
            Have questions about these terms or our pharmacy licensing?
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-deep-navy text-white hover:bg-primary-green font-bold text-sm tracking-wide transition-all shadow-md cursor-pointer"
          >
            Contact Legal Compliance
          </Link>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-primary-green text-white hover:bg-dark-green transition-all duration-300 shadow-lg cursor-pointer group ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
      </button>
    </div>
  );
}
