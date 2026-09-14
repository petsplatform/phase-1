import {
  CartIcon,
  HeartIcon,
  PhoneIcon,
  SearchIcon,
  TruckIcon,
} from "./common/HeaderIcons";
import dogImage from "../assets/logo/dog3.png";

const CheckCircleIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="m8.5 12.2 2.3 2.3 4.7-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const deliveryItems = [
  {
    title: "Free Delivery",
    text: "On all orders",
    icon: TruckIcon,
  },
  { title: "Easy Returns", text: "7 days easy return", icon: SearchIcon },
  { title: "Secure Payment", text: "100% secure payment", icon: CartIcon },
  {
    title: "Genuine Products",
    text: "Trusted & verified products",
    icon: HeartIcon,
  },
];

const reasons = [
  "Premium Quality Products",
  "Vet Approved",
  "Best Prices",
  "Happy Pets, Happy Life",
];

const TrustCard = () => {
  return (
    <aside className="space-y-4 lg:sticky lg:top-5">
      <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
        <div className="space-y-5">
          {deliveryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3">
                <Icon className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#d9aa3d]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#17345f]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#122a50]">
                    {item.text}
                  </p>
                  {item.subtext && (
                    <p className="text-xs font-semibold text-[#122a50b2]">
                      {item.subtext}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
        <div className="relative z-10">
          <h2 className="text-base font-extrabold text-[#122a50]">
            Why Best-Vet-Care?
          </h2>
          <div className="mt-4 space-y-3">
            {reasons.map((reason) => (
              <div
                key={reason}
                className="flex items-center gap-2 text-sm font-bold text-[#122a50]"
              >
                <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-[#d9aa3d]" />
                {reason}
              </div>
            ))}
          </div>
        </div>
        <PhoneIcon className="absolute right-8 top-10 h-5 w-5 text-[#d9aa3d]/20" />
        <HeartIcon className="absolute right-20 top-28 h-6 w-6 text-[#d9aa3d]/20" />
        <img
          src={dogImage}
          alt="Cute dog and cat"
          className="relative z-10 ml-auto mt-3 h-32 w-40 object-contain object-bottom"
        />
      </div>
    </aside>
  );
};

export default TrustCard;
