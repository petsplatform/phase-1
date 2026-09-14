import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Search, PawPrint } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-16 px-4 font-sans overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-10 left-10 -z-10 w-72 h-72 bg-primary-green/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 -z-10 w-80 h-80 bg-medical-teal/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -z-10 w-40 h-40 bg-light-green/15 rounded-full blur-2xl pointer-events-none" />

      {/* Floating Paw Prints */}
      <div className="absolute top-[15%] left-[12%] opacity-[0.06] animate-bounce-slow pointer-events-none">
        <PawPrint className="h-16 w-16 text-deep-navy rotate-[-25deg]" />
      </div>
      <div className="absolute top-[20%] right-[15%] opacity-[0.05] animate-bounce-slow-delayed pointer-events-none">
        <PawPrint className="h-12 w-12 text-primary-green rotate-[15deg]" />
      </div>
      <div className="absolute bottom-[25%] left-[20%] opacity-[0.04] animate-float pointer-events-none">
        <PawPrint className="h-10 w-10 text-medical-teal rotate-[40deg]" />
      </div>
      <div className="absolute bottom-[15%] right-[10%] opacity-[0.06] animate-bounce-slow pointer-events-none">
        <PawPrint className="h-14 w-14 text-deep-navy rotate-[-10deg]" />
      </div>

      <div className="text-center max-w-lg mx-auto">
        {/* 404 Number */}
        <div className="relative mb-6">
          <h1 className="text-[140px] sm:text-[180px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-deep-navy/15 to-deep-navy/5 font-display select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-soft-mint border border-primary-green/15 shadow-lg shadow-primary-green/10">
              <PawPrint className="h-10 w-10 sm:h-12 sm:w-12 text-primary-green" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base font-semibold text-deep-navy/55 leading-relaxed mb-10 max-w-md mx-auto">
          Oops! Looks like this page has wandered off. It might have been moved, deleted, or the URL might be incorrect.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-xl bg-primary-green px-8 py-3.5 text-sm font-bold text-white hover:bg-dark-green transition-all hover:shadow-lg hover:shadow-primary-green/20 hover:-translate-y-0.5"
          >
            <Home className="h-4.5 w-4.5" />
            Back to Home
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-2.5 rounded-xl border border-deep-navy/12 bg-white px-8 py-3.5 text-sm font-bold text-deep-navy hover:bg-slate-50 transition-all hover:-translate-y-0.5"
          >
            <Search className="h-4.5 w-4.5" />
            Browse Products
          </Link>
        </div>

        {/* Help Link */}
        <p className="mt-8 text-xs font-semibold text-deep-navy/40">
          Need help?{" "}
          <Link
            to="/contact"
            className="text-medical-teal hover:text-dark-green font-bold transition-colors underline underline-offset-2"
          >
            Contact our support team
          </Link>
        </p>
      </div>
    </div>
  );
}
