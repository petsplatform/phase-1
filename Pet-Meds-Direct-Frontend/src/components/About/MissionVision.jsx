import React from "react";
import { Target, Compass } from "lucide-react";
import { missionVisionData } from "../../data/about";

export default function MissionVision() {
  const { mission, vision } = missionVisionData;

  return (
    <section className="py-16 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Mission Card */}
        <div className={`relative rounded-[2.2rem] border ${mission.borderColor} p-8 sm:p-10 text-left bg-gradient-to-br ${mission.gradient} shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01] group`}>
          <div className="absolute top-0 right-0 -z-10 w-32 h-32 bg-primary-green/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary-green bg-white/80 border border-primary-green/10 shadow-xs">
              {mission.badge}
            </span>
            <div className="h-12 w-12 rounded-2xl bg-primary-green/15 text-primary-green flex items-center justify-center transition-all duration-300 group-hover:bg-primary-green group-hover:text-white">
              <Target className="h-6 w-6" />
            </div>
          </div>

          <h3 className="font-display font-black text-2xl sm:text-3xl text-deep-navy mb-4 leading-tight">
            {mission.title}
          </h3>
          
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed">
            {mission.description}
          </p>
        </div>

        {/* Vision Card */}
        <div className={`relative rounded-[2.2rem] border ${vision.borderColor} p-8 sm:p-10 text-left bg-gradient-to-br ${vision.gradient} shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01] group`}>
          <div className="absolute top-0 right-0 -z-10 w-32 h-32 bg-medical-teal/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-widest text-medical-teal bg-white/80 border border-medical-teal/10 shadow-xs">
              {vision.badge}
            </span>
            <div className="h-12 w-12 rounded-2xl bg-medical-teal/15 text-medical-teal flex items-center justify-center transition-all duration-300 group-hover:bg-medical-teal group-hover:text-white">
              <Compass className="h-6 w-6" />
            </div>
          </div>

          <h3 className="font-display font-black text-2xl sm:text-3xl text-deep-navy mb-4 leading-tight">
            {vision.title}
          </h3>
          
          <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed">
            {vision.description}
          </p>
        </div>

      </div>
    </section>
  );
}
