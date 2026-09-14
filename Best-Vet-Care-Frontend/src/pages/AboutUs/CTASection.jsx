
const CTASection = () => {
  return (
    <section className="mt-12 w-full sm:mt-16 md:mt-20 lg:mt-[80px]">
      <div
        className="w-full bg-cover bg-center px-4 py-16 sm:px-6 sm:py-18 md:py-20 lg:px-14 lg:py-[78px]"
        style={{ backgroundImage: "url('/images/img__10.png')" }}
      >
        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex max-w-xl flex-col gap-4">
            <h2 className="text-left text-[28px] font-semibold leading-tight text-white sm:text-[36px] md:text-[40px] lg:text-[45px]">
              Better Pet Care, One Click Away
            </h2>
            <p className="text-left text-sm leading-[21px] text-white/70 sm:text-base">
              Discover essentials that match your pet's needs - no hassle, just
              trusted comfort, feeding, grooming, and play options.
            </p>
          </div>

          <a
            href="/"
            className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-[#122a50] transition-colors hover:bg-[#f8f1df] sm:px-8 lg:px-[50px]"
          >
            <span>Get Started</span>
            <img
              src="/images/img_arrow_right_black_900.svg"
              alt=""
              className="h-5 w-5"
            />
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
