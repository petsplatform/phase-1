import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Sparkles, Heart, ArrowRight } from 'lucide-react';

export default function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-brand-surface border border-brand-border/60 rounded-[2.5rem] px-6 py-16 sm:py-20 shadow-sm max-w-xl mx-auto my-8 relative overflow-hidden">
      
      {/* Background blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-coral/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-teal/5 rounded-full blur-2xl pointer-events-none" />

      {/* Styled Icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center border border-brand-border/60 text-brand-muted relative">
          <ShoppingBag size={32} className="stroke-[1.5]" />
          
          {/* Badge */}
          <span className="absolute -bottom-1 -right-1 bg-white border border-brand-border/60 w-8 h-8 rounded-full flex items-center justify-center text-brand-coral shadow-sm">
            🐕
          </span>
        </div>
        
        {/* Sparkle decoration */}
        <Sparkles className="absolute -top-2 -right-2 text-brand-golden animate-pulse" size={18} />
      </div>

      {/* Typography */}
      <h2 className="font-heading font-black text-2xl sm:text-3xl text-brand-text mb-3">
        Your Cart is Empty
      </h2>
      
      <p className="font-sans text-sm sm:text-base text-brand-muted leading-relaxed max-w-sm mb-8">
        Your shopping cart is waiting for something special! Discover our vet-approved recipes, healthy vitamins, and chewing treats to spoil your dog.
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col items-center gap-4">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-7 py-3 font-heading font-black text-sm transition-all shadow-md hover:shadow-lg active:scale-95 group"
        >
          <span>Explore Products</span>
          <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          to="/wishlist"
          className="inline-flex items-center gap-1.5 text-xs font-heading font-bold text-brand-muted hover:text-brand-coral transition-colors"
        >
          <Heart size={13} className="text-brand-coral fill-current" />
          <span>View Your Saved Wishlist</span>
        </Link>
      </div>

    </div>
  );
}
