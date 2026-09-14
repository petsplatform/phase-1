import React from 'react';
import { faqCategories } from '../../data/faqData';

export default function FAQCategories({ activeCategory, setActiveCategory }) {
  return (
    <div className="w-full select-none">
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto px-4 py-6">
        {faqCategories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-5 py-2.5 rounded-full border text-xs sm:text-sm font-heading font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-brand-teal text-white border-brand-teal shadow-xs'
                  : 'bg-white border-brand-border text-brand-muted hover:border-brand-teal hover:text-brand-teal hover:bg-brand-bg/40'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
