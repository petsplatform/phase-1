import React from "react";
import { Link } from "react-router-dom";
import { Search, Heart } from "lucide-react";

export default function FAQHero({ searchQuery, setSearchQuery }) {
  return (
    <section className="relative overflow-hidden bg-brand-peach/20 border-b border-brand-border/60 py-16 sm:py-20 select-none">
      {/* Soft paw and heart decorative elements */}
      <div className="absolute top-10 left-10 text-brand-peach/30 pointer-events-none transform -rotate-12 animate-pulse hidden md:block">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-4.5-3c.83 0 1.5-.67 1.5-1.5S8.33 8 7.5 8 6 8.67 6 9.5s.67 1.5 1.5 1.5zm9 0c.83 0 1.5-.67 1.5-1.5S17.33 8 16.5 8s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-4.5 5.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 text-brand-peach/40 pointer-events-none transform rotate-12 hidden md:block">
        <Heart size={48} className="fill-current" />
      </div>

      <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
        {/* Breadcrumb: Home / FAQ */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center justify-center gap-1.5 text-xs text-brand-muted mb-2 font-sans"
        >
          <Link
            to="/"
            className="hover:text-brand-coral transition-colors font-medium"
          >
            Home
          </Link>
          <span className="text-brand-border">/</span>
          <span className="text-brand-text font-semibold">FAQ</span>
        </nav>

        {/* Badge: “Help Center” */}
        <span className="inline-block bg-brand-teal/10 text-brand-teal font-heading font-black text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">
          Help Center
        </span>

        {/* Heading: “Answers for Happy Pet Parents” */}
        <h1 className="font-heading font-black text-3xl sm:text-5xl text-brand-text leading-tight tracking-tight">
          Answers for Happy Pet Parents
        </h1>

        {/* Short description */}
        <p className="font-sans text-sm sm:text-base text-brand-muted max-w-xl mx-auto leading-relaxed">
          Need help with your shipping timeline, return inquiries, size
          measurements, or pet care recommendations? Search below or select a
          category.
        </p>
      </div>
    </section>
  );
}
