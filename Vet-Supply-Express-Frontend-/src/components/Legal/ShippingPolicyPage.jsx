import React from "react";
import { Link } from "react-router-dom";
import { Truck, ShieldCheck, Clock, MapPin, ChevronRight } from "lucide-react";

const ShippingPolicyPage = () => {
  return (
    <div className="relative bg-[#F8FAFC] min-h-screen text-[#102A43] font-manrope selection:bg-[#18A9E5]/30 text-left py-16 md:py-20">
      <div className="container-custom max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-10 text-xs font-bold text-[#627D98] flex items-center gap-1.5 uppercase tracking-wider">
          <Link to="/" className="hover:text-[#087BC1] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9FB3C8]" />
          <span className="text-[#102A43]">Shipping & Delivery Policy</span>
        </div>

        {/* HERO TITLE */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#087BC1]/20 bg-[#EAF5FC] text-[#087BC1] text-xs font-extrabold uppercase tracking-wider mb-6">
            <Truck className="w-4 h-4" />
            <span>Shipping Operations</span>
          </div>
          <h1 className="font-jakarta font-extrabold text-4xl text-[#073B66] tracking-tight leading-[1.15]">
            Shipping & <span className="text-[#087BC1]">Delivery</span>
          </h1>
          <p className="text-sm sm:text-base text-[#66788A] mt-5 leading-relaxed font-semibold">
            We deliver prescription medications, cold-chain items, and clinic supplies securely right to your door. Learn more about our schedules and rates.
          </p>
        </div>

        {/* SHIPPING POLICY CONTENT */}
        <div className="bg-white border border-[#D9E8F2] rounded-3xl p-6 md:p-10 shadow-xs flex flex-col gap-8">
          
          {/* Cold-Chain Highlight Panel */}
          <div className="p-6 bg-[#EAF5FC]/50 border border-[#087BC1]/15 rounded-2xl flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EAF5FC] text-[#087BC1] flex items-center justify-center shrink-0 border border-[#087BC1]/10">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-jakarta font-extrabold text-sm sm:text-base text-[#073B66]">Strict Cold-Chain Packaging Standards</h3>
              <p className="text-xs sm:text-sm text-[#66788A] mt-1.5 leading-relaxed font-semibold">
                To guarantee medication efficacy, all temperature-sensitive items (like insulin or vaccines) are shipped in thermal containers packed with custom gel-packs. Cold-chain shipments are processed exclusively Monday through Thursday to prevent transit packages from stalling in carrier centers over weekends.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
              <span>Order Processing Times</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              Orders for standard items are processed within 24 hours. Prescription orders undergo clinical evaluation, taking 24-48 business hours to verify. Orders submitted after 2:00 PM EST or over weekends will begin processing on the following business day.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
              <span>Shipping Rates & Thresholds</span>
            </h2>
            <div className="pl-8 flex flex-col gap-3">
              <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold">
                Shipping rates are calculated automatically at checkout according to delivery type:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-[#D9E8F2] rounded-xl text-left bg-slate-50">
                  <h4 className="font-extrabold text-[#073B66] text-xs uppercase tracking-wider">Standard Shipping</h4>
                  <p className="text-lg font-black text-[#087BC1] mt-1">FREE <span className="text-xs text-[#627D98] font-bold">on orders over $49</span></p>
                  <p className="text-[11px] text-[#66788A] mt-1 font-semibold">Otherwise: Flat fee of $5.99. Takes 2-5 business days.</p>
                </div>
                <div className="p-4 border border-[#D9E8F2] rounded-xl text-left bg-slate-50">
                  <h4 className="font-extrabold text-[#073B66] text-xs uppercase tracking-wider">Expedited Cold-Chain</h4>
                  <p className="text-lg font-black text-[#F28A16] mt-1">$14.99 <span className="text-xs text-[#627D98] font-bold">fixed fee</span></p>
                  <p className="text-[11px] text-[#66788A] mt-1 font-semibold">Mandatory for temperature-sensitive drugs. Delivered in 1-2 business days.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span>
              <span>Delivery Restrictions</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              We ship to addresses within the United States. We cannot ship temperature-sensitive cold-chain items or heavy clinic products to P.O. Box addresses or military APO/FPO addresses due to carrier temperature-safety regulations.
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-3">
            <h2 className="font-jakarta font-extrabold text-lg sm:text-xl text-[#073B66] flex items-center gap-2">
              <span className="text-xs font-black bg-[#EAF5FC] text-[#087BC1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">4</span>
              <span>Tracking Shipment Status</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold pl-8">
              A dispatch notification containing carrier tracking details (via FedEx, UPS, or USPS) is emailed immediately when your shipment leaves our pharmacy. You can monitor shipping status through the email tracking links or from your account orders dashboard.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
