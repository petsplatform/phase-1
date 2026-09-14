import React from "react";
import { Heart, ShieldCheck, MessageCircle, Target } from "lucide-react";
import { statisticsData } from "../../data/about";

const statConfig = [
  {
    icon: Heart,
    colorClass: "text-primary-green bg-primary-green/10",
  },
  {
    icon: ShieldCheck,
    colorClass: "text-medical-teal bg-medical-teal/10",
  },
  {
    icon: MessageCircle,
    colorClass: "text-primary-green bg-primary-green/10",
  },
  {
    icon: Target,
    colorClass: "text-medical-teal bg-medical-teal/10",
  },
];

export default function Statistics() {
  return (
    <section className="py-8 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
      <div className="bg-white border border-[#e5e9ec] p-8 sm:p-8 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-md">
        {/* Decorative Background Accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 relative z-10">
          {statisticsData.map((stat, index) => {
            const config = statConfig[index] || statConfig[0];
            const IconComponent = config.icon;

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-3 group"
              >
                {/* Icon Badge */}
                <div
                  className={`h-11 w-11 rounded-2xl ${config.colorClass} flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <IconComponent className="h-5.5 w-5.5" />
                </div>

                {/* Stat Value */}
                <div className="font-display font-black text-3xl sm:text-4xl lg:text-[44px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-green to-medical-teal transition-all duration-300 group-hover:scale-105">
                  {stat.value}
                </div>

                {/* Stat Label */}
                <div className="font-bold text-sm sm:text-base text-deep-navy">
                  {stat.label}
                </div>

                {/* Stat Description */}
                <div className="text-slate-500 text-xs sm:text-sm font-semibold max-w-[180px] leading-relaxed">
                  {stat.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
