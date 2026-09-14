import { Fragment, useEffect, useState } from "react";
import { BadgeCheck, BadgeDollarSign, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo/logo11.png";
import {
  CartIcon,
  HeartIcon,
  HelpIcon,
  PackageIcon,
  PawIcon,
  PhoneIcon,
  SearchIcon,
  TruckIcon,
  UserIcon,
} from "./HeaderIcons";
import { productApi } from "../../api/productApi";
import { featureFlags, footerNavigation, publicSocialLinks } from "../../config/siteNavigation";

const accent = "text-[#d9aa3d]";

const shopLink = (label) => `/products?search=${encodeURIComponent(label)}`;

const footerColumns = [
  {
    title: "Shop By Pet",
    icon: PawIcon,
    links: ["Dog", "Cat", "Bird", "Fish", "Rabbit", "Hamster"].map((label) => ({
      label,
      to: shopLink(label),
    })),
  },
  {
    title: "Shop By Category",
    icon: PackageIcon,
    links: [],
    dynamic: true,
  },
  ...footerNavigation.map((section) => ({
    ...section,
    icon:
      section.title === "Shop"
        ? PackageIcon
        : section.title === "Programs"
          ? UserIcon
          : HelpIcon,
  })),
];

const trustItems = [
  { title: "Free Shipping", text: "On all orders", icon: TruckIcon },
  { title: "Easy Returns", text: "Hassle free returns", icon: SearchIcon },
  { title: "100% Safe & Secure Shopping", text: "100% secure payments", icon: CartIcon },
  { title: "Genuine Products", text: "Trusted & verified", icon: HeartIcon },
  { title: "24/7 Support", text: "We're always here", icon: PhoneIcon },
];

const policyLinks = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms-conditions" },
  { label: "Return Policy", to: "/return-policy" },
];

const footerTrustBadges = [
  {
    key: "pci",
    label: "PCI DSS Compliant",
    note: "Stripe-hosted card fields",
    icon: ShieldCheck,
  },
  featureFlags.priceMatchFeedback && {
    key: "best-price",
    label: "100% Best Price Guaranteed",
    note: "Business confirmation required",
    icon: BadgeDollarSign,
  },
  {
    key: "secure-shopping",
    label: "100% Safe & Secure Shopping",
    note: "Secure online checkout",
    icon: LockKeyhole,
  },
].filter(Boolean);

const acceptedPayments = [
  { key: "visa", label: "Visa", className: "text-[#1746A2]" },
  { key: "mastercard", label: "Mastercard", className: "text-[#111111]" },
  { key: "amex", label: "American Express", className: "text-[#1871B9]" },
];

const socialIconPaths = {
  facebook:
    "M14 8.5V6.8c0-.7.4-1.1 1.2-1.1H17V2.6c-.8-.1-1.7-.2-2.6-.2-2.7 0-4.5 1.6-4.5 4.5v1.6h-3v3.5h3v9.6H14v-9.6h2.8l.5-3.5H14Z",
  instagram:
    "M7.8 3h8.4A4.8 4.8 0 0 1 21 7.8v8.4a4.8 4.8 0 0 1-4.8 4.8H7.8A4.8 4.8 0 0 1 3 16.2V7.8A4.8 4.8 0 0 1 7.8 3Zm4.2 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.1-1.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z",
  pinterest:
    "M12.2 2.3C6.7 2.3 3 6 3 10.9c0 3.1 1.7 5 3.6 5 .6 0 1-.3 1.1-.9l.3-1.1c.1-.4.1-.6-.2-1-.7-.8-1-1.6-1-2.7 0-2.9 2.2-5.1 5.4-5.1 2.9 0 5 1.7 5 4.5 0 3.2-1.6 5.5-3.7 5.5-1.2 0-2.1-1-1.8-2.2.3-1.4 1-2.9 1-3.9 0-.9-.5-1.7-1.5-1.7-1.2 0-2.1 1.2-2.1 2.9 0 1.1.4 1.8.4 1.8l-1.5 6.3c-.3 1.2-.2 2.8-.1 3.8h.1c.6-.8 1.5-2.2 1.8-3.3l.7-2.7c.6 1.1 1.9 2 3.4 2 4.5 0 7.6-4.1 7.6-9.1 0-4.4-3.6-7.7-8.4-7.7Z",
  youtube:
    "M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10 15.4V8.6l5.8 3.4L10 15.4Z",
};

const FooterColumn = ({ title, icon: Icon, links, dynamic, categoryLinks }) => (
  <div className="min-w-0">
    <h3 className="flex items-center gap-2 text-[13px] font-extrabold text-[#122a50]">
      <Icon className={`h-4 w-4 ${accent}`} />
      {title}
    </h3>
    <ul
      className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:block sm:space-y-[10px]"
      role="list"
    >
      {(dynamic ? categoryLinks : links).map((link) => (
        <li key={link.label}>
          <Link
            to={link.to}
            className="inline-flex text-[12px] font-semibold leading-5 text-[#122a50] transition-all duration-200 hover:translate-x-1 hover:text-[#d9aa3d]"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const SocialIcon = ({ item }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-[0_2px_8px_rgba(18,42,80,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#17345f] hover:text-white"
    aria-label={`Follow Best Vet Care on ${item.label}`}
  >
    <svg
      className="h-[14px] w-[14px]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={socialIconPaths[item.key]} />
    </svg>
  </a>
);

const PaymentLogo = ({ method }) => (
  <span
    className={`flex h-8 min-w-[58px] items-center justify-center rounded-md border border-[#17345f1a] bg-white px-2 text-[10px] font-black leading-none shadow-sm ${method.className}`}
    aria-label={`${method.label} accepted`}
    title={`${method.label} accepted`}
  >
    {method.label === "Mastercard" ? (
      <span className="relative flex h-4 w-8 items-center justify-center" aria-hidden="true">
        <span className="absolute left-1 h-4 w-4 rounded-full bg-[#EB001B]" />
        <span className="absolute right-1 h-4 w-4 rounded-full bg-[#F79E1B] mix-blend-multiply" />
      </span>
    ) : (
      method.label
    )}
  </span>
);

const FooterTrustBadges = () => (
  <section
    className="border-b border-[#17345f1a] py-[18px]"
    aria-labelledby="footer-trust-heading"
  >
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2
          id="footer-trust-heading"
          className="flex items-center gap-2 text-[13px] font-extrabold text-[#122a50]"
        >
          <BadgeCheck className="h-4 w-4 text-[#d9aa3d]" />
          Shop With Confidence
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:min-w-[640px]">
          {footerTrustBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div key={badge.key} className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[#d9aa3d]/30 bg-white text-[#d9aa3d] shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] font-extrabold leading-snug text-[#122a50]">
                    {badge.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-semibold leading-snug text-[#122a50b2]">
                    {badge.note}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase text-[#122a50b2]">
          Accepted Payments
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
          {acceptedPayments.map((method) => (
            <PaymentLogo key={method.key} method={method} />
          ))}
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => {
  const [categoryLinks, setCategoryLinks] = useState(
    ["Food", "Medicine", "Grooming", "Toys", "Accessories", "Supplements"].map(
      (label) => ({ label, to: shopLink(label) }),
    ),
  );

  useEffect(() => {
    productApi
      .getCategories()
      .then((result) => {
        if (!Array.isArray(result) || result.length === 0) return;
        setCategoryLinks(
          result.slice(0, 6).map((cat) => ({
            label: cat.name,
            to: `/products?category=${encodeURIComponent(cat.name)}`,
          })),
        );
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="w-full bg-white px-3 py-4 sm:px-5 sm:py-5 lg:px-[22px]">
      <div className="mx-auto overflow-hidden rounded-xl border border-[#17345f1a] bg-[#fffdf7] shadow-[0_12px_36px_rgba(18,42,80,0.08)]">
        {/* <div className="inline-flex rounded-br-md bg-[#17345f] px-3 py-[7px] text-xs font-extrabold uppercase tracking-wide text-white">
          2. Green Footer
        </div> */}

        <div className="px-5 pb-5 pt-7 sm:px-8 sm:pt-8 lg:px-10 xl:px-[48px]">
          <div className="grid items-start gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-[180px_repeat(6,minmax(0,1fr))] xl:grid-cols-[220px_repeat(6,minmax(0,1fr))] xl:gap-x-8">
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
              <Link
                to="/"
                className="inline-flex items-center gap-2"
                aria-label="Best-Vet-Care home"
              >
                <img
                  src={logo}
                  alt="Best-Vet-Care logo"
                  className="h-[76px] w-auto rounded-xl object-contain sm:h-[90px]"
                />
              </Link>

              <p className="max-w-[300px] text-[13px] font-semibold leading-[22px] text-[#122a50] xl:max-w-[220px]">
                Bring home the best for your pets. Quality products, trusted
                care, happy companion.
              </p>

              {publicSocialLinks.length > 0 && (
                <div className="mt-5 flex items-center gap-3">
                  {publicSocialLinks.map((social) => (
                    <SocialIcon key={social.key} item={social} />
                  ))}
                </div>
              )}
            </div>

            {footerColumns.map((column) => (
              <FooterColumn
                key={column.title}
                {...column}
                categoryLinks={categoryLinks}
              />
            ))}
          </div>

          <div className="mt-[22px] grid grid-cols-2 gap-x-4 gap-y-5 border-y border-[#17345f1a] py-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 xl:gap-8">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              const isLastMobileItem = index === trustItems.length - 1;
              return (
                <div
                  key={item.title}
                  className={`flex items-center gap-3 ${
                    isLastMobileItem
                      ? "col-span-2 mx-auto sm:col-span-1 sm:mx-0"
                      : ""
                  }`}
                >
                  <Icon className="h-7 w-7 flex-shrink-0 text-[#d9aa3d]" />
                  <span>
                    <span className="block text-[12px] font-extrabold leading-none text-[#122a50]">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-[10px] font-semibold leading-none text-[#122a50b2]">
                      {item.text}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* <FooterTrustBadges /> */}

          <div className="flex flex-col items-start gap-4 pt-[18px] text-[11px] font-semibold text-[#122a50] lg:flex-row lg:items-center lg:justify-between">
            <p>
              &copy; 2026 Best-Vet-Care. All rights reserved. Developed By{" "}
              <a
                href="https://techrabbit.io/"
                target="_blank"
                rel="noreferrer"
                className="font-extrabold text-[#d9aa3d] transition-colors hover:text-[#17345f]"
              >
                Tech Rabbit
              </a>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-7">
              {policyLinks.map((link, index) => (
                <Fragment key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors duration-200 hover:text-[#d9aa3d]"
                  >
                    {link.label}
                  </Link>
                  {index < policyLinks.length - 1 && (
                    <span className="hidden text-[#17345f66] sm:inline">|</span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
