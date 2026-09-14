import React from "react";
import { Mail, Shield } from "lucide-react";
import { teamData } from "../../data/about";

export default function Team() {
  const { title, subtitle, members } = teamData;

  return (
    <section id="team" className="py-20 px-6 sm:px-8 lg:px-12 max-w-[1200px] mx-auto text-left">
      <div className="space-y-16">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-deep-navy bg-white border border-[#e5e9ec] shadow-xs">
            OUR TEAM
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-black text-deep-navy tracking-tight leading-tight">
            {title}
          </h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <div
              key={index}
              className="bg-white border border-[#e5e9ec] rounded-[2.2rem] overflow-hidden shadow-xs hover:shadow-md hover:border-primary-green/30 transition-all duration-300 group flex flex-col h-full"
            >
              {/* Member Photo Container */}
              <div className="relative overflow-hidden aspect-square w-full bg-slate-100">
                <img
                  src={member.imageUrl}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Board Certified Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1.5 shadow-xs">
                  <Shield className="h-3.5 w-3.5 text-primary-green" />
                  <span className="text-[10px] font-black text-deep-navy uppercase tracking-wider">Certified</span>
                </div>
              </div>

              {/* Member Info Area */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  {/* Role Tag */}
                  <span className="inline-block text-[11px] font-black tracking-wider uppercase text-primary-green bg-soft-mint px-2.5 py-0.5 rounded-md">
                    {member.role}
                  </span>
                  
                  {/* Name */}
                  <h3 className="font-display font-black text-lg sm:text-xl text-deep-navy group-hover:text-primary-green transition-colors duration-200">
                    {member.name}
                  </h3>
                  
                  {/* Bio */}
                  <p className="text-slate-500 font-semibold text-xs sm:text-sm leading-relaxed">
                    {member.bio}
                  </p>
                </div>

                {/* Connect button */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Consults available</span>
                  <a
                    href="/contact"
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-primary-green hover:text-white border border-[#e5e9ec] hover:border-primary-green flex items-center justify-center text-slate-500 transition-all duration-300 cursor-pointer"
                    aria-label={`Send message to ${member.name}`}
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
