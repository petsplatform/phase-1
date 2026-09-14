import React from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Clock,
  PackageCheck,
  CheckCircle2,
  ChevronRight,
  Search,
  FileText,
  Snowflake,
  Mail,
  ArrowRight,
} from "lucide-react";

export default function ShippingPolicy() {
  return (
    <div className="bg-brand-bg min-h-screen font-sans text-brand-text antialiased">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-peach/30 via-brand-peach/10 to-transparent border-b border-brand-border/60 py-14 sm:py-20 select-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-brand-coral/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 relative z-10">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center justify-center gap-2 text-xs text-brand-muted font-sans"
          >
            <Link
              to="/"
              className="hover:text-brand-coral transition-colors font-medium"
            >
              Home
            </Link>
            <ChevronRight size={12} className="text-brand-border" />
            <span className="text-brand-muted font-medium">Policy</span>
            <ChevronRight size={12} className="text-brand-border" />
            <span className="text-brand-text font-semibold">
              Shipping Policy
            </span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal/10 text-brand-teal font-heading font-black text-xs uppercase tracking-wider">
            <Truck size={14} />
            <span>Fast & Reliable Delivery</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl text-brand-text leading-tight tracking-tight max-w-4xl mx-auto">
            Shipping & Delivery Policy
          </h1>

          <p className="font-sans text-sm sm:text-base text-brand-muted max-w-3xl mx-auto leading-relaxed">
            We deliver pet essentials straight to your doorstep with care,
            speed, and real-time package tracking.
          </p>
        </div>
      </section>

      {/* Main Content Area - 5 Core Topics with Wider Width */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Topic 1 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/70 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-heading font-black text-lg shrink-0">
                1
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Order Processing & Dispatch Timelines
              </h2>
            </div>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              All orders are processed from our fulfillment centers Monday
              through Friday (excluding statutory holidays).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-brand-peach/20 border border-brand-border/50">
                <CheckCircle2
                  size={20}
                  className="text-brand-coral shrink-0 mt-0.5"
                />
                <div className="text-xs sm:text-sm text-brand-muted">
                  <strong className="text-brand-text text-base block font-heading mb-1">
                    Same-Day Dispatch
                  </strong>
                  Orders placed before 2:00 PM EST (Monday–Friday) are
                  dispatched on the exact same day for prompt transit.
                </div>
              </div>
              <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-brand-peach/20 border border-brand-border/50">
                <CheckCircle2
                  size={20}
                  className="text-brand-teal shrink-0 mt-0.5"
                />
                <div className="text-xs sm:text-sm text-brand-muted">
                  <strong className="text-brand-text text-base block font-heading mb-1">
                    Weekend Processing
                  </strong>
                  Orders placed after 2:00 PM EST on Friday or over the weekend
                  are processed first thing on Monday morning.
                </div>
              </div>
            </div>
          </div>

          {/* Topic 2 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/70 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-heading font-black text-lg shrink-0">
                2
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Delivery Speeds & Methods Summary
              </h2>
            </div>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              Select your preferred shipping method during checkout based on
              your location and required delivery speed.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-peach/20 text-brand-text font-heading font-black">
                    <th className="py-3.5 px-4 rounded-l-xl">
                      Shipping Method
                    </th>
                    <th className="py-3.5 px-4">Estimated Transit</th>
                    <th className="py-3.5 px-4">Handling Type</th>
                    <th className="py-3.5 px-4 rounded-r-xl">
                      Service Availability
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40 text-brand-muted">
                  <tr>
                    <td className="py-4 px-4 font-semibold text-brand-text">
                      Standard Ground
                    </td>
                    <td className="py-4 px-4">3–5 Business Days</td>
                    <td className="py-4 px-4">
                      Standard Box & Protective Wrap
                    </td>
                    <td className="py-4 px-4 font-medium text-brand-text">
                      All Nationwide Locations
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-brand-text">
                      Express Priority
                    </td>
                    <td className="py-4 px-4">1–2 Business Days</td>
                    <td className="py-4 px-4">Expedited Air Dispatch</td>
                    <td className="py-4 px-4 font-medium text-brand-text">
                      Domestic Continental US
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-brand-text">
                      Fresh Meal Cold-Chain
                    </td>
                    <td className="py-4 px-4">1–2 Business Days</td>
                    <td className="py-4 px-4">Insulated & Dry Ice Thermal</td>
                    <td className="py-4 px-4 font-medium text-brand-text">
                      Select Metro & Express Zones
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Topic 3 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-brand-teal/30 shadow-xs space-y-5 relative overflow-hidden">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-teal text-white flex items-center justify-center font-heading font-black text-lg shrink-0">
                3
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Fresh Food & Perishable Goods Shipping
              </h2>
            </div>

            <div className="p-5 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-start gap-3.5">
              <Snowflake
                size={22}
                className="text-brand-teal shrink-0 mt-0.5"
              />
              <p className="text-xs sm:text-sm text-brand-text font-medium leading-relaxed">
                <strong>100% Fresh Arrival Guarantee:</strong> Fresh and raw
                meals are packed inside insulated thermal liners with non-toxic
                dry ice or ice packs to maintain frozen temperatures during
                transit.
              </p>
            </div>

            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              To avoid weekend courier warehouse delays, fresh food orders are
              dispatched exclusively Monday through Wednesday. Please unpack and
              refrigerate/freeze immediately upon package delivery.
            </p>
          </div>

          {/* Topic 4 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/70 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-golden/10 text-brand-golden flex items-center justify-center font-heading font-black text-lg shrink-0">
                4
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Live Order Tracking & Notifications
              </h2>
            </div>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              As soon as your package leaves our facility, you will receive an
              automated email and SMS containing your tracking number and direct
              tracking link.
            </p>
            <div className="p-5 rounded-2xl bg-brand-peach/30 border border-brand-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white text-brand-coral flex items-center justify-center shrink-0 shadow-xs">
                  <PackageCheck size={24} />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-brand-text">
                    Live Order Tracking Portal
                  </h4>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Enter your Order ID (e.g. PAW-001234) for real-time status
                    updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Topic 5 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/70 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-heading font-black text-lg shrink-0">
                5
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Package Issues, Address Updates & Support
              </h2>
            </div>
            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              We take full responsibility for ensuring your pet supplies arrive
              safely:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4.5 rounded-2xl bg-brand-bg border border-brand-border/60 space-y-1.5">
                <h5 className="font-heading font-bold text-sm text-brand-text">
                  Damaged Packages
                </h5>
                <p className="text-xs text-brand-muted leading-relaxed">
                  If items arrive damaged, take photos and contact support
                  within 48 hours for an instant reshipment.
                </p>
              </div>
              <div className="p-4.5 rounded-2xl bg-brand-bg border border-brand-border/60 space-y-1.5">
                <h5 className="font-heading font-bold text-sm text-brand-text">
                  Lost in Transit
                </h5>
                <p className="text-xs text-brand-muted leading-relaxed">
                  If tracking shows no movement for 5 consecutive business days,
                  we issue a carrier claim and re-ship free.
                </p>
              </div>
              <div className="p-4.5 rounded-2xl bg-brand-bg border border-brand-border/60 space-y-1.5">
                <h5 className="font-heading font-bold text-sm text-brand-text">
                  Address Corrections
                </h5>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Need an address fix? Contact support within 1 hour of placing
                  order for seamless updates.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-brand-peach/20 border border-brand-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div>
                <h4 className="font-heading font-bold text-sm text-brand-text">
                  Paws & Care Fulfillment Desk
                </h4>
                <p className="text-xs text-brand-muted">
                  Email: shipping@pawsandcare.com | Phone: +1 (800) 555-1000
                </p>
              </div>
              <Link
                to="/contact"
                className="px-5 py-2.5 rounded-full bg-brand-coral text-white text-xs font-heading font-black uppercase tracking-wider hover:bg-brand-coral-dark shrink-0 transition-colors"
              >
                Contact Logistics Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
