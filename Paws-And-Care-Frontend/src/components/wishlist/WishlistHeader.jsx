import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Heart, Trash2, ShoppingBag } from 'lucide-react';

export default function WishlistHeader({ itemCount = 0, onClearWishlist, onAddAllToCart }) {
  return (
    <div className="mb-8 space-y-4">
      
      {/* Breadcrumb / Continue Shopping */}
      <div className="flex items-center gap-2">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-teal font-sans font-semibold transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Continue Shopping</span>
        </Link>
        <span className="text-brand-border text-xs">/</span>
        <Link to="/" className="text-xs text-brand-muted hover:text-brand-coral transition-colors font-sans">Home</Link>
        <span className="text-brand-border text-xs">/</span>
        <span className="text-xs text-brand-text font-semibold font-sans">Wishlist</span>
      </div>

      {/* Header Row: Title + Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        
        {/* Left: Title + count + description */}
        <div className="text-left space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-brand-teal/10 text-brand-teal text-[11px] font-heading font-black px-3 py-1 rounded-full uppercase tracking-wider">
            <Heart size={11} className="fill-current" />
            <span>My Collection</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-4xl text-brand-text leading-tight flex items-center flex-wrap gap-3">
            <span>Your Wishlist</span>
            <span className="inline-flex items-center justify-center bg-brand-coral text-white text-xs sm:text-sm font-heading font-black px-3 py-1.5 rounded-full shadow-sm">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </span>
          </h1>

          <p className="font-sans text-sm sm:text-base text-brand-muted leading-relaxed">
            Keep track of the premium essentials your pet loves. Review your collection, adjust options, or add them directly to your shopping cart.
          </p>
        </div>

        {/* Right: Action Buttons — visible only when items exist */}
        {itemCount > 0 && (
          <div className="flex flex-row sm:flex-col gap-3 w-full sm:w-auto shrink-0 sm:items-end">
            {/* On mobile: 2-column side by side, then stack on xs */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClearWishlist}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 h-11 bg-brand-cream border border-brand-border/80 text-brand-text hover:bg-brand-peach hover:border-brand-coral/30 hover:text-brand-coral rounded-full font-heading font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 whitespace-nowrap shadow-xs"
              >
                <Trash2 size={14} />
                <span>Clear Wishlist</span>
              </button>

              <button
                type="button"
                onClick={onAddAllToCart}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 h-11 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-full font-heading font-black text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 whitespace-nowrap"
              >
                <ShoppingBag size={14} />
                <span>Add All to Cart</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
