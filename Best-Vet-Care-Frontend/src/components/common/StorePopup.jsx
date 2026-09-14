import { useEffect, useState } from "react";
import { contentApi } from "../../api/contentApi";
import { XIcon } from "./HeaderIcons";

const DISMISS_KEY = "petcare_popup_dismissed";

const getDismissedId = () => {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
};

const setDismissedId = (value) => {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, value);
  } catch {
    // sessionStorage unavailable (e.g. private browsing) - dismissal just won't persist
  }
};

const StorePopup = () => {
  const [popup, setPopup] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    contentApi
      .getStoreContent()
      .then((data) => {
        if (cancelled || !data?.popup) return;
        setPopup(data.popup);
        setDismissed(getDismissedId() === `${data.popup.id}-${data.popup.updatedAt}`);
      })
      .catch(() => {
        // No popup configured, or the endpoint is unreachable - render nothing
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!popup || dismissed) return null;
  if (popup.status !== "Active") return null;
  if (!popup.title && !popup.message) return null;

  const handleClose = () => {
    setDismissedId(`${popup.id}-${popup.updatedAt}`);
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
        aria-label="Close popup backdrop"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#122a50] shadow-[0_8px_24px_rgba(18,42,80,0.14)] transition-colors hover:text-[#d9aa3d]"
          onClick={handleClose}
          aria-label="Close popup"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {popup.image && (
          <img src={popup.image} alt="" className="h-48 w-full object-cover" aria-hidden="true" />
        )}

        <div className="flex flex-col items-start gap-3 p-6">
          {popup.title && (
            <h3 className="text-xl font-semibold text-[#122a50]" style={{ fontFamily: "Plus Jakarta Sans" }}>
              {popup.title}
            </h3>
          )}
          {popup.message && (
            <p className="text-sm text-[#122a50b2]" style={{ fontFamily: "Plus Jakarta Sans" }}>
              {popup.message}
            </p>
          )}
          {popup.buttonText && (
            <a
              href={popup.link || "/products"}
              className="mt-1 flex h-11 items-center justify-center rounded-full bg-[#17345f] px-6 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d9aa3d]"
              style={{ fontFamily: "Plus Jakarta Sans" }}
            >
              {popup.buttonText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorePopup;
