import HeroSection from "../components/Home/HeroSection";
import PromoBannerSection from "../components/Home/PromoBannerSection";
import CategorySection from "../components/Home/CategorySection";
import BestsellerSection from "../components/Home/BestsellerSection";
import BrandsSection from "../components/Home/BrandsSection";
import PetCareTipsSection from "../components/Home/PetCareTipsSection";
import NewsletterSection from "../components/Home/NewsletterSection";
import FAQSection from "../components/Home/FAQSection";

function Home() {
  return (
    <main id="top" className="overflow-hidden ">
      <HeroSection /> 
      <PromoBannerSection />
      <CategorySection />
      <BestsellerSection />
      {/* <BrandsSection /> */}
      <PetCareTipsSection />
      <NewsletterSection />
      <FAQSection />
    </main>
  );
}

export default Home;
