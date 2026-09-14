import React from "react";
import { ArrowRight, Clock } from "lucide-react";

// Reuse the existing category images for visual consistency and premium quality
import allergyImg from "../../assets/Home/Categories/category4.png"; // Skin & Allergy Relief
import preventionImg from "../../assets/Home/Categories/category1.png"; // Flea & Tick Prevention
import calmingImg from "../../assets/Home/Categories/category5.png"; // Anxiety & Calming

const TIPS = [
  {
    id: "dog-food-allergies",
    category: "Diet & Nutrition",
    badgeColor: "bg-emerald-50 text-dark-green border-primary-green/20",
    image: allergyImg,
    readTime: "5 min read",
    date: "July 15, 2026",
    title: "Identifying & Managing Food Allergies in Dogs",
    excerpt:
      "Is your dog scratching constantly or experiencing digestive issues? Learn the difference between food allergies and sensitivities, and how to safely run an elimination diet under vet guidance.",
    author: {
      name: "Dr. Sarah Jenkins, DVM",
      initials: "SJ",
      avatarBg: "bg-linear-to-br from-primary-green to-dark-green text-white",
    },
    link: "#tips/food-allergies",
  },
  {
    id: "flea-tick-guide",
    category: "Seasonal Care",
    badgeColor: "bg-sky-50 text-medical-teal border-medical-teal/20",
    image: preventionImg,
    readTime: "4 min read",
    date: "July 12, 2026",
    title: "Flea & Tick Prevention: A Year-Round Guide",
    excerpt:
      "Flea and tick threats don't stop when winter arrives. Discover why year-round preventative care is critical to protect your pets from Lyme disease, tapeworms, and severe dermatitis.",
    author: {
      name: "Dr. Marcus Vance, DVM",
      initials: "MV",
      avatarBg: "bg-linear-to-br from-medical-teal to-sky-blue text-white",
    },
    link: "#tips/flea-prevention",
  },
  {
    id: "separation-anxiety",
    category: "Behavior & Health",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200/50",
    image: calmingImg,
    readTime: "6 min read",
    date: "July 10, 2026",
    title: "Understanding & Calming Separation Anxiety",
    excerpt:
      "Returning to the office can be stressful for pets used to constant company. Explore positive reinforcement, calming supplement options, and routine changes that ease separation distress.",
    author: {
      name: "Dr. Emily Cole, DVM",
      initials: "EC",
      avatarBg: "bg-linear-to-br from-purple-600 to-indigo-600 text-white",
    },
    link: "#tips/separation-anxiety",
  },
];

export default function PetCareTipsSection() {
  return (
    <section
      id="care-tips"
      className="relative py-16 lg:py-24  border-t border-deep-navy/5 overflow-hidden"
    >
      {/* ── Background Accents ── */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-green/5 rounded-full filter blur-3xl -z-10" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-blue/10 rounded-full filter blur-3xl -z-10" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-green/20 bg-emerald-50/80 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-dark-green">
                Expert Vet Advice
              </span>
            </div>

            <h2 className="font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-tight text-deep-navy sm:text-[3rem] lg:text-[3.2rem]">
              Pet Care & Wellness Tips
            </h2>

            <p className="mt-4 text-base font-medium leading-relaxed text-deep-navy/70">
              Read veterinary-approved articles, guidebooks, and medical guides
              curated by our licensed pharmacists and pet healthcare
              professionals.
            </p>
          </div>

          <div className="hidden md:block">
            <a
              href="#tips"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-deep-navy/10 text-sm font-extrabold text-deep-navy bg-white hover:bg-deep-navy hover:text-white hover:border-deep-navy hover:shadow-md transition-all duration-300 group"
            >
              <span>View All Articles</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* ── Article Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TIPS.map((tip) => (
            <article
              key={tip.id}
              className="group relative flex flex-col rounded-3xl border border-deep-navy/6 bg-white/60 backdrop-blur-md overflow-hidden shadow-soft hover:shadow-[0_20px_40px_rgba(15,45,82,0.08)] hover:border-primary-green/20 hover:-translate-y-1.5 transition-all duration-500 h-full cursor-pointer"
              onClick={() => {
                window.location.href = tip.link;
              }}
            >
              {/* Card Image Area (Full Bleed) */}
              <div className="relative h-48 w-full overflow-hidden bg-soft-mint">
                <img
                  src={tip.image}
                  alt={tip.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-deep-navy/15 via-transparent to-transparent pointer-events-none" />

                {/* Floating Category Tag */}
                <div
                  className={`absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${tip.badgeColor} shadow-xs`}
                >
                  {tip.category}
                </div>
              </div>

              {/* Card Body Content */}
              <div className="flex flex-col flex-1 p-6">
                {/* Meta details */}
                <div className="flex items-center gap-3 text-xs font-semibold text-deep-navy/55 mb-2.5">
                  <span className="flex items-center gap-1.2">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {tip.readTime}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-deep-navy/20" />
                  <span>{tip.date}</span>
                </div>

                {/* Title */}
                <h3 className="font-display text-lg font-extrabold text-deep-navy group-hover:text-primary-green tracking-tight leading-snug transition-colors duration-300 mb-2">
                  <a href={tip.link}>{tip.title}</a>
                </h3>

                {/* Excerpt */}
                <p className="text-sm font-medium leading-relaxed text-deep-navy/70 line-clamp-3 mb-6">
                  {tip.excerpt}
                </p>

                {/* Card Footer: Author Profile & Clean CTA */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-deep-navy/5">
                  {/* Author details */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex items-center justify-center h-8 w-8 rounded-full font-extrabold text-[10px] tracking-tight shadow-inner shrink-0 ${tip.author.avatarBg}`}
                    >
                      {tip.author.initials}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-deep-navy leading-tight">
                        {tip.author.name}
                      </p>
                      <p className="text-[9px] font-semibold text-deep-navy/40 mt-0.5">
                        Veterinarian Writer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
