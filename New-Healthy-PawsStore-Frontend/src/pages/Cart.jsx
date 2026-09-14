import { useEffect, useMemo, useState, useRef } from "react";
import { Home, Loader2, PawPrint, ShieldCheck } from "lucide-react";
import { cartApi } from "../api/cartApi";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import ConfirmModal from "../components/common/ConfirmModal";
import CartTable from "../components/cart/CartTable";
import EmptyCart from "../components/cart/EmptyCart";
import OrderSummary from "../components/cart/OrderSummary";
import TrustFeatures from "../components/cart/TrustFeatures";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";
import Newsletter from "../components/home/Newsletter";

const SHIPPING_GOAL = 109;
const DISCOUNT = 5;

export default function Cart() {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const shippingTimerRef = useRef(null);

  useEffect(() => {
    let active = true;

    cartApi
      .getCart()
      .then((cartItems) => {
        if (active && Array.isArray(cartItems)) {
          setItems(cartItems);
          setSelectedIds(cartItems.map((item) => item.id));
        }
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const syncCart = (nextItems) => {
    cartApi.syncCart(nextItems).catch(() => {});
  };

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  useEffect(() => {
    window.clearTimeout(shippingTimerRef.current);
    if (!items.length) {
      setShippingCost(0);
      return;
    }
    shippingTimerRef.current = window.setTimeout(() => {
      shipmentChargeApi
        .resolveCharge(subtotal)
        .then((cost) => setShippingCost(cost))
        .catch(() => setShippingCost(0));
    }, 300);
    return () => window.clearTimeout(shippingTimerRef.current);
  }, [subtotal, items.length]);

  const shipping = shippingCost;
  const discount = items.length ? DISCOUNT : 0;
  const total = Math.max(subtotal + shipping - discount, 0);

  const handleSelect = (id, checked) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((itemId) => itemId !== id),
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? items.map((item) => item.id) : []);
  };

  const handleQuantityChange = (id, quantity) => {
    setItems((current) => {
      const nextItems = current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.min(
                Math.max(1, quantity),
                Number(
                  item.maxQuantity ||
                    item.variantStock ||
                    item.stock ||
                    item.stockQuantity ||
                    quantity,
                ),
              ),
            }
          : item,
      );
      syncCart(nextItems);
      return nextItems;
    });
  };

  const removeCartItem = (id) => {
    setItems((current) => {
      const nextItems = current.filter((item) => item.id !== id);
      syncCart(nextItems);
      return nextItems;
    });
    setSelectedIds((current) => current.filter((itemId) => itemId !== id));
  };

  const removeSelectedItems = () => {
    setItems((current) => {
      const nextItems = current.filter(
        (item) => !selectedIds.includes(item.id),
      );
      syncCart(nextItems);
      return nextItems;
    });
    setSelectedIds([]);
  };

  const handleDelete = (id) => {
    const item = items.find((cartItem) => cartItem.id === id);
    setConfirmAction({
      type: "cart-item",
      id,
      title: "Remove item from cart?",
      message: item
        ? `${item.title} will be removed from your shopping cart.`
        : "This item will be removed from your shopping cart.",
      confirmText: "Remove Item",
    });
  };

  const handleRemoveSelected = () => {
    setConfirmAction({
      type: "cart-selected",
      title: "Remove selected items?",
      message: `${selectedIds.length} selected item${selectedIds.length === 1 ? "" : "s"} will be removed from your cart.`,
      confirmText: "Remove Selected",
    });
  };

  const handleConfirmAction = () => {
    if (confirmAction?.type === "cart-item") {
      removeCartItem(confirmAction.id);
    }
    if (confirmAction?.type === "cart-selected") {
      removeSelectedItems();
    }
    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Header />
      <main>
        <section className="bg-background px-4 pt-6 sm:px-5 lg:px-6">
          <div className="mx-auto max-w-[1360px]">
            <nav
              className="mb-7 flex items-center gap-2 text-[13px] font-semibold text-muted"
              aria-label="Breadcrumb"
            >
              <Home size={14} className="text-secondaryDark" />
              <a
                href="/"
                className="transition-colors hover:text-secondaryDark"
              >
                Home
              </a>
              <span aria-hidden="true">›</span>
              <span className="font-extrabold text-secondaryDark">Cart</span>
            </nav>

            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="flex items-center gap-3 font-display text-[43px] font-extrabold leading-none text-textMain">
                  Your Cart
                  <PawPrint
                    size={28}
                    className="text-secondary"
                    fill="currentColor"
                  />
                </h1>
                <p className="mt-3 text-[15px] font-semibold text-muted">
                  Review your items and proceed to checkout
                </p>
              </div>
              <p className="inline-flex items-center gap-3 text-[13px] font-extrabold text-secondaryDark">
                <ShieldCheck size={22} />
                Your data is safe & secure
              </p>
            </div>
          </div>
        </section>

        <section className="bg-background px-4 pb-0 sm:px-5 lg:px-6">
          <div className="mx-auto grid max-w-[1360px] gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="min-w-0">
              {loading ? (
                <div className="rounded-[22px] border border-borderSoft bg-white p-8 shadow-[0_10px_28px_var(--color-shadow)]">
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <Loader2
                      size={36}
                      className="animate-spin text-secondaryDark"
                    />
                    <p className="text-[15px] font-extrabold text-secondaryDark">
                      Loading your shopping cart...
                    </p>
                    <p className="text-[13px] font-semibold text-muted">
                      Please wait a moment while we fetch your saved items.
                    </p>
                  </div>
                </div>
              ) : items.length ? (
                <CartTable
                  items={items}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onQuantityChange={handleQuantityChange}
                  onDelete={handleDelete}
                  onRemoveSelected={handleRemoveSelected}
                />
              ) : (
                <EmptyCart />
              )}
            </div>
            <OrderSummary
              items={items}
              itemCount={items.length}
              subtotal={subtotal}
              shipping={shipping}
              discount={discount}
              total={total}
              shippingGoal={SHIPPING_GOAL}
              loading={loading}
            />
          </div>
        </section>

        <TrustFeatures />
        <Newsletter assetVariant="wishlist" />
      </main>
      <Footer />
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmText={confirmAction?.confirmText}
        tone="danger"
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
