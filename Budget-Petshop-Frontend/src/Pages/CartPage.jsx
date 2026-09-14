import { ArrowRight, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  calculateOrderTotals,
  formatPrice,
  getCartItemCount,
  getCouponByCode,
  parsePrice,
} from '../utils/cart'
import { taxApi } from '../api/taxApi'
import { shipmentChargeApi } from '../api/shipmentChargeApi'
import { useAuth } from '../utils/AuthContext'
import { isVetOnly } from '../utils/productUtils'

function QuantityControl({ quantity, onDecrease, onIncrease, disabledIncrease }) {
  return (
    <div className="inline-flex items-center rounded-full border border-outline-strong bg-surface-soft p-1">
      <button
        type="button"
        onClick={onDecrease}
        className="flex h-6 w-6 items-center justify-center rounded-full text-on-background transition hover:bg-white"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>

      <span className="min-w-[40px] text-center text-sm font-bold text-on-background">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={disabledIncrease}
        className={`flex h-6 w-6 items-center justify-center rounded-full bg-white text-on-background shadow-sm transition ${
          disabledIncrease
            ? "cursor-not-allowed opacity-50"
            : "hover:border-primary hover:text-primary"
        }`}
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

function CartPage({
  cartItems,
  cartSubtotal,
  appliedCouponCode,
  onRemoveItem,
  onUpdateQuantity,
  onApplyCoupon,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTax, setActiveTax] = useState(null)
  const [shippingCost, setShippingCost] = useState(0)
  const [shippingLabel, setShippingLabel] = useState("")
  const hasVetRestriction = cartItems.some(
    (item) => isVetOnly(item.product || item) && !user?.isVetVerified
  )

  useEffect(() => {
    let isMounted = true

    taxApi
      .getActive()
      .then((tax) => {
        if (isMounted) setActiveTax(tax)
      })
      .catch((error) => {
        console.error('Failed to load active tax:', error)
        if (isMounted) setActiveTax(null)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!cartSubtotal || cartSubtotal <= 0) {
      setShippingCost(0)
      setShippingLabel('')
      return
    }

    shipmentChargeApi
      .resolveChargeInfo(cartSubtotal)
      .then(({ charge, matched }) => {
        if (active) {
          setShippingCost(Number(charge || 0))
          setShippingLabel(matched?.name || matched?.label || matched?.title || '')
        }
      })
      .catch(() => {
        if (active) {
          setShippingCost(0)
          setShippingLabel('')
        }
      })

    return () => {
      active = false
    }
  }, [cartSubtotal])

  const activeTaxesList = useMemo(() => {
    if (!activeTax) return []
    let raw = activeTax
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && raw.data !== undefined) {
      raw = raw.data
    }
    if (Array.isArray(raw)) {
      return raw.filter((t) => t && Number(t.rate ?? t.taxRate ?? 0) > 0)
    }
    if (raw && typeof raw === 'object') {
      const rate = Number(raw.rate ?? raw.taxRate ?? 0)
      if (rate > 0) return [raw]
    }
    return []
  }, [activeTax])

  const totalTaxRate = useMemo(() => {
    return activeTaxesList.reduce((sum, t) => sum + Number(t.rate ?? t.taxRate ?? 0), 0)
  }, [activeTaxesList])

  const itemCount = getCartItemCount(cartItems)
  const appliedCoupon = getCouponByCode(appliedCouponCode)
  const activeTaxRate = totalTaxRate || Number(activeTax?.rate || 0)
  const {
    couponDiscount,
    discountedSubtotal,
    estimatedTax,
    orderTotal,
  } = calculateOrderTotals({
    subtotal: cartSubtotal,
    coupon: appliedCoupon,
    taxRate: activeTaxRate,
    shipping: shippingCost,
  })
  const totalSavings = cartItems.reduce(
    (sum, item) =>
      sum + (parsePrice(item.originalPrice) - parsePrice(item.salePrice)) * item.quantity,
    0,
  )

  if (!cartItems.length) {
    return (
      <main className="bg-background text-on-background">
        <section className="page-shell px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl rounded-[36px] border border-outline bg-white px-6 py-12 text-center shadow-[0_30px_60px_rgba(28,40,33,0.08)] sm:px-10">
            <span className="section-kicker mx-auto">Cart Empty</span>
            <h1 className="mt-6 font-display text-4xl text-on-background sm:text-5xl">
              Your pet&apos;s cart is waiting for a few favorites.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-charcoal-text">
              Add a few essentials, treats, or toys and we&apos;ll keep the cart count updated right in the navbar for you.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/#best-sellers"
                className="inline-flex items-center justify-center rounded-full bg-secondary px-6 py-3 text-sm font-semibold btn-primary-link transition hover:bg-secondary/80"
              >
                Browse Best Sellers
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full border border-outline-strong bg-surface px-6 py-3 text-sm font-semibold text-on-background transition hover:border-primary hover:text-primary"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="bg-background text-on-background">

      <section className="page-shell px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 xl:grid-cols-[1.55fr_0.8fr]">
          <div className="space-y-4">
            {cartItems.map((item) => {
              const itemUnitPrice = parsePrice(item.salePrice)
              const itemTotal = itemUnitPrice * item.quantity

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-outline bg-white shadow-[0_6px_20px_rgba(28,40,33,0.04)]"
                >
                  <div className="grid gap-0 sm:grid-cols-[130px_1fr] md:grid-cols-[140px_1fr]">
                    <div className="relative w-full h-28 sm:h-full bg-surface-soft overflow-hidden flex items-center justify-center p-2.5">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="max-h-24 sm:max-h-28 max-w-full object-contain"
                      />
                    </div>

                    <div className="p-3.5 sm:p-4 flex flex-col justify-between">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl min-w-0">
                          <h2
                            className="text-sm sm:text-base font-bold text-on-background leading-snug line-clamp-2"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.title}
                          </h2>
                          {item.selectedOption && (
                            <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-secondary bg-secondary/5 px-2 py-0.5 rounded-md inline-block">
                              Variant: {item.selectedOption}
                            </p>
                          )}
                          {item.description && (
                            <p
                              className="mt-1 text-xs sm:text-sm line-clamp-2 leading-relaxed text-charcoal-text"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-left lg:text-right hidden sm:block">
                          <p className="text-[11px] font-semibold text-charcoal-text uppercase tracking-wider">
                            Item Price
                          </p>
                          <p className="mt-0.5 text-lg sm:text-xl font-bold text-secondary">
                            {item.salePrice}
                          </p>
                          {parsePrice(item.originalPrice) > parsePrice(item.salePrice) && (
                            <p className="text-xs text-charcoal-text line-through">
                              {item.originalPrice}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 hidden sm:flex flex-col gap-2 border-t border-outline/70 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <QuantityControl
                            quantity={item.quantity}
                            onDecrease={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabledIncrease={item.quantity >= (item.stock !== undefined ? item.stock : 99)}
                          />

                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-outline-strong px-2.5 py-1.5 text-xs font-semibold text-charcoal-text transition hover:border-accent hover:text-accent"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>

                        <div className="rounded-xl bg-surface-soft px-3 py-1.5">
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.08rem] text-secondary">
                            Total
                          </p>
                          <p className="text-base font-bold text-on-background">
                            {formatPrice(itemTotal)}
                          </p>
                        </div>
                      </div>

                      {/* Mobile phone view section */}
                      <div className="mt-3 border-t border-outline/70 pt-2.5 sm:hidden">
                        {/* Single row: Leftside Unit Price, Rightside Quantity selector & Delete icon */}
                        <div className="flex items-center justify-between">
                          {/* Leftside unit price */}
                          <div className="text-left">
                            <p className="text-[10px] font-semibold text-charcoal-text uppercase tracking-wider">
                              Unit Price
                            </p>
                            <div className="mt-0.5 flex items-baseline gap-2 flex-wrap">
                              <span className="text-base font-bold text-secondary">
                                {item.salePrice}
                              </span>
                              {parsePrice(item.originalPrice) > parsePrice(item.salePrice) && (
                                <span className="text-xs text-charcoal-text line-through">
                                  {item.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Rightside: Quantity & Delete icon on the same row */}
                          <div className="flex items-center gap-3">
                            <QuantityControl
                              quantity={item.quantity}
                              onDecrease={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              onIncrease={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              disabledIncrease={item.quantity >= (item.stock !== undefined ? item.stock : 99)}
                            />

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-outline-strong text-charcoal-text transition hover:border-accent hover:text-accent hover:bg-accent/5"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Bottom single line total */}
                        <div className="mt-4 flex items-center justify-between rounded-[12px] bg-surface-soft px-4 py-2.5">
                          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-secondary">
                            Line Total
                          </span>
                          <span className="text-base font-bold text-on-background">
                            {formatPrice(itemTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <aside
            className="xl:sticky xl:self-start"
            style={{ top: 'calc(var(--navbar-height, 120px) + 24px)' }}
          >
            <div className="rounded-[14px] border border-outline bg-white p-6 shadow-[0_20px_44px_rgba(28,40,33,0.08)] sm:p-7">
              <span className="section-kicker">Order Summary</span>
              <h2 className="mt-5 font-display text-3xl text-on-background">
                Checkout feels easy from here.
              </h2>

              <div className="mt-8 space-y-4 text-sm text-charcoal-text">
                <div className="flex items-center justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-on-background">
                    {formatPrice(cartSubtotal)}
                  </span>
                </div>
                {couponDiscount > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="font-semibold text-primary">
                        -{formatPrice(couponDiscount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discounted Subtotal</span>
                      <span className="font-semibold text-on-background">
                        {formatPrice(discountedSubtotal)}
                      </span>
                    </div>
                  </>
                ) : null}
                {shippingLabel || shippingCost > 0 ? (
                  <div className="flex items-center justify-between">
                    <span>{shippingLabel || "Shipping"}</span>
                    <span className="font-semibold text-on-background">
                      {formatPrice(shippingCost)}
                    </span>
                  </div>
                ) : null}
                {activeTaxesList.length > 0 ? (
                  activeTaxesList.map((tax, idx) => {
                    const rate = Number(tax.rate ?? tax.taxRate ?? 0)
                    const name = tax.name || tax.title || tax.taxName || 'Tax'
                    const amt = (discountedSubtotal * rate) / 100
                    return (
                      <div key={tax.id || tax._id || idx} className="flex items-center justify-between">
                        <span>{name} ({rate}%)</span>
                        <span className="font-semibold text-on-background">
                          {formatPrice(amt)}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex items-center justify-between">
                    <span>{activeTax?.name ? `${activeTax.name} (${activeTaxRate}%)` : 'Tax'}</span>
                    <span className="font-semibold text-on-background">
                      {formatPrice(estimatedTax)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-outline pt-4 text-base">
                  <span className="font-semibold text-on-background">Grand Total</span>
                  <span className="font-display text-3xl text-on-background">
                    {formatPrice(orderTotal)}
                  </span>
                </div>
              </div>

              {hasVetRestriction && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-amber-800">
                    <ShieldCheck size={16} className="text-amber-600" />
                    <span>Verified Veterinarian Required</span>
                  </div>
                  <p className="font-semibold text-amber-700">
                    Your cart contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
                  </p>
                  <button
                    onClick={() => navigate(user ? "/profile?tab=vet-verification" : "/login")}
                    className="self-start mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Apply for Verification
                  </button>
                </div>
              )}

              <div className="mt-6 flex items-start gap-3 rounded-[24px] border border-outline bg-surface-soft px-4 py-4 text-sm leading-7 text-charcoal-text">
                <ShieldCheck size={20} className="mt-1 shrink-0 text-primary" />
                <p>
                  Secure checkout, clear totals, and fast edits if you want to swap anything before placing the order.
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3">
                {hasVetRestriction ? (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-200 text-gray-400 border border-gray-300 px-3 py-3.5 text-xs sm:text-sm font-semibold cursor-not-allowed text-center leading-tight opacity-75"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </button>
                ) : (
                  <Link
                    to="/checkout"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full btn-primary-link bg-secondary px-3 py-3.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-secondary/90 text-center leading-tight"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </Link>
                )}
                <Link
                  to="/#best-sellers"
                  className="inline-flex items-center justify-center rounded-full border border-outline-strong px-3 py-3.5 text-xs sm:text-sm font-semibold text-on-background transition hover:border-primary hover:text-primary text-center leading-tight"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default CartPage
