import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Star, ShoppingBag } from "lucide-react";
import { trustBadges } from "../../data/home";
import hero1 from "../../assets/Home/hero/hero-dog.png";
import hero2 from "../../assets/Home/hero/hero-cat.png";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 lg:py-20">
      {/* ── Ambient background blurs ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-primary-green/15 blur-[120px]" />
        <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-sky-blue/30 blur-[100px]" />
        <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-light-green/25 blur-[90px]" />
      </div>

      {/* ── Main hero grid ── */}
      <div className="mx-auto flex max-w-[1400px] flex-col px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* ──── LEFT: Content column ──── */}
          <div className="relative z-10 flex flex-col justify-center">
            {/* Headline */}
            <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-deep-navy sm:text-[3.2rem] lg:text-[3.8rem] xl:text-[4.5rem]">
              Your Pet's Health, <br />
              <span className="relative inline-block mt-1">
                <span className="bg-linear-to-r from-primary-green via-medical-teal to-dark-green bg-clip-text text-transparent">
                  Delivered with Care.
                </span>
                <span className="absolute -bottom-1.5 left-0 h-1 w-full rounded-full bg-light-green/45" />
              </span>
            </h1>

            {/* Sub-copy */}
            <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-deep-navy/70">
              Order prescription refills, wellness supplements, and daily
              vet-approved essentials. S Order prescription refills, wellness
              supplements, and daily vet-approved essentials. Safe, simple
              delivery directly from our pharmacy to your home.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2.5 rounded-full bg-linear-to-br from-primary-green to-dark-green px-8 py-4 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(88,185,71,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(88,185,71,0.32)]"
              >
                Shop All Meds
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 text-sm font-extrabold text-deep-navy hover:text-medical-teal transition-colors duration-300 py-3"
              >
                <ShoppingBag className="h-4.5 w-4.5 text-medical-teal transition-transform group-hover:scale-110 mr-1.5" />
                <span>Shop More</span>
              </Link>
            </div>
          </div>

          {/* ──── RIGHT: 3D Overlapping Visual Collage ──── */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none flex items-center justify-center h-[500px] lg:h-[550px] py-6">
            {/* Background glowing gradient */}
            <div className="absolute inset-0 m-auto h-80 w-80 rounded-full bg-primary-green/10 blur-3xl -z-10 animate-pulse" />

            {/* Dog Card (Back-Left) */}
            <div className="absolute top-4 left-4 w-[52%] aspect-[3.5/4.5] rounded-[28px] overflow-hidden border-4 border-white bg-white shadow-soft transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:z-20 group cursor-pointer">
              <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-soft-mint to-light-blue rounded-[24px]">
                <img
                  src={hero1}
                  alt="Dog Rx"
                  className="h-full w-full object-cover transition-transform duration-750 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Cat Card (Back-Right) */}
            <div className="absolute bottom-12 right-4 w-[48%] aspect-[3.5/4.5] rounded-[28px] overflow-hidden border-4 border-white bg-white shadow-soft transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:z-20 group cursor-pointer">
              <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-light-blue to-sky-blue rounded-[24px]">
                <img
                  src={hero2}
                  alt="Cat Care"
                  className="h-full w-full object-cover transition-transform duration-750 group-hover:scale-105"
                />
              </div>
            </div>


            {/* Floating Widget 2: 4.9★ Star Rating (Top-Right Space) */}
            {/* <div
              className="absolute top-4 right-10 z-30 flex items-center gap-2 rounded-full border border-white/60 bg-white/95 py-2 px-3.5 shadow-soft backdrop-blur-md animate-float hover:scale-[1.03] transition-transform duration-300"
              style={{ animationDelay: "1s" }}
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-deep-navy">
                <span>4.9 ★ Rating</span>
                <span className="text-deep-navy/35">•</span>
                <span className="text-medical-teal">15K+ Reviews</span>
              </div>
            </div> */}
          </div>
        </div>

        {/* ── Trust banner ── */}
        <div className="mt-16 border-t border-deep-navy/8 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-6 text-deep-navy/80">
            <div className="flex flex-wrap items-center gap-y-4 gap-x-8">
              {trustBadges.map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5 text-primary-green" />
                  <span className="text-sm font-extrabold text-deep-navy/80">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-5 w-px bg-deep-navy/10 hidden lg:block" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary-green" />
              <span className="text-xs font-bold text-deep-navy/60">
                Authorized Dealer of FDA/EPA Approved Medications
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
