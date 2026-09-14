import React from 'react';
import ProductCard from './ProductCard';
import EmptyState from './EmptyState';

export default function ProductGrid({
  products = [],
  wishlist = [],
  onToggleWishlist,
  onAddToCart,
  viewMode,
  emptyTitle,
  emptyMessage,
  onClearFilters,
  loading = false,
}) {
  if (loading) {
    const isGrid = viewMode === 'grid';
    return (
      <div
        className={
          isGrid
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5'
            : 'flex flex-col gap-4'
        }
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-brand-surface border border-brand-border/60 rounded-[2rem] p-4 flex flex-col justify-between h-[400px]"
          >
            <div className="space-y-3">
              <div className="bg-slate-200/80 rounded-2xl aspect-square w-full" />
              <div className="flex justify-between items-center">
                <div className="h-3 bg-slate-200/80 rounded w-1/4" />
                <div className="h-3 bg-slate-200/80 rounded w-1/5" />
              </div>
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
    );
  }

  if (products.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} onClearFilters={onClearFilters} />;
  }

  const isGrid = viewMode === 'grid';

  return (
    <div
      className={
        isGrid
          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5'
          : 'flex flex-col gap-4'
      }
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          wishlisted={wishlist.includes(product.id)}
          onToggleWishlist={onToggleWishlist}
          onAddToCart={onAddToCart}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
