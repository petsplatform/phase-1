import { Link } from "react-router-dom";
import { Map } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { footerNavigation, helpMenuItems, shopMenuItems } from "../config/siteNavigation";

const sitemapSections = [
  {
    title: "Shop",
    links: shopMenuItems,
  },
  {
    title: "Help",
    links: helpMenuItems,
  },
  {
    title: "Programs & Account",
    links: [
      { label: "My Account", to: "/account" },
      { label: "My Orders", to: "/account/orders" },
      { label: "Auto-Order", to: "/account/auto-orders" },
      { label: "Reward Points", to: "/reward-points" },
      { label: "Affiliate Program", to: "/affiliate-program" },
      { label: "Saved Addresses", to: "/account/addresses" },
      { label: "Wishlist", to: "/wishlist" },
      { label: "Track Order", to: "/track-order" },
    ],
  },
  {
    title: "Information",
    links: [
      { label: "Home", to: "/" },
      { label: "About Us", to: "/about" },
      { label: "Discounts & Coupons", to: "/discounts" },
      { label: "Reviews", to: "/reviews" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Terms & Conditions", to: "/terms-conditions" },
      { label: "Return Policy", to: "/return-policy" },
    ],
  },
].filter((section) => section.links.length > 0);

const Sitemap = () => (
  <>
    <SEO
      title="Sitemap | Best Vet Care"
      description="Browse the public Best Vet Care website sections and customer account links."
    />
    <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
      <Header />
      <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
        <div className="mx-auto max-w-[1120px]">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
            <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
            <ChevronDownIcon className="h-3 w-3 -rotate-90" />
            <span className="font-extrabold text-[#122a50]">Sitemap</span>
          </nav>

          <section className="mt-5 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8">
            <div className="flex max-w-3xl items-center gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
                <Map className="h-7 w-7" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                  Sitemap
                </h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                  Find the main public pages and customer account areas available on Best Vet Care.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            {sitemapSections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-[#122a50]">{section.title}</h2>
                <ul className="mt-4 grid gap-2" role="list">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.label}`}>
                      <Link
                        to={link.to}
                        className="inline-flex text-sm font-semibold text-[#122a50b2] transition-colors hover:text-[#d9aa3d]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="mt-6 rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#122a50]">Footer Sections</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {footerNavigation.map((section) => (
                <div key={section.title}>
                  <h3 className="text-sm font-extrabold text-[#122a50]">{section.title}</h3>
                  <ul className="mt-2 space-y-2" role="list">
                    {section.links.map((link) => (
                      <li key={`${section.title}-${link.label}`}>
                        <Link to={link.to} className="text-xs font-semibold text-[#122a50b2] hover:text-[#d9aa3d]">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default Sitemap;
