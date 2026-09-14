import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../api/productApi";
import {
  Pill,
  HeartPulse,
  Bone,
  Sparkles,
  Activity,
  ShieldCheck,
  Stethoscope,
  Award,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Import category images
import medicinesImg from "../../assets/medicines_cat.png";
import supplementsImg from "../../assets/supplements_cat.png";
import groomingImg from "../../assets/grooming_cat.png";
import equipmentImg from "../../assets/equipment_cat.png";
import petFoodImg from "../../assets/food_chicken_dog.png";

// Import product/shop webp images for additional categories
import dentalImg from "../../assets/images/shop/pet-oral-care-kit.webp";
import wellnessImg from "../../assets/images/shop/pet-first-aid-kit.webp";
import essentialsImg from "../../assets/images/shop/examination-gloves.webp";

const getCategoryIcon = (categoryName = "") => {
  const name = categoryName.toLowerCase();
  if (
    name.includes("medicine") ||
    name.includes("pill") ||
    name.includes("antibiotic")
  ) {
    return <Pill className="w-4.5 h-4.5" />;
  }
  if (
    name.includes("food") ||
    name.includes("bone") ||
    name.includes("treat")
  ) {
    return <Bone className="w-4.5 h-4.5" />;
  }
  if (
    name.includes("supplement") ||
    name.includes("vitamin") ||
    name.includes("heart")
  ) {
    return <HeartPulse className="w-4.5 h-4.5" />;
  }
  if (
    name.includes("grooming") ||
    name.includes("skin") ||
    name.includes("allergy") ||
    name.includes("hair")
  ) {
    return <Sparkles className="w-4.5 h-4.5" />;
  }
  if (
    name.includes("equipment") ||
    name.includes("diagnost") ||
    name.includes("tool") ||
    name.includes("stethoscope")
  ) {
    return <Stethoscope className="w-4.5 h-4.5" />;
  }
  if (
    name.includes("anxiety") ||
    name.includes("calm") ||
    name.includes("shield") ||
    name.includes("prevent")
  ) {
    return <ShieldCheck className="w-4.5 h-4.5" />;
  }
  if (
    name.includes("wellness") ||
    name.includes("health") ||
    name.includes("active")
  ) {
    return <Activity className="w-4.5 h-4.5" />;
  }
  return <Award className="w-4.5 h-4.5" />;
};

const Categories = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const data = await productApi.getCategories();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            const activeCats = data.filter(
              (cat) => cat.status?.toLowerCase() === "active",
            );
            if (activeCats.length > 0) {
              const mapped = activeCats.map((cat) => ({
                name: cat.name,
                count: `${cat._count?.products ?? 0} Products`,
                icon: getCategoryIcon(cat.name),
                image: cat.image,
              }));
              setCategories(mapped);
              setLoading(false);
              return;
            }
          }
          useDefaultCategories();
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        if (isMounted) {
          useDefaultCategories();
        }
      }
    };

    const useDefaultCategories = () => {
      setCategories([
        {
          name: "Medicines",
          count: "125+ Products",
          icon: <Pill className="w-4.5 h-4.5" />,
          image: medicinesImg,
        },
        {
          name: "Pet Food",
          count: "150+ Products",
          icon: <Bone className="w-4.5 h-4.5" />,
          image: petFoodImg,
        },
        {
          name: "Supplements",
          count: "90+ Products",
          icon: <HeartPulse className="w-4.5 h-4.5" />,
          image: supplementsImg,
        },
        {
          name: "Grooming",
          count: "75+ Products",
          icon: <Sparkles className="w-4.5 h-4.5" />,
          image: groomingImg,
        },
        {
          name: "Diagnostic Equipment",
          count: "45+ Products",
          icon: <Stethoscope className="w-4.5 h-4.5" />,
          image: equipmentImg,
        },
        {
          name: "Dental Care",
          count: "40+ Products",
          icon: <Activity className="w-4.5 h-4.5" />,
          image: dentalImg,
        },
        {
          name: "Pet Wellness",
          count: "85+ Products",
          icon: <ShieldCheck className="w-4.5 h-4.5" />,
          image: wellnessImg,
        },
        {
          name: "Clinic Essentials",
          count: "110+ Products",
          icon: <Award className="w-4.5 h-4.5" />,
          image: essentialsImg,
        },
      ]);
      setLoading(false);
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
  };

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 265; // card width + gap
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      id="categories"
      className="py-20 md:py-24 bg-gradient-to-br from-white via-[#F3F9FD] to-[#EBF5FB] relative overflow-hidden select-none"
    >
      {/* Light Background Decor with Soft Floating Shapes & Medical Cross Pattern */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
        aria-hidden="true"
      >
        {/* Soft glowing bubbles */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#18A9E5]/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#F28A16]/3 rounded-full blur-[100px]" />

        {/* Soft motion lines inspired by logo */}
        <svg
          className="absolute left-0 top-1/4 h-2/3 w-auto text-[#087BC1]/5 opacity-50"
          viewBox="0 0 400 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-100 100 C 150 150, 200 50, 250 300 C 300 550, 100 650, -100 700"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <svg
          className="absolute right-0 bottom-0 h-1/2 w-auto text-[#18A9E5]/5 opacity-40"
          viewBox="0 0 400 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M500 700 C 350 650, 250 750, 200 550 C 150 350, 300 150, 500 100"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Tiny Subtle Medical Cross patterns */}
      <div
        className="absolute top-24 right-[12%] text-[#087BC1]/5 animate-pulse pointer-events-none select-none"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="w-16 h-16" fill="currentColor">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
        </svg>
      </div>
      <div
        className="absolute bottom-24 left-[15%] text-[#F28A16]/5 animate-pulse pointer-events-none select-none"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="w-20 h-20" fill="currentColor">
          <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
        </svg>
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header with Left Heading and Right Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#087BC1] block mb-2">
              SHOP BY CATEGORY
            </span>
            <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-[#073B66] tracking-tight">
              Everything Your Pet Needs
            </h2>
            <p className="text-sm md:text-base text-[#66788A] mt-2 font-medium">
              Browse premium veterinary essentials for every stage of your pet's
              life.
            </p>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
            <button
              onClick={() => navigate("/shop")}
              className="text-[#087BC1] hover:text-[#F28A16] font-bold text-sm flex items-center gap-1.5 transition-colors cursor-pointer group focus:outline-none focus:underline"
            >
              <span>View All Categories</span>
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform" />
            </button>

            {/* Desktop Navigation Carousel Buttons */}
            <div className="hidden lg:flex items-center gap-2 border-l border-[#D9E8F2] pl-4">
              <button
                onClick={() => handleScroll("left")}
                className="w-9 h-9 rounded-full border border-[#D9E8F2] bg-white hover:bg-[#EBF5FB] hover:border-[#087BC1] text-[#073B66] hover:text-[#087BC1] flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer focus:outline-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                className="w-9 h-9 rounded-full border border-[#D9E8F2] bg-white hover:bg-[#EBF5FB] hover:border-[#087BC1] text-[#073B66] hover:text-[#087BC1] flex items-center justify-center transition-all duration-300 shadow-sm cursor-pointer focus:outline-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Premium categories Showcase Container */}
        {/* Mobile: 1.3 visible cards with snap scroll (w-[230px]) */}
        {/* Tablet: 3 visible cards (w-[240px]) */}
        {/* Desktop: 4 visible cards in horizontal slider track (w-[245px]) */}
        <div className="relative w-full overflow-visible">
          {/* Left edge fade overlay */}
          <div
            className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#F3F9FD] via-[#F3F9FD]/60 to-transparent pointer-events-none z-20 hidden lg:block"
            aria-hidden="true"
          />

          {/* Right edge fade overlay */}
          <div
            className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#EBF5FB] via-[#EBF5FB]/60 to-transparent pointer-events-none z-20 hidden lg:block"
            aria-hidden="true"
          />

          {/* Scrolling Showcase Track */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto lg:overflow-x-hidden snap-x snap-mandatory scroll-smooth pb-8 px-2 scrollbar-none items-stretch"
          >
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white/95 border border-[#EBF5FB] rounded-[28px] p-4 flex flex-col justify-between w-[230px] sm:w-[240px] md:w-[245px] h-[310px] shrink-0 animate-pulse"
                  >
                    <div className="w-full h-[190px] rounded-[22px] bg-slate-100" />
                    <div className="flex-grow flex flex-col justify-between mt-4">
                      <div className="h-5 bg-slate-100 rounded w-2/3" />
                      <div className="flex items-center justify-between mt-3">
                        <div className="h-6 bg-slate-100 rounded-full w-16" />
                        <div className="w-7 h-7 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  </div>
                ))
              : categories.map((cat, idx) => (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleCategoryClick(cat.name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCategoryClick(cat.name);
                      }
                    }}
                    className="group bg-white/95 backdrop-blur-md border border-[#EBF5FB] hover:border-[#087BC1]/30 rounded-[28px] shadow-[0_12px_45px_rgba(7,59,102,0.03)] hover:shadow-[0_20px_50px_rgba(8,123,193,0.08)] flex flex-col justify-between p-4 cursor-pointer transition-all duration-500 hover:-translate-y-1.5 select-none shrink-0 snap-center w-[230px] sm:w-[240px] md:w-[245px] h-[310px] min-h-[310px] focus:outline-none focus:ring-2 focus:ring-[#087BC1]"
                    aria-label={`Browse ${cat.name} category`}
                  >
                    {/* Product Image Frame taking 70% of the tile */}
                    <div className="w-full h-[190px] rounded-[22px] overflow-hidden relative bg-gradient-to-br from-[#F3F9FD] to-[#EBF5FB]/80 border border-[#D9E8F2]/30 shrink-0">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#073B66]/35 via-transparent to-transparent pointer-events-none" />

                      {/* Floating clinical-themed icon badge overlay */}
                      <div className="absolute top-3 left-3 p-2.5 bg-white/95 backdrop-blur-md rounded-xl text-[#087BC1] border border-[#D9E8F2]/40 shadow-sm transition-colors group-hover:border-[#F28A16]/30 duration-300">
                        {cat.icon}
                      </div>
                    </div>

                    {/* Card Text Content & Footer details taking 30% of the tile */}
                    <div className="flex flex-col justify-between flex-grow text-left">
                      <h3 className="font-heading font-extrabold text-base text-[#073B66] group-hover:text-[#087BC1] transition-colors leading-snug mt-3">
                        {cat.name}
                      </h3>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Count Pill */}
                        <span className="text-[10px] font-extrabold  px-2.5 py-1 rounded-full border border-[#D9E8F2]/10 transition-all group-hover:text-[#087BC1] shadow-xs">
                          {/* {cat.count} */}
                        </span>

                        {/* Small animated arrow button link */}
                        <div className="flex items-center gap-2 group-hover:text-[#F28A16] text-[#087BC1] font-bold text-xs transition-colors">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            Shop Now
                          </span>
                          <span className="w-7 h-7 rounded-full bg-[#F3F9FD] group-hover:bg-[#F28A16] text-[#073B66] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-xs border border-[#D9E8F2]/20">
                            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Categories;
