import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import VerifyContactStep from "../components/checkout/VerifyContactStep";
import AddressStep from "../components/checkout/AddressStep";
import PaymentStep from "../components/checkout/PaymentStep";
import OrderSummary from "../components/checkout/OrderSummary";
import { orderApi } from "../api/orderApi";
import { accountApi } from "../api/accountApi";
import api from "../api/axios";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import { stripePromise } from "../lib/stripe";
import { ShieldCheck, Headphones, ShoppingBag, Upload, CheckCircle2, X, FileText } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { featureFlags } from "../config/siteNavigation";
import { PHONE_VALIDATION_MESSAGE } from "../utils/phoneValidation";

const CHECKOUT_DRAFT_KEY = "petcare_checkout_draft";
const CHECKOUT_COMPLETED_KEY = "petcare_checkout_completed";
const BUY_NOW_STORAGE_KEY = "petcare_buy_now_checkout";
const toMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const optionalId = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
};

const readBuyNowItem = () => {
  try {
    const storedItem = window.sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    return storedItem ? JSON.parse(storedItem) : null;
  } catch {
    return null;
  }
};

const calculateCartDiscount = () => 0;

const calculateCouponDiscount = (coupon, subtotal, discount) => {
  const couponBaseAmount = Math.max(0, subtotal - discount);
  if (!coupon || couponBaseAmount <= 0) return 0;
  if (coupon.minOrder && couponBaseAmount < Number(coupon.minOrder)) return 0;
  if (coupon.type === "percentage") {
    return toMoney(Math.min((couponBaseAmount * Number(coupon.value || 0)) / 100, couponBaseAmount));
  }
  if (coupon.type === "flat") {
    return toMoney(Math.min(Number(coupon.value || 0), couponBaseAmount));
  }
  return toMoney(Math.min(Number(coupon.discountAmount || 0), couponBaseAmount));
};

const DEFAULT_SHIPPING_COUNTRY = "United States";

const CHECKOUT_FIELD_LABELS = {
  "shippingAddress.name": "Full name",
  "shippingAddress.fullName": "Full name",
  "shippingAddress.phone": "Phone number",
  "shippingAddress.address": "Street address",
  "shippingAddress.line1": "Street address",
  "shippingAddress.city": "City",
  "shippingAddress.state": "State",
  "shippingAddress.postalCode": "Postal code",
  "shippingAddress.zip": "Postal code",
  "shippingAddress.country": "Country",
};

const formatCheckoutErrorMessage = (message) => {
  const fallback = "Could not place your order. Please try again.";
  const rawMessage = String(message || "").trim();
  if (!rawMessage) return fallback;

  return rawMessage
    .split(/,\s*(?=[A-Za-z][\w.[\]]*:\s*)/)
    .map((part) => {
      const fieldMatch = part.match(/^([A-Za-z][\w.[\]]*)\s*:\s*(.+)$/);
      if (!fieldMatch) return part;

      const [, field, rawDetail] = fieldMatch;
      const detail = rawDetail.trim();
      const label = CHECKOUT_FIELD_LABELS[field] || field
        .split(".")
        .pop()
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^\w/, (char) => char.toUpperCase());

      if (field === "shippingAddress.phone" && /valid phone/i.test(detail)) {
        return PHONE_VALIDATION_MESSAGE;
      }

      if (/^(please|this|the)\b/i.test(detail) && !detail.includes(field)) {
        return detail;
      }

      return `${label}: ${detail.replaceAll(field, label)}`;
    })
    .join(" ");
};

const normalizeShippingAddress = (address) => {
  const source = address || {};

  return {
    ...source,
    name: source.name || source.fullName || "",
    fullName: source.fullName || source.name || "",
    phone: source.phone || "",
    address: source.address || source.line1 || "",
    line1: source.line1 || source.address || "",
    city: source.city || "",
    state: source.state || "",
    postalCode: source.postalCode || source.zip || "",
    zip: source.zip || source.postalCode || "",
    country: source.country || DEFAULT_SHIPPING_COUNTRY,
  };
};

const EmptyCheckout = () => (
  <div className="rounded-2xl border border-[#17345f1a] bg-white p-8 text-center shadow-sm">
    <ShoppingBag className="mx-auto h-12 w-12 text-[#d9aa3d]" />
    <h1 className="mt-4 text-2xl font-extrabold text-[#122a50]">
      Your cart is empty
    </h1>
    <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#122a50]/60">
      Add pet products to your cart before starting checkout.
    </p>
    <Link
      to="/products"
      className="mt-5 inline-flex rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]"
    >
      Continue Shopping
    </Link>
  </div>
);

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cartItems,
    appliedCoupon,
    setAppliedCoupon,
    clearCart,
  } = useCart();
  const { isLoggedIn } = useAuth();

  const [verified, setVerified] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [orderError, setOrderError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  // { [productId]: { fileName, preview, url, uploading, error } }
  const [prescriptions, setPrescriptions] = useState({});
  const [finalizingPayment, setFinalizingPayment] = useState(false);
  const [activeTax, setActiveTax] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [rewards, setRewards] = useState(null);
  const [rewardPointsToRedeem, setRewardPointsToRedeem] = useState(0);
  const { showToast } = useToast();
  const confirmStripePaymentRef = useRef(null);
  const placingOrderRef = useRef(false);
  const stripeReturnHandledRef = useRef(false);
  const couponUrlHandledRef = useRef(false);
  const contactComplete = Boolean(isLoggedIn && verified);
  const [buyNowItem, setBuyNowItem] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("buyNow") === "1" || params.get("payment_intent")) {
      return readBuyNowItem();
    }
    return null;
  });

  useEffect(() => {
    if (!isLoggedIn) {
      setVerified(false);
      setSelectedAddress(null);
      setSelectedPayment(null);
      confirmStripePaymentRef.current = null;
      return;
    }

    setVerified(true);
  }, [isLoggedIn]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isBuyNowCheckout = params.get("buyNow") === "1";
    const isPaymentReturn = Boolean(params.get("payment_intent") || params.get("payment_intent_client_secret"));

    if (isBuyNowCheckout || isPaymentReturn) {
      setBuyNowItem(readBuyNowItem());
      return;
    }

    window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
    setBuyNowItem(null);
  }, [location.search]);

  const checkoutItems = useMemo(
    () => (buyNowItem ? [buyNowItem] : cartItems),
    [buyNowItem, cartItems],
  );
  const isPaymentReturn = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Boolean(params.get("payment_intent") || params.get("payment_intent_client_secret"));
  }, [location.search]);
  const hasCheckoutItems = checkoutItems.length > 0;
  const prescriptionItems = checkoutItems.filter((item) => item.prescriptionRequired);
  const requiresPrescription = prescriptionItems.length > 0;
  const subtotal = toMoney(checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const discount = toMoney(calculateCartDiscount(checkoutItems));
  const couponDiscount = calculateCouponDiscount(appliedCoupon, subtotal, discount);
  const rewardSettings = rewards?.settings || {};
  const rewardsEnabled = featureFlags.rewardPoints && Boolean(rewardSettings.rewardsEnabled);
  const rewardBalance = Number(rewards?.balance || 0);
  const rewardPointValue = Number(rewardSettings.rewardPointValue || 0);
  const rewardMaxRedeemPercent = Number(rewardSettings.rewardMaxRedeemPercent || 0);
  const rewardMinRedeemPoints = Number(rewardSettings.rewardMinRedeemPoints || 1);
  const rewardEligibleAmount = toMoney(Math.max(0, subtotal - discount - couponDiscount));
  const rewardMaxAmount = toMoney((rewardEligibleAmount * rewardMaxRedeemPercent) / 100);
  const rewardMaxPoints = rewardsEnabled && rewardPointValue > 0
    ? Math.max(0, Math.min(rewardBalance, Math.floor(rewardMaxAmount / rewardPointValue)))
    : 0;
  const normalizedRewardPoints = rewardPointsToRedeem >= rewardMinRedeemPoints
    ? Math.min(rewardMaxPoints, Math.max(0, Number(rewardPointsToRedeem) || 0))
    : 0;
  const rewardDiscount = toMoney(Math.min(rewardEligibleAmount, normalizedRewardPoints * rewardPointValue));
  const taxableAmount = toMoney(Math.max(0, rewardEligibleAmount - rewardDiscount));
  const rewardEarnPoints = rewardsEnabled
    ? Math.max(0, Math.floor(taxableAmount * Number(rewardSettings.rewardPointsPerCurrencyUnit || 0)))
    : 0;
  const taxRate = Number(activeTax?.rate || 0);
  const tax = toMoney((taxableAmount * taxRate) / 100);
  const total = toMoney(Math.max(0, taxableAmount + shippingCost + tax));
  const paymentAmountKey = Math.round(total * 100);

  const addressLocked = !contactComplete;
  const paymentLocked = !contactComplete || !selectedAddress;

  const canPlaceOrder = Boolean(
    hasCheckoutItems &&
      contactComplete &&
      selectedAddress &&
      selectedPayment &&
      (!requiresPrescription || prescriptionItems.every((item) => {
        const pid = item.productId || item.id;
        return prescriptions[pid]?.url;
      })),
  );
  const handleStripeReady = useCallback((fn) => {
    confirmStripePaymentRef.current = fn;
  }, []);

  useEffect(() => {
    if (!hasCheckoutItems) {
      setActiveTax(null);
      return undefined;
    }

    let active = true;

    api
      .get(`/customer-panel/taxes/active?_=${Date.now()}`)
      .then((response) => {
        if (active) setActiveTax(response.data?.data || null);
      })
      .catch(() => {
        if (active) setActiveTax(null);
      });

    return () => {
      active = false;
    };
  }, [hasCheckoutItems]);

  useEffect(() => {
    if (couponUrlHandledRef.current || appliedCoupon || subtotal <= 0) return;
    const code = new URLSearchParams(location.search).get("coupon");
    if (!code) return;

    couponUrlHandledRef.current = true;
    orderApi
      .validateCoupon(code, subtotal, discount)
      .then((coupon) => {
        setAppliedCoupon(coupon);
        showToast(`Coupon ${coupon.code || code.toUpperCase()} applied`);
      })
      .catch(() => {
        showToast("This cart recovery coupon is not eligible for your current cart.", "error");
      });
  }, [appliedCoupon, discount, location.search, setAppliedCoupon, showToast, subtotal]);

  // Auto-resolve shipping charge from admin-configured rules based on subtotal
  useEffect(() => {
    if (!hasCheckoutItems) {
      setShippingCost(0);
      return;
    }
    let active = true;
    setShippingLoading(true);
    shipmentChargeApi
      .resolveCharge(subtotal)
      .then((charge) => {
        if (active) setShippingCost(charge);
      })
      .catch(() => {
        if (active) setShippingCost(0);
      })
      .finally(() => {
        if (active) setShippingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [subtotal, hasCheckoutItems]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkoutCompleted = window.sessionStorage.getItem(CHECKOUT_COMPLETED_KEY) === "1";

    if (checkoutItems.length > 0 && !isPaymentReturn) {
      window.sessionStorage.removeItem(CHECKOUT_COMPLETED_KEY);
      return;
    }

    if (checkoutCompleted && !isPaymentReturn && localStorage.getItem("petcare_last_order")) {
      navigate("/order-success", { replace: true });
    }
  }, [checkoutItems.length, isPaymentReturn, location.search, navigate]);

  const buildOrderPayload = ({ paymentMethod, stripePaymentIntentId = null }) => ({
      items: checkoutItems.map((item) => ({
        productId: item.productId || item.id,
        variantId: optionalId(item.variantId || item.selectedSize?.id),
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        optionLabel: item.optionLabel,
      })),
      checkoutMode: buyNowItem ? "buy_now" : "cart",
      shippingAddress: normalizeShippingAddress(selectedAddress),
      shippingMethod: "Standard",
      paymentMethod,
      stripePaymentIntentId,
      subtotal,
      discount,
      promoDiscount: couponDiscount,
      couponCode: appliedCoupon?.code || undefined,
      rewardPointsToRedeem: normalizedRewardPoints,
      shipping: shippingCost,
      shippingCost,
      tax,
      total,
      prescriptions: Object.values(prescriptions).filter((p) => p.url).map((p) => ({ url: p.url, fileName: p.fileName })).length
        ? Object.values(prescriptions).filter((p) => p.url).map((p) => ({ url: p.url, fileName: p.fileName }))
        : undefined,
    });

  const checkoutPaymentPayload = useMemo(
    () => buildOrderPayload({ paymentMethod: "stripe" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkoutItems, selectedAddress, subtotal, discount, couponDiscount, appliedCoupon?.code, normalizedRewardPoints, shippingCost, tax, total, buyNowItem, prescriptions],
  );

  useEffect(() => {
    if (!contactComplete || !featureFlags.rewardPoints) {
      setRewards(null);
      setRewardPointsToRedeem(0);
      return undefined;
    }

    let active = true;
    accountApi
      .getRewards()
      .then((data) => {
        if (active) setRewards(data);
      })
      .catch(() => {
        if (active) setRewards(null);
      });

    return () => {
      active = false;
    };
  }, [contactComplete]);

  useEffect(() => {
    if (rewardPointsToRedeem > rewardMaxPoints) {
      setRewardPointsToRedeem(rewardMaxPoints);
    }
  }, [rewardMaxPoints, rewardPointsToRedeem]);

  const placeOrder = async ({ paymentMethod, stripePaymentIntentId = null, draft = null }) => {
    setOrderError("");
    const orderPayload = draft || buildOrderPayload({ paymentMethod, stripePaymentIntentId });
    try {
      const created = await orderApi.createOrder(orderPayload);
      const order = {
        id: created?.id || `#PC${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        items: orderPayload.items,
        address: orderPayload.shippingAddress,
        shipping: orderPayload.shippingMethod,
        payment: orderPayload.paymentMethod,
        subtotal: orderPayload.subtotal,
        discount: orderPayload.discount + (orderPayload.promoDiscount || 0),
        shippingCost: orderPayload.shipping,
        tax: orderPayload.tax,
        total: orderPayload.total,
        confirmationEmail: created?.confirmationEmail || { delivered: false },
      };
      localStorage.setItem("petcare_last_order", JSON.stringify(order));
      window.sessionStorage.setItem(CHECKOUT_COMPLETED_KEY, "1");
      localStorage.removeItem(CHECKOUT_DRAFT_KEY);
      if (buyNowItem) {
        window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
        setBuyNowItem(null);
      } else {
        clearCart();
      }
      showToast("Order placed successfully!");
      navigate("/order-success", { replace: true });
    } catch (err) {
      const msg = formatCheckoutErrorMessage(err.response?.data?.message || err.message);
      setOrderError(msg);
      showToast(msg, "error");
    }
  };

  useEffect(() => {
    if (stripeReturnHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const returnedSecret = params.get("payment_intent_client_secret");
    const returnedPaymentIntentId = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    if (!returnedSecret && !returnedPaymentIntentId) return;

    stripeReturnHandledRef.current = true;
    setFinalizingPayment(true);

    const finalizeReturnedPayment = async (paymentIntentId) => {
      let draft = null;
      try {
        draft = JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || "null");
      } catch {
        draft = null;
      }

      if (!draft) {
        setOrderError("Payment succeeded, but checkout details were not found. Please contact support with your payment ID.");
        return;
      }

      await placeOrder({
        paymentMethod: "stripe",
        stripePaymentIntentId: paymentIntentId,
        draft: { ...draft, paymentMethod: "stripe", stripePaymentIntentId: paymentIntentId },
      });
    };

    if (returnedPaymentIntentId && redirectStatus === "succeeded") {
      finalizeReturnedPayment(returnedPaymentIntentId).finally(() => setFinalizingPayment(false));
      return;
    }

    stripePromise.then(async (stripe) => {
      try {
        if (!stripe || !returnedSecret) return;
        const { paymentIntent } = await stripe.retrievePaymentIntent(returnedSecret);
        if (paymentIntent?.status === "succeeded") {
          await finalizeReturnedPayment(paymentIntent.id);
        } else if (paymentIntent?.status) {
          setOrderError(`Payment status: ${paymentIntent.status}. Please try again.`);
        }
      } catch (err) {
        setOrderError(err.message || "Could not finalize payment. Please contact support.");
      } finally {
        setFinalizingPayment(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadForProduct = (productId, file) => {
    if (!file) return;
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setPrescriptions((prev) => ({ ...prev, [productId]: { fileName: file.name, preview, uploading: true, error: "", url: null } }));
    orderApi.uploadPrescription(file)
      .then((data) => setPrescriptions((prev) => ({ ...prev, [productId]: { ...prev[productId], url: data.url, uploading: false } })))
      .catch((err) => setPrescriptions((prev) => ({ ...prev, [productId]: { ...prev[productId], uploading: false, error: err.response?.data?.message || "Upload failed." } })));
  };

  const removePrescription = (productId) => {
    setPrescriptions((prev) => {
      if (prev[productId]?.preview) URL.revokeObjectURL(prev[productId].preview);
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handlePayNow = async () => {
    if (!canPlaceOrder || placingOrderRef.current) return;
    placingOrderRef.current = true;
    setOrderError("");
    setPlacingOrder(true);

    try {
      if (selectedPayment === "cod") {
        await placeOrder({ paymentMethod: "cod" });
        return;
      }

      if (!confirmStripePaymentRef.current) {
        setOrderError("Payment form is still loading. Please wait a moment and try again.");
        return;
      }

      const draft = buildOrderPayload({ paymentMethod: "stripe" });
      localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));

      const { error, paymentIntent } = await confirmStripePaymentRef.current();
      if (error) {
        setOrderError(error.message || "Payment failed. Please try again.");
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        await placeOrder({
          paymentMethod: "stripe",
          stripePaymentIntentId: paymentIntent.id,
          draft: { ...draft, paymentMethod: "stripe", stripePaymentIntentId: paymentIntent.id },
        });
      } else {
        setOrderError("Payment was not completed.");
      }
    } finally {
      placingOrderRef.current = false;
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <SEO title="Checkout | Best-Vet-Care" description="Complete your Best-Vet-Care order securely." />
      <div className="min-h-screen bg-[#fffdf7]">
        <Header />

        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-5 lg:px-6">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#122a50]/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#d9aa3d]" />
              Secure Checkout · 100% Secure Payments
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="h-4 w-4 text-[#d9aa3d]" />
              24/7 Support · We're here to help
            </span>
          </div>

          {orderError && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{orderError}</p>
          )}

          {finalizingPayment && (
            <p className="mb-4 rounded-lg bg-[#f8f1df] px-3 py-2 text-sm font-semibold text-[#122a50]">
              Payment received. Finalizing your order...
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
            <div className="space-y-6">
              {!hasCheckoutItems && !isPaymentReturn ? (
                <EmptyCheckout />
              ) : (
                <>
                  <VerifyContactStep verified={contactComplete} onVerified={() => setVerified(true)} />

              {contactComplete && (
                <>
                  <AddressStep
                    selectedAddress={selectedAddress}
                    setSelectedAddress={setSelectedAddress}
                    locked={addressLocked}
                  />

                  {requiresPrescription && (
                    <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#122a50]">Upload Prescriptions</h3>
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          {prescriptionItems.filter((item) => prescriptions[item.productId || item.id]?.url).length}/{prescriptionItems.length} uploaded
                        </span>
                      </div>
                      <p className="mb-4 text-xs font-semibold text-[#122a50]/60">
                        Each prescription-required product needs its own document.
                      </p>

                      <div className="space-y-3">
                        {prescriptionItems.map((item) => {
                          const pid = item.productId || item.id;
                          const rx = prescriptions[pid];
                          const inputId = `rx-upload-${pid}`;
                          return (
                            <div key={pid} className="rounded-xl border border-[#17345f1a] bg-[#fffdf7] p-3">
                              {/* Product row */}
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-[#17345f1a] bg-white">
                                  {item.image
                                    ? <img src={item.image} alt="" className="h-full w-full object-cover" />
                                    : <div className="h-full w-full flex items-center justify-center"><FileText className="h-5 w-5 text-[#122a50]/30" /></div>
                                  }
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-bold text-[#122a50]">{item.name}</p>
                                  <p className="text-[10px] text-amber-600 font-semibold">Prescription required</p>
                                </div>
                                {rx?.url && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />}
                              </div>

                              {/* Uploaded file card */}
                              {rx ? (
                                <div className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                                  rx.url ? "border-green-200 bg-green-50" : rx.uploading ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
                                }`}>
                                  <div className="h-8 w-8 shrink-0 rounded overflow-hidden border border-[#17345f1a] bg-white flex items-center justify-center">
                                    {rx.preview
                                      ? <img src={rx.preview} alt="" className="h-full w-full object-cover" />
                                      : <FileText className="h-4 w-4 text-red-400" />
                                    }
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-bold text-[#122a50]">{rx.fileName}</p>
                                    {rx.uploading && <p className="text-[10px] text-amber-600 font-semibold">Uploading...</p>}
                                    {rx.url && <p className="text-[10px] text-green-600 font-semibold">Uploaded ✓</p>}
                                    {rx.error && <p className="text-[10px] text-red-600 font-semibold">{rx.error}</p>}
                                  </div>
                                  {!rx.uploading && (
                                    <label htmlFor={inputId} className="shrink-0 cursor-pointer rounded px-2 py-0.5 text-[10px] font-bold text-[#d9aa3d] hover:underline">
                                      Replace
                                      <input id={inputId} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { if (e.target.files[0]) uploadForProduct(pid, e.target.files[0]); e.target.value = ""; }} />
                                    </label>
                                  )}
                                  {!rx.uploading && (
                                    <button type="button" onClick={() => removePrescription(pid)} className="shrink-0 rounded p-1 text-[#122a50]/40 hover:text-red-500">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <label
                                  htmlFor={inputId}
                                  className="flex items-center gap-2 rounded-lg border-2 border-dashed border-[#17345f33] bg-white px-3 py-3 cursor-pointer hover:border-[#d9aa3d] hover:bg-amber-50/40 transition-colors"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                    <Upload className="h-4 w-4 text-amber-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#122a50]">Click to upload</p>
                                    <p className="text-[10px] text-[#122a50]/50">Image or PDF</p>
                                  </div>
                                  <input id={inputId} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { if (e.target.files[0]) uploadForProduct(pid, e.target.files[0]); e.target.value = ""; }} />
                                </label>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <PaymentStep
                    key={paymentAmountKey}
                    selectedPayment={selectedPayment}
                    setSelectedPayment={setSelectedPayment}
                    total={total}
                    checkoutPayload={checkoutPaymentPayload}
                    onStripeReady={handleStripeReady}
                    locked={paymentLocked}
                  />

                  <div>
                    <button
                      type="button"
                      onClick={handlePayNow}
                      disabled={!canPlaceOrder || placingOrder}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-extrabold text-white transition-all ${
                        canPlaceOrder && !placingOrder
                          ? "bg-[#17345f] hover:bg-[#d9aa3d]"
                          : "cursor-not-allowed bg-[#17345f]/30"
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {placingOrder ? "Processing…" : "Pay Now"}
                    </button>
                    <p className="mt-3 text-center text-xs font-semibold text-[#122a50]/50">
                      By placing your order, you agree to our{" "}
                      <Link to="/terms-conditions" className="font-extrabold text-[#d9aa3d] hover:text-[#17345f]">
                        Terms &amp; Conditions
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy-policy" className="font-extrabold text-[#d9aa3d] hover:text-[#17345f]">
                        Privacy Policy
                      </Link>
                    </p>
                  </div>
                </>
              )}
                </>
              )}
            </div>

            {hasCheckoutItems && (
            <OrderSummary
              cartItems={checkoutItems}
              subtotal={subtotal}
              discount={discount}
              shipping={shippingCost}
              tax={tax}
              taxRate={taxRate}
              total={total}
              promoDiscount={couponDiscount}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
              rewards={rewards}
              rewardPointsToRedeem={rewardPointsToRedeem}
              setRewardPointsToRedeem={setRewardPointsToRedeem}
              rewardDiscount={rewardDiscount}
              rewardEarnPoints={rewardEarnPoints}
              rewardMaxPoints={rewardMaxPoints}
            />
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Checkout;
