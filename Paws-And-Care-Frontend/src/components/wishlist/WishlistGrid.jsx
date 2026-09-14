import React from 'react';
import WishlistCard from './WishlistCard';

export default function WishlistGrid({ products = [], onRemove, onAddToCart }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <WishlistCard
          key={product.id}
          product={product}
          onRemove={onRemove}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
