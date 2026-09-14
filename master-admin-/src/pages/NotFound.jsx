import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found | Admin Portal";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Number */}
        <p className="text-[140px] font-black leading-none text-gray-200 select-none tracking-tighter">
          404
        </p>

        <h1 className="mt-2 text-2xl font-bold text-gray-800">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-6">
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
