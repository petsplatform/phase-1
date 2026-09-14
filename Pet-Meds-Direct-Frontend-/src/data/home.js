import {
  BadgeCheck,
  ShieldCheck,
  Star,
  RefreshCw,
} from "lucide-react";

/* ── Trust badges data ── */
export const trustBadges = [
  { Icon: ShieldCheck, label: "Vet Verified" },
  { Icon: RefreshCw, label: "Auto-Ship & Save" },
  // { Icon: Star, label: "4.9★ Rated" },
  { Icon: BadgeCheck, label: "Licensed Pharmacy" },
];


/* ── Promo Banners Data ── */
import subscribeDog from "../assets/Home/PromoBanner/subscribe-dog.png";
import vetAssistance from "../assets/Home/PromoBanner/vet-assistance.png";

export const promoBanners = [
  {
    id: "subscribe-save",
    badge: "HAPPY PETS CLUB",
    title: "Subscribe & Save 15% on Every Order",
    description: "Never run out of pet essentials. Join our monthly auto-ship program.",
    buttonName: "Join the Club Today",
    buttonLink: "#subscribe",
    image: subscribeDog,
    badgeBg: "bg-emerald-50/80",
    badgeText: "text-dark-green",
    badgeBorder: "border-primary-green/20",
    gradient: "from-soft-mint/70 via-white/80 to-white/90",
    btnBg: "bg-linear-to-br from-primary-green to-dark-green shadow-[0_12px_24px_rgba(88,185,71,0.2)] hover:shadow-[0_16px_32px_rgba(88,185,71,0.3)] text-white",
  },
  {
    id: "vet-assistance",
    badge: "LIVE VET CHAT",
    title: "24/7 Professional Vet Assistance",
    description: "Get unlimited support with certified veterinary assistants anytime, anywhere.",
    buttonName: "Consult Now",
    buttonLink: "#vet-chat",
    image: vetAssistance,
    badgeBg: "bg-sky-50/80",
    badgeText: "text-medical-teal",
    badgeBorder: "border-medical-teal/20",
    gradient: "from-light-blue/70 via-white/80 to-white/90",
    btnBg: "bg-linear-to-br from-medical-teal to-primary-green shadow-[0_12px_24px_rgba(0,139,139,0.2)] hover:shadow-[0_16px_32px_rgba(0,139,139,0.3)] text-white",
  },
];
