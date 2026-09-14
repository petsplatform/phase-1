import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { mapCatalogProduct } from '../../utils/catalog';

const HeroSection = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
  const activeProduct = featuredProducts[activeProductIndex] || featuredProducts[0];

  useEffect(() => {
    productApi.getProducts({ limit: 5, status: 'active' })
      .then((data) => {
        if (data?.items && data.items.length > 0) {
          setFeaturedProducts(data.items.map((p) => ({
            ...mapCatalogProduct(p),
            id: p.id,
            slug: p.id,
            name: p.name,
            image: p.image || '/images/img_product_item_image.png',
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (featuredProducts.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveProductIndex((index) => (index + 1) % featuredProducts.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [featuredProducts.length]);

  return (
    <section className="w-full bg-background-white">
      <div className="w-full mx-auto">
        <div
          className="relative w-full overflow-hidden"
          style={{
            backgroundImage: 'url("/images/img_.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '24px'
          }}
        >
          <div className="absolute inset-0 bg-white/20" />

          <div className="relative flex flex-col items-center justify-center px-4 sm:px-8 md:px-14 lg:px-[56px] py-12 sm:py-20 md:py-24 lg:py-[122px]">
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[30px] w-full max-w-[1284px]">
              <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-[18px] w-full px-0 sm:px-8 md:px-16 lg:px-24 xl:px-[296px]">
                <h1
                  className="text-[34px] sm:text-[40px] md:text-[50px] lg:text-[60px] font-semibold text-center text-text-primary w-full"
                  style={{
                    fontFamily: 'Plus Jakarta Sans',
                    lineHeight: '1.25',
                    color: '#122a50'
                  }}
                >
                  Happy Pets Start with Better Care
                </h1>

                <p
                  className="text-sm sm:text-base font-normal text-center w-full"
                  style={{
                    fontFamily: 'Plus Jakarta Sans',
                    lineHeight: '21px',
                    color: '#122a50b2'
                  }}
                >
                  Discover thoughtful pet products for comfort, play, grooming, feeding, and everyday wellness.
                </p>
              </div>

              <Link
                to="/products"
                className="inline-flex h-[58px] sm:h-[68px] md:h-[74px] items-center gap-4 sm:gap-6 md:gap-[30px] rounded-full bg-[#17345f] py-1.5 sm:py-2 pl-6 sm:pl-9 md:pl-[50px] pr-1.5 sm:pr-2 text-white shadow-sm transition-colors duration-200 hover:bg-[#d9aa3d] active:scale-95"
                style={{
                  fontFamily: 'Plus Jakarta Sans',
                  fontSize: 'clamp(16px, 4vw, 22px)',
                  fontWeight: 700,
                  lineHeight: '28px'
                }}
              >
                <span className="whitespace-nowrap">Shop Pet Care</span>
                <span className="flex h-[46px] w-[46px] sm:h-[52px] sm:w-[52px] md:h-[58px] md:w-[58px] items-center justify-center rounded-full bg-white">
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

              <div className="flex flex-col md:flex-row justify-start items-center gap-4 md:gap-0 w-full mt-4 sm:mt-6 md:mt-[26px]">
                {activeProduct ? (
                  <Link
                    key={activeProduct.id}
                    to={`/product/${activeProduct.slug}`}
                    state={{ product: activeProduct }}
                    className="hero-product-card group flex w-full flex-col gap-3 rounded-xl bg-background-white p-2 shadow-[0_16px_40px_rgba(18,42,80,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_52px_rgba(18,42,80,0.18)] sm:gap-[14px] sm:p-[10px] md:w-[32%] lg:w-[26%]"
                    style={{ borderRadius: '12px' }}
                    aria-label={`View ${activeProduct.name}`}
                  >
                    <div className="aspect-[1.72/1] w-full overflow-hidden rounded-lg bg-[#f8f1df]">
                      <img
                        src={activeProduct.image}
                        alt={activeProduct.name}
                        className="hero-product-image h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ borderRadius: '8px' }}
                        width={276}
                        height={160}
                      />
                    </div>

                    <div className="hero-product-details flex flex-row justify-between items-center w-full px-2 sm:px-[10px] mb-1 sm:mb-[6px]">
                      <span
                        className="min-w-0 flex-1 truncate pr-3 text-left text-sm font-normal sm:text-base"
                        style={{
                          fontFamily: 'Plus Jakarta Sans',
                          lineHeight: '21px',
                          color: '#122a50'
                        }}
                      >
                        {activeProduct.name}
                      </span>
                      <span className="flex flex-shrink-0 flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#122a5066]">
                          Selling Price
                        </span>
                        <span
                          className="text-lg sm:text-xl font-semibold"
                          style={{
                            fontFamily: 'Plus Jakarta Sans',
                            lineHeight: '26px',
                            color: '#122a50'
                          }}
                        >
                          ${activeProduct.price}
                        </span>
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div 
                    className="hero-product-card flex w-full flex-col gap-3 rounded-xl bg-background-white p-2 shadow-[0_16px_40px_rgba(18,42,80,0.12)] sm:gap-[14px] sm:p-[10px] md:w-[32%] lg:w-[26%] animate-pulse"
                    style={{ borderRadius: '12px' }}
                  >
                    <div className="aspect-[1.72/1] w-full overflow-hidden rounded-lg bg-[#f8f1df]"></div>
                    <div className="hero-product-details flex flex-row justify-between items-center w-full px-2 sm:px-[10px] mb-1 sm:mb-[6px]">
                      <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
                      <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-end items-start w-full md:flex-1 px-0 sm:px-8 md:px-10 lg:px-14 xl:px-[104px] gap-4">

                  <div
                    className="flex flex-col gap-3 sm:gap-4 w-full md:w-[220px] bg-[#ffffffb2] border border-border-white rounded-lg sm:rounded-xl p-3 sm:p-[14px]"
                    style={{
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <h3
                      className="text-xs sm:text-sm font-medium"
                      style={{
                        fontFamily: 'Plus Jakarta Sans',
                        lineHeight: '18px',
                        color: '#122a50'
                      }}
                    >
                      Vet-Loved Essentials
                    </h3>

                    <div className="flex flex-col gap-1 sm:gap-[6px]">
                      {['Safe Materials', 'Daily Comfort', 'Happy Pets'].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <img
                            src="/images/img_arrow_right.svg"
                            alt=""
                            className="w-[18px] h-[18px]"
                            width={18}
                            height={18}
                            aria-hidden="true"
                          />
                          <span
                            className="text-xs font-normal text-center"
                            style={{
                              fontFamily: 'Plus Jakarta Sans',
                              lineHeight: '16px',
                              color: '#122a50b2'
                            }}
                          >
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
