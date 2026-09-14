import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck, ChevronRight, ArrowLeft, Check, Package,
  MapPin, CreditCard, User, Phone, Mail, Home, Plus,
  Trash2, Edit2, Tag, X, Lock, AlertCircle, Loader2, ShieldAlert
} from "lucide-react";
import { AppContext } from "../../context/AppContext";
import { AuthContext } from "../../context/AuthContext";
import { OrderContext } from "../../context/OrderContext";
import { isVetOnly, lacksVetAccess } from "../../utils/productUtils";
import { authApi } from "../../api/authApi";
import { accountApi } from "../../api/accountApi";
import { CUSTOMER_BLOCKED_REASON_KEY } from "../../api/authStorage";
import { paymentApi } from "../../api/paymentApi";
import { couponApi } from "../../api/couponApi";
import { orderApi } from "../../api/orderApi";
import { taxApi } from "../../api/taxApi";
import { shipmentChargeApi } from "../../api/shipmentChargeApi";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import ProductImage from "../Common/ProductImage";
import PrescriptionUploadStep from "./PrescriptionUploadStep";
import CountryDropdown from "../Common/CountryDropdown";


const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const ALLOW_LOCAL_PAYMENT_FALLBACK =
  import.meta.env.DEV &&
  import.meta.env.VITE_ALLOW_LOCAL_PAYMENT_FALLBACK === "true";
let stripePromise;

const isLocalPaymentIntentSecret = (value) =>
  String(value || "").includes("_secret_local") ||
  String(value || "").startsWith("pi_local_");

const isLocalPaymentIntentId = (value) =>
  String(value || "").startsWith("pi_local_");

const getStripePromise = () => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return Promise.reject(new Error("Stripe publishable key is missing."));
  }
  if (!stripePromise) {
    stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(STRIPE_PUBLISHABLE_KEY),
    );
  }
  return stripePromise;
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const inputClass = (err) =>
  `w-full bg-white border ${err ? "border-red-400 focus:ring-red-400" : "border-[#D9E8F2] focus:ring-[#0874C9]"} rounded-2xl px-4 py-3 text-sm text-[#102A43] focus:outline-none focus:ring-2 transition-all`;

const labelClass = "block text-xs font-bold uppercase tracking-wider text-[#627D98] mb-1.5";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "India", "Germany", "France", "Singapore", "UAE", "Other"];

const calculateCheckoutTotals = (cartTotal, coupon, taxRate, shippingCost = 0) => {
  const shipping = Number(shippingCost) || 0;
  let discount = 0;
  if (coupon) {
    discount = coupon.type === "percent"
      ? (cartTotal * coupon.discount) / 100
      : Math.min(coupon.discount, cartTotal);
  }
  const tax = Math.max(0, cartTotal - discount) * (taxRate / 100);
  const grandTotal = cartTotal - discount + shipping + tax;

  return { shipping, discount, tax, grandTotal };
};

const parseCityStateZip = (str = "") => {
  let city = "";
  let state = "";
  let zip = "";
  
  const commaParts = str.split(",").map(s => s.trim());
  if (commaParts.length >= 3) {
    city = commaParts[0];
    state = commaParts[1];
    zip = commaParts[2];
  } else if (commaParts.length === 2) {
    city = commaParts[0];
    const second = commaParts[1];
    const match = second.match(/^([A-Za-z]+)\s+(\d+)$/);
    if (match) {
      state = match[1];
      zip = match[2];
    } else {
      state = second;
    }
  } else {
    const match = str.match(/^(.+?)\s+([A-Za-z]{2})\s+(\d{5}(-\d{4})?)$/);
    if (match) {
      city = match[1];
      state = match[2];
      zip = match[3];
    } else {
      city = str;
    }
  }
  return { city, state, zip };
};

/* ─── Step Progress Bar ────────────────────────────────────────────────────── */
const StepBar = ({ step, hasPrescriptionItems }) => {
  const steps = hasPrescriptionItems
    ? ["Contact", "Address", "Prescription", "Payment"]
    : ["Contact", "Address", "Payment"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-heading font-black text-sm transition-all duration-300 ${done ? "bg-[#0874C9] text-white" : active ? "bg-[#0874C9] text-white shadow-lg shadow-[#0874C9]/30" : "bg-[#D9E8F2] text-[#627D98]"}`}>
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-[#0874C9]" : done ? "text-[#0874C9]" : "text-[#9FB3C8]"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mt-[-14px] transition-all duration-500 ${done ? "bg-[#0874C9]" : "bg-[#D9E8F2]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ─── Order Summary Sidebar ───────────────────────────────────────────────── */
const OrderSummary = ({ cart, cartTotal, coupon, couponCode, setCouponCode, onApplyCoupon, onRemoveCoupon, couponError, availableCoupons = [], setCoupon, setCouponError, showCoupon = true, taxRate = 8.5, shippingCost = 0, shippingLabel = "Shipping", shippingLoading = false }) => {
  const shipping = Number(shippingCost) || 0;
  let discount = 0;
  if (coupon) {
    discount = coupon.type === "percent"
      ? (cartTotal * coupon.discount) / 100
      : Math.min(coupon.discount, cartTotal);
  }
  const tax = Math.max(0, cartTotal - discount) * (taxRate / 100);
  const grand = cartTotal - discount + shipping + tax;

  return (
    <div className="bg-white border border-[#D9E8F2] rounded-3xl overflow-hidden shadow-sm sticky top-6">
      <div className="bg-[#0B2D4F] px-5 py-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-[#F28C18]" />
        <h3 className="font-heading font-bold text-white text-sm">Order Review</h3>
        <span className="ml-auto text-xs text-slate-400">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#F0F6FA] max-h-64 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-5 py-3">
            <ProductImage src={item.image} alt={item.name} product={item} className="w-12 h-12 rounded-xl object-cover border border-[#D9E8F2] bg-[#F7FAFC] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#102A43] truncate">{item.name}</p>
              <p className="text-[10px] text-[#627D98] mt-0.5">Qty: {item.quantity}</p>
            </div>
            <span className="text-xs font-black text-[#0874C9] shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Coupon */}
      {showCoupon && (
        <div className="px-5 py-4 border-t border-[#D9E8F2]">
          {coupon ? (
            <div className="flex items-center justify-between bg-[#EAF5FC] border border-[#0874C9]/20 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#0874C9]" />
                <span className="text-xs font-bold text-[#0874C9]">{coupon.code} — {coupon.label}</span>
              </div>
              <button onClick={onRemoveCoupon} className="text-[#0874C9] hover:text-red-500 transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-[#627D98] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && onApplyCoupon()}
                    placeholder="COUPON CODE"
                    className="w-full border border-[#D9E8F2] rounded-xl pl-9 pr-3 py-2 text-xs font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#0874C9] transition-all"
                  />
                </div>
                <button onClick={onApplyCoupon} className="bg-[#0874C9] hover:bg-[#F28C18] text-white text-xs font-bold px-4 rounded-xl transition-colors cursor-pointer">
                  Apply
                </button>
              </div>
              {availableCoupons.length > 0 && (
                <div className="rounded-xl border border-[#D9E8F2]/70 bg-[#F7FAFC] p-2.5">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-[#627D98]">
                    Available Coupons
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCoupons.map((item) => {
                      const code = String(item.code || "").toUpperCase();
                      const isPercent = ["percentage", "percent"].includes(String(item.type || item.discountType || "").toLowerCase());
                      const value = Number(item.value ?? item.discount ?? item.discountValue ?? 0);
                      const label = item.label || (isPercent ? `${value}% OFF` : `$${value} OFF`);

                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setCouponCode(code);
                            setCoupon({
                              code,
                              discount: value,
                              type: isPercent ? "percent" : "fixed",
                              label,
                            });
                            setCouponError?.("");
                          }}
                          className="rounded-lg border border-[#0874C9]/20 bg-[#EAF5FC] px-2 py-1 text-[10px] font-black text-[#0874C9] transition-colors hover:bg-[#0874C9] hover:text-white"
                          title={item.description || `${code} - click to apply`}
                        >
                          {code} <span className="font-bold opacity-80">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          {couponError && <p className="text-[10px] text-red-500 font-semibold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{couponError}</p>}
        </div>
      )}

      {/* Price breakdown */}
      <div className="px-5 pb-5 flex flex-col gap-2 border-t border-[#D9E8F2] pt-4">
        <div className="flex justify-between text-xs text-[#627D98]">
          <span>Subtotal</span><span className="font-bold text-[#102A43]">${cartTotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-xs text-[#0874C9]">
            <span>Discount</span><span className="font-bold">-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-[#627D98]">
          <span>{shippingLabel || "Shipping"}</span>
          {shippingLoading ? (
            <span className="font-bold text-[#627D98]">Calculating...</span>
          ) : shipping === 0 ? (
            <span className="font-bold text-[#0874C9]">FREE</span>
          ) : (
            <span className="font-bold text-[#102A43]">${shipping.toFixed(2)}</span>
          )}
        </div>
        <div className="flex justify-between text-xs text-[#627D98]">
          <span>Tax ({taxRate}%)</span><span className="font-bold text-[#102A43]">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-[#D9E8F2] mt-1">
          <span className="text-sm font-black text-[#102A43]">Grand Total</span>
          <span className="text-lg font-black text-[#0874C9]">${grand.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Address Form Modal ──────────────────────────────────────────────────── */
const AddressModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    fullName: "", phone: "", street: "", city: "", state: "",
    zip: "", country: "United States", isDefault: false,
    ...initial
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.street.trim()) e.street = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.state.trim()) e.state = "Required";
    if (!form.zip.trim()) e.zip = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0B2D4F]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-black text-lg text-[#102A43]">
            {initial?.id ? "Edit Address" : "New Address"}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[#F7FAFC] rounded-full transition-colors cursor-pointer"><X className="w-5 h-5 text-[#627D98]" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={labelClass}>Full Name</label>
            <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputClass(errors.fullName)} placeholder="Dr. John Smith" />
            {errors.fullName && <p className="text-[10px] text-red-500 mt-1">{errors.fullName}</p>}
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass(errors.phone)} placeholder="+1 234 567 8900" />
            {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Street Address</label>
            <input value={form.street} onChange={(e) => set("street", e.target.value)} className={inputClass(errors.street)} placeholder="123 Wellness Way, Suite 400" />
            {errors.street && <p className="text-[10px] text-red-500 mt-1">{errors.street}</p>}
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass(errors.city)} placeholder="Chicago" />
            {errors.city && <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>}
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input value={form.state} onChange={(e) => set("state", e.target.value)} className={inputClass(errors.state)} placeholder="IL" />
            {errors.state && <p className="text-[10px] text-red-500 mt-1">{errors.state}</p>}
          </div>
          <div>
            <label className={labelClass}>ZIP Code</label>
            <input value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputClass(errors.zip)} placeholder="60601" />
            {errors.zip && <p className="text-[10px] text-red-500 mt-1">{errors.zip}</p>}
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <select value={form.country} onChange={(e) => set("country", e.target.value)} className={inputClass(false)}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer" onClick={() => set("isDefault", !form.isDefault)}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${form.isDefault ? "bg-[#0874C9] border-[#0874C9]" : "border-[#D9E8F2]"}`}>
              {form.isDefault && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-xs font-semibold text-[#627D98]">Set as default address</span>
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 border border-[#D9E8F2] text-[#627D98] font-bold text-sm py-3 rounded-2xl hover:bg-[#F7FAFC] transition-colors cursor-pointer">Cancel</button>
          <button onClick={() => validate() && onSave(form)} className="flex-1 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-sm py-3 rounded-2xl transition-colors cursor-pointer">Save Address</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Checkout Page ──────────────────────────────────────────────────── */
const CheckoutPage = () => {


  const { cart, cartTotal, clearCart, addToast } = useContext(AppContext);
  const { user, loginUser, updateUser, checkoutContact } = useContext(AuthContext);
  const { savedAddresses, savedContact, saveContact, saveAddress, deleteAddress, applyCoupon, placeOrder, saveRemoteOrder } = useContext(OrderContext);
  const navigate = useNavigate();

  const rxItems = cart.filter(
    (item) => item.prescriptionRequired || item.product?.prescriptionRequired
  );
  const hasPrescriptionItems = rxItems.length > 0;
  const paymentStep = hasPrescriptionItems ? 4 : 3;

  const [vetApplication, setVetApplication] = useState(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    accountApi
      .getVetVerification()
      .then((data) => {
        if (active) setVetApplication(data || null);
      })
      .catch(() => {
        if (active) setVetApplication(null);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const isUserVetVerified = Boolean(
    !lacksVetAccess({ isVetOnly: true }, user) ||
    vetApplication?.status === "Approved"
  );

  const vetRestrictedItems = cart.filter((item) => isVetOnly(item.product || item));
  const hasVetRestriction = Boolean(vetRestrictedItems.length > 0 && !isUserVetVerified);

  const [step, setStep] = useState(1);
  const [prescriptions, setPrescriptions] = useState({});
  const [uploadingPrescriptions, setUploadingPrescriptions] = useState({});
  const [prescriptionErrors, setPrescriptionErrors] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [accountCreatedViaCheckout, setAccountCreatedViaCheckout] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [taxRate, setTaxRate] = useState(8.5);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLabel, setShippingLabel] = useState("Shipping");
  const [shippingLoading, setShippingLoading] = useState(false);

  const handleUploadPrescription = async (itemId, file) => {
    if (!file) return;
    setUploadingPrescriptions((prev) => ({ ...prev, [itemId]: true }));
    setPrescriptionErrors((prev) => ({ ...prev, [itemId]: "" }));

    try {
      const uploadedData = await orderApi.uploadPrescription(file);
      const prescriptionObj = {
        file,
        url: typeof uploadedData === "string" ? uploadedData : (uploadedData?.url || uploadedData?.prescriptionUrl || uploadedData?.fileUrl || ""),
        data: uploadedData,
        filename: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        uploadedAt: new Date().toISOString(),
      };
      setPrescriptions((prev) => ({
        ...prev,
        [itemId]: prescriptionObj,
      }));
      addToast({
        title: "Prescription Uploaded",
        message: "Prescription document uploaded successfully.",
        type: "cart",
      });
    } catch (err) {
      console.error("Prescription upload error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to upload prescription file.";
      setPrescriptionErrors((prev) => ({ ...prev, [itemId]: errMsg }));
      addToast({
        title: "Upload Failed",
        message: errMsg,
        type: "error",
      });
    } finally {
      setUploadingPrescriptions((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemovePrescription = (itemId) => {
    setPrescriptions((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const list = await couponApi.list();
        if (Array.isArray(list)) {
          setAvailableCoupons(list);
        }
      } catch (err) {
        console.error("Failed to load coupons list:", err);
      }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    const fetchTax = async () => {
      try {
        const data = await taxApi.getActiveTax();
        if (data && typeof data.rate === "number") {
          setTaxRate(data.rate);
        }
      } catch (err) {
        console.error("Failed to fetch active tax rate:", err);
      }
    };
    fetchTax();
  }, []);

  useEffect(() => {
    let active = true;
    if (!cart.length || cartTotal <= 0) {
      setShippingCost(0);
      setShippingLabel("Shipping");
      setShippingLoading(false);
      return undefined;
    }

    setShippingLoading(true);
    shipmentChargeApi
      .resolveChargeRule(cartTotal)
      .then((rule) => {
        if (!active) return;
        setShippingCost(Number(rule?.charge) || 0);
        setShippingLabel(rule?.label || "Shipping");
      })
      .catch((err) => {
        console.error("Failed to resolve shipment charge:", err);
        if (active) {
          setShippingCost(0);
          setShippingLabel("Shipping");
        }
      })
      .finally(() => {
        if (active) setShippingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cart.length, cartTotal]);

  // Step 1 — Contact
  const [contact, setContact] = useState({
    fullName: savedContact?.fullName || user?.name || "",
    email: savedContact?.email || user?.email || "",
    phone: savedContact?.phone || "",
  });
  const [contactErrors, setContactErrors] = useState({});
  const [checkoutBlockedReason, setCheckoutBlockedReason] = useState(() => (user ? localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY) || "" : ""));

  useEffect(() => {
    if (!user) {
      setCheckoutBlockedReason("");
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY); 
    }
  }, [user]);

  // Step 2 — Address
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const def = savedAddresses.find((a) => a.isDefault);
    return def?.id || savedAddresses[0]?.id || null;
  });
  const [isAddingNewInline, setIsAddingNewInline] = useState(() => {
    return savedAddresses.length === 0;
  });
  const [inlineForm, setInlineForm] = useState({
    id: null,
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    isDefault: false
  });
  const [inlineErrors, setInlineErrors] = useState({});
  const [addressError, setAddressError] = useState("");
  const [deletingAddressId, setDeletingAddressId] = useState(null);

  const handleDeleteSavedAddress = async (e, addressId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this delivery destination?")) return;
    setDeletingAddressId(addressId);
    try {
      await deleteAddress(addressId);
      addToast({
        title: "Address Removed",
        message: "The delivery destination has been deleted.",
        type: "wishlist",
      });
      if (selectedAddressId === addressId) {
        const remaining = savedAddresses.filter(
          (a) => String(a.id) !== String(addressId) && String(a._id) !== String(addressId)
        );
        if (remaining.length > 0) {
          const def = remaining.find((a) => a.isDefault) || remaining[0];
          setSelectedAddressId(def.id || def._id);
        } else {
          setSelectedAddressId(null);
          setIsAddingNewInline(true);
        }
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
      addToast({
        title: "Error",
        message: "Failed to delete address. Please try again.",
        type: "error",
      });
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleEditSavedAddress = (e, addr) => {
    e.stopPropagation();
    const addrId = addr.id || addr._id;
    setInlineForm({
      id: addrId,
      _id: addr._id || addr.id,
      fullName: addr.fullName || user?.name || "",
      phone: addr.phone || user?.phone || "",
      street: addr.street || addr.addressLine1 || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "United States",
      isDefault: Boolean(addr.isDefault),
    });
    setInlineErrors({});
    setIsAddingNewInline(true);
  };

  const handleSaveInlineAddress = async (e) => {
    if (e) e.preventDefault();
    const fullName = String(inlineForm.fullName || "").trim();
    const phoneDigits = String(inlineForm.phone || "").replace(/\D/g, "");
    const street = String(inlineForm.street || "").trim();
    const city = String(inlineForm.city || "").trim();
    const state = String(inlineForm.state || "").trim();
    const zip = String(inlineForm.zip || "").trim();

    if (fullName.length < 2 || fullName.length > 50) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid full name (2 to 50 characters).",
        type: "error",
      });
      return false;
    }
    if (!inlineForm.phone || phoneDigits.length !== 10) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid 10-digit phone number.",
        type: "error",
      });
      return false;
    }
    if (street.length < 5 || street.length > 100) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid street address (5 to 100 characters).",
        type: "error",
      });
      return false;
    }
    if (city.length < 2 || city.length > 50) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid city (2 to 50 characters).",
        type: "error",
      });
      return false;
    }
    if (state.length < 2 || state.length > 50) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid state/province (2 to 50 characters).",
        type: "error",
      });
      return false;
    }
    if (zip.length < 3 || zip.length > 10) {
      addToast({
        title: "Validation Error",
        message: "Please enter a valid ZIP/Postal code (3 to 10 characters).",
        type: "error",
      });
      return false;
    }

    const isEdit = Boolean(inlineForm.id || inlineForm._id);
    const resolvedId = inlineForm.id || inlineForm._id || Date.now().toString();
    const addrPayload = {
      ...inlineForm,
      id: resolvedId,
      fullName,
      phone: inlineForm.phone,
      street,
      city,
      state,
      zip,
      country: inlineForm.country || "United States",
    };

    try {
      await saveAddress(addrPayload);
      setSelectedAddressId(resolvedId);
      setIsAddingNewInline(false);
      setInlineForm({
        id: null,
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "United States",
        isDefault: false,
      });
      addToast({
        title: isEdit ? "Address Updated" : "Address Saved",
        message: isEdit
          ? "Delivery address updated successfully."
          : "New delivery address saved.",
        type: "cart",
      });
      return true;
    } catch (err) {
      console.error("Save inline address error:", err);
      addToast({
        title: "Error",
        message: "Failed to save address. Please try again.",
        type: "error",
      });
      return false;
    }
  };

  // Step 3 / 4 — Payment
  const payMethod = "card";
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [payErrors, setPayErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [stripeInstance, setStripeInstance] = useState(null);
  const [stripeLoadError, setStripeLoadError] = useState("");
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [isLocalPaymentFallback, setIsLocalPaymentFallback] = useState(false);
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Clear clientSecret if cart totals or coupon changes so it fetches a fresh one
  useEffect(() => {
    setClientSecret("");
    setPaymentIntentId("");
    setStripeInstance(null);
    setStripeLoadError("");
    setIsLocalPaymentFallback(false);
  }, [cartTotal, coupon, shippingCost]);

  // Fetch clientSecret when entering Payment step
  useEffect(() => {
    if (step === paymentStep && cartTotal > 0 && !shippingLoading && !clientSecret && !loadingIntent) {
      const initPaymentIntent = async () => {
        setLoadingIntent(true);
        setCheckoutError("");
        try {
          const { grandTotal } = calculateCheckoutTotals(cartTotal, coupon, taxRate, shippingCost);

          const intentData = await paymentApi.createIntent({
            amount: grandTotal,
            total: grandTotal,
            localFallback: ALLOW_LOCAL_PAYMENT_FALLBACK
          });
          if (intentData?.clientSecret) {
            const returnedLocalFallback =
              Boolean(intentData.localFallback) ||
              isLocalPaymentIntentSecret(intentData.clientSecret) ||
              isLocalPaymentIntentId(intentData.paymentIntentId);

            if (returnedLocalFallback && !ALLOW_LOCAL_PAYMENT_FALLBACK) {
              setClientSecret("");
              setPaymentIntentId("");
              setIsLocalPaymentFallback(false);
              setStripeInstance(null);
              setStripeLoadError("Payment service is temporarily unavailable.");
              throw new Error("Stripe payment gateway returned a development fallback intent.");
            }

            setClientSecret(intentData.clientSecret);
            setPaymentIntentId(intentData.paymentIntentId || "");
            setIsLocalPaymentFallback(returnedLocalFallback);
          } else {
            throw new Error("No client secret returned from payment gateway.");
          }
        } catch (err) {
          console.error("Failed to initialize payment intent:", err);
          setCheckoutError("Payment service is temporarily unavailable.");
        } finally {
          setLoadingIntent(false);
        }
      };
      initPaymentIntent();
    }
  }, [step, paymentStep, cartTotal, coupon, taxRate, shippingCost, shippingLoading, clientSecret, loadingIntent]);

  useEffect(() => {
    if (step !== paymentStep || !clientSecret || isLocalPaymentFallback) return;

    let isMounted = true;
    setStripeLoadError("");
    setLoadingStripe(true);

    getStripePromise()
      .then((stripe) => {
        if (!isMounted) return;
        if (!stripe) {
          throw new Error("Stripe failed to initialize.");
        }
        setStripeInstance(stripe);
      })
      .catch(() => {
        if (!isMounted) return;
        if (!ALLOW_LOCAL_PAYMENT_FALLBACK) {
          setStripeLoadError("Payment service is temporarily unavailable.");
          return;
        }

        const { grandTotal } = calculateCheckoutTotals(cartTotal, coupon, taxRate, shippingCost);
        paymentApi.createIntent({
          amount: grandTotal,
          total: grandTotal,
          localFallback: true,
        }).then((intentData) => {
          if (!isMounted) return;
          if (
            intentData?.clientSecret &&
            intentData?.paymentIntentId &&
            intentData?.localFallback &&
            isLocalPaymentIntentSecret(intentData.clientSecret)
          ) {
            setClientSecret(intentData.clientSecret);
            setPaymentIntentId(intentData.paymentIntentId);
            setIsLocalPaymentFallback(true);
            setStripeLoadError("");
          } else {
            setStripeLoadError("Payment service is temporarily unavailable.");
          }
        }).catch(() => {
          if (!isMounted) return;
          setStripeLoadError("Payment service is temporarily unavailable.");
        });
      })
      .finally(() => {
        if (isMounted) {
          setLoadingStripe(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [step, paymentStep, clientSecret, isLocalPaymentFallback, cartTotal, coupon, taxRate, shippingCost]);


  // Stripe Authentication Modal states
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifError, setVerifError] = useState("");
  const [pendingOrderPayload, setPendingOrderPayload] = useState(null);

  const [orderPlaced, setOrderPlaced] = useState(false);

  // Sync address selection when savedAddresses loads from context after mount
  useEffect(() => {
    if (savedAddresses.length > 0) {
      setIsAddingNewInline(false);
      setSelectedAddressId((prev) => {
        if (prev) return prev; // already set, keep it
        const def = savedAddresses.find((a) => a.isDefault);
        return def?.id || savedAddresses[0]?.id || null;
      });
    }
  }, [savedAddresses]);

  useEffect(() => {
    // Only redirect to shop if cart empties AND no order was just placed
    if (cart.length === 0 && !orderPlaced) navigate("/shop");
  }, [cart, orderPlaced]);

  /* Coupon */
  const handleApplyCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) return;
    setCouponError("");

    if (
      availableCoupons.length > 0 &&
      !availableCoupons.some((item) => String(item.code || "").toUpperCase() === normalizedCode)
    ) {
      setCouponError("Invalid coupon code.");
      return;
    }

    try {
      const data = await couponApi.validate(normalizedCode, cartTotal);
      if (data) {
        setCoupon({
          code: data.code,
          discount: Number(data.discountValue ?? data.discount ?? 0),
          type: data.discountType?.toLowerCase() === "percent" ? "percent" : "fixed",
          label: data.label || (data.discountType?.toLowerCase() === "percent" ? `${data.discount}% OFF` : `$${data.discount} OFF`)
        });
        setCouponError("");
      } else {
        setCouponError("Invalid coupon code.");
      }
    } catch (err) {
      if (err.response?.status !== 400 && import.meta.env.DEV) {
        console.error("Coupon validation error:", err);
      }
      const errMsg = err.response?.data?.message || "Invalid or expired coupon code.";
      setCouponError(errMsg);
    }
  };

  /* Step 1 validation */
  const validateContact = () => {
    const e = {};
    const name = contact.fullName.trim();
    if (!name || name.length < 2 || name.length > 50) {
      e.fullName = "Full name must be between 2 and 50 characters";
    }
    if (!contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      e.email = "Valid email required";
    }
    const phoneDigits = contact.phone.replace(/\D/g, "");
    if (!contact.phone.trim() || phoneDigits.length !== 10) {
      e.phone = "Phone number must be exactly 10 digits";
    }
    setContactErrors(e);
    return Object.keys(e).length === 0;
  };

  /* Step 2 validation */
  const validateAddress = () => {
    if (!selectedAddressId) { setAddressError("Please select or add a delivery address."); return false; }
    setAddressError("");
    return true;
  };

  /* Step 3 validation */
  const validatePayment = () => {
    return true;
  };

  const handleNext = async () => {
    if (hasVetRestriction) {
      addToast({
        title: "Verified Veterinarian Required",
        message: "Your order contains product(s) exclusive to verified veterinarians. Please complete vet verification before placing an order.",
        type: "error",
      });
      navigate(user ? "/account/vet-verification" : "/login");
      return;
    }

    if (step === 1) {
      if (!validateContact()) return;
      if (checkoutBlockedReason) setCheckoutBlockedReason("");

      setIsSubmittingContact(true);
      try {
        if (checkoutContact) {
          await checkoutContact({
            name: contact.fullName,
            email: contact.email,
            phone: contact.phone
          });
        }

        setAccountCreatedViaCheckout(true);
        setCheckoutBlockedReason("");
        localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);

        saveContact(contact);
        setStep(2);
        window.scrollTo(0, 0);
      } catch (error) {
        console.error("Checkout contact error:", error);
        const rawMsg = (error?.response?.data?.message || error?.message || "").toLowerCase();
        const isBlocked =
          Boolean(error?.response?.data?.isBlocked) ||
          rawMsg.includes("blocked") ||
          rawMsg.includes("deactivated") ||
          rawMsg.includes("suspended");
        const errMsg =
          error?.response?.data?.message ||
          error?.message ||
          "Your account has been blocked. Please contact support.";

        if (isBlocked) {
          setCheckoutBlockedReason(errMsg);
          localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, errMsg);
          addToast({
            title: "Account Blocked",
            message: errMsg,
            type: "error"
          });
        } else {
          addToast({
            title: "Checkout Error",
            message: errMsg,
            type: "error"
          });
        }
        setIsSubmittingContact(false);
        return; // stop execution and keep user on contact step
      } finally {
        setIsSubmittingContact(false);
      }
    }
    else if (step === 2) {
      if (savedAddresses.length === 0 || isAddingNewInline) {
        const fullName = String(inlineForm.fullName || "").trim();
        const phoneDigits = String(inlineForm.phone || "").replace(/\D/g, "");
        const street = String(inlineForm.street || "").trim();
        const city = String(inlineForm.city || "").trim();
        const state = String(inlineForm.state || "").trim();
        const zip = String(inlineForm.zip || "").trim();

        if (fullName.length < 2 || fullName.length > 50) {
          addToast({ title: "Validation Error", message: "Please enter a valid full name (2 to 50 characters).", type: "error" });
          return;
        }
        if (!inlineForm.phone || phoneDigits.length !== 10) {
          addToast({ title: "Validation Error", message: "Please enter a valid 10-digit phone number.", type: "error" });
          return;
        }
        if (street.length < 5 || street.length > 100) {
          addToast({ title: "Validation Error", message: "Please enter a valid street address (5 to 100 characters).", type: "error" });
          return;
        }
        if (city.length < 2 || city.length > 50) {
          addToast({ title: "Validation Error", message: "Please enter a valid city (2 to 50 characters).", type: "error" });
          return;
        }
        if (state.length < 2 || state.length > 50) {
          addToast({ title: "Validation Error", message: "Please enter a valid state/province (2 to 50 characters).", type: "error" });
          return;
        }
        if (zip.length < 3 || zip.length > 10) {
          addToast({ title: "Validation Error", message: "Please enter a valid ZIP/Postal code (3 to 10 characters).", type: "error" });
          return;
        }

        const resolvedId = inlineForm.id || inlineForm._id || Date.now().toString();
        const newAddr = {
          ...inlineForm,
          id: resolvedId,
          fullName,
          phone: inlineForm.phone,
          street,
          city,
          state,
          zip,
          country: inlineForm.country || "United States",
        };
        await saveAddress(newAddr);
        setSelectedAddressId(resolvedId);
        setIsAddingNewInline(false);
        setStep(3);
        window.scrollTo(0, 0);
      } else {
        if (validateAddress()) {
          setStep(3);
          window.scrollTo(0, 0);
        }
      }
    }
    else if (step === 3 && hasPrescriptionItems) {
      // Step 3 = Prescription upload step
      // Warn if not all prescriptions are uploaded (but allow to proceed)
      const missingRx = rxItems.filter(
        (item) => !prescriptions[item.productId || item.id]
      );
      if (missingRx.length > 0) {
        addToast({
          title: "Prescription Required",
          message: `Please upload prescriptions for all required items before continuing.`,
          type: "error",
        });
        return;
      }
      setStep(4);
      window.scrollTo(0, 0);
    }
  };

  const handlePlaceOrder = async (stripeInstance, elementsInstance, options = {}) => {
    if (placing) return;
    if (shippingLoading) {
      setCheckoutError("Shipping charge is still being calculated. Please wait a moment.");
      return;
    }
    const usingLocalFallback = Boolean(options.localPaymentIntentId);
    if (!usingLocalFallback && (!stripeInstance || !elementsInstance)) {
      setCheckoutError("Stripe secure gateway is not loaded yet. Please try again.");
      return;
    }
    setCheckoutError("");
    setPlacing(true);

    try {
      const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddr) {
        throw new Error("Delivery address is required.");
      }

      // Stripe fields validation
      if (!cardName.trim()) throw new Error("Cardholder name is required.");

      // Calculate totals
      const { shipping, tax, grandTotal } = calculateCheckoutTotals(cartTotal, coupon, taxRate, shippingCost);

      let paymentIntent;
      if (usingLocalFallback) {
        paymentIntent = {
          id: options.localPaymentIntentId,
          status: "succeeded",
          payment_method_details: { card: { last4: "4242" } },
        };
      } else {
        // PaymentElement collects all payment info internally via its UI.
        const confirmResult = await stripeInstance.confirmPayment({
          elements: elementsInstance,
          confirmParams: {},
          redirect: "if_required",
        });

        if (confirmResult.error) {
          throw new Error(confirmResult.error.message || "Payment authentication failed.");
        }

        paymentIntent = confirmResult.paymentIntent;
        if (paymentIntent.status !== "succeeded") {
          throw new Error(`Payment authentication status: ${paymentIntent.status}`);
        }
      }

      // 2. Map items, address, and contact for the database order API
      const items = cart.map((item) => {
        const embeddedVariant = Array.isArray(item.optionVariants)
          ? item.optionVariants.find(
              (variant) =>
                String(variant.id || variant._id || variant.sku) ===
                  String(item.selectedVariantId) ||
                String(variant.label || variant.name || "") ===
                  String(item.selectedVariantName || ""),
            )
          : null;
        const selectedVariantId =
          item.selectedVariantId && !/^opt-\d+$/i.test(String(item.selectedVariantId))
            ? item.selectedVariantId
            : embeddedVariant?.id ||
              embeddedVariant?._id ||
              embeddedVariant?.variantId ||
              item.familyVariantId ||
              item.variantId ||
              item.variant?.id ||
              null;

        return {
          productId: item.productId || item.id,
          quantity: item.quantity,
          variantId: selectedVariantId,
          price: item.price,
          name: item.name,
        };
      });

      const orderPayload = {
        items,
        contact: {
          fullName: contact.fullName,
          email: contact.email,
          phone: contact.phone
        },
        shippingAddress: {
          fullName: selectedAddr.fullName,
          phone: selectedAddr.phone || contact.phone,
          street: selectedAddr.street,
          city: selectedAddr.city,
          state: selectedAddr.state,
          zip: selectedAddr.zip,
          country: selectedAddr.country || "India"
        },
        paymentMethod: "stripe", // Root level property for backend to prevent default 'cod'
        stripePaymentIntentId: paymentIntent.id, // Root level property for backend
        paymentStatus: "Paid", // Root level property for backend
        payment: {
          method: "Stripe Online Payment",
          paymentIntentId: paymentIntent.id,
          last4: paymentIntent.payment_method_details?.card?.last4 || "4242"
        },
        couponCode: coupon ? coupon.code : null,
        shipping,
        shippingCost: shipping,
        shippingFee: shipping,
        shippingLabel,
        tax: tax,
        subtotal: cartTotal,
        total: grandTotal,
        amount: grandTotal,
        prescriptions: Object.keys(prescriptions).length > 0
          ? Object.entries(prescriptions).map(([itemId, rx]) => ({
              itemId,
              url: rx.url || "",
              filename: rx.filename || "",
              uploadedAt: rx.uploadedAt || "",
            }))
          : undefined,
      };

      // 3. Create the order on the backend database
      const remoteOrder = await orderApi.createOrder(orderPayload);

      // 4. Save order in context state (falls back if saveRemoteOrder doesn't exist)
      const order = saveRemoteOrder ? saveRemoteOrder(remoteOrder) : placeOrder({
        contact,
        address: selectedAddr,
        payment: { method: "Stripe Online Payment", cardNumber: "•••• •••• •••• " + (paymentIntent.payment_method_details?.card?.last4 || "4242") },
        cart,
        cartTotal,
        coupon,
        shipping,
        taxRate,
      });

      if (!order || !order.id) {
        throw new Error("Order creation failed — no order ID returned.");
      }

      // Step 2: Auto-create / activate customer account using checkout contact
      // Only if the user is NOT already logged in (prevent duplicate account creation)
      if (accountCreatedViaCheckout) {
        updateUser({
          accountCreatedViaOrder: true,
          orderId: order.id,
        });
      } else if (!user) {
        const nameParts = contact.fullName.trim().split(/\s+/);
        loginUser(
          {
            email: contact.email,
            name: contact.fullName,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phone: contact.phone,
            accountCreatedViaOrder: true,
            orderId: order.id,
          },
          { silent: true } // suppress toast — OrderSuccessPage shows the banner
        );
      }

      // Step 3: Mark placed BEFORE clearing cart (prevents redirect to /shop)
      setOrderPlaced(true);
      setStep(4);
      setPlacing(false);

      // Step 4: Move to the real success route so refresh/back/forward stay stable.
      navigate(`/order-success/${order.id}`, {
        replace: true,
        state: { order },
      });
      clearCart();
    } catch (err) {
      console.error("Stripe payment placement error:", err);
      const rawMsg = (err?.response?.data?.message || err?.message || "").toLowerCase();
      const isBlocked =
        Boolean(err?.response?.data?.isBlocked) ||
        rawMsg.includes("blocked") ||
        rawMsg.includes("deactivated") ||
        rawMsg.includes("suspended");
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Payment processing failed. Please check your card details and try again.";

      if (isBlocked) {
        setCheckoutBlockedReason(errMsg);
        localStorage.setItem(CUSTOMER_BLOCKED_REASON_KEY, errMsg);
        addToast({
          title: "Account Blocked",
          message: errMsg,
          type: "error"
        });
        setStep(1);
      } else {
        setCheckoutError(errMsg);
      }
      setPlacing(false);
    }
  };


  const formatCard = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);

  const isFullWidthStep = step === 3 && hasPrescriptionItems;

  return (
    <div className="min-h-screen bg-[#F7FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <StepBar step={step} hasPrescriptionItems={hasPrescriptionItems} />

        <div className={`grid gap-8 ${isFullWidthStep ? "grid-cols-1 max-w-2xl mx-auto w-full" : "grid-cols-1 lg:grid-cols-3"}`}>
          {/* ── Left: Step Forms ── */}
          <div className={isFullWidthStep ? "w-full" : "lg:col-span-2 order-2 lg:order-1"}>
            {hasVetRestriction && (
              <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm text-left">
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
                  onClick={() => navigate(user ? "/account/vet-verification" : "/login")}
                  className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Apply for Verification
                </button>
              </div>
            )}

            {/* ── STEP 1: Contact ── */}
            {step === 1 && (
              <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6 md:p-8 animate-fadeIn text-left">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-[#EAF5FC] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#0874C9]" />
                  </div>
                  <div>
                    <h2 className="font-heading font-black text-xl text-[#102A43]">Contact Details</h2>
                    <p className="text-xs text-[#627D98]">We'll send your order updates here</p>
                  </div>
                </div>

                {checkoutBlockedReason && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
                        <ShieldAlert size={18} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-sm text-red-900">Account Blocked</h4>
                        <p className="text-xs font-sans font-bold text-red-700 mt-0.5">{checkoutBlockedReason}</p>
                        <p className="text-[10px] font-sans text-red-600 mt-1">Please contact customer support to resolve this issue.</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className={labelClass}>Full Name *</label>
                      <span className="text-[10px] text-[#627D98] font-semibold">Min 2, Max 50 chars</span>
                    </div>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#627D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        minLength={2}
                        maxLength={50}
                        value={contact.fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContact({ ...contact, fullName: val });
                          const trimmed = val.trim();
                          if (trimmed.length > 0 && (trimmed.length < 2 || trimmed.length > 50)) {
                            setContactErrors((prev) => ({ ...prev, fullName: "Full name must be between 2 and 50 characters" }));
                          } else {
                            setContactErrors((prev) => ({ ...prev, fullName: "" }));
                          }
                        }}
                        className={inputClass(
                          contactErrors.fullName ||
                            (contact.fullName.trim().length > 0 &&
                              (contact.fullName.trim().length < 2 || contact.fullName.trim().length > 50))
                        ) + " pl-10"}
                        placeholder="Dr. John Smith"
                      />
                    </div>
                    {(contactErrors.fullName ||
                      (contact.fullName.trim().length > 0 &&
                        (contact.fullName.trim().length < 2 || contact.fullName.trim().length > 50))) && (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3 h-3" />
                        {contactErrors.fullName || "Full name must be between 2 and 50 characters"}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className={labelClass}>Email Address *</label>
                      <span className="text-[10px] text-[#627D98] font-semibold">Valid email required</span>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#627D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContact({ ...contact, email: val });
                          if (checkoutBlockedReason) setCheckoutBlockedReason("");
                          if (val.trim().length > 0 && !val.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                            setContactErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
                          } else {
                            setContactErrors((prev) => ({ ...prev, email: "" }));
                          }
                        }}
                        className={inputClass(
                          contactErrors.email ||
                            (contact.email.trim().length > 0 && !contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
                        ) + " pl-10"}
                        placeholder="dr.smith@clinic.com"
                      />
                    </div>
                    {(contactErrors.email ||
                      (contact.email.trim().length > 0 && !contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))) && (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3 h-3" />
                        {contactErrors.email || "Please enter a valid email address"}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className={labelClass}>Mobile Number *</label>
                      <span className="text-[10px] text-[#627D98] font-semibold">Exact 10 digits</span>
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#627D98] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={contact.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContact({ ...contact, phone: val });
                          const digits = val.replace(/\D/g, "");
                          if (val.trim().length > 0 && digits.length !== 10) {
                            setContactErrors((prev) => ({ ...prev, phone: "Phone number must be exactly 10 digits" }));
                          } else {
                            setContactErrors((prev) => ({ ...prev, phone: "" }));
                          }
                        }}
                        className={inputClass(
                          contactErrors.phone ||
                            (contact.phone.trim().length > 0 && contact.phone.replace(/\D/g, "").length !== 10)
                        ) + " pl-10"}
                        placeholder="10 digit phone number"
                      />
                    </div>
                    {(contactErrors.phone ||
                      (contact.phone.trim().length > 0 && contact.phone.replace(/\D/g, "").length !== 10)) && (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3 h-3" />
                        {contactErrors.phone || "Phone number must be exactly 10 digits"}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleNext}
                  disabled={isSubmittingContact}
                  className="w-full mt-6 bg-[#0874C9] hover:bg-[#F28C18] disabled:bg-[#0874C9]/50 text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0874C9]/20"
                >
                  {isSubmittingContact ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Continue to Delivery</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── STEP 2: Address ── */}
            {step === 2 && (
              <div className="flex flex-col gap-6 animate-fadeIn text-left">
                {/* Heading (outside the card) */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#0874C9]" />
                    <h2 className="font-heading font-black text-xl text-[#102A43]">Delivery Address</h2>
                  </div>
                  <p className="text-xs text-[#627D98] pl-7">Select a saved delivery destination or add a new one.</p>
                </div>

                {/* If saved addresses exist AND we are not adding/editing new inline */}
                {savedAddresses.length > 0 && !isAddingNewInline ? (
                  <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center pb-3 border-b border-[#F0F6FA]">
                      <h3 className="font-heading font-bold text-sm text-[#102A43]">Saved Delivery Destinations</h3>
                      <button
                        onClick={() => {
                          setInlineForm({ id: null, fullName: "", phone: "", street: "", city: "", state: "", zip: "", country: "United States", isDefault: false });
                          setInlineErrors({});
                          setIsAddingNewInline(true);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-[#0874C9] hover:text-[#F28C18] border border-[#D9E8F2] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Address
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {savedAddresses.map((addr) => {
                        const addrKey = addr.id || addr._id;
                        const isSelected = selectedAddressId === addr.id || selectedAddressId === addr._id;
                        const isDeleting = deletingAddressId === addr.id || deletingAddressId === addr._id;

                        return (
                          <div
                            key={addrKey}
                            onClick={() => setSelectedAddressId(addr.id || addr._id)}
                            className={`border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "border-[#0874C9] bg-[#EAF5FC]/50 shadow-xs"
                                : "border-[#D9E8F2] hover:border-[#0874C9]/40 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? "border-[#0874C9]" : "border-[#D9E8F2]"
                                  }`}
                                >
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#0874C9]" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-sm text-[#102A43] truncate">{addr.fullName}</p>
                                    {addr.isDefault && (
                                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#EAF5FC] text-[#0874C9] border border-[#0874C9]/20">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#627D98] mt-0.5">{addr.phone}</p>
                                  <p className="text-xs text-[#627D98] break-words">
                                    {addr.street}, {addr.city}, {addr.state} {addr.zip}
                                  </p>
                                  <p className="text-xs text-[#627D98]">{addr.country}</p>
                                </div>
                              </div>

                              {/* Action Buttons: Edit & Delete */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleEditSavedAddress(e, addr)}
                                  title="Edit delivery destination"
                                  className="p-2 rounded-xl text-[#9FB3C8] hover:text-[#0874C9] hover:bg-[#EAF5FC] border border-transparent hover:border-[#0874C9]/20 transition-all cursor-pointer"
                                  aria-label="Edit address"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSavedAddress(e, addrKey)}
                                  disabled={isDeleting}
                                  title="Delete delivery destination"
                                  className="p-2 rounded-xl text-[#9FB3C8] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                                  aria-label="Delete address"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Inline Address Form Card */
                  <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0F6FA]">
                      <div className="flex items-center gap-2">
                        {inlineForm.id ? (
                          <Edit2 className="w-4 h-4 text-[#0874C9]" />
                        ) : (
                          <Plus className="w-4 h-4 text-[#0874C9]" />
                        )}
                        <h3 className="font-heading font-black text-base text-[#102A43]">
                          {inlineForm.id ? "Edit Delivery Address" : "Enter New Address Details"}
                        </h3>
                      </div>
                      {savedAddresses.length > 0 && (
                        <button
                          onClick={() => {
                            setIsAddingNewInline(false);
                            setInlineForm({ id: null, fullName: "", phone: "", street: "", city: "", state: "", zip: "", country: "United States", isDefault: false });
                          }}
                          className="text-xs font-bold text-[#627D98] hover:text-[#102A43] cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className={labelClass}>Full Name *</label>
                            <span className="text-[10px] text-[#627D98] font-semibold">Min 2, Max 50</span>
                          </div>
                          <input
                            type="text"
                            minLength={2}
                            maxLength={50}
                            value={inlineForm.fullName || ""}
                            onChange={(e) => setInlineForm({ ...inlineForm, fullName: e.target.value })}
                            className={`w-full bg-[#F7FAFC] border ${
                              (inlineForm.fullName || "").trim().length > 0 &&
                              ((inlineForm.fullName || "").trim().length < 2 || (inlineForm.fullName || "").trim().length > 50)
                                ? "border-red-400 focus:border-red-500 text-red-900"
                                : "border-[#D9E8F2] focus:border-[#0874C9] text-[#102A43]"
                            } rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-[#9FB3C8]`}
                            placeholder="Dr. John Smith"
                          />
                          {(inlineForm.fullName || "").trim().length > 0 &&
                            ((inlineForm.fullName || "").trim().length < 2 || (inlineForm.fullName || "").trim().length > 50) && (
                              <p className="text-[10px] font-bold text-red-500 mt-1">
                                Full name must be 2-50 chars.
                              </p>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className={labelClass}>Phone Number *</label>
                            <span className="text-[10px] text-[#627D98] font-semibold">Exact 10 digits</span>
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            value={inlineForm.phone || ""}
                            onChange={(e) => setInlineForm({ ...inlineForm, phone: e.target.value })}
                            className={`w-full bg-[#F7FAFC] border ${
                              (inlineForm.phone || "").trim().length > 0 &&
                              (inlineForm.phone || "").replace(/\D/g, "").length !== 10
                                ? "border-red-400 focus:border-red-500 text-red-900"
                                : "border-[#D9E8F2] focus:border-[#0874C9] text-[#102A43]"
                            } rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-[#9FB3C8]`}
                            placeholder="10 digit phone"
                          />
                          {(inlineForm.phone || "").trim().length > 0 &&
                            (inlineForm.phone || "").replace(/\D/g, "").length !== 10 && (
                              <p className="text-[10px] font-bold text-red-500 mt-1">
                                Phone must be 10 digits.
                              </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className={labelClass}>Street Address *</label>
                          <span className="text-[10px] text-[#627D98] font-semibold">Min 5, Max 100 chars</span>
                        </div>
                        <input
                          type="text"
                          minLength={5}
                          maxLength={100}
                          value={inlineForm.street || ""}
                          onChange={(e) => setInlineForm({ ...inlineForm, street: e.target.value })}
                          className={`w-full bg-[#F7FAFC] border ${
                            (inlineForm.street || "").trim().length > 0 &&
                            ((inlineForm.street || "").trim().length < 5 || (inlineForm.street || "").trim().length > 100)
                              ? "border-red-400 focus:border-red-500 text-red-900"
                              : "border-[#D9E8F2] focus:border-[#0874C9] text-[#102A43]"
                          } rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-[#9FB3C8]`}
                          placeholder="123 Wellness Way, Suite 400"
                        />
                        {(inlineForm.street || "").trim().length > 0 &&
                          ((inlineForm.street || "").trim().length < 5 || (inlineForm.street || "").trim().length > 100) && (
                            <p className="text-[10px] font-bold text-red-500 mt-1">
                              Address must be between 5 and 100 characters.
                            </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className={labelClass}>City *</label>
                            <span className="text-[10px] text-[#627D98] font-semibold">Min 2, Max 50</span>
                          </div>
                          <input
                            type="text"
                            minLength={2}
                            maxLength={50}
                            value={inlineForm.city || ""}
                            onChange={(e) => setInlineForm({ ...inlineForm, city: e.target.value })}
                            className={`w-full bg-[#F7FAFC] border ${
                              (inlineForm.city || "").trim().length > 0 &&
                              ((inlineForm.city || "").trim().length < 2 || (inlineForm.city || "").trim().length > 50)
                                ? "border-red-400 focus:border-red-500 text-red-900"
                                : "border-[#D9E8F2] focus:border-[#0874C9] text-[#102A43]"
                            } rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-[#9FB3C8]`}
                            placeholder="e.g. Austin"
                          />
                          {(inlineForm.city || "").trim().length > 0 &&
                            ((inlineForm.city || "").trim().length < 2 || (inlineForm.city || "").trim().length > 50) && (
                              <p className="text-[10px] font-bold text-red-500 mt-1">
                                City must be 2-50 chars.
                              </p>
                          )}
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className={labelClass}>State / Province *</label>
                            <span className="text-[10px] text-[#627D98] font-semibold">Min 2, Max 50</span>
                          </div>
                          <input
                            type="text"
                            minLength={2}
                            maxLength={50}
                            value={inlineForm.state || ""}
                            onChange={(e) => setInlineForm({ ...inlineForm, state: e.target.value })}
                            className={`w-full bg-[#F7FAFC] border ${
                              (inlineForm.state || "").trim().length > 0 &&
                              ((inlineForm.state || "").trim().length < 2 || (inlineForm.state || "").trim().length > 50)
                                ? "border-red-400 focus:border-red-500 text-red-900"
                                : "border-[#D9E8F2] focus:border-[#0874C9] text-[#102A43]"
                            } rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-[#9FB3C8]`}
                            placeholder="e.g. TX"
                          />
                          {(inlineForm.state || "").trim().length > 0 &&
                            ((inlineForm.state || "").trim().length < 2 || (inlineForm.state || "").trim().length > 50) && (
                              <p className="text-[10px] font-bold text-red-500 mt-1">
                                State must be 2-50 chars.
                              </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className={labelClass}>ZIP / Postal Code *</label>
                            <span className="text-[10px] text-[#627D98] font-semibold">Min 3, Max 10</span>
                          </div>
                          <input
                            type="text"
                            minLength={3}
                            maxLength={10}
                            value={inlineForm.zip || ""}
                            onChange={(e) => setInlineForm({ ...inlineForm, zip: e.target.value })}
                            className={`w-full bg-[#F7FAFC] border ${
                              (inlineForm.zip || "").trim().length > 0 &&
                              ((inlineForm.zip || "").trim().length < 3 || (inlineForm.zip || "").trim().length > 10)
                                ? "border-red-400 focus:border-red-500 text-red-900"
                                : "border-[#D9E8F2] focus:border-[#0874C9] text-[#102A43]"
                            } rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-[#9FB3C8]`}
                            placeholder="e.g. 78701"
                          />
                          {(inlineForm.zip || "").trim().length > 0 &&
                            ((inlineForm.zip || "").trim().length < 3 || (inlineForm.zip || "").trim().length > 10) && (
                              <p className="text-[10px] font-bold text-red-500 mt-1">
                                ZIP must be 3-10 chars.
                              </p>
                          )}
                        </div>

                        <div>
                          <label className={labelClass + " mb-1 block"}>Country *</label>
                          <CountryDropdown
                            value={inlineForm.country || "United States"}
                            dropUp={true}
                            onChange={(c) => setInlineForm({ ...inlineForm, country: c })}
                            className="w-full bg-[#F7FAFC] border border-[#D9E8F2] focus:border-[#0874C9] rounded-xl px-4 py-3 text-sm text-[#102A43] outline-none transition-all cursor-pointer flex items-center justify-between"
                          />
                        </div>
                      </div>

                      {/* Action buttons inside the card */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F6FA]">
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewInline(false);
                              setInlineForm({ id: null, fullName: "", phone: "", street: "", city: "", state: "", zip: "", country: "United States", isDefault: false });
                            }}
                            className="px-4 py-2.5 text-xs font-bold text-[#627D98] hover:text-[#102A43] rounded-xl border border-[#D9E8F2] hover:bg-[#F7FAFC] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveInlineAddress}
                          className="px-5 py-2.5 text-xs font-bold bg-[#0874C9] hover:bg-[#F28C18] text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {inlineForm.id ? "Save Address Changes" : "Save & Use Address"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {addressError && <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{addressError}</p>}

                {/* Info Text (centered) */}
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 font-bold mt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span>Your information is safe with us</span>
                </div>

                {/* Back and Continue Buttons */}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => {
                      if (isAddingNewInline && savedAddresses.length > 0) {
                        setIsAddingNewInline(false);
                      } else {
                        setStep(1);
                      }
                    }}
                    className="flex-1 border border-[#D9E8F2] text-[#627D98] hover:text-[#102A43] font-bold py-3.5 rounded-2xl hover:bg-[#F7FAFC] transition-colors cursor-pointer text-center flex items-center justify-center gap-2 bg-white"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Contact
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0874C9]/20"
                  >
                    {hasPrescriptionItems ? "Continue to Prescription" : "Continue to Payment"} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Prescription Upload (conditional) ── */}
            {step === 3 && hasPrescriptionItems && (
              <PrescriptionUploadStep
                cart={cart}
                prescriptions={prescriptions}
                onUploadPrescription={handleUploadPrescription}
                onRemovePrescription={handleRemovePrescription}
                onNext={handleNext}
                onBack={() => { setStep(2); window.scrollTo(0, 0); }}
                uploadingMap={uploadingPrescriptions}
                errorMap={prescriptionErrors}
              />
            )}

            {/* ── STEP 3 or 4: Payment ── */}
            {step === paymentStep && (
              <div className="flex flex-col gap-5 animate-fadeIn">
                {shippingLoading || loadingIntent ? (
                  <div className="border border-[#D9E8F2] rounded-3xl p-8 bg-white flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#00B5A3] animate-spin" />
                    <p className="text-xs text-[#627D98] font-bold">Loading secure payment gateway…</p>
                  </div>
                ) : ALLOW_LOCAL_PAYMENT_FALLBACK && isLocalPaymentFallback && paymentIntentId ? (
                  <LocalPaymentFallbackForm
                    cardName={cardName}
                    setCardName={setCardName}
                    handlePlaceOrder={handlePlaceOrder}
                    placing={placing}
                    checkoutError={checkoutError}
                    setStep={setStep}
                    paymentIntentId={paymentIntentId}
                    backStep={hasPrescriptionItems ? 3 : 2}
                    cart={cart}
                    cartTotal={cartTotal}
                    coupon={coupon}
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    handleApplyCoupon={handleApplyCoupon}
                    availableCoupons={availableCoupons}
                    setCoupon={setCoupon}
                    setCouponError={setCouponError}
                    couponError={couponError}
                    taxRate={taxRate}
                    shippingCost={shippingCost}
                    shippingLabel={shippingLabel}
                    shippingLoading={shippingLoading}
                  />
                ) : loadingStripe ? (
                  <div className="border border-[#D9E8F2] rounded-3xl p-8 bg-white flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#00B5A3] animate-spin" />
                    <p className="text-xs text-[#627D98] font-bold">Initializing payment service...</p>
                  </div>
                ) : stripeLoadError ? (
                  <PaymentUnavailable
                    message={stripeLoadError}
                    onBack={() => setStep(hasPrescriptionItems ? 3 : 2)}
                  />
                ) : clientSecret && stripeInstance && !isLocalPaymentIntentSecret(clientSecret) ? (
                  <Elements stripe={stripeInstance} options={{ clientSecret }}>
                    <StripePaymentForm
                      clientSecret={clientSecret}
                      cardName={cardName}
                      setCardName={setCardName}
                      handlePlaceOrder={handlePlaceOrder}
                      placing={placing}
                      checkoutError={checkoutError}
                      setCheckoutError={setCheckoutError}
                      setStep={setStep}
                      backStep={hasPrescriptionItems ? 3 : 2}
                      cart={cart}
                      cartTotal={cartTotal}
                      coupon={coupon}
                      couponCode={couponCode}
                      setCouponCode={setCouponCode}
                      handleApplyCoupon={handleApplyCoupon}
                      availableCoupons={availableCoupons}
                      setCoupon={setCoupon}
                      setCouponError={setCouponError}
                      couponError={couponError}
                      taxRate={taxRate}
                      shippingCost={shippingCost}
                      shippingLabel={shippingLabel}
                      shippingLoading={shippingLoading}
                    />
                  </Elements>
                ) : (
                  <PaymentUnavailable
                    message={checkoutError || "Payment service is temporarily unavailable."}
                    onBack={() => setStep(hasPrescriptionItems ? 3 : 2)}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          {(!hasPrescriptionItems || step !== 3) && (
          <div className="lg:col-span-1 order-1 lg:order-2">
            <OrderSummary
              cart={cart}
              cartTotal={cartTotal}
              coupon={coupon}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={() => { setCoupon(null); setCouponCode(""); setCouponError(""); }}
              couponError={couponError}
              availableCoupons={availableCoupons}
              setCoupon={setCoupon}
              setCouponError={setCouponError}
              taxRate={taxRate}
              shippingCost={shippingCost}
              shippingLabel={shippingLabel}
              shippingLoading={shippingLoading}
            />
          </div>
          )}
        </div>
      </div>

      {/* Address Modal (Ignored since we use fully inline checkout form) */}
    </div>
  );
};

const PaymentUnavailable = ({ message, onBack }) => (
  <div className="border border-red-200 rounded-3xl p-8 bg-red-50 flex flex-col items-center gap-3 text-center">
    <AlertCircle className="w-8 h-8 text-red-500" />
    <p className="text-sm text-red-600 font-black">{message}</p>
    <p className="text-xs text-red-500/80 max-w-md">
      Please try again shortly or contact support if the issue continues.
    </p>
    <button
      type="button"
      onClick={onBack}
      className="mt-2 inline-flex items-center gap-2 border border-red-200 text-red-600 font-bold text-sm px-5 py-3 rounded-full hover:bg-white transition-colors cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" /> Back to Delivery
    </button>
  </div>
);

const LocalPaymentFallbackForm = ({
  cardName,
  setCardName,
  handlePlaceOrder,
  placing,
  checkoutError,
  setStep,
  paymentIntentId,
  backStep = 2,
  cart,
  cartTotal,
  coupon,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  availableCoupons,
  setCoupon,
  setCouponError,
  couponError,
  taxRate,
  shippingLoading = false,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    handlePlaceOrder(null, null, { localPaymentIntentId: paymentIntentId });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left w-full">
      <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6">
        <h2 className="font-heading font-black text-xl text-[#102A43] mb-1">Payment Method</h2>
        <p className="text-xs text-[#627D98] mb-5">
          Secure test payment is available because the backend is running in local fallback mode.
        </p>
        <div className="border border-[#0874C9]/30 rounded-2xl p-5 bg-[#EAF5FC] flex flex-col gap-3 mb-5">
          <p className="text-xs font-black uppercase tracking-wider text-[#0874C9]">
            Local Stripe fallback
          </p>
          <p className="text-xs text-[#627D98]">
            Stripe's external script is unavailable in this environment, but the backend returned a verified local payment intent for development testing.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#627D98]">Cardholder Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#627D98] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Dr. John Doe"
                className="w-full bg-white border border-[#D9E8F2] rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] transition-all"
                required
              />
            </div>
          </div>
        </div>
      </div>



      {checkoutError && (
        <div className="text-xs text-red-500 font-semibold flex items-center gap-2 bg-red-50 border border-red-200/30 p-3.5 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(backStep)} className="flex items-center gap-2 border border-[#D9E8F2] text-[#627D98] font-bold text-sm px-6 py-3.5 rounded-full hover:bg-[#F7FAFC] transition-colors cursor-pointer bg-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="submit"
          disabled={placing || shippingLoading || !cardName.trim()}
          className="flex-1 bg-[#0874C9] hover:bg-[#F28C18] disabled:bg-[#0874C9]/50 text-white font-bold py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#0874C9]/25"
        >
          {placing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing Order...</>
          ) : (
            <>Place Secure Order <Check className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </form>
  );
};

const CheckoutReview = ({
  cart,
  cartTotal,
  coupon,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  availableCoupons,
  setCoupon,
  setCouponError,
  couponError,
  taxRate,
  shippingCost = 0,
  shippingLabel = "Shipping Fee",
  shippingLoading = false,
}) => (
  <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6 w-full">
    <h3 className="font-heading font-black text-lg text-[#102A43] mb-4">Order Summary</h3>

    <div className="flex flex-col gap-3 mb-4">
      {cart.map((item) => (
        <div key={item.id} className="flex items-center gap-3 border border-[#F0F6FA] rounded-2xl p-3">
          <ProductImage src={item.image} alt={item.name} product={item} className="w-12 h-12 rounded-xl object-cover border border-[#D9E8F2] bg-[#F7FAFC] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#102A43] truncate">{item.name}</p>
            <p className="text-xs text-[#627D98]">Qty: {item.quantity}</p>
          </div>
          <span className="text-sm font-black text-[#102A43] shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
    </div>

    {coupon ? (
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">{coupon.code} - {coupon.label}</span>
        </div>
        <button type="button" onClick={() => { setCoupon(null); setCouponCode(""); setCouponError(""); }} className="text-emerald-600 hover:text-red-500 transition-colors cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ) : (
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            placeholder="Coupon Code (e.g. PAWS10)"
            className="flex-1 border border-[#D9E8F2] rounded-xl px-4 py-2.5 text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] transition-all bg-white"
          />
          <button type="button" onClick={handleApplyCoupon} className="bg-[#0874C9] hover:bg-[#F28C18] text-white text-sm font-bold px-5 rounded-xl transition-colors cursor-pointer">
            Apply
          </button>
        </div>

        {availableCoupons.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-left bg-[#F7FAFC] border border-[#D9E8F2]/60 p-2.5 rounded-xl">
            <span className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider block shrink-0">Available:</span>
            <div className="flex flex-wrap gap-1.5">
              {availableCoupons.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCouponCode(c.code);
                    setCoupon({
                      code: c.code,
                      discount: Number(c.value ?? c.discount ?? 0),
                      type: c.type?.toLowerCase() === "percentage" || c.type?.toLowerCase() === "percent" ? "percent" : "fixed",
                      label: c.label || (c.type?.toLowerCase() === "percentage" || c.type?.toLowerCase() === "percent" ? `${c.value}% OFF` : `$${c.value} OFF`)
                    });
                    setCouponError("");
                  }}
                  className="bg-emerald-50 text-emerald-700 hover:bg-[#00B5A3] hover:text-white border border-emerald-200/50 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer"
                  title={c.description || `${c.code} - click to apply`}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )}
    {couponError && <p className="text-[10px] text-red-500 font-semibold mb-3 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{couponError}</p>}

    {(() => {
      const shipping = Number(shippingCost) || 0;
      let discount = 0;
      if (coupon) {
        discount = coupon.type === "percent"
          ? (cartTotal * coupon.discount) / 100
          : Math.min(coupon.discount, cartTotal);
      }
      const tax = Math.max(0, cartTotal - discount) * (taxRate / 100);
      const grand = cartTotal - discount + shipping + tax;
      return (
        <div className="flex flex-col gap-2 pt-3 border-t border-[#F0F6FA]">
          <div className="flex justify-between text-xs text-[#627D98]">
            <span>Items Subtotal</span><span className="font-bold text-[#102A43]">${cartTotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600">
              <span>Discount</span><span className="font-bold">-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-[#627D98]">
            <span>{shippingLabel || "Shipping Fee"}</span>
            <span className="font-bold text-[#102A43]">
              {shippingLoading ? "Calculating..." : shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[#627D98]">
            <span>Estimated Tax ({taxRate}%)</span><span className="font-bold text-[#102A43]">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-[#F0F6FA] mt-1">
            <span className="text-sm font-black text-[#102A43]">Grand Total</span>
            <span className="text-lg font-black text-[#00B5A3]">${grand.toFixed(2)}</span>
          </div>
        </div>
      );
    })()}
  </div>
);

const StripePaymentForm = ({
  clientSecret,
  cardName,
  setCardName,
  handlePlaceOrder,
  placing,
  checkoutError,
  setCheckoutError,
  setStep,
  backStep = 2,
  cart,
  cartTotal,
  coupon,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  availableCoupons,
  setCoupon,
  setCouponError,
  couponError,
  taxRate,
  shippingLoading = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stripe || !elements || !paymentElementReady) {
      setCheckoutError("Payment service is temporarily unavailable.");
      return;
    }
    handlePlaceOrder(stripe, elements);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left w-full">
      {/* Payment Method Card */}
      <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-6">
        <h2 className="font-heading font-black text-xl text-[#102A43] mb-1">Payment Method</h2>
        <p className="text-xs text-[#627D98] mb-5">Paws &amp; Care orders are processed with top-tier security standards.</p>

        {/* Pay Online selector */}
        <div className="border-2 border-[#0874C9] rounded-2xl px-5 py-4 flex items-center gap-4 mb-5 bg-[#EAF5FC]/50">
          <div className="w-5 h-5 rounded-full border-2 border-[#0874C9] flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0874C9]" />
          </div>
          <div>
            <p className="font-bold text-[#102A43] text-sm leading-tight">Pay Online</p>
            <p className="text-xs text-[#627D98] mt-0.5">Secure credit/debit card, UPI, Netbanking, or Wallet.</p>
          </div>
        </div>

        {/* Stripe Card Input Form */}
        <div className="border border-[#D9E8F2] rounded-2xl p-5 bg-[#F8FAFC] flex flex-col gap-4 mb-5">
          <p className="text-xs font-bold text-[#102A43] uppercase tracking-wider border-b border-[#D9E8F2] pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0874C9]" />
            <span>Stripe Secure Payment</span>
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#627D98]">Cardholder Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#627D98] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Dr. John Doe"
                className="w-full bg-white border border-[#D9E8F2] rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0874C9] transition-all bg-white"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#627D98]">Card Details</label>
            <PaymentElement onReady={() => setPaymentElementReady(true)} />
          </div>
        </div>


      </div>



      {checkoutError && (
        <div className="text-xs text-red-500 font-semibold flex items-center gap-2 bg-red-50 border border-red-200/30 p-3.5 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(backStep)} className="flex items-center gap-2 border border-[#D9E8F2] text-[#627D98] font-bold text-sm px-6 py-3.5 rounded-full hover:bg-[#F7FAFC] transition-colors cursor-pointer bg-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="submit"
          disabled={placing || shippingLoading || !stripe || !elements || !paymentElementReady}
          className="flex-1 bg-[#0874C9] hover:bg-[#F28C18] disabled:bg-[#0874C9]/50 text-white font-bold py-3.5 rounded-full transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#0874C9]/25"
        >
          {placing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing Order…</>
          ) : (
            <>Place Secure Order <Check className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </form>
  );
};

const CheckoutPageWrapper = () => {
  return <CheckoutPage />;
};

export default CheckoutPageWrapper;
