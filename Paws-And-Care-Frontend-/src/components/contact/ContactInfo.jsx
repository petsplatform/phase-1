import { Mail, Phone, Clock, MapPin } from 'lucide-react';
import { contactInfo } from '../../data/contactData';

const FacebookIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const socialIconMap = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  Twitter: TwitterIcon,
};

export default function ContactInfo() {
  return (
    <div className="bg-brand-peach/10 rounded-3xl border border-brand-border/60 p-6 sm:p-8 flex flex-col gap-6 text-left">
      <div>
        <h3 className="font-heading font-black text-xl text-brand-text mb-2">
          Contact Information
        </h3>
        <p className="font-sans text-xs sm:text-sm text-brand-muted">
          Our support staff is ready to help you ensure your pet gets the care they deserve.
        </p>
      </div>

      <div className="space-y-5">
        {/* Email */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
            <Mail size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-sans font-bold text-xs uppercase tracking-wide text-brand-muted/80 leading-none mb-1.5">
              Email Address
            </p>
            <a
              href={`mailto:${contactInfo.email}`}
              className="font-sans font-bold text-sm sm:text-base text-brand-text hover:text-brand-teal transition-colors block break-all"
            >
              {contactInfo.email}
            </a>
            <span className="text-[11px] font-sans text-brand-muted/70 block mt-0.5">
              {contactInfo.availability}
            </span>
          </div>
        </div>

        {/* Phone */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
            <Phone size={20} />
          </div>
          <div>
            <p className="font-sans font-bold text-xs uppercase tracking-wide text-brand-muted/80 leading-none mb-1.5">
              Phone Helpline
            </p>
            <a
              href={`tel:${contactInfo.phone.replace(/[^+\d]/g, '')}`}
              className="font-sans font-bold text-sm sm:text-base text-brand-text hover:text-brand-teal transition-colors block"
            >
              {contactInfo.phone}
            </a>
            <span className="text-[11px] font-sans text-brand-muted/70 block mt-0.5">
              Toll-free across United States
            </span>
          </div>
        </div>

        {/* Hours */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="font-sans font-bold text-xs uppercase tracking-wide text-brand-muted/80 leading-none mb-1.5">
              Business Hours
            </p>
            <div className="space-y-1">
              {contactInfo.hours.map((h, i) => (
                <p key={i} className="font-sans text-xs sm:text-sm text-brand-text">
                  <strong className="text-brand-muted font-bold">{h.days}:</strong> {h.time}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <p className="font-sans font-bold text-xs uppercase tracking-wide text-brand-muted/80 leading-none mb-1.5">
              Corporate Office
            </p>
            <p className="font-sans text-xs sm:text-sm text-brand-text leading-relaxed">
              {contactInfo.address}
            </p>
          </div>
        </div>
      </div>

      {/* Social Media Linkage */}
      <div className="border-t border-brand-border/40 pt-5 mt-2">
        <p className="font-sans font-bold text-xs text-brand-muted mb-3 uppercase tracking-wider">
          Follow Our Pack
        </p>
        <div className="flex gap-3">
          {contactInfo.socials.map((s) => {
            const IconComponent = socialIconMap[s.iconName] || (() => null);
            return (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white border border-brand-border/80 text-brand-muted hover:text-brand-coral hover:border-brand-coral/40 hover:shadow-lg hover:shadow-brand-coral/5 flex items-center justify-center transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95"
                title={s.name}
              >
                <IconComponent className="w-4.5 h-4.5" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
