import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { contentApi } from "../../api/contentApi";

const apiOrigin = (() => {
  try {
    return import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : "";
  } catch {
    return "";
  }
})();

const isActiveNow = (banner) => {
  const now = Date.now();
  const startsAt = banner.startDate ? new Date(banner.startDate).getTime() : null;
  const endsAt = banner.endDate ? new Date(banner.endDate).getTime() : null;

  if (Number.isFinite(startsAt) && startsAt > now) return false;
  if (Number.isFinite(endsAt) && endsAt < now) return false;
  return String(banner.status || "Active").toLowerCase() === "active";
};

const resolveImageUrl = (image) => {
  if (!image) return "";
  if (/^(https?:)?\/\//i.test(image) || image.startsWith("data:")) return image;
  if (!apiOrigin) return image;
  return `${apiOrigin}${image.startsWith("/") ? "" : "/"}${image}`;
};

const resolveLink = (link) => {
  if (!link) return "/shop";
  if (/^https?:\/\//i.test(link)) return link;
  return link.startsWith("/") ? link : `/${link}`;
};

function BannerCard({ banner }) {
  const link = resolveLink(banner.link);
  const isExternal = /^https?:\/\//i.test(link);
  const image = resolveImageUrl(banner.image);
  const buttonText = banner.buttonText || "Discover More";

  const content = (
    <>
      <img
        src={image}
        alt={banner.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/5" />

      <div className="relative z-10 flex h-full flex-col justify-between p-7 sm:p-8">
        <div className="max-w-md">
          <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
            {banner.title}
          </h3>

          {banner.subtitle ? (
            <p className="mt-4 text-[15px] leading-7 text-white/85">
              {banner.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-secondary/90 group-hover:gap-3">
            {buttonText}
            <ArrowRight size={16} />
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute right-8 top-1/2 hidden h-12 w-28 -translate-y-1/2 sm:block">
        <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-[18px] border-r border-t border-white/80" />
        <span className="absolute right-8 top-0 h-px w-20 bg-white/80" />
      </div>
    </>
  );

  const className =
    "group relative block min-h-[300px] overflow-hidden rounded-[28px] bg-neutral-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl";

  if (isExternal) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" aria-label={buttonText} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={link} aria-label={buttonText} className={className}>
      {content}
    </Link>
  );
}

function PetCareSection() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getStoreContent()
      .then((content) => {
        if (!isMounted) return;
        setBanners(Array.isArray(content?.banners) ? content.banners : []);
      })
      .catch((error) => {
        console.error("Failed to load offer banners:", error);
        if (isMounted) setBanners([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleBanners = useMemo(
    () => banners.filter((banner) => banner?.title && banner?.image && isActiveNow(banner)).slice(0, 3),
    [banners],
  );

  if (!isLoading && visibleBanners.length === 0) return null;

  return (
    <section id="pet-care-guide" className="border-b border-outline">
      <div className="page-shell px-4 py-24 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="section-kicker">Limited-Time Offers</span>

          <h2 className="mt-5 text-4xl text-on-background sm:text-5xl">
            Shop Smart. Save Big.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-charcoal-text">
            Explore today's hottest deals, exclusive discounts, and seasonal
            promotions on premium pet products for dogs, cats, and more.
          </p>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="min-h-[300px] animate-pulse rounded-[28px] border border-outline bg-surface-soft"
                />
              ))
            : visibleBanners.map((banner) => <BannerCard key={banner.id} banner={banner} />)}
        </div>
      </div>
    </section>
  );
}

export default PetCareSection;
