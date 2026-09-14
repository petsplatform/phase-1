import api from "./axios";

function isActiveBanner(banner) {
  return String(banner.status || "Active").toLowerCase() === "active";
}

function isHomeBanner(banner) {
  return String(banner.position || "")
    .toLowerCase()
    .includes("home");
}

function normalizeBanner(banner = {}) {
  return {
    ...banner,
    id: banner.id || banner.title,
    title: banner.title || "Store offer",
    subtitle: banner.subtitle || banner.description || banner.message || "",
    image:
      banner.image ||
      banner.imageUrl ||
      banner.desktopImage ||
      banner.mobileImage ||
      "",
    link: banner.link || banner.buttonLink || "/shop",
    buttonText: banner.buttonText || "Shop Now",
    buttonLink: banner.buttonLink || banner.link || "/shop",
    badge: banner.badge || banner.position || "LIMITED TIME OFFER",
  };
}

export const contentApi = {
  getStoreContent: async () => {
    try {
      const res = await api.get("/customer-panel/store/content", {
        params: { t: Date.now() },
      });
      if (res?.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("getStoreContent api call notice:", err?.message || err);
    }

    return null;
  },

  getHomeBanners: async () => {
    try {
      const storeContent = await contentApi.getStoreContent();
      const banners = Array.isArray(storeContent?.banners)
        ? storeContent.banners
        : [];
      if (banners.length > 0) {
        return banners.map(normalizeBanner);
      }
    } catch (err) {
      console.warn("getHomeBanners store content notice:", err);
    }

    try {
      const directBanners = await contentApi.getBanners();
      if (Array.isArray(directBanners) && directBanners.length > 0) {
        return directBanners;
      }
    } catch (err) {
      console.warn("Notice: getHomeBanners direct fetch notice:", err);
    }

    return [];
  },

  // getBanners: async () => {
  //   try {
  //     const res = await api.get("/content/banners", {
  //       params: { t: Date.now() },
  //     });
  //     const raw = res?.data;
  //     const list = Array.isArray(raw)
  //       ? raw
  //       : Array.isArray(raw?.data)
  //       ? raw.data
  //       : Array.isArray(raw?.banners)
  //       ? raw.banners
  //       : Array.isArray(raw?.data?.banners)
  //       ? raw.data.banners
  //       : [];
  //     if (list.length > 0) {
  //       return list.map(normalizeBanner);
  //     }
  //   } catch (err) {
  //     console.warn("getBanners API notice:", err?.message || err);
  //   }

  //   return [];
  // },

  getAnnouncement: async () => {
    try {
      const res = await api.get("/content/announcement", {
        params: { t: Date.now() },
      });
      return res.data.data;
    } catch {
      return null;
    }
  },

  getSettings: async () => {
    try {
      const res = await api.get("/settings");
      return res.data.data;
    } catch {
      return null;
    }
  },
};
