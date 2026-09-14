
const CTASection = () => {
  return (
    <section
      className="w-full bg-cover bg-center bg-no-repeat px-4 py-16 sm:px-6 sm:py-20 lg:px-14 lg:py-[78px]"
      style={{ backgroundImage: "url('/images/img__10.png')" }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-8 sm:gap-10 lg:flex-row lg:items-end">
        <div className="flex max-w-xl flex-col gap-4 lg:max-w-lg xl:max-w-xl">
          <h2 className="text-[28px] font-semibold leading-tight text-white sm:text-[36px] md:text-[40px] lg:text-[38px] xl:text-[45px]">
            Your Pet's Favorites, One Click Away
          </h2>
          <p className="text-sm leading-[21px] text-white/70 sm:text-base">
            Discover pet essentials that match their comfort, safety, and care
            needs - no hassle, just trusted options.
          </p>
        </div>

        <a
          href="/shop"
          className="flex items-center justify-center gap-2 rounded-full bg-[#17345f] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#d9aa3d] sm:px-8 lg:px-[50px]"
        >
          <span>Get Started</span>
          <img src="/images/img_arrowright_white_a700.svg" alt="" className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
};

export default CTASection;
