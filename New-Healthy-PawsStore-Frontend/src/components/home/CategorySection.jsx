import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogApi } from "../../api/catalogApi";
import { catalogFallbacks } from "../../api/catalogApi";
import CategoryCard from "../ui/CategoryCard";
import SectionTitle from "../ui/SectionTitle";

export default function CategorySection() {
  const [storeCategories, setStoreCategories] = useState([]);

  useEffect(() => {
    let active = true;

    catalogApi
      .getCategories()
      .then((result) => {
        if (active) setStoreCategories(result.length ? result : catalogFallbacks.categories);
      })
      .catch(() => {
        if (active) setStoreCategories(catalogFallbacks.categories);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleCategories = storeCategories.slice(0, 6);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto border-t border-borderSoft bg-white px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <SectionTitle>Shop By Category</SectionTitle>
            <p className="-mt-2 max-w-[560px] text-[14px] font-semibold leading-relaxed text-muted">
              Pick the care routine your pet needs and jump straight to trusted essentials.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-secondaryDark px-5 text-[14px] font-extrabold !text-white shadow-[0_12px_28px_rgba(86,120,43,0.22)] transition hover:-translate-y-0.5 hover:bg-primaryDark hover:!text-white"
          >
            Show All Categories
            <ArrowRight size={16} />
          </Link>
        </div>

        {visibleCategories.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {visibleCategories.map((category) => (
              <CategoryCard key={category.id || category.name} category={category} />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
