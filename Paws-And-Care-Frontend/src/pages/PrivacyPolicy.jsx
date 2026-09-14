import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, FileText, ChevronRight, Mail, Phone, Clock, CheckCircle2, UserCheck, Database } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-brand-bg min-h-screen font-sans text-brand-text antialiased">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-peach/30 via-brand-peach/10 to-transparent border-b border-brand-border/60 py-14 sm:py-20 select-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-brand-coral/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 relative z-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-2 text-xs text-brand-muted font-sans">
            <Link to="/" className="hover:text-brand-coral transition-colors font-medium">Home</Link>
            <ChevronRight size={12} className="text-brand-border" />
            <span className="text-brand-muted font-medium">Legal</span>
            <ChevronRight size={12} className="text-brand-border" />
            <span className="text-brand-text font-semibold">Privacy Policy</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-teal/10 text-brand-teal font-heading font-black text-xs uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Your Privacy Protection</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl text-brand-text leading-tight tracking-tight max-w-4xl mx-auto">
            Privacy Policy
          </h1>

          <p className="font-sans text-sm sm:text-base text-brand-muted max-w-3xl mx-auto leading-relaxed">
            At Paws & Care, we value your trust as much as we love pets. Learn how we collect, protect, and manage your personal data and pet profiles.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-brand-muted font-medium">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-brand-coral" /> Last Updated: August 1, 2026
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-border hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <FileText size={14} className="text-brand-teal" /> Read Time: ~5 mins
            </span>
          </div>
        </div>
      </section>

      {/* Key Guarantees Highlight Bar */}
      <section className="py-8 bg-white border-b border-brand-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Lock className="w-5 h-5 text-brand-coral" />,
                title: "256-Bit SSL Encryption",
                desc: "Bank-grade protection for payment and account security."
              },
              {
                icon: <Eye className="w-5 h-5 text-brand-teal" />,
                title: "Zero Data Sales",
                desc: "We never sell or rent your personal info to third parties."
              },
              {
                icon: <UserCheck className="w-5 h-5 text-brand-golden" />,
                title: "Full Account Control",
                desc: "Access, modify, or erase your data anytime from dashboard."
              },
              {
                icon: <Database className="w-5 h-5 text-brand-coral" />,
                title: "Pet Health Privacy",
                desc: "Pet profiles are kept strictly private for tailored recommendations."
              }
            ].map((card, idx) => (
              <div key={idx} className="p-4.5 rounded-2xl bg-brand-peach/20 border border-brand-border/50 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white shadow-xs shrink-0">{card.icon}</div>
                <div>
                  <h4 className="font-heading font-black text-sm text-brand-text">{card.title}</h4>
                  <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
                Information Collection & Usage
              </h2>
            </div>

            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              We gather information necessary to process your pet product orders, deliver personalized health recommendations, and ensure a seamless shopping experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-brand-peach/20 border border-brand-border/50 space-y-3">
                <h4 className="font-heading font-bold text-sm text-brand-text uppercase tracking-wide">
                  What We Collect:
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-brand-muted list-disc list-inside leading-relaxed">
                  <li><strong className="text-brand-text">Account & Contact Details:</strong> Name, email address, phone number, and shipping address.</li>
                  <li><strong className="text-brand-text">Pet Profile Information:</strong> Pet's breed, age, weight, dietary restrictions, and wellness goals.</li>
                  <li><strong className="text-brand-text">Payment Data:</strong> Processed securely via encrypted gateway providers (no raw card data stored).</li>
                  <li><strong className="text-brand-text">Usage & Device Info:</strong> IP address, device type, and shopping browsing activity.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-brand-peach/20 border border-brand-border/50 space-y-3">
                <h4 className="font-heading font-bold text-sm text-brand-text uppercase tracking-wide">
                  How We Use It:
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    "Order fulfillment, packaging & doorstep delivery",
                    "Customized pet nutrition & toy recommendations",
                    "Automated shipping tracking & dispatch notifications",
                    "Responsive 24/7 pet care customer support"
                  ].map((useCase, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-brand-border/40">
                      <CheckCircle2 size={16} className="text-brand-coral mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-brand-text">{useCase}</span>
                    </div>
                  ))}
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
                Data Sharing, Security & Storage
              </h2>
            </div>

            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              Your privacy is fundamental to our service. We enforce bank-grade 256-bit SSL encryption and maintain a strict zero-data-sales pledge. We share data only with authorized logistics partners essential to completing your orders.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4.5 rounded-2xl border border-brand-border/60 bg-brand-bg space-y-1.5">
                <h4 className="font-heading font-bold text-sm text-brand-text">Logistics Partners</h4>
                <p className="text-xs text-brand-muted leading-relaxed">Name and shipping address shared with couriers exclusively to complete doorstep delivery.</p>
              </div>
              <div className="p-4.5 rounded-2xl border border-brand-border/60 bg-brand-bg space-y-1.5">
                <h4 className="font-heading font-bold text-sm text-brand-text">PCI Payment Gateways</h4>
                <p className="text-xs text-brand-muted leading-relaxed">Billing data handled by PCI-DSS compliant payment providers with end-to-end tokenization.</p>
              </div>
              <div className="p-4.5 rounded-2xl border border-brand-border/60 bg-brand-bg space-y-1.5">
                <h4 className="font-heading font-bold text-sm text-brand-text">Legal Compliance</h4>
                <p className="text-xs text-brand-muted leading-relaxed">Information is disclosed only if mandated by legal subpoenas or official regulatory requests.</p>
              </div>
            </div>
          </div>

          {/* Topic 3 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/70 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-golden/10 text-brand-golden flex items-center justify-center font-heading font-black text-lg shrink-0">
                3
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Cookies & Tracking Technologies
              </h2>
            </div>

            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              Cookies enhance your browsing experience by remembering items in your cart, saving active sessions, and optimizing site search speeds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-5 rounded-2xl bg-brand-peach/20 border border-brand-border/60 space-y-2">
                <h4 className="font-heading font-bold text-sm text-brand-text">Essential Cookies</h4>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  Required for shopping cart persistence, user authentication, and checkout security. These cannot be disabled as they enable core site features.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-brand-peach/20 border border-brand-border/60 space-y-2">
                <h4 className="font-heading font-bold text-sm text-brand-text">Analytics & Preference Cookies</h4>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  Allows us to understand popular pet product categories and improve site navigation. You can adjust cookie preferences through your browser settings.
                </p>
              </div>
            </div>
          </div>

          {/* Topic 4 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/70 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-heading font-black text-lg shrink-0">
                4
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Your Rights & Account Choices
              </h2>
            </div>

            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              You retain complete ownership of your personal data and pet profiles. You can manage your preferences directly from your account dashboard or request assistance from our support team.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { title: "Access & Data Export", desc: "Request a downloadable record of your personal data anytime." },
                { title: "Profile Updates & Correction", desc: "Modify contact details or pet health preferences in your profile settings." },
                { title: "Account & Data Erasure", desc: "Request permanent deletion of your account and personal transaction history." },
                { title: "Communication Opt-Out", desc: "Unsubscribe from promotional emails or SMS notifications with a single click." }
              ].map((right, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-brand-bg border border-brand-border/50">
                  <h5 className="font-heading font-bold text-sm text-brand-text">{right.title}</h5>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed">{right.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic 5 */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-brand-border/70 shadow-xs space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-heading font-black text-lg shrink-0">
                5
              </div>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Policy Updates & Privacy Contact
              </h2>
            </div>

            <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
              We periodically update this policy to reflect improvements in our services or changes in data protection laws. Significant updates will be highlighted on our homepage or sent directly to registered users.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-brand-peach/30 border border-brand-border/60 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white text-brand-coral flex items-center justify-center shrink-0 shadow-xs">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-brand-muted font-medium">Email Privacy Team</p>
                  <a href="mailto:privacy@pawsandcare.com" className="font-heading font-black text-sm text-brand-text hover:text-brand-coral">
                    privacy@pawsandcare.com
                  </a>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-brand-peach/30 border border-brand-border/60 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white text-brand-teal flex items-center justify-center shrink-0 shadow-xs">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-brand-muted font-medium">Privacy Helpline</p>
                  <a href="tel:+18005551000" className="font-heading font-black text-sm text-brand-text hover:text-brand-teal">
                    +1 (800) 555-1000
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
