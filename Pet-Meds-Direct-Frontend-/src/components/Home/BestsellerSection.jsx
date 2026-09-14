import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { getProductsApi, transformProduct } from "../../helper/axiosInstance";
import ProductCard from "../products/ProductCard";

export default function BestsellerSection() {
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getProductsApi({ limit: 4 })
      .then((res) => {
        if (active) {
          const items = (res.data?.items || []).map(transformProduct);
          setBestsellerProducts(items);
        }
      })
      .catch((err) => {
        console.error("Error loading bestseller products:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      id="bestsellers"
      className="relative py-16 lg:py-24 overflow-hidden"
    >
      {/* Dynamic background accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary-green/5 rounded-full filter blur-3xl -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-medical-teal/5 rounded-full filter blur-3xl -z-10" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 lg:mb-16 gap-6">
          <div className="max-w-2xl w-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-green/20 bg-emerald-50/80 px-3.5 py-1.5 shadow-xs backdrop-blur-md">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-dark-green">
                  Top Rated Products
                </span>
              </div>

              <a
                href="/products"
                className="md:hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-deep-navy/10 text-[11px] font-extrabold text-deep-navy bg-white hover:bg-deep-navy hover:text-white transition-all duration-300"
              >
                <span>View All Products</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            <h2 className="font-display text-[2.2rem] font-extrabold leading-[1.1] tracking-tight text-deep-navy sm:text-[3rem] lg:text-[3.2rem]">
              Our Bestselling Remedies
            </h2>

            <p className="mt-4 text-base font-medium leading-relaxed text-deep-navy/70">
              Explore the most trusted pet medications, daily care supplements,
              and wellness essentials preferred by thousands of pet parents.
            </p>
          </div>

          <div className="hidden md:block">
            <a
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-deep-navy/10 text-sm font-extrabold text-deep-navy bg-white hover:bg-deep-navy hover:text-white hover:border-deep-navy hover:shadow-md transition-all duration-300 group"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Product Cards Grid / Skeleton Loading */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="flex flex-col w-full bg-white rounded-[2rem] border border-slate-100 p-3 h-[450px]"
              >
                <div className="w-full aspect-square bg-slate-100 rounded-[1.6rem] mb-4"></div>
                <div className="flex-1 px-3">
                  <div className="h-3.5 bg-slate-100 rounded w-1/4 mb-3"></div>
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-3"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3.5 bg-slate-100 rounded w-2/3"></div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                  <div className="h-6 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-10 bg-slate-100 rounded-xl w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {bestsellerProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
