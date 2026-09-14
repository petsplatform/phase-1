import { useState } from "react";
import { Link } from "react-router-dom";
import SEO from "../../components/common/SEO";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import CouponOffers from "../../components/coupons/CouponOffers";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

const Shop = () => {
  const [selectedCategory, setSelectedCategory] = useState("Dog Care");
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const allRoomCategories = [
    "Dog Care",
    "Cat Care",
    "Feeding",
    "Grooming",
    "Travel",
    "Treats",
  ];

  const products = Array(6)
    ?.fill(null)
    .map((_, index) => ({
      id: `shop-featured-${index}`,
      slug: "pedigree-adult-dry-dog-food",
      category: index < 3 ? "Dog Care" : "Cat Care",
      name: index < 3 ? "Premium Dog Comfort Kit" : "Premium Cat Comfort Kit",
      price: "$50.00",
      description:
        "A cozy, durable pet essential made for daily comfort, play, and simple care routines.",
      image: "/images/img_product_item_image.png",
    }));

  const roomCategories = allRoomCategories.filter(
    (category) => products.filter((product) => product.category === category).length >= 3,
  ).slice(0, 6);
  const visibleProducts = products.filter(
    (product) => product.category === selectedCategory,
  );

  const trendingItems = [
    {
      title: "Dog Care",
      subtitle: "Best Sellers",
      image: "/images/img_trending_item_image.png",
    },
    {
      title: "Feeding",
      subtitle: "Best Sellers",
      image: "/images/img_trending_item_image_300x400.png",
    },
    {
      title: "Cat Care",
      subtitle: "Best Sellers",
      image: "/images/img_trending_item_image_1.png",
    },
  ];

  const handleAddToCart = (product, image) => {
    addToCart({
      ...product,
      image,
      quantity: 1,
    });
    showToast(`${product.name} added to cart`);
  };

  return (
    <>
      <SEO
        title="Shop Pet Products | Best-Vet-Care"
        description="Browse Best-Vet-Care pet essentials by category: beds, bowls, toys, grooming kits, carriers, collars, treats, and wellness products."
        ogTitle="Shop Pet Products | Best-Vet-Care"
        ogDescription="Browse pet essentials by category: beds, bowls, toys, grooming kits, carriers, collars, treats, and wellness products."
      />
      <main className="w-full bg-background-white">
        {/* Header */}
        <Header />

        {/* Hero Section */}
        <section className="w-full px-4 sm:px-5 lg:px-5 mt-4 sm:mt-5">
          <div
            className="w-full rounded-4xl bg-cover bg-center bg-no-repeat px-4 sm:px-10 md:px-14 lg:px-14 py-16 sm:py-28 md:py-40 lg:py-[200px]"
            style={{
              backgroundImage: "url('/images/img__4.png')",
              borderRadius: "24px",
            }}
          >
            <div className="w-full max-w-[1320px] mx-auto flex flex-col items-center justify-center gap-6">
              <h1
                className="max-w-[920px] text-center text-[36px] sm:text-[52px] md:text-[68px] lg:text-[80px] font-semibold"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: "600",
                  lineHeight: "1.18",
                  color: "#122a50",
                }}
              >
                Transform Your Rooms with Enduring Style
              </h1>

              <p
                className="text-center text-sm sm:text-base max-w-[760px]"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "16px",
                  fontWeight: "400",
                  lineHeight: "21px",
                  color: "#122a50b2",
                }}
              >
                Discover our curated collection of modern & classic furniture
                for your perfect home.
              </p>

              <Link
                to="/products"
                className="inline-flex h-[58px] sm:h-[62px] items-center gap-5 sm:gap-[28px] rounded-full bg-[#17345f] py-[5px] pl-7 sm:pl-[32px] pr-[5px] text-white shadow-sm transition-colors duration-200 hover:bg-[#d9aa3d] active:scale-95"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "clamp(16px, 4vw, 18px)",
                  fontWeight: 700,
                  lineHeight: "24px",
                }}
              >
                <span className="whitespace-nowrap">Shop Now</span>
                <span className="flex h-12 w-12 sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full bg-white">
                  <img
                    src="/images/img_send.svg"
                    alt=""
                    className="h-7 w-7"
                    width={28}
                    height={28}
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </div>
          </div>
        </section>

        <CouponOffers />

        {/* Curated Categories Section */}
        <section className="w-full px-4 sm:px-5 lg:px-5 mt-20 sm:mt-24 md:mt-28 lg:mt-[160px]">
          <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-12 sm:gap-14 md:gap-16">
            {/* Section Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col gap-4 flex-1">
                <h2
                  className="text-[28px] sm:text-[36px] md:text-[40px] lg:text-[45px] font-semibold leading-tight"
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    fontWeight: "600",
                    lineHeight: "1.27",
                    color: "#122a50",
                  }}
                >
                  Curated Categories for Every Space
                </h2>
                <p
                  className="text-sm sm:text-base max-w-2xl"
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    fontSize: "16px",
                    fontWeight: "400",
                    lineHeight: "26px",
                    color: "#122a50b2",
                  }}
                >
                  Discover pet collections thoughtfully designed for every care
                  routine. From cozy beds to feeding sets, grooming kits, and
                  travel essentials.
                </p>
              </div>

              <button
                className="flex items-center justify-center gap-2 px-6 sm:px-8 lg:px-[50px] py-3 bg-button-bg-primary text-button-text-white rounded-4xl hover:opacity-90 transition-all duration-200"
                style={{
                  borderRadius: "24px",
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "16px",
                  fontWeight: "600",
                  lineHeight: "21px",
                }}
              >
                <span>View All Categories</span>
                <img
                  src="/images/img_arrowright_white_a700.svg"
                  alt=""
                  className="w-5 h-5"
                  width={20}
                  height={20}
                />
              </button>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Dog Care Card */}
              <div
                className="rounded-4xl bg-cover bg-center bg-no-repeat px-6 sm:px-7 lg:px-[30px] py-6 sm:py-7 lg:py-[30px] min-h-[300px] sm:min-h-[350px] lg:min-h-[464px]"
                style={{
                  backgroundImage: "url('/images/img__7.png')",
                  borderRadius: "24px",
                }}
              >
                <div className="flex flex-row justify-between items-start h-full">
                  <div className="flex flex-col justify-center gap-1">
                    <h3
                      className="text-lg sm:text-xl font-medium"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "20px",
                        fontWeight: "500",
                        lineHeight: "26px",
                        color: "#ffffff",
                      }}
                    >
                      Dog Care
                    </h3>
                    <p
                      className="text-base"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "16px",
                        fontWeight: "400",
                        lineHeight: "21px",
                        color: "#ffffffb2",
                      }}
                    >
                      305 Items
                    </p>
                  </div>

                  <button
                    className="flex items-center justify-center p-3.5 bg-button-bg-white rounded-xl hover:opacity-90 transition-all duration-200"
                    style={{
                      borderRadius: "14px",
                    }}
                    aria-label="View Dog Care"
                  >
                    <img
                      src="/images/img_send.svg"
                      alt=""
                      className="w-[22px] h-[22px]"
                      width={22}
                      height={22}
                    />
                  </button>
                </div>
              </div>

              {/* Cat Care Card */}
              <div
                className="rounded-4xl bg-cover bg-center bg-no-repeat px-6 sm:px-7 lg:px-[30px] py-6 sm:py-7 lg:py-[30px] min-h-[200px] sm:min-h-[220px] lg:min-h-[240px]"
                style={{
                  backgroundImage: "url('/images/img__8.png')",
                  borderRadius: "24px",
                }}
              >
                <div className="flex flex-row justify-between items-start h-full">
                  <div className="flex flex-col justify-center gap-1">
                    <h3
                      className="text-lg sm:text-xl font-medium"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "20px",
                        fontWeight: "500",
                        lineHeight: "26px",
                        color: "#ffffff",
                      }}
                    >
                      Cat Care
                    </h3>
                    <p
                      className="text-base"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "16px",
                        fontWeight: "400",
                        lineHeight: "21px",
                        color: "#ffffffb2",
                      }}
                    >
                      305 Items
                    </p>
                  </div>

                  <button
                    className="flex items-center justify-center p-3.5 bg-button-bg-white rounded-xl hover:opacity-90 transition-all duration-200"
                    style={{
                      borderRadius: "14px",
                    }}
                    aria-label="View Cat Care"
                  >
                    <img
                      src="/images/img_send.svg"
                      alt=""
                      className="w-[22px] h-[22px]"
                      width={22}
                      height={22}
                    />
                  </button>
                </div>
              </div>

              {/* Pet Travel Card */}
              <div
                className="rounded-4xl bg-cover bg-center bg-no-repeat px-6 sm:px-6 lg:px-7 py-6 sm:py-6 lg:py-7 min-h-[200px] sm:min-h-[220px] lg:min-h-[240px]"
                style={{
                  backgroundImage: "url('/images/img__9.png')",
                  borderRadius: "24px",
                }}
              >
                <div className="flex flex-row justify-between items-start h-full">
                  <div className="flex flex-col justify-center gap-0.5">
                    <h3
                      className="text-lg sm:text-xl font-medium"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "20px",
                        fontWeight: "500",
                        lineHeight: "26px",
                        color: "#ffffff",
                      }}
                    >
                      Pet Travel
                    </h3>
                    <p
                      className="text-base"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "16px",
                        fontWeight: "400",
                        lineHeight: "21px",
                        color: "#ffffffb2",
                      }}
                    >
                      305 Items
                    </p>
                  </div>

                  <button
                    className="flex items-center justify-center p-3.5 bg-button-bg-white rounded-xl hover:opacity-90 transition-all duration-200"
                    style={{
                      borderRadius: "14px",
                    }}
                    aria-label="View Pet Travel"
                  >
                    <img
                      src="/images/img_send.svg"
                      alt=""
                      className="w-[22px] h-[22px]"
                      width={22}
                      height={22}
                    />
                  </button>
                </div>
              </div>

              {/* Wellness Card */}
              <div
                className="md:col-span-2 lg:col-span-3 rounded-4xl bg-cover bg-center bg-no-repeat px-6 sm:px-7 lg:px-[30px] py-6 sm:py-7 lg:py-[30px] min-h-[200px] sm:min-h-[220px] lg:min-h-[240px]"
                style={{
                  backgroundImage: "url('/images/img__10.png')",
                  borderRadius: "24px",
                }}
              >
                <div className="flex flex-row justify-between items-start h-full">
                  <div className="flex flex-col justify-center gap-1">
                    <h3
                      className="text-lg sm:text-xl font-medium"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "20px",
                        fontWeight: "500",
                        lineHeight: "26px",
                        color: "#ffffff",
                      }}
                    >
                      Wellness
                    </h3>
                    <p
                      className="text-base"
                      style={{
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "16px",
                        fontWeight: "400",
                        lineHeight: "21px",
                        color: "#ffffffb2",
                      }}
                    >
                      305 Items
                    </p>
                  </div>

                  <button
                    className="flex items-center justify-center p-3.5 bg-button-bg-white rounded-xl hover:opacity-90 transition-all duration-200"
                    style={{
                      borderRadius: "14px",
                    }}
                    aria-label="View Wellness"
                  >
                    <img
                      src="/images/img_send.svg"
                      alt=""
                      className="w-[22px] h-[22px]"
                      width={22}
                      height={22}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Find Your Perfect Pet Product Section */}
        <section className="w-full bg-background-secondary px-4 sm:px-5 lg:px-5 py-16 sm:py-18 md:py-20 mt-16 sm:mt-18 md:mt-20">
          <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-12 sm:gap-14 md:gap-16">
            {/* Section Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
              <h2
                className="text-[28px] sm:text-[36px] md:text-[40px] lg:text-[45px] font-semibold leading-tight"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: "600",
                  lineHeight: "1.27",
                  color: "#122a50",
                }}
              >
                Find Your Perfect Pet Product
              </h2>
              <p
                className="text-sm sm:text-base max-w-md lg:max-w-lg"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "16px",
                  fontWeight: "400",
                  lineHeight: "26px",
                  color: "#122a50b2",
                }}
              >
                Browse our complete catalog and filter by pet type, routine, or
                care need. From cozy rest to active play and travel.
              </p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-col gap-6 sm:gap-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Scrollable Category Buttons */}
                <div className="flex flex-row items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-hide">
                  {roomCategories?.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 px-6 sm:px-7 lg:px-[34px] py-3 rounded-4xl transition-all duration-200 whitespace-nowrap ${
                        selectedCategory === category
                          ? "bg-button-bg-primary text-button-text-white"
                          : "bg-button-bg-white text-button-text-primary border border-border-light hover:bg-opacity-80"
                      }`}
                      style={{
                        borderRadius: "24px",
                        fontFamily: "Plus Jakarta Sans",
                        fontSize: "16px",
                        fontWeight: "600",
                        lineHeight: "21px",
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {visibleProducts?.map((product, index) => {
                  const productImage =
                    index % 3 === 0
                      ? "/images/img_product_item_image.png"
                      : index % 3 === 1
                        ? "/images/img_product_item_image_258x430.png"
                        : "/images/img_product_item_image_1.png";

                  return (
                    <div
                      key={product.id}
                      className="flex flex-col gap-5 sm:gap-5.5"
                    >
                      <img
                        src={productImage}
                        alt={product?.name}
                        className="w-full rounded-4xl"
                        style={{ borderRadius: "24px" }}
                      />

                      <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8 px-3.5">
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                            <h3
                              className="text-lg sm:text-xl font-medium"
                              style={{
                                fontFamily: "Plus Jakarta Sans",
                                fontSize: "20px",
                                fontWeight: "500",
                                lineHeight: "26px",
                                color: "#122a50",
                              }}
                            >
                              {product?.name}
                            </h3>
                            <span
                              className="text-lg sm:text-xl font-semibold"
                              style={{
                                fontFamily: "Plus Jakarta Sans",
                                fontSize: "20px",
                                fontWeight: "600",
                                lineHeight: "26px",
                                color: "#122a50",
                              }}
                            >
                              {product?.price}
                            </span>
                          </div>

                          <p
                            className="text-sm sm:text-base"
                            style={{
                              fontFamily: "Plus Jakarta Sans",
                              fontSize: "16px",
                              fontWeight: "400",
                              lineHeight: "26px",
                              color: "#122a50b2",
                            }}
                          >
                            {product?.description}
                          </p>
                        </div>

                        <div className="flex flex-row flex-wrap items-center gap-2">
                          <Link
                            to="/product/pedigree-adult-dry-dog-food"
                            className="flex min-w-0 flex-1 items-center justify-center gap-2 px-5 sm:px-8 lg:px-[54px] py-3 bg-transparent border border-border-light rounded-4xl hover:bg-opacity-10 transition-all duration-200"
                            style={{
                              borderRadius: "24px",
                              fontFamily: "Plus Jakarta Sans",
                              fontSize: "16px",
                              fontWeight: "600",
                              lineHeight: "21px",
                              color: "#122a50",
                            }}
                          >
                            <span>Learn More</span>
                            <img
                              src="/images/img_arrow_right_black_900.svg"
                              alt=""
                              className="w-5 h-5"
                              width={20}
                              height={20}
                            />
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddToCart(product, productImage)
                            }
                            className="flex items-center justify-center p-3.5 bg-button-bg-primary rounded-4xl hover:opacity-90 transition-all duration-200"
                            style={{
                              borderRadius: "24px",
                            }}
                            aria-label={`Add ${product?.name} to cart`}
                          >
                            <img
                              src="/images/img_product_item_button.svg"
                              alt=""
                              className="w-[22px] h-[22px]"
                              width={22}
                              height={22}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Trending Pet Products Section */}
        <section className="w-full px-4 sm:px-5 lg:px-5 py-16 sm:py-18 md:py-20">
          <div className="w-full max-w-[1320px] mx-auto flex flex-col gap-12 sm:gap-14 md:gap-[62px]">
            {/* Section Header */}
            <div className="flex flex-col items-center gap-4 sm:gap-4.5 max-w-3xl mx-auto">
              <h2
                className="text-center text-[28px] sm:text-[36px] md:text-[40px] lg:text-[45px] font-semibold leading-tight"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: "600",
                  lineHeight: "1.27",
                  color: "#122a50",
                }}
              >
                Discover Our Most Trending Pet Picks
              </h2>
              <p
                className="text-center text-sm sm:text-base"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "16px",
                  fontWeight: "400",
                  lineHeight: "21px",
                  color: "#122a50b2",
                }}
              >
                Discover the pet products everyone is talking about, from cozy
                beds to smart feeding and play essentials.
              </p>
            </div>

            {/* Trending Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {trendingItems?.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 bg-background-secondary rounded-4xl p-3.5"
                  style={{
                    borderRadius: "24px",
                  }}
                >
                  <div className="flex flex-row justify-between items-center px-5 py-5">
                    <div className="flex flex-col justify-center gap-1">
                      <h3
                        className="text-lg sm:text-xl font-medium"
                        style={{
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "20px",
                          fontWeight: "500",
                          lineHeight: "26px",
                          color: "#122a50",
                        }}
                      >
                        {item?.title}
                      </h3>
                      <p
                        className="text-base"
                        style={{
                          fontFamily: "Plus Jakarta Sans",
                          fontSize: "16px",
                          fontWeight: "400",
                          lineHeight: "21px",
                          color: "#122a50b2",
                        }}
                      >
                        {item?.subtitle}
                      </p>
                    </div>

                    <button
                      className="flex items-center justify-center p-3.5 bg-button-bg-primary rounded-6xl hover:opacity-90 transition-all duration-200"
                      style={{
                        borderRadius: "30px",
                      }}
                      aria-label={`View ${item?.title}`}
                    >
                      <img
                        src="/images/img_vuesax_bold_trontron_trx.svg"
                        alt=""
                        className="w-[34px] h-[34px]"
                        width={34}
                        height={34}
                      />
                    </button>
                  </div>

                  <img
                    src={item?.image}
                    alt={item?.title}
                    className="w-full rounded-2xl"
                    style={{ borderRadius: "16px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Section */}
        <section
          className="w-full bg-cover bg-center bg-no-repeat px-4 sm:px-6 lg:px-14 py-16 sm:py-18 md:py-20 lg:py-[78px] mt-20 sm:mt-24 md:mt-28 lg:mt-[160px]"
          style={{
            backgroundImage: "url('/images/img__10.png')",
          }}
        >
          <div className="w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="flex flex-col gap-4 sm:gap-4.5 max-w-xl">
              <h2
                className="text-[28px] sm:text-[36px] md:text-[40px] lg:text-[45px] font-semibold leading-tight"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontWeight: "600",
                  lineHeight: "1.24",
                  color: "#ffffff",
                }}
              >
                Your Pet's Favorites, One Click Away
              </h2>
              <p
                className="text-sm sm:text-base"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "16px",
                  fontWeight: "400",
                  lineHeight: "21px",
                  color: "#ffffffb2",
                }}
              >
                Discover pet essentials that match their comfort, safety, and
                care needs - no hassle, just trusted options.
              </p>
            </div>

            <button
              className="flex items-center justify-center gap-2 px-6 sm:px-8 lg:px-[50px] py-3 sm:py-3.5 bg-button-bg-primary text-button-text-white rounded-5xl hover:opacity-90 transition-all duration-200"
              style={{
                borderRadius: "26px",
                fontFamily: "Plus Jakarta Sans",
                fontSize: "16px",
                fontWeight: "600",
                lineHeight: "21px",
              }}
            >
              <span>Discover More</span>
              <img
                src="/images/img_arrowright_white_a700.svg"
                alt=""
                className="w-5 h-5"
                width={20}
                height={20}
              />
            </button>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </>
  );
};

export default Shop;
