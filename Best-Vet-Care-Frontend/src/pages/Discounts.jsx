import { useEffect, useState } from "react";
import { Copy, Loader2, TicketPercent } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { couponApi } from "../api/couponApi";
import { useToast } from "../context/ToastContext";

const fmt = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatCoupon = (coupon) => {
  if (coupon.type === "percentage") return `${Number(coupon.value || 0)}% OFF`;
  return `${fmt(coupon.value)} OFF`;
};

const formatExpiry = (expiry) => {
  if (!expiry) return "No expiry";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(expiry));
};

const Discounts = () => {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    couponApi
      .list()
      .then((items) => {
        if (active) setCoupons(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (active) setCoupons([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`Coupon ${code} copied`);
    } catch {
      showToast(`Use coupon code ${code}`);
    }
  };

  return (
    <>
      <SEO
        title="Discounts & Coupons | Best Vet Care"
        description="View active Best Vet Care coupons and discounts."
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1120px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <span className="font-extrabold text-[#122a50]">Discounts & Coupons</span>
            </nav>

            <section className="mt-5 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8">
              <div className="flex max-w-3xl items-center gap-4">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
                  <TicketPercent className="h-7 w-7" />
                </span>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                    Discounts & Coupons
                  </h1>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                    Active coupon offers are loaded from the current store coupon system. Apply eligible codes during checkout.
                  </p>
                </div>
              </div>
            </section>

            {loading ? (
              <p className="mt-6 flex items-center gap-2 rounded-2xl border border-[#17345f1a] bg-white p-5 text-sm font-semibold text-[#122a50b2] shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#d9aa3d]" />
                Loading coupons...
              </p>
            ) : coupons.length ? (
              <section className="mt-6 grid gap-4 md:grid-cols-2">
                {coupons.map((coupon) => (
                  <article key={coupon.id || coupon.code} className="relative overflow-hidden rounded-2xl bg-[#17345f] p-6 text-white shadow-sm">
                    <TicketPercent className="absolute right-6 top-6 h-14 w-14 text-white/15" />
                    <p className="text-sm font-bold uppercase text-white/70">{coupon.code}</p>
                    <h2 className="mt-2 text-3xl font-extrabold">{formatCoupon(coupon)}</h2>
                    <p className="mt-2 text-sm font-semibold text-white/75">
                      Min {fmt(coupon.minOrder || 0)} - Expires {formatExpiry(coupon.expiry)}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyCode(coupon.code)}
                      className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#d9aa3d] px-4 text-sm font-extrabold text-[#122a50] transition-colors hover:bg-white"
                    >
                      Copy Code <Copy className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </section>
            ) : (
              <section className="mt-6 rounded-2xl border border-[#17345f1a] bg-white p-6 text-center shadow-sm">
                <h2 className="text-xl font-extrabold text-[#122a50]">No active coupons right now</h2>
                <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-[#122a50b2]">
                  Check back later, or browse products currently available in the store.
                </p>
                <Link to="/products" className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]">
                  Browse Products
                </Link>
              </section>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Discounts;
