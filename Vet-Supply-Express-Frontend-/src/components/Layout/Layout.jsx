import React from "react";
import { useLocation } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Footer from "./Footer";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "../Search/SearchOverlay";
import ToastContainer from "../Common/ToastContainer";

const Layout = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden">
      {/* Scrollable announcement bar at the absolute top */}
      <AnnouncementBar />
      
      {/* Sticky brand header */}
      <Header />
      
      {/* Interactive Overlay Drawer Panels */}
      <MobileMenu />
      <SearchOverlay />
      <ToastContainer />
      
      {/* Primary child pages router container */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Dark premium footer */}
      {!location.pathname.startsWith("/account") && <Footer />}
    </div>
  );
};

export default Layout;
