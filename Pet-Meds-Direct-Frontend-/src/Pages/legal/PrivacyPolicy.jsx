import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Shield, User, Share2, FileText, Lock, Clock, Info } from "lucide-react";
import { privacyData } from "../../data/legal";

export default function PrivacyPolicy() {
  const [activeTab, setActiveTab] = useState("collection");

  const getTabIcon = (iconName) => {
    switch (iconName) {
      case "User":
        return <User className="h-4.5 w-4.5" />;
      case "Shield":
        return <Shield className="h-4.5 w-4.5" />;
      case "Share2":
        return <Share2 className="h-4.5 w-4.5" />;
      case "FileText":
        return <FileText className="h-4.5 w-4.5" />;
      default:
        return <Info className="h-4.5 w-4.5" />;
    }
  };

  const currentTabData = privacyData.tabs.find((t) => t.id === activeTab) || privacyData.tabs[0];

  return (
    <div className="relative min-h-screen py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1200px]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-xs sm:text-sm font-bold text-slate-500 text-left">
          <Link to="/" className="hover:text-primary-green transition-colors">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-deep-navy">Privacy Policy</span>
        </div>

        {/* Header Section */}
        <div className="text-center flex flex-col items-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-deep-navy bg-white border border-[#e5e9ec] shadow-xs w-fit mb-5">
            <Lock className="h-3.5 w-3.5 text-primary-green" /> Privacy Protection
          </span>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight leading-[1.15] mb-5 max-w-3xl">
            We value your <span className="text-primary-green font-display">privacy</span> as much as you do.
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-slate-500 mb-6">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-medical-teal" /> Last Updated: {privacyData.lastUpdated}
            </span>
            <span className="h-1.5 w-1.5 bg-slate-300 rounded-full" />
            <span>100% HIPAA & Pharmacy Compliant</span>
          </div>

          <p className="text-slate-600 font-medium text-sm sm:text-base lg:text-lg leading-relaxed max-w-3xl">
            {privacyData.intro}
          </p>
        </div>

        {/* Tabbed Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Tab Navigation Column */}
          <div className="lg:col-span-4 flex flex-col gap-2 w-full">
            <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase text-left pl-4 mb-2 block">
              Policy Segments
            </span>

            {/* Desktop and Mobile Flex Box for Tabs */}
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-2 scrollbar-none">
              {privacyData.tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 shrink-0 text-left cursor-pointer border ${
                      isActive
                        ? "bg-deep-navy border-deep-navy text-white shadow-md lg:translate-x-1"
                        : "bg-white border-[#e5e9ec] text-slate-600 hover:text-deep-navy hover:border-slate-300"
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg shrink-0 ${isActive ? "bg-white/10 text-primary-green" : "bg-slate-50 text-slate-400"}`}>
                      {getTabIcon(tab.icon)}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Tab Content Column */}
          <div className="lg:col-span-8 bg-white border border-[#e5e9ec] rounded-[2rem] p-6 sm:p-8 lg:p-10 shadow-xs text-left min-h-[450px] transition-all duration-300">
            <div className="flex flex-col h-full justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold text-deep-navy mb-3 flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-primary-green/10 text-primary-green inline-block">
                    {getTabIcon(currentTabData.icon)}
                  </span>
                  {currentTabData.title}
                </h2>
                
                <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed mb-8 border-b border-slate-100 pb-5">
                  {currentTabData.description}
                </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {currentTabData.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50 transition-all hover:bg-slate-50">
                      <h4 className="text-deep-navy font-extrabold text-sm sm:text-base mb-2">
                        {item.heading}
                      </h4>
                      <p className="text-slate-600 font-medium text-xs sm:text-sm leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pharmacy Guarantee Banner at the bottom of panel */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary-green shrink-0" />
                  <span className="text-xs font-bold text-slate-500">
                    Your vet records are protected under pharmacy safety guidelines.
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#008b8b] bg-sky-blue/30 px-2.5 py-1 rounded-md shrink-0">
                  Secure Data Shield
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Highlights Banner */}
        <div className="bg-[#eaf5f8] rounded-[2rem] border border-sky-blue/30 p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center text-left">
          <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs text-medical-teal">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-deep-navy font-extrabold text-base sm:text-lg mb-2">
              Privacy Compliance Team
            </h3>
            <p className="text-slate-600 font-medium text-sm leading-relaxed">
              If you have any questions about how we manage your information, or if you want to request data deletion, please contact our privacy compliance department at <a href="mailto:privacy@petmedsdirect.com" className="text-primary-green font-bold hover:underline">privacy@petmedsdirect.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
