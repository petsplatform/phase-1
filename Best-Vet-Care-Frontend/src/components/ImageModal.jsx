import { XIcon } from "./common/HeaderIcons";

const ImageModal = ({ image, alt, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close image modal backdrop"
      />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-4xl items-center justify-center rounded-2xl bg-white p-4 shadow-2xl transition-all duration-300">
        <button
          type="button"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#122a50] shadow-[0_8px_24px_rgba(18,42,80,0.14)] transition-colors hover:text-[#d9aa3d]"
          onClick={onClose}
          aria-label="Close image modal"
        >
          <XIcon className="h-5 w-5" />
        </button>
        <img
          src={image}
          alt={alt}
          className="max-h-[80vh] w-full rounded-xl object-contain"
        />
      </div>
    </div>
  );
};

export default ImageModal;
