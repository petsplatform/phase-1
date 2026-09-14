import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/products/ProductCard";
import { Heart, ArrowLeft, ArrowRight, Sparkles, Trash2, ShoppingCart } from "lucide-react";
import { showToast } from "../components/common/toast/ToastHelper";

export default function WishlistPage() {
  const { wishlistItems, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleClearWishlist = () => {
    clearWishlist();
    showToast.success("Wishlist cleared successfully.");
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    wishlistItems.forEach((item) => {
      if (item.inStock) {
        addToCart(item);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast.success(`Successfully added ${addedCount} items to your cart!`);
    } else {
      showToast.error("No items in your wishlist are currently in stock.");
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 relative">
        {/* Glow ambient background details */}
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-soft-mint/30 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-light-blue/40 blur-[90px]" />
        </div>

        <div className="text-center max-w-md flex flex-col items-center">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 border border-slate-200/60 shadow-xs mb-8 transition-transform hover:scale-110 duration-300">
            <Heart className="h-10 w-10 text-slate-350 stroke-[1.5]" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-deep-navy tracking-tight">
            Your Wishlist is Empty
          </h2>
          <p className="mt-4 text-sm sm:text-base font-medium text-slate-500 leading-relaxed">
            Tap the heart icon on any pet medications, wellness supplements, or treats to save them here for quick access later!
          </p>
          <Link
            to="/"
            className="mt-8 group inline-flex items-center gap-2.5 rounded-full bg-linear-to-br from-primary-green to-dark-green px-8 py-4 text-sm font-extrabold text-white shadow-md shadow-primary-green/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-green/30 cursor-pointer"
          >
            Explore Bestsellers
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 lg:py-20 relative bg-linear-to-b from-white via-slate-50/50 to-white">
      {/* Background ambient blurs */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 h-[500px] w-[500px] rounded-full bg-primary-green/5 blur-[130px]" />
        <div className="absolute bottom-40 right-10 h-[400px] w-[400px] rounded-full bg-medical-teal/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        
        {/* Back link */}
        <div className="mb-6 flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-green transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back to Home Shop
          </Link>
        </div>

        {/* Header Title with Count Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-left">
          <div>
            <h1 className="font-display text-[2.2rem] font-extrabold text-deep-navy tracking-tight flex items-center gap-4">
              My Wishlist
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-green/10 text-primary-green border border-primary-green/10">
                {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
              </span>
            </h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base mt-2">
              Review and manage your saved premium pet care supplies.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-emerald-50 border border-primary-green/20 rounded-2xl p-4.5 max-w-sm">
            <Sparkles className="h-5 w-5 text-primary-green shrink-0" />
            <p className="text-xs font-semibold text-slate-650 leading-relaxed">
              Wishlist items persist in your browser, making it easy to purchase later or enroll in monthly Auto-Ship.
            </p>
          </div>
        </div>

        {/* Bulk Action Buttons Row */}
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-4 mb-8 border-b border-slate-100 pb-6 text-left">
          <button
            type="button"
            onClick={handleAddAllToCart}
            className="h-12 px-3 sm:px-6 rounded-xl bg-linear-to-br from-primary-green to-dark-green text-white font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_10px_20px_-5px_rgba(88,185,71,0.2)] hover:shadow-[0_10px_20px_-5px_rgba(88,185,71,0.3)] hover:-translate-y-0.5 active:scale-97 cursor-pointer w-full sm:w-auto"
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            <span className="truncate">Add All to Cart</span>
          </button>
          
          <button
            type="button"
            onClick={handleClearWishlist}
            className="h-12 px-3 sm:px-6 rounded-xl bg-slate-55 border border-slate-200/80 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 font-extrabold text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs active:scale-97 cursor-pointer w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Clear Wishlist</span>
          </button>
        </div>

        {/* Wishlist Grid of Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
          {wishlistItems.map((product) => (
            <div key={product.id} className="flex">
              <ProductCard product={product} showWishlistButton={true} />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
