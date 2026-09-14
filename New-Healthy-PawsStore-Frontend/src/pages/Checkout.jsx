import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import CheckoutBenefits from "../components/checkout/CheckoutBenefits";
import CheckoutErrorState from "../components/checkout/CheckoutErrorState";
import ContactStep from "../components/checkout/ContactStep";
import DeliveryAddressStep from "../components/checkout/DeliveryAddressStep";
import OrderSummary from "../components/checkout/OrderSummary";
import PaymentMethod from "../components/checkout/PaymentMethod";
import PrescriptionUploadStep from "../components/checkout/PrescriptionUploadStep";
import Header from "../components/layout/Header";
import { Headphones, Lock, ShieldCheck } from "lucide-react";
import { cartApi } from "../api/cartApi";
import { addressApi } from "../api/addressApi";
import { checkoutApi } from "../api/checkoutApi";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import { useToast } from "../context/ToastContext";
import { checkoutDefaults, checkoutSchema } from "../schemas/checkoutSchema";
import {
  applyCouponCode,
  placeCheckoutOrder,
} from "../services/checkoutService";
import { getStoredAuthUser } from "../services/authService";
import { stripeCurrency, stripePublishableKey } from "../lib/stripe";
import { isVetOnly } from "../utils/productUtils";
import {
  getPrescriptionForItem,
  getPrescriptionKey,
} from "../utils/prescriptionUtils";

const toStripeMinorUnit = (amount) => Math.round(Number(amount || 0) * 100);
const toMoney = (amount) => Number(Number(amount || 0).toFixed(2));
const BUY_NOW_STORAGE_KEY = "healthy_paws_buy_now_checkout";
const DEFAULT_SHIPPING_COUNTRY = "US";

function readBuyNowItem() {
  try {
    const storedItem = window.sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
    return storedItem ? JSON.parse(storedItem) : null;
  } catch {
    return null;
  }
}

function parseAddressLine2(address = {}) {
  const parts = String(address.line2 || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    city: parts[0] || "",
    state: parts[1] || "",
    postalCode: parts[2] || "",
  };
}

function getCouponDiscount(coupon) {
  if (!coupon) return 0;
  const value = coupon.discount ?? coupon.discountAmount ?? coupon.amount ?? 0;
  const normalized = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(normalized) ? toMoney(normalized) : 0;
}

function getIntentAmount(intent) {
  const amount = Number(intent?.amount);
  return Number.isFinite(amount) ? amount : null;
}

function intentMatchesCheckoutTotal(intent, expectedAmount) {
  const amount = getIntentAmount(intent);
  return amount === null || Math.abs(amount - expectedAmount) <= 1;
}

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function normalizeQuoteItem(item = {}) {
  return {
    ...item,
    id: item.id || item.variantId || item.productId,
    title: item.title || item.name || "Product",
    price: toMoney(item.price),
    quantity: Math.max(1, Number(item.quantity) || 1),
    prescriptionRequired: Boolean(
      item.prescriptionRequired ??
      item.product?.prescriptionRequired ??
      item.prescription_required ??
      false,
    ),
  };
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [activeTax, setActiveTax] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState({
    clientSecret: "",
    paymentIntentId: "",
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [stripeContext, setStripeContext] = useState({
    stripe: null,
    elements: null,
  });
  const [stripePaymentComplete, setStripePaymentComplete] = useState(false);
  const [contactVerified, setContactVerified] = useState(false);
  const [contactEditing, setContactEditing] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");
  const [addressComplete, setAddressComplete] = useState(false);
  const [addressEditing, setAddressEditing] = useState(true);
  const [prescriptions, setPrescriptions] = useState({});
  const [coupon, setCoupon] = useState("");
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponMessageTone, setCouponMessageTone] = useState("success");
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const shippingTimerRef = useRef(null);
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const reduceMotion = useReducedMotion();
  const isBuyNowCheckout =
    new URLSearchParams(location.search).get("buyNow") === "1";

  const {
    register,
    watch,
    formState: { errors, isValid },
    trigger,
    getValues,
    setValue,
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: checkoutDefaults,
    mode: "onChange",
  });

  const paymentMethod = watch("paymentMethod");
  const values = watch();

  useEffect(() => {
    const user = getStoredAuthUser();
    if (!user?.email) return;

    setValue("fullName", user.name || "", { shouldValidate: true });
    setValue("email", user.email || "", { shouldValidate: true });
    if (user.phone) setValue("phone", user.phone, { shouldValidate: true });

    if (user.name && user.email && user.phone) {
      setContactVerified(true);
      setContactEditing(false);
    }
  }, [setValue]);

  const rxRequiredItems = useMemo(
    () =>
      items.filter((item) =>
        Boolean(
          item.prescriptionRequired ||
          item.product?.prescriptionRequired ||
          item.prescription_required,
        ),
      ),
    [items],
  );

  const vetRestrictedItems = useMemo(
    () => items.filter((item) => isVetOnly(item.product || item)),
    [items],
  );

  const hasVetRestriction = useMemo(
    () =>
      Boolean(
        vetRestrictedItems.length > 0 && !getStoredAuthUser()?.isVetVerified,
      ),
    [vetRestrictedItems],
  );

  const rxComplete = useMemo(
    () =>
      rxRequiredItems.length === 0 ||
      rxRequiredItems.every((item) =>
        Boolean(getPrescriptionForItem(prescriptions, item)),
      ),
    [rxRequiredItems, prescriptions],
  );

  const handlePrescriptionUploaded = useCallback((itemOrId, data) => {
    const item = typeof itemOrId === "object" ? itemOrId : { id: itemOrId };
    const primaryKey = getPrescriptionKey(item) || item.id || item.productId;

    setPrescriptions((prev) => {
      const next = { ...prev, [primaryKey]: data };
      if (item.id) next[item.id] = data;
      if (item.productId) next[item.productId] = data;
      if (item.productId && item.variantId)
        next[`${item.productId}:${item.variantId}`] = data;
      return next;
    });
  }, []);

  const handlePrescriptionRemoved = useCallback((itemOrId) => {
    const targetId =
      typeof itemOrId === "string"
        ? itemOrId
        : itemOrId?.id || itemOrId?.productId;
    setPrescriptions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (
          k === targetId ||
          (typeof itemOrId === "object" &&
            (k === itemOrId.id ||
              k === itemOrId.productId ||
              k === itemOrId.variantId)) ||
          k.startsWith(`${targetId}:`)
        ) {
          delete next[k];
        }
      });
      return next;
    });
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  useEffect(() => {
    if (!getStoredAuthUser()) {
      window.localStorage.removeItem("healthyPaws.auth.blocked_reason");
    }
  }, []);

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
  const taxRate = Number(activeTax?.rate || 0);
  const couponBaseAmount = toMoney(Math.max(subtotal, 0));
  const discount = Math.min(getCouponDiscount(activeCoupon), couponBaseAmount);
  const taxableSubtotal = toMoney(Math.max(subtotal - discount, 0));
  const tax = toMoney((taxableSubtotal * taxRate) / 100);
  const total = toMoney(Math.max(taxableSubtotal + shipping + tax, 0));
  const quotedItems = Array.isArray(checkoutQuote?.items)
    ? checkoutQuote.items.map(normalizeQuoteItem)
    : [];
  const summaryItems = quotedItems.length ? quotedItems : items;
  const checkoutSubtotal = toMoney(checkoutQuote?.subtotal ?? subtotal);
  const checkoutShipping = toMoney(checkoutQuote?.shipping ?? shipping);
  const checkoutDiscount = toMoney(checkoutQuote?.discount ?? discount);
  const checkoutTaxRate = Number(checkoutQuote?.taxRate ?? taxRate);
  const checkoutTax = toMoney(checkoutQuote?.tax ?? tax);
  const checkoutTotal = toMoney(checkoutQuote?.total ?? total);
  const totalAmount = checkoutTotal;
  const usesStripe = paymentMethod === "stripe";
  const contactReady =
    contactVerified &&
    addressComplete &&
    rxComplete &&
    values.fullName?.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email || "") &&
    values.phone?.replace(/\D/g, "").length >= 7;
  const paymentLocked = !addressComplete || !rxComplete;

  const resetStripePayment = useCallback(() => {
    setPaymentIntent({ clientSecret: "", paymentIntentId: "" });
    setStripePaymentComplete(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCheckoutItems() {
      setItemsLoading(true);

      if (isBuyNowCheckout) {
        const buyNowItem = readBuyNowItem();
        if (active) {
          setItems(buyNowItem ? [buyNowItem] : []);
          setItemsLoading(false);
        }
        return;
      }

      window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);

      try {
        const cartItems = await cartApi.getCart();
        if (active) setItems(Array.isArray(cartItems) ? cartItems : []);
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setItemsLoading(false);
      }
    }

    loadCheckoutItems();

    return () => {
      active = false;
    };
  }, [isBuyNowCheckout]);

  useEffect(() => {
    let active = true;
    checkoutApi
      .activeTax()
      .then((taxRecord) => {
        if (active) setActiveTax(taxRecord || null);
      })
      .catch(() => {
        if (active) setActiveTax(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!usesStripe) {
      setPaymentError("");
      setPaymentLoading(false);
      return;
    }

    if (!stripePublishableKey) {
      setPaymentError(
        "Stripe publishable key is missing. Add VITE_STRIPE_PUBLISHABLE_KEY and restart the storefront.",
      );
      setPaymentLoading(false);
      return;
    }

    if (!contactReady) {
      setPaymentError("");
      setPaymentLoading(false);
      setPaymentIntent({ clientSecret: "", paymentIntentId: "" });
      setStripePaymentComplete(false);
      return;
    }

    if (!checkoutQuote) {
      setPaymentError("");
      setPaymentLoading(quoteLoading);
      setPaymentIntent({ clientSecret: "", paymentIntentId: "" });
      setStripePaymentComplete(false);
      return;
    }

    let active = true;

    async function preparePaymentIntent() {
      setPaymentLoading(true);
      setPaymentError("");

      try {
        await checkoutApi.ensureCheckoutContact(getValues());
        let nextIntent = paymentIntent.paymentIntentId
          ? await checkoutApi.updatePaymentIntent({
              paymentIntentId: paymentIntent.paymentIntentId,
              amount: totalAmount,
              currency: stripeCurrency,
            })
          : await checkoutApi.createPaymentIntent({
              amount: totalAmount,
              currency: stripeCurrency,
            });

        const expectedAmount = toStripeMinorUnit(totalAmount);
        if (!intentMatchesCheckoutTotal(nextIntent, expectedAmount)) {
          nextIntent = await checkoutApi.createPaymentIntent({
            amount: totalAmount,
            currency: stripeCurrency,
          });
          setStripePaymentComplete(false);
        }

        if (!active) return;
        setPaymentIntent((current) => ({
          clientSecret: nextIntent.clientSecret || current.clientSecret,
          paymentIntentId:
            nextIntent.paymentIntentId || current.paymentIntentId,
        }));
      } catch (error) {
        if (active) {
          setPaymentError(
            error.message || "Stripe payment could not be prepared.",
          );
          setPaymentIntent({ clientSecret: "", paymentIntentId: "" });
        }
      } finally {
        if (active) setPaymentLoading(false);
      }
    }

    preparePaymentIntent();

    return () => {
      active = false;
    };
  }, [
    checkoutQuote,
    contactReady,
    quoteLoading,
    totalAmount,
    usesStripe,
    values.email,
    values.fullName,
    values.phone,
  ]);

  useEffect(() => {
    if (!contactReady || !items.length) {
      setCheckoutQuote(null);
      setQuoteLoading(false);
      return;
    }

    let active = true;

    async function loadCheckoutQuote() {
      setQuoteLoading(true);
      const localQuote = {
        subtotal,
        shipping,
        tax,
        discount,
        total: Math.max(subtotal + shipping + tax - discount, 0),
        items,
      };

      // Skip backend quote for carts with Rx items — backend validation for
      // prescriptions in the quote endpoint is unsettled. Use local totals instead.
      if (rxRequiredItems.length > 0) {
        if (active) {
          setCheckoutQuote(localQuote);
          setSubmitError("");
          setQuoteLoading(false);
        }
        return;
      }

      try {
        const quote = await checkoutApi.quoteOrder({
          values: getValues(),
          items,
          subtotal,
          shipping,
          tax,
          discount: 0,
          promoDiscount: 0,
          couponDiscount: discount,
          couponCode: activeCoupon?.code || undefined,
          paymentMethod,
        });

        if (active) {
          setCheckoutQuote(quote || localQuote);
          setSubmitError("");
        }
      } catch (error) {
        if (active) {
          console.warn(
            "Quote calculation backend notice (using local calculation):",
            error.message,
          );
          setCheckoutQuote(localQuote);
          setSubmitError("");
        }
      } finally {
        if (active) setQuoteLoading(false);
      }
    }

    loadCheckoutQuote();

    return () => {
      active = false;
    };
  }, [
    activeCoupon?.code,
    contactReady,
    discount,
    items,
    paymentMethod,
    rxRequiredItems.length,
    shipping,
    subtotal,
    tax,
    values.address,
    values.city,
    values.country,
    values.postalCode,
    values.state,
  ]);

  const handleStripeReady = useCallback(({ stripe, elements }) => {
    setStripeContext({ stripe, elements });
  }, []);

  const handleContactContinue = async () => {
    setContactError("");
    const valid = await trigger(["fullName", "email", "phone"]);
    if (!valid) return;

    setContactLoading(true);
    try {
      await checkoutApi.ensureCheckoutContact(getValues());
      setContactVerified(true);
      setContactEditing(false);
    } catch (error) {
      setContactError(error.message || "Could not continue checkout.");
    } finally {
      setContactLoading(false);
    }
  };

  const handleAddressSave = async (editIndex = null) => {
    const valid = await trigger([
      "address",
      "city",
      "state",
      "postalCode",
      "country",
    ]);
    if (!valid) return;

    const currentValues = getValues();
    const payload = {
      label: "Home",
      fullName: currentValues.fullName,
      phone: currentValues.phone,
      line1: currentValues.address,
      city: currentValues.city,
      state: currentValues.state,
      postalCode: currentValues.postalCode,
      country: currentValues.country || DEFAULT_SHIPPING_COUNTRY,
      isDefault: false,
    };

    let savedAddress;
    if (editIndex !== null && editIndex !== undefined && editIndex >= 0) {
      savedAddress = await addressApi.updateAddress(editIndex, payload);
    } else {
      savedAddress = await addressApi.addAddress(payload);
    }

    setAddressComplete(true);
    setAddressEditing(false);
    return savedAddress;
  };

  const handleSelectSavedAddress = (address) => {
    const line2Parts = parseAddressLine2(address);

    setValue("address", address.line1 || address.address || "", {
      shouldValidate: true,
    });
    setValue("city", address.city || line2Parts.city || "", {
      shouldValidate: true,
    });
    setValue("state", address.state || line2Parts.state || "", {
      shouldValidate: true,
    });
    setValue(
      "postalCode",
      address.postalCode || address.zip || line2Parts.postalCode || "",
      { shouldValidate: true },
    );
    setValue("country", address.country || DEFAULT_SHIPPING_COUNTRY, {
      shouldValidate: true,
    });

    setAddressComplete(true);
    setAddressEditing(false);
  };

  const handleApplyCoupon = async (couponCode = coupon) => {
    const code = String(typeof couponCode === "string" ? couponCode : coupon).trim();
    if (!code) {
      setCouponMessage("Please enter a coupon code.");
      setCouponMessageTone("error");
      return;
    }
    if (activeCoupon) return;

    setCouponLoading(true);
    setCouponMessage("");
    setCouponMessageTone("success");
    try {
      const result = await applyCouponCode(code, couponBaseAmount, 0);
      const appliedDiscount = Math.min(
        getCouponDiscount(result),
        couponBaseAmount,
      );

      if (appliedDiscount <= 0) {
        throw new Error(
          result?.message ||
            result?.error ||
            "Invalid coupon code. Please check the code and try again.",
        );
      }

      const nextCoupon = {
        ...result,
        code: result.code || code,
        discount: appliedDiscount,
      };

      setActiveCoupon(nextCoupon);
      setCheckoutQuote(null);
      setCoupon(nextCoupon.code);
      setCouponMessage(result.message || "Coupon applied.");
      setCouponMessageTone("success");
      resetStripePayment();
    } catch (error) {
      setActiveCoupon(null);
      setCheckoutQuote(null);
      setCouponMessage(
        error.message ||
          "Invalid coupon code. Please check the code and try again.",
      );
      setCouponMessageTone("error");
      resetStripePayment();
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon(null);
    setCheckoutQuote(null);
    setCoupon("");
    setCouponMessage("");
    setCouponMessageTone("success");
    resetStripePayment();
  };

  const handlePlaceOrder = async () => {
    if (hasVetRestriction) {
      showToast(
        "Your order contains product(s) exclusive to verified veterinarians. Please complete vet verification before placing an order.",
        "error",
      );
      navigate(getStoredAuthUser() ? "/account/vet-verification" : "/login");
      return;
    }
    setSubmitError("");
    const valid = await trigger();
    if (!valid) {
      setSubmitError("Please complete all required checkout fields.");
      if (errors.fullName || errors.email || errors.phone) {
        scrollToSection("contact-section");
      } else if (
        errors.address ||
        errors.city ||
        errors.state ||
        errors.postalCode
      ) {
        scrollToSection("address-section");
      }
      return;
    }
    if (!contactVerified) {
      setSubmitError(
        "Contact Information Required: Please verify your contact details first.",
      );
      scrollToSection("contact-section");
      return;
    }
    if (!addressComplete) {
      setSubmitError(
        "Delivery Address Required: Please complete and save your delivery address first.",
      );
      scrollToSection("address-section");
      return;
    }
    if (rxRequiredItems.length > 0 && !rxComplete) {
      setSubmitError(
        "Prescription Upload Required: Please upload valid prescription file(s) for the marked item(s) above.",
      );
      scrollToSection("prescription-section");
      return;
    }
    if (!checkoutQuote) {
      setSubmitError(
        "Checkout total is still refreshing. Please try again in a moment.",
      );
      return;
    }
    setSubmitting(true);
    try {
      let orderPaymentMethod = "cod";
      let stripePaymentIntentId = null;

      if (usesStripe) {
        if (!stripePublishableKey) {
          throw new Error(
            "Stripe publishable key is missing. Add VITE_STRIPE_PUBLISHABLE_KEY and restart the storefront.",
          );
        }
        if (!paymentIntent.clientSecret || !paymentIntent.paymentIntentId) {
          throw new Error(
            "Secure card payment is still loading. Please try again in a moment.",
          );
        }
        if (!stripeContext.stripe || !stripeContext.elements) {
          throw new Error("Stripe payment form is not ready yet.");
        }
        if (!stripePaymentComplete) {
          scrollToSection("payment-section");
          throw new Error(
            "Card Information Incomplete: Please enter all card details (Card Number, Expiration MM/YY, Security Code CVC, and ZIP Code).",
          );
        }

        let currentPaymentIntentId = paymentIntent.paymentIntentId;
        const updatedIntent = await checkoutApi.updatePaymentIntent({
          paymentIntentId: paymentIntent.paymentIntentId,
          amount: totalAmount,
          currency: stripeCurrency,
        });
        const expectedAmount = toStripeMinorUnit(totalAmount);
        currentPaymentIntentId =
          updatedIntent?.paymentIntentId || currentPaymentIntentId;

        if (!intentMatchesCheckoutTotal(updatedIntent, expectedAmount)) {
          const nextIntent = await checkoutApi.createPaymentIntent({
            amount: totalAmount,
            currency: stripeCurrency,
          });
          setPaymentIntent({
            clientSecret: nextIntent.clientSecret,
            paymentIntentId: nextIntent.paymentIntentId,
          });
          setStripePaymentComplete(false);
          throw new Error(
            "Checkout total changed. Please enter your payment details again.",
          );
        }

        if (updatedIntent?.status === "succeeded") {
          orderPaymentMethod = "stripe";
          stripePaymentIntentId = currentPaymentIntentId;
        } else {
          const result = await stripeContext.stripe.confirmPayment({
            elements: stripeContext.elements,
            confirmParams: { return_url: `${window.location.origin}/checkout` },
            redirect: "if_required",
          });

          if (result.error) {
            if (result.error.code === "payment_intent_unexpected_state") {
              const { paymentIntent: recoveredIntent } =
                await stripeContext.stripe.retrievePaymentIntent(
                  paymentIntent.clientSecret,
                );

              if (
                recoveredIntent?.status === "succeeded" &&
                intentMatchesCheckoutTotal(recoveredIntent, expectedAmount)
              ) {
                orderPaymentMethod = "stripe";
                stripePaymentIntentId = recoveredIntent.id;
              } else if (recoveredIntent?.status === "succeeded") {
                resetStripePayment();
                throw new Error(
                  "Checkout total changed. Please enter your payment details again.",
                );
              } else {
                throw new Error(
                  recoveredIntent?.status
                    ? `Payment status: ${recoveredIntent.status}. Please try again.`
                    : "Payment could not be confirmed.",
                );
              }
            } else {
              throw new Error(
                result.error.message || "Payment could not be confirmed.",
              );
            }
          } else if (result.paymentIntent?.status !== "succeeded") {
            throw new Error("Payment was not completed. Please try again.");
          } else if (
            !intentMatchesCheckoutTotal(result.paymentIntent, expectedAmount)
          ) {
            resetStripePayment();
            throw new Error(
              "Checkout total changed. Please enter your payment details again.",
            );
          } else {
            orderPaymentMethod = "stripe";
            stripePaymentIntentId = result.paymentIntent.id;
          }
        }

        if (!stripePaymentIntentId) {
          throw new Error("Payment was not completed. Please try again.");
        }
      }

      const createdOrder = await placeCheckoutOrder({
        values: getValues(),
        items,
        subtotal: checkoutSubtotal,
        shipping: checkoutShipping,
        tax: checkoutTax,
        discount: 0,
        promoDiscount: 0,
        couponDiscount: activeCoupon ? checkoutDiscount : 0,
        couponCode: activeCoupon?.code || undefined,
        paymentMethod: orderPaymentMethod,
        stripePaymentIntentId,
        prescriptions,
      });

      if (isBuyNowCheckout) {
        window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
      } else {
        cartApi.clear().catch(() => {});
      }

      const checkoutValues = getValues();
      const order = {
        id: createdOrder?.id || `#HP${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        items,
        address: {
          fullName: checkoutValues.fullName,
          phone: checkoutValues.phone,
          address: checkoutValues.address,
          city: checkoutValues.city,
          state: checkoutValues.state,
          postalCode: checkoutValues.postalCode,
          country: checkoutValues.country || DEFAULT_SHIPPING_COUNTRY,
        },
        payment: orderPaymentMethod,
        subtotal: checkoutSubtotal,
        discount: checkoutDiscount,
        shipping: checkoutShipping,
        tax: checkoutTax,
        total: checkoutTotal,
        confirmationEmail: createdOrder?.confirmationEmail || {
          delivered: false,
        },
      };
      localStorage.setItem("healthy_paws_last_order", JSON.stringify(order));
      navigate("/order-success", { replace: true });
    } catch (error) {
      setSubmitError(
        error.message ||
          "Payment details are incomplete or could not be verified.",
      );
      scrollToSection("payment-section");
    } finally {
      setSubmitting(false);
    }
  };

  if (itemsLoading) {
    return (
      <div className="min-h-screen bg-background text-textMain">
        <Header showNav={false} />
        <main className="grid min-h-[420px] place-items-center px-4 py-8">
          <p className="text-[15px] font-extrabold text-secondaryDark">
            Loading checkout...
          </p>
        </main>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-background text-textMain">
        <Header showNav={false} />
        <main className="px-4 py-8">
          <CheckoutErrorState />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-textMain">
      <Header />
      <main className="w-full min-w-0 pb-32 sm:pb-16">
        <div className="mx-auto flex max-w-[1380px] flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 px-4 py-3 sm:py-5 text-[12px] sm:text-[13px] font-semibold text-muted">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 shrink-0 text-orange" />
            Secure Checkout · 100% Secure Payments
          </span>
          <span className="flex items-center gap-2">
            <Headphones className="size-4 shrink-0 text-orange" />
            24/7 Support · We're here to help
          </span>
        </div>
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          className="mx-auto grid max-w-[1380px] min-w-0 gap-6 px-3.5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:px-8"
        >
          <form
            className="grid min-w-0 content-start gap-5 sm:gap-6 order-1 lg:order-1"
            onSubmit={(event) => event.preventDefault()}
          >
            {hasVetRestriction && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm text-left">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold uppercase tracking-wider text-amber-800 text-xs">
                      Verified Veterinarian Required
                    </h4>
                    <p className="font-semibold text-amber-700 mt-0.5 text-xs">
                      Your order contains product(s) exclusive to verified
                      veterinarians. Order placement is restricted until vet
                      verification is approved.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      getStoredAuthUser()
                        ? "/account/vet-verification"
                        : "/login",
                    )
                  }
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Apply for Verification
                </button>
              </div>
            )}

            <ContactStep
              register={register}
              errors={errors}
              verified={contactVerified}
              editing={contactEditing}
              loading={contactLoading}
              error={contactError}
              values={values}
              onContinue={handleContactContinue}
              onChange={() => {
                setContactEditing(true);
                setContactVerified(false);
                setAddressComplete(false);
                setAddressEditing(true);
                resetStripePayment();
              }}
            />
            {contactVerified && (
              <DeliveryAddressStep
                register={register}
                errors={errors}
                values={values}
                setValue={setValue}
                complete={addressComplete}
                editing={addressEditing}
                locked={!contactVerified}
                onSave={handleAddressSave}
                onEdit={() => {
                  setAddressEditing(true);
                  setAddressComplete(false);
                  resetStripePayment();
                }}
                onCancel={() => setAddressEditing(false)}
                onSelectSavedAddress={handleSelectSavedAddress}
              />
            )}
            {contactVerified &&
              addressComplete &&
              rxRequiredItems.length > 0 && (
                <PrescriptionUploadStep
                  items={rxRequiredItems}
                  prescriptions={prescriptions}
                  onPrescriptionUploaded={handlePrescriptionUploaded}
                  onPrescriptionRemoved={handlePrescriptionRemoved}
                  complete={rxComplete}
                  locked={!contactVerified || !addressComplete}
                />
              )}
            {contactVerified && (
              <>
                <PaymentMethod
                  register={register}
                  paymentMethod={paymentMethod}
                  clientSecret={paymentIntent.clientSecret}
                  paymentLoading={paymentLoading}
                  paymentError={paymentError}
                  onStripeReady={handleStripeReady}
                  onPaymentCompleteChange={setStripePaymentComplete}
                  onCardError={(msg) => setSubmitError(msg)}
                  hasError={Boolean(
                    submitError &&
                    (submitError.includes("Card") ||
                      submitError.includes("Payment")),
                  )}
                  locked={paymentLocked}
                />
                {submitError && (
                  <p className="rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={
                    !isValid ||
                    !contactVerified ||
                    !addressComplete ||
                    !rxComplete ||
                    paymentLoading ||
                    quoteLoading ||
                    !checkoutQuote ||
                    (usesStripe &&
                      (!!paymentError || !paymentIntent.clientSecret)) ||
                    submitting
                  }
                  className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-secondaryDark px-5 text-[16px] font-extrabold text-white shadow-card transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Lock size={17} fill="currentColor" />
                  {submitting ? "Processing..." : "Pay Now"}
                </button>
                <p className="text-center text-[12px] font-semibold leading-relaxed text-muted">
                  By placing your order, you agree to our{" "}
                  <a href="#" className="text-secondaryDark">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-secondaryDark">
                    Privacy Policy
                  </a>
                </p>
              </>
            )}
          </form>
          <OrderSummary
            items={summaryItems}
            subtotal={checkoutSubtotal}
            shipping={checkoutShipping}
            tax={checkoutTax}
            taxRate={checkoutTaxRate}
            discount={checkoutDiscount}
            total={checkoutTotal}
            onPlaceOrder={handlePlaceOrder}
            submitting={submitting}
            disabled={
              !isValid ||
              !contactVerified ||
              !addressComplete ||
              !rxComplete ||
              paymentLoading ||
              quoteLoading ||
              !checkoutQuote ||
              (usesStripe && (!!paymentError || !paymentIntent.clientSecret))
            }
            error={submitError}
            showCheckoutButton={false}
            coupon={coupon}
            setCoupon={setCoupon}
            onApplyCoupon={handleApplyCoupon}
            onSelectCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            couponLoading={couponLoading}
            couponMessage={couponMessage}
            couponMessageTone={couponMessageTone}
            activeCoupon={activeCoupon}
          />
        </motion.section>
        <CheckoutBenefits />
      </main>
    </div>
  );
}
