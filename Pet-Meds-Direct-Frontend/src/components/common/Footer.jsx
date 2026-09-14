import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  Send,
  Truck,
  RotateCcw,
  ShieldCheck,
  Heart,
  Headphones,
} from "lucide-react";
import brandLogo from "../../assets/Logo/logo-bg.png";
import { toast } from "react-hot-toast";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success(
      "Subscribed successfully! Welcome to PetMeds Direct updates.",
    );
    setEmail("");
  };

  return (
    <footer className="relative bg-white border-t border-slate-200/80 text-gray-900 font-sans pt-12 pb-16">
      {/* ─── Horizontal Features Bar ─── */}

      {/* ─── Redesigned Footer Columns ─── */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-2 gap-y-12 gap-x-6 md:grid-cols-2 lg:grid-cols-12 md:gap-12 lg:gap-16 items-start">
          {/* Column 1: Brand Info & Description */}
          <div className="col-span-2 md:col-span-1 lg:col-span-4 flex flex-col items-start text-left space-y-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-start justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-100 shadow-xs sm:h-14 sm:w-14">
                <img
                  src={brandLogo}
                  alt="PetMeds Direct"
                  className="h-[155%] w-[155%] max-w-none object-cover object-top"
                />
              </span>
              <span>
                <span className="block font-display text-lg sm:text-xl font-extrabold leading-tight tracking-[-0.02em] text-deep-navy">
                  PetMedsDirect
                </span>
                <span className="block text-[11px] font-semibold leading-tight text-slate-500">
                  Your Pet. Our Priority.
                </span>
              </span>
            </Link>

            {/* Description */}
            <p className="text-sm font-medium leading-relaxed text-slate-600 max-w-md">
              Your trusted, licensed online pharmacy dedicated to sending
              top-quality, FDA-approved medications and pet care supplies
              directly to your door.
            </p>

            {/* Social Icons inside circles/rounded blocks */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#instagram"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 hover:border-primary-green hover:bg-primary-green/5 hover:text-primary-green text-slate-500 flex items-center justify-center transition-all duration-300 group cursor-pointer"
              >
                <svg
                  className="w-4.5 h-4.5 stroke-current fill-none stroke-[2] transition-transform group-hover:scale-110"
                  viewBox="0 0 24 24"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 hover:border-primary-green hover:bg-primary-green/5 hover:text-primary-green text-slate-500 flex items-center justify-center transition-all duration-300 group cursor-pointer"
              >
                <svg
                  className="w-4.5 h-4.5 fill-current transition-transform group-hover:scale-110"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z" />
                </svg>
              </a>
              <a
                href="#twitter"
                aria-label="Twitter"
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/80 hover:border-primary-green hover:bg-primary-green/5 hover:text-primary-green text-slate-500 flex items-center justify-center transition-all duration-300 group cursor-pointer"
              >
                <svg
                  className="w-4.5 h-4.5 fill-current transition-transform group-hover:scale-110"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Explore */}
          <div className="col-span-1 lg:col-span-2 text-left">
            <h4 className="font-display text-xs font-black uppercase tracking-widest text-deep-navy mb-6">
              Explore
            </h4>
            <ul className="space-y-4">
              {[
                { label: "Shop By Category", to: "/#categories" },
                { label: "Best Seller", to: "/#bestsellers" },
                { label: "Featured Collections", to: "/products" },
                { label: "Why Choose Us", to: "/#trust-us" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm font-semibold text-slate-600 hover:text-primary-green transition-colors hover:translate-x-1 duration-200 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div className="col-span-1 lg:col-span-2 text-left">
            <h4 className="font-display text-xs font-black uppercase tracking-widest text-deep-navy mb-6">
              Support
            </h4>
            <ul className="space-y-4">
              {[
                { label: "Products", to: "/products" },
                { label: "About", to: "/about" },
                { label: "FAQ", to: "/faq" },
                { label: "Contact", to: "/contact" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm font-semibold text-slate-600 hover:text-primary-green transition-colors hover:translate-x-1 duration-200 inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Get In Touch */}
          <div className="col-span-2 md:col-span-1 lg:col-span-4 text-left space-y-6">
            <h4 className="font-display text-xs font-black uppercase tracking-widest text-deep-navy mb-2">
              Get In Touch
            </h4>
            <div className="space-y-4">
              {/* Phone item */}
              <div className="flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0 shadow-xs border border-primary-green/10">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <a
                  href="tel:18007386337"
                  className="text-sm font-bold text-slate-600 hover:text-primary-green transition-colors"
                >
                  1-800-738-6337
                </a>
              </div>
              {/* Email item */}
              <div className="flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-medical-teal/10 text-medical-teal flex items-center justify-center shrink-0 shadow-xs border border-medical-teal/10">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <a
                  href="mailto:support@petmedsdirect.com"
                  className="text-sm font-bold text-slate-600 hover:text-primary-green transition-colors"
                >
                  support@petmedsdirect.com
                </a>
              </div>{" "}
              <div className="flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0 shadow-xs border border-medical-teal/10">
                  <Headphones className="w-4.5 h-4.5" />
                </div>
                <a
                  href="mailto:support@petmedsdirect.com"
                  className="text-sm font-bold text-slate-600 hover:text-primary-green transition-colors"
                >
                  24/7 Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ─── Horizontal Features Bar ─── */}
      <div className="my-10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-8 gap-x-6 items-center">
            {/* Feature 1: Free Shipping */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0 border border-primary-green/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-display text-sm font-extrabold text-deep-navy">
                  Free Shipping
                </h5>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                  Free standard shipping
                </p>
              </div>
            </div>

            {/* Feature 2: Easy Returns */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-medical-teal/10 text-medical-teal flex items-center justify-center shrink-0 border border-medical-teal/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-display text-sm font-extrabold text-deep-navy">
                  Easy Returns
                </h5>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                  Hassle free returns
                </p>
              </div>
            </div>

            {/* Feature 3: Secure Payment */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0 border border-primary-green/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-display text-sm font-extrabold text-deep-navy">
                  Secure Payment
                </h5>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                  100% secure payments
                </p>
              </div>
            </div>

            {/* Feature 4: Genuine Products */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-medical-teal/10 text-medical-teal flex items-center justify-center shrink-0 border border-medical-teal/20">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-display text-sm font-extrabold text-deep-navy">
                  Genuine Products
                </h5>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">
                  Trusted & verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer Bottom Copyright & Links ─── */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-slate-500 font-semibold">
            &copy; 2026 PetMedsDirect. All rights reserved. Developed By{" "}
            <a
              href="https://techrabbit.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary-green hover:underline transition-colors"
            >
              Tech Rabbit
            </a>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-slate-500">
            <Link
              to="/legal/privacy-policy"
              className="hover:text-primary-green transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300 pointer-events-none">•</span>
            <Link
              to="/legal/terms-conditions"
              className="hover:text-primary-green transition-colors"
            >
              Terms & Conditions
            </Link>
            <span className="text-slate-300 pointer-events-none">•</span>
            <Link
              to="/legal/shipping-policy"
              className="hover:text-primary-green transition-colors"
            >
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
