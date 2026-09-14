import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { contentApi } from '../../api/contentApi';

const getBannerImage = (banner) =>
  banner?.image || banner?.imageUrl || banner?.desktopImage || banner?.mobileImage || '';

const getBannerHref = (banner) => banner?.link || '/shop';

export default function PromotionalOfferBanner() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let cancelled = false;
    contentApi
      .getStoreContent()
      .then((content) => {
        if (!cancelled) setBanners((content?.banners || []).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (banners.length === 0) return null;

  const layoutClass =
    banners.length === 1
      ? 'grid-cols-1'
      : banners.length === 2
        ? 'grid-cols-1 lg:grid-cols-2'
        : 'grid-cols-1 lg:grid-cols-3';

  return (
    <section className="bg-brand-bg pb-8 sm:pb-10 lg:pb-12 pt-4 sm:pt-6 select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className={`grid ${layoutClass} gap-4 sm:gap-5`}>
          {banners.map((banner, index) => {
            const image = getBannerImage(banner);
            const isFeature = banners.length === 1 || (banners.length === 3 && index === 0);
            return (
              <a
                key={banner.id || `${banner.title}-${index}`}
                href={getBannerHref(banner)}
                className={`group relative overflow-hidden border border-brand-border/60 bg-brand-surface shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
                  isFeature ? 'min-h-[360px] sm:min-h-[430px]' : 'min-h-[300px] sm:min-h-[360px]'
                } ${banners.length === 3 && index === 0 ? 'lg:col-span-2' : ''}`}
                style={{ borderRadius: '28px' }}
              >
                {image && (
                  <img
                    src={image}
                    alt={banner.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    draggable={false}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-text/80 via-brand-text/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-text/65 to-transparent" />

                <div className="relative z-10 flex h-full min-h-[inherit] flex-col justify-between p-6 sm:p-8 lg:p-10 text-left text-white">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 font-heading text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                    <Sparkles size={12} />
                    <span>{banner.position || 'Store Banner'}</span>
                  </span>

                  <div className="max-w-xl space-y-3">
                    <h2 className={`font-heading font-black leading-tight ${isFeature ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}>
                      {banner.title}
                    </h2>
                    {banner.subtitle && (
                      <p className="max-w-lg font-sans text-sm sm:text-base leading-relaxed text-white/85">
                        {banner.subtitle}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-coral px-5 py-2.5 font-heading text-xs font-black text-white shadow-md transition-colors group-hover:bg-brand-coral-dark">
                      <span>{banner.buttonText || 'Shop Now'}</span>
                      <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
