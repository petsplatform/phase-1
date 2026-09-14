import React, { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How does the Happy Pets Club autoship subscription work?",
      answer:
        "Our autoship subscription is simple and flexible! When you choose auto-ship, you get an automatic 15% discount on refills. You can easily adjust your shipping frequency, skip a delivery, or cancel at any time directly through your dashboard with no hidden fees.",
    },
    {
      question: "Are all products and wellness formulas strictly vet-approved?",
      answer:
        "Yes, absolutely! Every medication, supplement, and health product we carry is sourced directly from certified manufacturers and is strictly reviewed and approved by our licensed veterinary pharmacists.",
    },
    {
      question: "What is your return policy if my pet doesn't like an item?",
      answer:
        "We want you and your pet to be completely satisfied. If your pet doesn't like a product or if it's not the right fit, we offer a hassle-free 30-day refund or exchange on most items. Please contact our support team to initiate a return.",
    },
    {
      question: "How do I connect with your 24/7 veterinary advice chat?",
      answer:
        "You can connect instantly with our licensed veterinary chat by clicking the 'Consult Now' button or the live chat icon in the bottom corner of your screen. Our assistants are available 24/7 to help guide you.",
    },
    {
      question: "How long does shipping take and is it free?",
      answer:
        "Standard shipping takes 3-5 business days. We offer free shipping on all orders over $49! For temperature-sensitive prescription medications, we use specialized cold-chain delivery to ensure they arrive safe and effective.",
    },
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-16 lg:py-24  overflow-hidden border-t border-slate-100">
      {/* ── Ambient background blurs for premium touch ── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-0 h-[400px] w-[400px] rounded-full bg-soft-mint/45 blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-[300px] w-[300px] rounded-full bg-light-blue/30 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Responsive Grid layout: leftside FAQ, rightside text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ──── LEFT: FAQ Accordion Column (7-span) ──── */}
          <div className="lg:col-span-7 order-2 lg:order-1 w-full space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeIndex === index;
              return (
                <div
                  key={index}
                  className={`group rounded-3xl border transition-all duration-300 ${
                    isOpen
                      ? "bg-slate-50/50 border-primary-green/30 shadow-xs"
                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 text-left focus:outline-none cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-bold text-deep-navy tracking-tight group-hover:text-primary-green transition-colors pr-4">
                      {faq.question}
                    </span>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all duration-300 ${
                        isOpen ? "bg-primary-green rotate-180 scale-105" : "bg-deep-navy hover:bg-primary-green"
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="h-5 w-5 stroke-[2.5]" />
                      ) : (
                        <Plus className="h-5 w-5 stroke-[2.5]" />
                      )}
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100 pb-6 px-6"
                        : "grid-rows-[0fr] opacity-0 pb-0 px-6"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ──── RIGHT: Context Column (5-span) ──── */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col text-left lg:pl-6">
            {/* Pill Badge */}
            <div className="mb-6 inline-flex self-start items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-4.5 py-1.5 shadow-2xs backdrop-blur-md">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-deep-navy">
                FAQ
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display text-[2.2rem] font-extrabold leading-tight tracking-tight sm:text-[2.8rem] text-deep-navy">
              Questions? We have <br className="hidden sm:inline" />
              <span className="bg-linear-to-r from-primary-green via-medical-teal to-dark-green bg-clip-text text-transparent">
                pet-friendly
              </span>{" "}
              answers.
            </h2>

            {/* Description */}
            <p className="mt-5 text-base sm:text-lg font-medium leading-relaxed text-slate-600 max-w-xl">
              Clear answers about products, delivery, subscription cycles, and
              24/7 veterinary advice support.
            </p>

            {/* Interactive Vet Help Assist Badge */}
            <div className="mt-8 p-5 rounded-3xl bg-linear-to-br from-soft-mint to-light-blue border border-slate-100 flex items-start gap-4">
              <div className="h-10 w-10 rounded-2xl bg-white border border-primary-green/20 flex items-center justify-center shrink-0 shadow-3xs">
                <HelpCircle className="h-5 w-5 text-primary-green" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-deep-navy">Still have questions?</h4>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Our customer service team and licensed veterinary pharmacist consult is ready to assist you day and night.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
