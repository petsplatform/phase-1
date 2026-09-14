import React, { useContext, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { OrderContext } from "../../context/OrderContext";
import { AppContext } from "../../context/AppContext";
import ProductImage from "../Common/ProductImage";
import {
  CheckCircle2, Package, MapPin, CreditCard, User,
  Phone, Mail, Calendar, Truck, ShoppingBag, Copy,
  ArrowRight, Download, Star, Shield, Clock, Home,
  ChevronRight, Sparkles, FileText, ExternalLink
} from "lucide-react";

/* ─── Tiny helpers ─────────────────────────────────────────────────────────── */
const fmt = (n) => `$${Number(n).toFixed(2)}`;
const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString("en-US", opts);

/* ─── Confetti-style animated dots ─────────────────────────────────────────── */
const SuccessParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(16)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full opacity-0"
        style={{
          width: `${6 + (i % 4) * 4}px`,
          height: `${6 + (i % 4) * 4}px`,
          top: `${10 + (i * 13) % 80}%`,
          left: `${5 + (i * 17) % 90}%`,
          backgroundColor: [
            "#10B981", "#0874C9", "#F28C18", "#6366F1", "#EC4899", "#14B8A6"
          ][i % 6],
          animation: `particle-pop 0.6s ${0.1 + i * 0.05}s ease-out forwards`,
        }}
      />
    ))}
  </div>
);

/* ─── Animated SVG check circle ────────────────────────────────────────────── */
const AnimatedCheck = () => (
  <div className="relative w-28 h-28 mx-auto">
    <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
    <div className="absolute inset-2 rounded-full bg-emerald-50" />
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
      <circle
        cx="50" cy="50" r="44"
        fill="none" stroke="#D1FAE5" strokeWidth="4"
      />
      <circle
        cx="50" cy="50" r="44"
        fill="none" stroke="#10B981" strokeWidth="4"
        strokeLinecap="round"
        style={{
          strokeDasharray: 276,
          strokeDashoffset: 276,
          animation: "draw-circle 0.8s 0.2s cubic-bezier(0.65,0,0.35,1) forwards",
        }}
      />
      <polyline
        points="30,52 44,66 70,38"
        fill="none" stroke="#10B981" strokeWidth="5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{
          strokeDasharray: 60,
          strokeDashoffset: 60,
          animation: "draw-check 0.4s 0.9s ease-out forwards",
        }}
      />
    </svg>
  </div>
);

/* ─── Tracking progress bar ─────────────────────────────────────────────────── */
const TrackingBar = ({ steps }) => {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round(((doneCount - 1) / (steps.length - 1)) * 100);
  return (
    <div className="relative">
      {/* background line */}
      <div className="absolute top-4 left-4 right-4 h-1 bg-[#E2EEF7] rounded-full z-0" />
      {/* filled line */}
      <div
        className="absolute top-4 left-4 h-1 bg-gradient-to-r from-[#0874C9] to-emerald-500 rounded-full z-0 transition-all duration-1000"
        style={{ width: `calc(${pct}% * (100% - 32px) / 100)` }}
      />
      <div className="flex justify-between relative z-10">
        {steps.map((step, i) => {
          const done = step.done;
          const isActive = i === doneCount - 1;
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done
                    ? "bg-[#0874C9] border-[#0874C9] shadow-md shadow-[#0874C9]/30"
                    : isActive
                    ? "bg-white border-[#0874C9]"
                    : "bg-white border-[#D9E8F2]"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${isActive ? "bg-[#0874C9] animate-pulse" : "bg-[#D9E8F2]"}`} />
                )}
              </div>
              <span
                className={`text-[10px] font-bold text-center leading-tight max-w-[60px] ${
                  done ? "text-[#0874C9]" : isActive ? "text-[#102A43]" : "text-[#9FB3C8]"
                }`}
              >
                {step.label}
              </span>
              {step.done && step.date && (
                <span className="text-[9px] text-[#9FB3C8] text-center">
                  {new Date(step.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Info chip ─────────────────────────────────────────────────────────────── */
const InfoChip = ({ icon: Icon, label, value, accent }) => (
  <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${accent || "bg-[#F7FAFC] border-[#D9E8F2]"}`}>
    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
      <Icon className="w-4 h-4 text-[#0874C9]" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8]">{label}</p>
      <p className="text-sm font-bold text-[#102A43] leading-tight">{value}</p>
    </div>
  </div>
);

/* ─── Section wrapper ───────────────────────────────────────────────────────── */
const Section = ({ children, className = "" }) => (
  <div className={`bg-white rounded-3xl border border-[#D9E8F2] shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, badge }) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F6FA]">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-[#EAF5FC] flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#0874C9]" />
      </div>
      <h3 className="font-heading font-bold text-sm text-[#102A43] uppercase tracking-wider">{title}</h3>
    </div>
    {badge && (
      <span className="text-[10px] font-black bg-[#EAF5FC] text-[#0874C9] px-2.5 py-1 rounded-full">
        {badge}
      </span>
    )}
  </div>
);

/* ─── Download Invoice (demo) ───────────────────────────────────────────────── */
const generateInvoiceText = (order) => {
  const lines = [
    "=".repeat(56),
    "          VETSUPPLYEXPRESS — TAX INVOICE",
    "=".repeat(56),
    `Order ID   : ${order.id}`,
    `Date       : ${new Date(order.date).toLocaleString()}`,
    `Status     : ${order.status}`,
    `Payment    : ${order.paymentStatus} (${order.payment?.method?.toUpperCase() || "Card"})`,
    "-".repeat(56),
    "BILL TO:",
    `  ${order.contact?.fullName}`,
    `  ${order.contact?.email}`,
    `  ${order.contact?.phone}`,
    "-".repeat(56),
    "SHIP TO:",
    `  ${order.address?.street}`,
    `  ${order.address?.city}, ${order.address?.state} ${order.address?.zip}`,
    `  ${order.address?.country}`,
    "-".repeat(56),
    `${"ITEM".padEnd(30)} ${"QTY".padEnd(6)} ${"PRICE".padEnd(10)} TOTAL`,
    "-".repeat(56),
    ...order.items.map(
      (it) =>
        `${it.name.slice(0, 28).padEnd(30)} ${String(it.quantity).padEnd(6)} ${`$${it.price.toFixed(2)}`.padEnd(10)} $${(it.price * it.quantity).toFixed(2)}`
    ),
    "-".repeat(56),
    `${"Subtotal".padEnd(44)} $${order.subtotal.toFixed(2)}`,
    order.discount > 0 ? `${"Discount".padEnd(44)} -$${order.discount.toFixed(2)}` : null,
    `${"Shipping".padEnd(44)} ${order.shipping === 0 ? "FREE" : `$${order.shipping.toFixed(2)}`}`,
    `${`Tax (${order.subtotal - (order.discount || 0) > 0 ? ((order.tax / (order.subtotal - (order.discount || 0))) * 100).toFixed(1).replace(/\.0$/, "") : "8"}%)`.padEnd(44)} $${order.tax.toFixed(2)}`,
    "=".repeat(56),
    `${"GRAND TOTAL".padEnd(44)} $${order.grandTotal.toFixed(2)}`,
    "=".repeat(56),
    "",
    "  Thank you for choosing VetSupplyExpress!",
    "  For support: support@vetsupplyexpress.com",
    "=".repeat(56),
  ]
    .filter(Boolean)
    .join("\n");

  return lines;
};

const handleDownloadInvoice = (order) => {
  const text = generateInvoiceText(order);
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${order.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getOrder } = useContext(OrderContext);
  const { addToast } = useContext(AppContext);
  const order = getOrder(orderId);

  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      addToast({ title: "Copied!", message: `Order ID ${orderId} copied.`, type: "cart" });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── 404 state ── */
  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#EAF5FC] flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-[#9FB3C8]" />
        </div>
        <div>
          <h2 className="font-heading font-black text-2xl text-[#102A43] mb-2">Order Not Found</h2>
          <p className="text-sm text-[#627D98]">
            We couldn't find an order with ID <strong className="text-[#102A43]">{orderId}</strong>.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/my-orders" className="bg-[#0874C9] text-white font-bold px-6 py-3 rounded-2xl hover:bg-[#F28C18] transition-colors">
            View My Orders
          </Link>
          <Link to="/shop" className="border border-[#D9E8F2] text-[#627D98] font-bold px-6 py-3 rounded-2xl hover:border-[#0874C9]/40 hover:text-[#0874C9] transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  /* ── Computed values ── */
  const estimatedDate = fmtDate(order.estimatedDelivery, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const orderDate = fmtDate(order.date, {
    year: "numeric", month: "long", day: "numeric",
  });
  const orderTime = new Date(order.date).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes draw-circle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
        @keyframes particle-pop {
          0%   { transform: scale(0) translate(0,0); opacity: 0; }
          60%  { opacity: 1; }
          100% { transform: scale(1) translate(var(--tx,0px), var(--ty,0px)); opacity: 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes badge-bounce {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
        .anim-up-1 { animation: slide-up 0.5s 0.1s ease-out both; }
        .anim-up-2 { animation: slide-up 0.5s 0.25s ease-out both; }
        .anim-up-3 { animation: slide-up 0.5s 0.4s ease-out both; }
        .anim-up-4 { animation: slide-up 0.5s 0.55s ease-out both; }
        .anim-up-5 { animation: slide-up 0.5s 0.7s ease-out both; }
        .badge-anim { animation: badge-bounce 1.5s 1.2s ease-in-out 2; }
      `}</style>

      <div className={`min-h-screen bg-[#F7FAFC] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>

        {/* ── Top Header ── */}
        <div className="bg-[#0B2D4F] py-4 px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg">
          <Link to="/" className="font-heading font-black text-white text-lg tracking-wider">
            VetSupply<span className="text-[#F28C18]">Express</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Order Successfully Placed</span>
          </div>
          <Link to="/shop" className="text-slate-400 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Continue Shopping</span>
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

          {/* ── HERO SUCCESS CARD ── */}
          <div className="anim-up-1 relative bg-white rounded-3xl border border-[#D9E8F2] shadow-sm overflow-hidden mb-8">
            {/* Gradient top bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-[#0874C9] to-[#F28C18]" />

            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-emerald-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#EAF5FC] translate-x-1/2 translate-y-1/2 pointer-events-none" />
            <SuccessParticles />

            <div className="relative z-10 flex flex-col items-center text-center px-6 py-12 md:py-16">
              <AnimatedCheck />

              <div className="mt-8 mb-4 badge-anim inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Order Confirmed
              </div>

              <h1 className="font-heading font-black text-3xl md:text-4xl text-[#102A43] mb-3">
                Thank you, {order.contact?.fullName?.split(" ")[0]}! 🎉
              </h1>
              <p className="text-[#627D98] text-sm md:text-base max-w-lg leading-relaxed">
                Your veterinary supplies are being prepared for dispatch. You'll receive email updates as your order progresses.
              </p>

              {/* Order ID pill */}
              <div className="flex items-center gap-3 bg-[#F7FAFC] border border-[#D9E8F2] rounded-2xl px-5 py-3.5 mt-8 cursor-pointer hover:border-[#0874C9]/40 transition-all group" onClick={copyOrderId}>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8] text-left">Order ID</p>
                  <p className="font-heading font-black text-xl text-[#0874C9]">{order.id}</p>
                </div>
                <div className="ml-2 p-2 rounded-xl bg-white border border-[#D9E8F2] group-hover:bg-[#EAF5FC] transition-colors">
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#627D98] group-hover:text-[#0874C9]" />
                  )}
                </div>
              </div>

              {/* Status pills */}
              <div className="flex items-center justify-center gap-3 flex-wrap mt-6">
                <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-4 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700">{order.status}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-[#EAF5FC] border border-[#D9E8F2] px-4 py-1.5 rounded-full">
                  <CreditCard className="w-3.5 h-3.5 text-[#0874C9]" />
                  <span className="text-xs font-bold text-[#0874C9]">{order.paymentStatus}</span>
                </span>
                <span className="flex items-center gap-1.5 bg-[#FFF8ED] border border-amber-200 px-4 py-1.5 rounded-full">
                  <Truck className="w-3.5 h-3.5 text-[#F28C18]" />
                  <span className="text-xs font-bold text-[#F28C18]">Arrives {estimatedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── ORDER TRACKING ── */}
          <div className="anim-up-2 mb-8">
            <Section>
              <SectionHeader icon={Truck} title="Order Tracking" badge={order.status} />
              <div className="p-6 md:p-8">
                <TrackingBar steps={order.trackingSteps} />
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-[#627D98]">
                    Estimated delivery: <strong className="text-[#102A43]">{estimatedDate}</strong>
                  </p>
                  <Link
                    to={`/track-order/${order.id}`}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#0874C9] hover:text-[#F28C18] transition-colors"
                  >
                    Full Tracking <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Section>
          </div>

          {/* ── ORDER META INFO ── */}
          <div className="anim-up-2 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <InfoChip icon={Calendar} label="Order Date" value={orderDate} />
            <InfoChip icon={Clock} label="Time" value={orderTime} />
            <InfoChip icon={CreditCard} label="Payment" value={order.payment?.method?.toUpperCase() === "CARD" ? "Credit Card" : (order.payment?.method || "Online")} />
            <InfoChip icon={Star} label="Estimated" value="5 Business Days" accent="bg-[#FFF8ED] border-amber-200" />
          </div>

          {/* ── TWO COLUMN: Products + Summary ── */}
          <div className="anim-up-3 grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

            {/* Products — wider */}
            <div className="lg:col-span-3">
              <Section className="h-full">
                <SectionHeader icon={Package} title="Ordered Products" badge={`${order.items.length} items`} />
                <div className="divide-y divide-[#F0F6FA]">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                      <div className="relative shrink-0">
                        <ProductImage
                          src={item.image}
                          alt={item.name}
                          product={item}
                          className="w-16 h-16 rounded-2xl object-cover border border-[#D9E8F2] bg-[#F7FAFC]"
                        />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#0874C9] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#102A43] truncate">{item.name}</p>
                        <p className="text-xs text-[#627D98] mt-0.5">
                          {item.quantity} × {fmt(item.price)}
                        </p>
                        {item.brand && (
                          <span className="text-[10px] font-bold text-[#0874C9] bg-[#EAF5FC] px-2 py-0.5 rounded-full mt-1 inline-block">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <p className="font-black text-[#0874C9] shrink-0">{fmt(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Price Summary — narrower */}
            <div className="lg:col-span-2">
              <Section className="h-full">
                <SectionHeader icon={FileText} title="Price Summary" />
                <div className="p-6 flex flex-col gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#627D98]">Subtotal</span>
                    <span className="font-bold text-[#102A43]">{fmt(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">
                        Discount {order.coupon ? `(${order.coupon})` : ""}
                      </span>
                      <span className="font-bold text-emerald-600">−{fmt(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#627D98]">Shipping</span>
                    {order.shipping === 0 ? (
                      <span className="font-bold text-emerald-600">FREE</span>
                    ) : (
                      <span className="font-bold text-[#102A43]">{fmt(order.shipping)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#627D98]">Tax ({order.subtotal - (order.discount || 0) > 0 ? ((order.tax / (order.subtotal - (order.discount || 0))) * 100).toFixed(1).replace(/\.0$/, "") : "8"}%)</span>
                    <span className="font-bold text-[#102A43]">{fmt(order.tax)}</span>
                  </div>
                  <div className="border-t border-[#D9E8F2] pt-3 mt-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-[#102A43]">Grand Total</span>
                      <span className="font-black text-2xl text-[#0874C9]">{fmt(order.grandTotal)}</span>
                    </div>
                  </div>

                  {order.payment?.last4 && (
                    <div className="mt-3 bg-[#F7FAFC] border border-[#D9E8F2] rounded-2xl px-4 py-3 flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-[#0874C9] shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-[#9FB3C8] uppercase tracking-wider">Card Used</p>
                        <p className="text-sm font-bold text-[#102A43]">•••• •••• •••• {order.payment.last4}</p>
                      </div>
                    </div>
                  )}

                  {order.shipping === 0 && (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mt-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <p className="text-xs font-semibold text-emerald-700">Free shipping applied!</p>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>

          {/* ── CONTACT + ADDRESS ── */}
          <div className="anim-up-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Contact */}
            <Section>
              <SectionHeader icon={User} title="Contact Details" />
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF5FC] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#0874C9]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#9FB3C8] uppercase tracking-wider">Full Name</p>
                    <p className="font-bold text-[#102A43]">{order.contact?.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF5FC] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-[#0874C9]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#9FB3C8] uppercase tracking-wider">Email</p>
                    <p className="text-sm text-[#627D98]">{order.contact?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#EAF5FC] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-[#0874C9]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#9FB3C8] uppercase tracking-wider">Phone</p>
                    <p className="text-sm text-[#627D98]">{order.contact?.phone}</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Address */}
            <Section>
              <SectionHeader icon={MapPin} title="Delivery Address" />
              {order.address ? (
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#EAF5FC] flex items-center justify-center shrink-0 mt-0.5">
                      <Home className="w-4 h-4 text-[#0874C9]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="font-black text-[#102A43]">{order.address.fullName}</p>
                      <p className="text-sm text-[#627D98]">{order.address.phone}</p>
                      <p className="text-sm text-[#627D98]">{order.address.street}</p>
                      <p className="text-sm text-[#627D98]">
                        {order.address.city}, {order.address.state} {order.address.zip}
                      </p>
                      <p className="text-sm text-[#627D98]">{order.address.country}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-[#9FB3C8]">No address on file</div>
              )}
            </Section>
          </div>

          {/* ── CTA BUTTONS ── */}
          <div className="anim-up-5 flex flex-col sm:flex-row gap-4">
            {/* Track Order — primary */}
            <Link
              to={`/track-order/${order.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0874C9] hover:bg-[#065da3] text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-[#0874C9]/25 hover:shadow-[#0874C9]/40 group"
            >
              <Truck className="w-4 h-4" />
              Track Order
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* View My Orders */}
            <Link
              to="/my-orders"
              className="flex-1 flex items-center justify-center gap-2 bg-[#0B2D4F] hover:bg-[#F28C18] text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-md"
            >
              <Package className="w-4 h-4" />
              View My Orders
            </Link>

            {/* Continue Shopping */}
            <Link
              to="/shop"
              className="flex-1 flex items-center justify-center gap-2 border-2 border-[#D9E8F2] text-[#627D98] hover:border-[#0874C9]/40 hover:text-[#0874C9] font-bold py-4 rounded-2xl transition-all duration-300 bg-white"
            >
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
            </Link>

            {/* Download Invoice */}
            <button
              onClick={() => {
                handleDownloadInvoice(order);
                addToast({ title: "Invoice Downloaded", message: `Invoice for ${order.id} saved.`, type: "cart" });
              }}
              className="flex-1 flex items-center justify-center gap-2 border-2 border-[#D9E8F2] text-[#627D98] hover:border-emerald-400 hover:text-emerald-600 font-bold py-4 rounded-2xl transition-all duration-300 bg-white cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
          </div>

          {/* ── Footer note ── */}
          <div className="mt-10 text-center">
            <p className="text-xs text-[#9FB3C8]">
              Need help? Contact us at{" "}
              <a href="mailto:support@vetsupplyexpress.com" className="text-[#0874C9] font-semibold hover:underline">
                support@vetsupplyexpress.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderConfirmationPage;
