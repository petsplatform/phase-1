import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="mx-4 mt-4 sm:mx-5 lg:mx-[22px]">
      <div
        className="relative mx-auto flex items-center justify-center overflow-hidden rounded-[24px] bg-cover bg-center px-4 py-16 sm:min-h-[520px] lg:min-h-[760px]"
        style={{ backgroundImage: "url('/images/img__4.png')" }}
      >
        <div className="absolute inset-0 bg-white/35" />
        <div className="relative flex max-w-[790px] flex-col items-center gap-5 text-center">
          <h1 className="text-[34px] font-semibold leading-tight text-[#122a50] sm:text-[48px] lg:text-[64px]">
            Care That Makes Pets Feel at Home
          </h1>
          <p className="max-w-[700px] text-sm leading-[22px] text-[#122a50b2] sm:text-base">
            We bring together safe, cozy, and easy-to-use pet essentials for
            feeding, grooming, travel, play, and everyday comfort.
          </p>
          <Link
            to="/products"
            className="inline-flex h-[58px] items-center gap-5 rounded-full bg-[#17345f] py-[5px] pl-7 pr-[5px] text-base font-bold text-white transition-colors hover:bg-[#d9aa3d] sm:h-[62px] sm:gap-7 sm:pl-8"
          >
            <span>Shop Pet Care</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white sm:h-[52px] sm:w-[52px]">
              <img src="/images/img_send.svg" alt="" className="h-6 w-6" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
