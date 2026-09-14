import { useEffect, useState } from "react";
import HeroSection from "../components/home/HeroSection.jsx";
import CategoryComponent from "../components/home/CategoryComponent.jsx";
import BestsellerComponent from "../components/home/BestsellerComponent.jsx";
import WhyChooseUs from "../components/home/WhyChooseUs.jsx";
import TrustSection from "../components/home/TrustSection.jsx";
import FaqComponent from "../components/home/FaqComponent.jsx";
import { contentApi } from "../api/contentApi.js";

export default function Home() {
  const [homeBanners, setHomeBanners] = useState([]);

  useEffect(() => {
    let active = true;

    contentApi
      .getHomeBanners()
      .then((banners) => {
        if (active) setHomeBanners(banners);
      })
      .catch((error) => {
        console.error("Failed to load home banners:", error);
        if (active) setHomeBanners([]);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex-grow">
      <HeroSection />
      <CategoryComponent />
      <BestsellerComponent />
      <WhyChooseUs />
      <TrustSection banners={homeBanners} />
      <FaqComponent />
    </main>
  );
}
