
const HeroSection = () => {
  return (
    <section className="mx-4 mt-4 sm:mx-5 lg:mx-[22px]">
      <div
        className="relative mx-auto flex items-center justify-center overflow-hidden rounded-[24px] bg-cover bg-center px-4 py-16 min-h-[320px] sm:min-h-[520px] md:min-h-[600px] lg:min-h-[700px] xl:min-h-[850px]"
        style={{ backgroundImage: "url('/images/img__4.png')" }}
      >
        <div className="absolute inset-0 bg-white/30" />
        <div className="relative flex max-w-[760px] flex-col items-center gap-5 text-center">
          <h1 className="text-[34px] font-semibold leading-tight text-[#122a50] sm:text-[48px] lg:text-[56px] xl:text-[64px]">
            Find the Perfect Pet Care Collection
          </h1>
          <p className="max-w-[720px] text-sm leading-[22px] text-[#122a50b2] sm:text-base">
            Explore handpicked essentials for feeding, grooming, comfort,
            travel, and play, grouped to make every pet routine easier.
          </p>
          <a
            href="#curated-collections"
            className="inline-flex h-[58px] items-center gap-5 rounded-full bg-[#17345f] py-[5px] pl-7 pr-[5px] text-base font-bold text-white transition-colors hover:bg-[#d9aa3d] sm:h-[62px] sm:gap-7 sm:pl-8"
          >
            <span>Collect Now</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white sm:h-[52px] sm:w-[52px]">
              <img src="/images/img_send.svg" alt="" className="h-6 w-6" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
