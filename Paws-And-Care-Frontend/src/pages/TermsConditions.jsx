import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldAlert, CheckCircle2, ChevronRight, AlertCircle, Mail, Clock, Scale, ShoppingBag, HeartHandshake } from 'lucide-react';

export default function TermsConditions() {
  const [activeSection, setActiveSection] = useState('acceptance');

  const sections = [
    { id: 'acceptance', title: '1. Agreement to Terms' },
    { id: 'account-reg', title: '2. Account Registration' },
    { id: 'products-pricing', title: '3. Product Details & Availability' },
    { id: 'vet-disclaimer', title: '4. Vet & Pet Health Disclaimer' },
    { id: 'orders-payments', title: '5. Orders & Payment Terms' },
    { id: 'intellectual-property', title: '6. Intellectual Property' },
    { id: 'prohibited-conduct', title: '7. Prohibited Activities' },
    { id: 'limitation-liability', title: '8. Limitation of Liability' },
    { id: 'governing-law', title: '9. Governing Law & Disputes' },
    { id: 'contact-support', title: '10. Customer Inquiries' },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <span className="text-brand-text font-semibold">Terms & Conditions</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-coral/10 text-brand-coral font-heading font-black text-xs uppercase tracking-wider">
            <Scale size={14} />
            <span>Terms of Service</span>
          </div>

          <h1 className="font-heading font-black text-3xl sm:text-5xl text-brand-text leading-tight tracking-tight max-w-4xl mx-auto">
            Terms & Conditions
          </h1>

          <p className="font-sans text-sm sm:text-base text-brand-muted max-w-3xl mx-auto leading-relaxed">
            Welcome to Paws & Care. Please review these terms carefully, as they govern your use of our platform, orders, and pet services.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-brand-muted font-medium">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-brand-coral" /> Effective Date: August 1, 2026
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-border hidden sm:block" />
            <span className="flex items-center gap-1.5">
              <FileText size={14} className="text-brand-teal" /> Read Time: ~8 mins
            </span>
          </div>
        </div>
      </section>

      {/* Highlights Bar */}
      <section className="py-8 bg-white border-b border-brand-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <ShoppingBag className="w-5 h-5 text-brand-coral" />,
                title: "Order Protections",
                desc: "Clear order confirmations and reliable delivery service."
              },
              {
                icon: <ShieldAlert className="w-5 h-5 text-brand-teal" />,
                title: "Vet Guidance Note",
                desc: "Product recommendations complement, but do not replace, vet diagnosis."
              },
              {
                icon: <HeartHandshake className="w-5 h-5 text-brand-golden" />,
                title: "Customer Satisfaction",
                desc: "Dedicated support team for returns, refunds, and order help."
              },
              {
                icon: <Scale className="w-5 h-5 text-brand-coral" />,
                title: "Clear Mutual Rights",
                desc: "Protected account integrity and user conduct guidelines."
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

      {/* Main Content Area - 2-Column Grid with Table of Contents Sidebar */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Table of Contents Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-28 bg-white rounded-3xl p-6 border border-brand-border/70 shadow-sm space-y-4">
                <h3 className="font-heading font-black text-base text-brand-text flex items-center gap-2 border-b border-brand-border pb-3">
                  <FileText size={18} className="text-brand-coral" />
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-between cursor-pointer ${
                        activeSection === sec.id
                          ? 'bg-brand-peach/60 text-brand-coral font-semibold border-l-4 border-brand-coral pl-4'
                          : 'text-brand-muted hover:bg-brand-bg hover:text-brand-text'
                      }`}
                    >
                      <span>{sec.title}</span>
                      {activeSection === sec.id && <ChevronRight size={14} className="text-brand-coral shrink-0" />}
                    </button>
                  ))}
                </nav>

                <div className="pt-4 border-t border-brand-border/60">
                  <div className="p-4 rounded-2xl bg-brand-peach/30 border border-brand-border/40 text-center space-y-2">
                    <p className="text-xs font-semibold text-brand-text">Questions about terms?</p>
                    <a
                      href="mailto:support@pawsandcare.com"
                      className="inline-flex items-center gap-1.5 text-xs font-heading font-black text-brand-coral hover:underline"
                    >
                      <Mail size={14} /> support@pawsandcare.com
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Articles Body */}
            <main className="lg:col-span-8 space-y-10">
              
              {/* Section 1 */}
              <div id="acceptance" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-heading font-black text-base shrink-0">
                    1
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Agreement to Terms
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  By accessing, browsing, or making purchases through the Paws & Care website or mobile experience, you agree to be bound by these Terms & Conditions and all applicable laws and regulations. If you do not agree with any part of these terms, please do not use our services.
                </p>
              </div>

              {/* Section 2 */}
              <div id="account-reg" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-heading font-black text-base shrink-0">
                    2
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Account Registration & Responsibilities
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  When creating an account on Paws & Care, you agree to provide accurate, current, and complete information. You are responsible for safeguarding your password and account credentials.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-brand-muted list-disc list-inside pl-2 leading-relaxed">
                  <li>You must be at least 18 years of age to register an account or place orders independently.</li>
                  <li>You are responsible for all activities and purchases conducted under your registered account.</li>
                  <li>Notify our support team immediately if you suspect unauthorized access to your account.</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div id="products-pricing" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-golden/10 text-brand-golden flex items-center justify-center font-heading font-black text-base shrink-0">
                    3
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Product Details & Availability
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  We strive to ensure all product images, specifications, and ingredient lists are as accurate as possible. However:
                </p>
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-xl bg-brand-bg border border-brand-border/50 text-xs sm:text-sm text-brand-muted">
                    <strong className="text-brand-text">Product Specifications:</strong> Item details and availability are updated regularly to ensure exact fulfillment.
                  </div>
                  <div className="p-3.5 rounded-xl bg-brand-bg border border-brand-border/50 text-xs sm:text-sm text-brand-muted">
                    <strong className="text-brand-text">Product Availability:</strong> Items in your cart are not reserved until checkout is completed. If an item becomes out of stock post-order, we will notify you promptly and offer a replacement or refund.
                  </div>
                </div>
              </div>

              {/* Section 4 - Special Callout */}
              <div id="vet-disclaimer" className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-coral/30 shadow-xs space-y-4 scroll-mt-28 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-coral/10 rounded-bl-full pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-coral text-white flex items-center justify-center font-heading font-black text-base shrink-0">
                    4
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Veterinary & Pet Health Disclaimer
                  </h2>
                </div>

                <div className="p-4 rounded-2xl bg-brand-peach/40 border border-brand-border flex items-start gap-3">
                  <AlertCircle size={20} className="text-brand-coral shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-brand-text font-medium leading-relaxed">
                    <strong>Important Medical Notice:</strong> Product descriptions, pet care guides, and nutrition advice provided on Paws & Care are for informational and educational purposes only.
                  </p>
                </div>

                <p className="text-sm text-brand-muted leading-relaxed">
                  They do not constitute professional veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian for specific medical concerns, dietary transitions, or health emergencies regarding your pet.
                </p>
              </div>

              {/* Section 5 */}
              <div id="orders-payments" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-heading font-black text-base shrink-0">
                    5
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Orders & Payment Terms
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  Orders are processed through authorized digital payment gateways and verified payment options.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-brand-peach/20 border border-brand-border/40 text-xs sm:text-sm text-brand-text">
                    <strong className="text-brand-coral">Order Cancellation:</strong> You may cancel orders prior to shipment dispatch. Once shipped, standard returns apply.
                  </div>
                  <div className="p-3.5 rounded-xl bg-brand-peach/20 border border-brand-border/40 text-xs sm:text-sm text-brand-text">
                    <strong className="text-brand-teal">Refund Processing:</strong> Approved refunds are credited back to your original payment method within 3–7 business days.
                  </div>
                </div>
              </div>

              {/* Section 6 */}
              <div id="intellectual-property" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-golden/10 text-brand-golden flex items-center justify-center font-heading font-black text-base shrink-0">
                    6
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Intellectual Property Rights
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  All content on Paws & Care—including logos, product graphics, website designs, text copy, code, and trade dress—is the property of Paws & Care LLC and protected by intellectual property laws. You may not reuse, reproduce, or distribute site content without prior written permission.
                </p>
              </div>

              {/* Section 7 */}
              <div id="prohibited-conduct" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-heading font-black text-base shrink-0">
                    7
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Prohibited Activities
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  Users agree not to engage in any activities that could harm Paws & Care or its community:
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-brand-muted list-disc list-inside pl-2 leading-relaxed">
                  <li>Submitting false product reviews or rating manipulations.</li>
                  <li>Using automated scraping, bots, or data extraction scripts on our catalog.</li>
                  <li>Attempting fraudulent payment attempts or unauthorized API calls.</li>
                  <li>Violating any local, state, or federal pet welfare or commercial laws.</li>
                </ul>
              </div>

              {/* Section 8 */}
              <div id="limitation-liability" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-heading font-black text-base shrink-0">
                    8
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Limitation of Liability
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  To the maximum extent permitted by applicable law, Paws & Care shall not be liable for indirect, incidental, punitive, or consequential damages resulting from product use, shipping delays, or site downtime. Our total liability for any claim shall not exceed the amount paid for the specific order in question.
                </p>
              </div>

              {/* Section 9 */}
              <div id="governing-law" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-4 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-golden/10 text-brand-golden flex items-center justify-center font-heading font-black text-base shrink-0">
                    9
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Governing Law & Disputes
                  </h2>
                </div>
                <p className="text-sm text-brand-muted leading-relaxed">
                  These terms are governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles. Any dispute arising under these terms shall be resolved through good-faith negotiation or binding arbitration.
                </p>
              </div>

              {/* Section 10 */}
              <div id="contact-support" className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border/70 shadow-xs space-y-5 scroll-mt-28">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-heading font-black text-base shrink-0">
                    10
                  </div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                    Customer Inquiries & Support
                  </h2>
                </div>

                <p className="text-sm text-brand-muted leading-relaxed">
                  For questions or concerns regarding our Terms & Conditions, please contact our support desk:
                </p>

                <div className="p-4 rounded-2xl bg-brand-peach/20 border border-brand-border/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-brand-text">Paws & Care Support Team</h4>
                    <p className="text-xs text-brand-muted">Email: support@pawsandcare.com | Phone: +1 (800) 555-1000</p>
                  </div>
                  <Link
                    to="/contact"
                    className="px-4 py-2 rounded-full bg-brand-coral text-white text-xs font-heading font-black uppercase tracking-wider hover:bg-brand-coral-dark shrink-0"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>

            </main>

          </div>
        </div>
      </section>

    </div>
  );
}
