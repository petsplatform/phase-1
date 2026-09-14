import React, { useState, useRef, useEffect } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getStoreContentApi } from "../../helper/axiosInstance";

function PromoBannerSkeleton() {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between py-10 px-8 sm:px-10 rounded-[28px] border border-deep-navy/8 bg-linear-to-br from-slate-50 to-slate-100 shadow-soft relative overflow-hidden animate-pulse">
      {/* Left Column: Text & CTA Skeleton */}
      <div className="flex flex-col items-start text-left md:w-[50%] z-10 w-full">
        {/* Badge Skeleton */}
        <div className="h-6 w-32 bg-slate-200/80 rounded-full mb-4" />

        {/* Title Skeleton */}
        <div className="h-8 bg-slate-200/80 rounded-lg w-11/12 mb-3" />
        <div className="h-8 bg-slate-200/80 rounded-lg w-8/12 mb-4" />

        {/* Subtext Skeleton */}
        <div className="h-4 bg-slate-200/80 rounded-md w-full mb-2" />
        <div className="h-4 bg-slate-200/80 rounded-md w-10/12 mb-6" />

        {/* Button Skeleton */}
        <div className="h-12 w-44 bg-slate-200/80 rounded-full" />
      </div>

      {/* Right Column: Image Frame Skeleton */}
      <div className="relative mt-6 md:mt-0 w-[90%] sm:w-[75%] md:w-[45%] flex justify-center md:justify-end z-10">
        <div className="w-full aspect-square rounded-[24px] border-4 border-white bg-slate-200 shadow-soft overflow-hidden relative" />
      </div>
    </div>
  );
}

export default function PromoBannerSection() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;

    getStoreContentApi()
      .then((res) => {
        if (!active) return;

        const apiBanners = res?.data?.banners || [];

        // Filter out inactive banners from the CMS
        const activeBanners = apiBanners.filter(
          (item) => item.status === "Active",
        );

        if (activeBanners.length > 0) {
          const mapped = activeBanners.map((item, index) => {
            const fallbackGrads = [
              "from-soft-mint/70 via-white/80 to-white/90",
              "from-light-blue/70 via-white/80 to-white/90",
            ];
            const fallbackBtnBgs = [
              "bg-linear-to-br from-primary-green to-dark-green shadow-[0_12px_24px_rgba(88,185,71,0.2)] hover:shadow-[0_16px_32px_rgba(88,185,71,0.3)] text-white",
              "bg-linear-to-br from-medical-teal to-primary-green shadow-[0_12px_24px_rgba(0,139,139,0.2)] hover:shadow-[0_16px_32px_rgba(0,139,139,0.3)] text-white",
            ];
            const styleIdx = index % fallbackGrads.length;

            return {
              id: item.id || `banner-${index}`,
              badge: item.badge || "PROMO",
              title: item.title || item.heading || "",
              description:
                item.description ||
                item.subtitle ||
                item.message ||
                item.text ||
                "",
              buttonName: item.buttonText || item.buttonName || "Learn More",
              buttonLink: item.link || item.buttonLink || "#",
              image: item.image || null,
              gradient: item.gradient || fallbackGrads[styleIdx],
              btnBg: item.btnBg || fallbackBtnBgs[styleIdx],
              badgeBg: item.badgeBg || "bg-emerald-50/80",
              badgeText: item.badgeText || "text-dark-green",
              badgeBorder: item.badgeBorder || "border-primary-green/20",
            };
          });
          setBanners(mapped);
        } else {
          setBanners([]);
        }
      })
      .catch(() => {
        if (active) setBanners([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const children = Array.from(container.children);
      const containerLeft = container.getBoundingClientRect().left;
      
      let closestIdx = 0;
      let minDiff = Infinity;
      children.forEach((child, idx) => {
        const diff = Math.abs(child.getBoundingClientRect().left - containerLeft);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      setActiveIndex(closestIdx);
    }
  };

  const scrollToCard = (index) => {
    if (scrollRef.current) {
      const card = scrollRef.current.children[index];
      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "start",
        });
        setActiveIndex(index);
      }
    }
  };

  if (!loading && banners.length === 0) return null;

  return (
    <section className="relative pt-4 pb-16 lg:pt-6 lg:pb-24 bg-transparent">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-emerald-100/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {loading ? (
          /* Banners Loading Skeletons */
          <div className="flex gap-6 lg:gap-10 overflow-hidden">
            <div className="w-[88%] sm:w-[48%] md:w-[calc(50%-12px)] lg:w-[calc(50%-20px)] shrink-0">
              <PromoBannerSkeleton />
            </div>
            <div className="w-[88%] sm:w-[48%] md:w-[calc(50%-12px)] lg:w-[calc(50%-20px)] shrink-0">
              <PromoBannerSkeleton />
            </div>
          </div>
        ) : (
          /* Desktop & Mobile Slider unified container */
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-6 lg:gap-10 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none pb-6"
          >
            {banners.map(
              ({
                id,
                badge,
                badgeBg,
                badgeText: badgeTextColor,
                badgeBorder,
                title,
                description,
                buttonName,
                buttonLink,
                image,
                gradient,
                btnBg,
              }) => {
                return (
                  <div
                    key={id}
                    className={`w-[88%] sm:w-[48%] md:w-[calc(50%-12px)] lg:w-[calc(50%-20px)] shrink-0 snap-start flex flex-col md:flex-row items-center justify-between py-8 px-6 sm:py-10 sm:px-10 rounded-[28px] border border-deep-navy/8 bg-linear-to-br ${gradient} shadow-soft hover:shadow-[0_24px_60px_rgba(15,45,82,0.15)] hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group`}
                  >
                    {/* Left Column: Text & CTA */}
                    <div
                      className={`flex flex-col items-start text-left ${image ? "md:w-[50%]" : "md:w-full"} z-10`}
                    >
                      {/* Badge / Tag */}
                      {badge && (
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full border ${badgeBorder} ${badgeBg} px-2.5 py-1 mb-3.5`}
                        >
                          <span
                            className={`text-[9px] font-extrabold uppercase tracking-widest ${badgeTextColor}`}
                          >
                            {badge}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="font-display text-2xl sm:text-3xl lg:text-[1.9rem] font-extrabold leading-[1.15] tracking-tight text-deep-navy mb-3">
                        {title}
                      </h3>

                      {/* Subtext */}
                      <p className="text-sm font-medium leading-relaxed text-deep-navy/70 mb-6 max-w-[95%]">
                        {description}
                      </p>

                      {/* Button */}
                      <a
                        href={buttonLink}
                        className={`group/btn inline-flex items-center gap-2.5 rounded-full px-6 py-3.5 text-sm font-extrabold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${btnBg}`}
                      >
                        {buttonName}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                      </a>
                    </div>

                    {/* Right Column: Image Frame */}
                    {image && (
                      <div className="relative mt-6 md:mt-0 w-[70%] sm:w-[60%] md:w-[45%] max-w-[240px] flex justify-center md:justify-end z-10">
                        <div className="w-full aspect-square rounded-[24px] border-4 border-white bg-white shadow-soft overflow-hidden relative transition-transform duration-500 group-hover:scale-[1.02] group-hover:rotate-1">
                          <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover rounded-[20px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}

        {/* Carousel Navigation (Arrows + Dots) */}
        {!loading && banners.length > 1 && (
          <div className={`items-center justify-center gap-4 mt-6 ${banners.length > 2 ? "flex" : "flex lg:hidden"}`}>
            {/* Prev Arrow */}
            <button
              onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="p-2.5 rounded-full border border-slate-200 bg-white text-deep-navy shadow-xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer"
              aria-label="Previous promo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="flex gap-2.5">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToCard(index)}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === index
                      ? "bg-primary-green scale-110"
                      : "bg-primary-green/20"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Arrow */}
            <button
              onClick={() => scrollToCard(Math.min(banners.length - 1, activeIndex + 1))}
              disabled={activeIndex === banners.length - 1}
              className="p-2.5 rounded-full border border-slate-200 bg-white text-deep-navy shadow-xs hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 cursor-pointer"
              aria-label="Next promo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
