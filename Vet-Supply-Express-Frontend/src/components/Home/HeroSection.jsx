import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Activity,
  BadgeCheck,
  Clock,
  Calendar,
  ArrowRight,
  Star
} from "lucide-react";
import heroImg from "../../assets/food_chicken_dog.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-[680px] lg:min-h-[760px] flex items-center bg-[#073B66] overflow-hidden select-none text-white font-manrope">
      
      {/* Self-contained CSS for high-fidelity responsive animations */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .animate-hero-fade-up {
            opacity: 0;
            animation: hero-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-hero-scale-in {
            opacity: 0;
            animation: hero-scale-in 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-scale-in {
          from { opacity: 0; transform: scale(1.06); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── Immersive Background Visual ── */}
      {/* Desktop/Tablet visual positioned on the right */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 h-full z-0 select-none pointer-events-none lg:block hidden">
        <div className="relative w-full h-full">
          <img
            src={heroImg}
            alt="Healthy Dog"
            className="w-full h-full object-cover object-center animate-hero-scale-in"
          />
          {/* Subtle navy gradient mask merging the image with the left text side */}
          <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-[#073B66] to-transparent z-10" />
          {/* Dark blue overlay to enrich color depth */}
          <div className="absolute inset-0 bg-[#073B66]/10 mix-blend-multiply z-10" />
          {/* Soft amber highlight effect at the bottom-right */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-[#F28A16]/5 blur-[120px] rounded-full pointer-events-none z-10" />
        </div>
      </div>

      {/* Mobile-only background visual with heavy overlay */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none lg:hidden block">
        <img
          src={heroImg}
          alt="Veterinary Care"
          className="w-full h-full object-cover object-center opacity-[0.22] animate-hero-scale-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#073B66] via-[#073B66]/90 to-[#073B66]/75" />
      </div>

      {/* ── Hero Grid Content ── */}
      <div className="container-custom relative z-10 w-full py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Text Column */}
          <div className="lg:col-span-8 xl:col-span-7 flex flex-col items-start text-left lg:-translate-x-[3px]">
            
            {/* Eyebrow Badge */}
            <div 
              className="inline-flex items-center gap-2 bg-[#EBF5FB]/10 border border-[#18A9E5]/20 rounded-full px-4.5 py-1.5 mb-6 shadow-sm animate-hero-fade-up"
              style={{ animationDelay: "100ms" }}
            >
              <span className="w-2 h-2 rounded-full bg-[#18A9E5] relative flex">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#18A9E5] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#18A9E5]"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#18A9E5]">
                Trusted Veterinary Care & Supplies
              </span>
            </div>

            {/* Main Heading */}
            <h1 
              className="font-jakarta font-extrabold text-[38px] sm:text-[44px] md:text-[54px] lg:text-[62px] xl:text-[70px] leading-[1.08] tracking-tight mb-6 animate-hero-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              Better <span className="text-[#18A9E5]">Care</span> for Pets.<br />
              Trusted Support for<br />
              <span className="text-[#F28A16] font-black">Every Family</span><span className="text-[#18A9E5] font-black">.</span>
            </h1>

            {/* Description */}
            <p 
              className="text-sm sm:text-base md:text-lg text-[#F3F9FD]/80 leading-relaxed mb-10 max-w-2xl font-medium animate-hero-fade-up"
              style={{ animationDelay: "300ms" }}
            >
              Access compassionate veterinary care, trusted medicines, wellness essentials, diagnostic support, and professional pet supplies through one reliable experience.
            </p>

            {/* CTAs */}
            <div 
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto animate-hero-fade-up"
              style={{ animationDelay: "400ms" }}
            >
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#F28A16] hover:bg-[#d5750d] text-white font-extrabold text-base px-8 py-4 rounded-full transition-all duration-300 shadow-md shadow-[#F28A16]/20 hover:shadow-[#F28A16]/35 hover:-translate-y-0.5 text-center cursor-pointer"
              >
                <span>Book an Appointment</span>
                <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
              
              <Link
                to="/shop"
                className="group inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 border-2 border-white/20 hover:border-white text-white font-extrabold text-base px-8 py-4 rounded-full transition-all duration-300 hover:-translate-y-0.5 text-center cursor-pointer shadow-sm"
              >
                <span>Explore Our Services</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Compact Trust Row */}
            <div 
              className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-12 pt-6 border-t border-white/10 w-full text-xs font-semibold text-[#F3F9FD]/70 animate-hero-fade-up"
              style={{ animationDelay: "500ms" }}
            >
              <div className="flex items-center gap-2.5">
                <BadgeCheck className="w-5 h-5 text-[#18A9E5] shrink-0" />
                <span>Certified Veterinary Professionals</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 hidden md:block" />
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#F28A16] shrink-0" />
                <span>Same-Day Assistance</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 hidden md:block" />
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#18A9E5] shrink-0" />
                <span>Trusted by 15,000+ Pet Parents</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Compact Floating Trust Panel (Bottom-Right) ── */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:right-12 lg:-translate-x-0 z-20 flex items-center gap-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-full border border-white/15 text-white text-xs font-black shadow-lg shadow-black/10 animate-hero-fade-up hidden sm:flex"
        style={{ animationDelay: "600ms" }}
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-[#F28A16] text-[#F28A16]" />
          <span className="uppercase tracking-wider">4.9/5 Rating</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#18A9E5]" />
          <span className="uppercase tracking-wider">Certified Care</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#F28A16]" />
          <span className="uppercase tracking-wider">Fast Support</span>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
