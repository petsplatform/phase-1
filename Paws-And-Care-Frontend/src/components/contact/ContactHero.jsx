import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-cream to-brand-peach/40 py-12 md:py-20 border-b border-brand-border/40">
      {/* Absolute Decorative SVG Paw Prints and Hearts */}
      <div className="absolute top-1/4 left-10 text-brand-teal/5 pointer-events-none transform -rotate-12 transition-transform hover:scale-110 duration-700 hidden md:block">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-8.5-7.5C8.3 3.9 9.3 4.8 9.3 6s-1 2.2-2.2 2.2S4.9 7.2 4.9 6s1-2.1 2.2-2.5zm9 0c1.2.4 2.2 1.3 2.2 2.5s-1 2.2-2.2 2.2-2.2-1-2.2-2.2 1-2.1 2.2-2.5z" />
        </svg>
      </div>
      <div className="absolute bottom-8 right-16 text-brand-coral/5 pointer-events-none transform rotate-45 transition-transform hover:scale-110 duration-700 hidden md:block">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
        {/* Breadcrumb */}
        <nav className="mb-6 flex justify-center text-xs tracking-wide uppercase font-sans font-semibold text-brand-muted/80">
          <Link to="/" className="hover:text-brand-teal transition-colors">Home</Link>
          <span className="mx-2 text-brand-border font-light">/</span>
          <span className="text-brand-text">Contact</span>
        </nav>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 mb-6 transition-all duration-300 hover:bg-brand-teal/15">
          <Sparkles size={14} className="text-brand-teal animate-pulse" />
          <span className="text-xs font-sans font-bold uppercase tracking-wider text-brand-teal">
            We’re Here to Help
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl text-brand-text mb-6 leading-none max-w-3xl mx-auto">
          Let’s Make Pet Care <br className="sm:hidden" />
          <span className="text-brand-teal relative inline-block">
            Easier Together
            <svg className="absolute left-0 -bottom-2 w-full h-2 text-brand-coral/30" viewBox="0 0 100 10" preserveAspectRatio="none" fill="currentColor">
              <path d="M0,7 C30,2 70,2 100,7 L100,10 L0,10 Z" />
            </svg>
          </span>
        </h1>

        {/* Short Description */}
        <p className="font-sans text-base sm:text-lg text-brand-muted max-w-xl mx-auto leading-relaxed">
          Have a question about our premium products, deliveries, or need vet guidance? Reach out and we’ll get back to you faster than a tail wag!
        </p>
      </div>
    </section>
  );
}
