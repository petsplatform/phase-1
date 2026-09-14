import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';

export default function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-brand-surface border border-brand-border/60 rounded-[2.5rem] px-6 py-16 sm:py-20 shadow-sm max-w-xl mx-auto my-8 relative overflow-hidden">
      
      {/* Glow decorative blobs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-coral/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-teal/5 rounded-full blur-2xl pointer-events-none" />

      {/* Luxury Badge/Icon Container */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center border border-brand-border/60 text-brand-muted relative">
          <Heart size={32} className="stroke-[1.5]" />
          
          {/* Paw print mini overlay */}
          <span className="absolute -bottom-1 -right-1 bg-white border border-brand-border/60 w-8 h-8 rounded-full flex items-center justify-center text-brand-coral shadow-sm">
            🐾
          </span>
        </div>
        
        {/* Sparkle decorative element */}
        <Sparkles className="absolute -top-2 -right-2 text-brand-golden animate-pulse" size={18} />
      </div>

      {/* Typography */}
      <h2 className="font-heading font-black text-2xl sm:text-3xl text-brand-text mb-3">
        Your Wishlist is Empty
      </h2>
      
      <p className="font-sans text-sm sm:text-base text-brand-muted leading-relaxed max-w-sm mb-8">
        Don't let your favorite items drift away! Browse our premium, vet-approved pet foods, grooming essentials, and chew toys to build your perfect collection.
      </p>

      {/* Button */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-7 py-3 font-heading font-black text-sm transition-all shadow-md hover:shadow-lg active:scale-95 group"
      >
        <span>Explore Products</span>
        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>

    </div>
  );
}
