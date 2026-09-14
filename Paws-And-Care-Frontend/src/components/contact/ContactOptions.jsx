import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { contactOptions } from '../../data/contactData';

export default function ContactOptions() {
  return (
    <section className="py-12 md:py-16 max-w-6xl mx-auto px-4">
      <div className="text-center mb-10 md:mb-12">
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-brand-text mb-3">
          Choose How to Connect
        </h2>
        <p className="font-sans text-sm sm:text-base text-brand-muted max-w-md mx-auto">
          We’ve streamlined our support channels to make sure you reach the right expert immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {contactOptions.map((opt) => {
          const IconComponent = opt.icon;
          
          // Colors mappings
          const colorStyles = {
            teal: {
              border: 'hover:border-brand-teal/40',
              shadow: 'hover:shadow-brand-teal/5',
              iconBg: 'bg-brand-teal/15 text-brand-teal',
              buttonBg: 'bg-brand-teal text-white hover:bg-brand-deep-teal',
              badgeBg: 'bg-brand-teal/10 text-brand-teal border-brand-teal/20',
            },
            coral: {
              border: 'hover:border-brand-coral/40',
              shadow: 'hover:shadow-brand-coral/5',
              iconBg: 'bg-brand-coral/15 text-brand-coral',
              buttonBg: 'bg-brand-coral text-white hover:bg-brand-coral-dark',
              badgeBg: 'bg-brand-coral/10 text-brand-coral border-brand-coral/20',
            },
            golden: {
              border: 'hover:border-brand-golden/40',
              shadow: 'hover:shadow-brand-golden/5',
              iconBg: 'bg-brand-golden/15 text-brand-golden',
              buttonBg: 'bg-brand-golden text-white hover:bg-brand-accent/90',
              badgeBg: 'bg-brand-golden/10 text-brand-golden border-brand-golden/20',
            }
          }[opt.color] || {
            border: 'hover:border-brand-teal/40',
            shadow: 'hover:shadow-brand-teal/5',
            iconBg: 'bg-brand-teal/15 text-brand-teal',
            buttonBg: 'bg-brand-teal text-white hover:bg-brand-deep-teal',
            badgeBg: 'bg-brand-teal/10 text-brand-teal border-brand-teal/20',
          };

          const isExternal = opt.actionLink.startsWith('mailto:') || opt.actionLink.startsWith('http');

          const ActionElement = isExternal ? (
            <a
              href={opt.actionLink}
              className={`w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-95 ${colorStyles.buttonBg}`}
            >
              {opt.actionText}
              <ArrowRight size={16} />
            </a>
          ) : (
            <Link
              to={opt.actionLink}
              className={`w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-sans font-bold text-sm tracking-wide transition-all duration-300 transform active:scale-95 ${colorStyles.buttonBg}`}
            >
              {opt.actionText}
              <ArrowRight size={16} />
            </Link>
          );

          return (
            <div
              key={opt.id}
              className={`flex flex-col h-full bg-white rounded-3xl border border-brand-border/60 p-6 sm:p-8 transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-2xl ${colorStyles.border} ${colorStyles.shadow}`}
            >
              {/* Icon Container */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shrink-0 ${colorStyles.iconBg}`}>
                <IconComponent size={24} className="stroke-[2.2]" />
              </div>

              {/* Title & Description */}
              <h3 className="font-heading font-black text-xl text-brand-text mb-3 leading-tight">
                {opt.title}
              </h3>
              
              <p className="font-sans text-sm text-brand-muted leading-relaxed mb-6 flex-grow">
                {opt.description}
              </p>

              {/* Response Time Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-sans font-bold uppercase tracking-wider mb-5 self-start ${colorStyles.badgeBg}`}>
                <Clock size={12} className="stroke-[2.2]" />
                {opt.responseTime}
              </div>

              {/* Button */}
              <div className="mt-auto">
                {ActionElement}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
