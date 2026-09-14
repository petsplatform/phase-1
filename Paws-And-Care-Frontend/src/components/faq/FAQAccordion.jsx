import React, { useState, useEffect } from 'react';
import FAQItem from './FAQItem';
import { faqData } from '../../data/faqData';
import { HelpCircle } from 'lucide-react';

export default function FAQAccordion({ searchQuery, activeCategory }) {
  const [openId, setOpenId] = useState(null);

  // Filter items dynamically based on search query and category
  const filteredItems = faqData.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Reset expanded item when filtering changes
  useEffect(() => {
    setOpenId(null);
  }, [searchQuery, activeCategory]);

  const handleToggle = (id) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 select-none">
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => handleToggle(item.id)}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      ) : (
        /* "No questions found" state */
        <div className="text-center py-16 px-4 bg-white border border-brand-border/60 rounded-3xl space-y-4">
          <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-coral mx-auto border border-brand-peach">
            <HelpCircle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="font-heading font-black text-brand-text text-lg sm:text-xl">
              No Questions Found
            </h4>
            <p className="font-sans text-xs sm:text-sm text-brand-muted max-w-sm mx-auto leading-relaxed">
              We couldn't find any questions matching "{searchQuery}" in this category. Try typing something else or browse another tab.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
