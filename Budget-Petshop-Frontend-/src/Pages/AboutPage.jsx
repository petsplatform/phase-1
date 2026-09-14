import { useState } from "react";
import { Link } from "react-router-dom";
import { values, reviews } from "../utils/About/about";
import about1 from "../assets/About/about1.png";
import about2 from "../assets/About/about2.png";
import about3 from "../assets/About/about3.png";
import {
  Sparkles,
  Heart,
  Award,
  Users,
  CheckCircle,
  ThumbsUp,
  Star,
  Quote,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function AboutPage() {
  const stats = [
    { label: "Happy Pets Served", value: "50K+" },
    { label: "Orders Delivered", value: "100K+" },
    { label: "Veterinary Partners", value: "15+" },
    { label: "Average Rating", value: "4.9/5" },
  ];

  const [activeReviewIndex, setActiveReviewIndex] = useState(0);

  const handleNextReview = () => {
    setActiveReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const handlePrevReview = () => {
    setActiveReviewIndex(
      (prev) => (prev - 1 + reviews.length) % reviews.length,
    );
  };

  // Smooth scroll helper to values block
  const handleScrollToPillars = () => {
    const targetElement = document.getElementById("pet-care-pillars");
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="bg-background min-h-screen font-sans overflow-x-hidden">
      {/* 1. Hero Block (Premium Split Grid layout with textured background) */}
      <div className="relative bg-gradient-to-b from-secondary/15 via-secondary/4 to-transparent pb-24 border-b border-outline">
        {/* Decorative Grid Mesh & Ambient Glow */}
        <div className="absolute inset-0 grain-panel opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 right-1/10 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none animate-glow" />
        <div
          className="absolute bottom-10 left-1/12 w-80 h-80 bg-secondary/10 rounded-full blur-2xl pointer-events-none animate-glow"
          style={{ animationDelay: "2s" }}
        />

        {/* Breadcrumbs */}
        <div className="relative z-10 page-shell px-4 pt-8 pb-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#8a8f88]">
            <Link to="/" className="transition hover:text-secondary">
              Home
            </Link>
            <span>/</span>
            <span className="text-secondary font-bold">About Us</span>
          </nav>
        </div>

        {/* Split Hero Layout */}
        <div className="relative z-10 page-shell px-4 pt-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 border border-outline rounded-full bg-white px-5 py-2 text-xs font-bold tracking-wider text-secondary uppercase shadow-sm">
                <Sparkles size={14} className="text-secondary animate-pulse" />
                Our Story & Mission
              </div>

              <h1 className="text-4xl font-bold text-on-background sm:text-5xl lg:text-6xl tracking-tight leading-[1.12]">
                Crafting Affordable Happiness <br />
                <span className="text-secondary relative">
                  For Every Single Pet
                  <span className="absolute bottom-1 left-0 w-full h-1 bg-secondary/20 rounded-full" />
                </span>
              </h1>

              <p className="text-base md:text-lg font-semibold text-charcoal-text leading-relaxed max-w-2xl">
                Welcome to Budget PetShop, where our mission is simple: to make
                premium pet care products accessible to every pet owner. Founded
                by a team of passionate pet parents and professional animal
                nutritionists, we set out to change pet retailing by cutting
                unnecessary overhead, partnering directly with ethical
                manufacturers, and passing those savings directly to you.
              </p>

              {/* Call-to-actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-4 sm:flex sm:flex-wrap sm:gap-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/95 btn-primary-link font-bold text-xs sm:text-sm px-3 py-3.5 sm:px-7 sm:py-4.5 shadow-lg shadow-secondary/25 transition-all duration-200 active:scale-95 cursor-pointer text-center leading-tight"
                >
                  <span>Explore Treats & Toys</span>
                  <ArrowRight size={14} className="shrink-0" />
                </Link>

                <button
                  onClick={handleScrollToPillars}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-outline hover:border-secondary bg-white text-on-background font-bold text-xs sm:text-sm px-3 py-3.5 sm:px-6 sm:py-4.5 shadow-sm transition-all duration-200 active:scale-95 cursor-pointer text-center leading-tight"
                >
                  <span>Our Care Pillars</span>
                  <ChevronDown size={14} className="text-secondary shrink-0" />
                </button>
              </div>
            </div>

            {/* Right Collage Column */}
            <div className="lg:col-span-5 relative mt-8 lg:mt-0 flex justify-center">
              {/* Collage Frame Wrapper */}
              <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center">
                {/* Background Dot Texture Plate */}
                <div className="absolute inset-4 rounded-[36px] bg-secondary/5 border border-outline grain-panel pointer-events-none" />

                {/* Main Image Card (Asymmetric Styled Frame) */}
                <div className="absolute top-4 right-4 w-[82%] aspect-[4/5] rounded-[32px] overflow-hidden border border-outline bg-white p-3.5 shadow-xl transition-transform duration-500 hover:rotate-1">
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    <img
                      src={about1}
                      // src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800"
                      alt={about1}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Overlapping Cat Card (Bottom Left Offset) */}
                <div className="absolute bottom-4 left-0 w-[50%] aspect-square rounded-[24px] overflow-hidden border border-outline bg-white p-2.5 shadow-lg transition-transform duration-500 hover:-rotate-2">
                  <div className="w-full h-full rounded-[16px] overflow-hidden relative">
                    <img
                      src={about2}
                      alt={about2}
                      // src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400"
                      // alt="Cute kitten"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

          

               
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Who We Are Block (White Background - Redesigned Row Layout) */}
      <div className="bg-white border-b border-outline py-24">
        <div className="page-shell px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Row 1: Who We Are Story & Main Image */}
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Image Polaroid Frame (lg:col-span-5) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-[390px] aspect-square rounded-[36px] bg-background p-4 border border-outline shadow-md hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 rounded-[36px] border-2 border-dashed border-secondary/20 m-2.5 pointer-events-none" />
                <div className="w-full h-full rounded-[24px] overflow-hidden relative border border-outline">
                  <img
                    src={about3}
                    // src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800"
                    alt={about3}
                    className="w-full h-full object-cover"
                  />
                  {/* Floating Seal */}
                  <div className="absolute bottom-4 right-4 bg-white border border-outline rounded-full py-1.5 px-3.5 shadow-md flex items-center gap-1.5 pointer-events-none text-xs font-bold text-secondary">
                    <Heart
                      size={13}
                      className="fill-secondary text-secondary animate-pulse"
                    />
                    <span>Driven by Love</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Story Column (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-widest">
                <Users size={14} className="text-secondary" />
                Who We Are
              </div>

              <h2 className="text-3xl font-bold text-on-background sm:text-4xl tracking-tight leading-tight">
                A Passionate Community <br />
                Of Devoted Pet Advocates
              </h2>

              <p className="text-base md:text-lg font-semibold text-secondary leading-relaxed">
                We are more than just an online store. We are a family of pet
                parents committed to ensuring that every dog, cat, and furry
                friend receives top-tier care without stress on your budget.
              </p>

              <p className="text-sm md:text-base font-semibold text-charcoal-text leading-relaxed">
                Our team consists of pet nutrition experts, veterinary
                consultants, and seasoned designers who evaluate every treat,
                toy, and supply formulation before they reach our shelves. We
                cut middleman markups, partnering directly with ethical
                suppliers to pass maximum value to your home.
              </p>

              {/* Commitment Checklist Grid */}
              <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-outline">
                {[
                  "100% Quality Vetted Standards",
                  "Affordable Pricing Promise",
                  "Veterinarian Approved Products",
                  "24/7 Helpline Advisor Support",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                      <CheckCircle size={15} />
                    </div>
                    <span className="text-sm font-bold text-on-background">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Stats & Quote separated dashboard sub-row */}
          <div className="grid gap-8 lg:grid-cols-12 mt-20 pt-16 border-t border-outline">
            {/* Left Quote Card Block (lg:col-span-7) */}
            <div className="lg:col-span-7 rounded-[28px] border border-outline bg-secondary/[0.03] p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between shadow-[0_15px_30px_rgba(28,40,33,0.01)] hover:border-secondary/30 transition-all duration-300">
              <div className="absolute top-6 right-6 text-secondary/10 pointer-events-none">
                <Quote size={80} />
              </div>
              <div className="relative z-10 space-y-6">
                <p className="text-base md:text-lg font-semibold italic text-secondary leading-relaxed">
                  "Pets are not just our companions; they are members of our
                  family who deserve the absolute best care. We founded Budget
                  PetShop to solve a real problem: making sure quality
                  ingredients and safety are affordable for every household."
                </p>
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-background">
                      The Founders Team
                    </p>
                    <p className="text-xs font-semibold text-charcoal-text">
                      Budget PetShop Founders & Devoted Pet Parents
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Stats Block Grid (lg:col-span-5) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-background border border-outline rounded-[20px] p-6 text-center flex flex-col justify-center transition-all duration-300 hover:shadow-[0_15px_30px_rgba(138,114,199,0.06)] hover:-translate-y-1 hover:border-secondary/35 shadow-sm"
                >
                  <p className="text-3xl md:text-4xl font-bold text-secondary">
                    {stat.value}
                  </p>
                  <p className="text-xs md:text-sm font-bold text-charcoal-text mt-2 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Values Block (Redesigned with watermarks, animated bottom borders, and glowing hover states) */}
      <div
        id="pet-care-pillars"
        className="bg-secondary/[0.03] py-24 border-b border-outline relative overflow-hidden"
      >
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 grain-panel opacity-25 pointer-events-none" />

        <div className="relative z-10 page-shell px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-on-background sm:text-4xl">
              Our Pillars of Pet Care
            </h2>
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="h-[1px] w-12 bg-outline-strong" />
              <Heart size={14} className="text-secondary fill-secondary" />
              <span className="h-[1px] w-12 bg-outline-strong" />
            </div>
            <p className="mt-4 text-sm md:text-base font-semibold text-charcoal-text">
              How we maintain high standards while keeping prices down.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, idx) => {
              const IconComponent = value.icon;
              const formattedNumber = `0${idx + 1}`;
              return (
                <div
                  key={idx}
                  className="group bg-white rounded-[24px] border border-outline p-8 relative overflow-hidden flex flex-col justify-between shadow-[0_10px_30px_rgba(28,40,33,0.01)] hover:shadow-[0_20px_45px_rgba(138,114,199,0.08)] hover:border-secondary/40 transition-all duration-300"
                >
                  {/* Sliding animated bottom border */}
                  <div className="absolute bottom-0 left-0 w-0 h-1 bg-secondary group-hover:w-full transition-all duration-300" />

                  {/* Index Number Watermark */}
                  <div className="absolute top-4 right-6 text-5xl font-bold text-secondary/[0.07] select-none pointer-events-none transition-all duration-300 group-hover:text-secondary/[0.12]">
                    {formattedNumber}
                  </div>

                  <div className="space-y-6">
                    {/* Glowing, floating Icon Box */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-secondary/10 text-secondary border border-secondary/15 transition-all duration-300 group-hover:bg-secondary group-hover:text-white group-hover:scale-110 group-hover:rotate-6">
                      <IconComponent size={26} />
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-on-background group-hover:text-secondary transition-colors duration-200">
                        {value.title}
                      </h3>
                      <p className="text-xs md:text-sm font-semibold text-charcoal-text leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Pledge Block (Soft Cream Background - Redesigned Guarantee Layout) */}
      <div className="bg-background py-24">
        <div className="page-shell px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-[32px] border border-outline p-10 sm:p-14 shadow-[0_30px_60px_rgba(28,40,33,0.04)] text-center relative overflow-hidden">
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/5 rounded-full translate-x-16 -translate-y-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/5 rounded-full -translate-x-12 translate-y-12 blur-2xl" />

            {/* Decorative Grid Mesh */}
            <div className="absolute inset-0 grain-panel opacity-[0.12] pointer-events-none" />

            <div className="relative z-10 space-y-10">
              {/* Double Ring Guarantee Seal Badge */}
              <div className="flex justify-center">
                <div className="relative flex items-center justify-center h-20 w-20 rounded-full border border-secondary/20 bg-secondary/5 p-2 shadow-sm">
                  {/* Outer spinning dashed ring on hover */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dashed border-secondary/30 animate-spin"
                    style={{ animationDuration: "24s" }}
                  />
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-white shadow-md">
                    <ThumbsUp size={28} className="animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-4 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-on-background sm:text-4xl">
                  Our Promise to You
                </h2>
                <p className="text-base md:text-lg font-semibold text-charcoal-text leading-relaxed">
                  We stand behind every item we offer. If you or your pet are
                  not completely satisfied with a purchase, we promise to make
                  it right. No stress, no hassles.
                </p>
              </div>

              {/* Guarantees Row Checklist */}
              <div className="grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto pt-8 border-t border-outline">
                {[
                  {
                    title: "30-Day Money-Back",
                    desc: "No-hassle, easy returns on open items",
                  },
                  {
                    title: "Handpicked Safety",
                    desc: "Direct sourcing with full testing",
                  },
                  {
                    title: "24/7 Helpline Access",
                    desc: "Advice whenever your pet needs it",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 text-center p-5 rounded-2xl bg-secondary/[0.02] border border-outline/50 hover:border-secondary/20 hover:bg-secondary/[0.04] transition-all duration-300 shadow-sm"
                  >
                    <p className="text-sm font-bold text-on-background">
                      {item.title}
                    </p>
                    <p className="text-xs font-semibold text-charcoal-text">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-4 flex justify-center">
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-2 rounded-full bg-secondary hover:bg-secondary/95 btn-primary-link font-bold text-sm px-8 py-4.5 shadow-lg shadow-secondary/25 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <span className="btn-primary-link ">
                    Explore Budget Treats & Toys
                  </span>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
