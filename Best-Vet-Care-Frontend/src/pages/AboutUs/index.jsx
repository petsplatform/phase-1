import SEO from "../../components/common/SEO";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import HeroSection from "./HeroSection";
import CompanyStory from "./CompanyStory";
import TeamSection from "./TeamSection";
import ValuesSection from "./ValuesSection";
import CTASection from "./CTASection";

const AboutUs = () => {
  return (
    <>
      <SEO
        title="About Best-Vet-Care | Premium Pet Care Essentials"
        description="Learn about Best-Vet-Care, a pet-care shop built around safe essentials, daily comfort, simple routines, and happier pets."
        ogTitle="About Best-Vet-Care | Premium Pet Care Essentials"
        ogDescription="Safe pet essentials, cozy comfort products, grooming, feeding, travel, and play collections for happier pets."
      />

      <div className="flex min-h-screen flex-col bg-background-white">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <CompanyStory />
          <TeamSection />
          <ValuesSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AboutUs;
