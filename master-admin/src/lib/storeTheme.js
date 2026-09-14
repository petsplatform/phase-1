import { getStoreLogoKey } from "./storeLogo";

const defaultTheme = {
  primary: "#17345f",
  primaryLight: "#254c80",
  primaryDark: "#0d1f3d",
  accentGold: "#d9aa3d",
  accentGoldSoft: "#d9aa3d26",
  bgLight: "#f8f1df",
  bgSoft: "#fff8e8",
  cardBg: "#fffdf7",
  borderColor: "#d9aa3d4d",
  textPrimary: "#122a50",
  textMuted: "#122a50b2",
  textSoft: "#122a5066",
  adminShadow: "0 14px 40px rgba(23, 52, 95, 0.08)",
};

const superAdminTheme = {
  primary: "#111111",
  primaryLight: "#2b2b2b",
  primaryDark: "#000000",
  accentGold: "#111111",
  accentGoldSoft: "#11111112",
  bgLight: "#f7f7f7",
  bgSoft: "#f1f1f1",
  cardBg: "#ffffff",
  borderColor: "#0000001a",
  textPrimary: "#111111",
  textMuted: "#404040",
  textSoft: "#777777",
  adminShadow: "0 14px 40px rgba(0, 0, 0, 0.08)",
};

const storeThemes = {
  STORE_1: defaultTheme,
  STORE_2: {
    primary: "#0f766e",
    primaryLight: "#15968c",
    primaryDark: "#0b3f3a",
    accentGold: "#e9555f",
    accentGoldSoft: "#e9555f24",
    bgLight: "#f2fbf8",
    bgSoft: "#e8f7f3",
    cardBg: "#fbfffd",
    borderColor: "#0f766e2e",
    textPrimary: "#103532",
    textMuted: "#103532b3",
    textSoft: "#10353266",
    adminShadow: "0 14px 40px rgba(15, 118, 110, 0.09)",
  },
  STORE_3: {
    primary: "#587a35",
    primaryLight: "#719a45",
    primaryDark: "#30471f",
    accentGold: "#0f5b5f",
    accentGoldSoft: "#0f5b5f24",
    bgLight: "#f6faed",
    bgSoft: "#eef6df",
    cardBg: "#fefff9",
    borderColor: "#719a4538",
    textPrimary: "#26391c",
    textMuted: "#26391cb3",
    textSoft: "#26391c66",
    adminShadow: "0 14px 40px rgba(88, 122, 53, 0.1)",
  },
  STORE_4: {
    primary: "#155a9c",
    primaryLight: "#2275c3",
    primaryDark: "#0a2f54",
    accentGold: "#e53945",
    accentGoldSoft: "#e5394522",
    bgLight: "#f0f7ff",
    bgSoft: "#e8f2fc",
    cardBg: "#fbfdff",
    borderColor: "#155a9c2e",
    textPrimary: "#122f4d",
    textMuted: "#122f4db3",
    textSoft: "#122f4d66",
    adminShadow: "0 14px 40px rgba(21, 90, 156, 0.1)",
  },
  STORE_5: {
    primary: "#6d2d78",
    primaryLight: "#8d3f9a",
    primaryDark: "#35163d",
    accentGold: "#ff7b72",
    accentGoldSoft: "#ff7b7224",
    bgLight: "#fbf3ff",
    bgSoft: "#f7eafd",
    cardBg: "#fffaff",
    borderColor: "#8d3f9a33",
    textPrimary: "#32183a",
    textMuted: "#32183ab3",
    textSoft: "#32183a66",
    adminShadow: "0 14px 40px rgba(109, 45, 120, 0.1)",
  },
  STORE_6: {
    primary: "#168f6f",
    primaryLight: "#22ad87",
    primaryDark: "#0a3f58",
    accentGold: "#1f7a6d",
    accentGoldSoft: "#168f6f24",
    bgLight: "#f0fbf7",
    bgSoft: "#e4f6f0",
    cardBg: "#fbfffd",
    borderColor: "#168f6f32",
    textPrimary: "#123c45",
    textMuted: "#123c45b3",
    textSoft: "#123c4566",
    adminShadow: "0 14px 40px rgba(22, 143, 111, 0.1)",
  },
  STORE_7: {
    primary: "#8f67c9",
    primaryLight: "#a97be2",
    primaryDark: "#57367f",
    accentGold: "#55bf72",
    accentGoldSoft: "#55bf7226",
    bgLight: "#f8f3ff",
    bgSoft: "#f0e9fb",
    cardBg: "#fffbff",
    borderColor: "#8f67c933",
    textPrimary: "#34234f",
    textMuted: "#34234fb3",
    textSoft: "#34234f66",
    adminShadow: "0 14px 40px rgba(143, 103, 201, 0.1)",
  },
};

const cssVariableMap = {
  primary: "--primary",
  primaryLight: "--primary-light",
  primaryDark: "--primary-dark",
  accentGold: "--accent-gold",
  accentGoldSoft: "--accent-gold-soft",
  bgLight: "--bg-light",
  bgSoft: "--bg-soft",
  cardBg: "--card-bg",
  borderColor: "--border-color",
  textPrimary: "--text-primary",
  textMuted: "--text-muted",
  textSoft: "--text-soft",
  adminShadow: "--admin-shadow",
};

const storeFavicons = {
  STORE_1: "/fav1.png",
  STORE_2: "/fav2.png",
  STORE_3: "/fav3.png",
  STORE_4: "/fav4.png",
  STORE_5: "/fav5.png",
  STORE_6: "/fav6.png",
  STORE_7: "/fav7.png",
};

export function getStoreTheme(admin = {}) {
  if (String(admin?.role || "").toUpperCase() === "SUPER_ADMIN") {
    return superAdminTheme;
  }
  return storeThemes[getStoreLogoKey(admin)] || defaultTheme;
}

export function getStoreFavicon(admin = {}) {
  if (String(admin?.role || "").toUpperCase() === "SUPER_ADMIN") {
    return "/fav1.png";
  }
  return storeFavicons[getStoreLogoKey(admin)] || storeFavicons.STORE_1;
}

export function applyStoreTheme(admin = {}) {
  const theme = getStoreTheme(admin);
  const root = document.documentElement;

  Object.entries(cssVariableMap).forEach(([themeKey, cssVariable]) => {
    root.style.setProperty(cssVariable, theme[themeKey] || defaultTheme[themeKey]);
  });
}

export function applyStoreFavicon(admin = {}) {
  const href = getStoreFavicon(admin);
  const head = document.head;
  let icon = head.querySelector("link[rel='icon']");

  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    head.appendChild(icon);
  }

  icon.type = "image/png";
  icon.href = href;
}
