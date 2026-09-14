import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../common/Header";
import Footer from "../common/Footer";
import SEO from "../common/SEO";
import {
  HeartIcon,
  LogoutIcon,
  MapPinIcon,
  PackageIcon,
  SearchIcon,
  UserIcon,
} from "../common/HeaderIcons";
import dogImage from "../../assets/logo/dog.png";
import { useAuth } from "../../context/AuthContext";
import LogoutConfirmModal from "./LogoutConfirmModal";
import { featureFlags } from "../../config/siteNavigation";

const DashboardIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4h7v7H4V4ZM13 4h7v7h-7V4ZM4 13h7v7H4v-7ZM13 13h7v7h-7v-7Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const accountLinks = [
  { label: "My Dashboard", icon: DashboardIcon, to: "/account" },
  { label: "My Orders", icon: PackageIcon, to: "/account/orders" },
  featureFlags.autoOrder && { label: "Repeat Delivery", icon: PackageIcon, to: "/account/auto-orders" },
  { label: "Wishlist", icon: HeartIcon, to: "/wishlist" },
  { label: "Saved Addresses", icon: MapPinIcon, to: "/account/addresses" },
  { label: "Login & Security", icon: UserIcon, to: "/account/details" },
  // Temporarily hidden while Pets 2.0 is paused; the page remains available in source.
  featureFlags.petDetails && { label: "Pet Details", icon: UserIcon, to: "/account/pets" },
  { label: "Vet Verification", icon: UserIcon, to: "/account/vet-verification" },
  { label: "Track Order", icon: SearchIcon, to: "/track-order" },
].filter(Boolean);

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const resolveAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API_ORIGIN}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

const profileInitial = (name = "User") => name.trim().charAt(0).toUpperCase() || "U";

const AccountLayout = ({ title, description, children, actions }) => {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const displayName = customer?.name || [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "Pet Parent";
  const activeTitle = title || "My Account";

  const confirmLogout = () => {
    logout();
    setLogoutConfirmOpen(false);
    navigate("/login");
  };

  return (
    <>
      <SEO title={`${activeTitle} | Best Vet Care`} description={description || "Manage your Best Vet Care account."} />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />

        <main className="px-4 pb-6 pt-6 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1440px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
              <span>/</span>
              <Link to="/account" className="transition-colors hover:text-[#d9aa3d]">My Account</Link>
              <span>/</span>
              <span className="font-extrabold text-[#122a50]">{activeTitle}</span>
            </nav>

            <div className="mt-6 grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
              <aside className="space-y-5 lg:sticky lg:top-6">
                <div className="overflow-hidden rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
                  <div className="flex items-center gap-4 bg-[#f8f1df] px-5 py-5">
                    {customer?.avatar ? (
                      <img src={resolveAvatarUrl(customer.avatar)} alt={displayName} className="h-14 w-14 rounded-full object-cover shadow-sm" />
                    ) : (
                      <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-lg font-extrabold text-[#d9aa3d] shadow-sm">
                        {profileInitial(displayName)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-base font-extrabold text-[#122a50]">{displayName}</span>
                      <span className="mt-1 block truncate text-sm font-semibold text-[#122a50b2]">{customer?.email || "customer@email.com"}</span>
                    </span>
                  </div>

                  <nav className="space-y-1 p-4" aria-label="Account menu">
                    {accountLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.label}
                          to={item.to}
                          end={item.to === "/account"}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-extrabold transition-colors ${
                              isActive
                                ? "bg-[#f8f1df] text-[#17345f]"
                                : "text-[#122a50] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                            }`
                          }
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          {item.label}
                        </NavLink>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-extrabold text-[#122a50] transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <LogoutIcon className="h-4 w-4 flex-shrink-0" />
                      Logout
                    </button>
                  </nav>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                  <div className="relative z-10 max-w-[160px]">
                    <h2 className="text-lg font-extrabold leading-6 text-[#122a50]">Pawsitively Happy Deals!</h2>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#122a50b2]">Explore special offers on food, toys and more.</p>
                    <Link to="/products" className="mt-4 inline-flex rounded-lg bg-[#17345f] px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]">
                      Shop Now
                    </Link>
                  </div>
                  <img src={dogImage} alt="" className="absolute bottom-0 right-0 h-36 w-40 object-contain object-bottom" />
                </div>
              </aside>

              <section className="min-w-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50]">{activeTitle}</h1>
                    {description && <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#122a50b2]">{description}</p>}
                  </div>
                  {actions && <div className="flex flex-col gap-3 sm:flex-row">{actions}</div>}
                </div>
                <div className="mt-8">{children}</div>
              </section>
            </div>
          </div>
        </main>

        <Footer />
        <LogoutConfirmModal
          open={logoutConfirmOpen}
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={confirmLogout}
        />
      </div>
    </>
  );
};

export default AccountLayout;
