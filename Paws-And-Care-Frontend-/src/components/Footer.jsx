import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logoImg from "../assets/logo_refined.png";

// Custom Brand SVG Icons
const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-white text-brand-text pt-16 pb-8 border-t border-brand-border/60 relative overflow-hidden select-none">
      {/* Background Soft Purple/Pink Gradient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-brand-peach/30 via-transparent to-transparent rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-peach/10 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 relative z-10">
        {/* Main Footer Links & Bio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Column 1: Brand Bio & Socials (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src={logoImg}
                alt="PawsAndCare Logo"
                className="h-12 w-12 object-contain"
              />
              <span className="font-heading font-black text-2xl text-brand-text tracking-tight">
                Paws<span className="text-brand-coral">&</span>Care
              </span>
            </Link>
            <p className="font-sans text-xs sm:text-sm text-brand-muted leading-relaxed max-w-[340px]">
              Your trusted partner for premium, vet-approved pet wellness
              essentials, organic nutrition, active play gear, and 24/7 care
              guidance.
            </p>

            {/* Social Icons inside clean rounded border-boxes */}
            <div className="flex items-center gap-3 pt-2">
              {[
                {
                  icon: <InstagramIcon className="w-4.5 h-4.5" />,
                  href: "#instagram",
                },
                {
                  icon: <FacebookIcon className="w-4.5 h-4.5" />,
                  href: "#facebook",
                },
                {
                  icon: <TwitterIcon className="w-4.5 h-4.5" />,
                  href: "#twitter",
                },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="h-10 w-10 rounded-2xl border border-brand-border/80 hover:border-brand-coral text-brand-muted hover:text-brand-coral flex items-center justify-center transition-all duration-200 bg-white"
                  aria-label="Social Link"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 & 3: EXPLORE & SUPPORT (2 Cols side-by-side on mobile, 4 Cols total on desktop) */}
          <div className="grid grid-cols-2 lg:col-span-4 gap-6 sm:gap-8 lg:gap-16">
            {/* EXPLORE */}
            <div className="text-left space-y-5">
              <h3 className="font-heading font-black text-xs sm:text-sm text-brand-text tracking-widest uppercase">
                Explore
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm font-sans text-brand-muted">
                {[
                  { name: "Shop By Category", href: "/#shop-by-category" },
                  { name: "Best Seller", href: "/#best-sellers" },
                  { name: "Featured Collections", href: "/shop?filter=featured" },
                  { name: "Why Choose Us", href: "/about#why-choose-us" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="hover:text-brand-coral transition-colors duration-150"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* SUPPORT */}
            <div className="text-left space-y-5">
              <h3 className="font-heading font-black text-xs sm:text-sm text-brand-text tracking-widest uppercase">
                Support
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm font-sans text-brand-muted">
                {[
                  { name: "Products", href: "/shop" },
                  { name: "About", href: "/about" },
                  { name: "FAQ", href: "/faq" },
                  { name: "Contact", href: "/contact" },
                ].map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className="hover:text-brand-coral transition-colors duration-150"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: GET IN TOUCH (3 Cols) */}
          <div className="lg:col-span-3 text-left space-y-5">
            <h3 className="font-heading font-black text-xs sm:text-sm text-brand-text tracking-widest uppercase">
              Get In Touch
            </h3>
            <ul className="space-y-4 text-xs sm:text-sm font-sans text-brand-muted">
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-peach/50 flex items-center justify-center text-brand-coral shrink-0 border border-brand-border/40">
                  <Phone size={16} />
                </div>
                <a
                  href="tel:+18005551000"
                  className="hover:text-brand-coral transition-colors font-medium"
                >
                  +1 (800) 555-1000
                </a>
              </li>
              <li className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-peach/50 flex items-center justify-center text-brand-coral shrink-0 border border-brand-border/40">
                  <Mail size={16} />
                </div>
                <a
                  href="mailto:support@pawsandcare.com"
                  className="hover:text-brand-coral transition-colors font-medium break-all"
                >
                  support@pawsandcare.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-brand-border/60 my-10" />

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] sm:text-xs font-sans text-brand-muted/70">
          {/* Copyright Info */}
          <p className="order-last sm:order-none">
            &copy; 2026 Paws & Care. All rights reserved. Developed By{" "}
            <a
              href="https://techrabbit.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-coral hover:underline transition-colors"
            >
              Tech Rabbit
            </a>
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link
              to="/privacy-policy"
              className="hover:text-brand-coral transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-brand-muted/30 font-light">&bull;</span>
            <Link
              to="/terms-and-conditions"
              className="hover:text-brand-coral transition-colors"
            >
              Terms & Conditions
            </Link>
            <span className="text-brand-muted/30 font-light">&bull;</span>
            <Link
              to="/shipping-policy"
              className="hover:text-brand-coral transition-colors"
            >
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
