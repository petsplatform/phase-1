import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productApi } from '../../api/productApi';

const PawIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.8 1.5 3 3 3s3-1.2 3-3c0-1.66-1.34-3-3-3z" />
    <circle cx="7.2" cy="10" r="1.8" />
    <circle cx="10.2" cy="7" r="1.8" />
    <circle cx="13.8" cy="7" r="1.8" />
    <circle cx="16.8" cy="10" r="1.8" />
  </svg>
);

const getItemCount = (category) =>
  Number(category?._count?.products ?? category?.productCount ?? category?.itemCount ?? 0);

export default function ShopByCategory() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    productApi
      .getCategories()
      .then((data) => {
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section id="shop-by-category" className="bg-brand-bg pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12 border-t border-brand-border/40 select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="text-left space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-brand-teal font-heading font-extrabold text-xs uppercase tracking-wider">
              <PawIcon className="w-3 h-3 text-brand-teal" />
              <span>Find Their Favorites</span>
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-brand-text tracking-tight">
              Shop by Category
            </h2>
            <p className="font-sans text-brand-muted text-sm sm:text-base leading-relaxed">
              Everything your pet needs, thoughtfully organized for faster and easier shopping.
            </p>
          </div>
          <div className="hidden lg:block shrink-0">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-brand-teal hover:text-brand-teal/80 font-heading font-semibold text-sm transition-colors duration-200"
            >
              <span>View All Categories</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-y-8 gap-x-4 sm:gap-6 justify-center items-start">
          {categories.map((category) => {
            const itemCount = getItemCount(category);
            return (
              <Link
                key={category.id || category.name}
                to={`/shop?category=${encodeURIComponent(category.name)}`}
                className="group flex flex-col items-center text-center max-w-[140px] mx-auto focus:outline-none"
              >
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 lg:w-36 lg:h-36 rounded-full overflow-hidden bg-brand-surface border border-brand-border/40 shadow-xs flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-brand-teal/40 group-hover:shadow-md">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-brand-text/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                <span className="mt-3.5 sm:mt-4 font-heading font-extrabold text-xs sm:text-sm lg:text-base text-brand-text group-hover:text-brand-coral transition-colors duration-200 leading-tight">
                  {category.name}
                </span>

                <span className="mt-0.5 font-sans text-[10px] sm:text-xs text-brand-teal group-hover:text-brand-teal/70 transition-colors duration-200 leading-none">
                  {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center lg:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-brand-teal hover:text-brand-teal/80 font-heading font-semibold text-sm transition-colors duration-200"
          >
            <span>View All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
