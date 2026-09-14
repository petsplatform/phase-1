import { Leaf, ShieldCheck, Truck, UserRoundCheck } from "lucide-react";

const items = [
  {
    icon: Leaf,
    title: "100% Natural & Safe",
    text: "Only the best for your pets",
  },
  {
    icon: UserRoundCheck,
    title: "Vet Approved Products",
    text: "Trusted by professionals",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    text: "Your data is always safe",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    text: "On orders over $49",
  },
];

export default function AuthTrustBar() {
  return (
    <section className="mx-auto mt-6 max-w-[1400px] px-4 pb-8 sm:px-5 lg:px-0">
      <div className="grid rounded-[18px] bg-white shadow-[0_10px_28px_var(--color-shadow)] sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <article
            key={title}
            className="flex min-h-[86px] items-center gap-5 border-borderSoft px-8 py-5 lg:border-r lg:last:border-r-0"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-sageLight text-secondaryDark">
              <Icon size={30} strokeWidth={1.7} />
            </span>
            <span>
              <strong className="block text-[15px] font-extrabold text-textMain">
                {title}
              </strong>
              <span className="mt-1 block text-[14px] font-semibold text-muted">
                {text}
              </span>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
