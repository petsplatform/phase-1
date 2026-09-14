import { Mail, PawPrint } from "lucide-react";
import dog from "../../assets/images/newsletter-dog.png";

export default function Newsletter() {
  return (
    <section className="bg-white px-6 py-8 lg:px-[76px]">
      <div className="relative mx-auto flex min-h-[118px] max-w-[1320px] items-center gap-6 overflow-hidden rounded-[12px] bg-secondaryDark px-8 text-white shadow-card">
        <img src={dog} alt="Happy dog" className="absolute bottom-0 left-4 hidden h-[116px] md:block" loading="lazy" />
        <Mail size={42} className="hidden shrink-0 md:ml-[145px] md:block" strokeWidth={1.8} />
        <div className="relative z-10 min-w-[310px]">
          <h2 className="text-[29px] font-extrabold leading-none">Join Our Paw-some Family!</h2>
          <p className="mt-3 text-[14px] font-semibold">Get exclusive offers, pet care tips & updates.</p>
        </div>
        <form className="relative z-10 ml-auto hidden h-12 max-w-[480px] flex-1 overflow-hidden rounded-[8px] bg-white md:flex">
          <input type="email" className="min-w-0 flex-1 px-6 text-[13px] text-textMain outline-none placeholder:text-muted" placeholder="Enter your email address" />
          <button type="button" className="inline-flex w-[142px] items-center justify-center gap-2 bg-orange text-[13px] font-extrabold text-white">
            <PawPrint size={14} fill="currentColor" />
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
