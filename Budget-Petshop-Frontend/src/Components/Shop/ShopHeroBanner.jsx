import bgimage from "../../assets/Shop/shop-bg.png";

const TRUST_BADGES = [
  // "Free shipping over $49",
  "30-day easy returns",
  "Vet-approved products",
  "Secure checkout",
];

function ShopHeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl ">
      <div className="absolute inset-0 bg-gradient-to-r from-[#8A72C7] via-[#9A84D3] to-[#F6F3FC]" />
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#BCA9EA]/40 blur-[140px]" />
      <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-white/25 blur-[120px]" />
      <div className="absolute bottom-0 right-20 h-72 w-72 rounded-full bg-[#D8CCF5]/40 blur-[120px]" />
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[100px]" />

      <div className="relative z-10 grid min-h-[420px] items-center gap-8 px-4 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-14">
        {/* Left Image */}
        <div className="relative flex h-full items-end justify-center lg:justify-start">
          <img
            src={bgimage}
            alt="Pet collection"
            className="max-h-[590px] w-full max-w-[720px] object-contain object-left-bottom"
          />
        </div>

        {/* Right Content */}
        <div className="text-center lg:text-left">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white px-5 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-secondary backdrop-blur">
            New Season Sale
          </span>

          <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Everything your pet <span className="text-secondary">deserves</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-8 text-white sm:text-lg">
            Shop premium pet essentials — from gourmet food to cozy beds,
            grooming picks, toys, and daily care favorites.
          </p>

        

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/60 pt-6 sm:grid-cols-4 lg:max-w-xl">
            {TRUST_BADGES.map((label) => (
              <span
                key={label}
                className="text-xs font-bold leading-5 text-white"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShopHeroBanner;
