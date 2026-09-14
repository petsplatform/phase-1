import React from 'react';
import CartItem from './CartItem';

export default function CartItemsList({ items = [], onUpdateQuantity, onRemove, onMoveToWishlist }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item, idx) => (
        <CartItem
          key={`${item.product.id}-${item.option || 'default'}-${idx}`}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemove={onRemove}
          onMoveToWishlist={onMoveToWishlist}
        />
      ))}
    </div>
  );
}
