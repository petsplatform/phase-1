import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

const NotFound = () => {
  useEffect(() => {
    document.title = "Page Not Found | Best Vet Care";
  }, []);

  return (
    <div className="min-h-screen bg-[#fffdf7] flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="relative text-center max-w-lg mx-auto">
          {/* Decorative background circles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <span className="absolute -top-16 -left-16 h-40 w-40 rounded-full bg-[#d9aa3d]/10" />
            <span className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-[#17345f]/10" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#d9aa3d]/5" />
          </div>

          {/* 404 Number */}
          <div className="relative">
            <p className="text-[120px] sm:text-[160px] font-black leading-none text-[#17345f]/10 select-none">
              404
            </p>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl" role="img" aria-label="Sad pet">🐾</span>
            </div>
          </div>

          {/* Message */}
          <h1 className="relative mt-4 text-2xl sm:text-3xl font-extrabold text-[#122a50]">
            Oops! Page Not Found
          </h1>
          <p className="relative mt-3 text-base font-medium text-[#122a50b2] max-w-sm mx-auto leading-7">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track!
          </p>

          {/* Action Buttons */}
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#17345f] px-8 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.24)] transition-all duration-200 hover:bg-[#d9aa3d] hover:shadow-lg"
            >
              Go to Home
            </Link>
            <Link
              to="/products"
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-[#17345f1a] bg-white px-8 text-sm font-extrabold text-[#122a50] transition-all duration-200 hover:border-[#d9aa3d] hover:text-[#d9aa3d]"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
