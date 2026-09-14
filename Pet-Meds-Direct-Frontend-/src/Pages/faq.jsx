import React, { useState } from "react";
import { Plus, HelpCircle, MessageSquare, Phone, Mail, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { faqData } from "../data/faq";

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="relative min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1200px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-10 text-xs sm:text-sm font-bold text-slate-500 text-left">
          <Link to="/" className="hover:text-primary-green transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-deep-navy">FAQ</span>
        </div>

        {/* Top Header Section */}
        <div className="text-center flex flex-col items-center mb-16">
          {/* Pill Label */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-deep-navy bg-white border border-[#e5e9ec] shadow-xs w-fit mb-5">
            FAQ
          </span>

          {/* Main Headline */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight leading-[1.15] mb-5 max-w-3xl">
            Questions? We have <span className="text-primary-green">pet-friendly</span> answers.
          </h1>

          {/* Sub-headline */}
          <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
            Clear answers about products, delivery, subscription cycles, and 24/7 veterinary advice support.
          </p>
        </div>

        {/* Bottom Section: Stacked Content */}
        <div className="max-w-3xl mx-auto flex flex-col gap-12">
          {/* FAQ Accordion List */}
          <div className="flex flex-col gap-4 text-left w-full">
            {faqData.map((item, index) => {
              const isActive = activeIndex === index;
              return (
                <div
                  key={item.id}
                  className={`bg-white border transition-all duration-300 rounded-[1.5rem] overflow-hidden ${
                    isActive
                      ? "border-primary-green/30 shadow-md scale-[1.005]"
                      : "border-[#e5e9ec] shadow-xs hover:border-primary-green/20 hover:shadow-sm"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    aria-expanded={isActive}
                    className="flex items-center justify-between w-full p-5 sm:p-6 text-left focus:outline-none cursor-pointer group"
                  >
                    <span className="text-deep-navy font-bold text-base sm:text-[17px] pr-4 group-hover:text-primary-green transition-colors duration-200 leading-snug">
                      {item.question}
                    </span>
                    <span
                      className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive 
                          ? "bg-deep-navy text-white rotate-45" 
                          : "bg-deep-navy text-white hover:bg-primary-green"
                      }`}
                    >
                      <Plus className="h-5 w-5" />
                    </span>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isActive ? "max-h-[500px] opacity-100 border-t border-slate-100/80" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="p-5 sm:p-6 bg-slate-50/50">
                      <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "Still have questions?" Highlighted Card */}
          <div className="bg-[#eaf8ea] rounded-[2rem] border border-primary-green/10 p-6 sm:p-8 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary-green/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="bg-white h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-xs">
                <HelpCircle className="text-primary-green h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-deep-navy font-extrabold text-base sm:text-lg mb-2">
                  Still have questions?
                </h3>
                <p className="text-slate-600 font-medium text-sm leading-relaxed mb-5">
                  Our customer service team and licensed veterinary pharmacist consult is ready to assist you day and night.
                </p>
                
                {/* Connect Actions */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-green hover:bg-dark-green text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Contact Support
                  </Link>
                  <a
                    href="tel:18007386337"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#e5e9ec] hover:border-slate-300 text-deep-navy font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xs cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    Call Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
