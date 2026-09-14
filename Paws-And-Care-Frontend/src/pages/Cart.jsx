import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CartHeader from '../components/cart/CartHeader';
import CartItemsList from '../components/cart/CartItemsList';
import CartSummary from '../components/cart/CartSummary';
import EmptyCart from '../components/cart/EmptyCart';
import { resolveCartItemProduct } from '../utils/cartVariants';

export default function Cart({ 
  cart = [], 
  onUpdateCartQuantity, 
  onRemoveFromCart, 
  onMoveCartToWishlist,
  products = [],
}) {
  const navigate = useNavigate();
  
  // Resolve actual product structures from cart IDs list
  const cartItemsResolved = useMemo(() => {
    return cart
      .map((item) => resolveCartItemProduct(item, products))
      .filter(Boolean);
  }, [cart, products]);

  const handleCheckoutSimulate = () => {
    navigate('/checkout');
  };

  return (
    <div className="bg-brand-bg min-h-[85vh] pb-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-6">
        
        {/* Cart Header */}
        <CartHeader itemCount={cartItemsResolved.length} />

        {cartItemsResolved.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Cart items details list */}
            <div className="w-full">
              <CartItemsList
                items={cartItemsResolved}
                onUpdateQuantity={onUpdateCartQuantity}
                onRemove={onRemoveFromCart}
                onMoveToWishlist={onMoveCartToWishlist}
              />
            </div>

            {/* Right Column: Sticky Checkout summary panel (desktop) or below products (mobile/tablet) */}
            <div className="w-full lg:sticky lg:top-28">
              <CartSummary
                items={cartItemsResolved}
                onCheckout={handleCheckoutSimulate}
              />
            </div>

          </div>
        ) : (
          /* Empty state view */
          <EmptyCart />
        )}

      </div>
    </div>
  );
}
