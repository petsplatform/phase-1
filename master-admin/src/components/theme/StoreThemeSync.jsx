import { useEffect } from "react";
import { getAdminProfile } from "../../lib/api";
import { SUPER_ADMIN_STORE_EVENT } from "../../lib/superAdminStore";
import { applyStoreFavicon, applyStoreTheme } from "../../lib/storeTheme";

export default function StoreThemeSync() {
  useEffect(() => {
    const syncTheme = () => {
      const adminProfile = getAdminProfile();
      applyStoreTheme(adminProfile);
      applyStoreFavicon(adminProfile);
    };

    syncTheme();
    window.addEventListener("admin-auth-change", syncTheme);
    window.addEventListener(SUPER_ADMIN_STORE_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      window.removeEventListener("admin-auth-change", syncTheme);
      window.removeEventListener(SUPER_ADMIN_STORE_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return null;
}
