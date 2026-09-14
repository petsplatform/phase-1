import { useState, useEffect } from "react";
import footerlogo from "../../assets/Logo/footer-logo.png";
import {
  Globe,
  Mail,
  MessageCircle,
  Send,
  Phone,
  ShieldCheck,
  Truck,
  Heart,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { contentApi } from "../../api/contentApi";

const defaultShopLinks = [
  { label: "Shop by Category", href: "/#shop-by-category" },
  { label: "Featured Collections", href: "/shop" },
  { label: "Best Sellers", href: "/#best-sellers" },
  { label: "Pet Care Guide", href: "/#pet-care-guide" },
];

const supportLinks = [
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

function Footer() {
  const year = new Date().getFullYear();
  const [categories, setCategories] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch dynamic categories from API
    productApi
      .getCategories()
      .then((items) => {
        if (!isMounted) return;
        if (Array.isArray(items) && items.length > 0) {
          setCategories(items);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch categories for footer:", err);
      });

    // Fetch store content / settings from API
    // contentApi
    //   .getSettings()
    //   .then((settings) => {
    //     if (!isMounted || !settings) return;
    //     setStoreInfo(settings);
    //   })
    //   .catch(() => {
    //     // Fallback silently if endpoint is unavailable
    //   });

    return () => {
      isMounted = false;
    };
  }, []);

  // Build shop/explore links dynamically if API categories exist
  const exploreLinks =
    categories.length > 0
      ? categories.slice(0, 5).map((cat) => ({
          label: cat.name || cat.title || "Category",
          href: `/shop?category=${encodeURIComponent(cat.name || cat.title || "")}`,
        }))
      : defaultShopLinks;

  return (
    <footer
      id="footer"
      className="relative border-t border-outline/80 bg-[#FAF9F5] grain-panel overflow-hidden"
    >
      {/* Decorative background blurs */}
      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-[#176b59]/4 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 h-64 w-64 rounded-full bg-[#8a72c7]/4 blur-3xl -translate-y-1/2 pointer-events-none" />

      {/* Decorative Floating Paw Print */}
      <div className="absolute bottom-6 right-12 text-[#102B2B]/4 pointer-events-none select-none">
        <svg className="h-24 w-24" fill="currentColor" viewBox="0 0 24 24">
          {/* Pad */}
          <path d="M12 10c-2.2 0-4 1.8-4 4 0 2.5 3 5 4 6 1-1 4-3.5 4-6 0-2.2-1.8-4-4-4z" />
          {/* Toes */}
          <circle cx="7.5" cy="8.5" r="1.5" />
          <circle cx="10.5" cy="5.5" r="1.5" />
          <circle cx="13.5" cy="5.5" r="1.5" />
          <circle cx="16.5" cy="8.5" r="1.5" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[1440px] px-6 py-14 sm:px-8 lg:px-12 lg:py-16">
        <div className="grid grid-cols-2 gap-10 sm:gap-12 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr] lg:gap-8">
          {/* Brand & Social Column */}
          <div className="col-span-2 flex flex-col gap-6 lg:col-span-1 lg:h-full lg:justify-between lg:gap-0">
            <div>
              <Link
                to="/"
                className="inline-block transition-transform duration-300 hover:scale-102"
              >
                <img
                  src={footerlogo}
                  alt="Budget PetShop"
                  className="h-20 w-auto lg:h-22 object-contain"
                />
              </Link>

              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-charcoal-text">
                {storeInfo?.description ||
                  "Affordable pet essentials, premium food, toys, grooming products, and healthcare delivered with love."}
              </p>
            </div>

            <div className="mt-2">
              <span className="block text-[11px] font-extrabold text-[#8C8275] uppercase tracking-widest mb-3.5">
                Connect With Us
              </span>
              <div className="flex items-center gap-3">
                {[
                  {
                    Icon: Globe,
                    href: "#",
                    label: "Website",
                    color:
                      "hover:bg-[#176b59] hover:border-[#176b59] hover:shadow-[#176b59]/20",
                  },
                  {
                    Icon: MessageCircle,
                    href: "#",
                    label: "Live Chat",
                    color:
                      "hover:bg-[#8a72c7] hover:border-[#8a72c7] hover:shadow-[#8a72c7]/20",
                  },
                  {
                    Icon: Send,
                    href: "#",
                    label: "Telegram",
                    color:
                      "hover:bg-[#176b59] hover:border-[#176b59] hover:shadow-[#176b59]/20",
                  },
                  {
                    Icon: Mail,
                    href: "#",
                    label: "Email Support",
                    color:
                      "hover:bg-[#8a72c7] hover:border-[#8a72c7] hover:shadow-[#8a72c7]/20",
                  },
                ].map(({ Icon, href, label, color }, index) => (
                  <a
                    key={index}
                    href={href}
                    aria-label={label}
                    className={`group flex h-11 w-11 items-center justify-center rounded-full border border-outline bg-white shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:text-white ${color} hover:shadow-md`}
                  >
                    <Icon
                      size={18}
                      className="text-on-background transition-colors duration-300 group-hover:text-white"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Explore Column */}
          <div className="col-span-1">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#176b59] pl-3 border-l-2 border-[#176b59]/50">
              Explore
            </h3>

            <ul className="mt-6 space-y-4">
              {exploreLinks.map((item, idx) => (
                <li key={idx}>
                  <Link
                    to={item.href}
                    className="group inline-flex items-center text-[15px] font-medium text-on-background/85 transition-colors duration-300 hover:text-[#176b59]"
                  >
                    <span className="relative pb-0.5">
                      {item.label}
                      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#176b59]/65 transition-all duration-300 group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="col-span-1">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#176b59] pl-3 border-l-2 border-[#176b59]/50">
              Support
            </h3>

            <ul className="mt-6 space-y-4">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="group inline-flex items-center text-[15px] font-medium text-on-background/85 transition-colors duration-300 hover:text-[#176b59]"
                  >
                    <span className="relative pb-0.5">
                      {item.label}
                      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#176b59]/65 transition-all duration-300 group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get In Touch Column */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-secondary pl-3 border-l-2 border-secondary/50">
              Get In Touch
            </h3>

            <div className="mt-6 space-y-4">
              {/* Phone support card */}
              <p className="group flex items-center gap-4 rounded-2xl border border-outline bg-white/60 p-4 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:border-[#176b59]/30 hover:bg-white hover:shadow-sm hover:shadow-[#176b59]/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#176b59]/5 text-[#176b59] border border-[#176b59]/10 transition-colors duration-300 group-hover:bg-[#176b59] group-hover:text-white group-hover:border-[#176b59]">
                  <Phone size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold text-[#8C8275] uppercase tracking-wider">
                    Phone Support
                  </span>
                  <span className="block text-[13px] sm:text-[14px] font-bold text-on-background transition-colors duration-300 group-hover:text-[#176b59] truncate">
                    {storeInfo?.phone || "+1 (800) 555-1000"}
                  </span>
                </div>
              </p>

              {/* Email support card */}
              <a
                href={`mailto:${storeInfo?.email || "support@budgetpetshop.com"}`}
                className="group flex items-center gap-4 rounded-2xl border border-outline bg-white/60 p-4 shadow-2xs transition-all duration-300 hover:-translate-y-0.5 hover:border-secondary/30 hover:bg-white hover:shadow-sm hover:shadow-secondary/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/5 text-secondary border border-secondary/10 transition-colors duration-300 group-hover:bg-secondary group-hover:text-white group-hover:border-secondary">
                  <Mail size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold text-[#8C8275] uppercase tracking-wider">
                    Email Support
                  </span>
                  <span className="block text-[13px] sm:text-[14px] font-bold text-on-background transition-colors duration-300 group-hover:text-secondary truncate">
                    {storeInfo?.email || "support@budgetpetshop.com"}
                  </span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Trust Badges Row */}
        <div className="relative border-t border-outline/70 mt-10 pt-10 backdrop-blur-xs">
          <div className="mx-auto">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Secure Checkout",
                  desc: "100% protected payments",
                  color:
                    "text-emerald-600 bg-emerald-50/50 border-emerald-100/60",
                },
                // {
                //   icon: Truck,
                //   title: "Fast Delivery",
                //   desc: "Free on orders over $49",
                //   color: "text-secondary bg-secondary/5 border-secondary/10",
                // },
                {
                  icon: Heart,
                  title: "Pet Love Guarantee",
                  desc: "Happiness or money back",
                  color: "text-rose-500 bg-rose-50/50 border-rose-100/60",
                },
                {
                  icon: Sparkles,
                  title: "Premium Quality",
                  desc: "Vetted pet-safe items",
                  color: "text-accent bg-accent/5 border-accent/10",
                },
              ].map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div key={idx} className="flex items-center gap-3.5 group">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-105 ${badge.color} shrink-0`}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-extrabold text-on-background uppercase tracking-wider">
                        {badge.title}
                      </h4>
                      <p className="text-[11px] text-charcoal-text font-medium mt-0.5 leading-tight">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col gap-6 border-t border-outline/70 pt-8 text-[14px] text-charcoal-text items-center text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
          <p className="font-medium">
            © {year}{" "}
            <span className="font-bold text-on-background">Budget PetShop</span>
            . All rights reserved. Developed By{" "}
            <a
              href="https://techrabbit.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#176b59] hover:underline transition-colors"
            >
              Tech Rabbit
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-end">
            {[
              { label: "Privacy Policy", to: "/privacy-privacy" },
              { label: "Terms & Conditions", to: "/terms-conditions" },
              { label: "Shipping Policy", to: "/shipping-policy" },
            ].map((link, idx, arr) => (
              <span key={link.to} className="flex items-center">
                <Link
                  to={link.to}
                  className="font-medium text-charcoal-text hover:text-[#176b59] transition-colors duration-200"
                >
                  {link.label}
                </Link>
                {idx < arr.length - 1 && (
                  <span className="ml-4 text-outline-strong/60 font-light select-none">
                    •
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
