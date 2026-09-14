import { useEffect, useState, useRef } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { contentApi } from "../api/contentApi";

function isAnnouncementVisible(announcement) {
  if (!announcement?.text && !announcement?.message) return false;
  if (String(announcement.status || "Active").toLowerCase() !== "active")
    return false;

  const now = Date.now();
  const startsAt = announcement.startDate
    ? new Date(announcement.startDate).getTime()
    : null;
  const endsAt = announcement.endDate
    ? new Date(announcement.endDate).getTime()
    : null;

  if (Number.isFinite(startsAt) && startsAt > now) return false;
  if (Number.isFinite(endsAt) && endsAt < now) return false;
  return true;
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState(null);
  const [isAnnouncementOverflowing, setIsAnnouncementOverflowing] = useState(false);
  const announcementContainerRef = useRef(null);
  const announcementTextRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    contentApi
      .getStoreContent()
      .then((content) => {
        if (!isMounted) return;
        const ann = content?.announcement;
        setAnnouncement(isAnnouncementVisible(ann) ? ann : null);
      })
      .catch(() => {
        if (isMounted) setAnnouncement(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const text = announcement?.text || announcement?.message || "Genuine Vet Approved Medicines";
  const link = announcement?.link || null;

  useEffect(() => {
    const checkAnnouncementOverflow = () => {
      if (announcementContainerRef.current && announcementTextRef.current) {
        const containerWidth = announcementContainerRef.current.clientWidth;
        const textWidth = announcementTextRef.current.scrollWidth;
        setIsAnnouncementOverflowing(textWidth > containerWidth - 16);
      }
    };

    checkAnnouncementOverflow();
    window.addEventListener("resize", checkAnnouncementOverflow);

    let resizeObserver;
    if (announcementContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(checkAnnouncementOverflow);
      resizeObserver.observe(announcementContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkAnnouncementOverflow);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [text]);

  const renderContent = () => {
    if (link) {
      const isExternal = link.startsWith("http");
      return (
        <a
          href={link}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer" : undefined}
          className="hover:underline font-semibold cursor-pointer"
        >
          {text}
        </a>
      );
    }
    return <span>{text}</span>;
  };

  return (
    <div className="bg-brand-teal text-white text-xs py-2 px-4 select-none border-b border-white/10 overflow-hidden relative z-50">
      <div
        ref={announcementContainerRef}
        className="max-w-7xl mx-auto flex items-center justify-center text-center relative min-h-[22px]"
      >
        <span
          ref={announcementTextRef}
          className="absolute invisible whitespace-nowrap text-xs font-semibold pointer-events-none opacity-0"
          aria-hidden="true"
        >
          {text}
        </span>

        <div className="flex min-w-0 items-center justify-center text-center overflow-hidden w-full">
          {isAnnouncementOverflowing ? (
            <div className="animate-scroll-ticker flex gap-12 text-xs font-medium text-white/90">
              <span className="flex items-center gap-1.5 shrink-0">
                <ShieldCheck size={14} className="text-brand-golden shrink-0" />
                {renderContent()}
              </span>
              <span className="flex items-center gap-1.5 shrink-0">
                <ShieldCheck size={14} className="text-brand-golden shrink-0" />
                {renderContent()}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 truncate font-medium text-white/90">
              <ShieldCheck size={14} className="text-brand-golden shrink-0" />
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
