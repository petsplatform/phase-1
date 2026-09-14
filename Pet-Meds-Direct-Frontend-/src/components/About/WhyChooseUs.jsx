import React from "react";
import { ShieldCheck, UserCheck, Thermometer, PhoneCall } from "lucide-react";
import { whyChooseUsData } from "../../data/about";

const iconMap = {
  Shield: ShieldCheck,
  UserCheck: UserCheck,
  Thermometer: Thermometer,
  PhoneCall: PhoneCall,
};

export default function WhyChooseUs() {
  const { title, subtitle, items } = whyChooseUsData;

  return (
    <section className="w-full bg-white border-y border-[#e5e9ec] py-20 px-6 sm:px-8 lg:px-12 relative">
      <div className="absolute inset-0 bg-radial-gradient(circle_at_bottom_right,rgba(88,185,71,0.02),transparent_40%) pointer-events-none" />

      <div className="max-w-[1400px] mx-auto text-center space-y-12">
        {/* Section Header */}
        <div className="flex flex-col items-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-deep-navy bg-white border border-[#e5e9ec] shadow-xs">
            BENEFITS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-black text-deep-navy tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon] || ShieldCheck;
            return (
              <div
                key={item.id}
                className="bg-white border border-[#e5e9ec] p-6 rounded-[2rem] shadow-xs transition-all duration-300 hover:border-primary-green/30 hover:shadow-md hover:-translate-y-1 group relative overflow-hidden"
              >
                {/* Accent line top */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-green/60 to-medical-teal/60 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Icon Wrapper */}
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200/60 text-primary-green flex items-center justify-center mb-5 transition-colors duration-300 group-hover:bg-primary-green group-hover:text-white group-hover:border-primary-green">
                  <IconComponent className="h-5.5 w-5.5" />
                </div>

                {/* Content */}
                <h3 className="font-display font-black text-lg text-deep-navy mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 font-semibold text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
