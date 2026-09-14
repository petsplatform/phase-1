import api from "./axios";

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
    buttonLink: banner.buttonLink || banner.link || "/products",
    badge: banner.position || "Home Offer",
  };
}

export const contentApi = {
  getStoreContent: async () => {
    const res = await api.get("/customer-panel/store/content", {
      params: { t: Date.now() },
    });
    return res.data.data;
  },

  getHomeBanners: async () => {
    const content = await contentApi.getStoreContent();
    const banners = Array.isArray(content?.banners) ? content.banners : [];
    return banners
      .filter((banner) => isActiveBanner(banner) && isHomeBanner(banner))
      .map(normalizeBanner);
  },

  getAnnouncement: async () => {
    const res = await api.get("/content/announcement", {
      params: { t: Date.now() },
    });
    return res.data.data;
  },

  getSettings: async () => {
    const res = await api.get("/settings");
    return res.data.data;
  },
};
