import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = "Admin Portal";
    
    if (path.includes("dashboard")) title = "Dashboard | Admin Portal";
    else if (path.includes("customers")) title = "Customers | Admin Portal";
    else if (path.includes("products/add")) title = "Add Product | Admin Portal";
    else if (path.includes("products/edit")) title = "Edit Product | Admin Portal";
    else if (path.includes("products/view")) title = "View Product | Admin Portal";
    else if (path.includes("products")) title = "Products | Admin Portal";
    else if (path.includes("categories")) title = "Categories | Admin Portal";
    else if (path.includes("orders")) title = "Orders | Admin Portal";
    else if (path.includes("coupons")) title = "Coupons | Admin Portal";
    else if (path.includes("taxes")) title = "Taxes | Admin Portal";
    else if (path.includes("banners")) title = "Banners | Admin Portal";
    else if (path.includes("announcement")) title = "Announcement Bar | Admin Portal";
    else if (path.includes("inquiries")) title = "Inquiries | Admin Portal";
    else if (path.includes("email")) title = "Email Settings | Admin Portal";
    else if (path.includes("select-store")) title = "Select Store | Admin Portal";
    else if (path.includes("login")) title = "Login | Admin Portal";
    
    if (document.title !== title && !document.title.includes("Not Found")) {
      document.title = title;
    }
  }, [location]);

  return null;
}
