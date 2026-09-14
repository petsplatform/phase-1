import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, RotateCcw, MessageSquare } from 'lucide-react';

export default function PopularHelp() {
  const cards = [
    {
      icon: ClipboardList,
      title: 'Track My Order',
      description: 'Check the real-time shipping status and estimated delivery date of your pet packages.',
      linkText: 'Go to Orders',
      to: '/account/orders',
      colorClass: 'text-brand-teal bg-brand-teal/5 border-brand-teal/20'
    },
    {
      icon: RotateCcw,
      title: 'Start a Return',
      description: 'Not satisfied with your pet accessories? Initiate a return within 30 days of purchase.',
      linkText: 'Contact Returns',
      to: '/contact',
      colorClass: 'text-brand-coral bg-brand-coral/5 border-brand-coral/20'
    },
    {
      icon: MessageSquare,
      title: 'Contact Support',
      description: 'Reach out to our veterinary and customer support champions via message or call.',
      linkText: 'Get in Touch',
      to: '/contact',
      colorClass: 'text-brand-golden bg-brand-golden/5 border-brand-golden/20'
    }
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 py-12 select-none">
      <div className="text-center space-y-2 mb-8">
        <span className="text-[10px] font-heading font-black text-brand-teal uppercase tracking-wider">
          Quick Actions
        </span>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-brand-text">
          Popular Help Topics
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <div 
              key={idx}
              className={`bg-white border rounded-3xl p-6 flex flex-col justify-between items-start text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
            >
              <div className="space-y-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.colorClass} shrink-0`}>
                  <IconComponent size={20} />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-heading font-black text-brand-text text-base sm:text-lg">
                    {card.title}
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-brand-muted leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 w-full">
                <Link
                  to={card.to}
                  className="inline-flex items-center text-xs font-heading font-black text-brand-teal hover:text-brand-deep-teal transition-colors tracking-wide uppercase"
                >
                  <span>{card.linkText}</span>
                  <span className="ml-1">→</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
