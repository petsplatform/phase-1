import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

export default function ProductGallery({
  images,
  productTitle,
  productTag,
  discountPercent,
  activeIndex,
  onSelectIndex,
}) {
  const [localActive, setLocalActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const imgs = images && images.length ? images : ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80']

  const active = activeIndex !== undefined && activeIndex < imgs.length ? activeIndex : localActive

  function setActive(val) {
    const nextVal = typeof val === 'function' ? val(active) : val
    setLocalActive(nextVal)
    if (typeof onSelectIndex === 'function') {
      onSelectIndex(nextVal)
    }
  }

  function prev() {
    setActive((a) => (a - 1 + imgs.length) % imgs.length)
  }

  // Helper function to handle thumbnail click
  function selectThumbnail(index) {
    setActive(index)
  }

  function next() {
    setActive((a) => (a + 1) % imgs.length)
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-full min-w-0">
      {/* Thumbnails Sidebar */}
      <div className="order-2 md:order-1 w-full md:w-auto min-w-0 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[580px] hide-scrollbar py-1">
        {imgs.map((src, i) => {
          // If we have more than 6 images and showAll is false, we only show up to index 5
          if (!showAll && imgs.length > 6 && i > 5) return null

          if (!showAll && imgs.length > 6 && i === 5) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => setShowAll(true)}
                className="shrink-0 overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-white p-1 border border-outline hover:border-outline-strong relative"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl bg-[#FAF9F5] flex items-center justify-center p-1 relative">
                  <img src={src} alt="" className="h-full w-full object-contain blur-[2px] opacity-40" />
                  <div className="absolute inset-0 bg-[#2e1a47]/75 flex flex-col items-center justify-center text-white rounded-xl">
                    <span className="text-lg sm:text-xl font-black">+{imgs.length - 5}</span>
                    <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase">MORE</span>
                  </div>
                </div>
              </button>
            )
          }

          const isActive = i === active
          return (
            <button
              key={i}
              type="button"
              onClick={() => selectThumbnail(i)}
              className={`shrink-0 overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer bg-white p-1 border ${
                isActive
                  ? 'border-secondary shadow-[0_8px_20px_rgba(138,114,199,0.15)] scale-102'
                  : 'border-outline hover:border-outline-strong'
              }`}
            >
              <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl bg-[#FAF9F5] flex items-center justify-center p-1">
                <img src={src} alt="" className="h-full w-full object-contain" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Main Image Container */}
      <div
        className="order-1 md:order-2 w-full md:w-auto flex-1 min-w-0 relative overflow-hidden rounded-2xl md:rounded-[32px] bg-white border border-outline shadow-md hover:shadow-lg transition-all duration-300"
      >
        {/* Aspect-square to maximize size and occupy full layout width */}
        <div
          className="relative w-full aspect-square max-h-[580px] bg-[#FAF9F5] select-none overflow-hidden"
          onClick={() => setZoomed(true)}
          style={{ cursor: 'zoom-in' }}
        >
          <img
            src={imgs[active]}
            alt={`${productTitle} view`}
            className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Carousel controls */}
        {imgs.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous Image"
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-secondary shadow-md transition hover:scale-110 active:scale-95 cursor-pointer"
              style={{ border: '1px solid #e7ddd0' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next Image"
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-secondary shadow-md transition hover:scale-110 active:scale-95 cursor-pointer"
              style={{ border: '1px solid #e7ddd0' }}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Zoom Overlay Trigger */}
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Zoom image"
          className="absolute bottom-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-secondary shadow-md transition hover:scale-115 active:scale-95 cursor-pointer"
          style={{ border: '1px solid #e7ddd0' }}
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Lightbox Overlay */}
      {zoomed && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: 'rgba(29,40,35,0.92)', backdropFilter: 'blur(10px)' }}
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <img
              src={imgs[active]}
              alt={productTitle}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomed(false)}
              className="absolute -top-12 right-0 text-white flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer"
            >
              Close ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
