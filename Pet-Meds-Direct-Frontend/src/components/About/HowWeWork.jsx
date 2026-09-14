import React from "react";
import { Search, ClipboardCheck, FileCheck, Truck } from "lucide-react";
import { howWeWorkData } from "../../data/about";

const iconMap = {
  Search: Search,
  ClipboardCheck: ClipboardCheck,
  FileCheck: FileCheck,
  Truck: Truck,
};

export default function HowWeWork() {
  const { title, subtitle, steps } = howWeWorkData;

  return (
    <section className="w-full bg-white border-y border-[#e5e9ec] py-20 px-6 sm:px-8 lg:px-12 relative">
      <div className="max-w-[1400px] mx-auto text-center space-y-16">

        {/* Section Header */}
        <div className="flex flex-col items-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-deep-navy bg-white border border-[#e5e9ec] shadow-xs">
            OUR PROCESS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-black text-deep-navy tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Steps Flex Flow / Grid with Connector lines */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          
          {/* Connector Line for Desktop */}
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-green/30 to-medical-teal/30 -z-10" />

          {steps.map((item, index) => {
            const IconComponent = iconMap[item.icon] || Search;
            return (
              <div key={index} className="flex flex-col items-center text-center space-y-5 group relative">
                
                {/* Step Circle & Icon */}
                <div className="relative">
                  {/* Step Number Tag */}
                  <span className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-deep-navy text-white text-xs font-black flex items-center justify-center border border-white">
                    {item.step}
                  </span>
                  
                  {/* Main Circle Icon container */}
                  <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-white border-2 border-[#e5e9ec] text-deep-navy flex items-center justify-center shadow-xs transition-all duration-300 group-hover:border-primary-green group-hover:bg-primary-green group-hover:text-white group-hover:scale-105 group-hover:shadow-md">
                    <IconComponent className="h-8 w-8 sm:h-9 sm:w-9" />
                  </div>
                </div>

                {/* Text content */}
                <div className="space-y-2 max-w-[240px]">
                  <h3 className="font-display font-black text-base sm:text-lg text-deep-navy group-hover:text-primary-green transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 font-semibold text-xs sm:text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
