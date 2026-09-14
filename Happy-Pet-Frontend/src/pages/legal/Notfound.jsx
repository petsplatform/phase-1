import React from "react";
import { Link } from "react-router-dom";
import { Home, PawPrint } from "lucide-react";

function Notfound() {
  return (
    <div
      className="min-h-screen flex flex-col justify-between text-brand-purple relative overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(135deg, #FFF7EF 0%, #F5EEFC 50%, #FFEBE6 100%)",
      }}
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-brand-peach/15 blur-[80px] sm:blur-[120px] pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-brand-purple/5 blur-[90px] sm:blur-[140px] pointer-events-none animate-pulse duration-[8000ms]"></div>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 relative z-10">
        <div className="max-w-xl w-full text-center bg-white/40 backdrop-blur-xl border border-white/50 rounded-3xl p-8 sm:p-12 md:p-16 shadow-xl relative overflow-hidden">
          {/* Visual Icon Container */}
          <div className="flex justify-center mb-8 relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-brand-purple text-brand-cream flex items-center justify-center shadow-lg relative animate-bounce duration-[4000ms]">
              <PawPrint className="w-10 h-10 sm:w-12 sm:h-12 text-brand-peach animate-pulse" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-peach border-2 border-white animate-ping"></div>
            </div>
          </div>

          {/* 404 Large Text */}
          <div className="text-6xl sm:text-7xl font-extrabold font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-brand-purple via-brand-brown to-brand-peach mb-2">
            404
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight leading-tight mb-4 text-brand-purple">
            Oops! This Page is Off the Leash
          </h1>

          {/* Description */}
          <p className="text-sm font-medium text-brand-brown/80 max-w-sm mx-auto leading-relaxed mb-8">
            We couldn't find the page you're looking for. It might have run off
            to chase a squirrel, or the URL might be incorrect.
          </p>

          {/* Back to Home Button - using secondary color (brand-peach) */}
          <div className="flex justify-center">
            <Link
              to="/"
              className="bg-brand-purple hover:bg-brand-purple/80 hover:scale-[1.02] active:scale-98 text-brand-cream font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer hover:shadow-lg"
            >
              <Home className="w-4.5 h-4.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-6 relative z-10 text-center">
        <p className="text-[11px] font-semibold text-brand-brown/50">
          © {new Date().getFullYear()} HappyPet Rx. All rights reserved. Developed By{" "}
          <a
            href="https://techrabbit.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand-purple hover:underline transition-colors"
          >
            Tech Rabbit
          </a>
        </p>
      </footer>
    </div>
  );
}

export default Notfound;
