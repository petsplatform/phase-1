import { PhoneIcon, PillIcon, TruckIcon } from "./HeaderIcons";
import { featureFlags } from "../../config/siteNavigation";

const infoItems = [
  {
    label: "Free Shipping on All Orders",
    icon: TruckIcon,
  },
  {
    label: "Genuine Vet Approved Medicines",
    icon: PillIcon,
  },
  featureFlags.customerSupport && {
    label: "24/7 Customer Support",
    icon: PhoneIcon,
  },
].filter(Boolean);

const TopInfoBar = () => {
  const renderItems = (suffix = "") =>
    infoItems.map((item, index) => {
      const Icon = item.icon;
      return (
        <div key={`${item.label}${suffix}`} className="flex items-center">
          <div className="flex items-center gap-2 px-3 lg:px-4 2xl:px-5">
            <Icon className="h-4 w-4 flex-shrink-0 text-[#d9aa3d]" />
            <span className="whitespace-nowrap">{item.label}</span>
          </div>
          {index < infoItems.length - 1 && (
            <span className="h-4 w-px bg-[#D1D5DB]" aria-hidden="true" />
          )}
        </div>
      );
    });

  return (
    <div className="w-full border-b border-[#17345f1a] bg-[#f8f1df]">
      <div className="mx-auto max-w-[1440px] overflow-hidden px-0 sm:px-5 lg:px-[22px]">
        <div className="top-info-marquee flex py-2 text-[12px] font-medium text-[#122a50] sm:text-[13px]">
          <div className="top-info-track flex min-w-max items-center justify-start xl:min-w-0 xl:justify-center">
            {renderItems()}
          </div>
          <div className="top-info-track top-info-track-copy flex min-w-max items-center justify-start xl:hidden" aria-hidden="true">
            {renderItems("-copy")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopInfoBar;
