import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  HeadphonesIcon,
  Settings,
  ChevronDown,
  FolderOpen,
  UserCog,
  Tag,
  Bell,
  Image,
  BookOpen,
  MessageSquare,
  Layers,
  Megaphone,
  Percent,
  Truck,
  Mail,
  X,
  Upload,
  ClipboardList,
  PhoneCall,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

import { NavLink, useLocation, Link } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { adminApi, getAdminProfile, getAdminToken, isSuperAdmin } from "../../lib/api";
import { featureFlags } from "../../config/featureFlags";
import {
  getStoreLogo,
  getStoreLogoAlt,
  getStoreLogoFitClass,
} from "../../lib/storeLogo";

const navItems = [
  {
    section: "MAIN MENU",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
  {
    section: "STORE HUB",
    items: [
      { key: "orders", label: "Orders", icon: ShoppingCart, path: "/orders" },
      {
        key: "auto-orders",
        label: "Automated Orders",
        icon: ClipboardList,
        path: "/orders/auto-orders",
      },
      {
        key: "shipment-management",
        label: "Shipment Management",
        icon: ClipboardList,
        path: "/orders/shipments",
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
        key: "ai-calling",
        label: "AI Calling",
        icon: PhoneCall,
        children: [
          { label: "Start Calling", path: "/ai-calling", icon: LayoutDashboard },
          { label: "Agents", path: "/ai-calling/agents", icon: UserCog },
          { label: "Customers", path: "/ai-calling/customers", icon: Users },
          { label: "Calls", path: "/ai-calling/calls", icon: PhoneCall },
        ],
      },
    ],
  },
  {
    section: "CONTENT",
    items: [
      {
        key: "banners",
        label: "Banners",
        icon: Image,
        path: "/config/banners",
      },
      {
        key: "announcement",
        label: "Announcement Bar",
        icon: Megaphone,
        path: "/config/announcement",
      },
      { key: "coupons", label: "Coupons", icon: Tag, path: "/config/coupons" },
      { key: "taxes", label: "Taxes", icon: Percent, path: "/config/taxes" },
      {
        key: "shipment-charges",
        label: "Shipment Charges",
        icon: Truck,
        path: "/config/shipment-charges",
      },
      {
        key: "inquiries",
        label: "Inquiries",
        icon: MessageSquare,
        path: "/config/inquiries",
      },
      {
        key: "support",
        label: "Customer Support",
        icon: HeadphonesIcon,
        path: "/support",
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        key: "general-settings",
        label: "Store Settings",
        icon: Settings,
        path: "/settings/general",
      },
      {
        key: "email-settings",
        label: "Email Settings",
        icon: Mail,
        path: "/settings/email",
      },
      {
        key: "audit-logs",
        label: "Audit Logs",
        icon: ClipboardList,
        path: "/audit-logs",
      },
    ],
  },
];

const SUPPORT_STATS_EVENT = "admin-support-stats-change";

const isFeatureItemEnabled = (item) => {
  if (item.key === "auto-orders") return featureFlags.autoOrder;
  if (item.key === "ai-calling") return featureFlags.automaticCallingAgent;
  if (item.key === "support") return featureFlags.customerSupport;
  if (item.path === "/products/bulk-import") return featureFlags.bulkImport;
  return true;
};

function getActiveSupportCount(stats = {}) {
  return (
    Number(stats.open || 0) +
    Number(stats.waiting || 0) +
    Number(stats.assigned || 0)
  );
}

function NavItem({ item, isChild = false, badge = null }) {
  const { isCollapsed, openMenus, toggleMenu } = useSidebar();
  const location = useLocation();
  const Icon = item.icon;
  const isOpen = openMenus[item.key];

  const baseClasses = `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isChild ? "text-sm py-2.5 pl-11" : "text-[15px]"}`;

  const activeClasses =
    "bg-[var(--primary)] text-white font-semibold shadow-sm shadow-primary/15";
  const inactiveClasses =
    "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--accent-gold)] font-medium";

  if (!item.children) {
    return (
      <NavLink
        to={item.path}
        title={isCollapsed ? item.label : undefined}
        className={({ isActive }) =>
          `${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${isCollapsed ? "justify-center px-2" : ""}`
        }
      >
        <Icon
          size={isChild ? 18 : 20}
          className={`shrink-0 ${isChild ? "" : "stroke-[1.5]"}`}
        />
        {!isCollapsed && (
          <>
            <span className="truncate flex-1">{item.label}</span>
            {badge && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                {badge}
              </span>
            )}
          </>
        )}

        {isCollapsed && badge && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white/20" />
        )}

        {isCollapsed && !isChild && (
          <span className="absolute left-full ml-3 px-3 py-2 bg-[var(--primary)] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg border border-[var(--border-color)]">
            {item.label}
          </span>
        )}
      </NavLink>
    );
  }

  const isParentActive = item.children.some(
    (c) => location.pathname === c.path.split("?")[0],
  );

  return (
    <div>
      <button
        onClick={() => !isCollapsed && toggleMenu(item.key)}
        title={isCollapsed ? item.label : undefined}
        className={`w-full ${baseClasses} ${isParentActive ? "bg-[var(--primary)] text-white font-semibold shadow-sm shadow-primary/15" : "text-[var(--text-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--accent-gold)] font-medium"} ${isCollapsed ? "justify-center px-2" : ""}`}
      >
        <div className="relative group/icon">
          <Icon size={20} className="shrink-0 stroke-[1.5]" />
          {isCollapsed && badge && (
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white/20" />
          )}
        </div>

        {!isCollapsed && (
          <>
            <span className="truncate flex-1 text-left">{item.label}</span>
            <div className="flex items-center gap-2">
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
                  {badge}
                </span>
              )}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={
                  isParentActive ? "text-white" : "text-[var(--text-soft)]"
                }
              >
                <ChevronDown size={16} className="shrink-0" />
              </motion.div>
            </div>
          </>
        )}
        {isCollapsed && (
          <span className="absolute left-full ml-3 px-3 py-2 bg-[var(--primary)] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-lg border border-[var(--border-color)]">
            {item.label}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-0.5">
              {item.children.filter(isFeatureItemEnabled).map((child) => (
                <NavItem
                  key={child.path}
                  item={child}
                  isChild={true}
                  badge={item.badgeMap ? item.badgeMap[child.path] : null}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar() {
  const {
    isCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    isSidebarVisible,
    toggleSidebar,
    isDesktop,
  } = useSidebar();
  const location = useLocation();
  const adminProfile = getAdminProfile();
  const superAdmin = isSuperAdmin();
  const sidebarLogo = getStoreLogo(adminProfile);
  const sidebarLogoAlt = getStoreLogoAlt(adminProfile);
  const sidebarLogoFitClass = getStoreLogoFitClass(adminProfile);
  const [supportOpenCount, setSupportOpenCount] = useState(0);

  useEffect(() => {
    let active = true;

    const loadSupportCount = async () => {
      if (!getAdminToken()) {
        if (active) setSupportOpenCount(0);
        return;
      }

      try {
        const data = await adminApi.supportConversations({ page: 1, limit: 1 }, { suppressToast: true });
        const stats = data?.stats || {};
        if (active) setSupportOpenCount(getActiveSupportCount(stats));
      } catch {
        if (active) setSupportOpenCount(0);
      }
    };

    const handleSupportStats = (event) => {
      if (active) setSupportOpenCount(getActiveSupportCount(event.detail || {}));
    };

    loadSupportCount();
    const intervalId = window.setInterval(loadSupportCount, 30000);
    window.addEventListener("admin-auth-change", loadSupportCount);
    window.addEventListener(SUPPORT_STATS_EVENT, handleSupportStats);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("admin-auth-change", loadSupportCount);
      window.removeEventListener(SUPPORT_STATS_EVENT, handleSupportStats);
    };
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  if (!isSidebarVisible) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{
          width: isCollapsed ? 80 : 280,
          x: isDesktop || isMobileOpen ? 0 : -280,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 grow-0 shrink-0 flex flex-col overflow-hidden shadow-[12px_0_36px_rgba(23,52,95,0.08)] border-r`}
        style={{
          width: isCollapsed ? 80 : 280,
          background:
            "linear-gradient(180deg, var(--card-bg) 0%, var(--bg-light) 100%)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Logo & Close */}
        <div
          className={`flex items-center justify-between shrink-0 border-b ${isCollapsed ? "px-3 py-4" : "px-5 py-4"}`}
          style={{ borderColor: "var(--border-color)" }}
        >
          {superAdmin ? (
            <Link
              to="/"
              className={`flex min-w-0 items-center overflow-hidden ${isCollapsed ? "h-14 w-14 justify-center rounded-2xl bg-[var(--primary)] text-white" : "h-20 w-[190px]"}`}
              aria-label="Super Admin home"
            >
              {isCollapsed ? (
                <span className="text-sm font-semibold">SA</span>
              ) : (
                <div>
                  <p className="font-display text-2xl font-semibold text-[var(--primary)]">
                    Super Admin
                  </p>
                </div>
              )}
            </Link>
          ) : (
            <Link
              to="/"
              className={`flex min-w-0 items-center overflow-hidden ${isCollapsed ? "h-14 w-14 justify-center rounded-2xl" : "h-20 w-[190px] justify-center rounded-xl"}`}
              aria-label={`${sidebarLogoAlt} admin home`}
            >
              <img
                src={sidebarLogo}
                alt={sidebarLogoAlt}
                className={`${isCollapsed ? "max-h-12 max-w-12" : sidebarLogoFitClass} block h-auto w-auto origin-center object-contain transition-transform duration-200`}
              />
            </Link>
          )}

          {!isCollapsed && (
            <button
              onClick={() =>
                !isDesktop ? setIsMobileOpen(false) : toggleSidebar()
              }
              className="lg:hidden p-2 rounded-lg bg-[var(--bg-soft)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--accent-gold-soft)] transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto sidebar-scroll px-4 pb-6 space-y-2">
          {(() => {
            const { orders, tickets, inquiries } = useData();

            const ordActive = orders.filter(
              (o) =>
                o.status !== "delivered" &&
                o.status !== "cancelled" &&
                o.status !== "refunded",
            );
            const pendingOrders = ordActive.length;

            const openTickets = tickets.filter(
              (t) => t.status === "open" || t.status === "in_progress",
            ).length;
            const supportBadgeCount = supportOpenCount || openTickets;

            const activeInquiries = inquiries.filter(
              (i) => i.status === "open" || i.status === "in_progress",
            ).length;

            const badgeMap = {
              support: supportBadgeCount > 0 ? supportBadgeCount : null,
              "/config/inquiries": activeInquiries > 0 ? activeInquiries : null,
              inquiries: activeInquiries > 0 ? activeInquiries : null,
            };

            const baseNavItems = superAdmin
              ? [
                  {
                    section: "MAIN MENU",
                    items: navItems[0].items,
                  },
                  {
                    section: "ALL STORES",
                    items: [
                      {
                        key: "orders",
                        label: "Orders",
                        icon: ShoppingCart,
                        path: "/orders",
                      },
                      {
                        key: "auto-orders",
                        label: "Automated Orders",
                        icon: ClipboardList,
                        path: "/orders/auto-orders",
                      },
                      {
                        key: "products",
                        label: "Products",
                        icon: Package,
                        children: [
                          {
                            label: "Product List",
                            path: "/products",
                            icon: Layers,
                          },
                          {
                            label: "Categories",
                            path: "/categories",
                            icon: FolderOpen,
                          },
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
                        key: "ai-calling",
                        label: "AI Calling",
                        icon: PhoneCall,
                        path: "/ai-calling",
                      },
                    ],
                  },
                  {
                    section: "SYSTEM",
                    items: [
                      {
                        key: "audit-logs",
                        label: "Audit Logs",
                        icon: ClipboardList,
                        path: "/audit-logs",
                      },
                    ],
                  },
                ]
              : navItems;
            const visibleNavItems = baseNavItems
              .map((section) => ({
                ...section,
                items: section.items.filter(isFeatureItemEnabled),
              }))
              .filter((section) => section.items.length);

            return visibleNavItems.map((section, idx) => (
              <div key={idx}>
                {!isCollapsed && (
                  <div className="px-4 text-[11px] font-bold text-[var(--text-soft)] uppercase tracking-widest mt-6 mb-2">
                    {section.section}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavItem
                      key={item.key}
                      item={{
                        ...item,
                        badgeMap,
                      }}
                      badge={badgeMap[item.key] || badgeMap[item.path]}
                    />
                  ))}
                </div>
              </div>
            ));
          })()}
        </nav>

        {/* Footer */}
        <div
          className="p-4 border-t shrink-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-soft)] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)] flex items-center justify-center shrink-0">
              <span className="text-[var(--primary-dark)] text-sm font-semibold">
                {adminProfile.initials}
              </span>
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden"
              >
                <p className="text-[var(--text-primary)] text-sm font-bold truncate">
                  {adminProfile.name}
                </p>
                <p className="text-[var(--text-soft)] text-xs truncate">
                  {adminProfile.email}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
