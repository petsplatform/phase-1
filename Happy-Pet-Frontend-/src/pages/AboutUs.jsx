import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Heart,
  Activity,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
  Users,
} from "lucide-react";
import about1 from "../assets/about/about1.png";
import about2 from "../assets/about/about2.png";
import about3 from "../assets/about/about3.png";
import { stats, pillars, team } from "../utils/About/about";

export default function AboutUs() {
  const [selectedExpert, setSelectedExpert] = useState(0);

  return (
    <div
      className="min-h-screen text-brand-purple pb-8 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFF7EF 0%, #FAF6FE 50%, #FFFDFB 100%)",
      }}
    >
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-5%] left-[-10%] w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] rounded-full bg-brand-peach/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[35%] right-[-15%] w-[450px] sm:w-[800px] h-[450px] sm:h-[800px] rounded-full bg-brand-purple/5 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[-15%] w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] rounded-full bg-brand-sage/5 blur-[120px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Block: Modern Copy */}
          <div className="lg:col-span-7 space-y-6 text-left animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-purple/5 border border-brand-purple/10 text-xs font-semibold text-brand-purple shadow-sm">
              <span className="w-2.5 h-2.5 bg-brand-peach rounded-full animate-ping"></span>
              <span>Re-defining Modern Pet Care</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-brand-purple leading-[1.05]">
              We're Sourcing a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-brown to-brand-peach">
                Healthy Future
              </span>{" "}
              <br />
              For Your Pets.
            </h1>

            <p className="max-w-2xl text-sm sm:text-base font-semibold text-brand-brown/85 leading-relaxed">
              HappyPet Rx is a licensed digital compounding pharmacy that blends
              clinical research with convenience. We compound custom dosages,
              curate organic diet solutions, and offer 24/7 care guidance.
            </p>

            {/* Premium Highlights (Cardless) */}
            <div className="flex flex-col sm:flex-row gap-6 pt-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-purple/5 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-brand-purple" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-brand-purple">
                    Licensed US Pharmacy
                  </h4>
                  <p className="text-[10px] text-brand-brown/70 font-semibold mt-0.5">
                    FDA-approved distributors
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-peach/15 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-6 h-6 text-brand-brown" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-brand-purple">
                    24/7 Vet Support
                  </h4>
                  <p className="text-[10px] text-brand-brown/70 font-semibold mt-0.5">
                    Advice whenever you need it
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Block: Image Stack */}
          <div className="lg:col-span-5 relative w-full max-w-md lg:max-w-none mx-auto animate-in fade-in slide-in-from-right duration-700">
            {/* Visual background shadows & meshes */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/10 to-brand-peach/15 rounded-[36px] rotate-3 scale-103 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-brand-sage/10 to-transparent rounded-[36px] -rotate-2 pointer-events-none"></div>

            {/* Main glass frame */}
            <div className="relative p-4 bg-white/50 backdrop-blur-md border border-brand-purple/10 rounded-[36px] shadow-[0_20px_50px_rgba(75,0,75,0.04)] z-10">
              <img
                src={about1}
                alt="Veterinarian bonding with a pet dog"
                className="w-full h-[320px] sm:h-[400px] object-cover rounded-[28px] shadow-sm hover:scale-102 transition-transform duration-500"
              />

              {/* Trust badge overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-[20px] shadow-lg border border-brand-purple/10 flex items-center gap-3.5 animate-in slide-in-from-bottom duration-1000">
                <div className="w-10 h-10 rounded-full bg-brand-peach/20 flex items-center justify-center text-brand-brown flex-shrink-0 animate-pulse">
                  <Star className="w-5.5 h-5.5 fill-brand-peach text-brand-brown" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-extrabold text-brand-peach uppercase tracking-widest leading-none">
                    TRUST & INTEGRITY
                  </p>
                  <p className="text-xs font-extrabold text-brand-purple mt-0.5">
                    Approved by Over 2,500+ Veterinarians
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are Section (Puppies image + copy, aligned above Pillars) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-28 sm:mt-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Image with double borders & Driven by Love badge */}
          <div className="lg:col-span-5 relative max-w-md mx-auto lg:mx-0 w-full animate-in fade-in duration-500">
            <div className="p-3 bg-white/40 backdrop-blur-md border border-brand-purple/10 rounded-[36px] shadow-sm relative">
              <div className="absolute inset-0 border border-dashed border-brand-purple/20 rounded-[36px] m-1 pointer-events-none"></div>
              <img
                src={about2}
                alt="Two golden retriever puppies in grass"
                className="w-full h-[280px] sm:h-[350px] object-cover rounded-[28px] relative z-10"
              />

              {/* Driven by Love Badge */}
              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md border border-brand-purple/10 flex items-center gap-1.5 z-20">
                <Heart className="w-3.5 h-3.5 text-brand-purple fill-brand-purple" />
                <span className="text-[10px] font-extrabold text-[#4b004b]">
                  Driven by Love
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Copy & Checklist */}
          <div className="lg:col-span-7 space-y-6 text-left animate-in fade-in duration-500">
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-brand-purple/65 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-peach" />
                <span>Who We Are</span>
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4.5xl font-display font-extrabold text-brand-purple mt-1 leading-tight">
                A Passionate Community <br />
                Of Devoted Pet Advocates
              </h2>
            </div>

            <p className="text-sm sm:text-base font-semibold text-brand-purple/80 leading-relaxed">
              We are more than just an online store. We are a family of pet
              parents committed to ensuring that every dog, cat, and furry
              friend receives top-tier care without stress on your budget.
            </p>

            <p className="text-xs sm:text-sm font-semibold text-brand-brown/85 leading-relaxed">
              Our team consists of pet nutrition experts, veterinary
              consultants, and seasoned designers who evaluate every treat, toy,
              and supply formulation before they reach our shelves. We cut
              middleman markups, partnering directly with ethical suppliers to
              pass maximum value to your home.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 pt-2 border-t border-brand-purple/5">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-extrabold text-brand-purple">
                  100% Quality Vetted Standards
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-extrabold text-brand-purple">
                  Affordable Pricing Promise
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-extrabold text-brand-purple">
                  Veterinarian Approved Products
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 text-brand-purple">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-extrabold text-brand-purple">
                  24/7 Helpline Advisor Support
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars / Values Section (Cardless Grid) */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-28 sm:mt-36 text-center">
        <span className="text-[10px] font-extrabold text-brand-peach uppercase tracking-widest">
          Our Operations Standards
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-purple mt-1 mb-4">
          Our Four Core Pillars
        </h2>
        <p className="max-w-xl mx-auto text-xs sm:text-sm font-semibold text-brand-brown/75 mb-12 sm:mb-16">
          Everything we do is designed to give pet parents peace of mind and
          ensure pets live long, healthy, and high-energy lives.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="space-y-4 group">
                {/* Simple Icon holder with rotation */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-white ${pillar.iconColor} border border-brand-purple/5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-display font-extrabold text-base text-brand-purple">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-brand-brown/85 font-semibold leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Clinically Driven Metrics & Promise */}
      <section className="py-14 lg:py-24 lg:mt-16 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full justify-start items-center xl:gap-16 gap-10 grid lg:grid-cols-2 grid-cols-1">
          <div className="w-full flex-col justify-center lg:items-start items-center gap-8 inline-flex">
            <div className="w-full flex-col justify-center items-start gap-6 flex">
              <div className="flex-col justify-start lg:items-start items-center gap-3 flex">
                <span className="text-[10px] font-extrabold text-brand-peach uppercase tracking-widest">
                  Our Service Philosophy
                </span>
                <h2 className="text-brand-purple text-3xl sm:text-4xl font-extrabold font-display leading-tight lg:text-start text-center">
                  Clinical Excellence, Tailored for Your Companion
                </h2>
                <p className="text-brand-brown/85 text-sm font-semibold leading-relaxed lg:text-start text-center">
                  We combine veterinary pharmaceutical expertise with
                  state-of-the-art sterile compounding to provide custom,
                  allergen-free solutions tailored perfectly to your pet's
                  needs.
                </p>
              </div>

              <div className="w-full flex-col justify-center items-start gap-4 flex mt-2">
                <div className="w-full justify-start items-stretch gap-6 grid md:grid-cols-2 grid-cols-1">
                  <div className="w-full p-4.5 rounded-2xl border border-brand-purple/10 hover:border-brand-purple/20 bg-white/40 backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-300 flex-col justify-start items-start gap-2 flex">
                    <p className="text-brand-brown/80 text-xs font-semibold leading-relaxed">
                      Our sterile laboratory compounding process guarantees
                      precise dosage levels in every batch.
                    </p>
                  </div>
                  <div className="w-full p-4.5 rounded-2xl border border-brand-purple/10 hover:border-brand-purple/20 bg-white/40 backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-300 flex-col justify-start items-start gap-2 flex">
                    <p className="text-brand-brown/80 text-xs font-semibold leading-relaxed">
                      Beef, salmon, and sweet options customize standard meds to
                      be stress-free treat-like experiences.
                    </p>
                  </div>
                </div>
                <div className="w-full justify-start items-stretch gap-6 grid md:grid-cols-2 grid-cols-1">
                  <div className="w-full p-4.5 rounded-2xl border border-brand-purple/10 hover:border-brand-purple/20 bg-white/40 backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-300 flex-col justify-start items-start gap-2 flex">
                    <p className="text-brand-brown/80 text-xs font-semibold leading-relaxed">
                      Thousands of pets nationwide live healthier, more vibrant
                      lives supported by our custom products.
                    </p>
                  </div>
                  <div className="w-full p-4.5 rounded-2xl border border-brand-purple/10 hover:border-brand-purple/20 bg-white/40 backdrop-blur-sm hover:-translate-y-0.5 transition-all duration-300 flex-col justify-start items-start gap-2 flex">
                    <p className="text-brand-brown/80 text-xs font-semibold leading-relaxed">
                      Leading veterinary practices coordinate with us directly
                      for trusted compound formulation designs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:justify-start justify-center items-start flex relative animate-in fade-in duration-500">
            {/* Visual background shadows & meshes */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/10 to-brand-peach/15 rounded-[36px] rotate-3 scale-103 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-bl from-brand-sage/10 to-transparent rounded-[36px] -rotate-2 pointer-events-none"></div>

            {/* Main glass frame */}
            <div className="relative p-4 bg-white/50 backdrop-blur-md border border-brand-purple/10 rounded-[36px] shadow-[0_20px_50px_rgba(75,0,75,0.04)] z-10 w-full">
              <img
                src={about3}
                alt="Happy, healthy dog looking forward to its care"
                className="w-full h-[400px] sm:h-[480px] object-cover rounded-[28px] shadow-sm hover:scale-102 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
