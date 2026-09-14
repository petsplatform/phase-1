import React from "react";
import { Clock, Calendar, CheckCircle } from "lucide-react";
import { ourStoryData } from "../../data/about";

export default function OurStory() {
  const { badge, title, subtitle, paragraphs, milestones } = ourStoryData;

  return (
    <section id="our-story" className="w-full bg-white border-y border-[#e5e9ec] py-20 px-6 sm:px-8 lg:px-12 text-left">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* Left Column: Narrative */}
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest text-deep-navy bg-soft-mint border border-primary-green/20 shadow-xs">
            {badge}
          </span>
          
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-black text-deep-navy tracking-tight leading-[1.15]">
            {title}
          </h2>
          
          <p className="text-primary-green font-bold text-base sm:text-lg">
            {subtitle}
          </p>

          <div className="space-y-4 text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {/* Staggered visual accent callout */}
          <div className="bg-white border border-[#e5e9ec] p-5 sm:p-6 rounded-[1.8rem] shadow-xs relative overflow-hidden flex gap-4 items-start">
            <span className="h-10 w-10 shrink-0 bg-primary-green/10 text-primary-green rounded-full flex items-center justify-center font-bold">
              ❤
            </span>
            <div>
              <h4 className="text-deep-navy font-bold text-base">For Every Member of the Family</h4>
              <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1">
                Whether it's custom dosage formulation or overnight shipping of critical temperature-controlled medications.
              </p>
            </div>
            {/* Subtle background blob */}
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-primary-green/5 rounded-full" />
          </div>
        </div>

        {/* Right Column: Interactive Timeline Grid */}
        <div className="lg:col-span-6 bg-slate-50/50 border border-slate-100 p-6 sm:p-8 rounded-[2.2rem] shadow-xs relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-green/5 rounded-full blur-xl pointer-events-none" />
          
          <h3 className="font-display font-black text-xl sm:text-2xl text-deep-navy mb-8 flex items-center gap-2">
            <Clock className="h-5.5 w-5.5 text-primary-green" />
            Our Evolution & Milestones
          </h3>

          <div className="relative border-l-2 border-slate-200 ml-3.5 pl-6 sm:pl-8 space-y-8">
            {milestones.map((m, index) => (
              <div key={index} className="relative group text-left">
                {/* Timeline node circle */}
                <span className="absolute -left-[35px] sm:-left-[43px] top-1.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-white border-2 border-primary-green flex items-center justify-center shadow-xs transition-all duration-300 group-hover:bg-primary-green group-hover:scale-110">
                  <Calendar className="h-3 w-3 text-primary-green group-hover:text-white transition-colors" />
                </span>

                {/* Milestone content */}
                <div className="bg-white border border-[#e5e9ec] p-4.5 rounded-2xl transition-all duration-300 group-hover:border-primary-green/30 group-hover:shadow-md group-hover:-translate-y-0.5">
                  <span className="inline-block text-xs font-black tracking-widest text-primary-green uppercase mb-1 bg-soft-mint px-2 py-0.5 rounded-md">
                    {m.year}
                  </span>
                  <p className="text-deep-navy font-bold text-sm sm:text-[15px] leading-snug">
                    {m.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
