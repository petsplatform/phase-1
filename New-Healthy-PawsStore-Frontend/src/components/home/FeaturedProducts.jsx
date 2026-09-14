import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { catalogApi } from "../../api/catalogApi";
import ProductCard from "../ui/ProductCard";
import SectionTitle from "../ui/SectionTitle";

export default function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    let active = true;

    catalogApi
      .getProducts({ limit: 5 })
      .then((result) => {
        if (active) {
          setFeaturedProducts(result.items.map((item) => ({
            ...item,
            price: `$${item.price.toFixed(2)}`,
            oldPrice: `$${item.oldPrice.toFixed(2)}`,
          })));
        }
      })
      .catch(() => {
        if (active) setFeaturedProducts([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.section
      id="featured"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="relative">
        <SectionTitle>Featured Products</SectionTitle>
        <a
          href="/products"
          className="absolute right-0 top-1 hidden items-center gap-2 text-sm font-extrabold text-secondaryDark md:flex"
        >
          View All Products <ArrowRight size={16} />
        </a>
      </div>
      {featuredProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id || product.title} product={product} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
