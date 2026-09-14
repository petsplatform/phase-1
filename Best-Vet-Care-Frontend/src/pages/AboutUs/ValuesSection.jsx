
const values = [
  "Safe Everyday Materials",
  "Comfort for Every Size",
  "Easy Cleaning Routines",
  "Care That Fits Your Budget",
];

const ValuesSection = () => {
  return (
    <section className="mt-12 w-full sm:mt-16 md:mt-20 lg:mt-[80px]">
      <div className="mx-4 sm:mx-5 lg:mx-5">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-10 sm:gap-12">
          <div className="flex w-full flex-col items-start justify-between gap-6 lg:flex-row">
            <h2 className="w-full text-left text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:w-[42%] lg:text-[45px]">
              Get to Know Our Values and the Passion
            </h2>
            <p className="w-full text-base leading-normal text-[#122a50b2] lg:w-[44%]">
              We believe pet products should be useful, safe, comfortable, and
              simple to choose. Every section of the store is built around
              making pet care easier for real homes.
            </p>
          </div>

          <div className="flex w-full flex-col items-start gap-6 md:gap-8 lg:flex-row">
            <img
              src="/images/img__4.png"
              alt="Happy dog and cat with pet essentials"
              className="h-[360px] w-full rounded-[24px] object-cover lg:h-[528px] lg:w-[54%]"
            />
            <div className="flex w-full flex-col items-start gap-8 lg:w-[46%]">
              <div className="flex w-full flex-col items-start gap-5">
                <h3 className="text-[26px] font-medium leading-tight text-[#122a50] sm:text-[30px]">
                  Our Vision & Mission
                </h3>
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                  {values.map((value, index) => (
                    <div key={value} className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#17345f] text-base font-semibold text-white">
                        {index + 1}
                      </span>
                      <p className="text-lg font-medium text-[#122a50]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <img
                src="/images/img_product_item_image_258x430.png"
                alt="Pet wellness products"
                className="h-[280px] w-full rounded-[24px] object-cover sm:h-[320px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
