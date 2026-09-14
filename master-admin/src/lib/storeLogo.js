import logo1 from "../assets/logo/logo1.png";
import logo2 from "../assets/logo/logo2.png";
import logo3 from "../assets/logo/logo3.png";
import logo4 from "../assets/logo/logo4.png";
import logo5 from "../assets/logo/logo5.png";
import logo6 from "../assets/logo/logo6.png";
import logo7 from "../assets/logo/logo7.png";

const storeLogos = {
  STORE_1: logo1,
  STORE_2: logo2,
  STORE_3: logo3,
  STORE_4: logo4,
  STORE_5: logo5,
  STORE_6: logo6,
  STORE_7: logo7,
};

const logoFitClasses = {
  STORE_1: "max-h-[74px] max-w-[160px] scale-110",
  STORE_2: "max-h-[76px] max-w-[178px]",
  STORE_3: "max-h-[72px] max-w-[168px] scale-125",
  STORE_4: "max-h-[72px] max-w-[168px] scale-110",
  STORE_5: "max-h-[72px] max-w-[160px] scale-125",
  STORE_6: "max-h-[72px] max-w-[160px] scale-125",
  STORE_7: "max-h-[72px] max-w-[168px] scale-115",
};

const getStoreNumber = (value) => {
  if (!value) return null;
  const match = String(value).match(/(?:store|admin)[_-]?(\d+)/i);
  return match?.[1] || null;
};

export const getStoreLogoKey = (admin = {}) => {
  const store = admin.store || {};
  const directKey = String(
    store.storeKey || admin.storeKey || "",
  ).toUpperCase();

  if (storeLogos[directKey]) {
    return directKey;
  }

  const storeNumber =
    getStoreNumber(store.slug) ||
    getStoreNumber(store.primaryDomain) ||
    getStoreNumber(store.id) ||
    getStoreNumber(admin.email);

  const resolvedKey = `STORE_${storeNumber}`;
  return storeLogos[resolvedKey] ? resolvedKey : "STORE_1";
};

export function getStoreLogo(admin = {}) {
  return storeLogos[getStoreLogoKey(admin)];
}

export function getStoreLogoFitClass(admin = {}) {
  return logoFitClasses[getStoreLogoKey(admin)] || logoFitClasses.STORE_1;
}

export function getStoreLogoAlt(admin = {}) {
  return admin.store?.name || admin.name || "Store logo";
}
