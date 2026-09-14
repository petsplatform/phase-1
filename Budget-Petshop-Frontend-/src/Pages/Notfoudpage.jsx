import React from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

function NotFoundPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center select-none"
      style={{
        background: "linear-gradient(180deg, #FBF7F0 0%, #F5EFE4 100%)",
      }}
    >
      <div className="max-w-md w-full">
        {/* Huge professional 404 text */}
        <h1 className="text-[120px] font-extrabold leading-none tracking-tight text-secondary">
          404
        </h1>

        {/* Title */}
        <h2 className="mt-4 text-2xl font-bold text-on-background sm:text-3xl">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="mt-4 text-sm leading-relaxed text-charcoal-text">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable. Please verify the URL or
          return to our homepage.
        </p>

        {/* Back to Home Button (Only one button) */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-secondary btn-primary-link px-8 py-3.5 text-sm font-semibold text-white shadow-md "
          >
            <Home size={16} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;
