import { Navigation, PawPrint } from "lucide-react";
import storeMap from "../../assets/images/contact/store-map.png";

export default function StoreMap() {
  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-[16px] border border-borderSoft bg-iconBg">
      <img
        src={storeMap}
        alt="Map showing the HealthyPawsStore location on Paw Street"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute left-1/2 top-[34%] grid size-12 -translate-x-1/2 place-items-center rounded-full bg-secondaryDark text-white shadow-card">
        <PawPrint size={23} fill="currentColor" />
      </div>
      <div className="absolute inset-x-4 bottom-4 rounded-[12px] bg-white/95 px-5 py-4 text-center shadow-contact backdrop-blur">
        <h3 className="font-display text-[22px] font-extrabold leading-none text-textMain">
          Visit Our Store
        </h3>
        <p className="mt-2 text-[13px] font-semibold text-muted">
          We&apos;d love to meet you!
        </p>
        <a
          href="https://www.google.com/maps/search/?api=1&query=123%20Paw%20Street%20Pet%20City"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-10 min-w-[170px] items-center justify-center gap-2 rounded-lg bg-secondaryDark px-5 text-[14px] font-extrabold text-white transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Navigation size={16} fill="currentColor" />
          Get Directions
        </a>
      </div>
    </div>
  );
}
