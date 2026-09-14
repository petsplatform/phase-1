import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Phone, Mail, HelpCircle } from "lucide-react";

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "How long does delivery take?",
      answer: "Standard orders are dispatched within 24 hours and take 2-3 business days. For medical vaccines or temperature-controlled pharmaceutical liquids, we offer expedited overnight shipping to guarantee safety."
    },
    {
      question: "Do you offer free shipping?",
      answer: "Yes, we offer free shipping on qualifying orders. Shipping rates and thresholds are displayed at checkout based on your order total and delivery location."
    },
    {
      question: "Are your products vet-approved?",
      answer: "Yes, 100%. Every medicine, supplement, first aid, and diagnostic device in our inventory is sourced directly from certified pharmaceutical laboratories and is fully approved by licensed US veterinarians."
    },
    {
      question: "Can I return opened products?",
      answer: "Due to health safety and federal regulations, we cannot accept returns on opened prescription medications or supplements. However, unopened items in original packaging can be returned within 30 days of receipt."
    },
    {
      question: "How can I track my order?",
      answer: "Once shipped, you will immediately receive an email notification containing a tracking number and link. You can also view shipping stages directly inside your account panel."
    },
    {
      question: "How do I contact support?",
      answer: "You can call our dedicated support hotline at (800) 555-VETS (8387) or email support@vetsupplyexpress.com. Our support team is active Monday through Saturday."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Keyboard accessibility triggers
  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleAccordion(index);
    }
  };

  return (
    <section id="faq" className="py-20 md:py-24 bg-[#F7FAFC] select-none text-left">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Headers & Support Card */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0874C9] flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Need Help?</span>
              </span>
              <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-[#102A43] mt-2.5 tracking-tight leading-tight">
                Quick Answers for Pet Parents
              </h2>
              <p className="text-sm text-[#627D98] mt-3 leading-relaxed">
                Can't find the details you are looking for? Learn about our delivery schedules, prescription validation policies, and support services.
              </p>
            </div>

            {/* Compact Help Center Card */}
            <div className="bg-white border border-[#D9E8F2] p-6.5 rounded-2xl shadow-sm flex flex-col gap-6">
              <h3 className="font-heading font-bold text-base text-[#102A43] border-b border-[#D9E8F2]/60 pb-3.5">
                Still have questions?
              </h3>
              
              <p className="text-xs text-[#627D98] leading-relaxed">
                Our support coordinators and registered vet pharmacists are standing by to help with diagnostic queries or order logistics.
              </p>

              <div className="flex flex-col gap-3.5 text-xs text-[#102A43]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF5FC] text-[#0874C9] flex items-center justify-center border border-[#0874C9]/10">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="font-bold">Contact via support page</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF5FC] text-[#0874C9] flex items-center justify-center border border-[#0874C9]/10">
                    <Mail className="w-4 h-4" />
                  </div>
                  <a href="mailto:support@vetsupplyexpress.com" className="font-bold hover:text-[#0874C9] transition-colors truncate">
                    support@vetsupplyexpress.com
                  </a>
                </div>
              </div>

              <Link
                to="/contact"
                className="bg-[#0874C9] hover:bg-[#F28C18] text-white text-center font-bold text-xs py-3.5 px-6 rounded-xl transition-all duration-300 shadow-sm cursor-pointer hover:-translate-y-0.5"
              >
                Contact Support Desk
              </Link>
            </div>
          </div>

          {/* Right Column: Accordion */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {faqs.map((faq, index) => {
              const isOpen = activeIndex === index;

              return (
                <div
                  key={index}
                  className="bg-white border border-[#D9E8F2] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Question Button */}
                  <button
                    onClick={() => toggleAccordion(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left text-sm md:text-base font-bold text-[#102A43] hover:text-[#0874C9] focus:outline-none focus:ring-2 focus:ring-[#0874C9]/20 transition-colors cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <span className={`p-1.5 bg-[#F7FAFC] rounded-lg text-[#627D98] border border-[#D9E8F2] transition-transform duration-300`}>
                      {isOpen ? (
                        <Minus className="w-4 h-4 stroke-[2.5px]" />
                      ) : (
                        <Plus className="w-4 h-4 stroke-[2.5px]" />
                      )}
                    </span>
                  </button>

                  {/* Answer Box */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen 
                        ? "grid-rows-[1fr] opacity-100 border-t border-[#D9E8F2]/40" 
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="p-5 md:p-6 text-xs md:text-sm text-[#627D98] leading-relaxed bg-[#F7FAFC]/20">
                        {faq.answer}
                      </p>
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
};

export default FaqSection;
