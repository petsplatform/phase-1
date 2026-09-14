import BlogSection from "../components/home/BlogSection";
import BrandSection from "../components/home/BrandSection";
import CategorySection from "../components/home/CategorySection";
import FeaturedProducts from "../components/home/FeaturedProducts";
import HeroSection from "../components/home/HeroSection";
import HomeBanners from "../components/home/HomeBanners";
import NaturalFoodSection from "../components/home/NaturalFoodSection";
import Newsletter from "../components/home/Newsletter";
import NutritionSection from "../components/home/NutritionSection";
import OfferBanners from "../components/home/OfferBanners";
import SeasonalSaleSection from "../components/home/SeasonalSaleSection";
import TrustSection from "../components/home/TrustSection";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-textMain">
      <Header />
      <main>
        <HeroSection />
        <HomeBanners />
        <CategorySection />
        <FeaturedProducts />
        <NutritionSection />
        <OfferBanners />
        <TrustSection />
        <BrandSection />
        {/* <BlogSection /> */}
        {/* <SeasonalSaleSection /> */}
        <NaturalFoodSection />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
