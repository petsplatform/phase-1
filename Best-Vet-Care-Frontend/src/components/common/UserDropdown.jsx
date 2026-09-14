import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  HeartIcon,
  HelpIcon,
  LockIcon,
  LogoutIcon,
  MapPinIcon,
  PackageIcon,
  TruckIcon,
  UserIcon,
} from "./HeaderIcons";

const dropdownGroups = [
  [
    { label: "My Dashboard", icon: UserIcon, to: "/account" },
    { label: "My Orders", icon: PackageIcon, to: "/account/orders" },
    { label: "Wishlist", icon: HeartIcon, to: "/wishlist" },
    { label: "Saved Addresses", icon: MapPinIcon, to: "/account/addresses" },
    { label: "Account Details", icon: LockIcon, to: "/account/details" },
    { label: "Order Tracking", icon: TruckIcon, to: "/track-order" },
  ],
  [
    { label: "Support", icon: HelpIcon, to: "/contact" },
  ],
  [{ label: "Logout", icon: LogoutIcon, danger: true }],
];

const UserDropdown = ({ open, onClose, containerRef, onLogout }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      const clickedDropdown =
        dropdownRef.current && dropdownRef.current.contains(target);
      const clickedContainer =
        containerRef?.current && containerRef.current.contains(target);

      if (!clickedDropdown && !clickedContainer) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [containerRef, open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-[calc(100%+12px)] z-50 w-[280px] rounded-2xl border border-[#17345f1a] bg-white p-2 shadow-[0_18px_50px_rgba(18,42,80,0.14)]"
      role="menu"
      aria-label="User menu"
    >
      {dropdownGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {groupIndex > 0 && <div className="my-2 h-px bg-[#17345f1a]" />}
          {group.map((item) => {
            const Icon = item.icon;
            const classes = `flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left text-[16px] font-medium transition-colors md:gap-3 md:py-2.5 md:text-sm ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-[#122a50] hover:bg-[#f8f1df]"
            }`;
            const content = (
              <>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </>
            );

            if (item.to) {
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={classes}
                  role="menuitem"
                  onClick={onClose}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={item.danger ? onLogout : undefined}
                className={classes}
                role="menuitem"
              >
                {content}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default UserDropdown;
