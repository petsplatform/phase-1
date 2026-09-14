import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, HeartPulse, Sparkles, CheckCircle2 } from "lucide-react";
import { heroBannerData } from "../../data/about";

export default function Hero() {
  const {
    badge,
    title,
    highlightWord,
    subtitle,
    ctaText,
    ctaLink,
    secondaryCtaText,
    secondaryCtaLink,
  } = heroBannerData;

  return (
    <section className="relative py-12 lg:py-16 my-4 mx-4 sm:mx-6 lg:mx-8">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-10 left-10 -z-10 w-72 h-72 bg-primary-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 -z-10 w-72 h-72 bg-medical-teal/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphic Wrapper */}
      <div className="max-w-[1400px] mx-auto bg-white border border-[#e5e9ec] rounded-[2.5rem] p-8 sm:p-12 lg:p-16 shadow-soft relative overflow-hidden">
        {/* Subtle grid pattern inside card */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Pill Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-primary-green bg-soft-mint border border-primary-green/20">
              <Sparkles className="h-3.5 w-3.5 text-primary-green animate-pulse" />
              {badge}
            </span>

            {/* Headline */}
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[50px] font-black tracking-tight leading-[1.15] text-deep-navy">
              {title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-medical-teal">
                {highlightWord}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 font-semibold text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl">
              {subtitle}
            </p>

            {/* Professional Checkmarks / Trust Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1 text-slate-700 font-semibold text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary-green shrink-0" />
                <span>State Board Certified Pharmacy</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary-green shrink-0" />
                <span>FDA & EPA Approved Sourcing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary-green shrink-0" />
                <span>Veterinarian Pharmacist Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary-green shrink-0" />
                <span>Safe Cold-Chain Packaging</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4 w-full sm:flex sm:w-auto sm:flex-wrap sm:gap-4">
              <Link
                to={ctaLink}
                id="hero-cta-btn"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-3 sm:px-6 sm:py-3 rounded-xl bg-primary-green hover:bg-dark-green text-white font-extrabold text-xs sm:text-sm tracking-wide transition-all shadow-md shadow-primary-green/10 cursor-pointer text-center"
              >
                <span>{ctaText}</span>
                <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 shrink-0" />
              </Link>
              <a
                href={secondaryCtaLink}
                id="hero-story-btn"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-3 sm:px-6 sm:py-3 rounded-xl bg-white border border-[#e5e9ec] hover:border-slate-300 text-deep-navy font-extrabold text-xs sm:text-sm tracking-wide transition-all cursor-pointer text-center"
              >
                <span>{secondaryCtaText}</span>
              </a>
            </div>

          </div>

          {/* Right Column: Premium overlapping cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[300px] sm:min-h-[340px]">
            
            {/* Visual Backplate Sphere */}
            <div className="absolute w-64 h-64 rounded-full bg-soft-mint border border-primary-green/10 pointer-events-none" />

            {/* Overlapping Card 1 (Pharmacist Seal) */}
            <div className="absolute -translate-y-12 translate-x-2 sm:translate-x-6 w-64 bg-white border border-[#e5e9ec] p-5 rounded-[2rem] shadow-md flex gap-4 items-start text-left animate-float">
              <div className="h-10 w-10 rounded-xl bg-soft-mint text-primary-green flex items-center justify-center shrink-0 border border-primary-green/10 shadow-inner">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-black uppercase text-primary-green tracking-wider">Pharmacy License</span>
                <h4 className="text-deep-navy font-black text-sm">Verified Credentials</h4>
                <p className="text-slate-400 text-[10px] font-semibold leading-normal">
                  Inspected and accredited by national veterinary compliance standards.
                </p>
              </div>
            </div>

            {/* Overlapping Card 2 (Accurate Refill) */}
            <div className="absolute translate-y-16 -translate-x-6 w-60 bg-white border border-[#e5e9ec] p-5 rounded-[2rem] shadow-lg flex gap-4 items-start text-left animate-bounce-slow">
              <div className="h-10 w-10 rounded-xl bg-light-blue text-medical-teal flex items-center justify-center shrink-0 border border-medical-teal/10 shadow-inner">
                <HeartPulse className="h-5.5 w-5.5" />
              </div>
              <div className="space-y-1">
                <span className="block text-[9px] font-black uppercase text-medical-teal tracking-wider">Quality Assurance</span>
                <h4 className="text-deep-navy font-black text-sm">99.9% Refill Check</h4>
                <p className="text-slate-400 text-[10px] font-semibold leading-normal">
                  Licensed pharmacists double-inspect dosage for breed safety.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
