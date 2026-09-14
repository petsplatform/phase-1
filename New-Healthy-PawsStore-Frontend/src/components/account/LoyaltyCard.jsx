import { PawPrint, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import dashboardPets from "../../assets/images/account/dashboard-dog-cat.png";

export default function LoyaltyCard({ points = 120 }) {
  return (
    <aside className="grid content-start gap-5">
      <div className="relative hidden h-[142px] overflow-hidden rounded-[18px] lg:block">
        <PawPrint
          className="absolute left-5 top-10 rotate-[-18deg] text-sage"
          size={20}
          fill="currentColor"
        />
        <PawPrint
          className="absolute right-1 top-7 rotate-[18deg] text-sage"
          size={16}
          fill="currentColor"
        />
        <img
          src={dashboardPets}
          alt="Dog and cat welcoming customer"
          className="absolute bottom-0 right-0 h-[148px] w-full object-contain object-bottom"
        />
      </div>
      <div className="flex items-center gap-4 rounded-[16px] bg-sageLight p-4">
        <span className="grid size-12 place-items-center rounded-full bg-white text-secondaryDark shadow-sm">
          <Star size={23} />
        </span>
        <p className="text-[12px] font-semibold leading-snug text-textMain">
          You&apos;ll earn{" "}
          <strong className="block text-[16px]">{points} Paws Points</strong> on
          your current orders
        </p>
      </div>
      {[
        [Truck, "Free Shipping", "On orders over $49"],
        [RotateCcw, "30-Day Returns", "Easy returns & refunds"],
        [ShieldCheck, "Secure Payments", "100% secure checkout"],
      ].map(([Icon, title, text]) => (
        <article key={title} className="flex items-center gap-3 px-2">
          <span className="grid size-8 place-items-center rounded-full bg-sageLight text-secondaryDark">
            <Icon size={16} />
          </span>
          <span>
            <strong className="block text-[12px] font-extrabold">
              {title}
            </strong>
            <span className="text-[11px] font-semibold text-muted">{text}</span>
          </span>
        </article>
      ))}
    </aside>
  );
}
