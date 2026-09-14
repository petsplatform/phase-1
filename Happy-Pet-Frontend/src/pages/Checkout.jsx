import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Lock,
  Check,
  MapPin,
  CreditCard,
  Edit3,
  Percent,
  FileText,
  Stethoscope,
  UploadCloud,
  FileCheck,
  Trash2,
  Loader2,
} from "lucide-react";
import { useCart } from "../utils/cartFunctionality";
import { usePrescriptionModal } from "../utils/prescriptionContext";
import { isPrescriptionRequired, isVetOnly, lacksVetAccess } from "../utils/productUtils";
import { useAuth } from "../store/authentication/authContext";
import { accountApi } from "../api/accountApi";
import { orderApi } from "../api/orderApi";
import { prescriptionApi } from "../api/prescriptionApi";
import { authApi } from "../api/authApi";
import api, { CUSTOMER_BLOCKED_REASON_KEY } from "../api/axios";
import { couponApi } from "../api/couponApi";
import { shipmentChargeApi } from "../api/shipmentChargeApi";
import StripePaymentElement from "../components/checkout/StripePaymentElement";
import CountryDropdown from "../components/common/CountryDropdown";

const COUNTRIES = [
  "United States",
  "India",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
];

const withAddressIds = (addresses = []) =>
  addresses.map((address, index) => ({
    id: address.id || `addr_${index}`,
    country: "United States",
    isDefault: index === 0,
    ...address,
  }));

const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email || "").trim().toLowerCase());
};

const validatePhone = (phone) => {
  const val = String(phone || "").trim();
  if (!val) return false;
  if (!/^\+?[0-9\s\-()]+$/.test(val)) return false;
  const digits = val.replace(/\D/g, "");
  return digits.length === 10;
};

const validateFullName = (name) => {
  const trimmed = String(name || "").trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
};

const validateStreetAddress = (address) => {
  const trimmed = String(address || "").trim();
  return trimmed.length >= 5 && trimmed.length <= 100;
};

const validateCityStateZip = (text) => {
  const trimmed = String(text || "").trim();
  return trimmed.length >= 5 && trimmed.length <= 100;
};

export default function Checkout() {
  const {
    cartItems,
    appliedCouponCode,
    appliedCoupon,
    appliedCouponDiscount,
    setAppliedCoupon,
    removeCartItemsByProductIds,
    clearCart,
  } = useCart();
  const { prescriptionData, openPrescriptionModal, savePrescription, clearPrescription } =
    usePrescriptionModal();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkoutContact, currentUser } = useAuth();
  const [buyNowItem, setBuyNowItem] = useState(() => {
    try {
      const stored = sessionStorage.getItem("happypet_buy_now");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const isBuyNowCheckout =
    new URLSearchParams(location.search).get("buyNow") === "1" &&
    buyNowItem?.product;
  const checkoutItems = useMemo(
    () => (isBuyNowCheckout ? [buyNowItem] : cartItems),
    [isBuyNowCheckout, buyNowItem, cartItems],
  );
  const requiresRxForOrder = useMemo(
    () => checkoutItems.some((item) => isPrescriptionRequired(item?.product)),
    [checkoutItems],
  );
  const rxRequiredItems = useMemo(
    () => checkoutItems.filter((item) => isPrescriptionRequired(item?.product)),
    [checkoutItems],
  );
  const vetRestrictedItems = useMemo(
    () => checkoutItems.filter((item) => lacksVetAccess(item?.product, currentUser)),
    [checkoutItems, currentUser],
  );
  const hasVetRestriction = vetRestrictedItems.length > 0;
  const paymentStepNumber = requiresRxForOrder ? 4 : 3;

  const [rxSelectedFiles, setRxSelectedFiles] = useState([]);
  const [rxIsDragging, setRxIsDragging] = useState(false);
  const [rxIsUploading, setRxIsUploading] = useState(false);
  const rxFileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processRxFiles = (files) => {
    if (!authApi.getSession() && !currentUser && !contactInfo.email) {
      toast.error("Please log in to your account or provide contact email to upload a prescription.", {
        icon: "🔒",
      });
      return;
    }
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const promises = [];

    for (const file of fileArray) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit and was skipped.`);
        continue;
      }

      const fileId = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;

      if (file.type.startsWith("image/")) {
        const p = new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: fileId,
              file,
              name: file.name,
              size: file.size,
              type: file.type,
              preview: e.target.result,
            });
          };
          reader.readAsDataURL(file);
        });
        promises.push(p);
      } else {
        promises.push(
          Promise.resolve({
            id: fileId,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: "",
          }),
        );
      }
    }

    Promise.all(promises).then(async (newFileObjs) => {
      if (newFileObjs.length > 0) {
        setRxSelectedFiles((prev) => [...prev, ...newFileObjs]);
        toast.success(`Attached ${newFileObjs.length} prescription file(s).`);

        try {
          setRxIsUploading(true);
          const uploadPromises = newFileObjs.map((fObj) =>
            prescriptionApi.uploadPrescription(fObj.file),
          );
          const remoteResults = await Promise.all(uploadPromises);
          const firstRemote = remoteResults[0];
          const mainUrl =
            firstRemote?.url ||
            (typeof firstRemote === "string" ? firstRemote : null);

          const uploadedFilesInfo = newFileObjs.map((fObj, idx) => ({
            fileName: fObj.name,
            fileType: fObj.type,
            filePreview: fObj.preview || null,
            remoteData: remoteResults[idx],
          }));

          savePrescription({
            fileName: uploadedFilesInfo[0]?.fileName || "prescription.pdf",
            fileType: uploadedFilesInfo[0]?.fileType || "",
            filePreview: uploadedFilesInfo[0]?.filePreview || null,
            files: uploadedFilesInfo,
            remoteData: remoteResults,
            prescriptionUrl: mainUrl,
            url: mainUrl,
          });

          toast.success(
            `${uploadedFilesInfo.length} prescription file(s) uploaded successfully!`,
          );
        } catch (err) {
          console.error("Auto prescription upload error:", err);
        } finally {
          setRxIsUploading(false);
        }
      }
    });
  };

  const handleRemoveRxFile = (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRxSelectedFiles((prev) => prev.filter((item) => item.id !== id));
    if (rxFileInputRef.current) rxFileInputRef.current.value = "";
    toast.success("Prescription file removed.");
  };

  const handleContinueFromPrescription = async () => {
    const hasSavedRx = Boolean(
      prescriptionData.fileName ||
        prescriptionData.files?.length ||
        prescriptionData.vetClinic ||
        prescriptionData.isUploadLater,
    );

    if (rxSelectedFiles.length === 0 && !hasSavedRx) {
      toast.error(
        "Please upload at least one prescription document or select an option to proceed.",
      );
      return;
    }

    if (rxSelectedFiles.length > 0) {
      if (!authApi.getSession()) {
        toast.error(
          "Please log in to your account to upload your prescription.",
          { icon: "🔒" },
        );
        return;
      }
      try {
        setRxIsUploading(true);
        const uploadPromises = rxSelectedFiles.map((fObj) =>
          prescriptionApi.uploadPrescription(fObj.file),
        );
        const remoteResults = await Promise.all(uploadPromises);

        const uploadedFilesInfo = rxSelectedFiles.map((fObj, idx) => ({
          fileName: fObj.name,
          fileType: fObj.type,
          filePreview: fObj.preview || null,
          remoteData: remoteResults[idx],
        }));

        const firstRemote = remoteResults[0];
        const mainUrl =
          firstRemote?.url ||
          (typeof firstRemote === "string" ? firstRemote : null);

        savePrescription({
          fileName: uploadedFilesInfo[0]?.fileName || "prescription.pdf",
          fileType: uploadedFilesInfo[0]?.fileType || "",
          filePreview: uploadedFilesInfo[0]?.filePreview || null,
          files: uploadedFilesInfo,
          remoteData: remoteResults,
          prescriptionUrl: mainUrl,
          url: mainUrl,
        });

        toast.success(
          `${uploadedFilesInfo.length} prescription file(s) uploaded successfully!`,
        );
      } catch (err) {
        console.error("Prescription upload error:", err);
        const errMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to upload prescription.";
        toast.error(errMsg);
        setRxIsUploading(false);
        return;
      } finally {
        setRxIsUploading(false);
      }
    }

    setCurrentStep(4);
  };
  const checkoutItemCount = checkoutItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const checkoutSubtotal = checkoutItems.reduce(
    (sum, item) => sum + Number(item.product.sellPrice || 0) * item.quantity,
    0,
  );

  const [promoInput, setPromoInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    let active = true;

    couponApi
      .list()
      .then((items) => {
        if (active) setAvailableCoupons(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        console.error("Failed to load coupons:", error);
        if (active) setAvailableCoupons([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const applyPromoCode = async (code) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setPromoInput(cleanCode);
    setIsApplyingPromo(true);
    try {
      const coupon = await couponApi.validate(cleanCode, checkoutSubtotal, 0);
      setAppliedCoupon(coupon);
      setPromoInput(coupon.code || cleanCode);
      toast.success(`Promo code "${coupon.code}" applied!`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Promo code is not valid.");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleApplyPromo = async () => {
    await applyPromoCode(promoInput);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoInput("");
    toast.success("Promo code removed.");
  };

  const handlePromoKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      applyPromoCode(promoInput);
    }
  };

  const [isSuccess, setIsSuccess] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [activeTax, setActiveTax] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("");
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const confirmStripePaymentRef = useRef(null);

  // Contact Information Form Fields (Step 1)
  const [contactInfo, setContactInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  // Auto-fill contact info if user is logged in
  useEffect(() => {
    if (currentUser) {
      queueMicrotask(() => {
        setContactInfo({
          fullName: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
        });
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    } else {
      const blockedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (blockedReason) {
        toast.error(blockedReason);
        setCheckoutError(blockedReason);
      }
    }

    let active = true;

    api
      .get(`/customer-panel/taxes/active?_=${Date.now()}`)
      .then((response) => {
        const taxData = response.data?.data || response.data || null;
        if (active) {
          setActiveTax(taxData);
        }
      })
      .catch(() => {
        if (active) setActiveTax(null);
      });

    return () => {
      active = false;
    };
  }, [navigate, currentUser]);

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
          setShippingLabel(
            matched?.label || matched?.name || matched?.title || "",
          );
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

  // Saved Addresses list state
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem("happypet_addresses");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected address state
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const def = addresses.find((address) => address.isDefault);
    return def ? def.id : addresses[0]?.id || "";
  });

  // Sync addresses to localStorage
  useEffect(() => {
    localStorage.setItem("happypet_addresses", JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    accountApi
      .getAddresses()
      .then((serverAddresses) => {
        if (!isMounted) return;
        const normalized = withAddressIds(serverAddresses);
        setAddresses(normalized);
        const defaultAddress =
          normalized.find((address) => address.isDefault) || normalized[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
      })
      .catch((error) => {
        console.error("Failed to load checkout addresses:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // New address form state
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });

  // Payment Method state (Always defaults to online)
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Wizard flow step state (1 = Contact Info, 2 = Shipping Address, 3 = Payment Method)
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      name: contactInfo.fullName || currentUser?.name || "",
      phone: contactInfo.phone || currentUser?.phone || "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
    });
    setIsAddingNewAddress(true);
  };

  const handleOpenEditAddress = (e, addr) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name || "",
      phone: addr.phone || contactInfo.phone || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "United States",
      isDefault: Boolean(addr.isDefault),
    });
    setIsAddingNewAddress(true);
  };

  const handleDeleteSavedAddress = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this delivery address?")) return;
    try {
      if (currentUser) {
        const addressIndex = addresses.findIndex((addr) => addr.id === id);
        if (addressIndex >= 0) {
          const serverAddresses = await accountApi.removeAddress(addressIndex);
          const updated = withAddressIds(serverAddresses);
          setAddresses(updated);
          if (selectedAddressId === id) {
            const fallback = updated.find((a) => a.isDefault) || updated[0];
            setSelectedAddressId(fallback ? fallback.id : "");
          }
        }
      } else {
        const updated = addresses.filter((addr) => addr.id !== id);
        setAddresses(updated);
        if (selectedAddressId === id) {
          const fallback = updated.find((a) => a.isDefault) || updated[0];
          setSelectedAddressId(fallback ? fallback.id : "");
        }
      }
      toast.success("Address removed.");
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error(error.response?.data?.message || "Failed to delete address.");
    }
  };

  const handleSaveAddress = async (e) => {
    if (e) e.preventDefault();

    const name = String(addressForm.name || "").trim();
    const phoneDigits = String(addressForm.phone || "").replace(/\D/g, "");
    const addr = String(addressForm.address || "").trim();
    const city = String(addressForm.city || "").trim();
    const state = String(addressForm.state || "").trim();
    const zip = String(addressForm.zip || "").trim();

    if (name.length < 2 || name.length > 50) {
      toast.error("Please enter a valid full name (2 to 50 characters).", { icon: "⚠️" });
      return;
    }
    if (!addressForm.phone || phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.", { icon: "⚠️" });
      return;
    }
    if (addr.length < 5 || addr.length > 100) {
      toast.error("Please enter a valid street address (5 to 100 characters).", { icon: "⚠️" });
      return;
    }
    if (city.length < 2 || city.length > 50) {
      toast.error("Please enter a valid city name (2 to 50 characters).", { icon: "⚠️" });
      return;
    }
    if (state.length < 2 || state.length > 50) {
      toast.error("Please enter a valid state/province (2 to 50 characters).", { icon: "⚠️" });
      return;
    }
    if (zip.length < 3 || zip.length > 10) {
      toast.error("Please enter a valid ZIP/Postal code (3 to 10 characters).", { icon: "⚠️" });
      return;
    }

    const newAddress = {
      id: `addr_${Date.now()}`,
      name,
      phone: addressForm.phone,
      address: addr,
      city,
      state,
      zip,
      country: addressForm.country || "United States",
      isDefault: addresses.length === 0,
    };

    setIsSavingAddress(true);
    try {
      if (editingAddressId) {
        const addressIndex = addresses.findIndex((addr) => addr.id === editingAddressId);
        const existingAddress = addresses[addressIndex] || {};
        const payload = {
          ...existingAddress,
          name,
          phone: addressForm.phone,
          address: addr,
          city,
          state,
          zip,
          country: addressForm.country || "United States",
        };

        if (currentUser && addressIndex >= 0) {
          const serverAddresses = await accountApi.updateAddress(addressIndex, payload);
          const updatedAddresses = withAddressIds(serverAddresses);
          setAddresses(updatedAddresses);
          setSelectedAddressId(editingAddressId);
        } else {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddressId ? { ...a, ...payload } : a))
          );
        }
        toast.success("Address updated successfully!");
      } else {
        if (currentUser) {
          const serverAddresses = await accountApi.addAddress({
            name,
            phone: addressForm.phone,
            address: addr,
            city,
            state,
            zip,
            country: addressForm.country || "United States",
            isDefault: addresses.length === 0,
          });
          const updatedAddresses = withAddressIds(serverAddresses);
          setAddresses(updatedAddresses);
          const savedAddress =
            updatedAddresses[updatedAddresses.length - 1] || newAddress;
          setSelectedAddressId(savedAddress.id);
        } else {
          setAddresses((prev) => [...prev, newAddress]);
          setSelectedAddressId(newAddress.id);
        }
        toast.success("Address added successfully!");
      }
      setIsAddingNewAddress(false);
      setEditingAddressId(null);
    } catch (error) {
      console.error("Failed to save address:", error);
      toast.error(
        error.response?.data?.message || "Address could not be saved.",
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Calculations
  const activeTaxesList = useMemo(() => {
    if (!activeTax) return [];
    let raw = activeTax;
    if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.data !== undefined) {
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

  const discountAmount = appliedCouponDiscount;
  const taxableAmount = Math.max(checkoutSubtotal - discountAmount, 0);

  const totalTaxAmount = useMemo(() => {
    return activeTaxesList.reduce((sum, tax) => {
      const rate = Number(tax.rate ?? tax.taxRate ?? 0);
      return sum + Number(((taxableAmount * rate) / 100).toFixed(2));
    }, 0);
  }, [activeTaxesList, taxableAmount]);

  const grandTotal = taxableAmount + shippingCost + totalTaxAmount;
  const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
  const quoteSubtotal = Number(checkoutQuote?.subtotal ?? checkoutSubtotal);
  const quoteShippingCost = Number(checkoutQuote?.shipping ?? shippingCost);
  const quoteDiscountAmount = Number(checkoutQuote?.discount ?? discountAmount);
  const quoteTaxAmount = Number(checkoutQuote?.tax ?? totalTaxAmount);
  const quoteGrandTotal = Number(
    checkoutQuote?.total ??
      Math.max(
        0,
        quoteSubtotal - quoteDiscountAmount + quoteShippingCost + quoteTaxAmount,
      ),
  );

  const isContactInfoValid =
    validateFullName(contactInfo.fullName) &&
    validateEmail(contactInfo.email) &&
    validatePhone(contactInfo.phone);

  const handleStripeReady = useCallback((fn) => {
    confirmStripePaymentRef.current = fn;
  }, []);

  const ensureCheckoutSession = async () => {
    const enteredEmail = (contactInfo.email || "").trim().toLowerCase();
    const currentEmail = (currentUser?.email || authApi.getCustomer()?.email || "").trim().toLowerCase();

    if (currentUser && !currentUser.isGuest && currentEmail === enteredEmail) {
      return currentUser;
    }
    const existingCustomer = authApi.getCustomer();
    if (existingCustomer && !existingCustomer.isGuest && currentEmail === enteredEmail) {
      return existingCustomer;
    }

    try {
      return await checkoutContact({
        name: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone,
      });
    } catch (err) {
      const msg = typeof err.response?.data?.message === "string" ? err.response.data.message.toLowerCase() : "";
      const isBlocked =
        Boolean(currentUser) &&
        (Boolean(err.response?.data?.isBlocked) ||
          (err.response?.status === 403 &&
            (msg.includes("blocked") || msg.includes("account has been"))));
      if (isBlocked) {
        throw err;
      }
      console.warn("checkoutContact API failed, using guest contact session:", err);
      return {
        name: contactInfo.fullName,
        email: contactInfo.email,
        phone: contactInfo.phone,
        isGuest: true,
      };
    }
  };

  const getAddressNameParts = (address) => {
    const nameParts = address.name.trim().split(" ");
    return {
      firstName: nameParts[0] || address.name,
      lastName: nameParts.slice(1).join(" ") || "",
    };
  };

  const buildOrderPayload = useCallback(
    ({ paymentMethod: method, stripePaymentIntentId = null }) => {
      if (!selectedAddr) return null;
      const { firstName, lastName } = getAddressNameParts(selectedAddr);

      // Collect all prescription URLs from context/uploaded data and sessionStorage
      const rxUrls = [];
      if (prescriptionData) {
        if (prescriptionData.prescriptionUrl)
          rxUrls.push(prescriptionData.prescriptionUrl);
        if (prescriptionData.url) rxUrls.push(prescriptionData.url);
        if (prescriptionData.remoteData) {
          if (typeof prescriptionData.remoteData === "string") {
            rxUrls.push(prescriptionData.remoteData);
          } else if (prescriptionData.remoteData?.url) {
            rxUrls.push(prescriptionData.remoteData.url);
          } else if (Array.isArray(prescriptionData.remoteData)) {
            prescriptionData.remoteData.forEach((rd) => {
              if (typeof rd === "string") rxUrls.push(rd);
              else if (rd?.url) rxUrls.push(rd.url);
            });
          }
        }
        if (Array.isArray(prescriptionData.files)) {
          prescriptionData.files.forEach((f) => {
            if (typeof f === "string") rxUrls.push(f);
            else if (f?.remoteData) {
              if (typeof f.remoteData === "string") rxUrls.push(f.remoteData);
              else if (f.remoteData?.url) rxUrls.push(f.remoteData.url);
            }
          });
        }
      }

      try {
        const stored = sessionStorage.getItem("happypet_prescription_info");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.url) rxUrls.push(parsed.url);
          if (parsed.prescriptionUrl) rxUrls.push(parsed.prescriptionUrl);
          if (Array.isArray(parsed.urls)) rxUrls.push(...parsed.urls);
          if (Array.isArray(parsed.prescriptionUrls))
            rxUrls.push(...parsed.prescriptionUrls);
        }
      } catch {
        // Storage fallback
      }

      const uniqueRxUrls = [...new Set(rxUrls.filter(Boolean))];
      const mainPrescriptionUrl = uniqueRxUrls[0] || null;

      const payload = {
        items: checkoutItems.map((item, idx) => {
          const itemRxRequired = isPrescriptionRequired(item?.product);
          const itemRxUrl = uniqueRxUrls[idx] || mainPrescriptionUrl;

          return {
            productId: item.product.productId || item.product.id,
            variantId:
              item.product.variantId ||
              item.product.selectedVariantId ||
              item.product.selectedSize?.id,
            selectedVariantId:
              item.product.selectedVariantId ||
              item.product.variantId ||
              item.product.selectedSize?.id,
            variantLabel:
              item.product.variantLabel ||
              item.product.selectedOption ||
              item.product.selectedSize?.label,
            name: item.product.name,
            sku: item.product.sku,
            quantity: item.quantity,
            price: item.product.sellPrice,
            image: item.product.image,
            selectedSize: item.product.selectedSize,
            selectedColor: item.product.selectedColor,
            optionLabel: item.product.selectedOption,
            ...(itemRxRequired && mainPrescriptionUrl
              ? {
                  prescriptionRequired: true,
                  prescriptionUrl: itemRxUrl,
                  prescriptionUrls: [itemRxUrl],
                  prescription: itemRxUrl,
                }
              : itemRxRequired
                ? {
                    prescriptionRequired: true,
                  }
                : {}),
          };
        }),
        email: contactInfo.email || currentUser?.email || "",
        customerEmail: contactInfo.email || currentUser?.email || "",
        customerName: contactInfo.fullName || currentUser?.name || selectedAddr?.name || "",
        name: contactInfo.fullName || currentUser?.name || selectedAddr?.name || "",
        shippingAddress: {
          firstName,
          lastName,
          name: selectedAddr.name,
          email: contactInfo.email || currentUser?.email || "",
          phone: selectedAddr.phone || contactInfo.phone,
          address: selectedAddr.address,
          city: selectedAddr.city || "",
          state: selectedAddr.state || "",
          zip: selectedAddr.zip || "",
          country: selectedAddr.country || "",
        },
        phone: selectedAddr.phone || contactInfo.phone,
        subtotal: quoteSubtotal,
        shippingCost: quoteShippingCost,
        shipping: quoteShippingCost,
        tax: quoteTaxAmount,
        discount:
          appliedCoupon?.code || appliedCouponCode ? 0 : quoteDiscountAmount,
        promoDiscount: 0,
        couponDiscount: 0,
        couponCode: appliedCoupon?.code || appliedCouponCode || null,
        paymentMethod: method,
        stripePaymentIntentId,
        total: quoteGrandTotal,
        totalAmount: quoteGrandTotal,
      };

      if (mainPrescriptionUrl) {
        payload.prescriptionUrl = mainPrescriptionUrl;
        payload.prescriptionUrls = uniqueRxUrls.length
          ? uniqueRxUrls
          : [mainPrescriptionUrl];
        payload.prescription = mainPrescriptionUrl;
      }

      if (prescriptionData) {
        payload.prescriptionData = {
          fileName: prescriptionData.fileName || "",
          fileType: prescriptionData.fileType || "",
          vetClinic: prescriptionData.vetClinic || "",
          vetName: prescriptionData.vetName || "",
          vetPhone: prescriptionData.vetPhone || "",
          isUploadLater: Boolean(prescriptionData.isUploadLater),
          ...(mainPrescriptionUrl
            ? {
                url: mainPrescriptionUrl,
                urls: uniqueRxUrls.length
                  ? uniqueRxUrls
                  : [mainPrescriptionUrl],
              }
            : {}),
        };
      }

      return payload;
    },
    [
      checkoutItems,
      contactInfo.email,
      contactInfo.phone,
      appliedCoupon?.code,
      appliedCouponCode,
      quoteDiscountAmount,
      quoteGrandTotal,
      quoteShippingCost,
      quoteSubtotal,
      quoteTaxAmount,
      selectedAddr,
      prescriptionData,
      requiresRxForOrder,
    ],
  );

  const stripeCheckoutPayload = useMemo(
    () => buildOrderPayload({ paymentMethod: "stripe" }),
    [buildOrderPayload],
  );

  useEffect(() => {
    if (!stripeCheckoutPayload || currentStep < 3) {
      setCheckoutQuote(null);
      return;
    }

    let active = true;
    setIsQuoteLoading(true);
    setCheckoutError("");

    const localQuote = {
      subtotal: checkoutSubtotal,
      shipping: shippingCost,
      tax: totalTaxAmount,
      discount: 0,
      total: grandTotal,
    };

    orderApi
      .quoteOrder({
        ...stripeCheckoutPayload,
        subtotal: checkoutSubtotal,
        shippingCost,
        shipping: shippingCost,
        tax: totalTaxAmount,
        discount: 0,
        promoDiscount: 0,
        couponDiscount: 0,
        total: grandTotal,
        totalAmount: grandTotal,
      })
      .then((quote) => {
        if (!active) return;
        setCheckoutQuote(quote || localQuote);
        setCheckoutError("");
      })
      .catch((error) => {
        if (!active) return;
        console.warn(
          "quoteOrder backend warning (using calculated quote):",
          error?.response?.data?.message || error.message,
        );
        setCheckoutQuote(localQuote);
        setCheckoutError("");
      })
      .finally(() => {
        if (active) setIsQuoteLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    stripeCheckoutPayload,
    currentStep,
    checkoutSubtotal,
    shippingCost,
    totalTaxAmount,
    grandTotal,
  ]);

  const handleContactSubmit = async () => {
    if (hasVetRestriction) {
      toast.error("Your order contains items available only for verified veterinarians. Please verify your account.");
      navigate(currentUser ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (!validateFullName(contactInfo.fullName)) {
      toast.error("Please enter a valid full name (2 to 50 characters).", {
        icon: "⚠️",
      });
      return;
    }
    if (!validateEmail(contactInfo.email)) {
      toast.error("Please enter a valid email address (e.g. name@example.com).", {
        icon: "⚠️",
      });
      return;
    }
    if (!validatePhone(contactInfo.phone)) {
      toast.error("Please enter a valid 10-digit phone number.", {
        icon: "⚠️",
      });
      return;
    }
    setCheckoutError("");
    setIsProcessingOrder(true);

    try {
      await ensureCheckoutSession();
      setCurrentStep(2);
    } catch (err) {
      console.error("Checkout contact session failed:", err);
      const message =
        err.response?.data?.message || "Could not save contact information.";
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handleContinueToPayment = async () => {
    if (hasVetRestriction) {
      toast.error("Your order contains items available only for verified veterinarians. Please verify your account.");
      navigate(currentUser ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (!selectedAddressId) return;
    setCheckoutError("");
    setIsProcessingOrder(true);

    try {
      await ensureCheckoutSession();
      setCurrentStep(3);
    } catch (err) {
      console.error("Checkout contact session failed:", err);
      const message =
        err.response?.data?.message || "Could not create checkout session.";
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (hasVetRestriction) {
      toast.error("Your order contains items available only for verified veterinarians. Please verify your account.");
      navigate(currentUser ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    if (!isContactInfoValid) {
      toast.error("Please fill in your contact information first.", {
        icon: "⚠️",
      });
      return;
    }

    if (!selectedAddressId) {
      toast.error("Please select or add a delivery address.", {
        icon: "⚠️",
      });
      return;
    }

    if (!selectedAddr) {
      toast.error("Selected address could not be found.", {
        icon: "⚠️",
      });
      return;
    }

    if (isQuoteLoading || !checkoutQuote) {
      toast.error("Please wait while we verify your checkout total.");
      return;
    }

    if (requiresRxForOrder) {
      const hasPrescriptionUrl = Boolean(
        prescriptionData.url ||
          prescriptionData.prescriptionUrl ||
          prescriptionData.remoteData ||
          (prescriptionData.files && prescriptionData.files.length > 0),
      );

      if (
        rxSelectedFiles.length === 0 &&
        !hasPrescriptionUrl &&
        !prescriptionData.fileName &&
        !prescriptionData.vetClinic &&
        !prescriptionData.isUploadLater
      ) {
        toast.error(
          "Please complete the Upload Prescription step before placing your order.",
          {
            icon: "📋",
          },
        );
        setCurrentStep(3);
        return;
      }

      if (rxSelectedFiles.length > 0 && !hasPrescriptionUrl) {
        try {
          setRxIsUploading(true);
          const uploadPromises = rxSelectedFiles.map((fObj) =>
            prescriptionApi.uploadPrescription(fObj.file),
          );
          const remoteResults = await Promise.all(uploadPromises);

          const uploadedFilesInfo = rxSelectedFiles.map((fObj, idx) => ({
            fileName: fObj.name,
            fileType: fObj.type,
            filePreview: fObj.preview || null,
            remoteData: remoteResults[idx],
          }));

          const firstRemote = remoteResults[0];
          const mainUrl =
            firstRemote?.url ||
            (typeof firstRemote === "string" ? firstRemote : null);

          savePrescription({
            fileName: uploadedFilesInfo[0]?.fileName || "prescription.pdf",
            fileType: uploadedFilesInfo[0]?.fileType || "",
            filePreview: uploadedFilesInfo[0]?.filePreview || null,
            files: uploadedFilesInfo,
            remoteData: remoteResults,
            prescriptionUrl: mainUrl,
            url: mainUrl,
          });
        } catch (err) {
          console.error(
            "Prescription upload error before order placement:",
            err,
          );
          const errMsg =
            err.response?.data?.message ||
            err.message ||
            "Failed to upload prescription file.";
          toast.error(errMsg);
          setIsProcessingOrder(false);
          setRxIsUploading(false);
          return;
        } finally {
          setRxIsUploading(false);
        }
      }
    }

    setCheckoutError("");
    setIsProcessingOrder(true);

    let activeCustomer = currentUser;
    if (!activeCustomer) {
      try {
        activeCustomer = await ensureCheckoutSession();
      } catch (err) {
        console.error("Checkout contact session failed:", err);
        toast.error(
          err.response?.data?.message || "Could not create checkout session.",
        );
        setIsProcessingOrder(false);
        return;
      }
    }

    // Split name for compatibility with order receipt firstName/lastName schema
    const { firstName: fName, lastName: lName } =
      getAddressNameParts(selectedAddr);

    let createdOrder;
    try {
      let stripePaymentIntentId = null;

      if (paymentMethod === "online") {
        if (!confirmStripePaymentRef.current) {
          throw new Error(
            "Payment form is still loading. Please wait a moment and try again.",
          );
        }

        const { error, paymentIntent } =
          await confirmStripePaymentRef.current();
        if (error)
          throw new Error(error.message || "Payment failed. Please try again.");
        if (paymentIntent?.status !== "succeeded") {
          throw new Error("Payment was not completed.");
        }
        stripePaymentIntentId = paymentIntent.id;
      }

      createdOrder = await orderApi.createOrder(
        buildOrderPayload({
          paymentMethod: paymentMethod === "online" ? "stripe" : "cod",
          stripePaymentIntentId,
        }),
      );
    } catch (err) {
      console.error("Order creation failed:", err);
      const isBlocked =
        err.response?.status === 403 || Boolean(err.response?.data?.isBlocked);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Order could not be placed.";
      if (message.includes("is no longer available")) {
        const unavailableItem = checkoutItems.find((item) =>
          message.includes(item.product.name),
        );
        if (unavailableItem) {
          if (isBuyNowCheckout) {
            sessionStorage.removeItem("happypet_buy_now");
            setBuyNowItem(null);
          } else {
            removeCartItemsByProductIds(
              [
                unavailableItem.product.id,
                unavailableItem.product.productId,
              ].filter(Boolean),
            );
          }
          toast.error(
            `${unavailableItem.product.name} was removed from your cart because it is not active in the catalog.`,
          );
        }
      }
      setCheckoutError(message);
      toast.error(message);
      setIsProcessingOrder(false);
      return;
    }

    const orderNum =
      createdOrder?.id || createdOrder?.orderNumber || `HP-${Math.floor(100000 + Math.random() * 900000)}`;

    const fullOrder = {
      id: createdOrder?.id || orderNum,
      orderNumber: orderNum,
      createdAt: createdOrder?.createdAt || new Date().toISOString(),
      orderDate: createdOrder?.orderDate || new Date().toISOString(),
      status: createdOrder?.status || "processing",
      paymentStatus: paymentMethod === "online" ? "paid" : "pending",
      items: checkoutItems.map((item) => ({
        id: item.product?.id || item.product?.productId,
        productId: item.product?.productId || item.product?.id,
        name: item.product?.name,
        price: item.product?.sellPrice || item.product?.price,
        quantity: item.quantity,
        image: item.product?.image,
        selectedSize: item.product?.selectedSize,
        selectedColor: item.product?.selectedColor,
      })),
      shippingAddress: {
        firstName: fName,
        lastName: lName,
        name: selectedAddr.name,
        email: contactInfo.email || currentUser?.email,
        phone: selectedAddr.phone || contactInfo.phone,
        address: selectedAddr.address,
        city: selectedAddr.city || "",
        state: selectedAddr.state || "",
        zip: selectedAddr.zip || "",
      },
      email: contactInfo.email || currentUser?.email,
      customerEmail: contactInfo.email || currentUser?.email,
      customerName: contactInfo.fullName || currentUser?.name,
      totalAmount: quoteGrandTotal,
      total: quoteGrandTotal,
      customer: activeCustomer,
    };

    setCompletedOrder(fullOrder);

    try {
      localStorage.setItem("happypet_last_order", JSON.stringify(fullOrder));
      const existingStr = localStorage.getItem("happypet_orders");
      const existingList = existingStr ? JSON.parse(existingStr) : [];
      const updatedList = [
        fullOrder,
        ...existingList.filter(
          (o) =>
            (o.id || o.orderNumber) !== (fullOrder.id || fullOrder.orderNumber),
        ),
      ];
      localStorage.setItem("happypet_orders", JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Failed to save local order to storage:", e);
    }

    toast.success("Order placed successfully! Thank you for choosing us! 📦", {
      duration: 5000,
      icon: "🎉",
    });

    if (isBuyNowCheckout) {
      sessionStorage.removeItem("happypet_buy_now");
      setBuyNowItem(null);
    } else {
      clearCart();
    }
    setIsSuccess(true);
    setIsProcessingOrder(false);
  };

  if (isSuccess && completedOrder) {
    return (
      <main
        className="flex-grow py-16 select-none relative min-h-screen"
        style={{
          background:
            "linear-gradient(180deg, #FAF8FF 0%, #FFFBF7 50%, #FAF8FF 100%)",
        }}
      >
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-white border border-[#f0ebf8] rounded-[32px] p-8 md:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 border border-green-100 flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-brand-purple">
              Order Placed Successfully!
            </h2>
            <p className="text-sm text-brand-brown/70 mt-3 font-semibold">
              Thank you for choosing HappyPetRx! Your order is being processed.
            </p>

            <div className="inline-flex items-center bg-[#faf8ff] border border-brand-purple/10 px-4 py-2 rounded-xl text-brand-purple text-xs font-extrabold mt-6 shadow-sm">
              Order Number: {completedOrder.orderNumber}
            </div>
            {/* Account Created Alert */}
            <div className="bg-[#faf8ff] border border-brand-purple/10 text-brand-purple rounded-2xl p-5 md:p-6 mt-8 text-left shadow-xs flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 border border-green-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                <Check className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-brand-purple uppercase tracking-wider mb-1">
                  Account Created Successfully!
                </h4>
                <p className="text-xs leading-relaxed text-brand-brown/75 font-semibold">
                  A new secure account has been created using your email{" "}
                  <strong className="text-brand-purple">
                    {completedOrder.shippingAddress?.email || completedOrder.customerEmail || completedOrder.email}
                  </strong>{" "}
                  and mobile number{" "}
                  <strong className="text-brand-purple">
                    {completedOrder.shippingAddress?.phone || completedOrder.phone}
                  </strong>
                  . You can use this to track deliveries and log in securely.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-brand-purple/5 pt-8 text-left">
              <h3 className="text-xs font-extrabold text-brand-purple uppercase tracking-wider mb-4">
                Order Summary
              </h3>

              <div className="flex flex-col gap-4 mb-6">
                {(completedOrder.items || []).map((item, idx) => {
                  const product = item.product || item;
                  const price = Number(product.sellPrice ?? item.price ?? 0);
                  const qty = Number(item.quantity || 1);
                  return (
                    <div
                      key={product.id || product.productId || `item_${idx}`}
                      className="flex items-center justify-between gap-4 py-2 border-b border-brand-purple/[0.02]"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || "/placeholder.jpg"}
                          alt={product.name || "Product"}
                          className="w-12 h-12 rounded-xl object-cover bg-brand-cream/10 border border-brand-purple/5"
                        />
                        <div>
                          <span className="text-[9px] font-bold text-brand-purple/55 uppercase tracking-wider block">
                            {product.categoryName || "Product"}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-brand-purple line-clamp-1 max-w-[200px] sm:max-w-[300px]">
                            {product.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-brand-brown/50 font-bold">
                              Qty {qty} •
                            </span>
                            <span className="text-[11px] font-extrabold text-brand-purple">
                              ${price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold text-brand-purple">
                        ${(price * qty).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Shipping Destination Card */}
              <div className="bg-[#fffdfa] border border-brand-purple/5 rounded-2xl p-6 mb-8 shadow-xs">
                <div className="flex items-center gap-2 mb-4 border-b border-brand-purple/5 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-brand-purple/5 text-brand-purple flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-[12px] font-extrabold text-brand-purple/85 uppercase tracking-wider block">
                    Shipping Destination
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left text-xs font-semibold text-brand-brown/85">
                  <div className="flex flex-col gap-3">
                    <div>
                      <span className="text-[9px] font-bold text-brand-purple/50 uppercase tracking-wider block mb-0.5">
                        Recipient Name
                      </span>
                      <span className="text-sm font-extrabold text-brand-purple">
                        {completedOrder.shippingAddress?.firstName || completedOrder.customerName || ""}{" "}
                        {completedOrder.shippingAddress?.lastName || ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-brand-purple/50 uppercase tracking-wider block mb-0.5">
                        Contact Phone
                      </span>
                      <span className="text-xs font-bold text-brand-purple">
                        {completedOrder.shippingAddress?.phone || completedOrder.phone || ""}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-brand-purple/50 uppercase tracking-wider block mb-0.5">
                      Delivery Address
                    </span>
                    <div className="leading-relaxed">
                      <p className="text-xs font-bold text-brand-purple">
                        {completedOrder.shippingAddress?.address || completedOrder.address || ""}
                      </p>
                      <p className="text-xs font-semibold mt-0.5 text-brand-brown/80">
                        {completedOrder.shippingAddress?.city || ""},{" "}
                        {completedOrder.shippingAddress?.state || ""}{" "}
                        {completedOrder.shippingAddress?.zip || ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-baseline border-t border-brand-purple/5 pt-6 text-brand-purple">
                <span className="text-sm font-extrabold">Total Paid</span>
                <span className="text-3xl font-extrabold font-display">
                  ${completedOrder.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/products")}
              className="w-full flex items-center justify-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-sm py-4 px-6 rounded-2xl transition-all duration-300 shadow-md active:scale-97 mt-8 cursor-pointer group"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (checkoutItems.length === 0 && !isSuccess) {
    return (
      <main
        className="flex-grow py-16 select-none flex items-center justify-center min-h-[70vh]"
        style={{
          background:
            "linear-gradient(180deg, #FAF8FF 0%, #FFFBF7 50%, #FAF8FF 100%)",
        }}
      >
        <div className="bg-white border border-[#f0ebf8] rounded-[32px] p-12 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-peach/10 text-brand-peach flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-brand-purple">
            No items to checkout
          </h2>
          <p className="text-xs text-brand-brown/70 mt-2.5 font-semibold leading-relaxed">
            Your shopping cart is currently empty. Add products to your cart
            before proceeding.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all duration-300 shadow-md mt-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-grow py-12 select-none relative min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, #FAF8FF 0%, #FFFBF7 50%, #FAF8FF 100%)",
      }}
    >
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-10 text-left">
          <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] mb-3 flex items-center gap-1.5">
            <span>Home</span>
            <span className="text-brand-purple/20">/</span>
            <span className="text-brand-purple">Checkout</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-brand-purple tracking-tight leading-tight">
                Secure Checkout
              </h1>
              <p className="text-sm text-brand-brown/70 font-medium mt-2 leading-relaxed">
                Provide your shipment credentials and complete secure card
                checkout.
              </p>
            </div>

            <button
              onClick={() => navigate("/cart")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#e5ddf0] hover:border-brand-purple/20 text-brand-purple text-xs font-extrabold rounded-xl shadow-sm hover:shadow transition-all self-start sm:self-auto cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Review Cart</span>
            </button>
          </div>
        </div>

        {hasVetRestriction && (
          <div className="mb-8 max-w-4xl mx-auto rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  Verified Veterinarian Required
                </h4>
                <p className="text-xs font-semibold text-amber-700 mt-0.5">
                  Your order contains product(s) exclusive to verified veterinarians. Order placement is restricted until vet verification is approved.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(currentUser ? "/profile?tab=vet-verification" : "/login")}
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Apply for Verification
            </button>
          </div>
        )}

        {/* Dynamic Step Progress Indicator */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#f0ebf8] -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-brand-purple -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: requiresRxForOrder
                  ? currentStep === 4
                    ? "100%"
                    : currentStep === 3
                      ? "66%"
                      : currentStep === 2
                        ? "33%"
                        : "0%"
                  : currentStep === 3
                    ? "100%"
                    : currentStep === 2
                      ? "50%"
                      : "0%",
              }}
            />

            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                  currentStep >= 1
                    ? "bg-brand-purple text-white border-brand-purple"
                    : "bg-white text-brand-purple border-[#e5ddf0]"
                }`}
              >
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-purple mt-2 bg-white px-2">
                Contact Info
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                  currentStep >= 2
                    ? "bg-brand-purple text-white border-brand-purple"
                    : "bg-white text-brand-brown/40 border-[#e5ddf0]"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider mt-2 transition-colors bg-white px-2 ${
                  currentStep >= 2 ? "text-brand-purple" : "text-brand-brown/40"
                }`}
              >
                Shipping Address
              </span>
            </div>

            {/* Optional Step 3 (Upload Prescription) when requiresRxForOrder is TRUE */}
            {requiresRxForOrder && (
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                    currentStep >= 3
                      ? "bg-brand-purple text-white border-brand-purple"
                      : "bg-white text-brand-brown/40 border-[#e5ddf0]"
                  }`}
                >
                  {currentStep > 3 ? "✓" : "3"}
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider mt-2 transition-colors bg-white px-2 ${
                    currentStep >= 3
                      ? "text-brand-purple"
                      : "text-brand-brown/40"
                  }`}
                >
                  Upload Prescription
                </span>
              </div>
            )}

            {/* Final Step (Payment Method) */}
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                  currentStep >= paymentStepNumber
                    ? "bg-[#4b004b] text-white border-[#4b004b]"
                    : "bg-white text-brand-brown/40 border-[#e5ddf0]"
                }`}
              >
                {requiresRxForOrder ? "4" : "3"}
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider mt-2 transition-colors bg-white px-2 ${
                  currentStep >= paymentStepNumber
                    ? "text-brand-purple"
                    : "text-brand-brown/40"
                }`}
              >
                Payment Method
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {checkoutError && (
            <div className="lg:col-span-12 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {checkoutError}
            </div>
          )}

          {/* Left Column: Form Entries (7 Columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6 order-2 lg:order-1">
            {/* Contact Information Card */}
            <div className="bg-white border border-[#f0ebf8] rounded-[24px] shadow-sm overflow-hidden p-6 md:p-8 text-left">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-extrabold text-brand-purple uppercase tracking-wider flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center text-xs font-extrabold">
                    1
                  </span>
                  Contact Information
                </h2>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a855f7] hover:underline cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Info</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-brand-brown/65 uppercase tracking-wider text-left">
                      Full Name
                    </label>
                    <span className="text-[10px] text-brand-brown/50 font-medium">
                      Min 2, Max 50 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={contactInfo.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    disabled={currentStep > 1}
                    minLength={2}
                    maxLength={50}
                    className={`bg-[#faf8ff] focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed border ${
                      contactInfo.fullName && !validateFullName(contactInfo.fullName)
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#e5ddf0] focus:border-brand-purple/35"
                    } text-brand-purple text-xs font-semibold px-4 py-3.5 rounded-xl outline-none transition-all`}
                    required
                  />
                  {contactInfo.fullName && !validateFullName(contactInfo.fullName) && (
                    <span className="text-[11px] font-semibold text-red-500 text-left">
                      Full name must be between 2 and 50 characters.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 mt-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-brand-brown/65 uppercase tracking-wider text-left">
                      Email Address
                    </label>
                    <span className="text-[10px] text-brand-brown/50 font-medium">
                      Max 100 chars
                    </span>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={contactInfo.email}
                    onChange={handleInputChange}
                    placeholder="email@address.com"
                    disabled={currentStep > 1}
                    minLength={5}
                    maxLength={100}
                    className={`bg-[#faf8ff] focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed border ${
                      contactInfo.email && !validateEmail(contactInfo.email)
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#e5ddf0] focus:border-brand-purple/35"
                    } text-brand-purple text-xs font-semibold px-4 py-3.5 rounded-xl outline-none transition-all`}
                    required
                  />
                  {contactInfo.email && !validateEmail(contactInfo.email) && (
                    <span className="text-[11px] font-semibold text-red-500 text-left">
                      Please enter a valid email address (e.g. user@example.com).
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-brand-brown/65 uppercase tracking-wider text-left">
                      Phone Number
                    </label>
                    <span className="text-[10px] text-brand-brown/50 font-medium">
                      10 digits max
                    </span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={contactInfo.phone}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                    disabled={currentStep > 1}
                    minLength={10}
                    maxLength={10}
                    className={`bg-[#faf8ff] focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed border ${
                      contactInfo.phone && !validatePhone(contactInfo.phone)
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#e5ddf0] focus:border-brand-purple/35"
                    } text-brand-purple text-xs font-semibold px-4 py-3.5 rounded-xl outline-none transition-all`}
                    required
                  />
                  {contactInfo.phone && !validatePhone(contactInfo.phone) && (
                    <span className="text-[11px] font-semibold text-red-500 text-left">
                      Phone number must be exactly 10 digits.
                    </span>
                  )}
                </div>
              </div>

              {currentStep === 1 && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleContactSubmit}
                    disabled={!isContactInfoValid || isProcessingOrder}
                    className="inline-flex items-center gap-2 bg-brand-purple hover:bg-[#3a0038] disabled:bg-brand-brown/10 disabled:text-brand-brown/40 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>
                      {isProcessingOrder
                        ? "Saving Info..."
                        : "Continue to Shipping"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Address Card */}
            {currentStep >= 2 && (
              <div className="bg-white border border-[#f0ebf8] rounded-[24px] shadow-sm p-6 md:p-8 text-left transition-all duration-500 relative animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-extrabold text-brand-purple uppercase tracking-wider flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-[#a855f7]" />
                    Delivery Address
                  </h2>
                  {currentStep > 2 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a855f7] hover:underline cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Address</span>
                    </button>
                  )}
                </div>

                {!isAddingNewAddress ? (
                  <>
                    <div className="flex flex-col gap-4 mb-6">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() =>
                            currentStep === 2 && setSelectedAddressId(addr.id)
                          }
                          className={`border rounded-2xl p-5 flex items-start justify-between gap-4 cursor-pointer transition-all ${
                            selectedAddressId === addr.id
                              ? "border-[#4b004b] bg-[#faf8ff]/50"
                              : "border-[#e5ddf0] bg-white hover:border-brand-purple/20"
                          } ${currentStep > 2 ? "opacity-75 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="flex items-start mt-1 shrink-0">
                              <input
                                type="radio"
                                name="selectedAddress"
                                checked={selectedAddressId === addr.id}
                                disabled={currentStep > 2}
                                onChange={() =>
                                  currentStep === 2 &&
                                  setSelectedAddressId(addr.id)
                                }
                                className="w-4.5 h-4.5 text-brand-purple border-[#e5ddf0] focus:ring-brand-purple cursor-pointer"
                              />
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-sm font-extrabold text-brand-purple truncate">
                                {addr.name}
                              </p>
                              {addr.phone && (
                                <p className="text-xs font-semibold text-brand-brown/70 mt-0.5">
                                  {addr.phone}
                                </p>
                              )}
                              <p className="text-xs text-brand-brown/85 mt-1 leading-snug">
                                {addr.address}
                              </p>
                              <p className="text-xs text-brand-brown/70 mt-0.5">
                                {addr.city}, {addr.state} {addr.zip}{" "}
                                {addr.country ? `• ${addr.country}` : ""}
                              </p>
                            </div>
                          </div>

                          {currentStep === 2 && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditAddress(e, addr)}
                                title="Edit address"
                                className="p-2 rounded-xl text-brand-purple/60 hover:text-brand-purple hover:bg-brand-purple/5 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSavedAddress(e, addr.id)}
                                title="Delete address"
                                className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {currentStep === 2 && (
                      <button
                        type="button"
                        onClick={handleOpenAddAddress}
                        className="w-full border border-dashed border-[#e5ddf0] hover:border-brand-purple/35 rounded-2xl py-4 flex items-center justify-center gap-2 text-brand-purple text-xs font-extrabold transition-all hover:bg-[#faf8ff]/30 cursor-pointer mb-6"
                      >
                        <span>+ Add New Address</span>
                      </button>
                    )}

                    {currentStep === 2 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleContinueToPayment}
                          disabled={!selectedAddressId || isProcessingOrder}
                          className="inline-flex items-center gap-2 bg-brand-purple hover:bg-[#3a0038] disabled:bg-brand-brown/10 disabled:text-brand-brown/40 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md cursor-pointer disabled:cursor-not-allowed"
                        >
                          <span>
                            {isProcessingOrder
                              ? "Preparing..."
                              : requiresRxForOrder
                                ? "Continue to Prescription"
                                : "Continue to Payment"}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="border border-[#e5ddf0] rounded-2xl p-6 bg-white animate-fadeIn text-left">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-extrabold text-[#4b004b] uppercase tracking-wider">
                        {editingAddressId ? "Edit Delivery Address" : "Add New Address"}
                      </h3>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewAddress(false);
                            setEditingAddressId(null);
                          }}
                          className="text-[11px] font-bold text-brand-brown/60 hover:text-brand-purple transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-4">

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wider">
                              Full Name
                            </label>
                            <span className="text-[9px] text-brand-brown/50">
                              Min 2, Max 50 chars
                            </span>
                          </div>
                          <input
                            type="text"
                            name="name"
                            value={addressForm.name || ""}
                            onChange={handleAddressFormChange}
                            placeholder="John Smith"
                            minLength={2}
                            maxLength={50}
                            className={`bg-[#faf8ff] focus:bg-white border ${
                              (addressForm.name || "").trim().length > 0 &&
                              ((addressForm.name || "").trim().length < 2 || (addressForm.name || "").trim().length > 50)
                                ? "border-red-400 focus:border-red-500"
                                : "border-[#e5ddf0] focus:border-brand-purple/35"
                            } text-brand-purple text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all`}
                            required
                          />
                          {(addressForm.name || "").trim().length > 0 &&
                            ((addressForm.name || "").trim().length < 2 || (addressForm.name || "").trim().length > 50) && (
                              <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                Full name must be between 2 and 50 characters.
                              </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wider">
                              Phone Number
                            </label>
                            <span className="text-[9px] text-brand-brown/50">
                              Exact 10 digits
                            </span>
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            maxLength={10}
                            value={addressForm.phone || ""}
                            onChange={handleAddressFormChange}
                            placeholder="10 digit phone number"
                            className={`bg-[#faf8ff] focus:bg-white border ${
                              (addressForm.phone || "").trim().length > 0 &&
                              (addressForm.phone || "").replace(/\D/g, "").length !== 10
                                ? "border-red-400 focus:border-red-500"
                                : "border-[#e5ddf0] focus:border-brand-purple/35"
                            } text-brand-purple text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all`}
                            required
                          />
                          {(addressForm.phone || "").trim().length > 0 &&
                            (addressForm.phone || "").replace(/\D/g, "").length !== 10 && (
                              <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                Phone number must be exactly 10 digits.
                              </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center mb-0.5">
                          <label className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wider">
                            Street Address
                          </label>
                          <span className="text-[9px] text-brand-brown/50">
                            Min 5, Max 100 chars
                          </span>
                        </div>
                        <input
                          type="text"
                          name="address"
                          value={addressForm.address}
                          onChange={handleAddressFormChange}
                          placeholder="Street Address, P.O. box, apt"
                          minLength={5}
                          maxLength={100}
                          className={`bg-[#faf8ff] focus:bg-white border ${
                            addressForm.address.trim().length > 0 &&
                            (addressForm.address.trim().length < 5 || addressForm.address.trim().length > 100)
                              ? "border-red-400 focus:border-red-500"
                              : "border-[#e5ddf0] focus:border-brand-purple/35"
                          } text-brand-purple text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all`}
                          required
                        />
                        {addressForm.address.trim().length > 0 &&
                          (addressForm.address.trim().length < 5 || addressForm.address.trim().length > 100) && (
                            <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                              Address must be between 5 and 100 characters.
                            </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wider">
                              City
                            </label>
                            <span className="text-[9px] text-brand-brown/50">
                              Min 2, Max 50 chars
                            </span>
                          </div>
                          <input
                            type="text"
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressFormChange}
                            placeholder="e.g. Austin"
                            minLength={2}
                            maxLength={50}
                            className={`bg-[#faf8ff] focus:bg-white border ${
                              addressForm.city.trim().length > 0 &&
                              (addressForm.city.trim().length < 2 || addressForm.city.trim().length > 50)
                                ? "border-red-400 focus:border-red-500"
                                : "border-[#e5ddf0] focus:border-brand-purple/35"
                            } text-brand-purple text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all`}
                            required
                          />
                          {addressForm.city.trim().length > 0 &&
                            (addressForm.city.trim().length < 2 || addressForm.city.trim().length > 50) && (
                              <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                City must be between 2 and 50 characters.
                              </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wider">
                              State / Province
                            </label>
                            <span className="text-[9px] text-brand-brown/50">
                              Min 2, Max 50 chars
                            </span>
                          </div>
                          <input
                            type="text"
                            name="state"
                            value={addressForm.state}
                            onChange={handleAddressFormChange}
                            placeholder="e.g. TX"
                            minLength={2}
                            maxLength={50}
                            className={`bg-[#faf8ff] focus:bg-white border ${
                              addressForm.state.trim().length > 0 &&
                              (addressForm.state.trim().length < 2 || addressForm.state.trim().length > 50)
                                ? "border-red-400 focus:border-red-500"
                                : "border-[#e5ddf0] focus:border-brand-purple/35"
                            } text-brand-purple text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all`}
                            required
                          />
                          {addressForm.state.trim().length > 0 &&
                            (addressForm.state.trim().length < 2 || addressForm.state.trim().length > 50) && (
                              <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                State must be between 2 and 50 characters.
                              </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wider">
                              ZIP / Postal Code
                            </label>
                            <span className="text-[9px] text-brand-brown/50">
                              Min 3, Max 10 chars
                            </span>
                          </div>
                          <input
                            type="text"
                            name="zip"
                            value={addressForm.zip}
                            onChange={handleAddressFormChange}
                            placeholder="e.g. 78701"
                            minLength={3}
                            maxLength={10}
                            className={`bg-[#faf8ff] focus:bg-white border ${
                              addressForm.zip.trim().length > 0 &&
                              (addressForm.zip.trim().length < 3 || addressForm.zip.trim().length > 10)
                                ? "border-red-400 focus:border-red-500"
                                : "border-[#e5ddf0] focus:border-brand-purple/35"
                            } text-brand-purple text-xs font-semibold px-4 py-3 rounded-xl outline-none transition-all`}
                            required
                          />
                          {addressForm.zip.trim().length > 0 &&
                            (addressForm.zip.trim().length < 3 || addressForm.zip.trim().length > 10) && (
                              <span className="text-[10px] font-semibold text-red-500 mt-0.5">
                                ZIP code must be between 3 and 10 characters.
                              </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-brand-purple/70 uppercase tracking-wider mb-0.5">
                            Country
                          </label>
                          <CountryDropdown
                            value={addressForm.country || "United States"}
                            dropUp={true}
                            onChange={(c) =>
                              setAddressForm((prev) => ({ ...prev, country: c }))
                            }
                            className="w-full px-4 py-3 bg-[#faf8ff] focus:bg-white border border-[#e5ddf0] focus:border-brand-purple/35 text-brand-purple text-xs font-semibold rounded-xl outline-none transition-all cursor-pointer flex items-center justify-between select-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mt-2">
                        <button
                          type="button"
                          onClick={handleSaveAddress}
                          disabled={isSavingAddress}
                          className="flex-1 bg-[#1e3a60] hover:bg-[#12253f] disabled:opacity-50 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-97 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {isSavingAddress
                            ? "Saving..."
                            : editingAddressId
                              ? "Update Address"
                              : "Save Address"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewAddress(false);
                            setEditingAddressId(null);
                          }}
                          className="flex-1 bg-white border border-[#e5ddf0] hover:border-brand-purple/20 text-brand-brown/70 font-bold text-xs py-3.5 px-6 rounded-xl transition-all active:scale-97 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 Card: Upload Prescription (Only if Rx Required) */}
            {requiresRxForOrder && currentStep >= 3 && (
              <div className="bg-white border border-[#f0ebf8] rounded-[24px] shadow-sm p-6 md:p-8 text-left transition-all duration-500 relative animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-extrabold text-brand-purple uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center text-xs font-extrabold">
                      3
                    </span>
                    <Stethoscope className="w-5 h-5 text-[#a855f7]" />
                    Upload Prescription
                  </h2>
                  {currentStep > 3 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#a855f7] hover:underline cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Prescription</span>
                    </button>
                  )}
                </div>

                {!authApi.getSession() && (
                  <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        Please log in to your account to upload a prescription
                        document.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="text-xs font-extrabold text-white bg-brand-purple hover:bg-[#3a0038] px-3.5 py-1.5 rounded-xl shadow-xs shrink-0 cursor-pointer transition-all"
                    >
                      Log In
                    </button>
                  </div>
                )}

                {/* Items Requiring Prescription UI List */}
                {rxRequiredItems.length > 0 && (
                  <div className="bg-[#FAF8FF] border border-[#e8dff5] rounded-2xl p-4 sm:p-5 mb-6 text-left">
                    {/* Header Badges */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#a855f7] bg-[#a855f7]/10 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                        <Stethoscope className="w-3.5 h-3.5" />
                        Rx Prescription Needed
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-brand-purple mt-1">
                        {rxRequiredItems.length}{" "}
                        {rxRequiredItems.length === 1 ? "Item" : "Items"} in
                        your order
                      </h4>
                    </div>

                    <p className="text-xs text-brand-brown/70 font-medium mb-4 leading-relaxed">
                      The following medication(s) require a valid veterinarian
                      prescription file before we can process and dispatch your
                      order:
                    </p>

                    <div className="space-y-3">
                      {rxRequiredItems.map((item, idx) => {
                        const prod = item.product || {};
                        const prodImg =
                          prod.image ||
                          prod.images?.[0] ||
                          "/placeholder-product.png";
                        const brandLabel = prod.brand || "HAPPY PETRX";
                        return (
                          <div
                            key={prod.id || idx}
                            className="bg-white border border-[#f0ebf8] rounded-2xl p-3.5 sm:p-4 shadow-2xs transition-all hover:border-brand-purple/20 flex items-start sm:items-center gap-3.5"
                          >
                            <img
                              src={prodImg}
                              alt={prod.name}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-brand-purple/10 bg-[#faf8ff] shrink-0 p-0.5"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&auto=format&fit=crop&q=80";
                              }}
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <span className="text-[9px] font-extrabold text-brand-purple/50 uppercase tracking-widest block mb-1">
                                {brandLabel}
                              </span>

                              <div className="mb-1.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                                  <FileText className="w-2.5 h-2.5" />
                                  Prescription Required
                                </span>
                              </div>

                              <h5 className="text-xs sm:text-sm font-extrabold text-brand-purple leading-snug mb-2 break-words">
                                {prod.name}
                              </h5>

                              <div className="flex items-center justify-between gap-2 border-t border-[#f8f5fc] pt-1.5">
                                <span className="text-xs font-bold text-brand-brown/70">
                                  Qty: {item.quantity}
                                </span>
                                <span className="text-xs sm:text-sm font-extrabold text-brand-purple">
                                  $
                                  {(
                                    Number(prod.sellPrice || prod.price || 0) *
                                    item.quantity
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-brand-purple uppercase tracking-wider">
                      Upload Prescription Scan(s) / Document(s)
                    </label>
                    <span className="text-[11px] font-semibold text-brand-brown/60">
                      Multiple files allowed
                    </span>
                  </div>

                  <input
                    ref={rxFileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    disabled={currentStep > 3}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        processRxFiles(e.target.files);
                      }
                    }}
                    className="hidden"
                  />

                  {rxSelectedFiles.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rxSelectedFiles.map((fileObj) => (
                          <div
                            key={fileObj.id}
                            className="flex items-center justify-between gap-3 p-3 bg-green-50/60 border border-green-300/80 rounded-xl transition-all shadow-2xs hover:shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {fileObj.preview ? (
                                <img
                                  src={fileObj.preview}
                                  alt={fileObj.name}
                                  className="w-11 h-11 rounded-lg object-cover border border-green-300 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                  <FileCheck className="w-5 h-5" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-extrabold text-green-700 bg-green-200/80 px-2 py-0.5 rounded-full inline-block mb-0.5">
                                  Prescription Attached
                                </span>
                                <p className="text-xs font-bold text-brand-purple truncate">
                                  {fileObj.name}
                                </p>
                                <p className="text-[10px] font-semibold text-brand-brown/60">
                                  {formatFileSize(fileObj.size)}
                                </p>
                              </div>
                            </div>
                            {currentStep === 3 && (
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleRemoveRxFile(fileObj.id, e)
                                }
                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors shrink-0 cursor-pointer"
                                title="Remove this file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {currentStep === 3 && (
                        <button
                          type="button"
                          onClick={() => rxFileInputRef.current?.click()}
                          className="w-full py-2.5 px-4 border-2 border-dashed border-brand-purple/20 bg-[#FAF8FF] hover:border-brand-purple hover:bg-brand-purple/5 text-brand-purple font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>+ Upload Another Prescription File</span>
                        </button>
                      )}
                    </div>
                  ) : prescriptionData.fileName ||
                    prescriptionData.files?.length ? (
                    <div className="space-y-3">
                      {(prescriptionData.files &&
                      prescriptionData.files.length > 0
                        ? prescriptionData.files
                        : [
                            {
                              fileName: prescriptionData.fileName,
                              filePreview: prescriptionData.filePreview,
                            },
                          ]
                      ).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 p-3 bg-green-50/60 border border-green-300/80 rounded-xl"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {item.filePreview ? (
                              <img
                                src={item.filePreview}
                                alt={item.fileName}
                                className="w-11 h-11 rounded-lg object-cover border border-green-300 shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                <FileCheck className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] font-extrabold text-green-700 bg-green-200/80 px-2 py-0.5 rounded-full inline-block mb-0.5">
                                Prescription Uploaded
                              </span>
                              <p className="text-xs font-bold text-brand-purple truncate">
                                {item.fileName || "prescription_file.pdf"}
                              </p>
                            </div>
                          </div>
                          {currentStep === 3 && (
                            <button
                              type="button"
                              onClick={() => {
                                clearPrescription();
                                setRxSelectedFiles([]);
                              }}
                              className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
                              title="Remove prescription"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {currentStep === 3 && (
                        <button
                          type="button"
                          onClick={() => rxFileInputRef.current?.click()}
                          className="w-full py-2.5 px-4 border-2 border-dashed border-brand-purple/20 bg-[#FAF8FF] hover:border-brand-purple hover:bg-brand-purple/5 text-brand-purple font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>+ Add More Prescription Files</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setRxIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setRxIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setRxIsDragging(false);
                        if (
                          e.dataTransfer.files &&
                          e.dataTransfer.files.length > 0
                        ) {
                          processRxFiles(e.dataTransfer.files);
                        }
                      }}
                      onClick={() =>
                        currentStep === 3 && rxFileInputRef.current?.click()
                      }
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 relative ${
                        currentStep === 3 ? "cursor-pointer" : "cursor-default"
                      } ${
                        rxIsDragging
                          ? "border-brand-purple bg-brand-purple/10"
                          : "border-brand-purple/20 bg-[#FAF8FF] hover:border-brand-purple hover:bg-brand-purple/5"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-12 h-12 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center mb-2.5">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-xs sm:text-sm font-extrabold text-brand-purple">
                          Click to browse or drag & drop prescription file(s)
                        </p>
                        <p className="text-[11px] text-brand-brown/60 font-medium mt-1">
                          Supports multiple files: JPG, PNG, WEBP, or PDF (Max
                          10MB per file)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {currentStep === 3 && (
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={handleContinueFromPrescription}
                      disabled={rxIsUploading}
                      className="inline-flex items-center gap-2 bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {rxIsUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading Prescription...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Payment</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Card */}
            {currentStep >= paymentStepNumber && (
              <div className="bg-white border border-[#f0ebf8] rounded-[24px] shadow-sm p-6 md:p-8 text-left transition-all duration-500 relative animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-extrabold text-brand-purple uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center text-xs font-extrabold">
                      {paymentStepNumber}
                    </span>
                    <CreditCard className="w-5 h-5 text-[#a855f7]" />
                    Payment Method
                  </h2>
                  <Lock className="w-4 h-4 text-brand-brown/40" />
                </div>

                <div className="border border-[#4b004b] bg-[#faf8ff]/50 rounded-2xl p-5 flex items-center gap-4 cursor-pointer">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="pay-online"
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === "online"}
                      onChange={() => setPaymentMethod("online")}
                      className="w-4.5 h-4.5 text-brand-purple border-[#e5ddf0] focus:ring-brand-purple cursor-pointer"
                    />
                  </div>
                  <label
                    htmlFor="pay-online"
                    className="cursor-pointer text-left"
                  >
                    <span className="text-sm font-extrabold text-brand-purple block">
                      Pay Online
                    </span>
                    <span className="text-[11px] text-brand-brown/60 font-semibold block mt-0.5">
                      Card, Apple Pay, Google Pay
                    </span>
                  </label>
                </div>

                <StripePaymentElement
                  active={
                    paymentMethod === "online" &&
                    !isQuoteLoading &&
                    !checkoutError
                  }
                  total={quoteGrandTotal}
                  checkoutPayload={stripeCheckoutPayload}
                  onReady={handleStripeReady}
                />
                {isQuoteLoading && (
                  <p className="mt-3 text-xs font-bold text-brand-brown/60">
                    Verifying checkout total...
                  </p>
                )}

                {/* Submit / Pay Now Button aligned directly in Payment Method step */}
                <div className="mt-6 pt-4 border-t border-brand-purple/5">
                  <button
                    type="submit"
                    disabled={
                      isProcessingOrder ||
                      isQuoteLoading ||
                      Boolean(checkoutError)
                    }
                    className="w-full flex items-center justify-center gap-2 bg-brand-purple hover:bg-[#3a0038] disabled:bg-brand-brown/10 disabled:text-brand-brown/40 text-white font-bold text-sm py-4 px-6 rounded-xl transition-all duration-300 shadow-md active:scale-97 cursor-pointer disabled:cursor-not-allowed group"
                  >
                    <ShieldCheck className="w-4.5 h-4.5" />
                    <span>
                      {isProcessingOrder
                        ? "Processing Payment..."
                        : isQuoteLoading
                          ? "Verifying Total..."
                          : "Pay Now"}
                    </span>
                  </button>
                  <p className="text-[10px] text-brand-brown/50 font-semibold text-center mt-3">
                    By placing your order, you agree to our{" "}
                    <Link
                      to="/terms-conditions"
                      className="text-[#d97706] hover:underline font-bold"
                    >
                      Terms & Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      className="text-[#d97706] hover:underline font-bold"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Order Preview (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-8 order-1 lg:order-2">


            {/* Purchase Item Details card */}
            <div className="bg-white border border-[#f0ebf8] rounded-[24px] p-6 text-left shadow-sm max-h-[350px] overflow-y-auto scrollbar-none">
              <h4 className="text-xs font-extrabold text-brand-purple uppercase tracking-wider mb-4 border-b border-brand-purple/5 pb-3">
                Order Items ({checkoutItemCount})
              </h4>
              <div className="flex flex-col gap-4">
                {checkoutItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-11 h-11 rounded-lg object-cover bg-brand-cream/10 border border-brand-purple/5"
                      />
                      <div>
                        <span className="text-[9px] font-bold text-[#a855f7] bg-brand-purple/5 px-2 py-0.5 rounded uppercase tracking-wider block w-max">
                          {item.product.categoryName}
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-brand-purple block truncate mt-1 max-w-[170px]">
                          {item.product.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-brand-brown/50 font-bold">
                            Qty {item.quantity} •
                          </span>
                          <span className="text-[11px] font-extrabold text-brand-purple">
                            ${item.product.sellPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-brand-purple">
                      ${(item.product.sellPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total breakdown: Styled Light-Themed */}
            <div className="bg-white border border-[#f0ebf8] rounded-[24px] p-6 shadow-[0_8px_30px_rgba(75,0,75,0.015)]">
              <h3 className="text-xs font-extrabold tracking-wider uppercase mb-6 text-left text-brand-purple">
                Summary details
              </h3>

              {/* Coupon Form Card Nested Inside */}
              <div className="bg-[#faf8ff] border border-brand-purple/5 rounded-[14px] p-5 mb-6 shadow-inner text-left">
                <h4 className="text-[11px] font-bold text-brand-purple uppercase tracking-wider mb-3 text-left">
                  Have a Promo Code?
                </h4>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/40" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={handlePromoKeyDown}
                      placeholder="e.g. WELCOME10"
                      className="w-full bg-white border border-brand-purple/10 focus:border-brand-purple/35 text-brand-purple placeholder:text-brand-brown/30 pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo}
                    className="bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex-shrink-0 outline-none disabled:opacity-60"
                  >
                    {isApplyingPromo ? "Checking" : "Apply"}
                  </button>
                </div>
                {appliedCouponCode && (
                  <div className="flex items-center justify-between gap-3 text-[11px] text-green-600 font-bold mt-2.5">
                    <span>
                      Active code: <strong>{appliedCouponCode}</strong>
                      {quoteDiscountAmount
                        ? ` (-$${quoteDiscountAmount.toFixed(2)})`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-red-500 transition hover:border-red-200 hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="mt-4 border-t border-brand-purple/5 pt-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-purple/55 text-left">
                    Available Coupons
                  </p>
                  {availableCoupons.length ? (
                    <div className="mt-2 grid gap-2">
                      {availableCoupons.map((coupon) => (
                        <button
                          key={coupon.id || coupon.code}
                          type="button"
                          onClick={() => {
                            setPromoInput(coupon.code);
                            applyPromoCode(coupon.code);
                          }}
                          disabled={isApplyingPromo}
                          className="flex items-center justify-between rounded-xl bg-white border border-brand-purple/10 px-3 py-2 text-left text-[11px] font-extrabold text-brand-purple transition hover:border-brand-purple/25 disabled:opacity-60 cursor-pointer"
                        >
                          <span>{coupon.code}</span>
                          <span className="text-[#e76e55]">
                            {coupon.type === "percentage"
                              ? `${Number(coupon.value || 0)}% OFF`
                              : `$${Number(coupon.value || 0).toFixed(2)} OFF`}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] font-semibold text-brand-brown/60 text-left">
                      No active coupons for this store. Add one from Admin &gt;
                      Coupons.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 text-sm font-medium text-brand-brown/70 border-b border-brand-purple/5 pb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-brand-purple font-extrabold">
                    ${quoteSubtotal.toFixed(2)}
                  </span>
                </div>
                {quoteDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#e76e55] font-extrabold">
                    <span>
                      Discount
                      {appliedCouponCode ? ` (${appliedCouponCode})` : ""}
                    </span>
                    <span>-${quoteDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                {(shippingLabel || quoteShippingCost > 0) ? (
                  <div className="flex justify-between">
                    <span>{shippingLabel || "Shipping"}</span>
                    <span className="text-brand-purple font-extrabold">
                      ${quoteShippingCost.toFixed(2)}
                    </span>
                  </div>
                ) : null}
                {activeTaxesList.map((tax, idx) => {
                  const rate = Number(tax.rate ?? tax.taxRate ?? 0);
                  if (rate <= 0) return null;
                  const name = tax.name || tax.title || tax.taxName || "Tax";
                  const amt =
                    checkoutQuote?.tax != null && activeTaxesList.length === 1
                      ? Number(checkoutQuote.tax)
                      : Number(((taxableAmount * rate) / 100).toFixed(2));
                  return (
                    <div
                      key={tax.id || tax._id || idx}
                      className="flex justify-between"
                    >
                      <span>
                        {name} ({rate.toFixed(2).replace(/\.?0+$/, "")}%)
                      </span>
                      <span className="text-brand-purple font-extrabold">
                        ${amt.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-6 mb-8 text-brand-purple">
                <span className="text-sm font-extrabold">Total</span>
                <span className="text-3xl font-extrabold font-display">
                  ${quoteGrandTotal.toFixed(2)}
                </span>
              </div>

              {/* Secure Checkout Trust Note */}
              <div className="flex items-center gap-2 text-[11px] text-brand-brown/60 font-semibold border-t border-brand-purple/5 pt-4">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>SSL Encrypted secure checkout</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
