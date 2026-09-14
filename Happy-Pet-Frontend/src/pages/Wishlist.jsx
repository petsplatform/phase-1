import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useWishlist } from "../utils/wishlistFunctionality.js";
import { useCart } from "../utils/cartFunctionality.js";
import { isPrescriptionRequired } from "../utils/productUtils";
import { productApi } from "../api/productApi.js";
import ProductCard from "../components/product/ProductCard.jsx";

export default function Wishlist() {
  const { wishlistIds, toggleWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      setApiError(null);
      const data = await productApi.getProducts({ limit: 100 });
      setCatalogProducts(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      console.error("Failed to load wishlist products:", error);
      setCatalogProducts([]);
      setApiError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load wishlist products. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Find products that are currently in the wishlist (newest added first)
  const wishlistedProducts = wishlistIds
    .map((wishlistId) => {
      const baseId = String(wishlistId).split("__")[0];
      const baseProduct = catalogProducts.find((p) => p.id === baseId);
      if (!baseProduct) return null;

      try {
        const meta = JSON.parse(
          localStorage.getItem("happypet_wishlist_meta") || "{}"
        );
        const variantMeta = meta[wishlistId];
        if (variantMeta) {
          return {
            ...baseProduct,
            id: wishlistId,
            baseProductId: baseProduct.id,
            name: variantMeta.name || baseProduct.name,
            sellPrice: variantMeta.sellPrice || baseProduct.sellPrice,
            price: variantMeta.sellPrice || baseProduct.price,
            image: variantMeta.image || baseProduct.image,
            selectedVariant: variantMeta.variantLabel,
          };
        }
      } catch {}

      return baseProduct;
    })
    .filter(Boolean);

  // Recommendations: products NOT currently in the wishlist (limit to 3 for clean UI)
  const recommendedProducts = catalogProducts
    .filter((p) => !wishlistIds.some((id) => String(id).split("__")[0] === p.id))
    .slice(0, 3);

  // Fallback recommendations if wishlist has almost all items
  const backupRecommendations = catalogProducts.slice(0, 3);
  const finalRecommendations =
    recommendedProducts.length > 0
      ? recommendedProducts
      : backupRecommendations;

  // Handle adding a single item to cart
  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart! 🛒`);
  };

  // Add all in-stock wishlisted items to cart
  const handleAddAllToCart = () => {
    const inStockItems = wishlistedProducts.filter((p) => p.inStock);

    if (inStockItems.length === 0) {
      toast.error("No in-stock items in your wishlist to add.", {
        icon: "⚠️",
      });
      return;
    }

    inStockItems.forEach((product) => {
      addToCart(product, 1);
    });

    toast.success(
      `Added ${inStockItems.length} item${
        inStockItems.length > 1 ? "s" : ""
      } to your cart! 🛍️`,
    );
  };

  // Clear all items
  const handleClearWishlist = () => {
    clearWishlist();
    toast.success("Wishlist cleared successfully.", {
      icon: "🗑️",
    });
  };

  return (
    <main
      className="flex-grow select-none py-12 relative min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #FAF8FF 0%, #FFFBF7 50%, #FAF8FF 100%)",
      }}
    >
      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 mb-8  relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Side - Breadcrumb */}
          <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] flex items-center gap-1.5">
            <Link to="/" className="hover:text-brand-purple transition-colors">
              Home
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />

            <Link
              to="/wishlist"
              className="hover:text-brand-purple transition-colors"
            >
              Wishlist
            </Link>
          </div>
        </div>
      </div>

      {/* Ambient background decorative glow circles */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-0 w-[450px] h-[450px] bg-brand-peach/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ── BREADCRUMBS & HEADER ── */}
        <div className="text-left mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-brand-purple tracking-tight leading-tight flex items-center gap-3">
                <span>Wishlist</span>
              </h1>
              <p className="text-sm text-brand-brown/70 font-medium mt-2 leading-relaxed max-w-xl">
                Keep track of your favorite healthy treats, supplements, and
                toys for your beloved pets.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {wishlistedProducts.length > 0 && (
                <>
                  <button
                    onClick={handleClearWishlist}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-red-100 hover:border-red-200 text-red-500 text-xs font-extrabold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Wishlist</span>
                  </button>

                  <button
                    onClick={handleAddAllToCart}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-purple hover:bg-[#3a0038] text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add All to Cart</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── WISHLIST ITEMS CONTAINER ── */}
        {isLoading ? (
          /* Loading Skeleton Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6.5">
            {Array.from({ length: 4 }).map((_, idx) => (
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
          /* API Error State */
          <div className="bg-white border border-red-100 rounded-[32px] p-12 text-center max-w-xl mx-auto w-full shadow-sm mt-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-display font-extrabold text-brand-purple">
              Unable to load wishlist
            </h2>
            <p className="text-xs sm:text-sm text-brand-brown/65 mt-3.5 leading-relaxed font-semibold max-w-sm mx-auto">
              {apiError}
            </p>
            <button
              onClick={fetchCatalog}
              className="inline-flex items-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-8 py-4 rounded-xl transition-all duration-300 shadow-md mt-8 cursor-pointer"
            >
              <span>Try Again</span>
            </button>
          </div>
        ) : wishlistedProducts.length === 0 ? (
          /* Empty Wishlist State */
          <div className="w-full flex flex-col items-center">
            <div className="bg-white border border-[#f0ebf8] rounded-[32px] p-12 text-center max-w-xl w-full shadow-sm mt-4 relative overflow-hidden mb-16">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-peach/5 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-purple/5 rounded-full blur-xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-brand-peach/10 text-brand-peach flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Heart className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-display font-extrabold text-brand-purple">
                Your wishlist is empty
              </h2>
              <p className="text-xs sm:text-sm text-brand-brown/65 mt-3.5 leading-relaxed font-semibold max-w-sm mx-auto">
                No items saved yet! Browse our collection and click the heart
                icon on any product to save it here.
              </p>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-8 py-4 rounded-xl transition-all duration-300 shadow-md mt-8 active:scale-97 cursor-pointer"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Smart Product Recommendations */}
            <div className="w-full max-w-7xl text-left">
              <div className="flex items-center gap-2 mb-6.5">
                <Sparkles className="w-5 h-5 text-brand-peach fill-brand-peach" />
                <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-purple">
                  Explore Popular Bestsellers
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5">
                {finalRecommendations.map((product) => (
                  <div
                    key={product.id}
                    className="transition-all duration-300 hover:scale-[1.01]"
                  >
                    <ProductCard
                      product={product}
                      isWishlisted={false}
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Wishlist Items Grid */
          <div className="flex flex-col gap-12">
            <div>
              <div className="text-xs font-extrabold text-brand-purple/60 uppercase tracking-wider mb-6 text-left border-b border-[#f0ebf8] pb-4">
                Saved Items ({wishlistedProducts.length} item
                {wishlistedProducts.length === 1 ? "" : "s"})
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6.5">
                {wishlistedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="transition-all duration-300 hover:scale-[1.01]"
                  >
                    <ProductCard
                      product={product}
                      isWishlisted={true}
                      onToggleWishlist={toggleWishlist}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Products Banner */}
            {finalRecommendations.length > 0 && (
              <div className="border-t border-[#f0ebf8] pt-12 text-left">
                <div className="flex items-center gap-2 mb-6.5">
                  <Sparkles className="w-5 h-5 text-brand-peach fill-brand-peach" />
                  <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-purple">
                    More Pet Favorites You Might Like
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5">
                  {finalRecommendations.map((product) => (
                    <div
                      key={product.id}
                      className="transition-all duration-300 hover:scale-[1.01]"
                    >
                      <ProductCard
                        product={product}
                        isWishlisted={false}
                        onToggleWishlist={toggleWishlist}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
