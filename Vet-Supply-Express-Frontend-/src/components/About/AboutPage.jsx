import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  Lock,
  Headphones,
  Target,
  Eye,
  Star,
  CheckCircle,
  ArrowRight,
  BadgeCheck,
  Heart,
  Award,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

const AboutPage = () => {
  return (
    <div className="relative bg-[#F3F9FD] min-h-screen text-[#102A43] font-manrope selection:bg-[#18A9E5]/30">
      {/* SECTION 1: ABOUT HERO */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 lg:pb-36 bg-gradient-to-br from-white via-[#F3F9FD]/40 to-[#EBF5FB]/80 overflow-hidden">
        {/* Background Decorative SVG Speed & Motion Lines */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden select-none"
          aria-hidden="true"
        >
          <svg
            className="absolute w-full h-full text-[#087BC1]/5 opacity-60"
            viewBox="0 0 1440 800"
            fill="none"
          >
            {/* Speed motion curves */}
            <path
              d="M-100 200 C 400 250, 700 100, 1500 150"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="10 5"
              fill="none"
            />
            <path
              d="M-50 400 C 500 450, 800 200, 1600 300"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M0 600 C 600 550, 900 400, 1700 450"
              stroke="#F28A16"
              strokeOpacity="0.08"
              strokeWidth="4"
              strokeDasharray="15 5"
              fill="none"
            />
          </svg>
          <div className="absolute top-1/4 right-[10%] w-[300px] h-[300px] bg-[#18A9E5]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 left-[10%] w-[250px] h-[250px] bg-[#087BC1]/5 rounded-full blur-[80px]" />
        </div>

        <div className="container-custom relative z-10 text-center max-w-5xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F28A16] shadow-[0_0_8px_#F28A16]" />
            <span className="text-xs font-black tracking-widest text-[#087BC1] font-jakarta uppercase">
              OUR PURPOSE
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-jakarta font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#073B66] leading-[1.12] tracking-tight max-w-4xl mx-auto">
            Making Veterinary Care
            <br />
            <span className="bg-gradient-to-r from-[#087BC1] via-[#18A9E5] to-[#087BC1] bg-clip-text text-transparent">
              Easier, Faster and More Reliable.
            </span>
          </h1>

          {/* Description */}
          <p className="font-manrope text-base sm:text-lg md:text-xl text-[#66788A] leading-relaxed max-w-3xl mx-auto mt-6">
            VetSupplyExpress connects pet parents, veterinary clinics, and care
            professionals with trusted medicines, wellness products, diagnostic
            supplies, and everyday pet-care essentials.
          </p>

          {/* CTA Button */}
          <div className="mt-10">
            <Link
              to="/shop"
              className="group inline-flex items-center justify-center gap-2.5 bg-[#F28A16] hover:bg-[#d5750d] text-white font-bold text-base px-8 py-4 rounded-full transition-all duration-300 shadow-lg shadow-[#F28A16]/20 hover:shadow-[#F28A16]/35 hover:-translate-y-0.5"
            >
              <span>Explore Our Products</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: IMPACT STATISTICS */}
      <section className="relative -mt-16 z-20 px-4">
        <div className="container-custom max-w-5xl">
          <div className="bg-white border border-[#D9E8F2]/80 rounded-[28px] p-8 md:p-10 shadow-lg shadow-[#073B66]/5 relative">
            {/* Top orange detail accent dot */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-[#F28A16] rounded-full" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 items-center text-center">
              {/* Stat 1 */}
              <div className="flex flex-col items-center">
                <h3 className="font-jakarta font-black text-3xl sm:text-4xl text-[#073B66]">
                  10,000+
                </h3>
                <p className="text-xs sm:text-sm font-extrabold text-[#087BC1] uppercase tracking-wider mt-2">
                  Pets Supported
                </p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center border-l border-[#D9E8F2]/60 lg:border-l-1 lg:pl-2">
                <h3 className="font-jakarta font-black text-3xl sm:text-4xl text-[#073B66]">
                  1,000+
                </h3>
                <p className="text-xs sm:text-sm font-extrabold text-[#087BC1] uppercase tracking-wider mt-2">
                  Veterinary Products
                </p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center border-t border-[#D9E8F2]/60 pt-6 lg:pt-0 lg:border-t-0 lg:border-l lg:pl-2">
                <h3 className="font-jakarta font-black text-3xl sm:text-4xl text-[#073B66]">
                  4.9/5
                </h3>
                <p className="text-xs sm:text-sm font-extrabold text-[#087BC1] uppercase tracking-wider mt-2">
                  Customer Rating
                </p>
              </div>

              {/* Stat 4 */}
              <div className="flex flex-col items-center border-t border-[#D9E8F2]/60 pt-6 lg:pt-0 lg:border-t-0 lg:border-l lg:pl-2">
                <h3 className="font-jakarta font-black text-3xl sm:text-4xl text-[#073B66]">
                  24/7
                </h3>
                <p className="text-xs sm:text-sm font-extrabold text-[#087BC1] uppercase tracking-wider mt-2">
                  Care Guidance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: OUR STORY */}
      <section className="py-20 md:py-28 bg-white border-b border-[#D9E8F2]">
        <div className="container-custom max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Story Column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <span className="text-xs font-black tracking-widest text-[#087BC1] uppercase mb-3">
                OUR GENESIS
              </span>
              <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl text-[#073B66] mb-6 leading-tight">
                Built to Support Better Pet Health
              </h2>
              <div className="h-1 w-16 bg-[#F28A16] rounded-full mb-6" />

              <p className="font-manrope text-base text-[#66788A] leading-relaxed mb-6">
                VetSupplyExpress was created with a clear objective: to simplify
                and streamline access to trusted veterinary supplies, verified
                wellness products, prescription medicines, diagnostic tools, and
                professional clinic essentials.
              </p>
              <p className="font-manrope text-base text-[#66788A] leading-relaxed mb-8">
                We bridge the gap in supply networks, ensuring that veterinary
                clinics stay fully stocked with critical care assets, and pet
                families receive direct, safe, and expedited deliveries of
                health products. By maintaining close compliance standards and
                verified supplier relationships, we bring healthcare
                transparency directly to your doorstep.
              </p>

              {/* Trust highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-2">
                <div className="flex items-center gap-3 bg-[#F3F9FD] border border-[#087BC1]/10 px-5 py-3.5 rounded-2xl">
                  <BadgeCheck className="w-5 h-5 text-[#087BC1] shrink-0" />
                  <span className="text-sm font-bold text-[#073B66]">
                    Verified Veterinary Products
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-[#F3F9FD] border border-[#087BC1]/10 px-5 py-3.5 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-[#18A9E5] shrink-0" />
                  <span className="text-sm font-bold text-[#073B66]">
                    Carefully Selected Suppliers
                  </span>
                </div>
              </div>
            </div>

            {/* Right Commitment Card Column */}
            <div className="lg:col-span-5 relative">
              {/* Decorative side accent lines */}
              <div className="absolute -top-6 -right-6 w-24 h-24 border-t-2 border-r-2 border-[#18A9E5]/20 rounded-tr-3xl pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 border-b-2 border-l-2 border-[#F28A16]/20 rounded-bl-3xl pointer-events-none" />

              {/* Card container */}
              <div className="bg-gradient-to-br from-[#F3F9FD] to-[#EBF5FB] border border-[#D9E8F2] rounded-[28px] p-8 md:p-10 shadow-md">
                <div className="w-12 h-12 rounded-xl bg-white text-[#F28A16] flex items-center justify-center shadow-sm mb-6">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-jakarta font-extrabold text-2xl text-[#073B66] mb-4">
                  Our Commitment
                </h3>
                <p className="font-manrope text-sm text-[#66788A] leading-relaxed">
                  We focus on quality, responsible sourcing, reliable service,
                  and long-term pet wellness in every product and customer
                  experience. We treat every order with clinical-level precision
                  because we know how much your companion's care matters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: MISSION AND VISION */}
      <section className="py-20 md:py-28 bg-white border-y border-[#D9E8F2]">
        <div className="container-custom max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Card A: Mission (Dark Navy Layout) */}
            <div className="bg-[#073B66] text-white rounded-[28px] p-8 lg:p-12 shadow-lg relative overflow-hidden group">
              {/* Background gradient element */}
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#18A9E5]/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />

              <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#18A9E5] flex items-center justify-center mb-8">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="font-jakarta font-black text-2xl mb-4 text-white">
                Our Mission
              </h3>
              <p className="font-manrope text-sm text-[#F3F9FD]/80 leading-relaxed">
                To make reliable veterinary products and care essentials easier
                to access. We align the supply chain so clinics can thrive, and
                pet parents have quick access to verified medical supplies to
                keep their pets happy and healthy.
              </p>

              {/* Small orange detail bar */}
              <div className="w-10 h-1 bg-[#F28A16] mt-8 rounded-full" />
            </div>

            {/* Card B: Vision (White Glassmorphic Layout) */}
            <div className="bg-white border border-[#D9E8F2] text-[#102A43] rounded-[28px] p-8 lg:p-12 shadow-md relative overflow-hidden group hover:border-[#18A9E5]/30 transition-colors duration-300">
              {/* Background gradient element */}
              <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#087BC1]/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />

              <div className="w-14 h-14 rounded-2xl bg-[#FFF3E8] text-[#F28A16] flex items-center justify-center mb-8">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="font-jakarta font-black text-2xl mb-4 text-[#073B66]">
                Our Vision
              </h3>
              <p className="font-manrope text-sm text-[#66788A] leading-relaxed">
                To become a trusted destination for healthier pets, confident
                pet parents, and better-equipped clinics. We strive to set the
                standard for clinical supply safety, digital transparency, and
                dedicated customer-centric animal care.
              </p>

              {/* Small blue detail bar */}
              <div className="w-10 h-1 bg-[#087BC1] mt-8 rounded-full" />
            </div>
          </div>
        </div>
      </section>
      {/* SECTION 4: WHY CHOOSE US */}
      <section
        id="why-choose-us"
        className="py-20 md:py-28 bg-[#F3F9FD] relative overflow-hidden"
      >
        {/* Soft background shape */}
        <div className="absolute -right-20 top-1/4 w-[350px] h-[350px] bg-[#18A9E5]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="container-custom max-w-6xl relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black tracking-widest text-[#087BC1] uppercase mb-3 block">
              WHY VETSUPPLYEXPRESS
            </span>
            <h2 className="font-jakarta font-extrabold text-3xl sm:text-4xl text-[#073B66]">
              Why Pet Parents and Clinics Trust Us
            </h2>
            <div className="h-1.5 w-16 bg-[#F28A16] rounded-full mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="group bg-white border border-[#D9E8F2] rounded-[24px] p-7 flex flex-col h-full hover:border-[#18A9E5]/45 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#F3F9FD] text-[#087BC1] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <ShieldCheck className="w-6 h-6 relative z-10" />
                <div className="absolute inset-0 bg-[#F28A16]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-jakarta font-bold text-lg text-[#073B66] mb-3">
                Trusted Product Quality
              </h3>
              <p className="font-manrope text-xs text-[#66788A] leading-relaxed flex-grow">
                All medications and supplies are directly sourced from validated
                clinical manufacturers to guarantee safety and authenticity.
              </p>
              <div className="h-1 w-0 bg-[#F28A16] group-hover:w-full transition-all duration-300 mt-6 rounded-full" />
            </div>

            {/* Card 2 */}
            <div className="group bg-white border border-[#D9E8F2] rounded-[24px] p-7 flex flex-col h-full hover:border-[#18A9E5]/45 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#F3F9FD] text-[#18A9E5] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <Truck className="w-6 h-6 relative z-10" />
                <div className="absolute inset-0 bg-[#F28A16]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-jakarta font-bold text-lg text-[#073B66] mb-3">
                Fast and Reliable Delivery
              </h3>
              <p className="font-manrope text-xs text-[#66788A] leading-relaxed flex-grow">
                Equipped with clinical cold-chain packaging options and rapid
                courier services, keeping supplies viable and urgent medicines
                on time.
              </p>
              <div className="h-1 w-0 bg-[#F28A16] group-hover:w-full transition-all duration-300 mt-6 rounded-full" />
            </div>

            {/* Card 3 */}
            <div className="group bg-white border border-[#D9E8F2] rounded-[24px] p-7 flex flex-col h-full hover:border-[#18A9E5]/45 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#F3F9FD] text-[#F28A16] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <Lock className="w-6 h-6 relative z-10" />
                <div className="absolute inset-0 bg-[#F28A16]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-jakarta font-bold text-lg text-[#073B66] mb-3">
                Secure Shopping Experience
              </h3>
              <p className="font-manrope text-xs text-[#66788A] leading-relaxed flex-grow">
                Our Level-1 PCI compliant checkout preserves payment data with
                strict 256-bit encryption pipelines and secure medical record
                storage.
              </p>
              <div className="h-1 w-0 bg-[#F28A16] group-hover:w-full transition-all duration-300 mt-6 rounded-full" />
            </div>

            {/* Card 4 */}
            <div className="group bg-white border border-[#D9E8F2] rounded-[24px] p-7 flex flex-col h-full hover:border-[#18A9E5]/45 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#F3F9FD] text-[#087BC1] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                <Headphones className="w-6 h-6 relative z-10" />
                <div className="absolute inset-0 bg-[#F28A16]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="font-jakarta font-bold text-lg text-[#073B66] mb-3">
                Helpful Care Support
              </h3>
              <p className="font-manrope text-xs text-[#66788A] leading-relaxed flex-grow">
                Consult with our experienced customer care representatives for
                product guides, prescriptions, and order dispatch assistance.
              </p>
              <div className="h-1 w-0 bg-[#F28A16] group-hover:w-full transition-all duration-300 mt-6 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
