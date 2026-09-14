import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = "Best Vet Care";
    
    if (path === "/") title = "Home | Best Vet Care";
    else if (path.includes("/shop")) title = "Shop | Best Vet Care";
    else if (path.includes("/products")) title = "Products | Best Vet Care";
    else if (path.includes("/product/")) title = "Product Details | Best Vet Care";
    else if (path.includes("/collection")) title = "Collections | Best Vet Care";
    else if (path.includes("/about")) title = "About Us | Best Vet Care";
    else if (path.includes("/login")) title = "Login | Best Vet Care";
    else if (path.includes("/register")) title = "Register | Best Vet Care";
    else if (path.includes("/account/orders")) title = "My Orders | Best Vet Care";
    else if (path.includes("/account/addresses")) title = "Saved Addresses | Best Vet Care";
    else if (path.includes("/account/details")) title = "Account Details | Best Vet Care";
    else if (path.includes("/account")) title = "My Account | Best Vet Care";
    else if (path.includes("/wishlist")) title = "Wishlist | Best Vet Care";
    else if (path.includes("/cart")) title = "Shopping Cart | Best Vet Care";
    else if (path.includes("/contact")) title = "Contact Us | Best Vet Care";
    else if (path.includes("/privacy-policy")) title = "Privacy Policy | Best Vet Care";
    else if (path.includes("/terms-conditions")) title = "Terms & Conditions | Best Vet Care";
    else if (path.includes("/return-policy")) title = "Return Policy | Best Vet Care";
    else if (path.includes("/checkout")) title = "Checkout | Best Vet Care";
    else if (path.includes("/order-success")) title = "Order Success | Best Vet Care";
    else if (path.includes("/track-order")) title = "Track Order | Best Vet Care";
    
    // Fallbacks or individual component overrides will supersede this
    if (document.title !== title && !document.title.includes("Not Found")) {
      document.title = title;
    }
  }, [location]);

  return null;
}
