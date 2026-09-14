import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, ShoppingCart, AlertCircle, Star, Eye } from 'lucide-react';
import { getProductUrl, hasVariants, isFamilyProduct } from '../../utils/productUtils';

// Reusable SVG Paw icon
const PawIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.8 1.5 3 3 3s3-1.2 3-3c0-1.66-1.34-3-3-3z" />
    <circle cx="7.2" cy="10" r="1.8" />
    <circle cx="10.2" cy="7" r="1.8" />
    <circle cx="13.8" cy="7" r="1.8" />
    <circle cx="16.8" cy="10" r="1.8" />
  </svg>
);

export default function BestSellers({ wishlist = [], onToggleWishlist, onAddToCart, products = [], loading = false }) {
  const navigate = useNavigate();
  const [addingProductIds, setAddingProductIds] = useState([]);
  const displayProducts = products
    .filter((product) => product.isBestSeller || product.inStock)
    .slice(0, 6);

  if (loading) {
    return (
      <section id="best-sellers" className="bg-brand-bg pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12 border-t border-brand-border/40 select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div className="text-left space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-brand-teal font-heading font-extrabold text-xs uppercase tracking-wider">
                <PawIcon className="w-3 h-3 text-brand-teal" />
                <span>Loved by Pet Parents</span>
              </span>
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-brand-text tracking-tight">
                Best Sellers
              </h2>
              <p className="font-sans text-brand-muted text-sm sm:text-base leading-relaxed">
                Our most popular essentials, trusted by pets and their people.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="animate-pulse bg-brand-surface border border-brand-border rounded-[2rem] p-4 min-h-[420px] flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="bg-slate-200/80 rounded-2xl aspect-square w-full" />
                  <div className="h-3 bg-slate-200/80 rounded w-1/4" />
                  <div className="h-4 bg-slate-200/80 rounded w-3/4" />
                  <div className="h-3 bg-slate-200/80 rounded w-1/2" />
                </div>
                <div className="pt-3 border-t border-brand-border/40 flex justify-between items-center">
                  <div className="h-5 bg-slate-200/80 rounded w-1/4" />
                  <div className="h-9 bg-slate-200/80 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayProducts.length === 0) return null;

  const handleAddToCart = (product, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const productHasVariants = hasVariants(product) && isFamilyProduct(product);
    if (!product.inStock && !productHasVariants) return;
    if (productHasVariants) {
      navigate(getProductUrl(product));
      return;
    }
    if (onAddToCart) {
      setAddingProductIds((prev) => [...prev, product.id]);
      onAddToCart(product, 1);
      setTimeout(() => {
        setAddingProductIds((prev) => prev.filter((id) => id !== product.id));
      }, 1200);
    } else {
      navigate(getProductUrl(product));
    }
  };

  // Framer Motion Variants
  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.8, 0.25, 1] },
    },
  };

  return (
    <section id="best-sellers" className="bg-brand-bg pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12 border-t border-brand-border/40 select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="text-left space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-brand-teal font-heading font-extrabold text-xs uppercase tracking-wider">
              <PawIcon className="w-3 h-3 text-brand-teal" />
              <span>Loved by Pet Parents</span>
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-brand-text tracking-tight">
              Best Sellers
            </h2>
            <p className="font-sans text-brand-muted text-sm sm:text-base leading-relaxed">
              Our most popular essentials, trusted by pets and their people.
            </p>
          </div>
          <div className="hidden lg:block shrink-0">
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-brand-teal hover:text-brand-teal/80 font-heading font-semibold text-sm transition-colors duration-200"
            >
              <span>View All Products</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Product Showcase Grid */}
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {displayProducts.map((product) => {
            const isWishlisted = wishlist.includes(product.id);
            const isAdding = addingProductIds.includes(product.id);
            const productHasVariants = hasVariants(product) && isFamilyProduct(product);

            // Calculate discount percentage dynamically
            const discountPercent =
              product.originalPrice && product.originalPrice > product.price
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : null;

            const productUrl = getProductUrl(product);

            return (
              <motion.div
                key={product.id}
                variants={cardVariants}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group flex flex-col bg-brand-surface border border-brand-border rounded-[2rem] p-4 shadow-xs hover:shadow-md transition-all duration-300 relative justify-between min-h-[420px]"
              >
                <div>
                  {/* Visual Area */}
                  <Link to={productUrl} className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-bg/50 mb-4 border border-brand-border/30 block">
                    <img
                      src={product.image}
                      alt={product.alt || product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!product.inStock ? 'grayscale-[30%] opacity-80' : ''}`}
                      draggable={false}
                    />

                    {/* Product badge (top-left) */}
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-brand-coral text-white font-heading font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-xs tracking-wider uppercase">
                        {product.badge}
                      </span>
                    )}

                    {/* Discount badge (bottom-left on image) */}
                    {discountPercent && product.inStock && (
                      <span
                        className="absolute bottom-3 left-3 bg-brand-coral text-white font-heading font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm"
                        aria-label={`${discountPercent}% discount`}
                      >
                        {discountPercent}% OFF
                      </span>
                    )}

                    {/* Out of Stock overlay */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-brand-text/10 flex items-end justify-center pb-3 pointer-events-none">
                        <span className="bg-brand-text/80 text-white font-heading font-black text-[10px] px-3 py-1 rounded-full tracking-wider uppercase">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Wishlist Button commented out on card as requested */}
                    {/*
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleWishlist && onToggleWishlist(product.id);
                      }}
                      className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 border border-brand-border/40 shadow-xs flex items-center justify-center text-brand-muted hover:text-brand-coral transition-colors duration-250 cursor-pointer focus:outline-none z-10"
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart
                        size={18}
                        className="transition-transform duration-200 active:scale-95"
                        fill={isWishlisted ? '#F25568' : 'none'}
                        color={isWishlisted ? '#F25568' : 'currentColor'}
                      />
                    </button>
                    */}
                  </Link>

                  {/* Info Area */}
                  <div className="text-left space-y-1.5 px-1">
                    {/* Category */}
                    <div>
                      <span className="font-heading font-semibold text-[11px] uppercase tracking-wider text-brand-teal">
                        {product.category}
                      </span>
                    </div>

                    <h3 className="font-heading font-extrabold text-base text-brand-text group-hover:text-brand-coral transition-colors duration-200 line-clamp-1">
                      <Link to={productUrl}>
                        {product.name}
                      </Link>
                    </h3>

                    {/* Star Rating Row */}
                    <div className="flex items-center gap-1 my-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const numRating = Number(product.rating) || 0;
                        const numReviews = Number(product.reviewCount) || 0;
                        const displayRating = numRating > 0 ? numRating : numReviews > 0 ? 4 : 0;
                        return (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < Math.round(displayRating)
                                ? "fill-brand-golden text-brand-golden"
                                : "text-brand-border"
                            }
                          />
                        );
                      })}
                      <span className="font-sans text-[10px] text-brand-muted ml-0.5">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                    <p className="font-sans text-xs text-brand-muted line-clamp-2 leading-relaxed">
                      {product.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Price & Add to Cart */}
                <div className="mt-4 pt-3 border-t border-brand-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 px-1">
                  <div className="flex flex-row sm:flex-col items-baseline sm:items-start gap-1.5 sm:gap-0 text-left shrink-0">
                    {/* Original price (crossed out) */}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="font-sans text-[11px] sm:text-xs text-brand-muted line-through">
                        ${product.originalPrice.toFixed(2)}
                      </span>
                    )}
                    {/* Current price */}
                    <span className="font-heading font-black text-base sm:text-lg text-brand-coral">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={(!productHasVariants && !product.inStock) || isAdding}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-sans font-semibold text-xs sm:text-sm shadow-md transition-all duration-200 cursor-pointer focus:outline-none whitespace-nowrap h-10 ${
                      !productHasVariants && !product.inStock
                        ? 'bg-brand-border/40 text-brand-muted cursor-not-allowed shadow-none'
                        : isAdding
                          ? 'bg-brand-coral/70 text-white opacity-70 cursor-not-allowed'
                          : 'bg-brand-coral hover:bg-brand-coral-dark text-white hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
                    }`}
                    aria-label={productHasVariants ? 'View Variant' : product.inStock ? 'Add to Cart' : 'Product out of stock'}
                  >
                    {isAdding ? (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : productHasVariants ? (
                      <Eye size={15} />
                    ) : !product.inStock ? (
                      <AlertCircle size={15} />
                    ) : (
                      <ShoppingCart size={15} />
                    )}
                    <span>
                      {isAdding
                        ? 'Added!'
                        : productHasVariants
                          ? 'View Variant'
                          : !product.inStock
                            ? 'Out of Stock'
                            : 'Add to Cart'}
                    </span>
                  </button>
                </div>

              </motion.div>
            );
          })}
        </motion.div>

        {/* Mobile View All link */}
        <div className="mt-10 text-center lg:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-brand-teal hover:text-brand-teal/80 font-heading font-semibold text-sm transition-colors duration-200"
          >
            <span>View All Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </section>
  );
}
