import { Headphones, Leaf, LockKeyhole, PackageCheck, RefreshCw, ShieldCheck } from "lucide-react";

const features = [
  { icon: Leaf, title: "100% Natural", sub: "Ingredients" },
  { icon: ShieldCheck, title: "Vet Approved", sub: "Products" },
  { icon: PackageCheck, title: "Fast & Free", sub: "Shipping" },
  { icon: RefreshCw, title: "Easy Returns", sub: "& Refunds" },
  { icon: LockKeyhole, title: "Secure", sub: "Payments" },
  { icon: Headphones, title: "24/7 Customer", sub: "Support" },
];

export default function TrustBar() {
  return (
    <section className="mt-8 border-t border-borderSoft bg-white">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 py-7 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {features.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center justify-start gap-3 sm:justify-center">
            <span className="grid size-11 place-items-center rounded-full bg-sage/15 text-secondaryDark">
              <Icon size={24} strokeWidth={1.8} />
            </span>
            <span className="text-[13px] font-extrabold leading-tight text-textMain">
              {title}
              <br />
              <span className="font-semibold">{sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
