import React, { useContext, useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { OrderContext } from "../../context/OrderContext";
import { AuthContext } from "../../context/AuthContext";
import { orderApi } from "../../api/orderApi";
import ProductImage from "../Common/ProductImage";
import {
  Check, MapPin, Lock, AlertCircle, Loader2,
  LayoutDashboard, ShoppingBag, Sparkles, Bell, ShieldCheck
} from "lucide-react";

/* ─── Confetti Particles ─────────────────────────────────────────────────── */
const SuccessParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(18)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full opacity-0"
        style={{
          width: `${6 + (i % 4) * 4}px`,
          height: `${6 + (i % 4) * 4}px`,
          top: `${10 + (i * 13) % 80}%`,
          left: `${5 + (i * 17) % 90}%`,
          backgroundColor: ["#22C55E", "#087BC1", "#F28A16", "#18A9E5", "#073B66"][i % 5],
          animation: `sp 0.9s ${0.1 + i * 0.05}s ease-out forwards`,
        }}
      />
    ))}
  </div>
);

/* ─── Account Created Banner ─────────────────────────────────────────────── */
const AccountCreatedBanner = ({ user }) => (
  <div className="w-full bg-gradient-to-r from-[#073B66] to-[#087BC1] rounded-2xl p-5 flex items-start gap-4 border border-[#18A9E5]/30 shadow-lg shadow-[#073B66]/20">
    <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
      <Sparkles className="w-5 h-5 text-[#F28A16]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-1">
        Account Activated
      </p>
      <p className="font-bold text-white text-sm leading-snug">
        Your VetSupplyExpress account is ready, {user?.firstName || user?.name?.split(" ")[0] || "there"}!
      </p>
      <p className="text-xs text-white/70 mt-1 leading-relaxed">
        Signed in as <strong className="text-white">{user?.email}</strong>.
        Access your dashboard, track orders, manage addresses, and reorder anytime.
      </p>
      <div className="flex items-center gap-2 mt-2.5">
        <Bell className="w-3.5 h-3.5 text-[#F28A16]" />
        <span className="text-[11px] text-white/60 font-medium">
          Order updates will be sent to your registered mobile and email.
        </span>
      </div>
    </div>
  </div>
);

/* ─── Order Success Page ─────────────────────────────────────────────────── */
const parseJsonAddress = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  try {
    return JSON.parse(value);
  } catch {
    return { street: value };
  }
};

const getOrderContact = (order = {}) => {
  const shippingAddress = parseJsonAddress(order.shippingAddress);
  const contact = order.contact || {};

  return {
    fullName:
      contact.fullName ||
      contact.name ||
      order.customerName ||
      order.fullName ||
      shippingAddress?.fullName ||
      shippingAddress?.name ||
      "",
    email: contact.email || order.email || order.customerEmail || "",
    phone:
      contact.phone ||
      order.phone ||
      order.customerPhone ||
      shippingAddress?.phone ||
      "",
  };
};

const getOrderAddress = (order = {}) => {
  const shippingAddress = parseJsonAddress(order.shippingAddress);
  const address = order.address || shippingAddress || {};

  return {
    fullName: address.fullName || address.name || "",
    phone: address.phone || "",
    street:
      address.street ||
      address.address ||
      address.addressLine1 ||
      address.line1 ||
      "",
    city: address.city || "",
    state: address.state || "",
    zip: address.zip || address.zipCode || address.postalCode || "",
    country: address.country || "",
  };
};

const formatAddress = (address = {}) =>
  [address.street, address.city, address.state, address.zip, address.country]
    .filter(Boolean)
    .join(", ");

const OrderSuccessPage = ({ inlineOrder = null }) => {
  const { orderId: paramOrderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getOrder } = useContext(OrderContext);
  const { user, clearAccountCreatedFlag } = useContext(AuthContext);

  const [loading, setLoading] = useState(!inlineOrder);
  const [order, setOrder] = useState(inlineOrder);
  const [showAccountBanner, setShowAccountBanner] = useState(false);

  const orderId = inlineOrder ? inlineOrder.id : paramOrderId;

  useEffect(() => {
    window.scrollTo(0, 0);

    // Determine if we should show the account-created banner
    if (user?.accountCreatedViaOrder) {
      setShowAccountBanner(true);
      // Clear the flag after a brief delay so it won't reappear on revisit
      const t = setTimeout(() => clearAccountCreatedFlag(), 8000);
      return () => clearTimeout(t);
    }
  }, [user, clearAccountCreatedFlag]);

  useEffect(() => {
    if (inlineOrder) {
      setOrder(inlineOrder);
      setLoading(false);
      return;
    }
    if (location.state?.order) {
      setOrder(location.state.order);
      setLoading(false);
      return;
    }
    if (!orderId) {
      setLoading(false);
      return;
    }
    let isCurrent = true;
    const fetchOrderFromApi = async () => {
      // 1. Try local lookup first
      let fetched = getOrder(orderId);
      if (!fetched) {
        try {
          const stored = JSON.parse(localStorage.getItem("vet_orders") || "[]");
          fetched = stored.find((o) => o.id === orderId) || null;
        } catch { fetched = null; }
      }

      if (fetched) {
        if (isCurrent) {
          setOrder(fetched);
          setLoading(false);
        }
        return;
      }

      // 2. Fall back to API call
      try {
        const remote = await orderApi.getOrderById(orderId);
        if (isCurrent && remote) {
          setOrder(remote);
        }
      } catch (err) {
        console.error("Failed to load order from API:", err);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };
    fetchOrderFromApi();
    return () => {
      isCurrent = false;
    };
  }, [orderId, getOrder, location.state, inlineOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F9FD] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[#087BC1] animate-spin" />
        <p className="text-sm font-bold text-[#073B66]">Confirming your order…</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F3F9FD] flex flex-col items-center justify-center gap-6 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-[#9FB3C8]" />
        <div>
          <h2 className="font-heading font-black text-2xl text-[#073B66] mb-2">Order Not Found</h2>
          <p className="text-sm text-[#627D98] max-w-sm leading-relaxed">
            We could not locate your order details. Please check your email receipt.
          </p>
        </div>
        <Link to="/" className="bg-[#087BC1] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#F28A16] transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.date || order.createdAt || new Date()).toLocaleDateString("en-CA");
  const rawId = (order.id || "").replace(/\D/g, "");
  const shortRef = "#VSE-" + (rawId.slice(-6) || String(Date.now()).slice(-6));
  const contactDetails = getOrderContact(order);
  const deliveryAddress = getOrderAddress(order);
  const deliveryAddressText = formatAddress(deliveryAddress);

  return (
    <React.Fragment>
      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sp {
          0%   { transform: scale(0); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: scale(1) translateY(-40px); opacity: 0; }
        }
        .anim-pop  { animation: pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .anim-up1  { animation: fade-up 0.45s 0.1s ease-out both; }
        .anim-up2  { animation: fade-up 0.45s 0.22s ease-out both; }
        .anim-up3  { animation: fade-up 0.45s 0.36s ease-out both; }
        .anim-up4  { animation: fade-up 0.45s 0.5s ease-out both; }
        .anim-up5  { animation: fade-up 0.45s 0.62s ease-out both; }
      `}</style>

      <div className="min-h-screen bg-[#F3F9FD] py-10 px-4">
        <div className="max-w-[580px] mx-auto flex flex-col items-center gap-5">

          {/* Checkmark */}
          <div className="anim-pop relative">
            <SuccessParticles />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#087BC1] to-[#073B66] flex items-center justify-center shadow-xl shadow-[#087BC1]/30 relative z-10">
              <Check className="w-10 h-10 text-white stroke-[3]" />
            </div>
          </div>

          {/* Badge */}
          <div className="anim-up1">
            <span className="bg-[#EAF5FC] text-[#087BC1] text-[10px] font-black uppercase tracking-[0.18em] px-4 py-1.5 rounded-full border border-[#087BC1]/25">
              Order Confirmed
            </span>
          </div>

          {/* Title */}
          <div className="anim-up1 text-center">
            <h1 className="font-heading font-black text-[1.9rem] text-[#073B66] leading-tight mb-3">
              Thanks, {contactDetails.fullName?.split(" ")[0] || "there"}.
            </h1>
            <p className="text-sm text-[#627D98] leading-relaxed max-w-[400px] mx-auto">
              Your order has been placed successfully. A confirmation message and transaction summary
              have been sent to{" "}
              <strong className="text-[#073B66]">{contactDetails.email || "your email"}</strong>.
            </p>
          </div>

          {/* Account Created Banner (shown once, immediately after payment) */}
          {showAccountBanner && (
            <div className="anim-up2 w-full">
              <AccountCreatedBanner user={user} />
            </div>
          )}

          {/* Order Detail Card */}
          <div className="anim-up3 w-full bg-white rounded-3xl border border-[#D9E8F2] shadow-sm overflow-hidden">

            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-[#E8EDF2]">
              <div className="p-4 border-r border-[#E8EDF2]">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8] mb-1.5">Reference</p>
                <p className="text-sm font-black text-[#073B66]">{shortRef}</p>
              </div>
              <div className="p-4 border-r border-[#E8EDF2]">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8] mb-1.5">Order Date</p>
                <p className="text-sm font-black text-[#073B66]">{orderDate}</p>
              </div>
              <div className="p-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#9FB3C8] mb-1.5">Payment</p>
                <p className="text-sm font-black text-[#087BC1]">Paid ✓</p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">

              {/* Items */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8] mb-3">Items Ordered</p>
                <div className="flex flex-col gap-4">
                  {order.items.map((item, idx) => (
                    <div key={item.id || item.productId || item.sku || `${item.name}-${idx}`} className="flex items-center gap-4">
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        product={item}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#E8EDF2] bg-[#F7FAFC] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#073B66]">{item.name}</p>
                        <p className="text-xs text-[#9FB3C8] mt-0.5">
                          Qty: <strong className="text-[#627D98]">{item.quantity}</strong>
                          {" · "}Unit: ${Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <span className="text-sm font-black text-[#073B66] shrink-0">
                        ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#E8EDF2]" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-wider text-[#073B66]">Total Paid</p>
                <p className="text-2xl font-black text-[#087BC1]">${Number(order.grandTotal ?? order.total ?? order.amount ?? 0).toFixed(2)}</p>
              </div>


              <div className="border-t border-[#E8EDF2]" />

              {/* Contact + Address */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#087BC1] mb-2">Contact</p>
                  <p className="text-sm font-black text-[#073B66] mb-1">{contactDetails.fullName || "Customer"}</p>
                  <p className="text-[11px] text-[#627D98] mb-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wide text-[#9FB3C8]">Email: </span>
                    <span className="text-[#087BC1] font-semibold">{contactDetails.email || "Not provided"}</span>
                  </p>
                  <p className="text-[11px] text-[#627D98]">
                    <span className="text-[9px] font-black uppercase tracking-wide text-[#9FB3C8]">Mobile: </span>
                    <span className="font-semibold text-[#073B66]">{contactDetails.phone || "Not provided"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#087BC1] mb-2">Delivery Address</p>
                  <p className="text-sm font-black text-[#073B66] mb-1">{deliveryAddress.fullName || contactDetails.fullName || "Customer"}</p>
                  <div className="flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-[#9FB3C8] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-[#627D98] leading-relaxed">
                      {deliveryAddressText || "Address not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E8EDF2]" />

              {/* Security note */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#EAF5FC] flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#087BC1]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#087BC1] mb-1.5">
                    Account & Security
                  </p>
                  <p className="text-xs text-[#627D98] leading-relaxed">
                    Your profile has been created/verified using your checkout details. Log in anytime
                    to review your complete order history, manage addresses, and monitor live delivery tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="anim-up4 w-full flex flex-col sm:flex-row gap-3">
            <Link
              to="/account/dashboard"
              className="flex-1 bg-gradient-to-r from-[#073B66] to-[#087BC1] text-white font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#087BC1]/25 hover:shadow-[#087BC1]/40 hover:scale-[1.02]"
            >
              <LayoutDashboard className="w-4 h-4" />
              View My Dashboard
            </Link>
            <Link
              to="/shop"
              className="flex-1 border-2 border-[#D9E8F2] text-[#073B66] hover:border-[#087BC1]/40 hover:bg-[#EAF5FC] font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Back to home subtle link */}
          <div className="anim-up5">
            <button
              onClick={() => navigate("/")}
              className="text-xs text-[#9FB3C8] hover:text-[#627D98] font-medium transition-colors cursor-pointer"
            >
              ← Back to Home
            </button>
          </div>

        </div>
      </div>
    </React.Fragment>
  );
};

export default OrderSuccessPage;
