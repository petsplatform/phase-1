import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { policiesData } from "../../utils/policiesData";
import { ChevronRight, HelpCircle } from "lucide-react";

function TermsConditionsPage() {
  const data = policiesData.terms;
  const [activeSectionId, setActiveSectionId] = useState("");
  const sectionRefs = useRef({});

  // Setup observer to detect active section on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    data.sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    // Set initial active section
    if (data.sections.length > 0) {
      setActiveSectionId(data.sections[0].id);
    }

    return () => {
      observer.disconnect();
    };
  }, [data.sections]);

  const handleScrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky headers if any
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSectionId(id);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-secondary/20 pb-24">

      {/* Dark Header Banner matching Image 2 */}
      <div className=" py-16 md:py-24 px-4 sm:px-6 lg:px-10 relative overflow-hidden">
        {/* Subtle decorative circles to match premium feel */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full -translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none" />

        <div className="mx-auto max-w-[1440px]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-6">
            <Link to="/" className="hover:text-white font-semibold text-black transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="font-semibold text-secondary">Terms & Conditions</span>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em]  mb-4">
            — Legal / T&C
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Terms <span className="font-normal text-secondary ">&</span> <span>Conditions<span>.</span></span>
          </h1>

          <p className="mt-6 text-base md:text-lg leading-relaxed font-light max-w-2xl">
            {data.lastUpdated}. Please read these terms carefully before placing an order or using any Budget PetShop service.
          </p>
        </div>
      </div>

      {/* Grid Content Layout with floating Contents list */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_2.8fr]">

          {/* Floating Sidebar Contents */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#102B2B]/60 mb-4">
                  Contents
                </h3>
                <nav className="space-y-1">
                  {data.sections.map((section, idx) => {
                    const numberStr = String(idx + 1).padStart(2, "0");
                    const isActive = activeSectionId === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleScrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-all duration-200 ${isActive
                          ? "bg-[#8a72c7]/10 text-[black] font-semibold border-l-2 border-[#8a72c7]"
                          : "text-[#1d2823]/70 hover:bg-[#102B2B]/5 hover:text-[#102B2B]"
                          }`}
                      >
                        <span className={`font-mono text-[10px] ${isActive ? "text-[#8a72c7]" : "text-[#1d2823]/40"}`}>
                          {numberStr}
                        </span>
                        <span className="truncate">
                          {section.title.replace(/^\d+\.\s*/, "")}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Legal Assistance Box */}
              <div className="rounded-xl border border-outline bg-white p-5 shadow-sm">
                <h4 className="text-xs font-bold text-[#102B2B] mb-2 flex items-center gap-2">
                  <HelpCircle size={14} className="text-[#8a72c7]" />
                  Need Help?
                </h4>
                <p className="text-[11px] text-charcoal-text leading-relaxed">
                  If you have questions regarding these terms, send an email to our support agents at support@budgetpetshop.com.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Sections */}
          <div className="space-y-16">
            <div className="prose max-w-none">
              <p className="text-base leading-7 text-charcoal-text">
                {data.introduction}
              </p>
            </div>

            <div className="space-y-12">
              {data.sections.map((section, idx) => {
                const numberStr = String(idx + 1).padStart(2, "0");
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 border-b border-outline/30 pb-10 last:border-0 last:pb-0"
                  >
                    <div className="grid gap-4 md:grid-cols-[60px_1fr]">
                      {/* Big Numeral */}
                      <span className="font-bold text-3xl md:text-4xl text-[#8a72c7]/30 tracking-tight leading-none">
                        {numberStr}
                      </span>

                      {/* Text details */}
                      <div className="space-y-3">
                        <h2 className="text-xl md:text-2xl font-bold  tracking-tight">
                          {section.title.replace(/^\d+\.\s*/, "")}
                        </h2>

                        <p className="text-base leading-7 text-charcoal-text">
                          {section.content}
                        </p>

                        {section.bullets && (
                          <ul className="mt-4 space-y-2.5 pl-5 list-disc text-base leading-7 text-charcoal-text">
                            {section.bullets.map((bullet, bIdx) => {
                              const parts = bullet.split(":");
                              if (parts.length > 1) {
                                return (
                                  <li key={bIdx} className="marker:text-[#8a72c7]">
                                    <strong className="text-[#102B2B]">{parts[0]}:</strong>
                                    {parts.slice(1).join(":")}
                                  </li>
                                );
                              }
                              return (
                                <li key={bIdx} className="marker:text-[#8a72c7]">
                                  {bullet}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default TermsConditionsPage;
