import React from 'react';
import { Plus, Minus } from 'lucide-react';

export default function FAQItem({ item, isOpen, onToggle, searchQuery }) {
  
  // Text highlighting helper
  const getHighlightedText = (text, highlight) => {
    if (!highlight || !highlight.trim()) {
      return text;
    }
    // Escape regex characters
    const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-brand-golden/30 text-brand-text rounded-[2px] px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="bg-white border border-brand-border/80 rounded-2xl shadow-xs transition-all duration-200 overflow-hidden">
      
      {/* Accordion header button */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${item.id}`}
        className="w-full flex items-center justify-between gap-4 p-5 text-left font-heading font-black text-brand-text text-sm sm:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded-2xl cursor-pointer hover:text-brand-teal transition-colors"
      >
        <span>{getHighlightedText(item.question, searchQuery)}</span>
        <span className="shrink-0 text-brand-muted">
          {isOpen ? (
            <Minus size={18} className="text-brand-coral" />
          ) : (
            <Plus size={18} className="text-brand-teal" />
          )}
        </span>
      </button>

      {/* Accordion answer content */}
      <div
        id={`faq-answer-${item.id}`}
        role="region"
        aria-labelledby={`faq-header-${item.id}`}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-5 pb-5 pt-1 font-sans text-xs sm:text-sm text-brand-muted leading-relaxed border-t border-brand-border/40">
          <p>{getHighlightedText(item.answer, searchQuery)}</p>
        </div>
      </div>

    </div>
  );
}
