import { useEffect, useState } from "react";
import { contentApi } from "../../api/contentApi";

const DISMISS_KEY = "petcare_announcement_dismissed";

const isWithinDateRange = (announcement) => {
  const now = new Date();
  if (announcement.startDate && new Date(announcement.startDate) > now) return false;
  if (announcement.endDate && new Date(announcement.endDate) < now) return false;
  return true;
};

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

const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    contentApi
      .getAnnouncement()
      .then((data) => {
        if (cancelled || !data) return;
        setAnnouncement(data);
        setDismissed(getDismissedId() === `${data.id}-${data.updatedAt}`);
      })
      .catch(() => {
        // No announcement configured, or the endpoint is unreachable - render nothing
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!announcement || dismissed) return null;
  if (announcement.status !== "Active") return null;
  if (!isWithinDateRange(announcement)) return null;

  const handleDismiss = () => {
    setDismissedId(`${announcement.id}-${announcement.updatedAt}`);
    setDismissed(true);
  };

  const content = (
    <span className="min-w-0 break-words">{announcement.text}</span>
  );

  return (
    <div className="w-full bg-[#122a50] text-white">
      <div className="mx-auto flex max-w-[1440px] min-w-0 items-center justify-center gap-3 px-4 py-2 text-center text-[12px] font-medium sm:text-[13px]">
        {announcement.link ? (
          <a href={announcement.link} className="min-w-0 underline-offset-2 hover:underline">
            {content}
          </a>
        ) : (
          content
        )}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
