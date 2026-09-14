import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  Plus,
  Minus,
  Mail,
  Phone,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const faqs = [
  {
    question: "How long does delivery take?",
    answer:
      "Standard shipping takes 2 to 4 business days. We process all orders placed before 2 PM on the same day.",
  },
  {
    question: "Are your products vet-approved?",
    answer:
      "Absolutely! Every single food recipe, wellness supplement, and grooming formula we offer is developed in partnership with leading veterinarians and nutritionists to ensure it is 100% safe and healthy.",
  },
  {
    question: "Can I return opened pet-care products?",
    answer:
      "We want your pets to be happy! We offer a friendly 30-day taste and comfort guarantee. If your dog or cat doesn't take to a product, you can return it for a full store credit or refund.",
  },
  {
    question: "Which products are suitable for puppies?",
    answer:
      'All products suitable for growing puppies are clearly marked with a "Puppy Safe" badge. This includes customized puppy chow, teething chew toys, and gentle oatmeal shampoos.',
  },
  {
    question: "How do I track my order?",
    answer:
      "As soon as your package is dispatched, we send you a confirmation email containing a tracking link. You can click that link or check your profile dashboard to monitor transit in real time.",
  },
  {
    question: "How can I contact customer support?",
    answer:
      "Our dedicated pet care experts are available 7 days a week. You can email us at support@pawsandcare.com, call us toll-free at 1-800-PAWS-CARE, or launch the live chat in the bottom right corner.",
  },
];

// Paw icon decoration
const PawIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 14c-1.66 0-3 1.34-3 3 0 1.8 1.5 3 3 3s3-1.2 3-3c0-1.66-1.34-3-3-3z" />
    <circle cx="7.2" cy="10" r="1.8" />
    <circle cx="10.2" cy="7" r="1.8" />
    <circle cx="13.8" cy="7" r="1.8" />
    <circle cx="16.8" cy="10" r="1.8" />
  </svg>
);

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="bg-brand-bg pt-8 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12 border-t border-brand-border/40 select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Layered header banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div className="text-left space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-brand-teal font-heading font-extrabold text-xs uppercase tracking-wider">
              <PawIcon className="w-3 h-3 text-brand-teal" />
              <span>Need Help?</span>
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl text-brand-text tracking-tight">
              Quick Answers for Caring Pet Parents
            </h2>
            <p className="font-sans text-brand-muted text-sm sm:text-base leading-relaxed">
              Find quick answers regarding shipping, ingredient standards,
              returns, and safety.
            </p>
          </div>
          <Link
            to="/faq"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-brand-teal text-brand-teal hover:bg-brand-teal/5 font-heading font-bold text-xs uppercase tracking-wider transition-all select-none shrink-0"
          >
            <span>View All FAQs</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Accordion Accordion (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeIndex === index;
              return (
                <div
                  key={index}
                  className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-brand-teal bg-white shadow-md"
                      : "border-brand-border/75 bg-brand-surface hover:border-brand-teal/40"
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleFAQ(index);
                      }
                    }}
                    className="w-full flex items-center justify-between p-5 text-left font-heading font-extrabold text-base sm:text-lg text-brand-text focus:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className="shrink-0 ml-4 h-7 w-7 rounded-full bg-brand-bg flex items-center justify-center text-brand-coral">
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-1 border-t border-brand-border/30 font-sans text-sm sm:text-base text-brand-muted leading-relaxed text-left">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Column 2: Layered Support Card (4 Cols) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-brand-peach to-[#FFF0DF] border border-brand-border rounded-[2rem] p-6 sm:p-8 text-left relative overflow-hidden shadow-xs">
            {/* Decorative blob */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-brand-teal/10 rounded-full filter blur-xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="h-12 w-12 rounded-2xl bg-white border border-brand-border flex items-center justify-center text-brand-teal shadow-xs">
                <HelpCircle size={24} />
              </div>

              <div className="space-y-2">
                <h3 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                  Still have questions?
                </h3>
                <p className="font-sans text-brand-muted text-xs sm:text-sm leading-relaxed">
                  We are here to help! Get in touch with our friendly support
                  specialists for personalized advice on dog diets, treats, and
                  care.
                </p>
              </div>

              {/* Direct Support Details */}
              <div className="space-y-3 pt-2">
                <a
                  href="mailto:support@pawsandcare.com"
                  className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white border border-brand-border/40 rounded-xl transition-all duration-200"
                >
                  <Mail size={16} className="text-brand-coral" />
                  <div className="text-left">
                    <span className="block text-[10px] uppercase font-heading font-bold text-brand-muted">
                      Email Us
                    </span>
                    <span className="block text-xs sm:text-sm font-heading font-extrabold text-brand-text">
                      support@pawsandcare.com
                    </span>
                  </div>
                </a>

                <a
                  href="tel:1-800-7297-2273"
                  className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white border border-brand-border/40 rounded-xl transition-all duration-200"
                >
                  <Phone size={16} className="text-brand-teal" />
                  <div className="text-left">
                    <span className="block text-[10px] uppercase font-heading font-bold text-brand-muted">
                      Call Support
                    </span>
                    <span className="block text-xs sm:text-sm font-heading font-extrabold text-brand-text">
                      1-800-700-1000
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
