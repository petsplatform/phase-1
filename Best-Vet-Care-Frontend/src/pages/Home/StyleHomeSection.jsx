import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { mapCatalogProduct } from "../../utils/catalog";

const createProductSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const fallbackProducts = [
  {
    id: "fallback-1",
    name: "Travel Comfort Carrier",
    salePrice: "$59.00",
    image: "/images/collections-product-1.png",
    slug: "travel-comfort-carrier",
  },
  {
    id: "fallback-2",
    name: "Cozy Nap Bed",
    salePrice: "$49.00",
    image: "/images/collections-product-2.png",
    slug: "cozy-nap-bed",
  },
  {
    id: "fallback-3",
    name: "Premium Dog Food",
    salePrice: "$35.00",
    image: "/images/collections-product-3.png",
    slug: "premium-dog-food",
  },
  {
    id: "fallback-4",
    name: "Grooming Brush",
    salePrice: "$15.00",
    image: "/images/img_product_image_80x80.png",
    slug: "grooming-brush",
  },
];

const normalizeImageUrl = (image) => {
  if (!image) return "/images/img_product_item_image.png";
  if (image.startsWith("http")) return image;
  if (image.startsWith("/images/")) return image;
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:5000";
  return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
};

const normalizeComfortProduct = (product = {}, index = 0) => {
  const fallback = fallbackProducts[index % fallbackProducts.length];
  const normalized = product.id ? mapCatalogProduct(product) : product;

  return {
    id: product.id || fallback.id,
    name: product.name || fallback.name,
    salePrice:
      normalized.displayPriceLabel || product.salePrice || fallback.salePrice,
    image: normalizeImageUrl(product.image || fallback.image),
    slug:
      product.id ||
      product.slug ||
      fallback.slug ||
      createProductSlug(product.name || fallback.name),
  };
};

const StyleHomeSection = () => {
  const sliderRef = useRef(null);
  const [comfortProducts, setComfortProducts] = useState(
    fallbackProducts.map(normalizeComfortProduct),
  );

  const scrollSlider = (direction) => {
    if (sliderRef?.current) {
      // Get the width of one slide including the gap (gap is 24px because of gap-6)
      const scrollAmount = sliderRef.current.clientWidth + 24;
      sliderRef?.current?.scrollBy({
        left: direction === "next" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    productApi
      .getProducts({ limit: 4, status: "active" })
      .then((data) => {
        const apiProducts = Array.isArray(data?.items) ? data.items : [];
        if (apiProducts.length === 0) return;

        const mergedProducts = [...apiProducts, ...fallbackProducts].slice(
          0,
          4,
        );
        setComfortProducts(mergedProducts.map(normalizeComfortProduct));
      })
      .catch(() => {});
  }, []);

  const slides = [
    {
      id: 1,
      bgImage: "/images/img_product_image_586x1320.png",
      products: comfortProducts.slice(0, 2),
    },
    {
      id: 2,
      bgImage: "/images/img_.png",
      products: comfortProducts.slice(2, 4),
    },
  ];

  return (
    <section className="w-full bg-background-white">
      <div className="mx-4 sm:mx-8 lg:mx-[56px]">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
            <div className="flex flex-col gap-3 sm:gap-4 w-full md:flex-1">
              <h2
                className="text-[28px] sm:text-[35px] lg:text-[45px] font-semibold"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  lineHeight: "1.25",
                  color: "#122a50",
                }}
              >
                Bring Comfort to Their Day
              </h2>

              <p
                className="text-sm sm:text-base font-normal w-full md:w-[74%]"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  lineHeight: "26px",
                  color: "#122a50b2",
                }}
              >
                Build a happier routine with coordinated pet beds, bowls, toys,
                grooming tools, and travel essentials made for everyday comfort.
              </p>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center gap-2 self-end">
              <button
                onClick={() => scrollSlider("prev")}
                className="p-3 sm:p-[14px] bg-[#122a50] rounded-full hover:bg-opacity-90 transition-all duration-200 transform rotate-180"
                aria-label="Previous slide"
              >
                <img
                  src="/images/img_arrowright_white_a700.svg"
                  alt=""
                  className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
                  width={22}
                  height={22}
                  aria-hidden="true"
                />
              </button>

              <button
                onClick={() => scrollSlider("next")}
                className="p-3 sm:p-[14px] bg-[#122a50] rounded-full hover:bg-opacity-90 transition-all duration-200"
                aria-label="Next slide"
              >
                <img
                  src="/images/img_arrowright_white_a700.svg"
                  alt=""
                  className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
                  width={22}
                  height={22}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          {/* Slider Container */}
          <div
            ref={sliderRef}
            className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide gap-6"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="min-w-full flex-shrink-0 relative w-full h-[430px] sm:h-[500px] md:h-[520px] lg:h-[480px] xl:h-[586px] rounded-3xl overflow-hidden snap-center"
                style={{
                  backgroundImage: `url("${slide.bgImage}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 flex items-end justify-center px-4 sm:px-8 md:px-8 lg:px-[56px] py-6 sm:py-12 md:py-10 lg:py-[68px]">
                  <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-3 lg:gap-8 w-full max-w-6xl">
                    {/* Product Card 1 */}
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-0 w-full md:w-auto">
                      <Link
                        to={`/product/${slide.products[0].slug}`}
                        className="flex items-center gap-3 sm:gap-4 md:gap-3 lg:gap-4 p-3 sm:p-[14px] md:p-3 lg:p-[14px] bg-[#ffffffb2] border border-white/40 rounded-2xl backdrop-blur-md w-full md:w-[250px] lg:w-auto hover:bg-[#ffffff] transition-colors"
                        style={{ borderRadius: "16px" }}
                      >
                        <img
                          src={slide.products[0].image}
                          alt={slide.products[0].name}
                          className="w-16 h-16 sm:w-20 sm:h-20 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl flex-shrink-0 object-cover"
                          style={{ borderRadius: "14px" }}
                        />

                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <h3
                            className="text-lg sm:text-xl md:text-base lg:text-xl font-medium truncate"
                            style={{
                              fontFamily: "Plus Jakarta Sans",
                              lineHeight: "26px",
                              color: "#122a50",
                            }}
                          >
                            {slide.products[0].name}
                          </h3>

                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#122a5066]">
                              Selling Price
                            </span>
                            <span
                              className="text-sm sm:text-base font-semibold"
                              style={{
                                fontFamily: "Plus Jakarta Sans",
                                lineHeight: "21px",
                                color: "#122a50",
                              }}
                            >
                              {slide.products[0].salePrice}
                            </span>
                          </div>
                        </div>

                        <button
                          className="flex-shrink-0 ml-2 hover:opacity-80 transition-opacity"
                          aria-label="View product details"
                        >
                          <img
                            src="/images/img_arrow_right_black_900_24x24.svg"
                            alt=""
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            width={24}
                            height={24}
                            aria-hidden="true"
                          />
                        </button>
                      </Link>
                    </div>

                    {/* Product Card 2 */}
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-0 w-full md:w-auto">
                      <Link
                        to={`/product/${slide.products[1].slug}`}
                        className="flex items-center gap-3 sm:gap-4 md:gap-3 lg:gap-4 p-3 sm:p-[14px] md:p-3 lg:p-[14px] bg-[#ffffffb2] border border-white/40 rounded-2xl backdrop-blur-md w-full md:w-[250px] lg:w-auto hover:bg-[#ffffff] transition-colors"
                        style={{ borderRadius: "16px" }}
                      >
                        <img
                          src={slide.products[1].image}
                          alt={slide.products[1].name}
                          className="w-16 h-16 sm:w-20 sm:h-20 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl flex-shrink-0 object-cover"
                          style={{ borderRadius: "14px" }}
                        />

                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <h3
                            className="text-lg sm:text-xl md:text-base lg:text-xl font-medium truncate"
                            style={{
                              fontFamily: "Plus Jakarta Sans",
                              lineHeight: "26px",
                              color: "#122a50",
                            }}
                          >
                            {slide.products[1].name}
                          </h3>

                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#122a5066]">
                              Selling Price
                            </span>
                            <span
                              className="text-sm sm:text-base font-semibold"
                              style={{
                                fontFamily: "Plus Jakarta Sans",
                                lineHeight: "21px",
                                color: "#122a50",
                              }}
                            >
                              {slide.products[1].salePrice}
                            </span>
                          </div>
                        </div>

                        <button
                          className="flex-shrink-0 ml-2 hover:opacity-80 transition-opacity"
                          aria-label="View product details"
                        >
                          <img
                            src="/images/img_arrow_right_black_900_24x24.svg"
                            alt=""
                            className="w-5 h-5 sm:w-6 sm:h-6"
                            width={24}
                            height={24}
                            aria-hidden="true"
                          />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StyleHomeSection;
