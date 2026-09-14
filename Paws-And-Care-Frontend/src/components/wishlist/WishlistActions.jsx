import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';

export default function WishlistActions({ onAddAllToCart, onClearWishlist, hasItems = false }) {
  if (!hasItems) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-surface border border-brand-border/60 p-5 rounded-[2rem] shadow-sm mb-12">
      {/* Continue shopping link */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-teal font-heading font-bold text-sm transition-colors py-2 px-1 text-left self-start sm:self-center"
      >
        <ArrowLeft size={16} />
        <span>Continue Shopping</span>
      </Link>

      {/* Primary Actions Group */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={onClearWishlist}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-bg hover:bg-brand-peach text-brand-muted hover:text-brand-coral border border-brand-border rounded-full font-heading font-extrabold text-sm transition-all duration-200"
        >
          <Trash2 size={15} />
          <span>Clear Wishlist</span>
        </button>

        <button
          type="button"
          onClick={onAddAllToCart}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-full font-heading font-black text-sm shadow-sm hover:shadow active:scale-95 transition-all duration-200"
        >
          <ShoppingBag size={15} />
          <span>Add All to Cart</span>
        </button>
      </div>
    </div>
  );
}
