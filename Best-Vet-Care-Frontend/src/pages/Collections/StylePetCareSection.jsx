import { useState } from "react";

const stylesData = [
  {
    id: 1,
    image1: "/images/img_product_item_image.png",
    image2: "/images/img__0x0.png",
    image3: "/images/img_product_item_image_1.png",
  },
  {
    id: 2,
    image1: "/images/collections-style-small.png",
    image2: "/images/collections-style-tall.png",
    image3: "/images/collections-style-arch.png",
  },
  {
    id: 3,
    image1: "/images/img__7.png",
    image2: "/images/img__4.png",
    image3: "/images/img__9.png",
  },
];

const StylePetCareSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextStyle = () => {
    setCurrentIndex((prev) => (prev + 1) % stylesData.length);
  };

  const prevStyle = () => {
    setCurrentIndex((prev) => (prev - 1 + stylesData.length) % stylesData.length);
  };

  return (
    <section className="mt-16 w-full sm:mt-24 lg:mt-28 xl:mt-[160px]">
      <div className="mx-4 sm:mx-5 lg:mx-8 xl:mx-14">
        <div className="mx-auto flex max-w-[1320px] flex-col items-end gap-8 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-0">
          {/* Left text + arrows */}
          <div className="flex w-full flex-col justify-between gap-10 sm:gap-16 lg:w-[34%] lg:gap-0">
            <div className="flex flex-col gap-4">
              <h2 className="text-left text-[30px] font-semibold leading-tight text-[#122a50] sm:text-[38px] lg:text-[36px] xl:text-[45px]">
                Find the Pet Care Style That Speaks to You
              </h2>
              <p className="text-left text-sm font-normal leading-normal text-[#122a50b2] sm:text-base">
                Every collection is designed with a routine in mind, from cozy
                naps and clean feeding to travel days and playful afternoons.
              </p>
            </div>

            <div className="flex items-center gap-2 lg:mb-12 xl:mb-20">
              <button
                onClick={prevStyle}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#17345f66] bg-white text-lg transition-all duration-200 hover:bg-[#f8f1df] sm:h-12 sm:w-12"
                aria-label="Previous style"
              >
                &larr;
              </button>
              <button
                onClick={nextStyle}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17345f] text-lg text-white transition-all duration-200 hover:bg-[#d9aa3d] sm:h-12 sm:w-12"
                aria-label="Next style"
              >
                &rarr;
              </button>
            </div>
          </div>

          {/* Right images */}
          <div className="flex w-full flex-col items-end sm:flex-row lg:w-[68%] lg:-ml-4 xl:-ml-[172px] xl:w-auto relative">
            <div className="grid grid-cols-1 grid-rows-1 w-full relative">
              {stylesData.map((style, index) => (
                <div
                  key={style.id}
                  className={`col-start-1 row-start-1 flex w-full flex-col items-end gap-4 sm:flex-row transition-opacity duration-500 ease-in-out ${
                    currentIndex === index
                      ? "opacity-100 relative z-10"
                      : "opacity-0 absolute top-0 left-0 right-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={style.image1}
                    alt="Pet starter products"
                    className="h-[212px] w-full rounded-[24px] object-cover sm:w-[32%] lg:h-[240px] xl:h-[304px] xl:w-[304px]"
                  />
                  <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                    <img
                      src={style.image2}
                      alt="Cat comfort tower"
                      className="h-[420px] w-full rounded-[24px] object-cover sm:w-[62%] md:h-[500px] lg:h-[520px] xl:h-[608px] xl:w-[398px]"
                    />
                    <img
                      src={style.image3}
                      alt="Pet room essentials"
                      className="h-[320px] w-full self-end rounded-[24px] object-cover sm:w-[36%] md:h-[380px] lg:h-[400px] xl:h-[424px] xl:w-[230px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StylePetCareSection;
