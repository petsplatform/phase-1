import React from "react";

// List of veterinary brands with their custom high-quality inline SVG logos
const BRANDS = [
  {
    name: "Frontline",
    hoverColor: "hover:text-[#005ca9]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 10L14 30M16 10L22 30M24 10L30 30"
          stroke="#005ca9"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text
          x="38"
          y="27"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontStyle="italic"
          fontWeight="900"
          fontSize="19"
          fill="currentColor"
          letterSpacing="-0.5px"
        >
          FRONTLINE
        </text>
      </svg>
    ),
  },
  {
    name: "NexGard",
    hoverColor: "hover:text-[#f47920]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="5" y="8" width="24" height="24" rx="6" fill="#f47920" />
        <path
          d="M12 19.5L15.5 23L22 15"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="36"
          y="26"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="19"
          fill="currentColor"
        >
          Nex
        </text>
        <text
          x="70"
          y="26"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="400"
          fontSize="19"
          fill="currentColor"
        >
          Gard
        </text>
      </svg>
    ),
  },
  {
    name: "Heartgard",
    hoverColor: "hover:text-[#d00a2d]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17 29C17 29 6 20 6 13.5C6 9 9.5 5.5 14 5.5C16.5 5.5 18.5 7 20 9C21.5 7 23.5 5.5 26 5.5C30.5 5.5 34 9 34 13.5C34 20 23 29 23 29"
          fill="#d00a2d"
        />
        <path
          d="M20 10V18M16 14H24"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <text
          x="42"
          y="26"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="18"
          fill="currentColor"
          letterSpacing="-0.5px"
        >
          Heartgard
        </text>
      </svg>
    ),
  },
  {
    name: "Apoquel",
    hoverColor: "hover:text-[#008ba3]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="15" cy="20" r="5" fill="#008ba3" />
        <circle cx="27" cy="12" r="3" fill="#008ba3" opacity="0.8" />
        <circle cx="27" cy="28" r="4" fill="#008ba3" opacity="0.6" />
        <line
          x1="15"
          y1="20"
          x2="27"
          y2="12"
          stroke="#008ba3"
          strokeWidth="1.5"
        />
        <line
          x1="15"
          y1="20"
          x2="27"
          y2="28"
          stroke="#008ba3"
          strokeWidth="1.5"
        />
        <text
          x="38"
          y="26"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="700"
          fontSize="20"
          fill="currentColor"
          letterSpacing="-1px"
        >
          apoquel
        </text>
      </svg>
    ),
  },
  {
    name: "Bravecto",
    hoverColor: "hover:text-[#009b74]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 8L20 4L32 8V18C32 24 27 29 20 32C13 29 8 24 8 18V8Z"
          fill="#009b74"
        />
        <path
          d="M15 17.5L18.5 21L25.5 13.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="40"
          y="25"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="17"
          fill="currentColor"
          letterSpacing="0.5px"
        >
          BRAVECTO
        </text>
      </svg>
    ),
  },
  {
    name: "Zoetis",
    hoverColor: "hover:text-[#f37021]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="18"
          cy="20"
          r="10"
          stroke="#f37021"
          strokeWidth="4.5"
          strokeDasharray="45 15"
          fill="none"
        />
        <text
          x="36"
          y="27"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="21"
          fill="currentColor"
          letterSpacing="-0.5px"
        >
          zoetis
        </text>
      </svg>
    ),
  },
  {
    name: "Elanco",
    hoverColor: "hover:text-[#008559]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="14" r="3.5" fill="#008559" />
        <circle cx="23" cy="14" r="3.5" fill="#008559" opacity="0.8" />
        <circle cx="12" cy="25" r="3.5" fill="#008559" opacity="0.6" />
        <circle cx="23" cy="25" r="3.5" fill="#008559" opacity="0.4" />
        <text
          x="35"
          y="26"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="20"
          fill="currentColor"
          letterSpacing="-0.5px"
        >
          Elanco
        </text>
      </svg>
    ),
  },
  {
    name: "Cosequin",
    hoverColor: "hover:text-[#0c54a0]",
    svg: (
      <svg
        className="h-10 w-auto transition-all duration-300"
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 25C12 25 14 15 20 15C26 15 28 25 34 25"
          stroke="#0c54a0"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M6 18C12 18 14 8 20 8C26 8 28 18 34 18"
          stroke="#bee88a"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <text
          x="42"
          y="25"
          fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
          fontWeight="800"
          fontSize="18"
          fill="currentColor"
          letterSpacing="0.5px"
        >
          COSEQUIN
        </text>
      </svg>
    ),
  },
];

export default function BrandsSection() {
  return (
    <section
      id="brands"
      className="relative py-16 lg:py-14 bg-white border-t border-deep-navy/5 overflow-hidden"
    >
      {/* ── Background Accents ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-soft-mint/30 rounded-full filter blur-[100px] -z-10" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-green/20 bg-emerald-50/80 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-dark-green">
              Trusted Vet Brands
            </span>
          </div>

          <h2 className="font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-tight text-deep-navy sm:text-[3rem] lg:text-[3.2rem]">
            Authorized Brands We Carry
          </h2>

          <p className="mt-4 text-base font-medium leading-relaxed text-deep-navy/70">
            We partner directly with leading veterinary pharmaceutical
            manufacturers and authorized U.S. distributors. Every brand we stock
            is 100% verified and pharmacist-approved.
          </p>
        </div>

        {/* ── Infinite Logo Ticker ── */}
        <div className="relative flex overflow-hidden select-none py-8 [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)] group">
          <div className="flex gap-16 w-max animate-marquee group-hover:[animation-play-state:paused] whitespace-nowrap">
            {/* Render twice for infinite scrolling loop */}
            {[...BRANDS, ...BRANDS].map((brand, index) => (
              <div
                key={`${brand.name}-${index}`}
                className={`inline-flex items-center justify-center text-deep-navy/30 hover:scale-105 transform transition-all duration-300 cursor-pointer ${brand.hoverColor}`}
                title={brand.name}
              >
                {brand.svg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
