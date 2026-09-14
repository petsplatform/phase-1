import React, { useContext } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  Truck,
  RotateCcw,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";
import logoImg from "../../assets/img.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const exploreLinks = [
    { name: "Shop By Category", path: "/#categories" },
    { name: "Best Seller", path: "/#best-sellers" },
    { name: "Featured Collections", path: "/#best-sellers" },
    { name: "Why Choose Us", path: "/about#why-choose-us" },
  ];

  const supportLinks = [
    { name: "Products", path: "/shop" },
    { name: "About", path: "/about" },
    { name: "FAQ", path: "/faq" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <footer className="select-none text-left relative overflow-hidden text-[#102A43] font-heading bg-gradient-to-b from-white via-[#FAFDFE] to-[#F3F8FC] border-t border-[#D9E8F2]">
      {/* Background Soft Blue Glow Overlay */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden select-none"
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[250px] bg-[#087BC1]/5 rounded-full blur-[90px]" />
      </div>

      {/* 1. Features Bar at the Top (Soft Light Blue background) */}
      <div className="border-b border-[#D9E8F2]/70 py-8 bg-[#FAFDFE] relative z-10">
        <div className="container-custom grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-8 gap-x-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EAF5FC] border border-[#D9E8F2]/60 flex items-center justify-center text-[#0874C9] shrink-0 shadow-xs">
              <Truck className="w-6 h-6 stroke-[1.6]" />
            </div>
            <div>
              <h4 className="font-heading font-black text-sm text-[#102A43] leading-tight">
                Free Shipping
              </h4>
              <p className="font-sans text-xs text-[#627D98] mt-1">
                On qualifying orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EAF5FC] border border-[#D9E8F2]/60 flex items-center justify-center text-[#0874C9] shrink-0 shadow-xs">
              <RotateCcw className="w-5.5 h-5.5 stroke-[1.6]" />
            </div>
            <div>
              <h4 className="font-heading font-black text-sm text-[#102A43] leading-tight">
                Easy Returns
              </h4>
              <p className="font-sans text-xs text-[#627D98] mt-1">
                See return policy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EAF5FC] border border-[#D9E8F2]/60 flex items-center justify-center text-[#0874C9] shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[1.6]" />
            </div>
            <div>
              <h4 className="font-heading font-black text-sm text-[#102A43] leading-tight">
                Secure Payment
              </h4>
              <p className="font-sans text-xs text-[#627D98] mt-1">
                100% secure payments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EAF5FC] border border-[#D9E8F2]/60 flex items-center justify-center text-[#0874C9] shrink-0 shadow-xs">
              <Heart className="w-5.5 h-5.5 stroke-[1.6]" />
            </div>
            <div>
              <h4 className="font-heading font-black text-sm text-[#102A43] leading-tight">
                Genuine Products
              </h4>
              <p className="font-sans text-xs text-[#627D98] mt-1">
                Trusted & verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 col-span-2 md:col-span-1 lg:col-span-1">
            <div className="w-12 h-12 rounded-xl bg-[#EAF5FC] border border-[#D9E8F2]/60 flex items-center justify-center text-[#0874C9] shrink-0 shadow-xs">
              <Phone className="w-5.5 h-5.5 stroke-[1.6]" />
            </div>
            <div>
              <h4 className="font-heading font-black text-sm text-[#102A43] leading-tight">
                24/7 Support
              </h4>
              <p className="font-sans text-xs text-[#627D98] mt-1">
                We're always here
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Links */}
      <div className="container-custom py-16 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-10 md:gap-10 relative z-10">
        {/* Column 1: Logo & Brand Bio & Socials */}
        <div className="col-span-2 md:col-span-1 lg:col-span-4 flex flex-col gap-5 items-start">
          <Link
            to="/"
            className="transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#087BC1] inline-block"
          >
            <img
              src={logoImg}
              alt="Vet Supply Express Logo"
              className="h-[75px] md:h-[85px] w-auto object-contain filter drop-shadow-xs"
            />
          </Link>

          <p className="text-sm text-[#627D98] leading-relaxed font-medium">
            Your trusted destination for veterinary medicines, pet wellness
            products, diagnostic supplies, and professional clinic essentials.
            Sourced directly from certified laboratories.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-2.5 mt-2">
            <a
              href="#"
              className="w-9 h-9 rounded-xl border border-[#D9E8F2] bg-white flex items-center justify-center text-[#102A43]/70 hover:bg-[#0874C9] hover:text-white hover:border-[#0874C9] transition-all duration-300 cursor-pointer hover:scale-105 shadow-xs"
              aria-label="Facebook"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-xl border border-[#D9E8F2] bg-white flex items-center justify-center text-[#102A43]/70 hover:bg-[#E1306C] hover:text-white hover:border-[#E1306C] transition-all duration-300 cursor-pointer hover:scale-105 shadow-xs"
              aria-label="Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-xl border border-[#D9E8F2] bg-white flex items-center justify-center text-[#102A43]/70 hover:bg-[#0077B5] hover:text-white hover:border-[#0077B5] transition-all duration-300 cursor-pointer hover:scale-105 shadow-xs"
              aria-label="LinkedIn"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-xl border border-[#D9E8F2] bg-white flex items-center justify-center text-[#102A43]/70 hover:bg-[#FF0000] hover:text-[#FF0000] hover:border-[#FF0000] transition-all duration-300 cursor-pointer hover:scale-105 shadow-xs"
              aria-label="YouTube"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                <polygon points="10 15 15 12 10 9" />
              </svg>
            </a>
          </div>
        </div>

        {/* Space Spacer */}
        <div className="hidden lg:block lg:col-span-1"></div>

        {/* Column 2: Explore */}
        <div className="col-span-1 lg:col-span-2">
          <h4 className="font-heading font-extrabold text-xs uppercase tracking-widest text-[#102A43] mb-6 border-l-2 border-[#0874C9] pl-3 leading-none">
            Explore
          </h4>
          <ul className="flex flex-col gap-3.5 text-sm font-semibold">
            {exploreLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="text-[#627D98] hover:text-[#0874C9] transition-colors focus:outline-none focus:underline flex items-center gap-1.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0874C9] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span>{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Support */}
        <div className="col-span-1 lg:col-span-2">
          <h4 className="font-heading font-extrabold text-xs uppercase tracking-widest text-[#102A43] mb-6 border-l-2 border-[#0874C9] pl-3 leading-none">
            Support
          </h4>
          <ul className="flex flex-col gap-3.5 text-sm font-semibold">
            {supportLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className="text-[#627D98] hover:text-[#0874C9] transition-colors focus:outline-none focus:underline flex items-center gap-1.5 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0874C9] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span>{link.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Get In Touch & Payments */}
        <div className="col-span-2 md:col-span-1 lg:col-span-3 flex flex-col gap-6">
          <div>
            <h4 className="font-heading font-extrabold text-xs uppercase tracking-widest text-[#102A43] mb-4 border-l-2 border-[#0874C9] pl-3 leading-none">
              Get In Touch
            </h4>
            <div className="flex flex-col gap-3.5 text-sm font-semibold text-[#102A43]">
              <Link
                to="/contact"
                className="flex items-center gap-3 group hover:text-[#0874C9] transition-colors w-fit"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFF3E8] text-[#F28A16] flex items-center justify-center border border-orange-50 group-hover:bg-[#F28A16] group-hover:text-white transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <span>+1 (800) 555-333</span>
              </Link>
              <a
                href="mailto:support@vetsupplyexpress.com"
                className="flex items-center gap-3 group hover:text-[#0874C9] transition-colors w-fit"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFF3E8] text-[#F28A16] flex items-center justify-center border border-orange-50 group-hover:bg-[#F28A16] group-hover:text-white transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="break-all">support@vetsupplyexpress.com</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-extrabold text-xs uppercase tracking-widest text-[#102A43] mb-4 border-l-2 border-[#0874C9] pl-3 leading-none">
              Payments Accepted
            </h4>
            <p className="text-xs text-[#627D98] mb-3 leading-relaxed">
              We support standard veterinary billing & card payments.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[#F7FAFC] border border-[#D9E8F2] px-2.5 py-1.5 rounded-lg text-[9px] font-black text-[#102A43] select-none shadow-2xs">
                VISA
              </span>
              <span className="bg-[#F7FAFC] border border-[#D9E8F2] px-2.5 py-1.5 rounded-lg text-[9px] font-black text-[#102A43] select-none shadow-2xs">
                MC
              </span>
              <span className="bg-[#F7FAFC] border border-[#D9E8F2] px-2.5 py-1.5 rounded-lg text-[9px] font-black text-[#102A43] select-none shadow-2xs">
                STRIPE
              </span>
              <span className="bg-[#F7FAFC] border border-[#D9E8F2] px-2.5 py-1.5 rounded-lg text-[9px] font-black text-[#102A43] select-none shadow-2xs">
                PAYPAL
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Copyright & Legal Links */}
      <div className="border-t border-[#D9E8F2]/60 py-6 relative z-10 bg-[#F7FAFC]/80">
        <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#627D98] font-semibold">
          <div>
            © {currentYear} VetSupplyExpress. All Rights Reserved. Developed By{" "}
            <a
              href="https://techrabbit.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#0874C9] hover:underline transition-colors"
            >
              Tech Rabbit
            </a>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
            <Link
              to="/privacy-policy"
              className="hover:text-[#0874C9] transition-colors focus:outline-none focus:underline"
            >
              Privacy Policy
            </Link>
            <span className="text-[#D9E8F2]">•</span>
            <Link
              to="/terms-conditions"
              className="hover:text-[#0874C9] transition-colors focus:outline-none focus:underline"
            >
              Terms & Conditions
            </Link>
            <span className="text-[#D9E8F2]">•</span>
            <Link
              to="/shipping-policy"
              className="hover:text-[#0874C9] transition-colors focus:outline-none focus:underline"
            >
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
