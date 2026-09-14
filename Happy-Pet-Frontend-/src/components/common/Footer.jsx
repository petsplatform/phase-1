import React from "react";
import { Link } from "react-router-dom";
import footerlogo from "../../assets/logo/logo-bg.png";
import {
  Phone,
  Mail,
  Clock,
  Truck,
  RotateCcw,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { footerData } from "../../utils/common/footer.js";

export default function Footer() {
  return (
    <footer
      className="text-brand-purple pt-12 pb-6 relative overflow-hidden select-none border-t border-[#f0ebf8]"
      style={{
        background: "linear-gradient(180deg, #faf8ff 0%, #fffbf7 100%)",
      }}
    >
      {/* Soft background decor blurs */}
      <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-brand-peach/10 blur-[90px] pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-brand-purple/5 blur-[80px] pointer-events-none"></div>

      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* PART 2: Main Grid Area */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-12 pb-6 border-b border-[#f0ebf8]">
          {/* Column 1: Brand Info & Socials */}
          <div className="col-span-2 md:col-span-1 lg:col-span-4 text-left">
            <div className="mb-3">
              <img
                src={footerlogo}
                alt="HappyPet Rx"
                className="h-20 w-auto object-contain"
              />
            </div>

            <p className="text-brand-brown/70 text-[13px] leading-relaxed font-medium max-w-sm">
              {footerData.about.description}
            </p>

            {/* Social Icons Row */}
            <div className="flex gap-3 mt-4">
              {footerData.socials.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white border border-[#e2dcf0] flex items-center justify-center text-brand-purple hover:bg-brand-purple hover:text-white hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
                  aria-label={`Follow us on ${item.name}`}
                >
                  {item.id === "instagram" && (
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  )}
                  {item.id === "facebook" && (
                    <svg
                      className="w-4.5 h-4.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.95z" />
                    </svg>
                  )}
                  {item.id === "twitter" && (
                    <svg
                      className="w-4.5 h-4.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Categories */}
          <div className="col-span-1 lg:col-span-2 text-left md:pl-4">
            <h4 className="text-xs font-extrabold text-brand-purple tracking-widest uppercase mb-6">
              Explore
            </h4>
            <div className="flex flex-col gap-3 font-semibold text-sm text-brand-brown/70">
              {footerData.categories.map((item, idx) => {
                const isExternal = item.link.startsWith("http");
                return isExternal ? (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-purple transition-all transform hover:translate-x-1 w-fit"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={idx}
                    to={item.link}
                    className="hover:text-brand-purple transition-all transform hover:translate-x-1 w-fit"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Column 3: Customer Care */}
          <div className="col-span-1 lg:col-span-2 text-left md:pl-4">
            <h4 className="text-xs font-extrabold text-brand-purple tracking-widest uppercase mb-6">
              Support
            </h4>
            <div className="flex flex-col gap-3 font-semibold text-sm text-brand-brown/70">
              {footerData.support.map((item, idx) => {
                const isExternalOrHash =
                  item.link.startsWith("#") || item.link.startsWith("http");
                return isExternalOrHash ? (
                  <a
                    key={idx}
                    href={item.link}
                    className="hover:text-brand-purple transition-all transform hover:translate-x-1 w-fit"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={idx}
                    to={item.link}
                    className="hover:text-brand-purple transition-all transform hover:translate-x-1 w-fit"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Column 4: Contact details */}
          <div className="col-span-2 md:col-span-1 lg:col-span-4 text-left">
            <h4 className="text-xs font-extrabold text-brand-purple tracking-widest uppercase mb-6">
              Get in Touch
            </h4>

            <div className="flex flex-col gap-4 text-sm font-semibold text-brand-brown/85">
              <a
                href={`tel:${footerData.contact.phone}`}
                className="flex items-center gap-3 group/item hover:text-brand-purple transition-all duration-300 w-fit"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0 shadow-inner group-hover/item:bg-brand-purple group-hover/item:text-white transition-all duration-300">
                  <Phone className="w-4 h-4" />
                </div>
                <span>{footerData.contact.phone}</span>
              </a>
              <a
                href={`mailto:${footerData.contact.email}`}
                className="flex items-center gap-3 group/item hover:text-brand-purple transition-all duration-300 w-fit"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0 shadow-inner group-hover/item:bg-brand-purple group-hover/item:text-white transition-all duration-300">
                  <Mail className="w-4 h-4" />
                </div>
                <span>{footerData.contact.email}</span>
              </a>
              <div className="flex items-start gap-3 w-fit">
                <div className="w-8 h-8 rounded-lg bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0 shadow-inner mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-semibold text-sm">
                    Available 24/7
                  </span>
                  <span className="text-[11px] text-brand-brown/60 block font-normal leading-tight mt-0.5">
                    For prescriptions & support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PART 2.5: E-commerce Trust Badges Row */}
        <div className="py-6 border-b border-[#f0ebf8] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6 text-left">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-8 h-8 text-brand-brown flex-shrink-0" />
            <div>
              <span className="block text-[13px] font-bold text-brand-purple leading-tight font-display">
                Easy Returns
              </span>
              <span className="block text-[11px] text-brand-brown/70 font-semibold mt-0.5">
                Hassle free returns
              </span>
            </div>
          </div>
          {/* Badge 3 */}
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-brand-brown flex-shrink-0" />
            <div>
              <span className="block text-[13px] font-bold text-brand-purple leading-tight font-display">
                Secure Payment
              </span>
              <span className="block text-[11px] text-brand-brown/70 font-semibold mt-0.5">
                100% secure payments
              </span>
            </div>
          </div>
          {/* Badge 4 */}
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-brand-brown flex-shrink-0" />
            <div>
              <span className="block text-[13px] font-bold text-brand-purple leading-tight font-display">
                Genuine Products
              </span>
              <span className="block text-[11px] text-brand-brown/70 font-semibold mt-0.5">
                Trusted & verified
              </span>
            </div>
          </div>
          {/* Badge 5 */}
          <div className="flex items-center gap-3">
            <Phone className="w-8 h-8 text-brand-brown flex-shrink-0" />
            <div>
              <span className="block text-[13px] font-bold text-brand-purple leading-tight font-display">
                24/7 Support
              </span>
              <span className="block text-[11px] text-brand-brown/70 font-semibold mt-0.5">
                We're always here
              </span>
            </div>
          </div>
        </div>

        {/* PART 3: Bottom Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] font-semibold text-brand-brown/50 order-2 sm:order-1">
            {footerData.about.copyright} Developed By{" "}
            <a
              href="https://techrabbit.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-purple hover:underline transition-colors"
            >
              Tech Rabbit
            </a>
          </p>

          <div className="flex items-center gap-3 text-[12px] font-semibold text-brand-brown/50 order-1 sm:order-2">
            <Link
              to="/privacy-policy"
              className="hover:text-brand-purple transition-colors"
            >
              Privacy Policy
            </Link>
            •
            <Link
              to="/terms-conditions"
              className="hover:text-brand-purple transition-colors"
            >
              Terms & Conditions
            </Link>
            •
            <Link
              to="/shipping-policy"
              className="hover:text-brand-purple transition-colors"
            >
              Shipping Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
