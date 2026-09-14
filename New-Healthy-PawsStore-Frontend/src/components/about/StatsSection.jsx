import { Award, HeartPulse, PackageCheck, UsersRound } from "lucide-react";

const stats = [
  { icon: UsersRound, value: "10K+", label: "Happy Customers", note: "Across the country" },
  { icon: PackageCheck, value: "2K+", label: "Premium Products", note: "Carefully selected" },
  { icon: Award, value: "50+", label: "Trusted Brands", note: "Quality you can trust" },
  { icon: HeartPulse, value: "98%", label: "Satisfaction Rate", note: "Pets love our products" },
];

export default function StatsSection() {
  return (
    <section className="border-b border-borderSoft bg-white">
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-x-4 gap-y-6 px-4 py-7 sm:px-6 lg:grid-cols-4 lg:px-[76px]">
        {stats.map(({ icon: Icon, value, label, note }) => (
          <article key={label} className="flex min-w-0 items-center gap-3 border-borderSoft sm:gap-5 lg:border-r lg:last:border-r-0">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sage/20 text-secondaryDark sm:size-16">
              <Icon size={24} fill="currentColor" strokeWidth={1.6} className="sm:size-[31px]" />
            </span>
            <span className="min-w-0">
              <strong className="block text-[25px] font-extrabold leading-none text-textMain sm:text-[32px]">{value}</strong>
              <span className="mt-2 block text-[12px] font-extrabold leading-tight text-textMain sm:text-[13px]">{label}</span>
              <span className="mt-1 block text-[12px] font-semibold text-muted">{note}</span>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
