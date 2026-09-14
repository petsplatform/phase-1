import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { contentApi } from "../../api/contentApi";
import promoImage from "../../assets/images/shop/pet-first-aid-kit.webp";

const DEFAULT_BANNER = {
  id: "BAN-01",
  title: "Pet Medication Essentials",
  subtitle: "Flea, tick, heartworm, allergy, and calming care for cats and dogs",
  buttonText: "Shop Pet Meds",
  buttonLink: "/shop",
  image: promoImage,
  badge: "LIMITED TIME OFFER",
  offerTag: "Save Up To 30%",
};

const PromoBanner = () => {
  const [cmsContent, setCmsContent] = useState(DEFAULT_BANNER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadCmsContent = async () => {
      try {
        const homeBanners = await contentApi.getHomeBanners();
        if (isMounted && Array.isArray(homeBanners) && homeBanners.length > 0) {
          setCmsContent(homeBanners[0]);
          return;
        }

        const directBanners = await contentApi.getBanners();
        if (isMounted && Array.isArray(directBanners) && directBanners.length > 0) {
          setCmsContent(directBanners[0]);
        }
      } catch (err) {
        console.warn("CMS banner content fetch notice:", err?.message || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadCmsContent();
    return () => { isMounted = false; };
  }, []);

  const resolveTargetLink = (rawLink) => {
    if (!rawLink || rawLink === "#") return "/shop";
    if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) return "/shop";
    if (rawLink.startsWith("/collections/") || rawLink.startsWith("/products/")) return "/shop";
    return rawLink;
  };

  const badge = (cmsContent?.badge && cmsContent.badge !== "null" && cmsContent.badge !== "Home Offer")
    ? cmsContent.badge
    : (cmsContent?.position && String(cmsContent.position) !== "null"
      ? String(cmsContent.position)
      : DEFAULT_BANNER.badge);

  const title = cmsContent?.title || DEFAULT_BANNER.title;
  const subtitle = cmsContent?.subtitle || cmsContent?.description || cmsContent?.message || DEFAULT_BANNER.subtitle;
  const offerTag = cmsContent?.offerTag || cmsContent?.discount || cmsContent?.highlight || DEFAULT_BANNER.offerTag;
  const image = cmsContent?.image || cmsContent?.imageUrl || cmsContent?.desktopImage || DEFAULT_BANNER.image;
  const buttonText = cmsContent?.buttonText || DEFAULT_BANNER.buttonText;
  const buttonLink = resolveTargetLink(cmsContent?.buttonLink || cmsContent?.link);
  const secondaryButtonText = cmsContent?.secondaryButtonText || "View Best Sellers";
  const secondaryButtonLink = resolveTargetLink(cmsContent?.secondaryButtonLink);

  return (
    <section className="py-20 md:py-24 bg-white select-none text-left">
      <div className="container-custom">
        {/* Banner Container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B2D4F] via-[#0E3C66] to-[#0874C9] rounded-3xl p-8 md:p-12 lg:p-16 shadow-xl border border-[#0874C9]/20 flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Decorative Vectors */}
          <div className="absolute top-6 right-1/2 w-6 h-6 text-white/5 rotate-45 select-none pointer-events-none">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/></svg>
          </div>
          <div className="absolute bottom-6 left-12 w-10 h-10 text-white/5 rotate-12 select-none pointer-events-none">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/></svg>
          </div>
          
          {/* Speed line accents */}
          <div className="absolute bottom-1/4 right-1/4 w-32 h-1 bg-gradient-to-r from-transparent to-[#F28C18]/10 rounded-full rotate-[-12deg] pointer-events-none"></div>

          {/* Left Side: Content */}
          <div className="flex-1 z-10 flex flex-col items-start">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#F28C18] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full mb-6 uppercase tracking-wider shadow-sm">
              {badge}
            </div>

            {/* Heading */}
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-4 tracking-tight">
              {title}
            </h2>

            {/* Description */}
            <p className="text-sm md:text-base text-white/80 leading-relaxed mb-8 max-w-lg">
              {subtitle}
            </p>

            {/* Offer highlight */}
            <div className="flex items-baseline gap-2.5 mb-8 bg-white/10 border border-white/15 px-4.5 py-2.5 rounded-2xl shadow-sm">
              <span className="text-white text-[10px] font-black uppercase tracking-wider">Offer</span>
              <span className="text-2xl font-black font-heading text-[#F28C18] tracking-tight">{offerTag}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                to={buttonLink}
                className="bg-[#F28C18] hover:bg-white text-white hover:text-[#0B2D4F] font-bold text-sm px-8 py-3.5 rounded-full transition-all duration-300 shadow-md shadow-[#F28C18]/25 text-center cursor-pointer hover:-translate-y-0.5"
              >
                {buttonText}
              </Link>
              <Link
                to={secondaryButtonLink}
                className="text-white hover:text-[#F28C18] font-bold text-sm flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer group"
              >
                <span>{secondaryButtonText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Side: Visual product mock */}
          <div className="w-full lg:w-auto relative shrink-0 z-10 flex justify-center">
            {/* Visual Frame */}
            <div className="absolute inset-4 rounded-3xl bg-white/5 blur-xl pointer-events-none"></div>
            
            <div className="relative rounded-3xl overflow-hidden border border-white/10 w-full max-w-[340px] aspect-square shadow-2xl bg-[#EAF5FC] group">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2D4F]/40 via-transparent to-transparent opacity-60"></div>
              
              {/* Overlapping medical cross badge */}
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-md border border-[#D9E8F2] flex items-center gap-2 select-none">
                <span className="bg-[#EAF5FC] p-1 rounded-lg text-[#0874C9]">
                  <Plus className="w-3.5 h-3.5 rotate-45 stroke-[3px]" />
                </span>
                <span className="text-[9px] font-black text-[#102A43] uppercase tracking-wider">Clinically Checked</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
