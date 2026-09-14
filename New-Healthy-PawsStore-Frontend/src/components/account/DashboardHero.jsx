import { PawPrint } from "lucide-react";

export default function DashboardHero({ profile }) {
  return (
    <section className="relative min-h-[86px] overflow-hidden rounded-[18px] bg-background pt-2">
      <div className="relative z-10">
        <h1 className="font-display text-[31px] font-extrabold leading-tight text-textMain">
          Welcome back, {profile.firstName}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-2 text-[13px] font-semibold text-muted">Here&apos;s what&apos;s happening with your account today.</p>
      </div>
      <PawPrint className="absolute right-5 top-12 hidden rotate-[-16deg] text-sage lg:block" size={28} fill="currentColor" />
    </section>
  );
}
