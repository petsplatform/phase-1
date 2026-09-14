import { useEffect, useState } from "react";
import { contentApi } from "../../api/contentApi";

function Offer() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let cancelled = false;

    contentApi
      .getStoreContent()
      .then((data) => {
        if (cancelled) return;
        const activeBanners = (data?.banners || []).filter(
          (banner) => banner.status === "Active",
        );
        setBanners(activeBanners.slice(0, 2));
      })
      .catch(() => {
        if (!cancelled) setBanners([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="w-full px-4 sm:px-5 lg:px-5 mt-12 sm:mt-14 md:mt-16 lg:mt-[60px]">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 lg:grid-cols-2">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="relative aspect-[2.7/1] min-h-[220px] overflow-hidden bg-cover bg-center bg-no-repeat px-6 py-6 sm:min-h-[238px] sm:px-[30px] sm:py-[30px]"
            style={{
              backgroundImage: `url('${banner.image || "/images/img__5.png"}')`,
              backgroundPosition: "center center",
              borderRadius: "24px",
            }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <img
              src="/images/img_vector_3.svg"
              alt=""
              className="absolute right-[18px] top-[58px] h-[110px] w-[88px] sm:right-[28px] sm:h-[128px] sm:w-[102px]"
              width={102}
              height={128}
              aria-hidden="true"
            />

            <div className="relative z-10 flex h-full min-h-[168px] flex-col items-start sm:min-h-[178px]">
              <h2
                className="text-[24px] font-semibold"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  lineHeight: "31px",
                  color: "#ffffff",
                }}
              >
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p
                  className="mt-1 text-base"
                  style={{
                    fontFamily: "Plus Jakarta Sans",
                    lineHeight: "21px",
                    color: "#ffffffb2",
                  }}
                >
                  {banner.subtitle}
                </p>
              )}

              <a
                href={banner.link || "/products"}
                className="mt-auto flex h-[50px] items-center justify-center gap-2 rounded-full bg-[#17345f] px-[26px] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d9aa3d] hover:shadow-[0_12px_28px_rgba(23,52,95,0.24)] active:translate-y-0 active:scale-[0.98]"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  fontSize: "16px",
                  fontWeight: "600",
                  lineHeight: "21px",
                }}
              >
                <span>{banner.buttonText || "Discover More"}</span>
                <img
                  src="/images/img_arrowright_white_a700.svg"
                  alt=""
                  className="h-5 w-5"
                  width={20}
                  height={20}
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Offer;
