import React from "react";
import * as Icons from "lucide-react";
import { whyChooseUsData } from "../../utils/home/whyChooseUs.js";

export default function WhyChooseUs() {
  return (
    <section
      id="WHYCHOOSEUS"
      className="py-20 bg-brand-cream/10 relative overflow-hidden select-none border-t border-brand-purple/5"
    >
      {/* Subtle tech grid background layer */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.2] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading copy & decorative metrics */}
          <div className="lg:col-span-5 text-left flex flex-col justify-center">
            {/* Small Badge */}
            <div className="inline-flex items-center bg-brand-purple/5 border border-brand-purple/10 px-3.5 py-1 rounded-full text-brand-purple text-xs font-semibold mb-4 w-fit">
              {whyChooseUsData.badge}
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl lg:text-[40px] font-display font-semibold tracking-tight text-brand-purple leading-tight">
              {whyChooseUsData.title}
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-brand-brown/70 font-medium mt-4 leading-relaxed">
              {whyChooseUsData.subtitle}
            </p>

            {/* Micro stats banner for extra trust social proof */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-brand-purple/10 pt-8 max-w-md">
              <div>
                <span className="block text-2xl font-bold text-brand-purple">
                  100%
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-brown/60 mt-1 block">
                  Pet-Safe
                </span>
              </div>
              <div className="border-l border-brand-purple/10 pl-4">
                <span className="block text-2xl font-bold text-brand-purple">
                  24/7
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-brown/60 mt-1 block">
                  Vet Support
                </span>
              </div>
              <div className="border-l border-brand-purple/10 pl-4">
                <span className="block text-2xl font-bold text-brand-purple">
                  30 Day
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-brown/60 mt-1 block">
                  Easy Return
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Grid list of values cards */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {whyChooseUsData.features.map((feature) => {
                // Dynamically resolve the corresponding icon component from Lucide
                const IconComponent =
                  Icons[feature.iconName] || Icons.HelpCircle;

                return (
                  <div
                    key={feature.id}
                    className={`bg-white border border-brand-purple/5 p-6 rounded-[2rem] text-left transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${feature.hoverBorder} group flex flex-col justify-between`}
                  >
                    <div>
                      {/* Icon Circle */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner mb-4 transition-transform duration-300 group-hover:scale-105 ${feature.colorClass}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      {/* Title */}
                      <h3 className="text-brand-purple font-display font-semibold text-base mb-2 group-hover:text-brand-peach transition-colors">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-brand-brown/70 leading-relaxed font-medium">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
