import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck,
  ThermometerSnowflake,
  MapPin,
  Clock,
  Calendar,
  ArrowLeft,
  Info,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ShippingSteps } from "../../utils/Legel/legel";
export default function ShippingPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen text-brand-purple pb-24 relative overflow-hidden bg-brand-cream/10">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-brand-peach/10 blur-[100px] sm:blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] rounded-full bg-brand-purple/5 blur-[120px] sm:blur-[160px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Side - Breadcrumb */}
          <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] flex items-center gap-1.5">
            <Link to="/" className="hover:text-brand-purple transition-colors">
              Home
            </Link>

            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />

            <Link
              to="/shipping-policy"
              className="hover:text-brand-purple transition-colors"
            >
              Shipping-Policy
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 text-center animate-in fade-in duration-500">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-purple/5 border border-brand-purple/10 text-xs font-semibold mb-6">
          <Truck className="w-3.5 h-3.5 text-brand-peach" />
          <span className="text-brand-purple/95">Shipping & Logistics</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-display font-extrabold tracking-tight text-brand-purple leading-[1.05] mb-6">
          Shipping Policy.
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base font-semibold text-brand-brown/70 leading-relaxed">
          From vet-authorization checks to temperature-controlled overnight
          packaging, we manage every step of your pet's prescription transit
          with expert pharmaceutical care.
        </p>

        <div className="flex items-center justify-center gap-4 text-xs font-bold text-brand-brown/65 mt-6">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-peach" />
            Last Updated: July 13, 2026
          </span>
        </div>
      </section>

      {/* Main Modern UI Grid Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* Section 1: Interactive Stepper Timeline */}
        <div className="space-y-8">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-brand-purple">
              How Your Delivery Works
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-brand-brown/60 mt-1">
              Follow your prescription package's path from cart to clinic
              validation to door.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ShippingSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-brand-purple/10 hover:border-brand-purple/15 hover:shadow-md transition-all duration-300 rounded-[14px] p-6 text-left flex flex-col justify-between relative group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-brand-purple/35 group-hover:text-[#a855f7] transition-colors">
                      Step {step.num}
                    </span>
                    <div className="w-8.5 h-8.5 rounded-xl bg-brand-purple/5 flex items-center justify-center text-brand-purple">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-extrabold text-brand-purple mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-xs text-brand-brown/75 leading-relaxed font-semibold">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Delivery Guidelines */}
        <div className="bg-white border border-brand-purple/10 rounded-[14px] p-6 sm:p-8 md:p-10 shadow-sm text-left space-y-6">
          <div className="flex items-center gap-2.5 text-brand-purple mb-4">
            <Clock className="w-5 h-5 text-brand-peach" />
            <h2 className="text-xl sm:text-2xl font-display font-extrabold">
              Delivery Times & Guidelines
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-3">
              <h3 className="text-sm font-display font-extrabold text-brand-purple">
                Standard & Express Transit
              </h3>
              <p className="text-xs sm:text-sm text-brand-brown/80 font-semibold leading-relaxed">
                Most orders are processed within 24 to 48 hours after veterinary
                approval. Once dispatched, standard packages typically arrive
                within 3-5 business days. Express shipping is automatically
                utilized for qualifying priority orders to ensure swift
                delivery.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-display font-extrabold text-brand-purple">
                Autoship Club Deliveries
              </h3>
              <p className="text-xs sm:text-sm text-brand-brown/80 font-semibold leading-relaxed">
                Subscribers enrolled in our Autoship program benefit from
                priority order queuing and automated fulfillment. Delivery dates
                are customizable, and packages are dispatched on a recurring
                schedule to prevent any interruption in your pet's treatment.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Specialized Cold-Chain Shipping Card */}
        <div className="bg-white border border-brand-purple/10 rounded-[14px] p-6 sm:p-8 md:p-10 shadow-sm flex flex-col md:flex-row gap-6 sm:gap-8 items-start md:items-center text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#3b82f6]/5 blur-2xl pointer-events-none"></div>
          <div className="w-14 h-14 rounded-2xl bg-brand-purple/5 border border-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0">
            <ThermometerSnowflake className="w-7 h-7 text-brand-purple" />
          </div>
          <div className="space-y-2 flex-grow">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-display font-extrabold text-brand-purple">
                Refrigerated Cold-Chain Shipments
              </h3>
              <span className="bg-[#3b82f6]/10 text-brand-purple text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
                Priority Overnight
              </span>
            </div>
            <p className="text-xs sm:text-sm text-brand-brown/80 font-semibold leading-relaxed">
              Insulin and temperature-sensitive formulas require strict thermal
              storage. We pack these items in insulated coolers with gel ice
              packs and ship them via Priority Overnight transit. Cold-chain
              orders are dispatched Monday through Thursday only to prevent
              weekend delays. An adult signature is required upon delivery.
            </p>
          </div>
        </div>

        {/* Section 4: Grid of Address Details & Policy Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-brand-purple/10 rounded-[14px] p-6 sm:p-8 text-left space-y-3">
            <div className="flex items-center gap-2.5 text-brand-purple mb-2">
              <MapPin className="w-5 h-5 text-brand-peach" />
              <h3 className="text-base sm:text-lg font-display font-extrabold">
                Delivery Zones & PO Boxes
              </h3>
            </div>
            <p className="text-xs sm:text-[13.5px] text-brand-brown/80 font-semibold leading-relaxed">
              We ship to all physical addresses and PO Boxes within the
              continental United States. Standard products can be delivered to
              PO Boxes, but cold-chain prescriptions require a physical
              residential or office address for overnight hand-off. We currently
              do not offer international shipping due to state pharmacy
              compliance regulations.
            </p>
          </div>

          <div className="bg-white border border-brand-purple/10 rounded-[14px] p-6 sm:p-8 text-left space-y-3">
            <div className="flex items-center gap-2.5 text-brand-purple mb-2">
              <Info className="w-5 h-5 text-brand-purple" />
              <h3 className="text-base sm:text-lg font-display font-extrabold">
                Damages, Claims & Issues
              </h3>
            </div>
            <p className="text-xs sm:text-[13.5px] text-brand-brown/80 font-semibold leading-relaxed">
              If your medication package arrives damaged, warm (for cold-chain
              items), or has broken seals, please photograph the package and
              notify us within 48 hours of delivery. Regulatory compliance
              prevents returns of prescription medications once they leave the
              facility, but our care team will facilitate instant replacements
              for shipping errors.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
