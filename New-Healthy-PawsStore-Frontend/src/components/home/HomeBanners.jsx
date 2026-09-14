import { motion } from "framer-motion";
import { ArrowRight, PawPrint } from "lucide-react";
import { useEffect, useState } from "react";
import { contentApi } from "../../api/contentApi";

export default function HomeBanners() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let active = true;

    contentApi
      .getHomeBanners()
      .then((items) => {
        if (active) setBanners(items);
      })
      .catch(() => {
        if (active) setBanners([]);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!banners.length) return null;

  return (
    <section className="mx-auto max-w-[1350px] px-4 py-8 sm:px-6 lg:px-8">
      <div className={`grid gap-5 ${banners.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {banners.map((banner, index) => (
          <BannerCard key={banner.id} banner={banner} index={index} />
        ))}
      </div>
    </section>
  );
}

function BannerCard({ banner, index }) {
  const hasLink = Boolean(banner.link);
  const content = (
    <motion.article
      initial={{ opacity: 1, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="group relative grid min-h-[210px] overflow-hidden rounded-[16px] bg-primary text-white shadow-card sm:grid-cols-[minmax(0,1fr)_42%]"
    >
      <div className="relative z-10 flex min-w-0 flex-col justify-center px-5 py-8 sm:px-8">
        <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
          <PawPrint size={13} fill="currentColor" />
          {banner.position || "Home Offer"}
        </span>
        <h2 className="font-display text-[28px] font-extrabold leading-none sm:text-[38px]">
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="mt-3 max-w-[520px] text-[15px] font-semibold leading-relaxed text-white/88 sm:text-[17px]">
            {banner.subtitle}
          </p>
        )}
        {banner.buttonText && (
          <span className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-orange px-5 text-[14px] font-extrabold text-white transition group-hover:bg-secondary">
            {banner.buttonText}
            <ArrowRight size={16} />
          </span>
        )}
      </div>
      {banner.image && (
        <div className="relative min-h-[170px] sm:min-h-[210px]">
          <img
            src={banner.image}
            alt={banner.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-transparent to-transparent sm:bg-gradient-to-r sm:from-primary/65 sm:to-transparent" />
        </div>
      )}
    </motion.article>
  );

  if (!hasLink) return content;

  return (
    <a href={banner.link} className="block">
      {content}
    </a>
  );
}
