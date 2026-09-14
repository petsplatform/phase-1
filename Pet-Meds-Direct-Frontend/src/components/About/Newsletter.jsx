import React, { useState } from "react";
import { Mail, Send, Award } from "lucide-react";
import { toast } from "react-hot-toast";
import { newsletterData } from "../../data/about";

export default function Newsletter() {
  const { title, subtitle, placeholder, buttonText } = newsletterData;
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success("Thank you! Welcome to the Happy Pets Club.");
    setEmail("");
  };

  return (
    <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-[1400px] mx-auto text-left">
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-primary-green/5 via-medical-teal/5 to-soft-mint/20 border border-primary-green/10 p-8 sm:p-12 lg:p-16 overflow-hidden shadow-xs">
        
        {/* Glow Elements */}
        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary-green/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-medical-teal/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary-green bg-white border border-primary-green/10 shadow-xs">
              <Award className="h-3.5 w-3.5" />
              SPECIAL DEAL INCLUDED
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-deep-navy tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-slate-600 font-semibold text-sm sm:text-base leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Right Input Column */}
          <div className="lg:col-span-5 w-full bg-white border border-slate-100 p-6 rounded-[2rem] shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  id="about-newsletter-email"
                  placeholder={placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-deep-navy placeholder:text-slate-400 focus:outline-none focus:border-primary-green/50 focus:bg-white transition-all font-semibold"
                />
              </div>

              <button
                type="submit"
                id="about-newsletter-submit"
                className="w-full h-12 rounded-xl bg-primary-green hover:bg-dark-green text-white font-extrabold text-sm tracking-wide transition-all shadow-md shadow-primary-green/10 flex items-center justify-center gap-2 group cursor-pointer"
              >
                {buttonText}
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <p className="text-[11px] font-semibold text-slate-400 text-center leading-snug">
                🔒 Your email is 100% secure. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
}
