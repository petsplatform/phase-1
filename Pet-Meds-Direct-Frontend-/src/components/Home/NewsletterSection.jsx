import React from "react";
import {
  Shield,
  ShieldCheck,
  Snowflake,
  FileCheck,
  RefreshCw,
} from "lucide-react";

export default function NewsletterSection() {
  return (
    <section id="trust-us" className="relative py-16 lg:py-24 bg-white overflow-hidden">
      {/* ── Outer wrapper with soft background ── */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        
        {/* Subtle theme-colored ambient light blobs in the background */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary-green/5 rounded-full filter blur-[120px] -z-10 animate-pulse duration-[5000ms]" />
        <div className="absolute bottom-1/4 left-10 w-96 h-96 bg-medical-teal/5 rounded-full filter blur-[120px] -z-10 animate-pulse duration-[7000ms]" />

        {/* Outer card container with a premium soft mint/green-tinted gradient and subtle border */}
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-white via-soft-mint/30 to-slate-50/80 border border-slate-200/80 px-8 py-16 sm:px-12 lg:px-16 shadow-xs overflow-hidden">
          {/* Ambient inner lights for extra depth */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/[0.03] rounded-full filter blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/[0.03] rounded-full filter blur-[100px] -z-10" />

          {/* ── Main Layout Split ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left side: content */}
            <div className="lg:col-span-5 text-left flex flex-col justify-center">
              {/* Badge */}
              <div className="mb-6 inline-flex self-start items-center gap-2 rounded-full border border-primary-green/20 bg-emerald-50/80 px-4 py-1.5 shadow-xs backdrop-blur-md transition-all duration-300 hover:bg-emerald-100/80">
                <Shield className="h-4 w-4 text-dark-green" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-dark-green">
                  The Direct Care Assurance
                </span>
              </div>

              {/* Title */}
              <h2 className="font-display text-[2.2rem] font-extrabold leading-tight tracking-tight sm:text-[2.8rem] lg:text-[3rem] text-deep-navy">
                Why Pet Parents <span className="text-primary-green">Choose</span> PetMeds Direct
              </h2>

              {/* Paragraph */}
              <p className="mt-4 text-base font-medium leading-relaxed text-slate-600">
                We combine veterinary expertise, licensed pharmacy standards, and seamless delivery to make pet care effortless, reliable, and affordable.
              </p>

              {/* Divider */}
              <div className="my-8 border-t border-slate-200" />

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-3xl sm:text-4xl font-extrabold text-medical-teal tracking-tight">99.8%</span>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mt-1.5 leading-tight">Rx Accuracy</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl sm:text-4xl font-extrabold text-primary-green tracking-tight">150k+</span>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mt-1.5 leading-tight">Happy Pets</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">10m</span>
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mt-1.5 leading-tight">Vet Chat Reply</span>
                </div>
              </div>
            </div>

            {/* Right side: cards grid */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Card 1: FDA-Approved & Certified */}
                <div className="group relative rounded-3xl bg-white/90 border border-slate-200/60 p-6 sm:p-8 shadow-xs backdrop-blur-md hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  {/* Subtle color overlay hover effect */}
                  <div className="absolute inset-0 rounded-3xl bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Icon */}
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-primary-green border border-primary-green/20 shadow-xs mb-5 transition-transform duration-300 group-hover:scale-110">
                    <ShieldCheck className="h-6 w-6 stroke-[2]" />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-bold text-deep-navy group-hover:text-dark-green transition-colors duration-300">
                    FDA-Approved & Certified
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                    Sourced directly from manufacturers and approved by our board-certified veterinary pharmacists.
                  </p>
                </div>

                {/* Card 2: Cold-Chain Delivery */}
                <div className="group relative rounded-3xl bg-white/90 border border-slate-200/60 p-6 sm:p-8 shadow-xs backdrop-blur-md hover:bg-white hover:border-cyan-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-3xl bg-cyan-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-medical-teal border border-medical-teal/20 shadow-xs mb-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
                    <Snowflake className="h-6 w-6 stroke-[2]" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-deep-navy group-hover:text-medical-teal transition-colors duration-300">
                    Cold-Chain Delivery
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                    Temperature-sensitive meds are packed in specialized insulated coolers to guarantee safety.
                  </p>
                </div>

                {/* Card 3: Direct Vet Coordination */}
                <div className="group relative rounded-3xl bg-white/90 border border-slate-200/60 p-6 sm:p-8 shadow-xs backdrop-blur-md hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-3xl bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-dark-green border border-primary-green/20 shadow-xs mb-5 transition-transform duration-300 group-hover:scale-110">
                    <FileCheck className="h-6 w-6 stroke-[2]" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-deep-navy group-hover:text-dark-green transition-colors duration-300">
                    Direct Vet Coordination
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                    We handle all coordination with your clinic to verify prescriptions, eliminating paperwork.
                  </p>
                </div>

                {/* Card 4: Smart Auto-Ship Savings */}
                <div className="group relative rounded-3xl bg-white/90 border border-slate-200/60 p-6 sm:p-8 shadow-xs backdrop-blur-md hover:bg-white hover:border-amber-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-3xl bg-amber-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/20 shadow-xs mb-5 transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-110">
                    <RefreshCw className="h-6 w-6 stroke-[2]" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-deep-navy group-hover:text-amber-700 transition-colors duration-300">
                    Smart Auto-Ship Savings
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                    Schedule refills at your convenience and save an automatic 15% on every recurring delivery.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
