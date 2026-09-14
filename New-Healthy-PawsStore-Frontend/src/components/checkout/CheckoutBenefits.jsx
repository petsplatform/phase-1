import { Headphones, Leaf, LockKeyhole, RotateCcw, ShieldCheck, Truck, UserRoundCheck } from "lucide-react";

export const summaryBenefits = [
  { icon: LockKeyhole, title: "Secure Checkout", text: "Your data is protected with 256-bit SSL" },
  { icon: RotateCcw, title: "Easy Returns", text: "30-day money back guarantee" },
  { icon: Headphones, title: "24/7 Support", text: "We're here to help anytime" },
];

const trustItems = [
  { icon: Leaf, title: "100% Natural & Safe", text: "Only the best for your pets" },
  { icon: UserRoundCheck, title: "Vet Approved Products", text: "Trusted by professionals" },
  { icon: ShieldCheck, title: "Secure Payments", text: "Your data is always safe" },
  { icon: Truck, title: "Free Shipping", text: "On orders over $49" },
];

export default function CheckoutBenefits() {
  return (
    <section className="mx-auto max-w-[1380px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <div className="grid rounded-xl bg-sageLight sm:grid-cols-2 lg:grid-cols-4">
        {trustItems.map(({ icon: Icon, title, text }) => (
          <article key={title} className="flex min-h-[76px] items-center gap-4 border-borderSoft px-6 py-4 lg:border-r lg:last:border-r-0">
            <span className="grid size-12 place-items-center rounded-full bg-white text-secondaryDark">
              <Icon size={26} strokeWidth={1.7} />
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
