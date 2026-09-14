/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "./common/Header";
import Footer from "./common/Footer";
import SEO from "./common/SEO";
import {
  CartIcon,
  ChevronDownIcon,
  HelpIcon,
  PawIcon,
} from "./common/HeaderIcons";
import petImage from "../assets/logo/dog.png";

const iconClass = "h-7 w-7";

export const ShieldIcon = ({ className = iconClass }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3 5 6v5.2c0 4.4 2.8 8.4 7 9.8 4.2-1.4 7-5.4 7-9.8V6l-7-3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M12 10v5M12 7.5h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const DocumentIcon = ({ className = iconClass }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 3h8l4 4v14H6V3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M14 3v5h5M9 13h6M9 17h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const ReturnBoxIcon = ({ className = iconClass }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 11a3.5 3.5 0 0 1 6.2-2.2L16 10M16 7v3h-3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SectionIcon = ({ children }) => (
  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[#d9aa3d]/30 bg-[#f8f1df] text-[#d9aa3d]">
    {children}
  </span>
);

export const PolicyShell = ({
  title,
  subtitle,
  breadcrumb,
  icon: Icon,
  seoDescription,
  children,
}) => (
  <>
    <SEO
      title={`${title} | Best-Vet-Care`}
      description={seoDescription || subtitle}
      ogTitle={`${title} | Best-Vet-Care`}
      ogDescription={seoDescription || subtitle}
    />
    <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
      <Header />
      <main className="px-4 pb-6 pt-6 sm:px-5 lg:px-[22px]">
        <div className="mx-auto max-w-[1440px]">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
            <Link to="/" className="transition-colors hover:text-[#d9aa3d]">
              Home
            </Link>
            <ChevronDownIcon className="h-3 w-3 -rotate-90" />
            <span className="font-extrabold text-[#122a50]">{breadcrumb}</span>
          </nav>

          <section className="relative mt-5 overflow-hidden rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8 lg:px-10">
            <div className="relative z-10 flex max-w-3xl items-center gap-5 pr-28 sm:pr-56">
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-[#d9aa3d]/30 bg-white text-[#d9aa3d] shadow-sm">
                <Icon className="h-8 w-8" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#122a50b2]">
                  {subtitle}
                </p>
              </div>
            </div>
            <img
              src={petImage}
              alt="Dog and cat"
              className="absolute bottom-0 right-2 h-32 w-40 object-contain object-bottom sm:right-8 sm:h-44 sm:w-56 lg:right-12"
            />
          </section>

          <p className="mt-6 text-sm font-extrabold text-[#122a50]">
            Last Updated: May 20, 2024
          </p>

          {children}
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export const PolicyCard = ({ number, title, children, icon }) => (
  <article className="flex gap-4 rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-[0_8px_24px_rgba(18,42,80,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <SectionIcon>{icon || <PawIcon className="h-5 w-5" />}</SectionIcon>
    <div className="min-w-0">
      <h2 className="text-base font-extrabold text-[#122a50]">
        {number}. {title}
      </h2>
      <div className="mt-3 text-sm font-semibold leading-6 text-[#122a50b2]">
        {children}
      </div>
    </div>
  </article>
);

export const BulletList = ({ items }) => (
  <ul className="mt-2 list-disc space-y-1 pl-5">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

export const AccordionItem = ({ index, title, text }) => {
  const [open, setOpen] = useState(index === 1);

  return (
    <article className="rounded-xl border border-[#17345f1a] bg-white shadow-[0_6px_18px_rgba(18,42,80,0.04)]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="text-sm font-extrabold text-[#122a50]">
          {index}. {title}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-[#d9aa3d] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="px-5 pb-5 text-sm font-semibold leading-6 text-[#122a50b2]">
          {text}
        </p>
      )}
    </article>
  );
};

export const FeatureCard = ({ title, text, icon }) => (
  <article className="rounded-2xl border border-[#17345f1a] bg-white p-5 text-center shadow-[0_8px_24px_rgba(18,42,80,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <SectionIcon>{icon}</SectionIcon>
    <h2 className="mt-4 text-sm font-extrabold text-[#122a50]">{title}</h2>
    <p className="mt-1 text-xs font-semibold text-[#122a50b2]">{text}</p>
  </article>
);

export const CheckListCard = ({ title, items }) => (
  <article className="rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-[0_8px_24px_rgba(18,42,80,0.05)]">
    <h2 className="text-lg font-extrabold text-[#122a50]">{title}</h2>
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-sm font-semibold leading-6 text-[#122a50b2]"
        >
          <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#f8f1df] text-[#d9aa3d]">
            <svg
              className="h-3 w-3"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m3.5 8 3 3 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {item}
        </li>
      ))}
    </ul>
  </article>
);

export const NumberedSteps = ({ title, items }) => (
  <article className="rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-[0_8px_24px_rgba(18,42,80,0.05)]">
    <h2 className="text-lg font-extrabold text-[#122a50]">{title}</h2>
    <ol className="mt-4 space-y-3">
      {items.map((item, index) => (
        <li
          key={item}
          className="flex gap-3 text-sm font-semibold leading-6 text-[#122a50b2]"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#17345f] text-xs font-extrabold text-white">
            {index + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  </article>
);

export const NeedHelpCard = () => (
  <article className="flex flex-col gap-4 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] p-6 shadow-[0_8px_24px_rgba(18,42,80,0.05)] sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      <SectionIcon>
        <HelpIcon className="h-5 w-5" />
      </SectionIcon>
      <div>
        <h2 className="text-base font-extrabold text-[#122a50]">Need Help?</h2>
        <p className="mt-1 text-sm font-semibold text-[#122a50b2]">
          Our support team is here to assist you.
        </p>
      </div>
    </div>
    <Link
      to="/contact"
      className="inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.22)] transition-colors hover:bg-[#d9aa3d]"
    >
      Contact Us
    </Link>
  </article>
);

export const featureIcons = {
  window: <CartIcon className="h-5 w-5" />,
  return: <ReturnBoxIcon className="h-5 w-5" />,
  shield: <ShieldIcon className="h-5 w-5" />,
  paw: <PawIcon className="h-5 w-5" />,
};
