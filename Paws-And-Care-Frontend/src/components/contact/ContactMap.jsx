import { MapPin, Navigation, Compass } from 'lucide-react';
import { contactInfo } from '../../data/contactData';

export default function ContactMap() {
  // Let's use a nice static embedded maps query for Springfield, Oregon (corresponding to contactInfo.address)
  const mapEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11463.856983050186!2d-123.01897457788484!3d44.04789524025178!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54c11400d3d52d9b%3A0xe7f9a6ad6e6dc81c!2sEvergreen%20Terrace%2C%20Springfield%2C%20OR!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus";

  return (
    <section className="py-12 md:py-16 max-w-6xl mx-auto px-4">
      <div className="bg-white rounded-3xl border border-brand-border/60 overflow-hidden shadow-lg p-3 sm:p-4 flex flex-col lg:flex-row gap-6">
        {/* Map Container */}
        <div className="w-full lg:w-2/3 h-72 sm:h-96 rounded-2xl overflow-hidden relative border border-brand-border/40 shrink-0">
          <iframe
            title="PawsAndCare Head Office Location Map"
            src={mapEmbedUrl}
            className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          
          {/* Decorative Compass badge */}
          <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-brand-teal pointer-events-none">
            <Compass size={18} className="animate-spin" style={{ animationDuration: '20s' }} />
          </div>
        </div>

        {/* Directions & Details Column */}
        <div className="flex-grow p-4 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-coral/10 border border-brand-coral/20">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-coral">
                Headquarters
              </span>
            </div>
            
            <h3 className="font-heading font-black text-2xl text-brand-text leading-tight">
              Visit PawsAndCare
            </h3>
            
            <p className="font-sans text-xs sm:text-sm text-brand-muted leading-relaxed">
              Drop by our campus to check out our premium product lab, meet our veterinary consults, or pick up your auto-shipped items locally.
            </p>

            <div className="pt-3 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-brand-teal shrink-0 mt-0.5" />
                <div className="font-sans text-xs sm:text-sm text-brand-text">
                  <p className="font-bold text-brand-text">PawsAndCare Corporate Center</p>
                  <p className="text-brand-muted">{contactInfo.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-border/40 mt-6 lg:mt-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-brand-text text-white hover:bg-brand-muted font-sans font-bold text-xs sm:text-sm transition-all duration-300 transform active:scale-95 w-full sm:w-auto justify-center"
            >
              <Navigation size={14} className="fill-current" />
              Get Driving Directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
