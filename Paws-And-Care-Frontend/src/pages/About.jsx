import React from "react";
import {
  ShieldCheck,
  Leaf,
  Heart,
  Truck,
  Award,
  Sparkles,
  Smile,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="bg-brand-bg min-h-screen text-brand-text font-sans">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-brand-peach/40 via-transparent to-transparent">
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-brand-coral/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-96 h-96 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-coral/10 text-brand-coral font-heading font-black text-xs uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Discover Our Mission</span>
          </div>

          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-brand-text tracking-tight max-w-4xl mx-auto leading-tight">
            We are dedicated to the wellness of{" "}
            <span className="text-brand-coral">every tail</span>.
          </h1>

          <p className="font-sans text-base sm:text-lg text-brand-muted max-w-2xl mx-auto leading-relaxed">
            At Paws & Care, we believe that pet care should be premium, easy,
            and completely vet-approved. We curate the finest organic nutrition,
            grooming essentials, and active play gear for your loyal companions.
          </p>

          <div className="pt-4">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-brand-coral hover:bg-brand-coral-dark text-white font-heading font-black text-sm uppercase tracking-wide rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
            >
              Explore Our Collection
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats Section */}
      <section className="py-12 border-y border-brand-border bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50k+", label: "Happy Pets Served" },
              { number: "120+", label: "Premium Products" },
              { number: "99.8%", label: "Positive Feedback" },
              { number: "100%", label: "Vet-Approved Essentials" },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-brand-coral">
                  {stat.number}
                </div>
                <div className="font-heading font-bold text-xs sm:text-sm text-brand-muted tracking-wide uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Our Brand Story Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Story Text */}
            <div className="space-y-6 text-left">
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-brand-text leading-tight">
                Crafted for Quality, Trusted by Veterinarians.
              </h2>

              <div className="w-16 h-1 bg-brand-coral rounded-full" />

              <p className="font-sans text-sm sm:text-base text-brand-muted leading-relaxed">
                Paws & Care started with a simple observation: finding
                high-quality, vet-approved pet essentials that combine organic
                health with daily joy shouldn't be a search. We partnered with
                leading veterinary experts and organic nutritionists to create a
                reliable haven for premium pet wellness.
              </p>

              <p className="font-sans text-sm sm:text-base text-brand-muted leading-relaxed">
                From wholesome, allergen-free teething treats to nutrient-dense
                formulas, we trace every ingredient. Every item in our catalogue
                passes a rigorous certification standard, ensuring your family
                members receive only the safest, most effective products.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex items-center gap-3 bg-brand-peach/40 p-4 rounded-2xl border border-brand-border/40">
                  <Award className="text-brand-coral shrink-0" size={24} />
                  <div>
                    <h4 className="font-heading font-black text-xs uppercase text-brand-text">
                      Premium Grade
                    </h4>
                    <p className="text-[11px] text-brand-muted">
                      Only human-grade, organic ingredients are sourced.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-brand-peach/40 p-4 rounded-2xl border border-brand-border/40">
                  <ShieldCheck
                    className="text-brand-coral shrink-0"
                    size={24}
                  />
                  <div>
                    <h4 className="font-heading font-black text-xs uppercase text-brand-text">
                      100% Certified
                    </h4>
                    <p className="text-[11px] text-brand-muted">
                      Vetted and recommended by trusted clinics.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Card Stack representing premium vibe */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-full max-w-sm aspect-square bg-gradient-to-tr from-brand-coral/20 to-brand-teal/20 rounded-[2.5rem] p-8 flex flex-col justify-between border border-brand-border relative overflow-hidden shadow-sm">
                {/* Visual decorations */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-brand-coral/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-brand-coral shadow-sm mb-6">
                    <Heart className="fill-current" size={20} />
                  </div>
                  <h3 className="font-heading font-black text-2xl text-brand-text mb-2">
                    Our Promise
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed font-sans">
                    "We promise to never compromise on ingredients, wellness
                    guidelines, or the trust you put in us. Your pet's longevity
                    and daily tail wags are our single focus."
                  </p>
                </div>

                <div className="relative z-10 border-t border-brand-border/60 pt-4 mt-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center font-heading font-black text-xs">
                    V
                  </div>
                  <div>
                    <h5 className="font-heading font-black text-xs text-brand-text leading-none">
                      Paws & Care Team
                    </h5>
                    <p className="text-[10px] text-brand-muted">
                      Vets & Pet Lovers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Why Choose Us (Core Value Cards Grid) */}
      <section
        id="why-choose-us"
        className="py-16 sm:py-24 bg-white relative z-10 border-t border-brand-border"
      >
        <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-brand-text">
              Why Pets & Owners Love Us
            </h2>
            <p className="font-sans text-sm sm:text-base text-brand-muted max-w-xl mx-auto leading-relaxed">
              We focus on the small details that make a massive difference in
              your pet's life, longevity, and overall happiness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                icon: <ShieldCheck size={22} />,
                title: "Vet-Approved Excellence",
                desc: "Every recipe, teething toy, and supplement undergoes validation by certified experts.",
              },
              {
                icon: <Leaf size={22} />,
                title: "Premium Organic Ingredients",
                desc: "No artificial preservatives, filler compounds, or low-grade processing methods.",
              },
              {
                icon: <Heart size={22} />,
                title: "24/7 Care Guidance",
                desc: "Speak to support or find resources on pet wellness and care guides anytime.",
              },
              {
                icon: <Truck size={22} />,
                title: "Seamless Shipping",
                desc: "Quick dispatch and free shipping on eligible orders. Simple, hassle-free returns.",
              },
            ].map((value, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl border border-brand-border/60 hover:border-brand-coral bg-brand-bg/10 hover:bg-white transition-all duration-300 flex flex-col gap-4 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-brand-peach/40 text-brand-coral flex items-center justify-center border border-brand-border/30 group-hover:bg-brand-coral group-hover:text-white transition-all duration-300 shrink-0">
                  {value.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-heading font-black text-sm text-brand-text">
                    {value.title}
                  </h3>
                  <p className="font-sans text-xs text-brand-muted leading-relaxed">
                    {value.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
