import React from "react";
import HeroSection from "../components/HeroSection";
import ShopByCategory from "../components/Home/ShopByCategory";
import BestSellers from "../components/Home/BestSellers";
import PromotionalOfferBanner from "../components/Home/PromotionalOfferBanner";
import FAQSection from "../components/Home/FAQSection";

export default function Home({
  wishlist,
  onToggleWishlist,
  onAddToCart,
  products,
  loading = false,
}) {
  return (
    <>
      <HeroSection />
      <ShopByCategory />
      <BestSellers
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        onAddToCart={onAddToCart}
        products={products}
        loading={loading}
      />
      <PromotionalOfferBanner />
      <FAQSection />
    </>
  );
}
