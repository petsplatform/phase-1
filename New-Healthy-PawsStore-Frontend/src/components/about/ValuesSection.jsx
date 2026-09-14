import { Globe2, Handshake, Heart, Leaf, ShieldCheck } from "lucide-react";

const values = [
  { icon: Heart, title: "Love", text: "We treat every pet like our own.", tone: "text-secondaryDark" },
  { icon: ShieldCheck, title: "Quality", text: "We never compromise on quality.", tone: "text-orange" },
  { icon: Leaf, title: "Health", text: "Promoting better health for every pet.", tone: "text-secondary" },
  { icon: Handshake, title: "Trust", text: "Building lasting trust with pet parents.", tone: "text-orange" },
  { icon: Globe2, title: "Responsibility", text: "Committed to pets, people & planet.", tone: "text-secondaryDark" },
];

export default function ValuesSection() {
  return (
    <section className="bg-softCream px-6 py-8 lg:px-[76px]">
      <div className="mx-auto max-w-[1320px]">
        <h2 className="mb-6 text-center text-[24px] font-extrabold text-textMain">Our Values</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {values.map(({ icon: Icon, title, text, tone }) => (
            <article key={title} className="rounded-[9px] border border-borderSoft bg-white px-6 py-7 text-center shadow-card">
              <Icon className={`mx-auto ${tone}`} size={38} fill="currentColor" strokeWidth={1.5} />
              <h3 className="mt-5 text-[16px] font-extrabold text-textMain">{title}</h3>
              <p className="mx-auto mt-3 max-w-[150px] text-[12px] font-semibold leading-[1.7] text-textMain">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
