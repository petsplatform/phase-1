import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';

export default function CartHeader({ itemCount = 0 }) {
  return (
    <div className="relative overflow-hidden bg-brand-surface border-b border-brand-border/40 py-8 lg:py-10 rounded-[2rem] px-6 sm:px-8 lg:px-12 mb-8 shadow-sm">
      
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
      <div className="absolute -bottom-10 left-10 w-48 h-48 bg-brand-coral/5 rounded-full blur-2xl pointer-events-none" />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-muted font-sans mb-4">
        <Link to="/" className="hover:text-brand-teal transition-colors">Home</Link>
        <ChevronRight size={10} className="text-brand-border" />
        <span className="text-brand-coral font-semibold">Shopping Cart</span>
      </nav>

      {/* Content */}
      <div className="relative z-10 text-left space-y-2 max-w-xl">
        <div className="inline-flex items-center gap-1.5 bg-brand-coral/10 text-brand-coral text-[11px] font-heading font-black px-3 py-1 rounded-full uppercase tracking-wider">
          <ShoppingBag size={11} className="fill-current" />
          <span>Your Bag</span>
        </div>

        <h1 className="font-heading font-black text-3xl sm:text-4xl text-brand-text leading-tight flex items-center gap-3">
          <span>Shopping Cart</span>
          {itemCount > 0 && (
            <span className="inline-flex items-center justify-center bg-brand-teal text-white text-xs sm:text-sm font-heading font-black px-3 py-1 rounded-full shadow-xs">
              {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
            </span>
          )}
        </h1>

        <p className="font-sans text-sm sm:text-base text-brand-muted leading-relaxed">
          Review your selection of premium, veterinary-approved nutrition, chew toys, and grooming items before checking out.
        </p>
      </div>
    </div>
  );
}
