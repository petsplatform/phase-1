import { Link } from "react-router-dom";
import { Handshake, Megaphone, PackageCheck, Users } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";

const affiliateItems = [
  { title: "Partner With Us", text: "Share Best Vet Care products with pet parents, clinics, communities, or creators.", icon: Handshake },
  { title: "Promote Trusted Products", text: "Recommend pet medicines, grooming, food, and everyday essentials from the store catalog.", icon: PackageCheck },
  { title: "Grow Your Reach", text: "Use store campaigns, offers, and product links to help customers discover useful pet-care items.", icon: Megaphone },
];

const AffiliateProgram = () => (
  <>
    <SEO
      title="Affiliate Program | Best Vet Care"
      description="Learn about the Best Vet Care affiliate program for partners and pet-care promoters."
    />
    <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
      <Header />
      <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
        <div className="mx-auto max-w-[1120px]">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
            <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
            <ChevronDownIcon className="h-3 w-3 -rotate-90" />
            <span className="font-extrabold text-[#122a50]">Affiliate Program</span>
          </nav>

          <section className="mt-5 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8">
            <div className="flex max-w-3xl items-center gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
                <Users className="h-7 w-7" />
              </span>
              <div>
                <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                  Affiliate Program
                </h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                  A partner page for affiliates who want to promote trusted pet-care products.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {affiliateItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f1df] text-[#d9aa3d]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 text-lg font-extrabold text-[#122a50]">{item.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">{item.text}</p>
                </article>
              );
            })}
          </section>

          <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#122a50]">Affiliate Enquiry</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#122a50b2]">
                Interested partners can contact the store team for eligibility, tracking links, and commission terms.
              </p>
            </div>
            <Link to="/contact" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]">
              Contact Team
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default AffiliateProgram;
