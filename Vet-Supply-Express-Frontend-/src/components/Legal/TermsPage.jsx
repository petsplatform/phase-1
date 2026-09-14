import React from "react";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, HelpCircle, ChevronRight } from "lucide-react";

const TermsPage = () => {
  return (
    <div className="relative bg-[#F8FAFC] min-h-screen text-[#102A43] font-manrope selection:bg-[#18A9E5]/30 text-left py-16 md:py-20">
      <div className="container-custom max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-10 text-xs font-bold text-[#627D98] flex items-center gap-1.5 uppercase tracking-wider">
          <Link to="/" className="hover:text-[#087BC1] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9FB3C8]" />
          <span className="text-[#102A43]">Terms & Conditions</span>
        </div>

        {/* HERO TITLE */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#087BC1]/20 bg-[#EAF5FC] text-[#087BC1] text-xs font-extrabold uppercase tracking-wider mb-6">
            <FileText className="w-4 h-4" />
            <span>Service Agreement</span>
          </div>
          <h1 className="font-jakarta font-extrabold text-4xl text-[#073B66] tracking-tight leading-[1.15]">
            Terms & <span className="text-[#087BC1]">Conditions</span>
          </h1>
          <p className="text-sm sm:text-base text-[#66788A] mt-5 leading-relaxed font-semibold">
            Last Updated: July 2026. Welcome to VetSupplyExpress. By using our website or pharmacy services, you agree to comply with the terms set forth below.
          </p>
        </div>

        {/* TERMS CONTENT LAYOUT */}
        <div className="bg-white border border-[#D9E8F2] rounded-3xl p-6 md:p-10 shadow-xs flex flex-col gap-8">
          
          {/* Card Intro Block */}
          <div className="p-5 bg-[#F8FAFC] border border-[#D9E8F2]/60 rounded-2xl flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-[#087BC1] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-jakarta font-extrabold text-sm sm:text-base text-[#073B66]">Important Legal Notice</h3>
              <p className="text-xs sm:text-sm text-[#66788A] mt-1.5 leading-relaxed font-semibold">
                Please read these terms carefully before accessing or using our clinic portal or pharmacy. Accessing any portion of our store constitutes acceptance of these terms.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
              <span>Account Credentials & Security</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              Users registering an account (including clinic profiles, veterinarians, and individual pet owners) must provide accurate, up-to-date information. You are solely responsible for protecting password confidentiality and restricting access to unauthorized employees or third parties.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
              <span>Prescription Requirements & Refills</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              Under federal laws, VetSupplyExpress requires a valid prescription issued by a licensed veterinarian before dispensing prescription drugs. Refill orders are subject to prescription expiration parameters and quantity restrictions authorized by your clinical practitioner.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span>
              <span>Pricing & Payment Authorizations</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              Prices for products and pharmacy supplies are subject to change without notice. By submitting a checkout order, you authorize VetSupplyExpress to charge your configured payment method for the full order amount, applicable taxes, and logistics/cold-chain fees.
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">4</span>
              <span>Limitation of Liability</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              VetSupplyExpress is not liable for any direct, indirect, incidental, or consequential damages resulting from product misuse, improper clinic administration, cold-chain handling deviations after delivery, or transit delays out of our immediate control.
            </p>
          </section>

          {/* Section 5 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">5</span>
              <span>Updates to Terms</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              We reserve the right to revise these Terms & Conditions at our discretion. Changes will take effect immediately upon being posted on this portal. Continued use of our pharmacy services constitutes acceptance of revised terms.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsPage;
