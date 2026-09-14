import SEO from "../../components/common/SEO";
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import HeroSection from "./HeroSection";
import StyleHomeSection from "./StyleHomeSection";
import TestimonialsSection from "./TestimonialsSection";
import Offer from "../../components/home/Offer";
import Categories from "../../components/home/Categories";
import TopProduct from "../../components/home/TopProduct";
import CustomerConnect from "../../components/home/CustomerConnect";
import CTASection from "../AboutUs/CTASection";
import CouponOffers from "../../components/coupons/CouponOffers";
import { featureFlags } from "../../config/siteNavigation";

const Home = () => {
  return (
    <>
      <SEO
        title="Best-Vet-Care - Premium Pet Products & Care Essentials"
        description="Shop Best-Vet-Care for premium pet beds, bowls, toys, grooming kits, carriers, collars, treats, and wellness essentials for happy pets."
        ogTitle="Best-Vet-Care - Premium Pet Products & Care Essentials"
        ogDescription="Premium pet beds, toys, grooming kits, bowls, carriers, treats, and everyday care essentials."
      />

      <div className="flex flex-col min-h-screen bg-background-white">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section with margin */}
          <div className="mx-4 mt-4 sm:mt-5 sm:mx-5 lg:mx-[22px]">
            <HeroSection />
          </div>
          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[84px]">
            <Offer />
          </div>

      {/*  <CouponOffers
            title="Coupons & Discounts"
            subtitle="View active coupons and see how much your current cart can save before checkout."
          /> */}

          {/* Temporarily hidden while Customer Care Price Match and Feedback are paused. */}
          {featureFlags.priceMatchFeedback && (
            <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[84px]">
              <CustomerConnect />
            </div>
          )}

          {/* Statistics Section */}
          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[84px]">
            <Categories />
          </div>

          {/* Popular Categories Section */}
          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[80px]">
            <TopProduct />
          </div>

          {/* Style Home Section */}
          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[80px]">
            <StyleHomeSection />
          </div>

          {/* Testimonials Section */}
          {/* <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[80px]">
            <TestimonialsSection />
          </div> */}

          <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[80px]">
            <CTASection />
          </div>
        </main>

        {/* Footer */}
        <div className="mt-12 sm:mt-16 md:mt-20 lg:mt-[80px]">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Home;
