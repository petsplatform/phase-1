import React from "react";

export function ProductCardSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-3xl bg-white animate-pulse"
      style={{
        border: "1.5px solid #e7ddd0",
        boxShadow: "0 4px 20px rgba(28,40,33,0.06)",
      }}
    >
      {/* Image Skeleton */}
      <div className="h-[240px] sm:h-[280px] bg-[#f0ebe3] w-full" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category & Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-16 bg-[#e7ddd0] rounded-full" />
          <div className="h-4 w-10 bg-[#e7ddd0] rounded-full" />
        </div>

        {/* Title */}
        <div className="h-5 w-3/4 bg-[#e7ddd0] rounded-md mb-2" />
        
        {/* Description */}
        <div className="h-3.5 w-full bg-[#f0ebe3] rounded-md mb-1.5" />
        <div className="h-3.5 w-2/3 bg-[#f0ebe3] rounded-md mb-4" />

        {/* Price & Action Footer */}
        <div className="mt-auto pt-3 border-t border-outline/50 flex items-center justify-between gap-2.5">
          <div className="h-6 w-16 bg-[#e7ddd0] rounded-md" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-28 bg-[#e7ddd0] rounded-2xl" />
            <div className="h-9 w-9 bg-[#e7ddd0] rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <main className="bg-white min-h-screen pb-16 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="page-shell px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <div className="h-4 w-48 bg-[#e7ddd0] rounded-md" />
      </div>

      <section className="page-shell px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:gap-10 md:grid-cols-12 p-4 sm:p-8 lg:p-10">
          {/* Gallery Skeleton */}
          <div className="md:col-span-7 min-w-0 space-y-4">
            <div className="h-[360px] sm:h-[460px] bg-[#f0ebe3] rounded-3xl w-full" />
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-20 bg-[#f0ebe3] rounded-2xl" />
              ))}
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="md:col-span-5 min-w-0 space-y-5">
            <div className="h-4 w-24 bg-[#e7ddd0] rounded-full" />
            <div className="h-8 w-4/5 bg-[#e7ddd0] rounded-lg" />
            <div className="h-6 w-1/3 bg-[#e7ddd0] rounded-lg" />
            <div className="h-10 w-full bg-[#f0ebe3] rounded-xl" />
            <div className="h-24 w-full bg-[#f0ebe3] rounded-xl" />
            <div className="h-12 w-full bg-[#e7ddd0] rounded-2xl" />
            <div className="h-12 w-full bg-[#e7ddd0] rounded-2xl" />
          </div>
        </div>
      </section>
    </main>
  );
}

export default ProductCardSkeleton;
