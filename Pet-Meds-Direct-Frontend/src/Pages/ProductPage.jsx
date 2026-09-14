import { useSearchParams } from "react-router-dom";
import ProductHero from "../components/products/ProductHero";
import ProductGridWithFilters from "../components/products/ProductGridWithFilters";

export default function ProductPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category") || null;

  const setSelectedCategory = (categoryId) => {
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <main id="product-page" className="overflow-hidden bg-[#f8fafc]">
      {/* 1. Offers / Hero Section */}
      <ProductHero />

      {/* 2. Filtered Products Section */}
      <ProductGridWithFilters
        selectedCategoryId={categoryParam}
        setSelectedCategoryId={setSelectedCategory}
      />
    </main>
  );
}

