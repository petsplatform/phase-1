import { contactDetails } from "../../data/contactData";
import { iconMap } from "./iconMap";

export default function ContactFeatures() {
  return (
    <div className="grid gap-5">
      {contactDetails.map(({ icon, label, value, helper, href }) => {
        const Icon = iconMap[icon];
        const ValueTag = href ? "a" : "span";

        return (
          <article key={label} className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-iconBg text-secondaryDark">
              <Icon size={22} strokeWidth={1.9} />
            </span>
            <span className="min-w-0">
              <strong className="block text-[13px] font-extrabold text-textMain">
                {label}
              </strong>
              <ValueTag
                href={href}
                className="mt-1 block text-[13px] font-extrabold leading-snug text-textMain focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                {value}
              </ValueTag>
              <span className="mt-1 block whitespace-pre-line text-[13px] font-semibold leading-snug text-muted">
                {helper}
              </span>
            </span>
          </article>
        );
      })}
    </div>
  );
}
