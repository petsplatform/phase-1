import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  HelpCircle,
  MessageSquare,
  Phone,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { faqQuestions } from "../utils/FAQ/faq";

export default function Faq() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);

  // Filter FAQs based on active category and search query
  const filteredFAQs = useMemo(() => {
    return faqQuestions.filter((faq) => {
      const matchesCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div
      className="min-h-screen text-brand-purple pb-20 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFF7EF 0%, #FAF6FE 50%, #FFFDFB 100%)",
      }}
    >
      {/* Decorative background vectors/orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-brand-peach/10 blur-[100px] sm:blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-15%] w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] rounded-full bg-brand-purple/5 blur-[120px] sm:blur-[160px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-8 text-center animate-in fade-in duration-500">
        <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] flex items-center gap-1.5">
          <Link to="/" className="hover:text-brand-purple transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />
          <Link to="/faq" className="hover:text-brand-purple transition-colors">
            FAQ
          </Link>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-brand-purple leading-[1.1] mb-6">
          How Can We Help <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4B004B] via-[#8A4F2A] to-[#FF9E8A]">
            Your Pet Today?
          </span>
        </h1>
        <p className="max-w-xl mx-auto text-sm sm:text-base font-medium text-brand-brown/80 leading-relaxed">
          Find fast answers about our vet-approved products, shipping and
          returns, filling prescription orders, and auto-ship club details.
        </p>
      </section>

      {/* Main Content Area */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8">
        {/* Accordions */}
        <div className="space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className={`bg-white border border-brand-purple/10 rounded-[20px] transition-all duration-300 ${
                    isOpen
                      ? "shadow-[0_15px_30px_rgba(75,0,75,0.03)] border-brand-purple/20"
                      : "hover:border-brand-purple/15 hover:-translate-y-[1px]"
                  }`}
                >
                  <button
                    onClick={() => handleToggle(idx)}
                    className="w-full flex items-center justify-between p-5 sm:p-6 cursor-pointer text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display font-bold text-sm sm:text-base text-brand-purple pr-4 transition-colors">
                      {faq.question}
                    </span>
                    <div
                      className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all duration-300 ${
                        isOpen
                          ? "bg-brand-peach rotate-45"
                          : "bg-brand-purple hover:scale-105"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </div>
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen
                        ? "max-h-[300px] opacity-100 pb-6 px-5 sm:px-6"
                        : "max-h-0 opacity-0 px-5 sm:px-6 pointer-events-none"
                    }`}
                  >
                    <div className="border-t border-brand-purple/5 pt-4.5 text-xs sm:text-[14px] text-brand-brown/80 leading-relaxed font-semibold">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white/50 border border-brand-purple/5 rounded-[24px] p-12 text-center shadow-inner">
              <HelpCircle className="w-12 h-12 text-brand-purple/20 mx-auto mb-4" />
              <h3 className="font-display font-extrabold text-brand-purple text-lg mb-1">
                No Results Found
              </h3>
              <p className="text-xs sm:text-sm text-brand-brown/70 font-semibold max-w-sm mx-auto">
                We couldn't find any FAQs matching "{searchQuery}". Try using
                different terms or check out another category.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="mt-4 text-xs font-bold text-brand-peach hover:underline cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          )}
        </div>

        {/* Contact CTA Section */}
        <div className="mt-16 bg-white/70 backdrop-blur-md border border-brand-purple/10 rounded-[24px] p-8 sm:p-10 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-peach/10 blur-xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-brand-purple/5 blur-xl pointer-events-none"></div>

          <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-purple mb-3">
            Still Have Questions?
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-brand-brown/75 max-w-md mx-auto mb-6 leading-relaxed">
            Can't find the answer you are looking for? Our certified veterinary
            advisors and support team are here for you 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              to="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple/95 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all hover:scale-102 hover:shadow-md cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Us a Message</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href="tel:1-800-1000"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-brand-purple/15 text-brand-purple hover:bg-brand-purple/5 font-bold text-xs px-6 py-3.5 rounded-xl transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Call 1-800-1000</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
