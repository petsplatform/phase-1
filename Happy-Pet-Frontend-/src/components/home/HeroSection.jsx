import {
  Star,
  ArrowRight,
  ShieldCheck,
  Truck,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { heroData } from "../../utils/home/hero.js";
import heroPetImage from "../../assets/home/hero-closeup.png";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden flex items-center pt-14 pb-12 lg:pt-0 lg:pb-0"
      style={{
        background:
          "linear-gradient(135deg, #faf5ff 0%, #ede9fe 35%, #fdf4ec 70%, #fef9ee 100%)",
      }}
    >
      {/* ── Decorative background orbs ── */}
      <div
        className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] rounded-full opacity-40 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-5%] left-[5%] w-[400px] h-[400px] rounded-full opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #fbcfe8 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[20%] left-[30%] w-[300px] h-[300px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)",
        }}
      />

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[80vh]">
          {/* ── LEFT: Editorial text block ── (col 1-7) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Top label strip */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-[2px] w-10 bg-brand-purple rounded-full" />
              <span className="text-brand-purple text-xs font-bold uppercase tracking-[0.2em]">
                Certified Pet Pharmacy
              </span>
            </div>

            {/* Large editorial headline — mixed weights */}
            <h1 className="leading-none mb-8">
              <span className="block font-display font-light text-5xl sm:text-6xl lg:text-7xl text-gray-800 mb-1">
                Premium Care,
              </span>
              <span className="block font-display font-extrabold text-5xl sm:text-6xl lg:text-8xl text-brand-purple">
                Happier Pets.
              </span>
              <span className="block font-display font-light text-3xl sm:text-4xl lg:text-5xl text-gray-500 mt-3">
                Delivered to your door.
              </span>
            </h1>

            {/* Description */}
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-lg mb-10">
              {heroData.description}
            </p>

            {/* CTA row */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md sm:flex sm:w-auto mb-12">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold text-xs sm:text-sm px-4 sm:px-8 py-3.5 sm:py-4 rounded-2xl shadow-xl shadow-brand-purple/25 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer text-center"
              >
                Shop All Products
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 text-brand-purple font-semibold text-xs sm:text-sm border border-brand-purple/20 hover:border-brand-purple/50 bg-white/60 hover:bg-white/80 backdrop-blur-sm px-4 sm:px-8 py-3.5 sm:py-4 rounded-2xl transition-all duration-300 cursor-pointer text-center"
              >
                View Deals
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Blob image + floating cards ── (col 8-12) */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[480px]">
            {/* Main blob image container */}
            <div
              className="relative w-[340px] h-[380px] sm:w-[380px] sm:h-[420px] overflow-hidden shadow-2xl"
              style={{
                borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%",
                background: "linear-gradient(145deg, #ede9fe, #fdf4ec)",
              }}
            >
              <img
                src={heroPetImage}
                alt="Happy pet"
                className="w-full h-full object-cover object-top scale-110"
                draggable={false}
              />
            </div>

            {/* Floating card 3 — Vet Approved, top-left */}
            <div className="absolute top-10 -left-2 sm:-left-8 bg-brand-purple rounded-2xl shadow-lg shadow-brand-purple/30 px-4 py-3 flex items-center gap-3 z-20">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-white/60 uppercase tracking-wide">
                  Certified
                </div>
                <div className="text-xs font-bold text-white">Vet Approved</div>
              </div>
            </div>

            {/* Floating card 4 — Wellness, bottom-right */}
            <div className="absolute bottom-8 -right-2 sm:-right-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg shadow-gray-200 px-4 py-3 border border-white/80 flex items-center gap-3 z-20">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Wellness
                </div>
                <div className="text-xs font-bold text-gray-800">
                  Rx + Supplements
                </div>
              </div>
            </div>

            {/* Sparkle badge — floating near image */}
            <div className="absolute top-1/2 -right-3 sm:-right-8 bg-amber-400 text-white rounded-full px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 shadow-lg z-20">
              <Sparkles className="w-3 h-3" />
              New Arrivals!
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
