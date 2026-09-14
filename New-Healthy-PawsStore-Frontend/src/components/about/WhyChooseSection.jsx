import { Headphones, PackageCheck, RefreshCw, ShieldCheck } from "lucide-react";
import productChews from "../../assets/images/product-chews.png";

const reasons = [
  { image: productChews, title: "Premium Quality Products", text: "Carefully selected products made with high-quality, natural ingredients." },
  { icon: Headphones, title: "Expert Support", text: "Our team is always here to guide you in choosing the best for your pet." },
  { icon: PackageCheck, title: "Fast & Reliable Delivery", text: "Quick processing and safe delivery right to your doorstep." },
  { icon: RefreshCw, title: "Hassle Free Returns", text: "Not satisfied? Easy returns and refunds, no questions asked." },
];

export default function WhyChooseSection() {
  return (
    <section className="bg-white px-6 py-9 lg:px-[76px]">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="mb-7 text-center text-[24px] font-extrabold text-textMain">
          Why Choose <span className="text-secondary">HealthyPawsStore?</span>
        </h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, image, title, text }) => (
            <article key={title} className="min-h-[230px] rounded-[9px] border border-borderSoft bg-card px-8 py-8 text-center shadow-card">
              {image ? (
                <img src={image} alt="" className="mx-auto h-16 object-contain" loading="lazy" />
              ) : (
                <Icon className="mx-auto text-secondary" size={62} strokeWidth={1.5} />
              )}
              <h3 className="mt-7 text-[15px] font-extrabold text-textMain">{title}</h3>
              <p className="mx-auto mt-4 max-w-[205px] text-[12px] font-semibold leading-[1.7] text-textMain">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
