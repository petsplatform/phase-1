import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Headphones, Loader2, Truck } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { shipmentChargeApi } from "../api/shipmentChargeApi";

const fmt = (value) => `$${Number(value || 0).toFixed(2)}`;

const describeRange = (rule) => {
  const min = Number(rule.minOrderAmount || 0);
  const max = rule.maxOrderAmount == null ? null : Number(rule.maxOrderAmount);
  if (max == null) return `${fmt(min)} and above`;
  return `${fmt(min)} to ${fmt(max)}`;
};

const ShippingCharges = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    shipmentChargeApi
      .getCharges()
      .then((items) => {
        if (active) setRules(Array.isArray(items) ? items : []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load shipping charges.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const freeShippingRules = useMemo(
    () => rules.filter((rule) => Number(rule.charge || 0) === 0),
    [rules],
  );

  return (
    <>
      <SEO
        title="Shipping Charges | Best Vet Care"
        description="View Best Vet Care shipping charges, free-shipping eligibility, and delivery information."
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1120px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <span className="font-extrabold text-[#122a50]">Shipping Charges</span>
            </nav>

            <section className="mt-5 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8">
              <div className="flex max-w-3xl items-center gap-4">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
                  <Truck className="h-7 w-7" />
                </span>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                    Shipping Charges
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                    We aim to make delivery simple and transparent. Shipping charges are resolved from the current store rules at checkout.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#122a50]">Current Shipping Rules</h2>
              {loading ? (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#122a50b2]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#d9aa3d]" />
                  Loading shipping charges...
                </p>
              ) : error ? (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
              ) : rules.length ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-[#17345f1a]">
                  <div className="grid grid-cols-[1fr_120px] bg-[#f8f1df] px-4 py-3 text-xs font-extrabold uppercase text-[#122a50b2]">
                    <span>Order Subtotal</span>
                    <span className="text-right">Charge</span>
                  </div>
                  {rules.map((rule) => (
                    <div key={rule.id} className="grid grid-cols-[1fr_120px] border-t border-[#17345f1a] px-4 py-3 text-sm font-semibold text-[#122a50]">
                      <span>{rule.label || describeRange(rule)}: {describeRange(rule)}</span>
                      <span className="text-right font-extrabold text-[#d9aa3d]">
                        {Number(rule.charge || 0) === 0 ? "Free" : fmt(rule.charge)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm font-semibold leading-6 text-[#122a50b2]">
                  No active shipping charge rules are configured. Checkout will show the resolved shipping charge before payment.
                </p>
              )}
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-[#122a50]">Free Shipping</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                  {freeShippingRules.length
                    ? `Free shipping is currently configured for ${freeShippingRules.map(describeRange).join(", ")}.`
                    : "No active free-shipping threshold is currently published by the shipping rules."}
                </p>
              </article>
              <article className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-[#122a50]">Delivery Information</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                  Delivery address is selected at checkout. The final shipping charge appears in the order summary before online payment.
                </p>
              </article>
            </section>

            <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Headphones className="h-7 w-7 text-[#d9aa3d]" />
                <div>
                  <h2 className="text-base font-extrabold text-[#122a50]">Still have a shipping question?</h2>
                  <p className="mt-1 text-sm font-semibold text-[#122a50b2]">Our support team can help with delivery questions.</p>
                </div>
              </div>
              <Link to="/contact" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]">
                Contact Us
              </Link>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ShippingCharges;
