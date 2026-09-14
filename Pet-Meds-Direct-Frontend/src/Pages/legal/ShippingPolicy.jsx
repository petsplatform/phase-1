import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Truck, Thermometer, ShieldAlert, Sparkles, Clock, MapPin, ArrowRight, Zap, Snowflake } from "lucide-react";
import { shippingData } from "../../data/legal";

export default function ShippingPolicy() {
  return (
    <div className="relative min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-0 -z-10 w-96 h-96 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 -z-10 w-96 h-96 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1200px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs sm:text-sm font-bold text-slate-500 text-left">
          <Link to="/" className="hover:text-primary-green transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-deep-navy">Shipping Policy</span>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-soft-mint to-light-blue rounded-[2.5rem] border border-[#e5e9ec] text-deep-navy p-8 sm:p-12 lg:p-16 mb-12 relative overflow-hidden text-left shadow-sm">
          {/* Decorative shapes */}
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary-green/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-deep-navy bg-white border border-[#e5e9ec] shadow-xs mb-6 w-fit">
              <Truck className="h-3.5 w-3.5 text-primary-green" /> Shipping Logistics
            </span>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
              Fast, Reliable <span className="text-primary-green font-display">Pet Care</span> Delivery
            </h1>

            <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed mb-6">
              {shippingData.intro}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-medical-teal" /> Last Updated: {shippingData.lastUpdated}
              </span>
              <span className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
              <span>Continental US Delivery Only</span>
            </div>
          </div>
        </div>

        {/* Grid Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {shippingData.highlights.map((highlight, idx) => {
            const icons = [
              <Sparkles className="h-6 w-6 text-primary-green" />,
              <Thermometer className="h-6 w-6 text-medical-teal" />,
              <MapPin className="h-6 w-6 text-deep-navy" />
            ];
            return (
              <div 
                key={idx}
                className="bg-white border border-[#e5e9ec] rounded-2xl p-6 text-left shadow-xs hover:shadow-md transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  {icons[idx]}
                </div>
                <h3 className="text-deep-navy font-bold text-base sm:text-lg mb-2">
                  {highlight.title}
                </h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed">
                  {highlight.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Shipping Methods Section (Redesigned Horizontal Panels) */}
        <div className="mb-16">
          <div className="text-left mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-deep-navy tracking-tight">
                Available Shipping Options
              </h2>
              <p className="text-slate-600 font-medium text-sm sm:text-base mt-2">
                Compare delivery speeds, costs, and specialized pharmacy requirements.
              </p>
            </div>
            <span className="text-xs font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl w-fit flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary-green animate-pulse" /> 3 Dispatch Tiers Active
            </span>
          </div>

          <div className="space-y-6">
            {shippingData.methods.map((method) => {
              const rowStyles = {
                1: {
                  icon: <Truck className="h-6 w-6 text-primary-green" />,
                  iconBg: "bg-primary-green/10 text-primary-green",
                  badge: "bg-primary-green/10 text-primary-green border border-primary-green/20",
                  hoverBg: "hover:bg-primary-green/5 hover:border-primary-green/30",
                  tag: "Standard Delivery",
                  bestFor: ["Dry food", "OTC items", "Supplements", "Standard Rx"]
                },
                2: {
                  icon: <Zap className="h-6 w-6 text-deep-navy" />,
                  iconBg: "bg-deep-navy/10 text-deep-navy",
                  badge: "bg-deep-navy/10 text-deep-navy border border-deep-navy/20",
                  hoverBg: "hover:bg-deep-navy/5 hover:border-deep-navy/30",
                  tag: "Fast Track Dispatch",
                  bestFor: ["Low Rx supplies", "Time-sensitive medications", "First aid kits"]
                },
                3: {
                  icon: <Snowflake className="h-6 w-6 text-medical-teal" />,
                  iconBg: "bg-medical-teal/10 text-medical-teal",
                  badge: "bg-medical-teal/10 text-medical-teal border border-medical-teal/20",
                  hoverBg: "hover:bg-medical-teal/5 hover:border-medical-teal/30",
                  tag: "Special Temperature Control",
                  bestFor: ["Insulin", "Refrigerated vaccines", "Temperature-sensitive liquid Rx"]
                }
              };

              const style = rowStyles[method.id] || rowStyles[1];
              const isColdChain = method.id === 3;
              
              return (
                <div 
                  key={method.id}
                  className={`bg-white border border-[#e5e9ec] rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-md ${style.hoverBg}`}
                >
                  {/* Left Column: Visual Icon & Title */}
                  <div className="flex items-start gap-4 lg:w-1/4">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${style.iconBg}`}>
                      {style.icon}
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-1.5 ${style.badge}`}>
                        {style.tag}
                      </span>
                      <h3 className="font-display text-lg sm:text-xl font-extrabold text-deep-navy leading-tight">
                        {method.name}
                      </h3>
                      <span className="text-xs font-bold text-slate-400 mt-1 block">
                        Estimated: {method.timeframe}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Details & Suitable Categories */}
                  <div className="lg:w-5/12 flex flex-col gap-3">
                    <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                      {method.details}
                    </p>
                    {/* Tags for Best For */}
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1.5">
                        Best For:
                      </span>
                      {style.bestFor.map((item, idx) => (
                        <span 
                          key={idx}
                          className="bg-slate-100 border border-slate-200/50 rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Pricing Tag & Alerts */}
                  <div className="lg:w-3/12 w-full lg:text-right flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <span className="block text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        SHIPPING COST
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-deep-navy mt-1 block">
                        {method.cost.split(" / ").map((part, idx) => (
                          <span key={idx} className={idx > 0 ? "block text-xs font-semibold text-slate-500 mt-1" : ""}>
                            {part}
                          </span>
                        ))}
                      </span>
                    </div>

                    {isColdChain && (
                      <div className="p-3 bg-light-blue rounded-xl border border-sky-blue/30 flex items-start gap-2 max-w-xs text-left">
                        <Thermometer className="h-4 w-4 text-medical-teal shrink-0 mt-0.5" />
                        <span className="text-[10px] font-bold text-medical-teal leading-relaxed">
                          Shipped with pharmaceutical-grade coolers & ice packs. Mon-Thu only.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Processing Timelines (Vertical Timeline Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          <div className="lg:col-span-5 text-left lg:sticky lg:top-28">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-deep-navy tracking-tight mb-4">
              {shippingData.processing.title}
            </h2>
            <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed mb-6">
              Learn how we securely dispatch items from our state-licensed pharmacy to your front door step.
            </p>
            <div className="p-5 bg-soft-mint rounded-[2rem] border border-primary-green/10 flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-primary-green shrink-0 mt-0.5" />
              <div>
                <h4 className="text-deep-navy font-bold text-sm">Prescription Timeline Note</h4>
                <p className="text-slate-600 font-medium text-xs leading-relaxed mt-1">
                  Prescription orders require veterinary confirmation. Processing begins immediately following verification.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative pl-6 sm:pl-8 text-left border-l-2 border-slate-200 ml-4 py-2 space-y-10">
              {shippingData.processing.steps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline Bubble Icon */}
                  <span className="absolute -left-11 sm:-left-13 top-0 bg-white border-2 border-primary-green text-primary-green font-bold text-xs h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </span>
                  
                  <h3 className="text-deep-navy font-extrabold text-base sm:text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shipping Restrictions Card */}
        <div className="bg-white border border-[#e5e9ec] rounded-[2rem] p-6 sm:p-8 lg:p-10 text-left">
          <h3 className="font-display text-lg sm:text-xl font-extrabold text-deep-navy mb-5 flex items-center gap-2">
            <ShieldAlert className="text-primary-green h-5 w-5" /> Shipping Restrictions & Rules
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shippingData.restrictions.map((restriction, idx) => (
              <li 
                key={idx}
                className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 flex items-start gap-3"
              >
                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-500">
                  {idx + 1}
                </div>
                <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
                  {restriction}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Section Support Link */}
        <div className="mt-16 text-center max-w-xl mx-auto border-t border-slate-200 pt-12">
          <p className="text-slate-500 font-semibold text-xs sm:text-sm mb-4">
            Need to track an order or check delivery status?
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-deep-navy text-white hover:bg-primary-green font-bold text-sm tracking-wide transition-all shadow-md cursor-pointer"
            >
              Contact Shipping Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
