import React, { useState } from "react";
import { Link } from "react-router-dom";
import { policiesData } from "../../utils/policiesData";
import {
  ChevronRight,
  Truck,
  Zap,
  Scale,
  Clock,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Calculator,
  Sparkles,
  ArrowRight,
} from "lucide-react";

function ShippingPolicyPage() {
  const data = policiesData.shipping;

  // Accordion state - mapping section IDs to booleans
  const [openSections, setOpenSections] = useState({
    "processing-time": true,
    "rates-estimates": false,
    "tracking-delivery": false,
    "damaged-packages": false,
    "restricted-items": false,
  });

  const toggleSection = (id) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Section icons helper
  const getSectionIcon = (id) => {
    switch (id) {
      case "processing-time":
        return <Clock className="text-secondary" size={22} />;
      case "rates-estimates":
        return <Truck className="text-secondary" size={22} />;
      case "tracking-delivery":
        return <Package className="text-secondary" size={22} />;
      case "damaged-packages":
        return <ShieldAlert className="text-secondary" size={22} />;
      case "restricted-items":
        return <Scale className="text-secondary" size={22} />;
      default:
        return <HelpCircle className="text-secondary" size={22} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-[#1d2823] font-sans selection:bg-secondary/20 pb-16 relative overflow-x-hidden">
      {/* Background Decorative Mesh / Ambient Glow */}
      <div className="absolute inset-0 grain-panel opacity-30 pointer-events-none" />
      <div className="absolute top-10 right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none animate-glow" />
      <div
        className="absolute bottom-20 left-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-glow"
        style={{ animationDelay: "3s" }}
      />

      {/* SECTION 1: HERO HEADER (WHITE BACKGROUND SECTION) */}
      <div className="bg-white border-b border-outline/65 relative z-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 pb-14">
          {/* Breadcrumbs */}
          <div className="pt-8 md:pt-12">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-charcoal-text/80 font-semibold">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <ChevronRight size={14} className="text-charcoal-text/50" />
              <span className="text-secondary">Shipping Policy</span>
            </div>
          </div>

          {/* Hero Header */}
          <header className="pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em]  mb-4">
              — Legal / Shipping & Delivery Policy
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#102B2B] leading-tight">
              Shipping <span className="font-normal text-secondary"> & </span>{" "}
              Delivery Policy<span>.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg leading-relaxed font-light max-w-2xl">
              {data.lastUpdated}. We want your pets to receive their food, toys,
              and supplies as fast as possible. Below you'll find everything you
              need to know.
            </p>
          </header>
        </div>
      </div>

      {/* SECTION 2: SHIPPING METHODS & COST BREAKDOWN (CREAM BACKGROUND SECTION) */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 mt-16">
        <div className="space-y-16">
          {/* Delivery Methods Grid */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102B2B] flex items-center gap-3">
                <span className="w-2 h-7 rounded bg-secondary"></span>
                Shipping Service Tiers
              </h2>
              <span className="text-sm text-charcoal-text bg-white border border-outline px-4 py-2 rounded-full shadow-sm font-bold">
                3 Methods Available
              </span>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {/* Standard Shipping Card */}
              <div className="bg-white border border-outline/70 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Truck size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[#102B2B]">
                    Standard Ground
                  </h3>
                  <p className="text-sm sm:text-base text-charcoal-text mt-3 leading-relaxed">
                    Reliable shipping for your everyday pet essentials. Best for
                    non-urgent pantry orders.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-outline/45 space-y-3">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-charcoal-text">Delivery Speed:</span>
                    <span className="font-bold text-[#102B2B]">
                      3-5 Business Days
                    </span>
                  </div>
                  {/* <p className="text-xs text-charcoal-text/80 italic mt-1 leading-normal">
                    *Free shipping automatically applies to orders over $49.
                  </p> */}
                </div>
              </div>

              {/* Express Delivery Card */}
              <div className="bg-white border border-outline/70 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-secondary text-white px-4 py-1.5 text-xs uppercase font-extrabold tracking-widest rounded-bl-2xl">
                  Fastest
                </div>
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[#102B2B]">
                    Express Shipping
                  </h3>
                  <p className="text-sm sm:text-base text-charcoal-text mt-3 leading-relaxed">
                    Urgent delivery, perfect for fresh foods, vitamins, or
                    special medical treatments.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-outline/45 space-y-3">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-charcoal-text">Delivery Speed:</span>
                    <span className="font-bold text-[#102B2B]">
                      1-2 Business Days
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-text/80 italic mt-1 leading-normal">
                    *Available nationwide. Dispensed same-day if placed by 2 PM.
                  </p>
                </div>
              </div>

              {/* Bulky/Heavy Items Card */}
              <div className="bg-white border border-outline/70 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary/10 text-secondary mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Scale size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[#102B2B]">
                    Heavy & Bulky
                  </h3>
                  <p className="text-sm sm:text-base text-charcoal-text mt-3 leading-relaxed">
                    For large items like crates, massive dog beds, scratching
                    posts, and bulk cat litter.
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-outline/45 space-y-3">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-charcoal-text">Delivery Speed:</span>
                    <span className="font-bold text-[#102B2B]">
                      Varies by Carrier
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-text/80 italic mt-1 leading-normal">
                    *Handling charges calculated based on package weight.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Cost Breakdown Visual Guide */}
          <section className="bg-white border border-outline rounded-3xl p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-primary/5 rounded-full pointer-events-none" />

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary uppercase tracking-wider bg-secondary/10 px-3.5 py-1.5 rounded-full">
                  <Calculator size={14} />
                  <span>Shipping Cost Guide</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-secondary">
                  Standard Shipping Rates
                </h3>
                <p className="text-sm sm:text-base text-charcoal-text leading-relaxed">
                  We offer simple, transparent standard shipping rates based on
                  your order subtotal. Fill your cart to qualify for free
                  shipping!
                </p>
              </div>

              {/* Visual Breakdown Bar */}
              <div className="grid gap-6 md:grid-cols-2 mt-8">
                {/* Under $49 Tier */}
                <div className="bg-[#fdfaf5] border border-outline rounded-2xl p-6 flex flex-col justify-between hover:border-outline-strong transition-all duration-200">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-charcoal-text bg-surface-soft px-2.5 py-1 rounded-md">
                      Tier 1
                    </span>
                    <h4 className="text-lg font-bold text-[#102B2B] mt-2">
                      Orders Under
                    </h4>
                    <p className="text-sm text-charcoal-text">
                      For smaller orders, we charge a low flat rate to ensure
                      safe delivery of your pet supplies. For smaller orders, we
                      charge a low flat rate to ensure safe delivery of your pet
                      supplies. For smaller orders, we charge a low flat rate to
                      ensure safe delivery of your pet supplies.
                    </p>
                  </div>
                </div>

                {/* Over $49 Tier */}
                <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-6 flex flex-col justify-between hover:border-secondary/30 transition-all duration-200">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2.5 py-1 rounded-md">
                      Tier 2
                    </span>
                    <h4 className="text-lg font-bold text-secondary mt-2">
                      Orders & Over
                    </h4>
                    <p className="text-sm text-charcoal-text">
                      Fill up your cart with your pet's favorite food, treats,
                      and toys to qualify for free shipping! Fill up your cart
                      with your pet's favorite food, treats, and toys to qualify
                      for free shipping!
                    </p>
                  </div>
                </div>
              </div>

              {/* Free Shipping Tip Banner */}
              <div className="bg-secondary/5 border border-secondary/15 rounded-2xl p-5 flex items-center gap-4 mt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[#102B2B]">
                    Pet Parent Tip:
                  </h5>
                  <p className="text-xs sm:text-sm text-charcoal-text mt-0.5">
                    Combine your pet food and cat litter orders to easily cross
                    the threshold and save on shipping costs!
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* SECTION 3: TIMELINE (WHITE BACKGROUND SECTION) */}
      <div className="bg-white border-y border-outline/65 py-16 my-16 relative z-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102B2B]">
              How Your Order Travels
            </h2>
            <p className="text-sm sm:text-base text-charcoal-text mt-2.5">
              From our shelves straight to your pet's happy paws. A fully
              transparent shipping lifecycle.
            </p>
          </div>

          <div className="relative pl-6 sm:pl-0 mt-12">
            {/* Connecting Line */}
            <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-outline-strong sm:left-6 sm:right-6 sm:top-6 sm:bottom-auto sm:w-auto sm:h-[2px]" />

            <div className="grid gap-8 sm:grid-cols-4 sm:gap-6 relative">
              {/* Step 1 */}
              <div className="flex gap-4 sm:flex-col sm:items-center sm:text-center group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-white border-4 border-white z-10 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Package size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-[#102B2B]">
                    1. Order Placed
                  </h4>
                  <p className="text-sm text-charcoal-text leading-relaxed">
                    Instant email confirmation with purchase details and
                    invoice.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 sm:flex-col sm:items-center sm:text-center group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-white border-4 border-white z-10 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Clock size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-[#102B2B]">
                    2. Processing
                  </h4>
                  <p className="text-sm text-charcoal-text leading-relaxed">
                    Carefully packaged within 1-2 days inside our warehouse.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 sm:flex-col sm:items-center sm:text-center group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-white border-4 border-white z-10 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Truck size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-[#102B2B]">
                    3. Out for Dispatch
                  </h4>
                  <p className="text-sm text-charcoal-text leading-relaxed">
                    Courier collection starts and unique tracking link is
                    dispatched.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 sm:flex-col sm:items-center sm:text-center group">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-white border-4 border-white z-10 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base sm:text-lg font-bold text-secondary">
                    4. Happy Delivery!
                  </h4>
                  <p className="text-sm text-charcoal-text leading-relaxed">
                    Delivered straight to your doorstep ready for play or meals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: FAQS & SUPPORT SIDEBAR (CREAM BACKGROUND SECTION) */}
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 pb-20">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* FAQ Accordion list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-outline rounded-3xl p-8 sm:p-10 shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102B2B] mb-2 flex items-center gap-3">
                <span className="w-1.5 h-6 rounded bg-secondary"></span>
                Detailed Policy FAQs
              </h2>
              <p className="text-sm sm:text-base text-charcoal-text mb-8">
                Click any section title below to expand and read the complete
                shipping details, guidelines, and restrictions.
              </p>

              <div className="space-y-5">
                {data.sections.map((section) => {
                  const isOpen = !!openSections[section.id];
                  return (
                    <div
                      key={section.id}
                      className="border border-outline/70 rounded-2xl overflow-hidden transition-all duration-300"
                    >
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-5 bg-white hover:bg-surface-soft/40 text-left transition-colors cursor-pointer"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-soft border border-outline text-[#102B2B]">
                            {getSectionIcon(section.id)}
                          </span>
                          <span className="text-base sm:text-lg font-bold text-[#102B2B] leading-snug">
                            {section.title.replace(/^\d+\.\s*/, "")}
                          </span>
                        </div>
                        {isOpen ? (
                          <ChevronUp size={20} className="text-charcoal-text" />
                        ) : (
                          <ChevronDown
                            size={20}
                            className="text-charcoal-text"
                          />
                        )}
                      </button>

                      {isOpen && (
                        <div className="p-6 border-t border-outline/40 bg-[#fdfaf5] text-sm sm:text-base text-charcoal-text leading-relaxed space-y-4">
                          <p>{section.content}</p>
                          {section.bullets && (
                            <ul className="space-y-3 pl-5 list-disc text-charcoal-text/90">
                              {section.bullets.map((bullet, idx) => (
                                <li key={idx} className="marker:text-secondary">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: Need Support Card */}
          <div className="space-y-6">
            <div className="bg-secondary/10 border border-secondary/20 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-secondary/15 rounded-full pointer-events-none" />
              <h4 className="text-lg font-extrabold text-[#102B2B] flex items-center gap-2">
                <HelpCircle size={22} className="text-secondary" />
                Need Shipping Support?
              </h4>
              <p className="text-sm sm:text-base text-charcoal-text mt-3 leading-relaxed">
                If your order experiences delays, package damages, or courier
                transit issues, don't worry. Our friendly customer care crew is
                always active.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to="/contact"
                  className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 btn-primary-link text-sm font-bold py-3 px-5 rounded-xl shadow-sm transition-all duration-200"
                >
                  <span>Contact Support Team</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/faq"
                  className="flex items-center justify-center gap-2 bg-white hover:bg-[#fbf7f0] border border-outline text-charcoal-text text-sm font-bold py-3 px-5 rounded-xl shadow-sm transition-all duration-200"
                >
                  <span>Browse Help Center</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShippingPolicyPage;
