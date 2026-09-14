import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { AlertCircle, RefreshCw } from "lucide-react";
import ProductCard from "../product/ProductCard.jsx";
import { useCart } from "../../utils/cartFunctionality.js";
import { useWishlist } from "../../utils/wishlistFunctionality.js";
import { productApi } from "../../api/productApi.js";

export default function BestsellerComponent() {
  const { addToCart } = useCart();
  const { toggleWishlist, wishlistIds } = useWishlist();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchBestsellers = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const data = await productApi.getProducts({ limit: 6 });
      setProducts(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      console.error("Failed to load home products:", error);
      setProducts([]);
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load bestseller products. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBestsellers();
  }, [fetchBestsellers]);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to your cart!`, {
      icon: "🛒",
    });
  };

  return (
    <section
      id="BESTSELLERS"
      className="py-14 sm:py-24 bg-brand-cream/20 relative overflow-hidden select-none border-t border-brand-purple/5"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.3] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-purple/5 border border-brand-purple/10 rounded-full text-brand-purple font-bold text-[10px] sm:text-xs tracking-wider uppercase mb-4">
            <span className="w-1.5 h-1.5 bg-brand-peach rounded-full animate-ping"></span>
            Top Choice
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-brand-purple leading-tight">
            Our Bestsellers
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-brand-brown/70 font-medium mt-3 leading-relaxed">
            Discover active products managed from your admin catalog.
          </p>
        </div>

        {/* Content Section */}
        {isLoading ? (
          /* Loading Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#f0ebf8] rounded-3xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-[380px]"
              >
                <div className="w-full h-48 bg-brand-purple/5 rounded-2xl mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-brand-purple/10 rounded-lg w-3/4" />
                  <div className="h-3 bg-brand-purple/5 rounded-lg w-1/2" />
                  <div className="h-6 bg-brand-purple/10 rounded-xl w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : apiError ? (
          /* API Error Card */
          <div className="bg-white border border-red-100 rounded-[24px] py-12 px-6 text-center max-w-md mx-auto shadow-sm w-full">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-display font-extrabold text-brand-purple">
              Unable to load bestsellers
            </h3>
            <p className="text-xs text-brand-brown/60 mt-2 leading-relaxed font-semibold">
              {apiError}
            </p>
            <button
              onClick={fetchBestsellers}
              className="bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md mt-6 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          /* Empty Bestsellers State */
          <div className="bg-white border border-[#f0ebf8] rounded-[24px] py-12 px-6 text-center max-w-md mx-auto shadow-sm w-full">
            <div className="w-14 h-14 rounded-2xl bg-brand-purple/5 text-brand-purple flex items-center justify-center mx-auto mb-4 shadow-inner">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-display font-extrabold text-brand-purple">
              No bestsellers available
            </h3>
            <p className="text-xs text-brand-brown/60 mt-2 leading-relaxed font-semibold">
              Check back soon for top choice items in our catalog.
            </p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistIds.includes(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
