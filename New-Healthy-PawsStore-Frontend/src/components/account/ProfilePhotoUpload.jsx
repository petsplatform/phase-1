import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";

export default function ProfilePhotoUpload({ profile, uploading = false, onUpload }) {
  const inputRef = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (profile.fullName || profile.name || profile.email || "P").trim().charAt(0).toUpperCase() || "P";
  const showImage = profile.avatar && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [profile.avatar]);

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onUpload?.(file);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <aside className="rounded-[16px] border border-borderSoft bg-white p-5 text-center shadow-card sm:p-6">
      <h2 className="text-left font-display text-[19px] font-extrabold text-textMain sm:text-[20px]">Profile Picture</h2>
      <div className="mx-auto mt-6 grid size-24 place-items-center overflow-hidden rounded-full bg-sageLight text-[30px] font-extrabold text-secondaryDark sm:mt-8 sm:size-28 sm:text-[34px]">
        {showImage ? (
          <img
            src={profile.avatar}
            alt="Profile"
            className="size-full rounded-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          initial
        )}
      </div>
      <p className="mx-auto mt-4 max-w-[230px] text-[12px] font-semibold leading-relaxed text-muted sm:mt-5">PNG, JPG or WEBP. Max size 5MB.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleSelectFile}
        disabled={uploading}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex h-10 w-full max-w-[220px] items-center justify-center gap-2 rounded-lg border border-borderSoft px-4 text-[13px] font-extrabold text-secondaryDark transition hover:bg-sageLight disabled:cursor-not-allowed disabled:opacity-60 sm:mt-5 sm:max-w-none sm:px-5"
      >
        <Upload size={16} /> {uploading ? "Uploading..." : "Upload New Photo"}
      </button>
    </aside>
  );
}
