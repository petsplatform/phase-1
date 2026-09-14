import React from "react";
import { Heart, Activity, Sparkles, Layers } from "lucide-react";
import { coreValuesData } from "../../data/about";

const iconMap = {
  Heart: Heart,
  Activity: Activity,
  Sparkles: Sparkles,
  Layers: Layers,
};

export default function CoreValues() {
  const { badge, title, subtitle, leftStats, values } = coreValuesData;

  return (
    <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Column: Headers & Stats */}
        <div className="lg:col-span-5 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider text-primary-green bg-soft-mint border border-primary-green/20">
            {badge || "THE HAPPY PET GUARANTEE"}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-black text-deep-navy tracking-tight leading-[1.15]">
            {title}
          </h2>
          <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
            {subtitle}
          </p>

          {/* Stats Bar */}
          {leftStats && (
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/60">
              {leftStats.map((stat, i) => (
                <div key={i} className="text-left border-l first:border-l-0 border-slate-200 first:pl-0 pl-4">
                  <div className="font-display font-black text-2xl sm:text-3xl text-deep-navy leading-none mb-1.5">
                    {stat.value}
                  </div>
                  <div className="text-[9px] font-black tracking-wider text-slate-400 uppercase leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Values Cards Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((v) => {
            const IconComponent = iconMap[v.icon] || Heart;
            return (
              <div
                key={v.id}
                className={`bg-white border border-[#e5e9ec] p-6 sm:p-8 rounded-[2.2rem] shadow-xs transition-all duration-300 ${v.borderClass} hover:shadow-md flex flex-col items-start gap-4 text-left group`}
              >
                {/* Icon Column */}
                <div className={`h-11 w-11 rounded-xl ${v.bgClass} flex items-center justify-center shrink-0 border border-slate-100/50 shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                  <IconComponent className="h-5.5 w-5.5" />
                </div>

                {/* Text Content Column */}
                <div className="space-y-1.5">
                  <h3 className="font-display font-black text-base sm:text-lg text-deep-navy">
                    {v.title}
                  </h3>
                  <p className="text-slate-500 font-semibold text-xs sm:text-sm leading-relaxed">
                    {v.description}
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
