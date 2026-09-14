import logo1 from "../assets/logo/logo1.png";
import logo2 from "../assets/logo/logo2.png";
import logo3 from "../assets/logo/logo3.png";
import logo4 from "../assets/logo/logo4.png";
import logo5 from "../assets/logo/logo5.png";
import logo6 from "../assets/logo/logo6.png";
import logo7 from "../assets/logo/logo7.png";

export const ALL_STORES_KEY = "ALL_STORES";
export const SUPER_ADMIN_STORE_KEY = "super_admin_selected_store";
export const SUPER_ADMIN_STORE_EVENT = "super-admin-store-change";

const logos = {
  STORE_1: logo1,
  STORE_2: logo2,
  STORE_3: logo3,
  STORE_4: logo4,
  STORE_5: logo5,
  STORE_6: logo6,
  STORE_7: logo7,
};

export const fallbackStores = Array.from({ length: 7 }, (_, index) => {
  const number = index + 1;
  return {
    id: `STORE_${number}`,
    storeKey: `STORE_${number}`,
    name: `Store ${number}`,
    logo: logos[`STORE_${number}`],
  };
});

export function normalizeSuperAdminStore(store = {}, index = 0) {
  const storeKey = String(store.storeKey || store.key || `STORE_${index + 1}`).toUpperCase();
  return {
    ...store,
    id: store.id || storeKey,
    storeKey,
    name: store.name || store.storeName || `Store ${index + 1}`,
    logo: logos[storeKey] || logos.STORE_1,
  };
}

export function getSelectedSuperAdminStore() {
  return localStorage.getItem(SUPER_ADMIN_STORE_KEY) || "";
}

export function setSelectedSuperAdminStore(storeKey) {
  const nextKey = storeKey || "";
  if (nextKey) {
    localStorage.setItem(SUPER_ADMIN_STORE_KEY, nextKey);
  } else {
    localStorage.removeItem(SUPER_ADMIN_STORE_KEY);
  }
  window.dispatchEvent(new CustomEvent(SUPER_ADMIN_STORE_EVENT, { detail: nextKey }));
}

export function clearSelectedSuperAdminStore() {
  setSelectedSuperAdminStore("");
}

export function isAllStoresSelected(storeKey = getSelectedSuperAdminStore()) {
  return !storeKey || storeKey === ALL_STORES_KEY;
}

export function filterBySelectedStore(items = [], selectedStoreKey = getSelectedSuperAdminStore()) {
  if (isAllStoresSelected(selectedStoreKey)) return items;
  const normalizedSelectedKey = String(selectedStoreKey || "").toUpperCase();
  return items.filter((item) => {
    const itemStoreKey = String(item.storeKey || item.store?.storeKey || "").toUpperCase();
    return itemStoreKey === normalizedSelectedKey;
  });
}
