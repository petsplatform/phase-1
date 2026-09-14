import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { brandsData } from "../../utils/home/brands.js";

// Helper component to handle both internal router links and hash/external links
function SmartLink({ to, children, ...props }) {
  const isExternalOrHash =
    to.startsWith("http") ||
    to.startsWith("#") ||
    to.startsWith("mailto:") ||
    to.startsWith("tel:");
  if (isExternalOrHash) {
    return (
      <a href={to} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}

export default function TrustSection({ banners }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = (e) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setActiveIndex(index);
    }
  };

  const scrollToSlide = (index) => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      containerRef.current.scrollTo({
        left: index * width,
        behavior: "smooth",
      });
      setActiveIndex(index);
    }
  };

  const bannersList = Array.isArray(banners) ? banners.slice(0, 2) : [];

  return (
    <section className="py-16 bg-white select-none relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#fdf5ff]/60 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {bannersList.length > 0 && (
          <>
            {/* PART 2: Premium Promo Banners Grid (Desktop: visible on md and up) */}
            <div className="hidden md:grid grid-cols-1 xl:grid-cols-2 gap-8">
              {bannersList.map((banner, index) => (
                <div
                  key={banner.id || index}
                  className="relative rounded-[32px] border border-white/80 p-8 md:p-10 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] group flex flex-col justify-between"
                  style={{
                    background:
                      index === 0
                        ? "linear-gradient(135deg, rgba(255, 252, 249, 0.95) 0%, rgba(250, 245, 255, 0.95) 100%)"
                        : "linear-gradient(135deg, rgba(255, 252, 249, 0.95) 0%, rgba(246, 240, 255, 0.95) 100%)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div
                    className={`absolute top-[-20%] right-[-10%] w-[300px] h-[300px] rounded-full ${
                      banner.glowColor || "bg-[#fbcfe8]/20"
                    } blur-[80px] pointer-events-none`}
                  ></div>

                  <div className="grid grid-cols-12 gap-6 items-center relative z-10">
                    <div className="col-span-7 text-left flex flex-col items-start justify-center">
                      {banner.badge && (
                        <div
                          className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4 shadow-sm ${
                            banner.pillBg || "bg-[#FFF7EF]"
                          } ${banner.pillBorder || "border-[#FF9E8A]/30"} ${
                            banner.pillText || "text-brand-brown"
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-brand-peach" />
                          <span>{banner.badge}</span>
                        </div>
                      )}

                      {/* Title as Link */}
                      {banner.link ? (
                        <SmartLink
                          to={banner.link}
                          className="group/title block cursor-pointer"
                        >
                          <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-extrabold text-brand-purple tracking-tight leading-[1.2] hover:text-[#a855f7] transition-colors duration-300">
                            {banner.title}
                          </h3>
                        </SmartLink>
                      ) : (
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-display font-extrabold text-brand-purple tracking-tight leading-[1.2]">
                          {banner.title}
                        </h3>
                      )}

                      {/* Subtitle */}
                      <p className="text-brand-brown/70 text-xs sm:text-sm mt-3 leading-relaxed font-medium">
                        {banner.subtitle}
                      </p>

                      {/* Desktop CTA Button */}
                      {banner.buttonText && banner.buttonLink && (
                        <div className="mt-6 flex items-center">
                          <SmartLink
                            to={banner.buttonLink}
                            className="inline-flex items-center justify-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all duration-300 active:scale-97 shadow-md hover:shadow-lg hover:shadow-brand-purple/20 cursor-pointer group text-center"
                          >
                            <span>{banner.buttonText}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                          </SmartLink>
                        </div>
                      )}
                    </div>

                    {/* RIGHT IMAGE COLUMN */}
                    <div className="col-span-5 relative flex items-center justify-center">
                      {/* Glow behind image */}
                      <div className="absolute w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-brand-peach/10 to-brand-purple/10 blur-xl -z-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

                      {/* Image Container with rotation effects */}
                      {banner.image &&
                        (banner.link ? (
                          <SmartLink
                            to={banner.link}
                            className="w-full block cursor-pointer relative z-10 transition-all duration-500 hover:scale-[1.03] hover:rotate-1"
                          >
                            <div className="relative rounded-2xl p-2 border border-white/60 bg-white/30 backdrop-blur-md shadow-md overflow-hidden hover:shadow-lg transition-all duration-500">
                              <img
                                src={banner.image}
                                alt={banner.title}
                                className="w-full h-auto object-cover rounded-xl aspect-[4/3] sm:aspect-square transition-transform duration-500 group-hover:scale-[1.02]"
                              />
                            </div>
                          </SmartLink>
                        ) : (
                          <div className="w-full relative z-10 rounded-2xl p-2 border border-white/60 bg-white/30 backdrop-blur-md shadow-md overflow-hidden">
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="w-full h-auto object-cover rounded-xl aspect-[4/3] sm:aspect-square"
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View: Carousel of Banners (visible on screens below md) */}
            <div className="block md:hidden relative w-full px-2">
              {/* Scrollable container with CSS Snap-Scroll */}
              <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 scroll-smooth w-full pb-2"
              >
                {bannersList.map((banner, index) => (
                  <div
                    key={banner.id || index}
                    className="min-w-full snap-start snap-always relative rounded-[28px] border border-white/80 p-6 overflow-hidden shadow-lg flex flex-col justify-between"
                    style={{
                      background:
                        index === 0
                          ? "linear-gradient(135deg, rgba(255, 252, 249, 0.95) 0%, rgba(250, 245, 255, 0.95) 100%)"
                          : "linear-gradient(135deg, rgba(255, 252, 249, 0.95) 0%, rgba(246, 240, 255, 0.95) 100%)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Neon colored blur points inside container */}
                    <div
                      className={`absolute top-[-20%] right-[-10%] w-[200px] h-[200px] rounded-full ${
                        banner.glowColor || "bg-[#fbcfe8]/20"
                      } blur-[60px] pointer-events-none`}
                    ></div>

                    <div className="relative z-10 flex flex-col h-full text-left">
                      {/* Badge */}
                      {banner.badge && (
                        <div
                          className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-3 w-fit shadow-sm ${
                            banner.pillBg || "bg-[#FFF7EF]"
                          } ${banner.pillBorder || "border-[#FF9E8A]/30"} ${
                            banner.pillText || "text-brand-brown"
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5 text-brand-peach" />
                          <span>{banner.badge}</span>
                        </div>
                      )}

                      {/* Title */}
                      {banner.link ? (
                        <SmartLink
                          to={banner.link}
                          className="group/title block cursor-pointer"
                        >
                          <h3 className="text-xl font-display font-extrabold text-brand-purple tracking-tight leading-[1.2]">
                            {banner.title}
                          </h3>
                        </SmartLink>
                      ) : (
                        <h3 className="text-xl font-display font-extrabold text-brand-purple tracking-tight leading-[1.2]">
                          {banner.title}
                        </h3>
                      )}

                      {/* Subtitle */}
                      <p className="text-brand-brown/70 text-xs mt-2.5 leading-relaxed font-medium">
                        {banner.subtitle}
                      </p>

                      {/* Image container placed BEFORE the button in flow */}
                      {banner.image && (
                        <div className="relative flex items-center justify-center mt-5 w-full">
                          <div className="absolute w-[80%] h-[80%] rounded-full bg-gradient-to-tr from-brand-peach/10 to-brand-purple/10 blur-xl -z-10 pointer-events-none" />

                          {banner.link ? (
                            <SmartLink
                              to={banner.link}
                              className="w-full max-w-[240px] block cursor-pointer relative z-10"
                            >
                              <div className="relative rounded-2xl p-2 border border-white/60 bg-white/30 backdrop-blur-md shadow-sm overflow-hidden">
                                <img
                                  src={banner.image}
                                  alt={banner.title}
                                  className="w-full h-auto object-cover rounded-xl aspect-[4/3]"
                                />
                              </div>
                            </SmartLink>
                          ) : (
                            <div className="w-full max-w-[240px] relative z-10 rounded-2xl p-2 border border-white/60 bg-white/30 backdrop-blur-md shadow-sm overflow-hidden">
                              <img
                                src={banner.image}
                                alt={banner.title}
                                className="w-full h-auto object-cover rounded-xl aspect-[4/3]"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mobile CTA Button - ALWAYS AT THE BOTTOM (below the image) */}
                      {banner.buttonText && banner.buttonLink && (
                        <div className="mt-5 flex items-center w-full">
                          <SmartLink
                            to={banner.buttonLink}
                            className="inline-flex items-center justify-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs py-3.5 rounded-xl active:scale-97 shadow-md cursor-pointer group text-center w-full"
                          >
                            <span>{banner.buttonText}</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                          </SmartLink>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Pagination Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {bannersList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      activeIndex === idx
                        ? "bg-brand-purple w-5"
                        : "bg-brand-purple/20 hover:bg-brand-purple/40"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
