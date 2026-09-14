import SEO from "../../components/common/SEO";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import HeroSection from "./HeroSection";
import WhyCollectionsSection from "./WhyCollectionsSection";
import StylePetCareSection from "./StylePetCareSection";
import CuratedProductsSection from "./CuratedProductsSection";
import CollectionsForHomeSection from "./CollectionsForHomeSection";
import CTASection from "./CTASection";

const Collectionspage = () => {
  return (
    <>
      <SEO
        title="Pet Care Collections | Best-Vet-Care"
        description="Explore handpicked pet care collections for feeding, grooming, comfort, travel, play, and everyday wellness."
        ogTitle="Pet Care Collections | Best-Vet-Care"
        ogDescription="Handpicked pet care collections for feeding, grooming, comfort, travel, play, and wellness."
      />

      <div className="flex w-full flex-col bg-background-white">
        <Header />
        <main className="w-full">
          <HeroSection />
          <WhyCollectionsSection />
          <StylePetCareSection />
          <CuratedProductsSection />
          <CollectionsForHomeSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Collectionspage;
