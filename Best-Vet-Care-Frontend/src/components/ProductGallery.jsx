import { useEffect, useState } from "react";
import { SearchIcon } from "./common/HeaderIcons";
import ImageModal from "./ImageModal";

const ProductGallery = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalImage, setModalImage] = useState(null);
  const selectedImage = images[selectedIndex];
  const imageSignature = images.join("|");

  useEffect(() => {
    setSelectedIndex(0);
  }, [imageSignature]);

  return (
    <section className="grid gap-4 md:grid-cols-[76px_minmax(0,1fr)]">
      <div className="order-2 flex gap-3 overflow-x-auto pb-1 md:order-1 md:flex-col md:overflow-visible md:pb-0">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border bg-white p-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md md:h-[70px] md:w-[70px] ${
              selectedIndex === index
                ? "border-[#d9aa3d] ring-2 ring-[#d9aa3d]/20"
                : "border-[#17345f1a]"
            }`}
            onClick={() => setSelectedIndex(index)}
            aria-label={`View product image ${index + 1}`}
          >
            <img
              src={image}
              alt={`${productName} thumbnail ${index + 1}`}
              className="h-full w-full object-contain"
            />
          </button>
        ))}
      </div>

      <div className="order-1 md:order-2">
        <button
          type="button"
          className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-[#17345f1a] bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl"
          onClick={() => setModalImage(selectedImage)}
          aria-label="Open product image fullscreen"
        >
          <span className="absolute left-4 top-4 rounded-full bg-[#f8f1df] px-3 py-1 text-xs font-extrabold text-[#17345f]">
            {selectedIndex + 1} / {images.length}
          </span>
          <img
            src={selectedImage}
            alt={productName}
            className="h-full max-h-[420px] w-full object-contain transition-all duration-500 group-hover:scale-110"
          />
          <span className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#122a50] shadow-[0_8px_24px_rgba(18,42,80,0.12)] transition-colors group-hover:text-[#d9aa3d]">
            <SearchIcon className="h-5 w-5" />
          </span>
        </button>
      </div>

      <ImageModal
        image={modalImage}
        alt={productName}
        onClose={() => setModalImage(null)}
      />
    </section>
  );
};

export default ProductGallery;
