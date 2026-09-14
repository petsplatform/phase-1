import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { isVetOnly } from "../utils/productUtils";
import {
  clearAuthCredentials,
  checkoutContactApi,
  createOrderApi,
  getAddressesApi,
  addAddressApi,
  updateAddressApi,
  removeAddressApi,
  createPaymentIntentApi,
  validateCouponApi,
  getCouponsApi,
  uploadPrescriptionApi,
  CUSTOMER_BLOCKED_REASON_KEY,
} from "../helper/axiosInstance";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_TYooMQauvdEDq54NiTphI7jx",
);
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  Lock,
  ArrowRight,
  UserCheck,
  Smartphone,
  MapPin,
  RefreshCw,
  Sparkles,
  Edit2,
  Plus,
  CreditCard,
  Percent,
  AlertCircle,
  FileText,
  UploadCloud,
  Paperclip,
  Trash2,
  FileCheck,
} from "lucide-react";
import { showToast } from "../components/common/toast/ToastHelper";
import CountryDropdown from "../components/common/CountryDropdown";
import { calculateCheckoutTotals, toMoney } from "../utils/checkoutTotals";

export default function CheckoutPage() {
  const {
    cartItems,
    clearCart,
    appliedCode,
    setAppliedCode,
    setDiscountPercent,
    promoDiscount,
    setPromoDiscount,
    taxName,
    taxRate,
    taxLoading,
    loading: cartLoading,
  } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, login, updateSession, authStatus, checkoutContact } = useAuth();
  const [buyNowItem, setBuyNowItem] = useState(() => {
    try {
      const stored = sessionStorage.getItem("pet_meds_buy_now");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const isBuyNowCheckout =
    new URLSearchParams(location.search).get("buyNow") === "1" &&
    buyNowItem;
  const checkoutItems = useMemo(
    () => (isBuyNowCheckout ? [buyNowItem] : cartItems),
    [isBuyNowCheckout, buyNowItem, cartItems],
  );
  const checkoutSubtotal = toMoney(
    checkoutItems.reduce(
      (acc, item) => acc + Number(item.product?.sellingPrice || item.sellingPrice || 0) * item.quantity,
      0,
    ),
  );
  const checkoutAutoShipSavings = 0;
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("");

  useEffect(() => {
    let active = true;
    if (!checkoutSubtotal || checkoutSubtotal <= 0) {
      setShippingCost(0);
      setShippingLabel("");
      return;
    }

    shipmentChargeApi
      .resolveChargeInfo(checkoutSubtotal)
      .then(({ charge, matched }) => {
        if (active) {
          setShippingCost(Number(charge || 0));
          setShippingLabel(matched?.name || matched?.label || matched?.title || "");
        }
      })
      .catch(() => {
        if (active) {
          setShippingCost(0);
          setShippingLabel("");
        }
      });

    return () => {
      active = false;
    };
  }, [checkoutSubtotal]);

  const checkoutShippingCost = shippingCost;

  const isRxRequired = useCallback((item) => {
    if (!item) return false;
    const p = item.product || item;
    const candidates = [
      p?.prescriptionRequired,
      p?.isPrescriptionRequired,
      p?.prescription_required,
      p?.requiresPrescription,
      p?.isPrescription,
      p?.prescriptionNeeded,
      p?.prescription,
      item?.prescriptionRequired,
      item?.isPrescriptionRequired,
      item?.prescription_required,
      item?.requiresPrescription,
      item?.isPrescription,
      item?.prescriptionNeeded,
      item?.prescription,
    ];

    for (const val of candidates) {
      if (val === true || val === 1) return true;
      if (typeof val === "string") {
        const s = val.trim().toLowerCase();
        if (s === "true" || s === "1" || s === "yes" || s === "required") {
          return true;
        }
      }
      if (typeof val === "object" && val !== null && Object.keys(val).length > 0) {
        return true;
      }
    }

    const catId = p?.categoryId || p?.category?.id || item?.categoryId || item?.category?.id;
    if (catId === "CAT-1784541742606") return true;

    const fullText = `${p?.name || ""} ${p?.title || ""} ${p?.description || ""} ${p?.category?.name || p?.category || ""}`.toLowerCase();
    if (
      fullText.includes("prescription") ||
      fullText.includes("rx required") ||
      fullText.includes("vet required")
    ) {
      return true;
    }

    return false;
  }, []);

  const hasPrescriptionProduct = useMemo(() => {
    return checkoutItems.some(isRxRequired);
  }, [checkoutItems, isRxRequired]);

  const vetRestrictedItems = useMemo(() => {
    return checkoutItems.filter((item) => isVetOnly(item.product || item));
  }, [checkoutItems]);

  const hasVetRestriction = useMemo(() => {
    return Boolean(vetRestrictedItems.length > 0 && !user?.isVetVerified);
  }, [vetRestrictedItems, user]);

  const prescriptionItems = useMemo(() => {
    return checkoutItems.filter(isRxRequired);
  }, [checkoutItems, isRxRequired]);

  const paymentStep = hasPrescriptionProduct ? 4 : 3;

  const [uploadedPrescriptions, setUploadedPrescriptions] = useState({});
  const [uploadingMap, setUploadingMap] = useState({});
  const [globalUploading, setGlobalUploading] = useState(false);

  const handlePrescriptionFilesUpload = async (productId, filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;

    setUploadingMap((prev) => ({ ...prev, [productId]: true }));

    try {
      const uploadPromises = files.map(async (file) => {
        const res = await uploadPrescriptionApi(file);
        const uploadedUrl =
          typeof res === "string"
            ? res
            : res?.url || res?.prescriptionUrl || res?.fileUrl || "";
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          url: uploadedUrl,
        };
      });

      const newUploadedFiles = await Promise.all(uploadPromises);

      setUploadedPrescriptions((prev) => {
        const existing = Array.isArray(prev[productId]) ? prev[productId] : [];
        return {
          ...prev,
          [productId]: [...existing, ...newUploadedFiles],
        };
      });

      showToast.success(
        `${newUploadedFiles.length} prescription file(s) uploaded successfully!`,
      );
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Upload failed";
      showToast.error(msg);
    } finally {
      setUploadingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleGlobalPrescriptionFilesUpload = async (filesList) => {
    const files = Array.from(filesList || []);
    if (!files.length) return;

    setGlobalUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const res = await uploadPrescriptionApi(file);
        const uploadedUrl =
          typeof res === "string"
            ? res
            : res?.url || res?.prescriptionUrl || res?.fileUrl || "";
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          fileName: file.name,
          url: uploadedUrl,
        };
      });

      const newUploadedFiles = await Promise.all(uploadPromises);

      setUploadedPrescriptions((prev) => {
        const updated = { ...prev };
        prescriptionItems.forEach((item) => {
          const p = item.product || item;
          const pId = p.id || p._id || p.sku || item.id;
          const existing = Array.isArray(updated[pId]) ? updated[pId] : [];
          updated[pId] = [...existing, ...newUploadedFiles];
        });
        return updated;
      });

      showToast.success(
        `Master prescription (${newUploadedFiles.length} file(s)) applied to all items!`,
      );
    } catch (err) {
      showToast.error(
        typeof err === "string" ? err : err?.message || "Prescription upload failed",
      );
    } finally {
      setGlobalUploading(false);
    }
  };

  const removePrescriptionFile = (productId, fileId) => {
    setUploadedPrescriptions((prev) => {
      const currentList = Array.isArray(prev[productId]) ? prev[productId] : [];
      const updatedList = currentList.filter((f) => f.id !== fileId);
      const next = { ...prev };
      if (updatedList.length > 0) {
        next[productId] = updatedList;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const [promoCode, setPromoCode] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [activeStep, setActiveStep] = useState(1); // 1: Contact, 2: Address, 3: Rx (if required) / Payment, 4: Payment (if Rx required)
  const [checkoutBlockedReason, setCheckoutBlockedReason] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [lastIntentAmount, setLastIntentAmount] = useState(null);
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const couponRequestSequence = useRef(0);
  const lastCouponQuoteKey = useRef("");
  const paymentIntentRequestKey = useRef("");

  // Order Success States (declared early to avoid temporal dead zone)
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const checkoutTotals = calculateCheckoutTotals({
    subtotal: checkoutSubtotal,
    cartDiscount: 0,
    shipping: checkoutShippingCost,
    taxRate,
    couponDiscount: promoDiscount,
  });
  const displayTax = checkoutTotals.tax;
  const displayTotal = checkoutTotals.total;
  const couponQuoteKey = `${checkoutTotals.couponValidationSubtotal.toFixed(2)}:${checkoutTotals.cartDiscount.toFixed(2)}`;
  const formattedTaxRate = Number(taxRate || 0)
    .toFixed(2)
    .replace(/\.?0+$/, "");
  const taxLabel = formattedTaxRate
    ? `${taxName} (${formattedTaxRate}%)`
    : taxName;

  useEffect(() => {
    getCouponsApi()
      .then((res) => {
        const couponsData = Array.isArray(res)
          ? res
          : res?.data && Array.isArray(res.data)
            ? res.data
            : res?.items && Array.isArray(res.items)
              ? res.items
              : res?.coupons && Array.isArray(res.coupons)
                ? res.coupons
                : [];
        setCoupons(couponsData);
      })
      .catch((err) => {
        console.error("Failed to fetch coupons on Checkout page:", err);
      });
  }, []);

  const validateAndApplyCoupon = useCallback(
    async (requestedCode, { notify = true } = {}) => {
      const code = requestedCode.trim().toUpperCase();
      if (!code) return false;

      const requestSequence = ++couponRequestSequence.current;

      try {
        const res = await validateCouponApi({
          code,
          subtotal: checkoutTotals.couponValidationSubtotal,
          discount: checkoutTotals.cartDiscount,
        });
        if (requestSequence !== couponRequestSequence.current) return false;

        const couponData = res?.data || res;
        const approvedDiscount = Number(
          couponData?.discountAmount ?? couponData?.discount,
        );
        if (!Number.isFinite(approvedDiscount) || approvedDiscount < 0) {
          throw new Error("Coupon validation returned an invalid discount.");
        }

        const rawValue = Number(
          String(
            couponData?.value ??
              couponData?.discountPercentage ??
              couponData?.discountPercent ??
              0,
          ).replace("%", ""),
        );
        const percentage =
          couponData?.type === "percentage" && Number.isFinite(rawValue)
            ? rawValue
            : 0;

        setPromoDiscount(toMoney(approvedDiscount));
        setDiscountPercent(percentage);
        setAppliedCode(code);
        lastCouponQuoteKey.current = `${code}:${couponQuoteKey}`;
        setClientSecret("");
        setLastIntentAmount(null);

        if (notify) {
          const discountLabel =
            percentage > 0
              ? `${percentage}% discount`
              : `$${toMoney(approvedDiscount).toFixed(2)} discount`;
          showToast.success(`Promo code "${code}" applied: ${discountLabel}!`);
          setPromoCode("");
        }
        return true;
      } catch (err) {
        if (requestSequence !== couponRequestSequence.current) return false;
        console.error("Promo code validation failed on Checkout API:", err);
        setAppliedCode("");
        setDiscountPercent(0);
        setPromoDiscount(0);
        lastCouponQuoteKey.current = "";
        setClientSecret("");
        setLastIntentAmount(null);
        showToast.error(
          notify
            ? err?.message || err || "Invalid promo code."
            : `Coupon "${code}" is no longer valid. Please apply it again.`,
        );
        return false;
      }
    },
    [
      checkoutTotals.cartDiscount,
      checkoutTotals.couponValidationSubtotal,
      couponQuoteKey,
      setAppliedCode,
      setClientSecret,
      setDiscountPercent,
      setLastIntentAmount,
      setPromoDiscount,
      setPromoCode,
    ],
  );

  useEffect(() => {
    const code = appliedCode.trim().toUpperCase();
    if (!code) {
      lastCouponQuoteKey.current = "";
      return;
    }

    const currentQuoteKey = `${code}:${couponQuoteKey}`;
    if (lastCouponQuoteKey.current !== currentQuoteKey) {
      validateAndApplyCoupon(code, { notify: false });
    }
  }, [appliedCode, couponQuoteKey, validateAndApplyCoupon]);

  useEffect(() => {
    if (!cartLoading && !orderComplete && checkoutItems.length === 0) {
      showToast.error("Your cart is empty. Please add items before checkout.");
      navigate("/cart", { replace: true });
    }
  }, [checkoutItems.length, cartLoading, navigate, orderComplete]);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    await validateAndApplyCoupon(promoCode);
  };

  const handleRemovePromo = () => {
    setDiscountPercent(0);
    setPromoDiscount(0);
    setAppliedCode("");
    setClientSecret("");
    setLastIntentAmount(null);
    showToast.success("Promo code removed.");
  };

  // Form States
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactErrors, setContactErrors] = useState({});
  const [contactTouched, setContactTouched] = useState({});
  const [savingContact, setSavingContact] = useState(false);

  // Address States
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Address Form States
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");
  const [newCountry, setNewCountry] = useState("United States");
  const [addressErrors, setAddressErrors] = useState({});
  const [addressTouched, setAddressTouched] = useState({});
  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
  const quotedSubtotal = Number(checkoutQuote?.subtotal ?? checkoutSubtotal);
  const quotedShipping = Number(checkoutQuote?.shipping ?? checkoutTotals.shipping);
  const quotedTax = Number(checkoutQuote?.tax ?? displayTax);
  const quotedTotal = Number(checkoutQuote?.total ?? displayTotal);
  const paymentCartKey = useMemo(
    () =>
      checkoutItems
        .map((item) => {
          const product = item.product || item;
          return [
            product.productId || product.baseProductId || product.id,
            product.variantId || product.selectedVariantId || product.selectedSize?.id || "",
            item.quantity,
            Number(product.sellingPrice || product.price || 0).toFixed(2),
          ].join(":");
        })
        .join("|"),
    [checkoutItems],
  );

  const buildOrderPayload = useCallback(
    (paymentIntentId = null) => ({
      items: checkoutItems.map((item) => {
        const product = item.product || item;
        return {
          productId: product.productId || product.baseProductId || product.id,
          variantId: product.variantId || product.selectedVariantId || product.selectedSize?.id,
          variantLabel: product.variantLabel || product.selectedVariant,
          quantity: item.quantity,
          price: Number(product.sellingPrice || product.price || 0),
          unitPrice: Number(product.sellingPrice || product.price || 0),
          priceAmount: Number(product.sellingPrice || product.price || 0),
          name: product.name || product.title || "",
          title: product.name || product.title || "",
          productName: product.name || product.title || "",
          sku: product.sku,
          image: product.image,
          selectedSize: product.selectedSize,
          selectedColor: product.selectedColor,
          optionLabel: product.optionLabel,
        };
      }),
      prescriptions: Object.entries(uploadedPrescriptions).flatMap(
        ([productId, files]) => {
          const list = Array.isArray(files) ? files : files ? [files] : [];
          return list.map((f) => ({
            productId,
            fileName: f.fileName || f.name,
            url: f.url,
          }));
        },
      ),
      shippingAddress: {
        fullName: selectedAddr?.fullName || fullName,
        phone: selectedAddr?.phone || phone,
        addressLine1: selectedAddr?.addressLine1 || "",
        country: selectedAddr?.country || "India",
      },
      paymentMethod: "stripe",
      stripePaymentIntentId: paymentIntentId,
      email,
      fullName,
      phone,
      subtotal: Number(quotedSubtotal.toFixed(2)),
      tax: Number(quotedTax.toFixed(2)),
      taxAmount: Number(quotedTax.toFixed(2)),
      totalAmount: Number(quotedTotal.toFixed(2)),
      discount: checkoutTotals.cartDiscount,
      promoDiscount: 0,
      couponDiscount: 0,
      shipping: Number(quotedShipping.toFixed(2)),
      shippingCost: Number(quotedShipping.toFixed(2)),
      couponCode: appliedCode || null,
    }),
    [
      appliedCode,
      checkoutItems,
      email,
      fullName,
      phone,
      checkoutTotals.cartDiscount,
      quotedShipping,
      quotedSubtotal,
      quotedTax,
      quotedTotal,
      selectedAddr,
      uploadedPrescriptions,
    ],
  );

  useEffect(() => {
    setClientSecret("");
    setLastIntentAmount(null);
    setCheckoutQuote(null);
    paymentIntentRequestKey.current = "";
  }, [paymentCartKey, appliedCode, promoDiscount, checkoutAutoShipSavings, checkoutShippingCost, taxRate]);

  useEffect(() => {
    if (
      activeStep !== paymentStep ||
      taxLoading ||
      clientSecret ||
      checkoutItems.length === 0 ||
      selectedAddressId === null ||
      selectedAddressId === undefined
    ) {
      return;
    }

    let active = true;

    const currentAmountStr = displayTotal.toFixed(2);
    if (paymentIntentRequestKey.current === currentAmountStr) {
      return;
    }
    paymentIntentRequestKey.current = currentAmountStr;
    setLoadingSecret(true);

    createPaymentIntentApi({
      amount: currentAmountStr,
      currency: "usd",
    })
      .then((intentRes) => ({ intentRes, currentAmountStr }))
      .then((result) => {
        if (!active || !result) return;
        const secret =
          result.intentRes?.data?.clientSecret ||
          result.intentRes?.data?.client_secret ||
          result.intentRes?.clientSecret ||
          result.intentRes?.client_secret;
        if (secret) {
          setClientSecret(secret);
          setLastIntentAmount(result.currentAmountStr);
        } else {
          paymentIntentRequestKey.current = "";
          showToast.error("Failed to load secure payment parameters.");
        }
      })
      .catch((err) => {
        if (!active) return;
        paymentIntentRequestKey.current = "";
        console.error("Failed to initialize quoted payment intent:", err);
        showToast.error(err?.message || err || "Failed to initialize secure payment session.");
      })
      .finally(() => {
        if (active) setLoadingSecret(false);
      });

    return () => {
      active = false;
    };
  }, [
    activeStep,
    paymentStep,
    appliedCode,
    checkoutItems.length,
    clientSecret,
    displayTotal,
    selectedAddressId,
    taxLoading,
  ]);

  const validateContactField = (fieldName, val) => {
    const value = String(val || "");
    let err = "";
    if (fieldName === "fullName") {
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (!value.trim()) {
        err = "Full name is required";
      } else if (value.trim().length < 2) {
        err = "Name must be at least 2 characters long";
      } else if (value.trim().length > 50) {
        err = "Name must be 50 characters or fewer";
      } else if (!nameRegex.test(value.trim())) {
        err = "Name can only contain letters and spaces";
      }
    }
    if (fieldName === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        err = "Email address is required";
      } else if (value.trim().length > 100) {
        err = "Email must be 100 characters or fewer";
      } else if (!emailRegex.test(value.trim())) {
        err = "Please enter a valid email address";
      }
    }
    if (fieldName === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (!value.trim()) {
        err = "Phone number is required";
      } else if (digitsOnly.length !== 10) {
        err = "Phone number must be exactly 10 digits";
      }
    }
    return err;
  };

  const validateContactForm = () => {
    const errs = {
      fullName: validateContactField("fullName", fullName),
      email: validateContactField("email", email),
      phone: validateContactField("phone", phone),
    };
    const activeErrs = {};
    if (errs.fullName) activeErrs.fullName = errs.fullName;
    if (errs.email) activeErrs.email = errs.email;
    if (errs.phone) activeErrs.phone = errs.phone;
    setContactErrors(activeErrs);
    return Object.keys(activeErrs).length === 0;
  };

  const validateAddressField = (fieldName, val) => {
    const value = String(val || "");
    let err = "";
    if (fieldName === "newFullName") {
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (!value.trim()) {
        err = "Full name is required";
      } else if (value.trim().length < 2) {
        err = "Name must be at least 2 characters long";
      } else if (!nameRegex.test(value.trim())) {
        err = "Name can only contain letters and spaces";
      }
    }
    if (fieldName === "newPhone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (!value.trim()) {
        err = "Phone number is required";
      } else if (digitsOnly.length !== 10) {
        err = "Phone number must be exactly 10 digits";
      }
    }
    if (fieldName === "newAddress") {
      if (!value.trim()) {
        err = "Street address is required";
      }
    }
    if (fieldName === "newCountry") {
      if (!value.trim()) {
        err = "Country is required";
      }
    }
    return err;
  };

  const validateAddressForm = () => {
    const errs = {
      newFullName: validateAddressField("newFullName", newFullName),
      newPhone: validateAddressField("newPhone", newPhone),
      newAddress: validateAddressField("newAddress", newAddress),
      newCountry: validateAddressField("newCountry", newCountry),
    };
    const activeErrs = {};
    Object.keys(errs).forEach((key) => {
      if (errs[key]) activeErrs[key] = errs[key];
    });
    setAddressErrors(activeErrs);
    return Object.keys(activeErrs).length === 0;
  };



  // Check for blocked user status on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setCheckoutBlockedReason("");
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
      return;
    }
    const blockedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (blockedReason) {
      setCheckoutBlockedReason(blockedReason);
      showToast.error(blockedReason);
    }
  }, [isLoggedIn]);

  // Reset/Clear checkout states when user explicitly logs out
  useEffect(() => {
    if (authStatus === "guest") {
      setAddresses([]);
      setSelectedAddressId(null);
      setEmail("");
      setFullName("");
      setPhone("");
      setActiveStep(1);
    }
  }, [authStatus]);

  // Autofill user profile details if logged in
  useEffect(() => {
    if (authStatus === "authenticated" && user) {
      setEmail(user.email || "");
      setFullName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [authStatus, user]);

  const ensureCheckoutSession = async (contactData) => {
    if (isLoggedIn) {
      updateSession(contactData);
      return;
    }

    const res = await checkoutContactApi({
      email: contactData.email,
      name: contactData.name,
      phone: contactData.phone,
    });
    const token =
      res?.data?.token ||
      res?.token ||
      res?.data?.accessToken ||
      res?.accessToken;

    if (!token) {
      throw new Error("Checkout session could not be started. Please try again.");
    }

    await login(contactData.email, token, contactData);
  };

  // Load addresses from API if logged in
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await getAddressesApi();
        if (res && res.success && Array.isArray(res.data)) {
          const apiAddresses = res.data.map((addr, idx) => {
            const addrId = addr._id || addr.id || String(idx);
            return {
              id: addrId,
              _id: addr._id || addr.id || addrId,
              fullName:
                addr.fullName || fullName || user?.name || "Customer",
              phone: addr.phone || phone || "",
              addressLine1: addr.addressLine1 || addr.address || "",
              city: addr.city || "",
              state: addr.state || "",
              zip: addr.zip || addr.zipCode || "",
              country: addr.country || "United States",
            };
          });
          if (apiAddresses.length > 0) {
            setAddresses(apiAddresses);
            setSelectedAddressId(apiAddresses[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load addresses:", err);
      }
    };
    if (isLoggedIn) {
      loadAddresses();
    }
  }, [isLoggedIn, fullName, phone, user?.name]);

  const handleEditAddress = (e, addr) => {
    e.stopPropagation();
    const addrId = addr.id || addr._id;
    setEditingAddressId(addrId);
    setNewFullName(addr.fullName || fullName || user?.name || "");
    setNewPhone(addr.phone || phone || "");
    setNewAddress(addr.addressLine1 || addr.street || addr.address || "");
    setNewCity(addr.city || "");
    setNewState(addr.state || "");
    setNewZip(addr.zip || addr.zipCode || "");
    setNewCountry(addr.country || "United States");
    setAddressErrors({});
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (e, addressId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this delivery destination?")) return;
    setDeletingAddressId(addressId);
    try {
      if (isLoggedIn) {
        try {
          await removeAddressApi(addressId);
        } catch (apiErr) {
          console.warn("Primary checkout address delete failed, attempting index fallback:", apiErr);
          const targetIndex = addresses.findIndex(
            (a) => String(a.id) === String(addressId) || String(a._id) === String(addressId)
          );
          if (targetIndex >= 0) {
            await removeAddressApi(targetIndex);
          } else {
            throw apiErr;
          }
        }
      }
      showToast.success("Delivery destination removed successfully!");
      const remaining = addresses.filter(
        (a) => String(a.id) !== String(addressId) && String(a._id) !== String(addressId)
      );
      setAddresses(remaining);
      if (selectedAddressId === addressId) {
        if (remaining.length > 0) {
          setSelectedAddressId(remaining[0].id);
        } else {
          setSelectedAddressId(null);
          setShowAddressForm(true);
        }
      }
    } catch (err) {
      console.error("Failed to remove address:", err);
      showToast.error(err || "Failed to delete address. Please try again.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  // Submit Order handler
  const handleSubmit = async (paymentIntentId) => {
    if (submittingOrder) return false;
    if (isLoggedIn) {
      const blockedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (blockedReason) {
        setCheckoutBlockedReason(blockedReason);
        showToast.error(blockedReason);
        setActiveStep(1);
        return false;
      }
    } else {
      setCheckoutBlockedReason("");
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    }

    if (!checkoutItems.length) {
      showToast.error("Your cart is empty.");
      navigate("/cart");
      return false;
    }
    if (!fullName || !email || !phone) {
      showToast.error("Please fill in contact details first.");
      setActiveStep(1);
      return false;
    }
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      showToast.error("Please select a delivery address.");
      setActiveStep(2);
      return false;
    }
    if (!paymentIntentId) {
      showToast.error("Payment confirmation is missing. Please try again.");
      return false;
    }

    const orderPayload = buildOrderPayload(paymentIntentId);

    setSubmittingOrder(true);
    try {
      const res = await createOrderApi(orderPayload);
      const randomId =
        res?.data?.id ||
        res?.id ||
        "PMD-" +
          Math.floor(100000 + Math.random() * 900000) +
          "-" +
          Math.floor(1000 + Math.random() * 9000);
      setOrderId(randomId);
      setOrderComplete(true);
      showToast.success("Order placed successfully!");
      return true;
    } catch (err) {
      console.error("Order creation failed on API:", err);
      const isBlocked =
        err?.response?.status === 403 ||
        Boolean(err?.response?.data?.isBlocked) ||
        (typeof err === "string" && err.toLowerCase().includes("blocked"));
      const msg = err?.response?.data?.message || (typeof err === "string" ? err : "Order creation failed. Please try again.");
      if (isBlocked) {
        setCheckoutBlockedReason(msg);
        localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, msg);
        showToast.error(msg);
        setActiveStep(1);
      } else {
        showToast.error(msg);
      }
      throw err;
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleFinish = () => {
    if (isBuyNowCheckout) {
      sessionStorage.removeItem("pet_meds_buy_now");
      setBuyNowItem(null);
    } else {
      clearCart();
    }
    navigate("/");
  };

  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 4);
  const formattedDelivery = deliveryDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if ((cartLoading || authStatus === "loading") && !orderComplete) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-linear-to-b from-white via-slate-50/50 to-white">
        <div className="flex flex-col items-center gap-4 text-slate-500 font-semibold text-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-green" />
          Loading checkout details...
        </div>
      </div>
    );
  }

  if (!orderComplete && checkoutItems.length === 0) {
    return null;
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen py-16 flex items-center justify-center relative overflow-hidden bg-linear-to-b from-white via-slate-50/50 to-white">
        {/* Glowing Ambient Light Orbs */}
        <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-primary-green/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-medical-teal/10 blur-[100px] animate-pulse duration-[4000ms]" />

        <div className="mx-auto max-w-[650px] w-full px-4 text-center">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white/80 backdrop-blur-md p-8 sm:p-12 shadow-lg relative overflow-hidden">
            {/* Holographic success checkmark */}
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-primary-green/20 text-primary-green shadow-xs mb-8 animate-bounce">
              <CheckCircle className="h-10 w-10 stroke-[2.5]" />
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-deep-navy tracking-tight">
              Order Placed!
            </h1>
            <p className="mt-3 text-slate-500 font-semibold text-sm sm:text-base">
              Your prescription request has been successfully submitted.
            </p>

            {/* Custom Auto-Account Creation Panel (Required by User) */}
            <div className="mt-8 p-6 rounded-3xl bg-linear-to-br from-soft-mint/70 via-white/80 to-light-blue/50 border border-emerald-200/50 text-left space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-dark-green flex items-center justify-center border border-emerald-200 shrink-0">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-deep-navy uppercase tracking-wider">
                    Account Created Automatically
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">
                    Registration Complete
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                An account has been created automatically using your email (
                <strong className="text-deep-navy">{email}</strong>) and phone
                number (<strong className="text-deep-navy">{phone}</strong>).
              </p>

              <div className="flex items-start gap-2.5 bg-white/85 p-3 rounded-2xl border border-slate-100">
                <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-slate-500">
                  To log into your new dashboard, simply use the OTP sent to
                  your contact details. From there, you can manage refills and
                  track this order in real time.
                </p>
              </div>
            </div>

            {/* Order Reference Card */}
            <div className="mt-6 p-6 rounded-3xl bg-slate-50/60 border border-slate-100 text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-3.5 gap-1.5">
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Order Reference
                  </span>
                  <span className="text-sm font-extrabold text-deep-navy tracking-tight">
                    {orderId}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider sm:text-right">
                    Estimated Delivery
                  </span>
                  <span className="text-sm font-extrabold text-primary-green tracking-tight sm:text-right block">
                    {formattedDelivery}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="py-2">
                <div className="flex justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
                  <span className="text-primary-green flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Placed
                  </span>
                  <span>Vet Approved</span>
                  <span>In Transit</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-primary-green rounded-full" />
                </div>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="mt-10 w-full h-14 rounded-full bg-linear-to-br from-primary-green to-dark-green text-white font-extrabold text-base tracking-wide transition-all shadow-[0_12px_24px_rgba(88,185,71,0.2)] hover:shadow-[0_16px_32px_rgba(88,185,71,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              Continue Shopping
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 lg:py-20 relative bg-linear-to-b from-white via-slate-50/50 to-white w-full max-w-full overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 h-[500px] w-[500px] rounded-full bg-primary-green/5 blur-[130px]" />
        <div className="absolute bottom-40 left-10 h-[400px] w-[400px] rounded-full bg-medical-teal/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
        {/* Stepper Progress bar */}
        <div className="mb-8 sm:mb-14 max-w-3xl mx-auto px-1 sm:px-0">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-4 sm:top-5 md:top-6 -translate-y-1/2 w-full h-[2px] bg-slate-200" />
            <div
              className="absolute left-0 top-4 sm:top-5 md:top-6 -translate-y-1/2 h-[2px] bg-primary-green transition-all duration-500"
              style={{
                width: orderComplete
                  ? "100%"
                  : !hasPrescriptionProduct
                    ? activeStep >= 3
                      ? "100%"
                      : activeStep >= 2
                        ? "50%"
                        : "0%"
                    : activeStep >= 4
                      ? "100%"
                      : activeStep === 3
                        ? "66.66%"
                        : activeStep === 2
                          ? "33.33%"
                          : "0%",
              }}
            />

            {/* Step 1: Cart */}
            <div className="relative z-10 flex flex-col items-center min-w-0">
              <span className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary-green text-white font-bold text-xs sm:text-sm md:text-base border-2 sm:border-4 border-white shadow-md shrink-0">
                ✓
              </span>
              <span className="mt-1.5 sm:mt-2.5 text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight sm:tracking-wider text-center max-w-[65px] sm:max-w-none leading-tight">
                Shopping Cart
              </span>
            </div>

            {/* Step 2: Shipping & Verification */}
            <div className="relative z-10 flex flex-col items-center min-w-0">
              <span
                className={`flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full font-bold text-xs sm:text-sm md:text-base border-2 sm:border-4 border-white shadow-md transition-all shrink-0 ${
                  activeStep > 2 || (activeStep >= 2 && !hasPrescriptionProduct && orderComplete)
                    ? "bg-primary-green text-white"
                    : activeStep <= 2
                      ? "bg-primary-green text-white ring-2 ring-primary-green/25"
                      : "bg-white text-slate-400 border-slate-200"
                }`}
              >
                {activeStep > 2 ? "✓" : "2"}
              </span>
              <span
                className={`mt-1.5 sm:mt-2.5 text-[9px] sm:text-xs uppercase tracking-tight sm:tracking-wider text-center max-w-[70px] sm:max-w-none leading-tight ${
                  activeStep <= 2 || (!hasPrescriptionProduct && activeStep <= 3)
                    ? "font-extrabold text-primary-green"
                    : "font-bold text-slate-400"
                }`}
              >
                Shipping & Verification
              </span>
            </div>

            {/* Step 3 (if hasPrescriptionProduct): Upload Prescription */}
            {hasPrescriptionProduct && (
              <div className="relative z-10 flex flex-col items-center min-w-0">
                <span
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full font-bold text-xs sm:text-sm md:text-base border-2 sm:border-4 border-white shadow-md transition-all shrink-0 ${
                    activeStep > 3
                      ? "bg-primary-green text-white"
                      : activeStep === 3
                        ? "bg-primary-green text-white ring-2 ring-primary-green/25"
                        : "bg-white text-slate-400 border-slate-200 shadow-xs"
                  }`}
                >
                  {activeStep > 3 ? "✓" : "3"}
                </span>
                <span
                  className={`mt-1.5 sm:mt-2.5 text-[9px] sm:text-xs uppercase tracking-tight sm:tracking-wider text-center max-w-[70px] sm:max-w-none leading-tight ${
                    activeStep === 3
                      ? "font-extrabold text-primary-green"
                      : "font-bold text-slate-400"
                  }`}
                >
                  Upload Prescription
                </span>
              </div>
            )}

            {/* Final Step: Confirmation */}
            <div className="relative z-10 flex flex-col items-center min-w-0">
              <span
                className={`flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 items-center justify-center rounded-full font-bold text-xs sm:text-sm md:text-base border-2 sm:border-4 border-white shadow-md transition-all shrink-0 ${
                  orderComplete
                    ? "bg-primary-green text-white"
                    : "bg-white text-slate-400 border-slate-200 shadow-xs"
                }`}
              >
                {orderComplete ? "✓" : hasPrescriptionProduct ? "4" : "3"}
              </span>
              <span
                className={`mt-1.5 sm:mt-2.5 text-[9px] sm:text-xs uppercase tracking-tight sm:tracking-wider text-center max-w-[65px] sm:max-w-none leading-tight ${
                  orderComplete
                    ? "font-extrabold text-primary-green"
                    : "font-bold text-slate-400"
                }`}
              >
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* Back navigation */}
        <div className="mb-6 flex justify-start">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-green transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back to Shopping Cart
          </Link>
        </div>

        {/* ── Grid Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ──── LEFT: User Info & Verification Fields (8-span) ──── */}
          <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
            {hasVetRestriction && (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm text-left">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold uppercase tracking-wider text-amber-800 text-xs">
                      Verified Veterinarian Required
                    </h4>
                    <p className="font-semibold text-amber-700 mt-0.5 text-xs">
                      Your order contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(user ? "/profile?tab=vet-verification" : "/login")}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Apply for Verification
                </button>
              </div>
            )}

            {/* Step 1: Contact Verification */}
            <div
              className={`rounded-[2rem] border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-xs text-left transition-all duration-300 ${activeStep === 1 ? "ring-2 ring-primary-green/20 border-primary-green/30" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-primary-green border border-primary-green/10">
                    <Smartphone className="h-4.5 w-4.5" />
                  </span>
                  Contact Verification
                </h2>

                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-primary-green transition-colors flex items-center gap-1 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-3xs"
                  >
                    <Edit2 className="h-3 w-3" />
                    Change Details
                  </button>
                )}
              </div>

              {activeStep === 1 ? (
                <div className="mt-6">
                  {checkoutBlockedReason && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-left shadow-xs">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl bg-red-100 p-2 text-red-600 shrink-0">
                          <AlertCircle className="h-5 w-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-red-900">Account Blocked</h4>
                          <p className="mt-1 text-xs font-bold text-red-700">{checkoutBlockedReason}</p>
                          <p className="mt-1 text-[11px] font-semibold text-red-600">
                            Please contact customer support to resolve this issue.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-sans">
                    {/* Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Jane Doe"
                        maxLength={50}
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (contactTouched.fullName) {
                            const err = validateContactField("fullName", e.target.value);
                            setContactErrors((prev) => ({ ...prev, fullName: err }));
                          }
                        }}
                        onBlur={(e) => {
                          setContactTouched((prev) => ({ ...prev, fullName: true }));
                          const err = validateContactField("fullName", e.target.value);
                          setContactErrors((prev) => ({ ...prev, fullName: err }));
                        }}
                        className={`w-full h-12 px-4 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                          contactTouched.fullName && contactErrors.fullName
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 text-red-900"
                            : "border-slate-200 focus:border-primary-green/50 text-deep-navy bg-white"
                        }`}
                      />
                      {contactTouched.fullName && contactErrors.fullName && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {contactErrors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. parent@pets.com"
                        maxLength={100}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (checkoutBlockedReason) setCheckoutBlockedReason("");
                          if (contactTouched.email) {
                            const err = validateContactField("email", e.target.value);
                            setContactErrors((prev) => ({ ...prev, email: err }));
                          }
                        }}
                        onBlur={(e) => {
                          setContactTouched((prev) => ({ ...prev, email: true }));
                          const err = validateContactField("email", e.target.value);
                          setContactErrors((prev) => ({ ...prev, email: err }));
                        }}
                        className={`w-full h-12 px-4 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                          contactTouched.email && contactErrors.email
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 text-red-900"
                            : "border-slate-200 focus:border-primary-green/50 text-deep-navy bg-white"
                        }`}
                      />
                      {contactTouched.email && contactErrors.email && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {contactErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (contactTouched.phone) {
                            const err = validateContactField("phone", e.target.value);
                            setContactErrors((prev) => ({ ...prev, phone: err }));
                          }
                        }}
                        onBlur={(e) => {
                          setContactTouched((prev) => ({ ...prev, phone: true }));
                          const err = validateContactField("phone", e.target.value);
                          setContactErrors((prev) => ({ ...prev, phone: err }));
                        }}
                        className={`w-full h-12 px-4 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                          contactTouched.phone && contactErrors.phone
                            ? "border-red-500 bg-red-50/20 focus:border-red-500 text-red-900"
                            : "border-slate-200 focus:border-primary-green/50 text-deep-navy bg-white"
                        }`}
                      />
                      {contactTouched.phone && contactErrors.phone && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {contactErrors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        setContactTouched({ fullName: true, email: true, phone: true });
                        if (!validateContactForm()) {
                          showToast.error("Please fix the errors in contact details.");
                          return;
                        }

                        if (checkoutBlockedReason) setCheckoutBlockedReason("");

                        try {
                          await checkoutContact({ name: fullName, email, phone });

                          setCheckoutBlockedReason("");
                          localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
                          setActiveStep(2);
                          showToast.success("Contact details saved!");
                        } catch (err) {
                          console.error("Checkout contact verification error:", err);
                          const rawMsg = (err?.response?.data?.message || err?.message || (typeof err === "string" ? err : "")).toLowerCase();
                          const isBlocked =
                            Boolean(err?.response?.data?.isBlocked) ||
                            rawMsg.includes("blocked") ||
                            rawMsg.includes("deactivated") ||
                            rawMsg.includes("suspended");
                          const msg =
                            err?.response?.data?.message ||
                            (typeof err === "string" ? err : "Your account has been blocked. Please contact support.");
                          if (isBlocked) {
                            setCheckoutBlockedReason(msg);
                            localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, msg);
                            showToast.error(msg);
                          } else {
                            showToast.error(msg || "Failed to verify contact details.");
                          }
                        }
                      }}
                      className="h-12 px-6 rounded-xl bg-deep-navy hover:bg-primary-green text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      Save & Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 flex items-center justify-between text-left font-sans animate-fade-in">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary-green shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-deep-navy">
                        {fullName}
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {email} • {phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Address */}
            <div
              className={`rounded-[2rem] border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-xs text-left transition-all duration-300 ${activeStep === 2 ? "ring-2 ring-primary-green/20 border-primary-green/30" : ""} ${activeStep < 2 ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-primary-green border border-primary-green/10">
                    <MapPin className="h-4.5 w-4.5" />
                  </span>
                  Delivery Address
                </h2>

                {activeStep > 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep(2);
                      setShowAddressForm(false);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-primary-green transition-colors flex items-center gap-1 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-3xs"
                  >
                    <Edit2 className="h-3 w-3" />
                    Change Address
                  </button>
                )}
              </div>

              {activeStep === 2 && (
                <div className="mt-6 space-y-5 font-sans animate-fade-in">
                  {!showAddressForm ? (
                    <>
                      {/* Address List Selection */}
                      {addresses.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 mb-4">
                          <p className="text-sm font-semibold text-slate-500 mb-4">
                            No saved addresses found.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-deep-navy hover:bg-primary-green text-white rounded-xl text-xs font-extrabold transition-all shadow-3xs cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            Add New Address
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {addresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div
                                key={addr.id}
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 text-left relative overflow-hidden ${
                                  isSelected
                                    ? "border-primary-green bg-soft-mint/40 shadow-sm"
                                    : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                              >
                                <div className="mt-1 shrink-0">
                                  <div
                                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isSelected
                                        ? "border-primary-green bg-white"
                                        : "border-slate-300"
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="h-2.5 w-2.5 rounded-full bg-primary-green" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-extrabold text-deep-navy truncate">
                                      {addr.fullName}
                                    </h4>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={(e) => handleEditAddress(e, addr)}
                                        title="Edit delivery destination"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-green hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer shrink-0"
                                        aria-label="Edit address"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteAddress(e, addr.id)}
                                        disabled={deletingAddressId === addr.id}
                                        title="Delete delivery destination"
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                        aria-label="Delete address"
                                      >
                                        {deletingAddressId === addr.id ? (
                                          <RefreshCw className="w-4 h-4 text-rose-500 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-500 mt-1">
                                    {addr.phone}
                                  </p>
                                  <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                                    {addr.addressLine1}
                                  </p>
                                  <p className="text-xs font-bold text-deep-navy mt-0.5 uppercase tracking-wide">
                                    {addr.country}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAddressId(null);
                            setNewFullName(fullName || user?.name || "");
                            setNewPhone(phone || "");
                            setNewAddress("");
                            setNewCity("");
                            setNewState("");
                            setNewZip("");
                            setNewCountry("United States");
                            setAddressErrors({});
                            setShowAddressForm(true);
                          }}
                          className="w-full py-4 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 hover:border-primary-green hover:bg-slate-50/50 transition-all text-sm font-bold text-deep-navy cursor-pointer"
                        >
                          <Plus className="h-4 w-4 text-slate-400" />
                          Add New Address
                        </button>
                      )}

                      {/* Proceed to Next Step Button */}
                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedAddressId === null || selectedAddressId === undefined) {
                              showToast.error(
                                "Please select a delivery address.",
                              );
                              return;
                            }
                            setActiveStep(3);
                            if (hasPrescriptionProduct) {
                              showToast.success("Address confirmed! Please upload prescription.");
                            } else {
                              showToast.success("Shipping address confirmed!");
                            }
                          }}
                          className="h-12 px-6 rounded-xl bg-deep-navy hover:bg-primary-green text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                        >
                          {hasPrescriptionProduct
                            ? "Proceed to Upload Prescription"
                            : "Proceed to Payment"}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    /* Add/Edit Address Form */
                    <div className="p-5 border border-slate-100 rounded-3xl bg-slate-50/50 space-y-4 text-left">
                      <h3 className="text-sm font-extrabold text-deep-navy uppercase tracking-wider border-b border-slate-200/60 pb-2">
                        {editingAddressId ? "Edit Delivery Address" : "Add New Address"}
                      </h3>
                      <div className="space-y-4 font-sans">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-bold text-deep-navy uppercase tracking-wider">
                                Full Name *
                              </label>
                              <span className="text-[10px] text-slate-400 font-semibold">Min 2, Max 50 chars</span>
                            </div>
                            <input
                              type="text"
                              minLength={2}
                              maxLength={50}
                              placeholder="John Smith"
                              value={newFullName}
                              onChange={(e) => setNewFullName(e.target.value)}
                              className={`w-full h-11 px-4 rounded-xl border bg-white outline-none text-sm font-semibold transition-colors placeholder:text-slate-400 ${
                                newFullName.trim().length > 0 &&
                                (newFullName.trim().length < 2 || newFullName.trim().length > 50)
                                  ? "border-red-500 bg-red-50/20 text-red-900"
                                  : "border-slate-200 focus:border-primary-green/50 text-deep-navy"
                              }`}
                            />
                            {newFullName.trim().length > 0 &&
                              (newFullName.trim().length < 2 || newFullName.trim().length > 50) && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  Full name must be 2 to 50 characters.
                                </p>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-bold text-deep-navy uppercase tracking-wider">
                                Phone Number *
                              </label>
                              <span className="text-[10px] text-slate-400 font-semibold">Exact 10 digits</span>
                            </div>
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="10 digit phone number"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              className={`w-full h-11 px-4 rounded-xl border bg-white outline-none text-sm font-semibold transition-colors placeholder:text-slate-400 ${
                                newPhone.trim().length > 0 &&
                                newPhone.replace(/\D/g, "").length !== 10
                                  ? "border-red-500 bg-red-50/20 text-red-900"
                                  : "border-slate-200 focus:border-primary-green/50 text-deep-navy"
                              }`}
                            />
                            {newPhone.trim().length > 0 &&
                              newPhone.replace(/\D/g, "").length !== 10 && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  Phone number must be exactly 10 digits.
                                </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-deep-navy uppercase tracking-wider">
                              Street Address *
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">Min 5, Max 100 chars</span>
                          </div>
                          <input
                            type="text"
                            minLength={5}
                            maxLength={100}
                            placeholder="Street Address, P.O. box, apt"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            className={`w-full h-11 px-4 rounded-xl border bg-white outline-none text-sm font-semibold transition-colors placeholder:text-slate-400 ${
                              newAddress.trim().length > 0 &&
                              (newAddress.trim().length < 5 || newAddress.trim().length > 100)
                                ? "border-red-500 bg-red-50/20 text-red-900"
                                : "border-slate-200 focus:border-primary-green/50 text-deep-navy"
                            }`}
                          />
                          {newAddress.trim().length > 0 &&
                            (newAddress.trim().length < 5 || newAddress.trim().length > 100) && (
                              <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                Address must be between 5 and 100 characters.
                              </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-bold text-deep-navy uppercase tracking-wider">
                                City *
                              </label>
                              <span className="text-[10px] text-slate-400 font-semibold">Min 2, Max 50 chars</span>
                            </div>
                            <input
                              type="text"
                              minLength={2}
                              maxLength={50}
                              placeholder="e.g. Austin"
                              value={newCity}
                              onChange={(e) => setNewCity(e.target.value)}
                              className={`w-full h-11 px-4 rounded-xl border bg-white outline-none text-sm font-semibold transition-colors placeholder:text-slate-400 ${
                                newCity.trim().length > 0 &&
                                (newCity.trim().length < 2 || newCity.trim().length > 50)
                                  ? "border-red-500 bg-red-50/20 text-red-900"
                                  : "border-slate-200 focus:border-primary-green/50 text-deep-navy"
                              }`}
                            />
                            {newCity.trim().length > 0 &&
                              (newCity.trim().length < 2 || newCity.trim().length > 50) && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  City must be between 2 and 50 characters.
                                </p>
                            )}
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-bold text-deep-navy uppercase tracking-wider">
                                State / Province *
                              </label>
                              <span className="text-[10px] text-slate-400 font-semibold">Min 2, Max 50 chars</span>
                            </div>
                            <input
                              type="text"
                              minLength={2}
                              maxLength={50}
                              placeholder="e.g. TX"
                              value={newState}
                              onChange={(e) => setNewState(e.target.value)}
                              className={`w-full h-11 px-4 rounded-xl border bg-white outline-none text-sm font-semibold transition-colors placeholder:text-slate-400 ${
                                newState.trim().length > 0 &&
                                (newState.trim().length < 2 || newState.trim().length > 50)
                                  ? "border-red-500 bg-red-50/20 text-red-900"
                                  : "border-slate-200 focus:border-primary-green/50 text-deep-navy"
                              }`}
                            />
                            {newState.trim().length > 0 &&
                              (newState.trim().length < 2 || newState.trim().length > 50) && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  State must be between 2 and 50 characters.
                                </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-bold text-deep-navy uppercase tracking-wider">
                                ZIP / Postal Code *
                              </label>
                              <span className="text-[10px] text-slate-400 font-semibold">Min 3, Max 10 chars</span>
                            </div>
                            <input
                              type="text"
                              minLength={3}
                              maxLength={10}
                              placeholder="e.g. 78701"
                              value={newZip}
                              onChange={(e) => setNewZip(e.target.value)}
                              className={`w-full h-11 px-4 rounded-xl border bg-white outline-none text-sm font-semibold transition-colors placeholder:text-slate-400 ${
                                newZip.trim().length > 0 &&
                                (newZip.trim().length < 3 || newZip.trim().length > 10)
                                  ? "border-red-500 bg-red-50/20 text-red-900"
                                  : "border-slate-200 focus:border-primary-green/50 text-deep-navy"
                              }`}
                            />
                            {newZip.trim().length > 0 &&
                              (newZip.trim().length < 3 || newZip.trim().length > 10) && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  ZIP code must be between 3 and 10 characters.
                                </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-deep-navy uppercase tracking-wider mb-1">
                              Country *
                            </label>
                            <CountryDropdown
                              value={newCountry || "United States"}
                              dropUp={true}
                              onChange={(c) => setNewCountry(c)}
                              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white outline-none text-sm font-semibold transition-colors text-deep-navy flex items-center justify-between cursor-pointer select-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3.5 pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const name = String(newFullName || "").trim();
                            const phoneDigits = String(newPhone || "").replace(/\D/g, "");
                            const addr = String(newAddress || "").trim();
                            const city = String(newCity || "").trim();
                            const state = String(newState || "").trim();
                            const zip = String(newZip || "").trim();

                            if (name.length < 2 || name.length > 50) {
                              showToast.error("Please enter a valid full name (2 to 50 characters).");
                              return;
                            }
                            if (!newPhone || phoneDigits.length !== 10) {
                              showToast.error("Please enter a valid 10-digit phone number.");
                              return;
                            }
                            if (addr.length < 5 || addr.length > 100) {
                              showToast.error("Please enter a valid street address (5 to 100 characters).");
                              return;
                            }
                            if (city.length < 2 || city.length > 50) {
                              showToast.error("Please enter a valid city name (2 to 50 characters).");
                              return;
                            }
                            if (state.length < 2 || state.length > 50) {
                              showToast.error("Please enter a valid state/province (2 to 50 characters).");
                              return;
                            }
                            if (zip.length < 3 || zip.length > 10) {
                              showToast.error("Please enter a valid ZIP/Postal code (3 to 10 characters).");
                              return;
                            }

                            const newAddrObj = {
                              fullName: name,
                              phone: newPhone,
                              addressLine1: addr,
                              city,
                              state,
                              zip,
                              country: newCountry || "United States",
                              type: "HOME",
                            };

                            if (isLoggedIn) {
                              try {
                                if (editingAddressId) {
                                  await updateAddressApi(editingAddressId, newAddrObj);
                                } else {
                                  await addAddressApi(newAddrObj);
                                }
                                const res = await getAddressesApi();
                                if (
                                  res &&
                                  res.success &&
                                  Array.isArray(res.data)
                                ) {
                                  const apiAddresses = res.data.map(
                                    (a, idx) => {
                                      const addrId = a._id || a.id || String(idx);
                                      return {
                                        id: addrId,
                                        _id: a._id || a.id || addrId,
                                        fullName: a.fullName || defaultName,
                                        phone: a.phone || defaultPhone,
                                        addressLine1: a.addressLine1 || addr,
                                        city: a.city || "",
                                        state: a.state || "",
                                        zip: a.zip || a.zipCode || "",
                                        country: a.country || newCountry || "United States",
                                      };
                                    },
                                  );
                                  setAddresses(apiAddresses);
                                  if (editingAddressId) {
                                    setSelectedAddressId(editingAddressId);
                                  } else if (apiAddresses.length > 0) {
                                    setSelectedAddressId(
                                      apiAddresses[apiAddresses.length - 1].id,
                                    );
                                  }
                                }
                              } catch (err) {
                                console.error(
                                  "Failed to save address to backend API:",
                                  err,
                                );
                              }
                            } else {
                              if (editingAddressId) {
                                setAddresses(
                                  addresses.map((a) =>
                                    String(a.id) === String(editingAddressId) || String(a._id) === String(editingAddressId)
                                      ? {
                                          ...a,
                                          fullName: defaultName,
                                          phone: defaultPhone,
                                          addressLine1: addr,
                                          city,
                                          state,
                                          zip,
                                          country: newCountry || "United States",
                                        }
                                      : a
                                  )
                                );
                              } else {
                                const newId = Date.now();
                                const newAddr = {
                                  id: newId,
                                  fullName: defaultName,
                                  phone: defaultPhone,
                                  addressLine1: addr,
                                  city,
                                  state,
                                  zip,
                                  country: newCountry || "United States",
                                };
                                setAddresses([...addresses, newAddr]);
                                setSelectedAddressId(newId);
                              }
                            }
                            const wasEditing = Boolean(editingAddressId);
                            setShowAddressForm(false);
                            setEditingAddressId(null);

                            // Reset form fields
                            setNewFullName("");
                            setNewPhone("");
                            setNewAddress("");
                            setNewCity("");
                            setNewState("");
                            setNewZip("");
                            setNewCountry("United States");
                            showToast.success(wasEditing ? "Delivery destination updated successfully!" : "Address added and selected!");
                          }}
                          className="h-11 px-6 rounded-xl bg-deep-navy hover:bg-primary-green text-white font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                        >
                          {editingAddressId ? "Update Address" : "Save Address"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddressId(null);
                            setNewFullName("");
                            setNewPhone("");
                            setNewAddress("");
                            setNewCity("");
                            setNewState("");
                            setNewZip("");
                            setNewCountry("United States");
                          }}
                          className="h-11 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeStep > 2 && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 flex items-center justify-between text-left font-sans animate-fade-in">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary-green shrink-0" />
                    <div>
                      {(() => {
                        const addr = addresses.find(
                          (a) => a.id === selectedAddressId,
                        );
                        if (addr) {
                          return (
                            <>
                              <p className="text-sm font-bold text-deep-navy">
                                {addr.fullName} • {addr.phone}
                              </p>
                              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                {addr.addressLine1}, {addr.country}
                              </p>
                            </>
                          );
                        }
                        return (
                          <p className="text-sm font-bold text-deep-navy">
                            No address selected
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 (Conditional): Upload Prescription */}
            {hasPrescriptionProduct && (
              <div
                className={`rounded-[2rem] border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-xs text-left transition-all duration-300 ${
                  activeStep === 3
                    ? "ring-2 ring-primary-green/20 border-primary-green/30"
                    : ""
                } ${activeStep < 3 ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-primary-green border border-primary-green/10">
                      <FileText className="h-4.5 w-4.5" />
                    </span>
                    Upload Prescription
                  </h2>

                  {activeStep > 3 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="text-xs font-bold text-slate-500 hover:text-primary-green transition-colors flex items-center gap-1 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-3xs"
                    >
                      <Edit2 className="h-3 w-3" />
                      Change Prescription
                    </button>
                  )}
                </div>

                {activeStep === 3 ? (
                  <div className="mt-6 space-y-6 font-sans animate-fade-in">
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed">
                      The item(s) below require a valid veterinarian prescription under pharmacy safety regulations. Please upload a clear photo or document (.pdf, .jpg, .png) of the prescription.
                    </p>

                    {/* Option to Upload Single or Multiple Prescription Files for All Items */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <Paperclip className="h-5 w-5 text-primary-green shrink-0 mt-0.5 sm:mt-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-deep-navy leading-snug">
                            Upload Prescription File(s) for All Items
                          </p>
                          <p className="text-[11px] font-semibold text-slate-400 leading-snug mt-0.5">
                            Select one or multiple files/images to apply to all items
                          </p>
                        </div>
                      </div>
                      <label className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-emerald-50 border border-primary-green/30 text-primary-green hover:text-dark-green rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-3xs">
                        {globalUploading ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="h-3.5 w-3.5" />
                        )}
                        {globalUploading ? "Uploading..." : "Upload Master Rx File(s)"}
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleGlobalPrescriptionFilesUpload(e.target.files);
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    {/* Product Specific Upload Cards */}
                    <div className="space-y-4">
                      {prescriptionItems.map((item) => {
                        const product = item.product || item;
                        const productId = product.id || product._id || product.sku || item.id;
                        const fileList = Array.isArray(uploadedPrescriptions[productId])
                          ? uploadedPrescriptions[productId]
                          : uploadedPrescriptions[productId]
                            ? [uploadedPrescriptions[productId]]
                            : [];
                        const isUploading = uploadingMap[productId];

                        return (
                          <div
                            key={productId}
                            className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-3xs text-left overflow-hidden"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <h4 className="text-xs sm:text-sm font-extrabold text-deep-navy break-words min-w-0 leading-snug">
                                      {product.name}
                                    </h4>
                                    <span className="shrink-0 inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold bg-amber-50 text-amber-600 border border-amber-200/60 px-2 py-0.5 rounded-full">
                                      Rx Required
                                    </span>
                                  </div>
                                  <p className="text-[11px] sm:text-xs font-semibold text-slate-400 mt-0.5">
                                    Qty: {item.quantity} • ${(Number(product.sellingPrice || product.price || 0)).toFixed(2)} each
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 w-full sm:w-auto">
                                <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-deep-navy hover:bg-primary-green text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-3xs">
                                  {isUploading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                  ) : (
                                    <UploadCloud className="h-4 w-4" />
                                  )}
                                  {isUploading
                                    ? "Uploading..."
                                    : fileList.length > 0
                                      ? "Add More Files"
                                      : "Upload Rx File(s)"}
                                  <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files.length > 0) {
                                        handlePrescriptionFilesUpload(productId, e.target.files);
                                      }
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* List of Uploaded Files for this Product */}
                            {fileList.length > 0 && (
                              <div className="pt-3 border-t border-slate-100 space-y-2">
                                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                  Uploaded Files ({fileList.length}):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {fileList.map((f, idx) => (
                                    <div
                                      key={f.id || idx}
                                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs font-bold text-deep-navy min-w-0"
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <FileCheck className="h-4 w-4 text-primary-green shrink-0" />
                                        <span className="truncate flex-1 min-w-0">
                                          {f.fileName || f.name}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removePrescriptionFile(productId, f.id)}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors shrink-0 cursor-pointer"
                                        title="Remove file"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Continue to Payment Button */}
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const totalFiles = Object.values(uploadedPrescriptions).flat().length;
                          if (totalFiles === 0) {
                            showToast.error("Please upload at least one prescription file before proceeding.");
                            return;
                          }
                          setActiveStep(4);
                          showToast.success("Prescription details confirmed!");
                        }}
                        className="h-12 px-6 rounded-xl bg-deep-navy hover:bg-primary-green text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        Proceed to Payment
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 flex items-center justify-between text-left font-sans animate-fade-in">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-primary-green shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-deep-navy">
                          Prescription Attached
                        </p>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {Object.values(uploadedPrescriptions).flat().length} file(s) uploaded for prescription verification
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method */}
            <div
              className={`rounded-[2rem] border border-slate-200 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-xs text-left transition-all duration-300 ${activeStep === paymentStep ? "ring-2 ring-primary-green/20 border-primary-green/30" : ""} ${activeStep < paymentStep ? "opacity-50 pointer-events-none" : ""}`}
            >
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-500/10">
                  <CreditCard className="h-4.5 w-4.5" />
                </span>
                Payment Method
              </h2>

              {activeStep === paymentStep && (
                <div className="mt-6 space-y-6 font-sans animate-fade-in">
                  {/* Payment option card */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-primary-green bg-soft-mint/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer mb-2">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="shrink-0">
                        <div className="h-5 w-5 rounded-full border-2 border-primary-green bg-white flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary-green" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-deep-navy">
                          Pay Securely with Card
                        </h4>
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                          Stripe Credit / Debit Card Payment
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-white/80 p-1.5 rounded-lg border border-slate-100 self-start sm:self-auto">
                      {/* Visa */}
                      <svg className="h-4 w-auto" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.2 13.5l1.6-6.2h-1.5L8.7 13.5h1.5zm8.9-6.2c-.4-.2-1.1-.4-1.9-.4-2.1 0-3.6 1.1-3.6 2.7 0 1.2 1 1.8 1.9 2.2.9.4 1.1.7 1.1 1.1 0 .6-.7.8-1.3.8-1.1 0-1.7-.3-2.2-.6l-.3 2.1c.6.3 1.5.5 2.6.5 2.2 0 3.7-1.1 3.7-2.9 0-1.9-2.6-2-2.6-2.9 0-.3.3-.6.9-.6.3 0 1 .1 1.9.4l.3-2.1zm3.9 0h-1.5c-.4 0-.8.3-.9.6L18.4 13.5h1.5l.3-.9h1.9l.2.9h1.3l-1.2-6.2zm-1.6 4.1l.6-1.9.3 1.9H21.4zm-14-4.1L5.1 13.5H6.5l2.1-6.2H7.4z" fill="#0E4595" />
                        <path d="M5.1 7.3H1.5L1 8.5C1.8 8.7 2.9 9.1 3.7 9.5l1.4-2.2z" fill="#F7B600" />
                      </svg>
                      {/* Mastercard */}
                      <svg className="h-4 w-auto" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="7.5" r="6.5" fill="#EB001B" fillOpacity="0.8" />
                        <circle cx="16" cy="7.5" r="6.5" fill="#F79E1B" fillOpacity="0.8" />
                      </svg>
                      {/* Amex */}
                      <svg className="h-4 w-auto" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="15" rx="2" fill="#0070D2" />
                        <text x="3" y="10.5" fill="white" fontSize="6.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.2">AMEX</text>
                      </svg>
                      {/* Discover */}
                      <svg className="h-4 w-auto" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="15" rx="2" fill="#F47A20" />
                        <text x="1.5" y="10" fill="white" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">DISC</text>
                      </svg>
                    </div>
                  </div>

                  {loadingSecret ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-500 font-semibold text-sm">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary-green" />
                      Initializing secure payment form...
                    </div>
                  ) : clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "stripe",
                          variables: {
                            colorPrimary: "#58B947",
                            colorBackground: "#ffffff",
                            colorText: "#0f2d52",
                            colorDanger: "#ef4444",
                            fontFamily: "Inter, sans-serif",
                            spacingUnit: "4px",
                            borderRadius: "16px",
                          },
                        },
                      }}
                    >
                      <StripePaymentForm
                        handleSubmitOrder={handleSubmit}
                        totalAmount={quotedTotal}
                        resetPaymentSession={() => {
                          setClientSecret("");
                          setLastIntentAmount(null);
                        }}
                      />
                    </Elements>
                  ) : (
                    <div className="text-center py-8 text-rose-500 font-semibold text-sm">
                      Failed to initialize secure payment. Please refresh or try again.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ──── RIGHT: Order Summary (4-span) ──── */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 order-1 lg:order-2">
            <div className="rounded-[2.2rem] border border-slate-200 bg-white/80 backdrop-blur-md p-6 sm:p-8 shadow-sm text-left">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight border-b border-slate-100 pb-4">
                Your Order
              </h2>

              {/* Item thumbnails */}
              <div className="max-h-[160px] overflow-y-auto scrollbar-none my-5 divide-y divide-slate-100">
                {checkoutItems.map((item) => {
                  const product = item.product || item;
                  const unitPrice = Number(product.sellingPrice || product.price || 0);
                  return (
                  <div key={product.id} className="py-2.5 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1 overflow-hidden shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-deep-navy truncate">
                        {product.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                        Qty: {item.quantity} × ${unitPrice.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-deep-navy shrink-0">
                      ${(unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                  );
                })}
              </div>

              {/* Promo Code entry block */}
              <div className="border-t border-slate-100 pt-4 pb-1">
                {appliedCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-primary-green/20 rounded-2xl px-3.5 py-2 text-xs font-bold text-dark-green mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Percent className="h-3.5 w-3.5 text-primary-green shrink-0" />
                      <span className="truncate">"{appliedCode}" Applied</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      className="ml-2 text-rose-500 hover:text-rose-700 underline text-[10px] font-bold shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 mb-3">
                    <form
                      onSubmit={handleApplyPromo}
                      className="flex gap-2 w-full"
                    >
                      <input
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-deep-navy placeholder:text-slate-400 focus:outline-none focus:border-primary-green/50 transition-colors"
                      />
                      <button
                        type="submit"
                        className="h-9 px-4 rounded-xl bg-deep-navy hover:bg-primary-green text-white font-bold text-xs tracking-wide transition-all shadow-md shrink-0 cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>

                    {/* Clickable Coupons fallback */}
                    <p className="text-[10px] font-semibold text-slate-400">
                      Use{" "}
                      {coupons.length > 0 ? (
                        coupons.map((c, idx) => (
                          <span key={c.code || c.id || idx}>
                            <button
                              type="button"
                              onClick={() => setPromoCode(c.code)}
                              className="text-primary-green hover:text-dark-green font-bold transition-colors cursor-pointer hover:underline"
                            >
                              {c.code}
                            </button>
                            {idx < coupons.length - 2 && ", "}
                            {idx === coupons.length - 2 && " or "}
                          </span>
                        ))
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPromoCode("PETWELL")}
                            className="text-primary-green hover:text-dark-green font-bold transition-colors cursor-pointer hover:underline"
                          >
                            PETWELL
                          </button>{" "}
                          or{" "}
                          <button
                            type="button"
                            onClick={() => setPromoCode("SAVE15")}
                            className="text-primary-green hover:text-dark-green font-bold transition-colors cursor-pointer hover:underline"
                          >
                            SAVE15
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Calculations */}
              <div className="border-t border-slate-100 pt-4 space-y-3 font-sans">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-deep-navy">
                    ${quotedSubtotal.toFixed(2)}
                  </span>
                </div>
                {/* Shipping Charge */}
                {shippingLabel || checkoutShippingCost > 0 ? (
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>{shippingLabel || "Shipping"}</span>
                    <span className="font-bold text-deep-navy">
                      ${checkoutShippingCost.toFixed(2)}
                    </span>
                  </div>
                ) : null}
                {appliedCode && (
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span className="text-primary-green">
                      Promo Discount ({appliedCode})
                    </span>
                    <span className="font-bold text-primary-green">
                      -${Number(checkoutQuote?.couponDiscount ?? promoDiscount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium text-slate-500 border-b border-slate-100 pb-4">
                  <span>{taxLabel}</span>
                  <span className="font-bold text-deep-navy">
                    ${quotedTax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-extrabold text-deep-navy">
                    Total Bill
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight">
                    ${quotedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-[10px] font-semibold uppercase tracking-wider text-center">
                <span>FDA-Approved Pharmacy Certified Security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StripePaymentForm({
  handleSubmitOrder,
  totalAmount,
  resetPaymentSession,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        showToast.error(result.error.message || "Payment failed");
        if (
          result.error.code === "payment_intent_unexpected_state" ||
          (result.error.message &&
            result.error.message.includes("already succeeded"))
        ) {
          if (resetPaymentSession) resetPaymentSession();
        }
        setProcessing(false);
      } else {
        if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
          showToast.success("Payment succeeded!");
          try {
            await handleSubmitOrder(result.paymentIntent.id);
          } catch (err) {
            console.error("Order creation failed after payment:", err);
            if (resetPaymentSession) resetPaymentSession();
          }
        }
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      showToast.error(
        err.message || "Payment processing failed. Please try again.",
      );
      if (resetPaymentSession) resetPaymentSession();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handlePay}
      className="mt-6 space-y-5 font-sans animate-fade-in text-left"
    >
      <div className="space-y-4">
        {/* Unified Card Details Container */}
        <div className="p-4 sm:p-5 border border-slate-200 rounded-3xl bg-white focus-within:border-primary-green focus-within:ring-2 focus-within:ring-primary-green/10 transition-all shadow-3xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-3">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Card Details
            </label>
            <span className="flex items-center gap-1.5 text-[10px] text-primary-green font-extrabold uppercase tracking-wide">
              <Lock className="h-3 w-3" /> Secure SSL Connection
            </span>
          </div>
          <div className="py-2.5 px-1 border-t border-slate-100 mt-2">
            <PaymentElement className="w-full" />
          </div>
        </div>

        {/* Secure Badging & Powered by Stripe */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1 text-[11px] font-semibold text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100/50">
              <ShieldCheck className="h-3.5 w-3.5" /> 256-bit SSL Encryption
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by</span>
            <svg viewBox="0 0 60 25" className="h-5 w-auto text-[#635BFF] fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M51.01 10.53c0-3.32-2.31-6.1-5.94-6.1-3.66 0-5.97 2.78-5.97 6.1 0 3.28 2.31 6.09 5.97 6.09 3.63 0 5.94-2.81 5.94-6.09zm-8.83 0c0-1.87 1.15-3.3 2.89-3.3 1.76 0 2.91 1.43 2.91 3.3 0 1.88-1.15 3.3-2.91 3.3-1.74 0-2.89-1.42-2.89-3.3zm21.43-3.1h-2.9v-.81c0-1.39.81-1.81 2.22-1.81.56 0 1.05.07 1.45.18V2.19c-.56-.17-1.36-.26-2.28-.26-3.23 0-4.33 1.54-4.33 4.41v1.12h-1.81v2.79h1.81v8.28h2.94V10.3h2.9V7.43zm-27.1 2.5c-.88-.41-1.92-.68-2.94-.68-1.63 0-2.43.64-2.43 1.52 0 .91.89 1.28 2.71 1.76 2.35.61 4.54 1.25 4.54 4.06 0 3.1-2.52 4.47-5.75 4.47-1.57 0-3.2-.33-4.37-.92v-3.08c1.19.64 2.65.98 3.96.98 1.45 0 2.22-.51 2.22-1.39 0-.95-.91-1.33-2.95-1.84-2.27-.57-4.3-1.32-4.3-3.95 0-2.89 2.34-4.39 5.48-4.39 1.49 0 2.88.29 3.84.73v3.08zm-9.87-8.02h-2.94v2.7h2.94V1.91zm0 5.52h-2.94v10.1h2.94V7.43zm-5.78 0H18.1v2.18c-.53-.8-1.51-2.54-4.14-2.54-2.85 0-5.1 2.45-5.1 6.1 0 3.61 2.25 6.09 5.1 6.09 2.63 0 3.61-1.74 4.14-2.54v2.22h2.94V7.43zm-6.17 6.35c-1.54 0-2.61-1.33-2.61-3.25 0-1.91 1.07-3.25 2.61-3.25 1.54 0 2.6 1.34 2.6 3.25 0 1.92-1.06 3.25-2.6 3.25zM2.87 9.87c.75-.41 1.63-.64 2.44-.64.91 0 1.39.3 1.39.95 0 .61-.58.85-1.56 1.12C3.12 11.83 1 12.44 1 14.54c0 2.23 1.84 3.09 4.19 3.09 1.57 0 2.82-.61 3.32-1.3v1.1h2.94V9.66c0-3.32-2.18-4.7-5.59-4.7-1.42 0-2.88.3-3.83.84v2.96c.92-.51 2.05-.89 3.01-.89 1.59 0 2.44.57 2.44 1.55 0 .3-.07.57-.27.78-.34-.51-1.29-1.22-2.83-1.22-2.27 0-4.07 1.63-4.07 4.09 0 2.44 1.8 4.09 4.07 4.09 1.81 0 2.76-1.12 3.12-1.84V16.3c-.5.68-1.48 2.09-3.79 2.09-2.9 0-5.07-2.3-5.07-6.09 0-3.79 2.17-6.09 5.07-6.09zm0 0c.92-.51 2.05-.89 3.01-.89 1.59 0 2.44.57 2.44 1.55 0 .31-.07.58-.27.79v-2.34zm6.05 4.67c0-1.8 1.15-2.91 2.89-2.91s2.89 1.11 2.89 2.91-1.15 2.9-2.89 2.9-2.89-1.1-2.89-2.9zm17.65 1.76V7.43H23.6v10.1h2.94v-5.71c0-1.63.85-2.58 2.18-2.58.33 0 .61.03.81.08V7.43c-.27-.05-.55-.08-.85-.08-1.57 0-2.56.91-3.04 1.79zm13.1-6.43v-2.7h-2.94v2.7h-1.81v2.79h1.81v8.28h2.94V10.3h1.81V7.43h-1.81z" />
            </svg>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full h-14 rounded-full bg-linear-to-br from-primary-green to-dark-green text-white font-extrabold text-[15px] sm:text-base tracking-wide transition-all shadow-[0_12px_24px_rgba(88,185,71,0.22)] hover:shadow-[0_16px_32px_rgba(88,185,71,0.32)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
      >
        {processing
          ? "Processing Payment..."
          : `Pay Now ($${totalAmount.toFixed(2)})`}
        <ShieldCheck className="h-5 w-5" />
      </button>
    </form>
  );
}
