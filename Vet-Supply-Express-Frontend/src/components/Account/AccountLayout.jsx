import React, { useContext, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  User, Package, MapPin, Truck,
  LogOut, ChevronRight, LayoutDashboard, ShieldCheck
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import LogoutConfirmationModal from "./LogoutConfirmationModal";

const NAV_ITEMS = [
  { label: "Dashboard",       path: "/account/dashboard",  icon: LayoutDashboard },
  { label: "My Profile",      path: "/account/profile",    icon: User },
  { label: "My Orders",       path: "/account/orders",     icon: Package },
  { label: "Saved Addresses", path: "/account/addresses",  icon: MapPin },
  { label: "Vet Verification", path: "/account/vet-verification", icon: ShieldCheck },
  { label: "Track Orders",    path: "/account/track-order",icon: Truck },
];

const getInitials = (name = "", email = "") => {
  if (name.trim()) {
    return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  }
  return (email[0] || "U").toUpperCase();
};

const AccountAvatar = ({ user, initials }) => (
  <div className="w-14 h-14 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
    {user?.avatar ? (
      <img
        src={user.avatar}
        alt="Profile avatar"
        className="w-full h-full object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          event.currentTarget.nextElementSibling?.classList.remove("hidden");
        }}
      />
    ) : null}
    <span className={`text-xl font-black text-white select-none ${user?.avatar ? "hidden" : ""}`}>
      {initials}
    </span>
  </div>
);

const AccountLayout = ({ children, title, subtitle }) => {
  const { user, logoutUser } = useContext(AuthContext);
  const { addToast } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutBtnRef = useRef(null);

  /* Open the confirmation modal */
  const handleLogoutClick = () => setIsLogoutOpen(true);

  /* Close modal and return focus */
  const handleCloseModal = () => {
    setIsLogoutOpen(false);
    setTimeout(() => logoutBtnRef.current?.focus(), 50);
  };

  /* Confirmed: perform logout */
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise((res) => setTimeout(res, 500)); // brief UX delay
      logoutUser();
      setIsLogoutOpen(false);
      navigate("/login", { replace: true });
    } catch {
      setIsLoggingOut(false);
      addToast({
        title: "Logout Failed",
        message: "Something went wrong. Please try again.",
        type: "error",
      });
    }
  };

  const initials = user ? getInitials(user.name, user.email) : "U";

  return (
    <>
    <div className="min-h-screen bg-[#F7FAFC] overflow-x-hidden">
      <div className="container-custom py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#9FB3C8] mb-4 sm:mb-6">
          <Link to="/" className="hover:text-[#0874C9] transition-colors font-medium">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0874C9] font-bold">My Account</span>
        </div>

        <div className="flex gap-6 items-start flex-col lg:flex-row w-full max-w-full">
          {/* ===== SIDEBAR ===== */}
          <aside className="w-full lg:w-72 shrink-0">
            {/* Profile Card */}
            <div className="bg-white border border-[#D9E8F2] rounded-2xl overflow-hidden mb-4 shadow-sm">
              <div className="bg-gradient-to-br from-[#0B2D4F] to-[#0874C9] px-6 py-6 flex items-center gap-4">
                <AccountAvatar user={user} initials={initials} />
                <div className="min-w-0">
                  <p className="font-heading font-black text-white text-base leading-tight truncate">
                    {user?.name || "Account"}
                  </p>
                  <p className="text-xs text-white/70 truncate mt-0.5">{user?.email}</p>
                  {user?.phone && (
                    <p className="text-xs text-white/60 truncate">{user.phone}</p>
                  )}
                </div>
              </div>

              {/* Nav Links */}
              <nav className="p-3 flex flex-col gap-1">
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <Link
                      key={path}
                      to={path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                        isActive
                          ? "bg-[#EAF5FC] text-[#0874C9]"
                          : "text-[#102A43] hover:bg-[#F7FAFC] hover:text-[#0874C9]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#0874C9]" : "text-[#627D98] group-hover:text-[#0874C9]"}`} />
                      <span className="flex-1">{label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#0874C9]" />}
                    </Link>
                  );
                })}

                {/* Divider */}
                <div className="border-t border-[#D9E8F2] my-2" />

                {/* Logout */}
                <button
                  ref={logoutBtnRef}
                  onClick={handleLogoutClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all duration-200 w-full text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400/40"
                >
                  <LogOut className="w-4 h-4 shrink-0 text-red-400 group-hover:text-red-600 transition-colors" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>

            {/* Clinic badge */}
            <div className="bg-gradient-to-r from-[#F28C18]/10 to-[#0874C9]/10 border border-[#D9E8F2] rounded-2xl p-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8] mb-1">VetSupplyExpress</p>
              <p className="text-xs text-[#627D98] font-medium">Trusted Veterinary Partner</p>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="w-full lg:flex-1 min-w-0 max-w-full">
            {(title || subtitle) && (
              <div className="mb-6">
                {title && (
                  <h1 className="font-heading font-black text-2xl md:text-3xl text-[#102A43]">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-[#627D98] mt-1 leading-relaxed max-w-2xl">{subtitle}</p>
                )}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>

    {/* Logout Confirmation Modal */}
    <LogoutConfirmationModal
      isOpen={isLogoutOpen}
      onClose={handleCloseModal}
      onConfirm={handleConfirmLogout}
      isLoading={isLoggingOut}
    />
  </>
  );
};

export default AccountLayout;
