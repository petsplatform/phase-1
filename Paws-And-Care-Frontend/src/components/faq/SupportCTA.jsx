import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Clock, ArrowRight } from 'lucide-react';

export default function SupportCTA() {
  return (
    <section className="max-w-4xl mx-auto px-4 pb-16 pt-8 select-none">
      <div className="bg-brand-teal/5 border border-brand-teal/10 rounded-[2.5rem] p-8 sm:p-10 text-center space-y-6">
        
        <div className="space-y-2">
          <span className="text-[10px] font-heading font-black text-brand-teal uppercase tracking-wider">
            Get in Touch
          </span>
          <h2 className="font-heading font-black text-2xl sm:text-4xl text-brand-text">
            Still Need Help?
          </h2>
          <p className="font-sans text-xs sm:text-sm text-brand-muted max-w-md mx-auto leading-relaxed">
            If you didn't find the answers you were looking for, our friendly support team is always ready to guide you and your pet.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5 select-none pt-2">
          <a
            href="mailto:support@pawsandcare.com"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-7 py-3 font-heading font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Mail size={14} />
            <span>Email Support</span>
          </a>

          <Link
            to="/contact"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border-2 border-brand-teal text-brand-teal hover:bg-brand-teal/5 rounded-full px-7 py-3 font-heading font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            <span>Go to Contact Page</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-brand-muted font-sans pt-2 border-t border-brand-border/40 max-w-sm mx-auto">
          <Clock size={13} className="text-brand-muted/70" />
          <span><strong>Business Hours:</strong> Monday – Friday, 9:00 AM – 6:00 PM EST</span>
        </div>

      </div>
    </section>
  );
}
