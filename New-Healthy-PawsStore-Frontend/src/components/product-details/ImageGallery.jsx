import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ZoomIn } from "lucide-react";

export default function ImageGallery({ mainImage, title, discount, allImages }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = allImages?.length ? allImages : [mainImage, mainImage, mainImage, mainImage].filter(Boolean);

  useEffect(() => {
    setActiveIdx(0);
  }, [mainImage, allImages]);

  return (
    <div className="flex gap-5">
      <div className="flex w-[64px] shrink-0 flex-col gap-3">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIdx(idx)}
            className={`flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-xl border bg-white transition-colors ${
              idx === activeIdx
                ? "border-orange"
                : "border-borderSoft hover:border-secondary/50"
            }`}
          >
            <img
              src={img}
              alt={`${title} thumbnail ${idx + 1}`}
              className="h-full w-full object-contain p-1"
            />
          </button>
        ))}
        {/* <button
          type="button"
          aria-label="More images"
          className="flex h-8 w-[64px] items-center justify-center text-muted transition-colors hover:text-textMain"
        >
          <ChevronDown size={20} />
        </button> */}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative flex min-h-[430px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-borderSoft bg-white shadow-[0_8px_24px_rgba(20,61,60,0.08)]"
      >
        <span className="absolute left-4 top-4 z-10 rounded-xl bg-softCream px-4 py-1 text-[13px] font-extrabold text-primaryDark">
          {activeIdx + 1}/{images.length}
        </span>

        <img
          src={images[activeIdx]}
          alt={title}
          className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] rounded-xl object-contain"
        />

        <button
          type="button"
          aria-label="Zoom image"
          className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-primaryDark shadow-[0_10px_26px_rgba(20,61,60,0.14)] transition hover:bg-sageLight"
        >
          <ZoomIn size={18} />
        </button>
      </motion.div>
    </div>
  );
}
