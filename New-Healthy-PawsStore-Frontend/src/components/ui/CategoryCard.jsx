import { motion } from "framer-motion";
import { ArrowRight, PawPrint } from "lucide-react";
import { Link } from "react-router-dom";
import productCatFood from "../../assets/images/product-cat-food.png";
import productChews from "../../assets/images/product-chews.png";
import productDogFood from "../../assets/images/product-dog-food.png";
import productDrops from "../../assets/images/product-drops.png";
import productVitamins from "../../assets/images/product-vitamins.png";
import heroPets from "../../assets/images/hero-pets-cutout.png";

const categoryImages = [
  { keywords: ["dog", "food"], image: productDogFood },
  { keywords: ["cat", "food"], image: productCatFood },
  { keywords: ["treat", "chew", "dental"], image: productChews },
  { keywords: ["medicine", "medication", "pill", "tablet", "antibiotic"], image: productVitamins },
  { keywords: ["flea", "tick", "drop", "skin", "allergy"], image: productDrops },
  { keywords: ["groom", "care", "supplement", "heart", "pain", "anxiety"], image: heroPets },
];

function getCategoryImage(category = {}) {
  if (category.image || category.imageUrl) return category.image || category.imageUrl;

  const text = `${category.name || ""} ${category.description || ""}`.toLowerCase();
  return categoryImages.find(({ keywords }) => keywords.some((keyword) => text.includes(keyword)))?.image || heroPets;
}

export default function CategoryCard({ category }) {
  const Icon = category.icon || PawPrint;
  const categoryId = encodeURIComponent(category.id || category.name || "");
  const categoryImage = getCategoryImage(category);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="h-full"
    >
      <Link
        to={`/products?category=${categoryId}`}
        className="group relative flex h-full min-h-[190px] overflow-hidden rounded-2xl border border-borderSoft bg-white p-5 text-left shadow-[0_16px_38px_rgba(20,61,60,0.06)] transition hover:border-secondary/35 hover:shadow-[0_18px_44px_rgba(20,61,60,0.1)]"
      >
        <div className="relative z-10 flex min-h-[150px] flex-1 flex-col justify-between pr-[116px] sm:pr-[126px]">
          <span className="grid size-11 place-items-center rounded-xl bg-sageLight text-primary">
            <Icon size={24} strokeWidth={1.8} />
          </span>
          <span className="pb-1">
            <span className="line-clamp-2 text-[16px] font-extrabold leading-tight text-textMain">
              {category.name}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-extrabold text-secondaryDark">
              Shop now
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-4 right-4 size-[118px] overflow-hidden rounded-full bg-sageLight p-2 shadow-[0_10px_24px_rgba(20,61,60,0.08)] sm:size-[126px]">
          <img
            src={categoryImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="h-full w-full rounded-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
    </motion.div>
  );
}
