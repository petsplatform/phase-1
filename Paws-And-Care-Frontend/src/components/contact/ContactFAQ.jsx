import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, Package } from 'lucide-react';
import { quickFaqs } from '../../data/contactData';

export default function ContactFAQ() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-border/60 p-6 sm:p-8 flex flex-col gap-6 text-left shadow-sm">
      <div>
        <h3 className="font-heading font-black text-xl text-brand-text mb-2 flex items-center gap-2">
          <HelpCircle size={22} className="text-brand-coral" />
          Need a Quick Answer?
        </h3>
        <p className="font-sans text-xs sm:text-sm text-brand-muted">
          Before sending a message, browse these top questions from our community of pet parents.
        </p>
      </div>

      {/* Accordion Questions */}
      <div className="space-y-3">
        {quickFaqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-300 ${
                isExpanded
                  ? 'border-brand-teal/30 bg-brand-bg/20'
                  : 'border-brand-border/40 hover:border-brand-border bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(faq.id)}
                className="w-full py-3.5 px-4 flex items-center justify-between gap-3 text-left font-sans font-bold text-xs sm:text-sm text-brand-text cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={16}
                  className={`text-brand-muted shrink-0 transition-transform duration-300 ${
                    isExpanded ? 'transform rotate-180 text-brand-teal' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isExpanded ? 'max-h-40 border-t border-brand-border/20' : 'max-h-0'
                }`}
              >
                <p className="p-4 font-sans text-xs sm:text-sm text-brand-muted leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          to="/faq"
          className="flex-1 py-3 px-5 rounded-xl border border-brand-border hover:border-brand-teal text-brand-text hover:text-brand-teal font-sans font-bold text-xs sm:text-sm text-center transition-all duration-200"
        >
          View All FAQs
        </Link>
        <Link
          to="/account/orders"
          className="flex-1 py-3 px-5 rounded-xl bg-brand-teal hover:bg-brand-deep-teal text-white font-sans font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-all duration-200"
        >
          <Package size={14} />
          Track Order
        </Link>
      </div>
    </div>
  );
}
