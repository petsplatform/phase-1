import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Heart, Plus, Minus } from 'lucide-react';
import { getProductUrl } from '../../utils/productUtils';

export default function CartItem({ item, onUpdateQuantity, onRemove, onMoveToWishlist }) {
  const { product, quantity, option } = item;
  const productUrl = getProductUrl(product);

  const activeVariant = React.useMemo(() => {
    if (!product || !product.optionVariants || !option) return null;
    return product.optionVariants.find(
      (v) => (v.label || v.name || v.id) === option
    );
  }, [product, option]);

  const maxStock = React.useMemo(() => {
    let stock = 0;
    if (activeVariant) {
      stock = activeVariant.inventory?.stockQuantity ?? activeVariant.stock ?? 0;
    } else {
      stock = product?.stock ?? 0;
    }
    return stock > 0 ? stock : 99;
  }, [product, activeVariant]);

  const savings = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border border-brand-border/60 p-4 sm:p-5 rounded-2xl shadow-xs text-left relative group">
      
      {/* Product Image */}
      <Link 
        to={productUrl}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-brand-bg border border-brand-border/40 shrink-0 block"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          draggable={false}
        />
      </Link>
      
      {/* Absolute delete button at top-right */}
      <button
        type="button"
        onClick={() => onRemove(product.id, option)}
        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-brand-bg hover:bg-brand-peach border border-brand-border/60 shadow-xs flex items-center justify-center text-brand-muted hover:text-brand-coral transition-all duration-200 cursor-pointer focus:outline-none z-10"
        aria-label="Delete item from cart"
      >
        <Trash2 size={13} />
      </button>

      {/* Info details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="font-heading font-bold text-[9px] text-brand-teal uppercase tracking-wider">
            {product.category}
          </span>
        </div>

        <h3 className="font-heading font-black text-sm sm:text-base text-brand-text leading-snug hover:text-brand-coral transition-colors truncate">
          <Link to={productUrl}>{product.name}</Link>
        </h3>

        {/* Selected Option */}
        {option && (
          <p className="font-sans text-[11px] text-brand-muted">
            Option: <span className="font-semibold text-brand-text">{option}</span>
          </p>
        )}

        {/* Action triggers */}
        <div className="flex items-center gap-4 pt-1.5 flex-wrap">
          {/* Move to Wishlist */}
          <button
            type="button"
            onClick={() => onMoveToWishlist(product.id, option)}
            className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-brand-muted hover:text-brand-coral transition-colors"
          >
            <Heart size={12} className="fill-transparent" />
            <span>Move to Wishlist</span>
          </button>

          {/* Remove */}
          <button
            type="button"
            onClick={() => onRemove(product.id, option)}
            className="inline-flex items-center gap-1 text-[11px] font-heading font-bold text-brand-muted hover:text-brand-coral transition-colors"
          >
            <Trash2 size={12} />
            <span>Remove</span>
          </button>
        </div>
      </div>

      {/* Controls & Price summary column */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 sm:gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-brand-border/40 shrink-0 sm:pr-10">
        
        {/* Quantity Stepper */}
        <div className="flex items-center border border-brand-border/60 bg-brand-bg/25 rounded-lg overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => onUpdateQuantity(product.id, option, Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-7 h-8 flex items-center justify-center text-brand-muted hover:text-brand-coral hover:bg-brand-peach transition-colors disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus size={11} />
          </button>
          <span className="w-7 text-center font-heading font-black text-xs text-brand-text border-x border-brand-border/60 h-8 flex items-center justify-center select-none bg-white">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onUpdateQuantity(product.id, option, Math.min(maxStock, quantity + 1))}
            disabled={quantity >= maxStock}
            className="w-7 h-8 flex items-center justify-center text-brand-muted hover:text-brand-teal hover:bg-brand-peach transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="Increase quantity"
          >
            <Plus size={11} />
          </button>
        </div>

        {/* Pricing information */}
        <div className="text-right flex flex-col justify-end">
          <span className="font-heading font-black text-base text-brand-text">
            ${(product.price * quantity).toFixed(2)}
          </span>
          <span className="font-sans text-[10px] text-brand-muted">
            (${product.price.toFixed(2)} each)
          </span>
        </div>

      </div>

    </div>
  );
}
