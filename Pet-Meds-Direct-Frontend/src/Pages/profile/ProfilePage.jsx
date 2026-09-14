import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { profileSidebarMenu } from "../../data/profile";
import { CUSTOMER_BLOCKED_REASON_KEY } from "../../helper/axiosInstance";
import toast from "react-hot-toast";
import {
  ChevronRight,
  LayoutDashboard,
  User,
  Package,
  MapPin,
  Truck,
  HelpCircle,
  LogOut,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

// Tab Components
import DashboardTab from "../../components/profile/DashboardTab";
import MyProfileTab from "../../components/profile/MyProfileTab";
import OrdersTab from "../../components/profile/OrdersTab";
import SavedAddressesTab from "../../components/profile/SavedAddressesTab";
import OrderTrackingTab from "../../components/profile/OrderTrackingTab";
import VetVerificationTab from "../../components/profile/VetVerificationTab";
import SupportTab from "../../components/profile/SupportTab";

const iconMap = {
  LayoutDashboard,
  User,
  Package,
  MapPin,
  Truck,
  ShieldCheck,
  HelpCircle,
};

const tabComponents = {
  dashboard: DashboardTab,
  profile: MyProfileTab,
  orders: OrdersTab,
  addresses: SavedAddressesTab,
  tracking: OrderTrackingTab,
  "vet-verification": VetVerificationTab,
  support: SupportTab,
};

function UserAvatar({ src, letter, className = "" }) {
  return src ? (
    <img
      src={src}
      alt="Profile"
      className={`rounded-full object-cover bg-deep-navy ${className}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-full bg-deep-navy font-black text-white ${className}`}
    >
      {letter}
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const blockedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (blockedReason) {
      toast.error(blockedReason, { id: "blocked-user-toast" });
    }
  }, []);

  const activeTab = searchParams.get("tab") || "dashboard";

  const tabLabelMap = {
    dashboard: "Dashboard",
    profile: "Profile",
    orders: "Orders",
    addresses: "Addresses",
    tracking: "Tracking",
    "vet-verification": "Vet Verification",
    support: "Support",
  };
  const activeTabLabel = tabLabelMap[activeTab] || "";

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen py-10 font-sans">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-soft-mint mb-6">
              <User className="h-10 w-10 text-primary-green" />
            </div>
            <h2 className="text-2xl font-black text-deep-navy font-display mb-2">
              Please Log In
            </h2>
            <p className="text-base font-semibold text-deep-navy/50 mb-6 max-w-md">
              You need to be logged in to access your account dashboard.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-green px-8 py-3.5 text-base font-bold text-white hover:bg-dark-green transition-colors"
            >
              Log In <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ActiveTabComponent = tabComponents[activeTab] || DashboardTab;
  const avatarLetter = user?.avatarLetter || user?.name?.charAt(0).toUpperCase() || "U";
  const avatarSrc = user?.avatar || "";

  return (
    <div className="relative min-h-screen py-8 sm:py-10 font-sans">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary-green/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-medical-teal/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs - Desktop Only */}
        <div className="hidden lg:flex items-center gap-2 mb-6 text-sm font-bold text-slate-500">
          <Link to="/" className="hover:text-primary-green transition-colors uppercase tracking-wider text-xs">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="hover:text-primary-green transition-colors uppercase tracking-wider text-xs">My Account</span>
          {activeTabLabel && (
            <>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-deep-navy uppercase tracking-wider text-xs">{activeTabLabel}</span>
            </>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
          {/* ─── Sidebar (Sticky) ─── */}
          <aside className="w-full lg:w-[280px] xl:w-[300px] shrink-0 lg:sticky lg:top-[170px] lg:self-start lg:max-h-[calc(100vh-190px)] lg:overflow-y-auto scrollbar-none">
            <div className="rounded-2xl border border-[#e8eef3] bg-white p-5 sm:p-6">
              {/* User Info */}
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#e8eef3] lg:mb-6 lg:pb-6 lg:border-b lg:border-[#e8eef3]">
                <UserAvatar
                  src={avatarSrc}
                  letter={avatarLetter}
                  className="h-14 w-14 text-xl shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-black text-deep-navy truncate">
                    {user?.name || "User"}
                  </h3>
                  <p className="text-xs font-semibold text-deep-navy/50 truncate">
                    {user?.email || ""}
                  </p>
                  <span className="mt-1.5 inline-flex items-center rounded-md bg-primary-green/10 px-2.5 py-0.5 text-[10px] font-black text-primary-green uppercase tracking-wider">
                    Member
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <div className="overflow-x-auto scrollbar-none -mx-5 px-5 lg:mx-0 lg:px-0">
                <nav className="flex flex-row lg:flex-col gap-2 lg:gap-1.5 pb-1 lg:pb-0">
                  {profileSidebarMenu.map((item) => {
                    const Icon = iconMap[item.icon];
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setSearchParams({ tab: item.key })}
                        className={`flex items-center justify-between lg:justify-between gap-3 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer text-left whitespace-nowrap shrink-0 border ${
                          isActive
                            ? "bg-soft-mint text-primary-green border-primary-green/15"
                            : "text-deep-navy/70 hover:bg-slate-50 hover:text-deep-navy border-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 sm:gap-3">
                          {Icon && (
                            <Icon
                              className={`h-4.5 w-4.5 lg:h-5 lg:w-5 ${
                                isActive ? "text-primary-green" : "text-deep-navy/35"
                              }`}
                            />
                          )}
                          {item.label}
                        </span>
                        <ArrowRight
                          className={`hidden lg:block h-4 w-4 ${
                            isActive ? "text-primary-green" : "text-deep-navy/20"
                          }`}
                        />
                      </button>
                    );
                  })}
                  {/* Logout Button inside horizontal nav on mobile */}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex lg:hidden items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border border-transparent text-rose-500 hover:bg-rose-50"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    Logout
                  </button>
                </nav>
              </div>

              {/* Desktop-only Logout */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="hidden lg:flex items-center gap-3 mt-6 pt-5 border-t border-[#e8eef3] w-full text-sm font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer text-left px-4"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>

            {/* Breadcrumbs - Mobile Only */}
            <div className="flex lg:hidden items-center gap-1.5 mt-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <Link to="/" className="hover:text-primary-green transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="hover:text-slate-600 transition-colors">My Account</span>
              {activeTabLabel && (
                <>
                  <span>/</span>
                  <span className="text-deep-navy">{activeTabLabel}</span>
                </>
              )}
            </div>
          </aside>

          {/* ─── Content Panel ─── */}
          <main className="w-full flex-1 min-w-0">
            <ActiveTabComponent />
          </main>
        </div>
      </div>

      {/* ─── Logout Confirmation Dialog ─── */}
      {showLogoutConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#0f2d52]/55 backdrop-blur-xs"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-[0_25px_60px_rgba(15,45,82,0.2)] border border-[#e8eef3] z-50">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
                <LogOut className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-deep-navy font-display">
                Confirm Logout
              </h3>
              <p className="mt-2 text-sm font-semibold text-deep-navy/60 leading-relaxed px-2">
                Are you sure you want to log out of your account? You will need
                to verify your email again next time.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full rounded-2xl border border-deep-navy/8 bg-slate-50 py-3.5 text-sm font-black text-deep-navy hover:bg-[#eef2f6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowLogoutConfirm(false);
                    toast.success("Logged out successfully");
                    navigate("/");
                  }}
                  className="w-full rounded-2xl bg-rose-500 py-3.5 text-sm font-black text-white hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
