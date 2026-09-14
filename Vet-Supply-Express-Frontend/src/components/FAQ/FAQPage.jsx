import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Plus,
  Minus,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

const FAQPage = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqs = [
    {
      question: "Is VetSupplyExpress a licensed pharmacy?",
      answer:
        "Yes, VetSupplyExpress is fully licensed and compliant with national and state pharmacy board regulations. All prescription medications are dispensed directly by certified pharmacists and sourced from FDA-registered laboratories.",
    },
    {
      question: "How do I verify my pet's prescription?",
      answer:
        "During checkout, you can upload a scan/photo of your veterinarian's written prescription, or authorize us to contact your vet clinic directly to verify the prescription details. Verification usually takes 24-48 business hours.",
    },
    {
      question: "Can I transfer a prescription from another pharmacy?",
      answer:
        "Absolutely. Provide us with your current pharmacy's name, phone number, and your prescription details. Our licensed pharmacy team will coordinate the transfer directly behind the scenes.",
    },
    {
      question: "Do you ship refrigerated or cold-chain medications?",
      answer:
        "Yes. Insulin and other temperature-sensitive items are shipped in insulated cold-chain packaging with cold gel-packs via expedited priority shipping. They are processed and dispatched Monday through Thursday to guarantee they do not sit in carrier warehouses over weekends.",
    },
    {
      question: "What is your standard shipping delivery time?",
      answer:
        "Standard orders are processed within 24 hours. Delivery typically takes 2-5 business days depending on your location. Free standard shipping applies to all orders over $49.",
    },
    {
      question: "Can I set up auto-refills for my pet's prescriptions?",
      answer:
        "Yes, you can enable auto-refill subscriptions on eligible medications. You can set the frequency (e.g., every 30, 60, or 90 days), save 5% on refill orders, and skip or cancel shipments anytime from your dashboard.",
    },
    {
      question: "What is your return policy for prescriptions?",
      answer:
        "Under federal law, pharmacy-dispensed prescription medications cannot be returned for reuse or refund. If there was a clinic error or damage during transit, please contact our helpdesk immediately to resolve the issue.",
    },
    {
      question: "How do I track my order?",
      answer:
        "Once shipped, you will receive a tracking link via email. You can also view live order progress by visiting the 'Track Order' link in the footer or under your Account Dashboard.",
    },
  ];

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  return (
    <div className="relative bg-[#F8FAFC] min-h-screen text-[#102A43] font-manrope selection:bg-[#18A9E5]/30 text-left py-16 md:py-20">
      <div className="container-custom max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-10 text-xs font-bold text-[#627D98] flex items-center gap-1.5 uppercase tracking-wider">
          <Link to="/" className="hover:text-[#087BC1] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#9FB3C8]" />
          <span className="text-[#102A43]">Frequently Asked Questions</span>
        </div>

        {/* HERO TITLE */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#087BC1]/20 bg-[#EAF5FC] text-[#087BC1] text-xs font-extrabold uppercase tracking-wider mb-6">
            <HelpCircle className="w-4 h-4" />
            <span>Help Center</span>
          </div>
          <h1 className="font-jakarta font-extrabold text-4xl text-[#073B66] tracking-tight leading-[1.15]">
            Frequently Asked <span className="text-[#087BC1]">Questions</span>
          </h1>
          <p className="text-sm sm:text-base text-[#66788A] mt-5 leading-relaxed font-semibold">
            Have questions about prescription verification, cold-chain delivery,
            or auto-refills? We've compiled answers to our most common
            inquiries.
          </p>
        </div>

        {/* FAQ ACCORDION LIST */}
        <div className="bg-white border border-[#D9E8F2] rounded-3xl p-6 md:p-8 shadow-xs flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={idx}
                className="border-b border-[#D9E8F2]/60 last:border-0 pb-4 last:pb-0 transition-all"
              >
                <button
                  onClick={() => toggleExpand(idx)}
                  className="w-full flex items-center justify-between gap-4 text-left py-3.5 cursor-pointer group"
                >
                  <span className="font-jakarta font-extrabold text-sm sm:text-base text-[#073B66] group-hover:text-[#087BC1] transition-colors leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isExpanded
                        ? "bg-[#EAF5FC] text-[#087BC1]"
                        : "bg-[#F8FAFC] text-[#627D98] group-hover:bg-[#EAF5FC]"
                    }`}
                  >
                    {isExpanded ? (
                      <Minus className="w-4 h-4 transition-transform duration-300" />
                    ) : (
                      <Plus className="w-4 h-4 transition-transform duration-300" />
                    )}
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100 mt-2"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs sm:text-sm text-[#66788A] leading-relaxed font-semibold bg-[#F8FAFC]/75 rounded-2xl p-4.5 border border-[#D9E8F2]/30">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM HELP CONTACT CARD */}
        <div className="mt-16 bg-gradient-to-r from-[#073B66] to-[#0B2D4F] text-white rounded-3xl p-8 relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#087BC1]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="text-center md:text-left relative z-10">
            <h3 className="font-jakarta font-extrabold text-xl">
              Still need pharmacy help?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-semibold">
              Our clinical care staff and licensed pharmacists are available for
              consult.
            </p>
          </div>
          <Link
            to="/contact"
            className="bg-[#087BC1] hover:bg-white hover:text-[#087BC1] text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-white/10 shrink-0 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Consult Pharmacy Staff</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
