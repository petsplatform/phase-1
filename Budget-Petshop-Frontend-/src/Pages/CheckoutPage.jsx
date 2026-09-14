import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Truck,
  Mail,
  Smartphone,
  AlertCircle,
  ArrowRight,
  MapPin,
  Tag,
  Upload,
  FileText,
  X,
  AlertTriangle,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNotification } from "../utils/NotificationContext";
import { authApi } from "../api/authApi";
import { orderApi } from "../api/orderApi";
import { accountApi } from "../api/accountApi";
import { taxApi } from "../api/taxApi";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import { couponApi } from "../api/couponApi";
import StripePaymentElement from "../Components/checkout/StripePaymentElement";
import CountryDropdown from "../Components/common/CountryDropdown";
import {
  calculateOrderTotals,
  formatPrice,
  getCartItemCount,
  getCouponByCode,
  parsePrice,
} from "../utils/cart";
import { INITIAL_ADDRESSES } from "../utils/profileMockData";
import { useAuth } from "../utils/AuthContext";
import { isVetOnly, lacksVetAccess } from "../utils/productUtils";

const initialFormState = {
  fullName: "",
  email: "",
  phone: "",
  newAddressName: "",
  newAddressPhone: "",
  newAddressStreet: "",
  newAddressCity: "",
  newAddressState: "",
  newAddressZip: "",
  newAddressCountry: "United States",
};

const DEFAULT_COUNTRY = "United States";

const splitAddressLocation = (value = "") => {
  const parts = String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 4) {
    return {
      city: parts[0],
      state: parts[1],
      zip: parts[2],
      country: parts.slice(3).join(", "),
    };
  }

  if (parts.length === 3) {
    return {
      city: parts[0],
      state: parts[1],
      zip: parts[2],
      country: DEFAULT_COUNTRY,
    };
  }

  return {
    city: parts[0] || String(value).trim(),
    state: "",
    zip: "",
    country: DEFAULT_COUNTRY,
  };
};

const normalizeCheckoutAddress = (address = {}) => ({
  ...address,
  name: address.name || address.fullName || "",
  street: address.street || address.address || address.addressLine1 || "",
  city: address.city || "",
  state: address.state || "",
  zip: address.zip || address.zipCode || address.postalCode || "",
  country: address.country || DEFAULT_COUNTRY,
});

function InputField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <label className="grid gap-2 w-full">
      <span className="text-sm font-semibold text-on-background">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full h-[52px] rounded-2xl border border-outline bg-[#FCFAF6] px-4 text-sm text-on-background outline-none transition focus:border-secondary focus:bg-white"
      />
    </label>
  );
}

function CheckoutPage({
  cartItems,
  appliedCouponCode,
  onApplyCoupon,
  onPlaceOrder,
}) {
  const { showNotification } = useNotification();
  const { isAuthenticated, user, checkoutContact } = useAuth();
  const location = useLocation();
  const confirmStripePaymentRef = useRef(null);
  const [buyNowItem, setBuyNowItem] = useState(() => {
    try {
      const stored = sessionStorage.getItem("budget_petshop_buy_now");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const isBuyNowCheckout =
    new URLSearchParams(location.search).get("buyNow") === "1" && buyNowItem;
  const checkoutItems = useMemo(
    () => (isBuyNowCheckout ? [buyNowItem] : cartItems),
    [cartItems, isBuyNowCheckout, buyNowItem],
  );
  const checkoutSubtotal = useMemo(
    () =>
      checkoutItems.reduce(
        (sum, item) => sum + parsePrice(item.salePrice) * item.quantity,
        0,
      ),
    [checkoutItems],
  );

  const [couponInput, setCouponInput] = useState(appliedCouponCode);
  const [checkoutCouponCode, setCheckoutCouponCode] =
    useState(appliedCouponCode);
  const [couponMessage, setCouponMessage] = useState("");
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);

  useEffect(() => {
    if (!isBuyNowCheckout) {
      setCheckoutCouponCode(appliedCouponCode);
      setCouponInput(appliedCouponCode);
    }
  }, [appliedCouponCode, isBuyNowCheckout]);

  useEffect(() => {
    let isMounted = true;
    couponApi
      .list()
      .then((coupons) => {
        if (!isMounted) return;
        setActiveCoupons(Array.isArray(coupons) ? coupons : []);
      })
      .catch((error) => {
        console.error("Failed to load store coupons:", error);
        if (isMounted) setActiveCoupons([]);
      })
      .finally(() => {
        if (isMounted) setCouponsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const [formState, setFormState] = useState(initialFormState);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Steps: 'contact', 'shipping'
  const [checkoutStep, setCheckoutStep] = useState("contact");

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setFormState((current) => ({
      ...current,
      fullName: current.fullName || user.name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
    }));
  }, [isAuthenticated, user]);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState(() => {
    const saved = localStorage.getItem("userAddresses");
    const parsed = saved ? JSON.parse(saved) : INITIAL_ADDRESSES;
    return parsed.map(normalizeCheckoutAddress);
  });

  // Track address selection
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const saved = localStorage.getItem("userAddresses");
    const parsed = saved ? JSON.parse(saved) : INITIAL_ADDRESSES;
    return parsed.length > 0 ? parsed[0].id : "";
  });

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    accountApi
      .getAddresses()
      .then((serverAddresses) => {
        if (!isMounted) return;
        const normalized = (serverAddresses || []).map(normalizeCheckoutAddress);
        setSavedAddresses(normalized);
        if (normalized.length > 0) {
          setSelectedAddressId((prevId) => {
            const exists = normalized.some((addr) => addr.id === prevId);
            if (exists) return prevId;
            const def = normalized.find((addr) => addr.isDefault) || normalized[0];
            return def.id;
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load checkout addresses:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const [activeTax, setActiveTax] = useState(null);
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

  const hasPrescriptionRequiredProduct = useMemo(
    () =>
      checkoutItems.some((item) =>
        Boolean(
          item.prescriptionRequired ||
          item.product?.prescriptionRequired ||
          item.isPrescriptionRequired,
        ),
      ),
    [checkoutItems],
  );

  const vetRestrictedItems = useMemo(
    () =>
      checkoutItems.filter((item) =>
        isVetOnly(item.product || item),
      ),
    [checkoutItems],
  );

  const hasVetRestriction = useMemo(
    () => Boolean(vetRestrictedItems.length > 0 && !user?.isVetVerified),
    [vetRestrictedItems, user],
  );

  const prescriptionRequiredItems = useMemo(
    () =>
      checkoutItems.filter((item) =>
        Boolean(
          item.prescriptionRequired ||
          item.product?.prescriptionRequired ||
          item.isPrescriptionRequired,
        ),
      ),
    [checkoutItems],
  );

  const [uploadedPrescriptions, setUploadedPrescriptions] = useState([]);
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");

  const handlePrescriptionFilesChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setPrescriptionError("");
    setIsUploadingPrescription(true);

    const newUploads = [];
    for (const file of files) {
      try {
        const result = await orderApi.uploadPrescription(file);
        const uploadedUrl =
          (typeof result === "string" ? result : "") ||
          result?.url ||
          result?.data?.url ||
          result?.path ||
          "";

        const item = {
          id:
            result?.id ||
            `rx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          type: file.type,
          url: uploadedUrl || URL.createObjectURL(file),
          data: result,
        };
        newUploads.push(item);
      } catch (error) {
        console.error("Prescription upload error:", error);
        const errorMsg =
          error.response?.data?.message ||
          error.message ||
          `Failed to upload ${file.name}. Please try again.`;
        setPrescriptionError(errorMsg);
        showNotification(errorMsg, "error");
      }
    }

    if (newUploads.length > 0) {
      setUploadedPrescriptions((prev) => [...prev, ...newUploads]);
      showNotification(
        `Successfully uploaded ${newUploads.length} prescription file${newUploads.length > 1 ? "s" : ""}!`,
        "success",
      );
    }
    setIsUploadingPrescription(false);
    event.target.value = "";
  };

  const handleRemovePrescriptionItem = (id) => {
    setUploadedPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    let isMounted = true;

    taxApi
      .getActive()
      .then((tax) => {
        if (isMounted) setActiveTax(tax);
      })
      .catch((error) => {
        console.error("Failed to load active tax:", error);
        if (isMounted) setActiveTax(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleApplyCoupon() {
    const normalizedCode = couponInput.trim().toUpperCase();
    if (!normalizedCode) {
      setCouponMessage("Enter a coupon code.");
      return;
    }

    try {
      const result = await couponApi.validate(normalizedCode, checkoutSubtotal);
      const code = result?.coupon?.code || result?.code || normalizedCode;
      localStorage.setItem(
        "budget-petshop-coupon-detail",
        JSON.stringify({
          code,
          type: result?.type === "flat" ? "flat" : "percent",
          amount: Number(result?.value || 0),
          label:
            result?.type === "flat"
              ? `$${Number(result?.value || 0)} off`
              : `${Number(result?.value || 0)}% off`,
        }),
      );
      setCheckoutCouponCode(code);
      if (!isBuyNowCheckout) {
        onApplyCoupon(code);
      }
      setCouponInput(code);
      setCouponMessage(`${code} applied.`);
    } catch (error) {
      setCouponMessage(
        error.response?.data?.message || "Coupon is not valid for this cart.",
      );
    }
  }

  function handleRemoveCoupon() {
    setCheckoutCouponCode("");
    if (!isBuyNowCheckout) {
      onApplyCoupon("");
    }
    setCouponInput("");
    localStorage.removeItem("budget-petshop-coupon-detail");
    setCouponMessage("Coupon removed from this cart.");
  }

  const activeTaxesList = useMemo(() => {
    if (!activeTax) return [];
    let raw = activeTax;
    if (
      raw &&
      typeof raw === "object" &&
      !Array.isArray(raw) &&
      raw.data !== undefined
    ) {
      raw = raw.data;
    }
    if (Array.isArray(raw)) {
      return raw.filter((t) => t && Number(t.rate ?? t.taxRate ?? 0) > 0);
    }
    if (raw && typeof raw === "object") {
      const rate = Number(raw.rate ?? raw.taxRate ?? 0);
      if (rate > 0) return [raw];
    }
    return [];
  }, [activeTax]);

  const totalTaxRate = useMemo(() => {
    return activeTaxesList.reduce((sum, t) => sum + Number(t.rate ?? t.taxRate ?? 0), 0);
  }, [activeTaxesList]);

  const itemCount = getCartItemCount(checkoutItems);
  const appliedCoupon = getCouponByCode(checkoutCouponCode);
  const activeTaxRate = totalTaxRate || Number(activeTax?.rate || 0);
  const {
    couponDiscount,
    discountedSubtotal,
    taxableAmount,
    shippingCost: calculatedShippingCost,
    estimatedTax,
    orderTotal,
  } = calculateOrderTotals({
    subtotal: checkoutSubtotal,
    coupon: appliedCoupon,
    taxRate: activeTaxRate,
    shipping: shippingCost,
  });
  const selectedAddress = savedAddresses.find(
    (addr) => addr.id === selectedAddressId,
  );

  const isAddressComplete = !showNewAddressForm && selectedAddressId !== "";

  const getOrderAddress = useCallback(() => {
    if (!selectedAddress) return null;
    const normalizedAddress = normalizeCheckoutAddress(selectedAddress);
    const customerName = normalizedAddress.name || formState.fullName;
    const phone = normalizedAddress.phone || formState.phone;
    const nameParts = customerName.trim().split(" ");
    const addressLine = normalizedAddress.street;

    return {
      customerName,
      phone,
      shippingAddress: {
        fullName: customerName,
        firstName: nameParts[0] || customerName,
        lastName: nameParts.slice(1).join(" "),
        name: customerName,
        email: formState.email,
        phone,
        address: addressLine,
        addressLine1: addressLine,
        street: addressLine,
        city: normalizedAddress.city,
        state: normalizedAddress.state,
        zip: normalizedAddress.zip,
        postalCode: normalizedAddress.zip,
        country: normalizedAddress.country,
      },
    };
  }, [formState.email, formState.fullName, formState.phone, selectedAddress]);

  const buildOrderPayload = (options = {}) => {
    const { paymentMethod: method = "stripe", stripePaymentIntentId = null } =
      options;
    const orderAddress = getOrderAddress();
    if (!orderAddress) return null;

    const rxUrls = uploadedPrescriptions
      .map((p) => (typeof p === "string" ? p : p?.url))
      .filter(Boolean);

    return {
      email: formState.email || user?.email || "",
      customerEmail: formState.email || user?.email || "",
      customerName: formState.fullName || user?.name || orderAddress.customerName || "",
      name: formState.fullName || user?.name || orderAddress.customerName || "",
      items: checkoutItems.map((item) => ({
        productId: item.productId || item.id,
        variantId:
          item.variantId || item.selectedVariantId || item.selectedSize?.id,
        variantLabel:
          item.variantLabel || item.selectedOption || item.selectedSize?.label,
        name: item.name || item.title,
        sku: item.sku,
        quantity: item.quantity,
        price: parsePrice(item.salePrice),
        image: item.image,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        optionLabel: item.selectedOption,
      })),
      shippingAddress: orderAddress.shippingAddress,
      phone: orderAddress.phone,
      subtotal: checkoutSubtotal,
      shippingCost,
      tax: estimatedTax,
      taxAmount: estimatedTax,
      discount: couponDiscount,
      promoDiscount: couponDiscount,
      couponDiscount,
      couponCode: appliedCoupon?.code || checkoutCouponCode || null,
      paymentMethod: method || "stripe",
      stripePaymentIntentId,
      total: orderTotal,
      totalAmount: orderTotal,
      taxableAmount,
      prescription:
        rxUrls[0] ||
        uploadedPrescriptions[0]?.url ||
        uploadedPrescriptions[0] ||
        null,
      prescriptions: uploadedPrescriptions,
      prescriptionUrls: rxUrls,
      prescriptionRequired: hasPrescriptionRequiredProduct,
    };
  };

  const displaySubtotal = checkoutSubtotal;
  const displayCouponDiscount = couponDiscount;
  const displayDiscountedSubtotal = discountedSubtotal;
  const displayTax = estimatedTax;
  const displayTotal = orderTotal;

  const stripeCheckoutPayload = useMemo(
    () =>
      buildOrderPayload({
        paymentMethod: "stripe",
      }) || { total: displayTotal },
    [
      checkoutItems,
      checkoutSubtotal,
      shippingCost,
      estimatedTax,
      couponDiscount,
      appliedCoupon?.code,
      checkoutCouponCode,
      orderTotal,
      taxableAmount,
      uploadedPrescriptions,
      hasPrescriptionRequiredProduct,
      getOrderAddress,
      displayTotal,
    ],
  );

  const handleStripeReady = useCallback((confirmPayment) => {
    confirmStripePaymentRef.current = confirmPayment;
  }, []);

  const handleAddressSelect = (id) => {
    setSelectedAddressId(id);
    setShowNewAddressForm(false);
    setEditingAddressId(null);
  };

  const resetAddressFormFields = () => {
    setFormState((prev) => ({
      ...prev,
      newAddressName: "",
      newAddressPhone: "",
      newAddressStreet: "",
      newAddressCity: "",
      newAddressState: "",
      newAddressZip: "",
      newAddressCountry: "United States",
    }));
  };

  const handleEditAddress = (e, addr) => {
    e.stopPropagation();
    const addrId = addr.id;
    setEditingAddressId(addrId);
    setFormState((prev) => ({
      ...prev,
      newAddressName: addr.name || addr.fullName || formState.fullName || "",
      newAddressPhone: addr.phone || formState.phone || "",
      newAddressStreet: addr.street || addr.address || "",
      newAddressCity: addr.city || "",
      newAddressState: addr.state || "",
      newAddressZip: addr.zip || addr.zipCode || "",
      newAddressCountry: addr.country || "United States",
    }));
    setShowNewAddressForm(true);
  };

  const handleDeleteAddress = async (e, addressId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    setDeletingAddressId(addressId);
    try {
      if (isAuthenticated) {
        try {
          const address = savedAddresses.find((addr) => addr.id === addressId);
          const index = Number(
            address?.index ?? savedAddresses.findIndex((addr) => addr.id === addressId),
          );
          if (index >= 0) {
            await accountApi.removeAddress(index);
          }
        } catch (apiErr) {
          console.warn("API address remove failed:", apiErr);
        }
      }
      const updated = savedAddresses.filter((addr) => addr.id !== addressId);
      setSavedAddresses(updated);
      localStorage.setItem("userAddresses", JSON.stringify(updated));
      showNotification("Address deleted successfully.", "success");

      if (selectedAddressId === addressId) {
        if (updated.length > 0) {
          setSelectedAddressId(updated[0].id);
        } else {
          setSelectedAddressId("");
          setShowNewAddressForm(true);
        }
      }
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
        resetAddressFormFields();
        setShowNewAddressForm(false);
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
      showNotification("Failed to delete address. Please try again.", "error");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleCreateAddress = async () => {
    const name = String(formState.newAddressName || "").trim();
    const phoneDigits = String(formState.newAddressPhone || "").replace(/\D/g, "");
    const street = String(formState.newAddressStreet || "").trim();
    const city = String(formState.newAddressCity || "").trim();
    const state = String(formState.newAddressState || "").trim();
    const zip = String(formState.newAddressZip || "").trim();

    if (name.length < 2 || name.length > 50) {
      showNotification("Please enter a valid full name (2 to 50 characters).", "error");
      return;
    }
    if (!formState.newAddressPhone || phoneDigits.length !== 10) {
      showNotification("Please enter a valid 10-digit phone number.", "error");
      return;
    }
    if (street.length < 5 || street.length > 100) {
      showNotification("Please enter a valid street address (5 to 100 characters).", "error");
      return;
    }
    if (city.length < 2 || city.length > 50) {
      showNotification("Please enter a valid city name (2 to 50 characters).", "error");
      return;
    }
    if (state.length < 2 || state.length > 50) {
      showNotification("Please enter a valid state/province (2 to 50 characters).", "error");
      return;
    }
    if (zip.length < 3 || zip.length > 10) {
      showNotification("Please enter a valid ZIP/Postal code (3 to 10 characters).", "error");
      return;
    }

    if (editingAddressId) {
      const existingAddr = savedAddresses.find((a) => a.id === editingAddressId);
      const targetIndex = Number(
        existingAddr?.index ?? savedAddresses.findIndex((a) => a.id === editingAddressId),
      );

      const updatedAddr = {
        ...(existingAddr || {}),
        id: editingAddressId,
        name,
        street,
        address: street,
        city,
        state,
        zip,
        zipCode: zip,
        country: formState.newAddressCountry || "United States",
        phone: formState.newAddressPhone,
      };

      if (isAuthenticated && targetIndex >= 0) {
        try {
          const apiPayload = {
            name,
            street,
            address: street,
            city,
            state,
            zip,
            zipCode: zip,
            country: formState.newAddressCountry || "United States",
            phone: formState.newAddressPhone,
            isDefault: Boolean(existingAddr?.isDefault),
          };
          const updatedFromApi = await accountApi.updateAddress(targetIndex, apiPayload);
          if (Array.isArray(updatedFromApi) && updatedFromApi.length > 0) {
            setSavedAddresses(updatedFromApi);
            localStorage.setItem("userAddresses", JSON.stringify(updatedFromApi));
          }
        } catch (apiErr) {
          console.warn("API address update failed:", apiErr);
        }
      }

      const updatedList = savedAddresses.map((a) =>
        a.id === editingAddressId ? updatedAddr : a,
      );
      setSavedAddresses(updatedList);
      localStorage.setItem("userAddresses", JSON.stringify(updatedList));

      setSelectedAddressId(editingAddressId);
      setEditingAddressId(null);
      setShowNewAddressForm(false);
      resetAddressFormFields();
      showNotification("Address updated successfully!", "success");
      return;
    }

    const newId = `addr-${Date.now()}`;
    const newAddr = {
      id: newId,
      title: "Saved Address",
      name,
      street,
      address: street,
      city,
      state,
      zip,
      zipCode: zip,
      country: formState.newAddressCountry || "United States",
      phone: formState.newAddressPhone,
    };

    if (isAuthenticated) {
      try {
        const apiPayload = {
          name,
          street,
          address: street,
          city,
          state,
          zip,
          zipCode: zip,
          country: formState.newAddressCountry || "United States",
          phone: formState.newAddressPhone,
          isDefault: savedAddresses.length === 0,
        };
        const updatedFromApi = await accountApi.addAddress(apiPayload);
        if (Array.isArray(updatedFromApi) && updatedFromApi.length > 0) {
          setSavedAddresses(updatedFromApi);
          localStorage.setItem("userAddresses", JSON.stringify(updatedFromApi));
          const latest = updatedFromApi[updatedFromApi.length - 1];
          if (latest) setSelectedAddressId(latest.id);
          setShowNewAddressForm(false);
          resetAddressFormFields();
          showNotification("New address created and selected successfully!", "success");
          return;
        }
      } catch (apiErr) {
        console.warn("API address add failed:", apiErr);
      }
    }

    const updatedAddresses = [...savedAddresses, newAddr];
    setSavedAddresses(updatedAddresses);
    localStorage.setItem("userAddresses", JSON.stringify(updatedAddresses));

    setSelectedAddressId(newId);
    setShowNewAddressForm(false);
    resetAddressFormFields();

    showNotification(
      "New address created and selected successfully!",
      "success",
    );
  };

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (hasVetRestriction) {
      showNotification(
        "Your order contains product(s) exclusive to verified veterinarians. Please complete vet verification before placing an order.",
        "error"
      );
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    if (checkoutStep === "contact") {
      const name = String(formState.fullName || "").trim();
      const email = String(formState.email || "").trim();
      const phone = String(formState.phone || "").trim();
      const phoneDigits = phone.replace(/\D/g, "");

      if (name.length < 2 || name.length > 50) {
        showNotification("Please enter a valid full name (2 to 50 characters).", "error");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showNotification("Please enter a valid email address.", "error");
        return;
      }

      if (phoneDigits.length !== 10) {
        showNotification("Please enter a valid 10-digit phone number.", "error");
        return;
      }

      setIsProcessingOrder(true);
      try {
        await checkoutContact({
          name: formState.fullName,
          email: formState.email,
          phone: formState.phone,
        });

        setCheckoutStep("shipping");
      } catch (error) {
        showNotification(
          error.response?.data?.message ||
            error.message ||
            "Could not prepare checkout session. Please try again.",
          "error",
        );
      } finally {
        setIsProcessingOrder(false);
      }
      return;
    }

    if (checkoutStep === "shipping") {
      if (!selectedAddress) {
        showNotification("Please select a shipping address.", "error");
        return;
      }

      if (hasPrescriptionRequiredProduct) {
        setCheckoutStep("prescription");
      } else {
        setCheckoutStep("payment");
      }
      return;
    }

    if (checkoutStep === "prescription") {
      if (!uploadedPrescriptions.length) {
        showNotification(
          "Please upload at least one valid veterinary prescription image or document.",
          "error",
        );
        return;
      }
      setCheckoutStep("payment");
      return;
    }

    // Process order in payment step
    if (!selectedAddress) {
      showNotification("Please select a shipping address.", "error");
      return;
    }

    if (hasPrescriptionRequiredProduct && !uploadedPrescriptions.length) {
      showNotification(
        "Please upload a valid veterinary prescription before completing your order.",
        "error",
      );
      setCheckoutStep("prescription");
      return;
    }

    setIsProcessingOrder(true);

    try {
      if (!confirmStripePaymentRef.current) {
        throw new Error(
          "Payment form is still loading. Please wait a moment and try again.",
        );
      }

      const { error, paymentIntent } = await confirmStripePaymentRef.current();
      if (error)
        throw new Error(error.message || "Payment failed. Please try again.");
      if (paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not completed.");
      }

      const orderPayload = buildOrderPayload({
        paymentMethod: "stripe",
        stripePaymentIntentId: paymentIntent.id,
      });
      if (!orderPayload) throw new Error("Order details are incomplete.");

      const createdOrder = await orderApi.createOrder(orderPayload);
      const orderAddress = getOrderAddress();

      const confirmation = {
        customerName: orderAddress?.customerName || formState.fullName,
        email: formState.email || user?.email || "",
        phone: orderAddress?.phone || formState.phone,
        shippingAddress: {
          address: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zip,
        },
        items: checkoutItems.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          salePrice: item.salePrice,
          image: item.image,
        })),
        itemCount,
        total: displayTotal,
        reference: createdOrder?.id || `BPS-${Date.now().toString().slice(-6)}`,
      };

      try {
        localStorage.setItem("budget_petshop_last_order", JSON.stringify(confirmation));
        const existingStr = localStorage.getItem("budget_petshop_orders");
        const existingList = existingStr ? JSON.parse(existingStr) : [];
        const updatedList = [
          confirmation,
          ...existingList.filter((o) => (o.reference || o.id) !== confirmation.reference),
        ];
        localStorage.setItem("budget_petshop_orders", JSON.stringify(updatedList));
      } catch (e) {
        console.warn("Failed to cache local order:", e);
      }

      setOrderConfirmation(confirmation);
      setFormState(initialFormState);
      if (isBuyNowCheckout) {
        sessionStorage.removeItem("budget_petshop_buy_now");
        setBuyNowItem(null);
      } else {
        onPlaceOrder();
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Order could not be placed. Please try again.",
        "error",
      );
    } finally {
      setIsProcessingOrder(false);
    }
  }

  if (orderConfirmation) {
    return (
      <main className="w-full max-w-full overflow-x-hidden bg-background text-on-background">
        <section className="page-shell px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-3xl rounded-2xl sm:rounded-[36px] border border-outline bg-white px-4 py-8 sm:px-10 sm:py-12 text-center shadow-[0_30px_60px_rgba(28,40,33,0.08)]">
            <CheckCircle2 size={56} className="mx-auto text-secondary" />
            <span className="section-kicker mx-auto mt-6">Order Confirmed</span>
            <h1 className="mt-6 font-display text-3xl text-on-background sm:text-4xl lg:text-5xl">
              Thanks, {orderConfirmation.customerName || "pet parent"}.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed sm:leading-8 text-charcoal-text">
              Your order is confirmed and we&apos;ve reserved everything in your
              cart. A receipt will be sent to {orderConfirmation.email}.
            </p>

            {/* Ordered Items Summary */}
            <div className="mt-8 border border-outline rounded-2xl sm:rounded-[36px] p-5 sm:p-7 text-left bg-white shadow-sm animate-fade-in-up">
              <h3 className="text-base font-bold text-on-background mb-4">
                Items Ordered
              </h3>
              <div className="space-y-4">
                {orderConfirmation.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 sm:gap-4 rounded-2xl bg-[#FCFAF6] p-3.5 border border-outline"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-[60px] w-[60px] rounded-xl object-cover shrink-0 border border-outline"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-background truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-charcoal-text mt-0.5 font-medium">
                        Qty {item.quantity} &bull;{" "}
                        {formatPrice(parsePrice(item.salePrice))} each
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-on-background shrink-0">
                      {formatPrice(parsePrice(item.salePrice) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-outline flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs sm:text-sm text-charcoal-text font-semibold">
                <div>
                  Order Reference:{" "}
                  <strong className="text-on-background font-bold">
                    {orderConfirmation.reference}
                  </strong>
                </div>
                <div>
                  Total Paid:{" "}
                  <strong className="text-secondary text-base font-extrabold">
                    {formatPrice(orderConfirmation.total)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Shipment Details Card */}
            <div className="mt-6 border border-outline rounded-2xl sm:rounded-[28px] p-5 sm:p-6 text-left bg-[#FCFAF6] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary shrink-0">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">Shipment Details</h3>
                  <p className="text-xs text-charcoal-text mt-0.5">
                    Your pet essentials will be dispatched to the shipping
                    address listed below.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-6 border-t border-outline pt-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary shrink-0">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                      Contact Information
                    </p>
                    <p className="text-sm font-bold text-on-background mt-1 truncate">
                      {orderConfirmation.customerName}
                    </p>
                    <p className="text-xs text-charcoal-text mt-0.5 truncate">
                      {orderConfirmation.email}
                    </p>
                    <p className="text-xs text-charcoal-text mt-0.5 font-medium">
                      {orderConfirmation.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0">
                    <MapPin size={14} className="text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-accent">
                      Delivery Address
                    </p>
                    {orderConfirmation.shippingAddress?.address ? (
                      <>
                        <p className="text-sm font-bold text-on-background mt-1 leading-snug break-words font-medium">
                          {orderConfirmation.shippingAddress.address}
                        </p>
                        {(orderConfirmation.shippingAddress.city ||
                          orderConfirmation.shippingAddress.state ||
                          orderConfirmation.shippingAddress.zipCode) && (
                          <p className="text-xs text-charcoal-text mt-0.5 font-medium">
                            {[
                              orderConfirmation.shippingAddress.city,
                              orderConfirmation.shippingAddress.state,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                            {orderConfirmation.shippingAddress.zipCode
                              ? ` - ${orderConfirmation.shippingAddress.zipCode}`
                              : ""}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-bold text-charcoal-text mt-1">
                        Not provided
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Secure Account Notice Card */}
            <div className="mt-6 border border-outline rounded-2xl sm:rounded-[28px] p-5 sm:p-6 text-left shadow-sm bg-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Secure Account Created
                  </h3>
                  <p className="text-xs text-charcoal-text mt-0.5">
                    Your pet parent profile has been successfully secured.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-y border-outline py-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-secondary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                      Registered Email
                    </p>
                    <p className="text-sm font-bold text-on-background truncate">
                      {orderConfirmation.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className="text-secondary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                      Verified Phone
                    </p>
                    <p className="text-sm font-bold text-on-background truncate">
                      {orderConfirmation.phone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-surface-soft p-4 text-sm leading-relaxed text-on-background">
                <p className="font-semibold text-secondary mb-1">
                  Security Notification:
                </p>
                <p className="text-xs text-charcoal-text">
                  Your account has been created automatically using your email
                  address and mobile number. This allows you to securely track
                  your orders, manage returns, and access your purchase history
                  anytime.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/"
                className="inline-flex items-center btn-primary-link justify-center rounded-full bg-secondary px-6 py-3 text-sm font-semibold  transition hover:bg-secondary/90"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!checkoutItems.length) {
    return (
      <main className="bg-background text-on-background">
        <section className="page-shell px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl rounded-[36px] border border-outline bg-white px-6 py-12 text-center shadow-[0_30px_60px_rgba(28,40,33,0.08)] sm:px-10">
            <span className="section-kicker mx-auto">Checkout</span>
            <h1 className="mt-6 font-display text-4xl text-on-background sm:text-5xl">
              Your checkout is ready when your cart is.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-charcoal-text">
              Add products to the cart first, then come back here to enter
              delivery details and place the order.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/cart"
                className="inline-flex items-center justify-center rounded-full border border-outline-strong bg-surface px-6 py-3 text-sm font-semibold text-on-background transition hover:border-secondary hover:text-primary"
              >
                Open Cart
              </Link>
              <Link
                to="/#best-sellers"
                className="inline-flex items-center justify-center rounded-full bg-secondary px-6 py-3 text-sm font-semibold btn-primary-link transition hover:bg-secondary/90"
              >
                Shop Products
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-white text-on-background">
      <section className="border-b border-outline bg-white">
        <div className="page-shell px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="max-w-3xl font-display text-3xl leading-tight text-on-background sm:text-4xl lg:text-5xl">
                Warm, simple checkout with everything laid out clearly.
              </h1>

              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed sm:leading-8 text-charcoal-text">
                Enter delivery details, review your order summary, and place
                your pet&apos;s order in a few quick steps.
              </p>
            </div>

            <Link
              to="/cart"
              className="section-kicker inline-flex items-center self-start md:self-center"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back To Cart
            </Link>
          </div>
        </div>
      </section>
      <section className="page-shell px-4 py-8 sm:px-6 lg:px-8 lg:py-12 w-full max-w-full overflow-hidden">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.8fr] w-full max-w-full">
          <form
            onSubmit={handleSubmit}
            className="order-2 lg:order-1 w-full max-w-full rounded-2xl sm:rounded-[34px] border border-outline bg-white p-4 sm:p-8 shadow-[0_20px_44px_rgba(28,40,33,0.08)] overflow-hidden"
          >
            {hasVetRestriction && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-bold uppercase tracking-wider text-amber-800">
                      Verified Veterinarian Required
                    </h4>
                    <p className="font-semibold text-amber-700 mt-0.5">
                      Your order contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(user ? "/profile?tab=vet-verification" : "/login")}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Apply for Verification
                </button>
              </div>
            )}

            {/* Step Wizard Header */}
            <div className="mb-8 flex items-center justify-between gap-2 border-b border-outline pb-6">
              {/* Step 1: Contact */}
              <button
                type="button"
                onClick={() => setCheckoutStep("contact")}
                className={`flex items-center gap-2 cursor-pointer transition ${
                  checkoutStep === "contact"
                    ? "text-secondary font-bold"
                    : "text-charcoal-text hover:text-on-background"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    checkoutStep === "contact"
                      ? "bg-secondary text-white"
                      : "bg-surface-soft text-charcoal-text border border-outline"
                  }`}
                >
                  1
                </div>
                <span className="hidden sm:inline text-xs sm:text-sm font-semibold">
                  Contact
                </span>
              </button>

              <div className="h-0.5 flex-1 bg-outline/60" />

              {/* Step 2: Shipping */}
              <button
                type="button"
                onClick={() => {
                  if (formState.fullName && formState.email) {
                    setCheckoutStep("shipping");
                  }
                }}
                className={`flex items-center gap-2 transition ${
                  formState.fullName && formState.email
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                } ${
                  checkoutStep === "shipping"
                    ? "text-secondary font-bold"
                    : "text-charcoal-text hover:text-on-background"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    checkoutStep === "shipping"
                      ? "bg-secondary text-white"
                      : "bg-surface-soft text-charcoal-text border border-outline"
                  }`}
                >
                  2
                </div>
                <span className="hidden sm:inline text-xs sm:text-sm font-semibold">
                  Shipping
                </span>
              </button>

              {hasPrescriptionRequiredProduct && (
                <>
                  <div className="h-0.5 flex-1 bg-outline/60" />

                  {/* Step 3: Prescription */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAddress) {
                        setCheckoutStep("prescription");
                      }
                    }}
                    className={`flex items-center gap-2 transition ${
                      selectedAddress
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-60"
                    } ${
                      checkoutStep === "prescription"
                        ? "text-secondary font-bold"
                        : "text-charcoal-text hover:text-on-background"
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        checkoutStep === "prescription"
                          ? "bg-secondary text-white"
                          : "bg-surface-soft text-charcoal-text border border-outline"
                      }`}
                    >
                      3
                    </div>
                    <span className="hidden sm:inline text-xs sm:text-sm font-semibold">
                      Prescription
                    </span>
                  </button>
                </>
              )}

              <div className="h-0.5 flex-1 bg-outline/60" />

              {/* Step 4 (or 3): Payment */}
              <button
                type="button"
                onClick={() => {
                  if (
                    selectedAddress &&
                    (!hasPrescriptionRequiredProduct ||
                      uploadedPrescriptions.length > 0)
                  ) {
                    setCheckoutStep("payment");
                  }
                }}
                className={`flex items-center gap-2 transition ${
                  selectedAddress &&
                  (!hasPrescriptionRequiredProduct ||
                    uploadedPrescriptions.length > 0)
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                } ${
                  checkoutStep === "payment"
                    ? "text-secondary font-bold"
                    : "text-charcoal-text hover:text-on-background"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    checkoutStep === "payment"
                      ? "bg-secondary text-white"
                      : "bg-surface-soft text-charcoal-text border border-outline"
                  }`}
                >
                  {hasPrescriptionRequiredProduct ? 4 : 3}
                </div>
                <span className="hidden sm:inline text-xs sm:text-sm font-semibold">
                  Payment
                </span>
              </button>
            </div>

            {/* STEP 1: Contact Information */}
            {checkoutStep === "contact" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-3xl text-on-background">
                      Delivery details
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-charcoal-text">
                      We&apos;ll use this information for shipping updates and
                      delivery.
                    </p>
                  </div>

                  <div className="rounded-full bg-secondary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    <span>Secure form</span>
                  </div>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="grid gap-1.5 w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-on-background">Full name</span>
                        <span className="text-[11px] text-charcoal-text/60 font-medium">Min 2, Max 50 chars</span>
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Aarav Sharma"
                        minLength={2}
                        maxLength={50}
                        value={formState.fullName}
                        onChange={handleInputChange}
                        required
                        className={`w-full h-[52px] rounded-2xl border ${
                          formState.fullName.trim().length > 0 &&
                          (formState.fullName.trim().length < 2 || formState.fullName.trim().length > 50)
                            ? "border-red-400 focus:border-red-500"
                            : "border-outline focus:border-secondary"
                        } bg-[#FCFAF6] px-4 text-sm text-on-background outline-none transition focus:bg-white`}
                      />
                      {formState.fullName.trim().length > 0 &&
                        (formState.fullName.trim().length < 2 || formState.fullName.trim().length > 50) && (
                          <span className="text-xs font-semibold text-red-500 mt-0.5">
                            Name must be between 2 and 50 characters.
                          </span>
                      )}
                    </label>
                  </div>

                  <label className="grid gap-1.5 w-full">
                    <span className="text-sm font-semibold text-on-background">Email address</span>
                    <input
                      type="email"
                      name="email"
                      placeholder="aarav@email.com"
                      value={formState.email}
                      onChange={handleInputChange}
                      required
                      className="w-full h-[52px] rounded-2xl border border-outline bg-[#FCFAF6] px-4 text-sm text-on-background outline-none transition focus:border-secondary focus:bg-white"
                    />
                  </label>

                  <label className="grid gap-1.5 w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-on-background">Phone number</span>
                      <span className="text-[11px] text-charcoal-text/60 font-medium">10 digits max</span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="9876543210"
                      minLength={10}
                      maxLength={10}
                      value={formState.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormState((prev) => ({ ...prev, phone: val }));
                      }}
                      required
                      className={`w-full h-[52px] rounded-2xl border ${
                        formState.phone.trim().length > 0 && formState.phone.replace(/\D/g, "").length !== 10
                          ? "border-red-400 focus:border-red-500"
                          : "border-outline focus:border-secondary"
                      } bg-[#FCFAF6] px-4 text-sm text-on-background outline-none transition focus:bg-white`}
                    />
                    {formState.phone.trim().length > 0 && formState.phone.replace(/\D/g, "").length !== 10 && (
                      <span className="text-xs font-semibold text-red-500 mt-0.5">
                        Phone number must be exactly 10 digits.
                      </span>
                    )}
                  </label>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-outline pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 text-sm leading-7 text-charcoal-text">
                    <ShieldCheck
                      size={20}
                      className="mt-1 shrink-0 text-primary"
                    />
                    <p>
                      Your contact details are used to keep you updated on your
                      shipment.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-secondary/90 cursor-pointer"
                  >
                    <span>Continue to Shipping</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: Shipping Address */}
            {checkoutStep === "shipping" && (
              <>
                {/* Contact Summary Card */}
                <div className="rounded-2xl border border-outline bg-[#FCFAF6] p-4 flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                        Contact Details
                      </p>
                      <p className="text-sm font-bold text-on-background">
                        {formState.fullName}
                      </p>
                      <p className="text-xs text-charcoal-text">
                        {formState.email} &bull; {formState.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("contact")}
                    className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <div>
                  <h2 className="font-display text-3xl text-on-background">
                    Delivery Address
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-charcoal-text">
                    Please select or add a delivery address for your shipment.
                  </p>
                </div>

                <div className="mt-6 border border-outline rounded-[24px] bg-white shadow-sm overflow-hidden animate-fade-in-up">
                  <div className="flex items-center gap-2.5 px-6 py-4 border-b border-outline bg-[#FCFAF6]">
                    <MapPin className="text-secondary w-5 h-5 shrink-0" />
                    <h3 className="font-display text-lg font-bold text-on-background">
                      Select Address
                    </h3>
                  </div>

                  <div className="p-6 flex flex-col gap-4">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleAddressSelect(addr.id)}
                          className={`relative rounded-2xl border p-4 cursor-pointer transition-all duration-200 shadow-sm flex items-start gap-4 ${
                            isSelected
                              ? "border-secondary bg-[#FFF9E6] ring-1 ring-secondary/25"
                              : "border-outline bg-white hover:border-outline-strong"
                          }`}
                        >
                          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-outline-strong bg-white">
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-secondary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-bold text-on-background truncate">
                                {addr.name}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleEditAddress(e, addr)}
                                  title="Edit address"
                                  className="p-1.5 rounded-lg text-charcoal-text/60 hover:text-secondary hover:bg-secondary/10 border border-transparent hover:border-secondary/20 transition-all cursor-pointer shrink-0"
                                  aria-label="Edit address"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteAddress(e, addr.id)}
                                  disabled={deletingAddressId === addr.id}
                                  title="Delete address"
                                  className="p-1.5 rounded-lg text-charcoal-text/60 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                                  aria-label="Delete address"
                                >
                                  {deletingAddressId === addr.id ? (
                                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-charcoal-text mt-0.5 font-medium leading-relaxed">
                              {addr.phone}
                            </p>
                            <p className="text-xs text-charcoal-text leading-relaxed">
                              {addr.street || addr.address}
                            </p>
                            <p className="text-xs text-charcoal-text leading-relaxed">
                              {[addr.city, addr.state, addr.zip || addr.zipCode, addr.country].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {!showNewAddressForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddressId(null);
                          resetAddressFormFields();
                          setShowNewAddressForm(true);
                          setSelectedAddressId("");
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-strong py-4 hover:border-secondary hover:text-secondary hover:bg-[#FCFAF6]/20 transition-all cursor-pointer font-bold text-sm text-secondary bg-white shadow-sm"
                      >
                        <span>+ Add New Address</span>
                      </button>
                    ) : (
                      <div className="border border-outline rounded-2xl p-5 bg-[#FCFAF6]/50 shadow-sm animate-fade-in">
                        <div className="grid gap-4 w-full">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-sm text-on-background">
                              {editingAddressId ? "Edit Address Details" : "Enter New Address Details"}
                            </h4>
                            {editingAddressId && (
                              <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full">
                                Editing
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="grid gap-1 w-full">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-on-background uppercase tracking-wider">Full Name *</span>
                                <span className="text-[10px] text-charcoal-text/60 font-semibold">Min 2, Max 50 chars</span>
                              </div>
                              <input
                                type="text"
                                name="newAddressName"
                                placeholder="John Smith"
                                minLength={2}
                                maxLength={50}
                                value={formState.newAddressName || ""}
                                onChange={handleInputChange}
                                required
                                className={`w-full h-[46px] rounded-xl border ${
                                  (formState.newAddressName || "").trim().length > 0 &&
                                  ((formState.newAddressName || "").trim().length < 2 || (formState.newAddressName || "").trim().length > 50)
                                    ? "border-red-400 focus:border-red-500"
                                    : "border-outline focus:border-secondary"
                                } bg-white px-4 text-xs text-on-background outline-none transition`}
                              />
                              {(formState.newAddressName || "").trim().length > 0 &&
                                ((formState.newAddressName || "").trim().length < 2 || (formState.newAddressName || "").trim().length > 50) && (
                                  <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                    Full name must be between 2 and 50 characters.
                                  </span>
                              )}
                            </label>

                            <label className="grid gap-1 w-full">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-on-background uppercase tracking-wider">Phone Number *</span>
                                <span className="text-[10px] text-charcoal-text/60 font-semibold">Exact 10 digits</span>
                              </div>
                              <input
                                type="tel"
                                name="newAddressPhone"
                                placeholder="10 digit phone number"
                                maxLength={10}
                                value={formState.newAddressPhone || ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                  setFormState((prev) => ({ ...prev, newAddressPhone: val }));
                                }}
                                required
                                className={`w-full h-[46px] rounded-xl border ${
                                  (formState.newAddressPhone || "").trim().length > 0 &&
                                  (formState.newAddressPhone || "").replace(/\D/g, "").length !== 10
                                    ? "border-red-400 focus:border-red-500"
                                    : "border-outline focus:border-secondary"
                                } bg-white px-4 text-xs text-on-background outline-none transition`}
                              />
                              {(formState.newAddressPhone || "").trim().length > 0 &&
                                (formState.newAddressPhone || "").replace(/\D/g, "").length !== 10 && (
                                  <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                    Phone number must be exactly 10 digits.
                                  </span>
                              )}
                            </label>
                          </div>

                          <label className="grid gap-1 w-full">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-on-background uppercase tracking-wider">Street Address</span>
                              <span className="text-[10px] text-charcoal-text/60 font-semibold">Min 5, Max 100 chars</span>
                            </div>
                            <input
                              type="text"
                              name="newAddressStreet"
                              placeholder="Street Address, P.O. box, apt"
                              minLength={5}
                              maxLength={100}
                              value={formState.newAddressStreet}
                              onChange={handleInputChange}
                              required
                              className={`w-full h-[46px] rounded-xl border ${
                                formState.newAddressStreet.trim().length > 0 &&
                                (formState.newAddressStreet.trim().length < 5 || formState.newAddressStreet.trim().length > 100)
                                  ? "border-red-400 focus:border-red-500"
                                  : "border-outline focus:border-secondary"
                              } bg-white px-4 text-xs text-on-background outline-none transition`}
                            />
                            {formState.newAddressStreet.trim().length > 0 &&
                              (formState.newAddressStreet.trim().length < 5 || formState.newAddressStreet.trim().length > 100) && (
                                <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                  Address must be between 5 and 100 characters.
                                </span>
                            )}
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="grid gap-1 w-full">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-on-background uppercase tracking-wider">City</span>
                                <span className="text-[10px] text-charcoal-text/60 font-semibold">Min 2, Max 50 chars</span>
                              </div>
                              <input
                                type="text"
                                name="newAddressCity"
                                placeholder="e.g. Austin"
                                minLength={2}
                                maxLength={50}
                                value={formState.newAddressCity}
                                onChange={handleInputChange}
                                required
                                className={`w-full h-[46px] rounded-xl border ${
                                  formState.newAddressCity.trim().length > 0 &&
                                  (formState.newAddressCity.trim().length < 2 || formState.newAddressCity.trim().length > 50)
                                    ? "border-red-400 focus:border-red-500"
                                    : "border-outline focus:border-secondary"
                                } bg-white px-4 text-xs text-on-background outline-none transition`}
                              />
                              {formState.newAddressCity.trim().length > 0 &&
                                (formState.newAddressCity.trim().length < 2 || formState.newAddressCity.trim().length > 50) && (
                                  <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                    City must be between 2 and 50 characters.
                                  </span>
                              )}
                            </label>

                            <label className="grid gap-1 w-full">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-on-background uppercase tracking-wider">State / Province</span>
                                <span className="text-[10px] text-charcoal-text/60 font-semibold">Min 2, Max 50 chars</span>
                              </div>
                              <input
                                type="text"
                                name="newAddressState"
                                placeholder="e.g. TX"
                                minLength={2}
                                maxLength={50}
                                value={formState.newAddressState}
                                onChange={handleInputChange}
                                required
                                className={`w-full h-[46px] rounded-xl border ${
                                  formState.newAddressState.trim().length > 0 &&
                                  (formState.newAddressState.trim().length < 2 || formState.newAddressState.trim().length > 50)
                                    ? "border-red-400 focus:border-red-500"
                                    : "border-outline focus:border-secondary"
                                } bg-white px-4 text-xs text-on-background outline-none transition`}
                              />
                              {formState.newAddressState.trim().length > 0 &&
                                (formState.newAddressState.trim().length < 2 || formState.newAddressState.trim().length > 50) && (
                                  <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                    State must be between 2 and 50 characters.
                                  </span>
                              )}
                            </label>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="grid gap-1 w-full">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-on-background uppercase tracking-wider">ZIP / Postal Code</span>
                                <span className="text-[10px] text-charcoal-text/60 font-semibold">Min 3, Max 10 chars</span>
                              </div>
                              <input
                                type="text"
                                name="newAddressZip"
                                placeholder="e.g. 78701"
                                minLength={3}
                                maxLength={10}
                                value={formState.newAddressZip}
                                onChange={handleInputChange}
                                required
                                className={`w-full h-[46px] rounded-xl border ${
                                  formState.newAddressZip.trim().length > 0 &&
                                  (formState.newAddressZip.trim().length < 3 || formState.newAddressZip.trim().length > 10)
                                    ? "border-red-400 focus:border-red-500"
                                    : "border-outline focus:border-secondary"
                                } bg-white px-4 text-xs text-on-background outline-none transition`}
                              />
                              {formState.newAddressZip.trim().length > 0 &&
                                (formState.newAddressZip.trim().length < 3 || formState.newAddressZip.trim().length > 10) && (
                                  <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                    ZIP code must be between 3 and 10 characters.
                                  </span>
                              )}
                            </label>

                            <div className="grid gap-1 w-full">
                              <span className="text-xs font-bold text-on-background uppercase tracking-wider">Country</span>
                              <CountryDropdown
                                value={formState.newAddressCountry || "United States"}
                                dropUp={true}
                                onChange={(c) =>
                                  setFormState((prev) => ({ ...prev, newAddressCountry: c }))
                                }
                                className="w-full h-[46px] rounded-xl border border-outline bg-white px-4 text-xs text-on-background outline-none transition flex items-center justify-between cursor-pointer select-none"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 mt-2">
                            <button
                              type="button"
                              onClick={handleCreateAddress}
                              className="inline-flex items-center justify-center rounded-full bg-secondary text-white px-6 py-3.5 text-xs font-semibold hover:bg-secondary/95 transition-all cursor-pointer"
                            >
                              {editingAddressId ? "Save Changes" : "Save Address"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewAddressForm(false);
                                setEditingAddressId(null);
                                resetAddressFormFields();
                                if (savedAddresses.length > 0) {
                                  setSelectedAddressId((prev) => prev || savedAddresses[0].id);
                                }
                              }}
                              className="inline-flex items-center justify-center rounded-full border border-outline bg-white text-on-background px-6 py-3.5 text-xs font-semibold hover:bg-surface-soft transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-3 border-t border-outline bg-[#FCFAF6] flex items-center justify-center gap-1.5 text-xs text-charcoal-text font-medium">
                    <ShieldCheck size={14} className="text-secondary" />
                    <span>Your information is safe with us</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-outline pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("contact")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-outline bg-white px-6 py-3.5 text-sm font-semibold text-on-background transition hover:border-secondary hover:text-secondary cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Contact Details</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!selectedAddress}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>
                      {hasPrescriptionRequiredProduct
                        ? "Continue to Prescription Upload"
                        : "Continue to Payment"}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Prescription Upload (Conditional) */}
            {checkoutStep === "prescription" &&
              hasPrescriptionRequiredProduct && (
                <>
                  {/* Contact & Shipping Summary Cards */}
                  <div className="grid gap-3 sm:grid-cols-2 mb-6">
                    <div className="rounded-2xl border border-outline bg-[#FCFAF6] p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Mail size={16} className="text-secondary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                            Contact
                          </p>
                          <p className="text-xs font-bold text-on-background truncate">
                            {formState.fullName}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep("contact")}
                        className="text-xs font-bold text-secondary hover:underline cursor-pointer shrink-0 ml-2"
                      >
                        Edit
                      </button>
                    </div>

                    {selectedAddress && (
                      <div className="rounded-2xl border border-outline bg-[#FCFAF6] p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin
                            size={16}
                            className="text-secondary shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                              Delivery
                            </p>
                            <p className="text-xs font-bold text-on-background truncate">
                              {selectedAddress.name} ({selectedAddress.city})
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep("shipping")}
                          className="text-xs font-bold text-secondary hover:underline cursor-pointer shrink-0 ml-2"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h2 className="font-display text-3xl text-on-background">
                      Upload Veterinary Prescription
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-charcoal-text">
                      One or more items in your cart require a valid
                      prescription from a licensed veterinarian. Please upload
                      photos or document scans.
                    </p>
                  </div>

                  {/* Prescription Required Products List Card with Small Image & Title */}
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-[#FFFBEB] p-4 sm:p-5">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-amber-600" />
                      <span>Prescription Required for Product(s):</span>
                    </p>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {prescriptionRequiredItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl border border-amber-200/80 bg-white p-2.5 shadow-xs"
                        >
                          <img
                            src={item.image}
                            alt={item.title || item.name}
                            className="h-12 w-12 rounded-lg object-cover border border-outline/50 shrink-0 bg-white"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-on-background truncate">
                              {item.title || item.name}
                            </p>
                            <p className="text-[11px] font-extrabold text-secondary mt-0.5">
                              {item.salePrice}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Multi-Image Upload Area */}
                  <div className="mt-6">
                    <div className="relative rounded-2xl border-2 border-dashed border-amber-300 bg-[#FCFAF6] p-6 text-center hover:border-secondary hover:bg-white transition-all">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        onChange={handlePrescriptionFilesChange}
                        disabled={isUploadingPrescription}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        id="prescription-multi-upload-input"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                        {isUploadingPrescription ? (
                          <>
                            <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary border-t-transparent" />
                            <p className="text-sm font-bold text-on-background">
                              Uploading prescription image(s)...
                            </p>
                            <p className="text-xs text-charcoal-text">
                              Please wait while your files are being uploaded.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                              <Upload size={22} />
                            </div>
                            <p className="text-sm font-bold text-on-background">
                              Click or Drag & Drop Prescription Image(s) / PDF
                            </p>
                            <p className="text-xs text-charcoal-text">
                              Select multiple files or upload photos one by one
                              (JPG, PNG, WEBP, PDF)
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {prescriptionError && (
                      <p className="mt-3 text-xs font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {prescriptionError}
                      </p>
                    )}

                    {/* Gallery of Uploaded Files */}
                    {uploadedPrescriptions.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-bold text-on-background">
                            Uploaded Prescriptions (
                            {uploadedPrescriptions.length})
                          </p>
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Ready for order
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {uploadedPrescriptions.map((rxItem) => {
                            const isImage =
                              rxItem.type?.startsWith("image/") ||
                              /\.(jpg|jpeg|png|webp)$/i.test(
                                rxItem.url || rxItem.name,
                              );

                            return (
                              <div
                                key={rxItem.id}
                                className="relative rounded-2xl border border-emerald-200 bg-white p-3 flex items-center justify-between gap-3 shadow-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {isImage ? (
                                    <img
                                      src={rxItem.url}
                                      alt={rxItem.name}
                                      className="h-12 w-12 rounded-lg object-cover border border-outline shrink-0 bg-surface-soft"
                                    />
                                  ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 shrink-0 font-bold text-xs">
                                      PDF
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-on-background truncate">
                                      {rxItem.name}
                                    </p>
                                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                                      Attached & verified ✓
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemovePrescriptionItem(rxItem.id)
                                  }
                                  className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer shrink-0"
                                  title="Remove file"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 flex flex-col gap-4 border-t border-outline pt-8 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("shipping")}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-outline bg-white px-6 py-3.5 text-sm font-semibold text-on-background transition hover:border-secondary hover:text-secondary cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Shipping Address</span>
                    </button>

                    <button
                      type="submit"
                      disabled={
                        uploadedPrescriptions.length === 0 ||
                        isUploadingPrescription
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <span>Continue to Payment</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}

            {/* STEP 4 (or 3): Payment Method */}
            {checkoutStep === "payment" && (
              <>
                {/* Contact, Shipping & Prescription Summaries */}
                <div className="grid gap-3 sm:grid-cols-2 mb-6">
                  <div className="rounded-2xl border border-outline bg-[#FCFAF6] p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail size={16} className="text-secondary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                          Contact
                        </p>
                        <p className="text-xs font-bold text-on-background truncate">
                          {formState.fullName}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep("contact")}
                      className="text-xs font-bold text-secondary hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Edit
                    </button>
                  </div>

                  {selectedAddress && (
                    <div className="rounded-2xl border border-outline bg-[#FCFAF6] p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin size={16} className="text-secondary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-secondary">
                            Delivery
                          </p>
                          <p className="text-xs font-bold text-on-background truncate">
                            {selectedAddress.name} ({selectedAddress.city})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep("shipping")}
                        className="text-xs font-bold text-secondary hover:underline cursor-pointer shrink-0 ml-2"
                      >
                        Edit
                      </button>
                    </div>
                  )}

                  {hasPrescriptionRequiredProduct &&
                    uploadedPrescriptions.length > 0 && (
                      <div className="sm:col-span-2 rounded-2xl border border-amber-200 bg-[#FFFBEB] p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText
                            size={16}
                            className="text-amber-800 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                              Prescription
                            </p>
                            <p className="text-xs font-bold text-amber-950 truncate">
                              {uploadedPrescriptions.length} photo/document(s)
                              attached & verified ✓
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCheckoutStep("prescription")}
                          className="text-xs font-bold text-amber-900 hover:underline cursor-pointer shrink-0 ml-2"
                        >
                          Edit / Manage
                        </button>
                      </div>
                    )}
                </div>

                <div>
                  <h2 className="font-display text-3xl text-on-background">
                    Payment Method
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-charcoal-text">
                    Budget PetShop orders are processed with top-tier security
                    standards.
                  </p>
                </div>

                <div className="mt-6">
                  <div className="relative rounded-2xl border border-secondary bg-[#FFF9E6] p-4 shadow-sm ring-1 ring-secondary/25 transition-all duration-200 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-outline-strong bg-white">
                        <div className="h-2.5 w-2.5 rounded-full bg-secondary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-on-background">
                          Pay Online with Stripe
                        </h4>
                        <p className="text-xs text-charcoal-text mt-0.5">
                          Secure credit/debit card, wallets, and supported
                          Stripe payment methods.
                        </p>
                      </div>
                    </div>
                  </div>
                  <StripePaymentElement
                    active={isAddressComplete}
                    total={displayTotal}
                    checkoutPayload={stripeCheckoutPayload}
                    onReady={handleStripeReady}
                  />
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-outline pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setCheckoutStep(
                        hasPrescriptionRequiredProduct
                          ? "prescription"
                          : "shipping",
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-outline bg-white px-6 py-3.5 text-sm font-semibold text-on-background transition hover:border-secondary hover:text-secondary cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>
                      Back to{" "}
                      {hasPrescriptionRequiredProduct
                        ? "Prescription Upload"
                        : "Shipping Details"}
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={!isAddressComplete || isProcessingOrder}
                    className="inline-flex items-center justify-center rounded-full bg-secondary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>
                      {isProcessingOrder ? "Processing Payment..." : "Pay Now"}
                    </span>
                  </button>
                </div>
              </>
            )}
          </form>

          <aside
            className="order-1 lg:order-2 lg:sticky lg:self-start"
            style={{ top: "calc(var(--navbar-height, 120px) + 24px)" }}
          >
            <div className="rounded-2xl sm:rounded-[34px] border border-outline bg-white p-4 sm:p-7 shadow-[0_20px_44px_rgba(28,40,33,0.08)]">
              <span className="section-kicker">Order Summary</span>
              <h2 className="mt-5 font-display text-2xl sm:text-3xl text-on-background">
                A quick final review.
              </h2>

              <div className="mt-7 space-y-4">
                {checkoutItems.map((item) => {
                  const saleVal = parsePrice(item.salePrice);
                  const origVal = parsePrice(item.originalPrice);
                  const hasDiscount = origVal > saleVal;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-[24px] bg-surface-soft p-3 sm:p-4 border border-outline/30 shadow-sm"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-[60px] w-[60px] sm:h-[72px] sm:w-[72px] rounded-lg sm:rounded-[18px] object-cover shrink-0 border border-outline/50 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-on-background break-words">
                          {item.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                          <span className="text-[11px] font-extrabold text-secondary">
                            {item.salePrice}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-[10px] text-charcoal-text line-through font-medium">
                                {item.originalPrice}
                              </span>
                              <span className="text-[9px] font-bold text-primary bg-[#eef6f1] px-1 rounded">
                                {Math.round(
                                  ((origVal - saleVal) / origVal) * 100,
                                )}
                                % OFF
                              </span>
                            </>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-charcoal-text font-semibold">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs sm:text-sm font-extrabold text-on-background">
                          {formatPrice(saleVal * item.quantity)}
                        </p>
                        {hasDiscount && (
                          <p className="text-[10px] font-bold text-primary">
                            Save{" "}
                            {formatPrice((origVal - saleVal) * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 space-y-4 border-t border-outline pt-6 text-sm text-charcoal-text">
                <div className="rounded-[24px] border border-outline bg-surface-soft p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-on-background">
                    <Tag size={16} className="text-secondary" />
                    Coupon code
                  </div>

                  <div className="mt-3 flex flex-row gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(event) => setCouponInput(event.target.value)}
                      placeholder="Enter coupon code"
                      className="h-[48px] flex-1 min-w-0 rounded-full border border-outline bg-white px-4 text-sm text-on-background outline-none transition focus:border-secondary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="inline-flex h-[48px] shrink-0 items-center justify-center rounded-full bg-secondary px-5 text-sm font-semibold text-white transition hover:bg-secondary/90 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="mt-3 text-xs leading-6 text-charcoal-text">
                    {couponsLoading ? (
                      <p>Loading available coupons...</p>
                    ) : activeCoupons.length ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span>Available coupons:</span>
                        {activeCoupons.slice(0, 4).map((coupon) => (
                          <button
                            key={coupon.id || coupon.code}
                            type="button"
                            onClick={() => {
                              setCouponInput(coupon.code);
                              setCouponMessage("");
                            }}
                            className="rounded-full border border-secondary/20 bg-white px-3 py-1 text-[11px] font-bold text-secondary transition hover:border-secondary cursor-pointer"
                          >
                            {coupon.code}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p>No active coupons are available right now.</p>
                    )}
                  </div>

                  {couponMessage ? (
                    <p className="mt-2 text-xs font-semibold text-primary">
                      {couponMessage}
                    </p>
                  ) : null}

                  {appliedCoupon ? (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3 border border-outline/30">
                      <p className="text-sm text-on-background">
                        <span className="font-semibold">
                          {appliedCoupon.code}
                        </span>{" "}
                        is active with{" "}
                        <span className="font-semibold text-primary">
                          {appliedCoupon.label}
                        </span>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-sm font-semibold text-accent transition hover:text-accent/80 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between">
                  <span>Subtotal ({itemCount} items)</span>
                  <span className="font-semibold text-on-background">
                    {formatPrice(displaySubtotal)}
                  </span>
                </div>
                {displayCouponDiscount > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                      <span className="font-semibold text-primary">
                        -{formatPrice(displayCouponDiscount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discounted Subtotal</span>
                      <span className="font-semibold text-on-background">
                        {formatPrice(displayDiscountedSubtotal)}
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
                    const rate = Number(tax.rate ?? tax.taxRate ?? 0);
                    const name = tax.name || tax.title || tax.taxName || "Tax";
                    const amt = (displayDiscountedSubtotal * rate) / 100;
                    return (
                      <div
                        key={tax.id || tax._id || idx}
                        className="flex items-center justify-between"
                      >
                        <span>
                          {name} ({rate}%)
                        </span>
                        <span className="font-semibold text-on-background">
                          {formatPrice(amt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-between">
                    <span>
                      {activeTax?.name
                        ? `${activeTax.name} (${activeTaxRate}%)`
                        : "Tax"}
                    </span>
                    <span className="font-semibold text-on-background">
                      {formatPrice(displayTax)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-outline pt-4 text-base">
                  <span className="font-semibold text-on-background">
                    Grand Total
                  </span>
                  <span className="font-display text-2xl sm:text-3xl text-on-background">
                    {formatPrice(displayTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-7 grid gap-4">
                <div className="flex items-start gap-3 rounded-[24px] bg-surface-tint px-4 py-4 text-sm leading-7 text-on-background">
                  <Truck size={20} className="mt-1 shrink-0 text-primary" />
                  <p>
                    Dispatch begins within 24 hours for in-stock pet essentials.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-[24px] bg-[#FFF2E8] px-4 py-4 text-sm leading-7 text-on-background">
                  <CreditCard size={20} className="mt-1 shrink-0 text-accent" />
                  <p>
                    Transparent totals with no hidden charges added after
                    checkout.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default CheckoutPage;
