import { apiRequest } from "./client";

function isActiveBanner(banner) {
  return String(banner.status || "Active").toLowerCase() === "active";
}

function isHomeBanner(banner) {
  return String(banner.position || "").toLowerCase().includes("home");
}

function normalizeBanner(banner = {}) {
  return {
    ...banner,
    id: banner.id || banner.title,
    title: banner.title || "Store offer",
    subtitle: banner.subtitle || banner.message || "",
    image: banner.image || banner.imageUrl || banner.desktopImage || banner.mobileImage || "",
    link: banner.link || "/products",
    buttonText: banner.buttonText || "Shop Now",
  };
}

export const contentApi = {
  async getAnnouncement() {
    return apiRequest(`/content/announcement?t=${Date.now()}`, {
      cache: "no-store",
      skipAuth: true,
    });
  },

  async getHomeBanners() {
    const content = await apiRequest(`/customer-panel/store/content?t=${Date.now()}`, {
      cache: "no-store",
      skipAuth: true,
    });
    const banners = Array.isArray(content?.banners) ? content.banners : [];
    return banners
      .filter((banner) => isActiveBanner(banner) && isHomeBanner(banner))
      .map(normalizeBanner);
  },
};
