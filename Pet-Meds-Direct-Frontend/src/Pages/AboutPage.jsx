import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// Section Components
import Hero from "../components/About/Hero";
import OurStory from "../components/About/OurStory";
import MissionVision from "../components/About/MissionVision";
import WhyChooseUs from "../components/About/WhyChooseUs";
import CoreValues from "../components/About/CoreValues";
import Statistics from "../components/About/Statistics";
import HowWeWork from "../components/About/HowWeWork";
import Newsletter from "../components/About/Newsletter";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen  overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-xs sm:text-sm font-bold text-slate-500 text-left">
          <Link to="/" className="hover:text-primary-green transition-colors">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-deep-navy">About Us</span>
        </div>
      </div>

      {/* Main Sections Assembly */}
      <div className="space-y-4">
        {/* 1. Hero Banner */}
        <Hero />

        {/* 2. Our Story */}
        <OurStory />

        {/* 3. Mission & Vision */}
        <MissionVision />

        {/* 4. Statistics */}
        <Statistics />

        {/* 5. Why Choose Us */}
        <WhyChooseUs />

        {/* 6. Core Values */}
        <CoreValues />

        {/* 7. How We Work */}
        <HowWeWork />

        {/* 8. Newsletter */}
        {/* <Newsletter /> */}
      </div>
    </div>
  );
}
