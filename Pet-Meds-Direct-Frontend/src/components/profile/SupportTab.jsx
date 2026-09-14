import { Link, useSearchParams } from "react-router-dom";
import { supportData } from "../../data/profile";
import {
  Mail,
  Phone,
  MessageCircle,
  ChevronRight,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

const iconMap = {
  Mail,
  Phone,
  MessageCircle,
};

export default function SupportTab() {
  const [, setSearchParams] = useSearchParams();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
          {supportData.title}
        </h2>
        <p className="text-sm sm:text-base font-semibold text-deep-navy/50 mt-1.5">
          {supportData.subtitle}
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {supportData.contactMethods.map((method) => {
          const Icon = iconMap[method.icon];
          return (
            <div
              key={method.label}
              className="rounded-2xl border border-[#e8eef3] bg-white p-6 text-center transition-all hover:shadow-md hover:-translate-y-0.5 group cursor-pointer"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-soft-mint group-hover:bg-primary-green transition-colors mb-4">
                {Icon && (
                  <Icon className="h-6 w-6 text-primary-green group-hover:text-white transition-colors" />
                )}
              </div>
              <h3 className="text-base font-black text-deep-navy mb-1.5">
                {method.label}
              </h3>
              <p className="text-sm font-bold text-medical-teal mb-1">
                {method.value}
              </p>
              <p className="text-xs font-semibold text-deep-navy/40">
                {method.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
