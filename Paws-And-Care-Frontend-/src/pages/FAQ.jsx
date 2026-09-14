import React, { useState } from "react";
import FAQHero from "../components/faq/FAQHero";
import FAQCategories from "../components/faq/FAQCategories";
import FAQAccordion from "../components/faq/FAQAccordion";
import PopularHelp from "../components/faq/PopularHelp";
import SupportCTA from "../components/faq/SupportCTA";

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="bg-brand-bg min-h-screen pb-12 font-sans antialiased">
      {/* 1. FAQ Hero */}
      <FAQHero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* 3. FAQ Accordion list */}
      <FAQAccordion searchQuery={searchQuery} activeCategory={activeCategory} />
    </div>
  );
}
