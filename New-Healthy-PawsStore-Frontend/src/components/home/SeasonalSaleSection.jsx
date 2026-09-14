import { ArrowRight, PawPrint } from "lucide-react";
import productChews from "../../assets/images/product-chews.png";
import productDogFood from "../../assets/images/product-dog-food.png";
import productDrops from "../../assets/images/product-drops.png";
import trustPets from "../../assets/images/trust-pets.png";

export default function SeasonalSaleSection() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[2px] border border-borderSoft bg-[linear-gradient(90deg,var(--color-soft-cream)_0%,var(--color-card)_45%,var(--color-cream)_100%)] shadow-card">
        <div className="relative min-h-[430px]">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-0 top-0 h-full w-[38%] bg-[radial-gradient(circle_at_14%_18%,rgba(138,160,90,0.18)_0%,transparent_28%)]" />
            <div className="absolute bottom-0 left-0 h-[86px] w-full border-t border-borderSoft bg-[linear-gradient(180deg,rgba(255,255,255,0.25),rgba(232,221,203,0.55))]" />
            <div className="absolute right-[7%] top-0 h-[210px] w-[180px] rounded-b-full bg-white/30 blur-sm" />
          </div>

          <div className="relative z-10 grid min-h-[430px] grid-cols-1 items-center md:grid-cols-[42%_58%]">
            <div className="px-8 py-12 md:pl-[165px] md:pr-8">
              <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-muted">
                Get Ready
              </p>
              <h2 className="mt-6 max-w-[340px] text-[34px] font-extrabold leading-[1.18] text-textMain sm:text-[41px]">
                The seasonal sale starts soon.
              </h2>
              <p className="mt-6 max-w-[305px] text-[17px] font-semibold leading-[1.75] text-textMain/85">
                Grab a bargain and treat your furry, feathered, or hooved friends to something special this season.
              </p>
              <a
                href="/products"
                className="mt-6 inline-flex h-[52px] items-center gap-5 rounded-full bg-primary px-8 text-[14px] font-extrabold text-cream transition-transform hover:scale-105"
              >
                Let&apos;s go
                <ArrowRight size={17} />
              </a>
            </div>

            <div className="relative min-h-[390px] self-end overflow-hidden">
              <PawPrint className="absolute right-[8%] top-14 text-secondary/25" size={42} fill="currentColor" />
              <PawPrint className="absolute right-[31%] bottom-10 text-secondary/20" size={28} fill="currentColor" />

              <div className="absolute bottom-[24px] right-[7%] h-[145px] w-[300px] rounded-b-[34px] rounded-t-[18px] border-[10px] border-[#b58a52] bg-[#c99b5a] shadow-soft">
                <div className="absolute left-[-16px] right-[-16px] top-[-28px] h-[56px] rounded-[50%] border-[10px] border-[#b58a52]" />
                <div className="absolute inset-x-6 top-7 grid grid-cols-5 gap-2 opacity-35">
                  {Array.from({ length: 15 }).map((_, index) => (
                    <span key={index} className="h-1.5 rounded-full bg-primary" />
                  ))}
                </div>
              </div>

              <img src={productDogFood} alt="Dog food bag" loading="lazy" className="absolute bottom-[105px] right-[27%] z-10 h-[130px] object-contain rotate-[-5deg]" />
              <img src={productChews} alt="Pet treats" loading="lazy" className="absolute bottom-[96px] right-[12%] z-10 h-[120px] object-contain rotate-[7deg]" />
              <img src={productDrops} alt="Pet care drops" loading="lazy" className="absolute bottom-[112px] right-[1%] z-10 h-[118px] object-contain rotate-[9deg]" />
              <img src={trustPets} alt="Dog and cat with pet sale gifts" loading="lazy" className="absolute bottom-[18px] left-[3%] z-20 h-[250px] object-contain" />

              <div className="absolute bottom-0 left-0 right-0 h-[26px] bg-[linear-gradient(180deg,transparent,rgba(36,49,47,0.08))]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
