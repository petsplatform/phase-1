import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import {
  CartIcon,
  HeartIcon,
  LockIcon,
  TruckIcon,
} from "../components/common/HeaderIcons";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";
import { addWishlistItem } from "../utils/wishlist";

const TrashIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShieldIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="m8.5 12 2.3 2.3 4.7-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const QuantityStepper = ({ quantity, onChange, max }) => {
  const hasMax = Number.isFinite(max);
  const atMax = hasMax && quantity >= max;
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-[#17345f1a] bg-white">
      <button
        type="button"
        className="flex h-9 w-10 items-center justify-center text-lg font-bold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="flex h-9 min-w-10 items-center justify-center border-x border-[#17345f1a] px-3 text-sm font-extrabold text-[#122a50]">
        {quantity}
      </span>
      <button
        type="button"
        disabled={atMax}
        className="flex h-9 w-10 items-center justify-center text-lg font-bold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#122a50]"
        onClick={() => {
          if (!atMax) onChange(quantity + 1);
        }}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

const CartProductInfo = ({ item }) => (
  <div className="flex min-w-0 items-center gap-4">
    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-white p-2">
      <img
        src={item.image}
        alt={item.name}
        className="h-full w-full object-contain"
      />
    </div>
    <div className="min-w-0">
      <h2 className="text-sm font-extrabold leading-6 text-[#122a50] sm:text-base">
        {item.name}
      </h2>
      {Number.isFinite(Number(item.stock)) && Number(item.stock) > 0 && Number(item.stock) <= 5 ? (
        <p className="mt-2 text-sm font-extrabold text-[#d9aa3d]">
          Only {item.stock} left
        </p>
      ) : null}
      {(item.selectedSize || item.selectedColor) && (
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-[#122a50b2]">
          {item.selectedSize && (
            <span className="rounded-md bg-[#f8f1df] px-2 py-1">
              Pack: {item.packLabel || item.selectedSize.label}
            </span>
          )}
          {/* {item.sku && (
            <span className="rounded-md bg-[#f8f1df] px-2 py-1 font-mono">
              SKU: {item.sku}
            </span>
          )} */}
          {item.selectedColor && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#f8f1df] px-2 py-1">
              <span
                className="h-2.5 w-2.5 rounded-full border border-[#17345f1a]"
                style={{
                  backgroundColor: item.selectedColor.color || "#ffffff",
                }}
              />
              {item.selectedColor.label}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
);

const PriceBlock = ({ item }) => (
  <div>
    <p className="text-base font-extrabold text-[#122a50]">
      {formatCurrency(item.price)}
    </p>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {item.oldPrice > 0 && (
        <span className="text-xs font-semibold text-[#122a50b2] line-through">
          {formatCurrency(item.oldPrice)}
        </span>
      )}
      {item.discount && (
        <span className="rounded-md bg-[#f8f1df] px-2 py-1 text-[10px] font-extrabold uppercase text-[#17345f]">
          {item.discount}
        </span>
      )}
    </div>
  </div>
);

const CartRow = ({ item, onQuantityChange, onRemove, onMoveToWishlist }) => (
  <tr className="border-t border-[#17345f1a]">
    <td className="px-5 py-5">
      <CartProductInfo item={item} />
    </td>
    <td className="px-5 py-5 align-middle">
      <PriceBlock item={item} />
    </td>
    <td className="px-5 py-5 align-middle">
      <QuantityStepper
        quantity={item.quantity}
        onChange={(q) => onQuantityChange(item.id, q)}
        max={
          Number.isFinite(Number(item.stock)) ? Number(item.stock) : undefined
        }
      />
    </td>
    <td className="px-5 py-5 align-middle text-base font-extrabold text-[#122a50]">
      {formatCurrency(item.price * item.quantity)}
    </td>
    <td className="px-5 py-5 align-middle">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#17345f1a] bg-white text-[#122a50b2] shadow-sm transition-all hover:border-[#d9aa3d66] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
          onClick={() => onMoveToWishlist(item)}
          aria-label={`Move ${item.name} to wishlist`}
        >
          <HeartIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#17345f1a] bg-white text-[#122a50b2] shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-[#EF4444]"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </td>
  </tr>
);

const MobileCartCard = ({
  item,
  onQuantityChange,
  onRemove,
  onMoveToWishlist,
}) => (
  <article className="rounded-2xl border border-[#17345f1a] bg-white p-4 shadow-sm">
    <CartProductInfo item={item} />
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-bold uppercase text-[#122a50b2]">Price</p>
        <PriceBlock item={item} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase text-[#122a50b2]">Total</p>
        <p className="mt-2 text-base font-extrabold text-[#122a50]">
          {formatCurrency(item.price * item.quantity)}
        </p>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <QuantityStepper
        quantity={item.quantity}
        onChange={(q) => onQuantityChange(item.id, q)}
        max={
          Number.isFinite(Number(item.stock)) ? Number(item.stock) : undefined
        }
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#17345f1a] bg-white text-[#122a50b2] shadow-sm transition-all hover:border-[#d9aa3d66] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
          onClick={() => onMoveToWishlist(item)}
          aria-label={`Move ${item.name} to wishlist`}
        >
          <HeartIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#17345f1a] bg-white text-[#122a50b2] shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-[#EF4444]"
          onClick={() => onRemove(item.id)}
          aria-label="Remove"
        >
          <TrashIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  </article>
);

const paymentMethods = [
  { label: "VISA", className: "text-[#1746A2]", content: "VISA" },
  { label: "Mastercard", className: "text-[#111111]", content: "mastercard" },
  {
    label: "AMEX",
    className: "rounded-sm bg-[#1871B9] px-1.5 py-0.5 text-white",
    content: "AMEX",
  },
  { label: "PayPal", className: "text-[#003087]", content: "P" },
  { label: "Apple Pay", className: "text-[#111111]", content: " Pay" },
  { label: "Google Pay", className: "text-[#111111]", content: "G Pay" },
];

const PaymentBadge = ({ method }) => (
  <span
    className="flex h-9 min-w-[54px] items-center justify-center rounded-md border border-[#17345f1a] bg-white px-2 text-[11px] font-black leading-none shadow-sm"
    aria-label={method.label}
  >
    {method.label === "Mastercard" ? (
      <span className="relative flex h-4 w-8 items-center justify-center">
        <span className="absolute left-1 h-4 w-4 rounded-full bg-[#EB001B]" />
        <span className="absolute right-1 h-4 w-4 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    ) : (
      <span className={method.className}>{method.content}</span>
    )}
  </span>
);

const OrderSummary = ({
  cartCount,
  subtotal,
  discount,
  shipping,
  total,
  onCheckout,
}) => {
  const checkoutDisabled = cartCount <= 0;
  const remaining = Math.max(0, 49 - total);
  const progressClass =
    total >= 49
      ? "w-full"
      : total >= 35
        ? "w-3/4"
        : total >= 20
          ? "w-1/2"
          : "w-1/4";

  return (
    <aside className="space-y-4 lg:sticky lg:top-5">
      <section className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-extrabold text-[#122a50]">
          Order Summary
        </h2>
        <div className="mt-6 space-y-4 border-b border-[#17345f1a] pb-5 text-sm font-semibold text-[#122a50]">
          <div className="flex items-center justify-between gap-4">
            <span>Subtotal ({cartCount} items)</span>
            <span className="font-extrabold">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span>Discount</span>
              <span className="font-extrabold text-[#d9aa3d]">
                -{formatCurrency(discount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span>Shipping</span>
            <span className="font-extrabold text-[#d9aa3d]">
              {shipping === 0 ? "FREE" : formatCurrency(shipping)}
            </span>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="text-lg font-extrabold text-[#122a50]">
            Estimated Total
          </span>
          <span className="text-2xl font-extrabold text-[#122a50]">
            {formatCurrency(total)}
          </span>
        </div>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={checkoutDisabled ? undefined : onCheckout}
            disabled={checkoutDisabled}
            aria-disabled={checkoutDisabled}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(18,42,80,0.22)] transition-all ${
              checkoutDisabled
                ? "cursor-not-allowed bg-[#17345f]/35 shadow-none"
                : "bg-[#17345f] hover:-translate-y-0.5 hover:bg-[#d9aa3d]"
            }`}
          >
            <LockIcon className="h-4 w-4" />
            Proceed to Checkout
          </button>
        </div>
        {/* <div className="mt-5 rounded-xl bg-[#f8f1df] p-4">
          <div className="flex gap-3">
            <TruckIcon className="h-8 w-8 flex-shrink-0 text-[#d9aa3d]" />
            <div>
              <p className="text-sm font-extrabold text-[#122a50]">
                {remaining === 0 ? "Congratulations! You get FREE Shipping" : "Free shipping is close"}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#122a50b2]">
                {remaining === 0 ? "Your order qualifies for free shipping." : `You are ${formatCurrency(remaining)} away from free shipping.`}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
            <span className={`block h-full rounded-full bg-[#17345f] ${progressClass}`} />
          </div>
          <div className="mt-1 flex justify-end text-xs font-extrabold text-[#17345f]">$49</div>
        </div> */}
      </section>

      {/* <section className="rounded-xl border border-[#17345f1a] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#122a50]">We Accept</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {paymentMethods.map((method) => <PaymentBadge key={method.label} method={method} />)}
        </div>
      </section> */}

      <section className="flex gap-4 rounded-xl border border-[#17345f1a] bg-white p-5 shadow-sm">
        <ShieldIcon className="h-10 w-10 flex-shrink-0 text-[#17345f]" />
        <div>
          <h2 className="text-sm font-extrabold text-[#122a50]">
            Secure Checkout
          </h2>
          <p className="mt-1 max-w-[260px] text-xs font-semibold leading-5 text-[#122a50b2]">
            Your payment information is 100% secure and protected.
          </p>
        </div>
      </section>
    </aside>
  );
};

const Cart = () => {
  const {
    cartItems,
    cartCount,
    subtotal,
    discount,
    shipping,
    total,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const titleCount = useMemo(() => cartCount, [cartCount]);
  const [removeTarget, setRemoveTarget] = useState(null);

  const requestRemoveItem = (productId) => {
    setRemoveTarget(
      cartItems.find((item) => item.id === productId) || { id: productId },
    );
  };

  const confirmRemoveItem = () => {
    if (!removeTarget) return;
    removeFromCart(removeTarget.id);
    setRemoveTarget(null);
    showToast("Item removed from cart.");
  };

  const handleMoveToWishlist = (item) => {
    const result = addWishlistItem(item);
    removeFromCart(item.id);
    showToast(
      result.added
        ? `${item.name} moved to wishlist`
        : `${item.name} is already in wishlist`,
    );
  };

  const handleCheckout = () => {
    window.sessionStorage.removeItem("petcare_checkout_completed");
    navigate("/checkout");
  };

  return (
    <>
      <SEO
        title="Your Cart | Best-Vet-Care"
        description="Review your selected pet products and proceed to checkout."
        ogTitle="Your Cart | Best-Vet-Care"
        ogDescription="Review your selected items and proceed to checkout."
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="px-4 pb-6 pt-6 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1440px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">
                Home
              </Link>
              <span>/</span>
              <span className="font-extrabold text-[#122a50]">Cart</span>
            </nav>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50]">
                  Your Cart ({titleCount})
                </h1>
                <p className="mt-2 text-sm font-semibold text-[#122a50b2]">
                  Review your selected items and proceed to checkout.
                </p>
              </div>
              <Link
                to="/products"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-[#17345f] bg-white px-5 text-sm font-extrabold text-[#17345f] transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
              >
                Continue Shopping
              </Link>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
              <section className="min-w-0">
                {cartItems.length ? (
                  <>
                    <div className="hidden overflow-hidden rounded-2xl border border-[#17345f1a] bg-white shadow-sm md:block">
                      <table className="w-full table-fixed">
                        <thead className="bg-[#f8f1df] text-left text-sm font-extrabold text-[#122a50]">
                          <tr>
                            <th className="w-[38%] px-5 py-4">Product</th>
                            <th className="w-[16%] px-5 py-4">Price</th>
                            <th className="w-[16%] px-5 py-4">Quantity</th>
                            <th className="w-[14%] px-5 py-4">Total</th>
                            <th className="w-[16%] px-3 py-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartItems.map((item) => (
                            <CartRow
                              key={item.id}
                              item={item}
                              onQuantityChange={updateQuantity}
                              onRemove={requestRemoveItem}
                              onMoveToWishlist={handleMoveToWishlist}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-4 md:hidden">
                      {cartItems.map((item) => (
                        <MobileCartCard
                          key={item.id}
                          item={item}
                          onQuantityChange={updateQuantity}
                          onRemove={requestRemoveItem}
                          onMoveToWishlist={handleMoveToWishlist}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-[#17345f1a] bg-white p-10 text-center shadow-sm">
                    <CartIcon className="mx-auto h-12 w-12 text-[#d9aa3d]" />
                    <h2 className="mt-4 text-2xl font-extrabold text-[#122a50]">
                      Your cart is empty
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-[#122a50b2]">
                      Add pet products to your cart and they will appear here.
                    </p>
                    <Link
                      to="/products"
                      className="mt-5 inline-flex rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]"
                    >
                      Shop Products
                    </Link>
                  </div>
                )}
              </section>

              <OrderSummary
                cartCount={cartCount}
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                total={total}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
      <ConfirmModal
        open={Boolean(removeTarget)}
        title="Remove item?"
        message={`Do you want to remove ${removeTarget?.name || "this item"} from your cart?`}
        confirmLabel="OK"
        onCancel={() => setRemoveTarget(null)}
        onConfirm={confirmRemoveItem}
      />
    </>
  );
};

export default Cart;
