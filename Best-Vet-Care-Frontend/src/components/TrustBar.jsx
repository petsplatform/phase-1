import {
  CartIcon,
  HeartIcon,
  PhoneIcon,
  SearchIcon,
  TruckIcon,
} from "./common/HeaderIcons";

const trustItems = [
  { title: "Free Shipping", text: "On all orders", icon: TruckIcon },
  { title: "Easy Returns", text: "Hassle free returns", icon: SearchIcon },
  { title: "Secure Payment", text: "100% secure payments", icon: CartIcon },
  { title: "Genuine Products", text: "Trusted & verified", icon: HeartIcon },
  { title: "24/7 Support", text: "We're always here", icon: PhoneIcon },
];

const TrustBar = () => {
  return (
    <section className="px-4 pb-3 pt-8 sm:px-5 lg:px-[22px]">
      <div className="mx-auto grid max-w-[1440px] gap-4 rounded-xl border border-[#17345f1a] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(18,42,80,0.04)] sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#f8f1df] text-[#d9aa3d]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-extrabold leading-none text-[#122a50]">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs font-semibold text-[#122a50b2]">
                  {item.text}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustBar;
