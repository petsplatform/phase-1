import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Award } from "lucide-react";
import { contentApi } from "../../api/contentApi";

function isAnnouncementVisible(announcement) {
  if (!announcement?.text) return false;
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

const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncement = async () => {
      try {
        const data = await contentApi.getAnnouncement();
        if (isMounted && isAnnouncementVisible(data)) {
          setAnnouncement(data);
        } else if (isMounted) {
          setAnnouncement(null);
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
        if (isMounted) setAnnouncement(null);
      }
    };

    fetchAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  const link = announcement?.link || null;

  const renderAnnouncementContent = () => {
    if (!announcement?.text) {
      return (
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F28C18] shrink-0" />
            <span>Genuine Vet Approved Medicines</span>
          </span>
          <span className="hidden lg:flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#F28C18] shrink-0" />
            <span>100% Guaranteed Quality</span>
          </span>
        </div>
      );
    }

    if (!link) {
      return (
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#F28C18] shrink-0" />
          <span className="truncate">{announcement.text}</span>
        </div>
      );
    }

    const isExternal =
      link.startsWith("http://") || link.startsWith("https://");
    if (isExternal) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:underline hover:text-white/90 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#F28C18] shrink-0" />
          <span className="truncate">{announcement.text}</span>
        </a>
      );
    }

    return (
      <Link
        to={link}
        className="flex items-center gap-1.5 hover:underline hover:text-white/90 transition-colors"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-[#F28C18] shrink-0" />
        <span className="truncate">{announcement.text}</span>
      </Link>
    );
  };

  return (
    <div className="bg-[#0b2d4f] text-white py-2 px-4 border-b border-[#eadfca] select-none relative z-50 text-xs font-medium">
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-5 sm:gap-8">
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <Truck className="h-3.5 w-3.5 text-[#d9aa3d]" />
          <span>Free Shipping on All Orders</span>
        </span>
        <span className="h-4 w-px bg-[#d8cdb7]" />
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <ShieldCheck className="h-3.5 w-3.5 text-[#d9aa3d]" />
          <span>Genuine Vet Approved Medicines</span>
        </span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
