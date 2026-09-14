import React from "react";
import HeroSection from "./HeroSection";
import Categories from "./Categories";
import FeaturedProducts from "./FeaturedProducts";
import PromoBanner from "./PromoBanner";
import FaqSection from "./FaqSection";

const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Categories Department Directory */}
      <Categories />
      
      {/* Featured Medical & Wellness Supplies (Best Sellers) */}
      <FeaturedProducts />

      {/* Promotional Banner */}
      <PromoBanner />

      {/* FAQ Section */}
      <FaqSection />
    </>
  );
};

export default HomePage;
