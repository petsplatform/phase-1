import React from "react";
import { Link } from "react-router-dom";
import { Home, ChevronRight, Tag, ArrowRight, Sparkles } from "lucide-react";
import shopHeroImg from "../../assets/images/banner/shop-hero.png";

export default function ShopHero() {
  return (
    <div className="bg-brand-bg border-b border-brand-border/40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-5 pb-0">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-brand-muted font-sans mb-4"
        >
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-brand-teal transition-colors duration-200"
          >
            <Home size={12} />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="text-brand-border" />
          <span className="text-brand-coral font-semibold">Shop</span>
        </nav>

        {/* ── Hero Banner Card ─────────────────────────────────────────── */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ minHeight: "320px" }}
        >
          {/* Full-bleed background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-teal via-brand-deep-teal to-brand-teal" />

          {/* Paw dot pattern overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Ccircle cx='15' cy='12' r='4'/%3E%3Ccircle cx='25' cy='8' r='3'/%3E%3Ccircle cx='35' cy='8' r='3'/%3E%3Ccircle cx='45' cy='12' r='4'/%3E%3Cellipse cx='30' cy='28' rx='10' ry='12'/%3E%3C/g%3E%3C/svg%3E\")",
              backgroundSize: "80px 80px",
            }}
          />

          {/* Glow accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-coral/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/8 rounded-full blur-3xl pointer-events-none" />

          {/* ── Inner two-column layout ── */}
          <div className="relative z-10 flex items-stretch min-h-[320px] sm:min-h-[340px] lg:min-h-[380px]">
            {/* LEFT — Image column: full height, image fills area naturally */}
            <div className="relative hidden sm:block shrink-0 w-64 md:w-72 lg:w-80 xl:w-96">
              {/* Image fills full height of banner */}
              <img
                src={shopHeroImg}
                alt="Happy golden retriever dogs"
                className="absolute inset-0 w-full h-full object-cover object-center"
                draggable={false}
              />
              {/* Fade mask: left edge hard teal, right edge soft fade into text area */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, transparent 60%, #08727D 100%)",
                }}
              />
              {/* Bottom fade so dogs blend into banner floor */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, #0E9BA8 0%, transparent 30%)",
                }}
              />
            </div>

            {/* RIGHT — Text content */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 lg:px-12 py-10 lg:py-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 w-fit bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[11px] font-heading font-bold px-3.5 py-1.5 rounded-full mb-5 shadow-sm">
                <Sparkles size={11} className="text-brand-golden" />
                NEW SEASON SALE
              </div>

              {/* Heading */}
              <h1
                className="font-heading font-black text-white leading-tight max-w-xl"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
              >
                Everything your pet{" "}
                <span className="relative inline-block text-brand-golden">
                  deserves
                  {/* Wavy underline */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 200 10"
                    className="absolute -bottom-1 left-0 w-full"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6 Q40 1 80 5 Q120 9 160 4 Q185 1 198 5"
                      stroke="#E99A22"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.7"
                    />
                  </svg>
                </span>
              </h1>

              {/* Description */}
              <p className="mt-4 font-sans text-sm sm:text-base text-white/75 leading-relaxed max-w-lg">
                Shop premium pet essentials — from vet-approved gourmet food to
                cozy beds, grooming picks, toys, and daily care favorites.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
