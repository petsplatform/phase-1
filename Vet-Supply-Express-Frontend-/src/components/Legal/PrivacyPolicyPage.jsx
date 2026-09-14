import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Eye, FileText, ChevronRight } from "lucide-react";

const PrivacyPolicyPage = () => {
  return (
    <div className="relative bg-[#F8FAFC] min-h-screen text-[#102A43] font-manrope selection:bg-[#18A9E5]/30 text-left py-16 md:py-20">
      <div className="container-custom max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-10 text-xs font-bold text-[#627D98] flex items-center gap-1.5 uppercase tracking-wider">
          <Link to="/" className="hover:text-[#087BC1] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9FB3C8]" />
          <span className="text-[#102A43]">Privacy Policy</span>
        </div>

        {/* HERO TITLE */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#087BC1]/20 bg-[#EAF5FC] text-[#087BC1] text-xs font-extrabold uppercase tracking-wider mb-6">
            <Lock className="w-4 h-4" />
            <span>Secure & Private</span>
          </div>
          <h1 className="font-jakarta font-extrabold text-4xl text-[#073B66] tracking-tight leading-[1.15]">
            Privacy <span className="text-[#087BC1]">Policy</span>
          </h1>
          <p className="text-sm sm:text-base text-[#66788A] mt-5 leading-relaxed font-semibold">
            Last Updated: July 2026. Your trust and privacy are paramount to us. Read how we collect, safeguard, and manage your clinical and personal data.
          </p>
        </div>

        {/* POLICY CONTENT LAYOUT */}
        <div className="bg-white border border-[#D9E8F2] rounded-3xl p-6 md:p-10 shadow-xs flex flex-col gap-8">
          
          {/* Card Intro Block */}
          <div className="p-5 bg-[#F8FAFC] border border-[#D9E8F2]/60 rounded-2xl flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-[#087BC1] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-jakarta font-extrabold text-sm sm:text-base text-[#073B66]">Clinical Data Protection Commitment</h3>
              <p className="text-xs sm:text-sm text-[#66788A] mt-1.5 leading-relaxed font-semibold">
                VetSupplyExpress is committed to keeping all patient prescriptions, clinic profiles, and veterinary diagnostics confidential. We utilize 256-bit encryption protocols to protect your medical details and personal records.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              We gather information necessary to verify veterinarian credentials, dispense prescriptions, and process orders safely. This includes:
            </p>
            <ul className="list-disc pl-14 text-xs sm:text-sm text-[#66788A] font-semibold flex flex-col gap-2">
              <li><strong>Personal Identifiers:</strong> Customer name, billing/shipping address, telephone numbers, and email address.</li>
              <li><strong>Clinical Records:</strong> Vet prescriptions, licensing numbers, clinic details, and veterinarian contacts.</li>
              <li><strong>Payment Data:</strong> Secure credit card tokens processed via payment partners (we do not store raw card numbers).</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
              <span>How We Use Your Data</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              Your clinical and address details are processed exclusively for service operations, specifically to:
            </p>
            <ul className="list-disc pl-14 text-xs sm:text-sm text-[#66788A] font-semibold flex flex-col gap-2">
              <li>Verify prescription authenticity with your veterinary clinic.</li>
              <li>Fulfill orders, dispatch cold-chain products, and handle returns.</li>
              <li>Provide regular account notifications, auto-refill updates, and emergency warnings.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span>
              <span>Information Sharing & Sourcing</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              We never sell your personal or veterinary details. We only share essential billing/shipping data with:
            </p>
            <ul className="list-disc pl-14 text-xs sm:text-sm text-[#66788A] font-semibold flex flex-col gap-2">
              <li>Expedited shipping couriers (specifically for temperature-sensitive shipping routes).</li>
              <li>Authorized state licensing boards to verify prescription verification requests.</li>
              <li>Secure compliance databases mandated by federal pharmacy regulations.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">4</span>
              <span>Cookies & Tracking Options</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              We use functional and analytical cookies to recognize login sessions, store cart items, and evaluate site metrics. You can choose to disable cookies through your personal browser settings, although certain shopping features may be limited.
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">5</span>
              <span>Your Access and Rights</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              You are entitled to access, rectify, or request deletion of your personal account files. To execute a profile cleanup or change notification parameters, access your Account Dashboard or email our support staff at <a href="mailto:support@vetsupplyexpress.com" className="text-[#087BC1] hover:underline font-bold">support@vetsupplyexpress.com</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
