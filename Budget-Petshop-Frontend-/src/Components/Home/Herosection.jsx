import React from "react";
import hero1 from "../../assets/Home/hero/hero1.png";
import hero2 from "../../assets/Home/hero/hero2.png";
import hero3 from "../../assets/Home/hero/hero3.png";
import { Link } from "react-router-dom";

const shopByPet = [
  {
    name: "Dogs products",
    count: "270 ",
    note: "Food, walking gear, toys, and clean care essentials.",
  },
  {
    name: "Cats products",
    count: "220 ",
    note: "Litter, scratchers, bowls, treats, and calm home comfort.",
  },
  {
    name: "Small pets",
    count: "110 ",
    note: "Habitat support, snack packs, and daily enrichment picks.",
  },
  {
    name: "Pet parents",
    count: "150",
    note: "Storage, feeding, cleanup, and refill-friendly bundles.",
  },
];
function Herosection() {
  return (
    <>
      <section className="border-b border-outline bg-white">
        <div className="page-shell px-4 py-6 sm:px-6 sm:py-10 lg:px-8 xl:py-18">
          <div className="grid grid-cols-1 gap-10 xl:grid-cols-2 xl:items-center">
            {/* Left Content */}
            <div className="flex min-h-0 flex-col justify-center xl:min-h-[580px] xl:pr-10">
              <span className="section-kicker">FEATURED COLLECTION</span>

              <h1 className="mt-6 max-w-[720px] font-sans font-light text-[2.1rem] leading-[1.02] tracking-[-0.02em] text-on-background sm:text-[3.6rem] lg:text-[4.2rem] xl:text-[4.4rem]">
                Smart pet shopping made simple, friendly, and affordable.
              </h1>

              <p className="mt-6 max-w-[640px] text-base leading-8 text-charcoal-text sm:text-lg sm:leading-8">
                Discover quality food, toys, grooming products, and daily pet
                essentials for dogs, cats, and small pets — all in one clean
                shopping experience.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                <Link
                  to="/shop"
                  className="btn-primary-link flex items-center justify-center rounded-full border border-secondary bg-secondary px-3 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-secondary/90 sm:px-8 sm:py-4 sm:text-base"
                >
                  Start shopping
                </Link>

                <Link
                  to="/shop"
                  className="flex items-center justify-center rounded-full border border-outline bg-white px-3 py-3.5 text-center text-sm font-semibold text-on-background transition hover:bg-surface sm:px-8 sm:py-4 sm:text-base"
                >
                  Explore bundles
                </Link>
              </div>
            
            </div>

            {/* Right Visual Grid */}
            <div className="grid gap-5">
              {/* Top Images */}
              <div className="grid gap-5 md:grid-cols-2">
                <div className="store-card overflow-hidden rounded-[32px]">
                  <img
                    src={hero1}
                    alt="Dog hero"
                    className="h-[280px] w-full object-cover object-top xl:h-[310px]"
                  />
                </div>

                <div className="store-card overflow-hidden rounded-[32px]">
                  <img
                    src={hero2}
                    // src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdHy9Yf92Hua9A8bYYf2LbDhuVBUtfR51ujCfDu1H7Prxrc-uKTtbF4fkA&s=10"
                    alt="Dog and cat"
                    className="h-[280px] w-full object-cover xl:h-[310px]"
                  />
                </div>
              </div>

              {/* Bottom Section */}
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="store-card overflow-hidden rounded-[28px]">
                  <img
                    src={hero3}
                    // src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80"
                    alt="Pet care products"
                    className="h-[240px] w-full object-cover xl:h-[310px]"
                  />
                </div>

                <div className="store-card flex min-h-[240px] flex-col justify-center rounded-[28px] p-6 xl:min-h-[260px] xl:p-7">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.1rem] text-secondary">
                    Brand focus
                  </p>

                  <h3 className="mt-4 font-sans text-xl font-semibold leading-tight tracking-[-0.04em] text-on-background sm:text-2xl">
                    Budget PetShop keeps pet care easy and trustworthy.
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-charcoal-text">
                    A clean homepage helps customers quickly find pet food,
                    treats, accessories, grooming care, bundle offers, and
                    trusted products without confusion.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                    <span className="rounded-full bg-surface-soft px-1 py-2 text-[9px] min-[360px]:text-[10px] sm:text-[12px] font-semibold text-secondary text-center flex items-center justify-center sm:px-3">
                      Quality Products
                    </span>

                    <span className="rounded-full bg-surface-soft px-1 py-2 text-[9px] min-[360px]:text-[10px] sm:text-[12px] font-semibold text-secondary text-center flex items-center justify-center sm:px-3">
                      Better Deals
                    </span>

                    <span className="rounded-full bg-surface-soft px-1 py-2 text-[9px] min-[360px]:text-[10px] sm:text-[12px] font-semibold text-secondary text-center flex items-center justify-center sm:px-3">
                      Fast Shopping
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Herosection;
