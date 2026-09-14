import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Fast & Free Shipping", text: "On orders over $49" },
  { icon: RotateCcw, title: "30-Day Returns", text: "Easy returns & refunds" },
  { icon: ShieldCheck, title: "Secure Payments", text: "100% secure checkout" },
  { icon: Headphones, title: "24/7 Support", text: "We're here to help" },
];

export default function AccountBenefits() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-5 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {benefits.map(({ icon: Icon, title, text }) => (
          <article key={title} className="flex items-center gap-4 rounded-[14px] bg-sageLight px-6 py-4">
            <span className="grid size-11 place-items-center rounded-full bg-white text-secondaryDark">
              <Icon size={24} />
            </span>
            <span>
              <strong className="block text-[13px] font-extrabold text-textMain">{title}</strong>
              <span className="text-[12px] font-semibold text-muted">{text}</span>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
