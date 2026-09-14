import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FAQ_DATA } from "../utils/FAQ/faq";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState(1); // Default open first question

  // Dynamic filter for FAQ list based on search query
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      return (
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [searchQuery]);

  // Handle accordion toggle
  const toggleFaq = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <main className="bg-white min-h-screen pb-24 font-sans">
      {/* Breadcrumbs */}
      <div className="page-shell px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8a8f88]">
          <Link to="/" className="transition hover:text-secondary">
            Home
          </Link>
          <span>/</span>
          <span className="text-secondary font-bold">FAQs</span>
        </nav>
      </div>

      {/* Hero & Search Header */}
      <section className="page-shell px-4 py-8 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-on-background sm:text-4xl lg:text-5xl tracking-tight leading-tight">
          How Can We Help <span className="text-secondary">You Today?</span>
        </h1>
        <p className="mt-3 text-sm text-charcoal-text max-w-xl mx-auto leading-relaxed">
          Search our knowledge base for quick answers about shipping, returns,
          auto-ship plans, or general inquiries.
        </p>
      </section>

      {/* FAQ Accordion List (Full Width, Centered Layout) */}
      <section className="page-shell px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {filteredFaqs.length === 0 ? (
            // Empty Search State
            <div className="bg-white rounded-[32px] border border-outline p-12 text-center shadow-[0_20px_45px_rgba(28,40,33,0.03)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-soft text-secondary mb-5">
                <HelpCircle size={24} />
              </div>
              <h3 className="text-lg font-bold text-on-background">
                No matching FAQs found
              </h3>
              <p className="mt-2 text-xs text-charcoal-text max-w-sm mx-auto leading-relaxed">
                We couldn't find any questions matching "{searchQuery}". Try
                refining your search query or contact customer support directly.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-secondary text-secondary text-xs font-bold hover:bg-secondary hover:text-white transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Reset Search
              </button>
            </div>
          ) : (
            // Accordion List
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white  rounded-xl border border-outline overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(28,40,33,0.03)]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between text-left p-5 text-sm font-bold text-on-background hover:text-secondary transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        size={16}
                        className={`text-charcoal-text transition-transform duration-300 shrink-0 ml-4 ${
                          isOpen ? "transform rotate-180 text-secondary" : ""
                        }`}
                      />
                    </button>

                    {/* Collapsible content wrapper */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isOpen
                          ? "max-h-[220px] border-t border-outline"
                          : "max-h-0"
                      }`}
                    >
                      <div className="p-5 text-sm leading-relaxed text-[#697168]">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
