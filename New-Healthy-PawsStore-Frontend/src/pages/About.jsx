import AboutHero from "../components/about/AboutHero";
import JourneySection from "../components/about/JourneySection";
import PartnersSection from "../components/about/PartnersSection";
import StatsSection from "../components/about/StatsSection";
import StorySection from "../components/about/StorySection";
import TestimonialsSection from "../components/about/TestimonialsSection";
import ValuesSection from "../components/about/ValuesSection";
import WhyChooseSection from "../components/about/WhyChooseSection";
import Newsletter from "../components/home/Newsletter";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

export default function About() {
  return (
    <div className="min-h-screen bg-white text-textMain">
      <Header />
      <main>
        <AboutHero />
        <StatsSection />
        <StorySection />
        <ValuesSection />
        <WhyChooseSection />
        <JourneySection />

        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
