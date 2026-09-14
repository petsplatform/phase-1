import { useState } from "react";
import { Sparkles, Check, Tag, ShieldCheck, Copy } from "lucide-react";
import frontlineImg from "../../assets/Home/Products/frontline.png";
import apoquelImg from "../../assets/Home/Products/apoquel.png";

export default function ProductHero() {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const offers = [
    {
      code: "PETRX20",
      label: "20% Off First Order",
      tagline: "Vet refills & meds",
      btnBg: "bg-emerald-50 text-dark-green border-emerald-200/60 hover:bg-emerald-100",
      activeBg: "bg-emerald-500 text-white border-emerald-500",
    },
    {
      code: "AUTOSAVE",
      label: "15% Off Auto-Ship",
      tagline: "Repeat deliveries",
      btnBg: "bg-blue-50 text-medical-teal border-blue-200/60 hover:bg-blue-100",
      activeBg: "bg-medical-teal text-white border-medical-teal",
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-br from-[#eaf8ea] via-[#eaf5f8] to-white border-b border-[#e5e9ec]">
      {/* ── Background Glow Accents ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full bg-primary-green/10 blur-[120px]" />
        <div className="absolute -bottom-20 right-1/4 h-[400px] w-[400px] rounded-full bg-sky-blue/30 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          
          {/* ──── LEFT SIDE: Text and Offers (Light Theme) ──── */}
          <div className="flex flex-col justify-center">
            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-5 self-start">
              <div className="flex items-center gap-1.5 rounded-full border border-primary-green/20 bg-emerald-500/10 px-3.5 py-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-dark-green animate-pulse" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-dark-green">
                  Exclusive Pharmacy Deals
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-deep-navy sm:text-[3.2rem] lg:text-[3.8rem]">
              Refill Your Pet's Meds, <br />
              <span className="bg-linear-to-r from-primary-green via-medical-teal to-dark-green bg-clip-text text-transparent">
                For Much Less.
              </span>
            </h1>

            {/* Subtext */}
            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-deep-navy/70">
              Save big on premium, vet-approved prescription refills and wellness supplements. Fast express delivery directly from our licensed pharmacy to your home.
            </p>

            {/* Coupons section */}
            {/* <div className="mt-8 flex flex-col gap-4">
              <h3 className="text-xs font-black tracking-widest uppercase text-deep-navy/45">
                Click Coupon Code to Copy:
              </h3>

              <div className="flex flex-wrap gap-4 mt-1">
                {offers.map((offer) => {
                  const isCopied = copiedCode === offer.code;
                  return (
                    <button
                      key={offer.code}
                      onClick={() => handleCopy(offer.code)}
                      className={`group relative flex items-center justify-between gap-4 p-4.5 rounded-[1.5rem] border text-left transition-all duration-300 hover:-translate-y-0.5 cursor-pointer max-w-xs w-full sm:w-[260px] bg-white shadow-soft ${
                        isCopied
                          ? "border-primary-green ring-2 ring-primary-green/20"
                          : "border-slate-100 hover:border-primary-green"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-navy/40">
                          {offer.tagline}
                        </span>
                        <span className="text-sm font-black text-deep-navy mt-0.5">
                          {offer.label}
                        </span>
                      </div>

                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold border transition-all duration-300 ${
                        isCopied
                          ? offer.activeBg
                          : offer.btnBg
                      }`}>
                        <span>{offer.code}</span>
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div> */}

            {/* Trust checkmarks */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center gap-6 text-xs text-deep-navy/60 font-bold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-primary-green" />
                <span>FDA / EPA Approved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4.5 h-4.5 text-primary-green" />
                <span>Licensed US Pharmacy</span>
              </div>
            </div>

          </div>

          {/* ──── RIGHT SIDE: Product Packaging Showcase ──── */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none flex items-center justify-center h-[350px] lg:h-[450px]">
            
            {/* Outer Circular Soft Backdrop */}
            <div className="absolute w-[280px] h-[280px] lg:w-[350px] lg:h-[350px] bg-white rounded-full shadow-[0_30px_60px_rgba(15,45,82,0.06)] border border-slate-100/50 flex items-center justify-center -z-10 animate-pulse" />

            {/* Frontline Product card */}
            <div className="absolute top-4 left-4 w-[55%] aspect-square rounded-[2rem] bg-white border border-slate-100 p-4.5 shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-1 hover:scale-[1.03] hover:z-20 group cursor-pointer flex flex-col items-center justify-center">
              <div className="h-[75%] w-full flex items-center justify-center bg-slate-50/50 rounded-2xl p-2.5">
                <img
                  src={frontlineImg}
                  alt="Frontline Plus"
                  className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="text-[10px] font-extrabold text-primary-green uppercase tracking-widest mt-3.5 leading-none">Flea & Tick</span>
              <span className="text-xs font-black text-deep-navy mt-1">Frontline Plus</span>
            </div>

            {/* Apoquel Product card */}
            <div className="absolute bottom-6 right-4 w-[50%] aspect-square rounded-[2rem] bg-white border border-slate-100 p-4.5 shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-500 hover:-translate-y-1 hover:scale-[1.03] hover:z-20 group cursor-pointer flex flex-col items-center justify-center">
              <div className="h-[75%] w-full flex items-center justify-center bg-slate-50/50 rounded-2xl p-2.5">
                <img
                  src={apoquelImg}
                  alt="Apoquel Refills"
                  className="max-h-full max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="text-[10px] font-extrabold text-medical-teal uppercase tracking-widest mt-3.5 leading-none">Skin & Allergy</span>
              <span className="text-xs font-black text-deep-navy mt-1">Apoquel Refill</span>
            </div>

          

          </div>

        </div>
      </div>
    </section>
  );
}
