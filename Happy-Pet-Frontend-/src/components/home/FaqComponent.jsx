import React, { useState } from "react";
import { Plus } from "lucide-react";
import { faqData } from "../../utils/home/faq.js";

export default function FaqComponent() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleIndex = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden select-none border-t border-brand-purple/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Heading, Badge, & Description */}
          <div className="lg:col-span-5 text-left lg:sticky lg:top-8">
            {/* Small Pill Badge */}
            <div className="inline-flex items-center border border-brand-purple/15 px-3 py-1 rounded-full text-brand-purple text-[10px] font-bold uppercase tracking-widest mb-6">
              FAQ
            </div>
            
            {/* Title */}
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-display font-semibold tracking-tight text-brand-purple leading-tight">
              Questions? We have pet-friendly answers.
            </h2>
            
            {/* Subtitle */}
            <p className="text-sm sm:text-base text-brand-brown/70 font-medium mt-4 leading-relaxed max-w-md">
              Clear answers about products, delivery, subscription cycles, and 24/7 veterinary advice support.
            </p>
          </div>

          {/* Right Column: Accordions list */}
          <div className="lg:col-span-7 w-full">
            {faqData.list.map((faq, idx) => {
              const isOpen = activeIndex === idx;

              return (
                <div
                  key={idx}
                  className={`bg-white border border-brand-purple/10 rounded-[20px] mb-4 transition-all duration-300 ${
                    isOpen 
                      ? "shadow-[0_15px_35px_rgba(75,0,75,0.03)] border-brand-purple/15" 
                      : "hover:border-brand-purple/20"
                  }`}
                >
                  {/* Toggle Header Button */}
                  <button
                    onClick={() => toggleIndex(idx)}
                    className="w-full flex items-center justify-between p-5 cursor-pointer text-left outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display font-semibold text-sm sm:text-base text-brand-purple pr-4 transition-colors duration-200">
                      {faq.question}
                    </span>
                    
                    {/* Plus/Close circle indicator */}
                    <div
                      className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all duration-300 ${
                        isOpen ? "bg-brand-peach rotate-45" : "bg-brand-purple"
                      }`}
                    >
                      <Plus className="w-4.5 h-4.5" />
                    </div>
                  </button>

                  {/* Accordion content */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? "max-h-[300px] opacity-100 pb-5 px-5" : "max-h-0 opacity-0 px-5 pointer-events-none"
                    }`}
                  >
                    <div className="border-t border-brand-purple/5 pt-4 text-xs sm:text-[13.5px] text-brand-brown/75 leading-relaxed font-medium">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
