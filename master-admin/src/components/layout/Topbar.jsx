import { useState, useEffect } from "react";
import { useLocation, Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Home,
  Users,
  Package,
  ShoppingCart,
  HeadphonesIcon,
  Settings,
  UserCog,
  FolderOpen,
  Layers,
  Tag,
  Image,
  MessageSquare,
  SlidersHorizontal,
  MoreVertical,
  LogOut,
  Megaphone,
  KeyRound,
  Percent,
  Truck,
  Mail,
  Upload,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "../../context/SidebarContext";
import Modal from "../common/Modal";
import {
  adminApi,
  clearAdminSession,
  getAdminProfile,
  isSuperAdmin,
} from "../../lib/api";
import { getStoreLogo, getStoreLogoAlt } from "../../lib/storeLogo";
import { featureFlags } from "../../config/featureFlags";

const navItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    key: "orders",
    label: "Orders",
    icon: ShoppingCart,
    children: [
      { label: "Order List", path: "/orders", icon: ShoppingCart },
      { label: "Automated Orders", path: "/orders/auto-orders", icon: ClipboardList },
      { label: "Shipment Management", path: "/orders/shipments", icon: Truck },
    ],
  },
  {
    key: "products",
    label: "Products",
    icon: Package,
    children: [
      { label: "Product List", path: "/products", icon: Layers },
      { label: "Categories", path: "/categories", icon: FolderOpen },
      { label: "Bulk Import", path: "/products/bulk-import", icon: Upload },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
    children: [
      { label: "Customer List", path: "/customers", icon: Users },
      { label: "Vet Verification", path: "/customers/vet-verification", icon: ClipboardList },
    ],
  },
  {
    key: "support",
    label: "Customer Support",
    icon: HeadphonesIcon,
    path: "/support",
  },
  {
    key: "content",
    label: "Content",
    icon: SlidersHorizontal,
    children: [
      { label: "Banners", path: "/config/banners", icon: Image },
      // { label: "Notifications", path: "/config/notifications", icon: Bell },
      {
        label: "Announcement Bar",
        path: "/config/announcement",
        icon: Megaphone,
      },
      { label: "Coupons", path: "/config/coupons", icon: Tag },
      { label: "Taxes", path: "/config/taxes", icon: Percent },
      { label: "Shipment Charges", path: "/config/shipment-charges", icon: Truck },
      { label: "Inquiries", path: "/config/inquiries", icon: MessageSquare },
    ],
  },
  {
    key: "system",
    label: "System",
    icon: Settings,
    children: [
      { label: "Email Settings", path: "/settings/email", icon: Mail },
      { label: "Audit Logs", path: "/audit-logs", icon: ClipboardList },
    ],
  },
];

const filterFeatureItems = (items) => items
  .filter((item) => item.key !== "orders" || featureFlags.autoOrder || item.children?.some((child) => child.path !== "/orders/auto-orders"))
  .filter((item) => item.key !== "ai-calling" || featureFlags.automaticCallingAgent)
  .filter((item) => item.key !== "support" || featureFlags.customerSupport)
  .map((item) => item.children
    ? { ...item, children: item.children.filter((child) => featureFlags.autoOrder || child.path !== "/orders/auto-orders") }
    : item);

function DesktopNav() {
  const [activeMenu, setActiveMenu] = useState(null);
  const location = useLocation();
  const visibleNavItems = filterFeatureItems(isSuperAdmin()
    ? navItems
        .filter((item) => ["dashboard", "orders", "products", "customers", "support", "system"].includes(item.key))
        .map((item) => {
          if (!item.children) return item;
          return {
            ...item,
            children: item.children.filter((child) =>
              [
                "/orders",
                "/orders/auto-orders",
                "/orders/shipments",
                "/products",
                "/categories",
                "/customers",
                "/customers/vet-verification",
                "/audit-logs",
              ].includes(child.path),
            ),
          };
        })
    : navItems);

  return (
    <nav className="hidden xl:flex min-w-0 flex-1 items-center justify-center gap-0.5 2xl:gap-1 mx-2 2xl:mx-6 h-full">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = !!item.children;
        const isActive = item.path
          ? location.pathname === item.path
          : item.children?.some((c) => location.pathname === c.path);

        return (
          <div
            key={item.key}
            className="relative h-full flex items-center"
            onMouseEnter={() => hasChildren && setActiveMenu(item.key)}
            onMouseLeave={() => setActiveMenu(null)}
          >
            {item.path ? (
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-1.5 2xl:gap-2 px-2.5 2xl:px-4 py-2 rounded-xl text-[13px] 2xl:text-sm font-semibold transition-all whitespace-nowrap
                  ${isActive ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:bg-[var(--accent-gold-soft)] hover:text-[var(--primary)]"}
                `}
              >
                <Icon size={16} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ) : (
              <button
                className={`
                flex items-center gap-1.5 2xl:gap-2 px-2.5 2xl:px-4 py-2 rounded-xl text-[13px] 2xl:text-sm font-semibold transition-all whitespace-nowrap
                ${isActive ? "text-[var(--primary)] bg-[var(--accent-gold-soft)]" : "text-[var(--text-muted)] hover:bg-[var(--accent-gold-soft)] hover:text-[var(--primary)]"}
              `}
              >
                <Icon size={16} className="shrink-0" />
                <span>{item.label}</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform duration-200 ${activeMenu === item.key ? "rotate-180" : ""}`}
                />
              </button>
            )}

            <AnimatePresence>
              {hasChildren && activeMenu === item.key && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 min-w-[200px] pt-2 z-100"
                >
                  <div className="bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] p-2">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all
                            ${isActive ? "bg-[var(--accent-gold-soft)] text-[var(--primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"}
                          `}
                        >
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg-soft)] flex items-center justify-center shrink-0">
                            <ChildIcon size={14} />
                          </div>
                          <span className="truncate">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

export default function Topbar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const adminProfile = getAdminProfile();
  const superAdmin = isSuperAdmin();
  const storeLogo = getStoreLogo(adminProfile);
  const storeLogoAlt = getStoreLogoAlt(adminProfile);

  const { isSidebarVisible, toggleSidebar, setIsMobileOpen, isDesktop } =
    useSidebar();

  const pathnames = location.pathname.split("/").filter((x) => x);
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`;
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      path: routeTo,
    };
  });

  const updatePasswordField = (field) => (event) => {
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    setPasswordError("");
    setPasswordSuccess("");
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordSaving(false);
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("All password fields are required");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError("New password must be different from the current password");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      await adminApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(error.message || "Unable to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      {/* Mobile header - only hamburger + user avatar */}
      <header
        className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between shadow-lg"
        style={{ background: "var(--primary)" }}
      >
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <Menu size={20} />
        </button>
        <span className="text-white font-bold text-lg tracking-tight">
          Admin Panel
        </span>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-9 h-9 rounded-xl bg-[var(--accent-gold)] flex items-center justify-center text-[var(--primary-dark)] text-xs font-bold hover:opacity-90 transition-all"
        >
          {adminProfile.initials}
        </button>
        <AnimatePresence>
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-0"
                onClick={() => setUserMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[110%] right-3 w-56 bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] p-2 z-50"
              >
                {[
                  {
                    label: "Change Password",
                    icon: KeyRound,
                    action: () => setPasswordModalOpen(true),
                  },
                  {
                    label: "Logout",
                    icon: LogOut,
                    action: () => setLogoutModalOpen(true),
                    danger: true,
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUserMenuOpen(false);
                      item.action();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      item.danger
                        ? "text-red-500 hover:bg-red-50"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.danger ? "bg-red-50" : "bg-[var(--bg-soft)]"}`}
                    >
                      <item.icon size={16} />
                    </div>
                    <span>{item.label}</span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Desktop header */}
      <header
        className="hidden lg:flex sticky top-0 z-40 h-16 bg-[var(--card-bg)] border-b px-3 sm:px-5 lg:px-6 items-center justify-between gap-3 shadow-[0_10px_28px_-24px_rgba(23,52,95,0.35)]"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-6">
          {isSidebarVisible ? (
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                onClick={() => {
                  if (!isDesktop) {
                    setIsMobileOpen(true);
                  } else {
                    toggleSidebar();
                  }
                }}
                className="p-2 rounded-xl bg-[var(--bg-soft)] text-[var(--text-muted)] hover:bg-[var(--accent-gold-soft)] hover:text-[var(--primary)] transition-all active:scale-95"
              >
                <Menu size={20} />
              </button>

              <div className="hidden sm:flex flex-col">
                <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                  {breadcrumbs.length > 0
                    ? breadcrumbs[breadcrumbs.length - 1].name
                    : "Dashboard"}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-soft)]">
                  <span className="hover:text-[var(--primary)] cursor-pointer transition-colors">
                    Home
                  </span>
                  {breadcrumbs.map((bc, i) => (
                    <div key={bc.path} className="flex items-center gap-1.5">
                      <ChevronDown
                        size={10}
                        className="-rotate-90 opacity-40"
                      />
                      <span
                        className={
                          i === breadcrumbs.length - 1
                            ? "text-[var(--text-muted)] font-semibold"
                            : "hover:text-[var(--primary)] cursor-pointer transition-colors"
                        }
                      >
                        {bc.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2 h-full">
              <Link
                to="/"
                onClick={(e) => {
                  if (!isSidebarVisible) toggleSidebar();
                }}
                className={`mr-2 2xl:mr-4 flex h-14 w-[145px] 2xl:w-[200px] shrink-0 items-center overflow-hidden rounded-xl group cursor-pointer ${superAdmin ? "justify-start" : "justify-center"}`}
                aria-label={
                  superAdmin ? "Super Admin home" : `${storeLogoAlt} admin home`
                }
              >
                {superAdmin ? (
                  <div>
                    <p className="font-display text-xl font-semibold text-[var(--primary)] leading-none">
                      Super Admin
                    </p>
                    {/* <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-soft)]">
                      All stores
                    </p> */}
                  </div>
                ) : (
                  <img
                    src={storeLogo}
                    alt={storeLogoAlt}
                    className="block max-h-11 2xl:max-h-12 max-w-[135px] 2xl:max-w-[180px] object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                )}
              </Link>
              <DesktopNav />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* <button className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-all active:scale-95">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
          </button> */}

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex max-w-[220px] items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l group transition-all"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="w-10 h-10 rounded-2xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden ring-2 ring-[var(--accent-gold-soft)] group-hover:ring-[var(--accent-gold)]/30 transition-all">
                <span className="text-white text-2xl uppercase font-bold tracking-tight">
                  {adminProfile.initials}
                </span>
              </div>
              <div className="hidden sm:block min-w-0 text-left">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="min-w-0 truncate text-sm font-bold text-[var(--text-primary)] leading-none">
                    {adminProfile.name}
                  </p>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-[var(--text-soft)] transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`}
                  />
                </div>
                <p className="truncate text-[10px] font-bold text-[var(--text-soft)] uppercase tracking-widest mt-1">
                  {adminProfile.role}
                </p>
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[125%] right-0 w-64 bg-[var(--card-bg)] rounded-2xl shadow-2xl border border-[var(--border-color)] p-2 z-50"
                  >
                    {[
                      {
                        label: "Change Password",
                        icon: KeyRound,
                        action: () => setPasswordModalOpen(true),
                      },
                      {
                        label: "Logout",
                        icon: LogOut,
                        action: () => setLogoutModalOpen(true),
                        danger: true,
                      },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (item.action) {
                            item.action();
                          } else if (item.path) {
                            navigate(item.path);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          item.danger
                            ? "text-red-500 hover:bg-red-50"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.danger ? "bg-red-50" : "bg-[var(--bg-soft)]"}`}
                        >
                          <item.icon size={16} />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <Modal
        isOpen={passwordModalOpen}
        onClose={closePasswordModal}
        title="Change Password"
        width="max-w-md"
      >
        <form onSubmit={submitPasswordChange} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={updatePasswordField("currentPassword")}
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border bg-[var(--bg-soft)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:bg-[var(--card-bg)] focus:ring-4 focus:ring-[var(--accent-gold-soft)]"
              style={{ borderColor: "var(--border-color)" }}
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={updatePasswordField("newPassword")}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border bg-[var(--bg-soft)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:bg-[var(--card-bg)] focus:ring-4 focus:ring-[var(--accent-gold-soft)]"
              style={{ borderColor: "var(--border-color)" }}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={updatePasswordField("confirmPassword")}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border bg-[var(--bg-soft)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:bg-[var(--card-bg)] focus:ring-4 focus:ring-[var(--accent-gold-soft)]"
              style={{ borderColor: "var(--border-color)" }}
              placeholder="Repeat new password"
            />
          </div>

          {passwordError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {passwordSuccess}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={closePasswordModal}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-all hover:bg-[var(--bg-soft)] active:scale-95"
              style={{ borderColor: "var(--border-color)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={passwordSaving}
              className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[var(--primary-dark)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {passwordSaving ? "Saving..." : "Save Password"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        width="max-w-md"
      >
        <div className="py-4 text-center">
          <p className="text-[var(--text-muted)] mb-6">
            Are you sure you want to log out of the admin panel?
          </p>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-soft)] transition-all active:scale-95"
              style={{ borderColor: "var(--border-color)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                clearAdminSession();
                setLogoutModalOpen(false);
                navigate("/login");
              }}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Log out
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
