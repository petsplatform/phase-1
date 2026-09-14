import React from "react";
import { Link } from "react-router-dom";
import { policiesData } from "../../utils/policiesData";
import { ChevronRight } from "lucide-react";

function PrivacyPolicyPage() {
  const data = policiesData.privacy;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#1d2823] font-sans selection:bg-secondary/20 pb-24">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <header className="w-full pt-12  pb-8">

          <div className="mx-auto max-w-[1440px]">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider  mb-6">
              <Link to="/" className="hover:text-white  transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="font-semibold text-secondary">Privacy Policy</span>
            </div>
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-secondary">— Legal</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight  md:text-5xl lg:text-7xl">
            Privacy Policy<span>.</span>
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed font-light text-charcoal-text md:text-lg">
            {data.lastUpdated}. We take your privacy seriously — here's exactly what we collect, why we collect it, and how we keep it safe.
          </p>
        </header>

        {/* Full Width Divider */}
        <hr className="relative left-1/2 w-dvw max-w-none -translate-x-1/2 border-0 border-t border-[#D7D0C6]" />
        <main className="w-full py-12 md:py-16">
          <div className="space-y-12 max-w-4xl">
            <div className="prose max-w-4xl">
              <p className="text-base leading-7 text-charcoal-text mb-8">
                {data.introduction}
              </p>
            </div>

            {data.sections.map((section) => (
              <section key={section.id} className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {section.title}
                </h2>

                <p className="text-base leading-7 text-charcoal-text">
                  {section.content}
                </p>

                {section.bullets && (
                  <ul className="mt-4 space-y-3 pl-5 list-disc text-base leading-7 text-charcoal-text">
                    {section.bullets.map((bullet, idx) => {
                      const splitBullet = bullet.split(":");
                      if (splitBullet.length > 1) {
                        return (
                          <li key={idx} className="marker:text-[#8a72c7]">
                            <strong>{splitBullet[0]}:</strong>
                            {splitBullet.slice(1).join(":")}
                          </li>
                        );
                      }
                      return (
                        <li key={idx} className="marker:text-[#8a72c7]">
                          {bullet}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}

            {/* Questions section at the bottom */}
            <div className="mt-16 pt-8 border-t border-outline/40">
              <h3 className="text-lg font-bold text-[#102B2B] mb-3">Have questions about our privacy practices?</h3>
              <p className="text-base text-charcoal-text leading-relaxed">
                Our compliance team is here to assist. Contact us via email at{" "}
                <a href="mailto:privacy@budgetpetshop.com" className="font-semibold text-primary hover:underline transition">
                  privacy@budgetpetshop.com
                </a>
              </p>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
