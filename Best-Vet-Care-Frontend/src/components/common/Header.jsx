import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CartIcon,
  ChevronDownIcon,
  HeartIcon,
  HomeIcon,
  HelpIcon,
  MapPinIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "./HeaderIcons";
import AnnouncementBar from "./AnnouncementBar";
import TopInfoBar from "./TopInfoBar";
import UserDropdown from "./UserDropdown";
import logo from "../../assets/logo/logo11.png";
import SearchDropdown from "../SearchDropdown";
import DeliveryLocationSelector from "../address/DeliveryLocationSelector";
import {
  getWishlistItems,
  syncWishlistFromApi,
  WISHLIST_UPDATED_EVENT,
} from "../../utils/wishlist";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/authApi";
import LogoutConfirmModal from "../account/LogoutConfirmModal";
import {
  featureFlags,
} from "../../config/siteNavigation";
import { productApi } from "../../api/productApi";

const buildShopColumns = (categories) =>
  categories.map((cat) => ({
    label: cat.name,
    to: `/products?category=${encodeURIComponent(cat.slug || cat.name)}`,
  }));

const IconButton = ({ children, label, count, onClick }) => (
  <button
    type="button"
    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#17345f1a] bg-white text-[#122a50] transition-all duration-200 hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
    onClick={onClick}
    aria-label={label}
  >
    {children}
    {count !== undefined && (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d9aa3d] px-1 text-[11px] font-bold leading-none text-white">
        {count}
      </span>
    )}
  </button>
);

const Logo = () => (
  <Link to="/" className="flex items-center" aria-label="Best Vet Care home">
    <img
      src={logo}
      alt="Best Vet Care Logo"
      className="h-20 w-auto object-contain sm:h-16 lg:h-[70px] xl:h-[76px]"
    />
  </Link>
);

const linkMatchesPath = (to, pathname) => {
  const path = String(to || "").split("?")[0];
  return path === "/"
    ? pathname === "/"
    : pathname === path || pathname.startsWith(`${path}/`);
};

const NavItem = ({ item, active, open, onToggle, onOpen, onClose }) => {
  const hasMega = item.megaColumns?.length > 0;
  const hasChildren = item.children?.length > 0;
  const baseClass = `flex items-center gap-1 rounded-full px-2.5 py-2 text-[12px] font-semibold transition-all duration-200 lg:px-3 xl:px-4 xl:text-sm ${
    active || open
      ? "bg-[#f8f1df] text-[#d9aa3d]"
      : "text-[#122a50] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
  }`;

  if (!hasMega && !hasChildren) {
    return (
      <Link to={item.to} className={baseClass}>
        {item.label}
      </Link>
    );
  }

  return (
    <div
      className="relative z-[70]"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        className={baseClass}
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {item.label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && hasMega && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-[80] w-[min(1200px,90vw)] -translate-x-1/2 pt-3"
        >
          <div className="overflow-hidden rounded-xl border border-[#17345f1a] bg-white shadow-[0_18px_40px_rgba(18,42,80,0.16)]">
            <div className="flex items-center justify-between border-b border-[#17345f0d] px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#122a50]/40">Browse Categories</span>
              <Link
                to="/products"
                onClick={() => window.setTimeout(onClose, 0)}
                className="text-xs font-bold text-[#d9aa3d] hover:underline"
              >
                View All Products →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-0 sm:grid-cols-4 lg:grid-cols-5">
              {item.megaColumns.map((col) => (
                <Link
                  key={col.label}
                  to={col.to}
                  role="menuitem"
                  onClick={() => window.setTimeout(onClose, 0)}
                  className="group border-b border-r border-[#17345f08] px-4 py-2.5 transition-colors hover:bg-[#f8f1df]"
                >
                  <span className="text-sm font-semibold text-[#122a50] transition-colors group-hover:text-[#d9aa3d]">
                    {col.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      {open && !hasMega && hasChildren && (
        <div role="menu" className="absolute left-0 top-full z-[80] w-56 pt-2">
          <div className="overflow-hidden rounded-xl border border-[#17345f1a] bg-white py-2 shadow-[0_18px_40px_rgba(18,42,80,0.16)]">
            {item.children.map((child) => (
              <Link
                key={child.label}
                to={child.to}
                role="menuitem"
                className="block px-4 py-2.5 text-sm font-bold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                onClick={() => window.setTimeout(onClose, 0)}
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MobileBottomNav = ({ cartCount }) => {
  const items = [
    { label: "Home", to: "/", icon: HomeIcon },
    { label: "Product", to: "/products", icon: PackageIcon },
    { label: "Cart", to: "/cart", icon: CartIcon, count: cartCount },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] grid grid-cols-3 border-t border-[#d9aa3d]/30 bg-[#17345f] px-2 pb-[max(6px,env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-12px_28px_rgba(18,42,80,0.18)] md:hidden"
      aria-label="Mobile bottom navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.to}
            className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-md text-[12px] font-extrabold leading-none transition-colors hover:bg-[#d9aa3d]/15"
          >
            <span className="relative">
              <Icon className="h-[21px] w-[21px]" />
              {item.count > 0 && (
                <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d9aa3d] px-1 text-[10px] font-bold leading-none text-white">
                  {item.count}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const resolveAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API_ORIGIN}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

const Avatar = ({ user, className }) => {
  if (user?.avatar) {
    return (
      <img
        src={resolveAvatarUrl(user.avatar)}
        alt={user.name || "Profile"}
        className={`${className} object-cover rounded-full`}
      />
    );
  }
  const initial =
    (user?.name || user?.email || "U").trim().charAt(0).toUpperCase() || "U";
  return (
    <div
      className={`${className} bg-[#17345f] flex items-center justify-center font-bold text-white rounded-full`}
    >
      {initial}
    </div>
  );
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();
  const { customer, isLoggedIn, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openNavMenu, setOpenNavMenu] = useState("");
  const [openMobileGroups, setOpenMobileGroups] = useState({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(
    () => getWishlistItems().length,
  );
  const [shopColumns, setShopColumns] = useState([]);
  const profileMenuRef = useRef(null);
  const mobileProfileMenuRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    productApi.getCategories()
      .then((cats) => {
        const active = (cats || []).filter((c) => String(c.status || "").toLowerCase() === "active");
        if (active.length > 0) setShopColumns(buildShopColumns(active));
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: "Home", to: "/" },
    { label: "Shop", to: "/products", megaColumns: shopColumns },
    featureFlags.offers && { label: "Offers", to: "/discounts" },
    { label: "About Us", to: "/about" },
    { label: "Contact", to: "/contact" },
  ].filter(Boolean);

  const mobileDrawerItems = [
    { label: "Home", to: "/", icon: HomeIcon },
    { label: "Shop", to: "/products", icon: PackageIcon, children: shopColumns },
    featureFlags.offers && { label: "Offers", to: "/discounts", icon: CartIcon },
    { label: "About", to: "/about", icon: HelpIcon },
    { label: "Contact", to: "/contact", icon: MapPinIcon },
    { label: "My Account", to: "/account", icon: UserIcon },
    { label: "Wishlist", to: "/wishlist", icon: HeartIcon },
    { label: "Cart", to: "/cart", icon: CartIcon },
  ].filter(Boolean);

  const authUser = customer
    ? {
        name: customer.firstName || customer.name,
        email: customer.email,
        avatar: customer.avatar,
      }
    : null;

  const closeProfile = useCallback(() => {
    setProfileOpen(false);
    setMobileProfileOpen(false);
  }, []);
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
    setOpenMobileGroups({});
  }, []);
  const openSearch = useCallback(() => {
    closeProfile();
    closeMobileMenu();
    setSearchOpen(true);
  }, [closeMobileMenu, closeProfile]);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openWishlist = useCallback(() => {
    closeProfile();
    closeMobileMenu();
    navigate("/wishlist");
  }, [closeMobileMenu, closeProfile, navigate]);
  const openCart = useCallback(() => {
    closeProfile();
    closeMobileMenu();
    navigate("/cart");
  }, [closeMobileMenu, closeProfile, navigate]);
  const askLogout = useCallback(() => {
    closeProfile();
    setLogoutConfirmOpen(true);
  }, [closeProfile]);
  const confirmLogout = useCallback(() => {
    logout();
    setLogoutConfirmOpen(false);
    closeProfile();
    navigate("/login");
  }, [closeProfile, logout, navigate]);

  useEffect(() => {
    const syncWishlist = () => setWishlistCount(getWishlistItems().length);
    const syncWishlistFromServer = () => {
      syncWishlistFromApi().then((items) => setWishlistCount(items.length));
    };
    window.addEventListener("petcare-auth-change", syncWishlistFromServer);
    window.addEventListener("storage", syncWishlist);
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    syncWishlistFromServer();

    return () => {
      window.removeEventListener("petcare-auth-change", syncWishlistFromServer);
      window.removeEventListener("storage", syncWishlist);
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlist);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    authApi
      .getProfile()
      .then((profile) => {
        if (profile) authApi.storeCustomer(profile);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!navRef.current?.contains(event.target)) setOpenNavMenu("");
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenNavMenu("");
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="relative z-[70] w-full font-sans">
      <AnnouncementBar />
      <TopInfoBar />

      <div className="w-full bg-white shadow-[0_8px_30px_rgba(18,42,80,0.06)]">
        <div className="mx-auto flex min-h-[92px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:min-h-[78px] sm:px-5 lg:px-[22px] xl:min-h-[86px]">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none xl:min-w-[230px]">
            <Logo />
            {/* <DeliveryLocationSelector /> */}
          </div>

          <nav
            ref={navRef}
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1 2xl:gap-2"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => {
              const active =
                linkMatchesPath(item.to, location.pathname) ||
                item.children?.some((child) =>
                  linkMatchesPath(child.to, location.pathname),
                );
              return (
                <NavItem
                  key={item.label}
                  item={item}
                  active={active}
                  open={openNavMenu === item.label}
                  onOpen={() => setOpenNavMenu(item.label)}
                  onClose={() => setOpenNavMenu("")}
                  onToggle={() =>
                    setOpenNavMenu((current) =>
                      current === item.label ? "" : item.label,
                    )
                  }
                />
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 md:flex-none xl:min-w-[250px]">
            <div className="hidden items-center gap-2 md:flex">
              <IconButton label="Search" onClick={openSearch}>
                <SearchIcon />
              </IconButton>
              <IconButton
                label="Wishlist"
                count={wishlistCount}
                onClick={openWishlist}
              >
                <HeartIcon />
              </IconButton>
            </div>

            {/* <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#17345f1a] bg-white text-[#122a50] shadow-[0_8px_22px_rgba(18,42,80,0.1)] transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d] md:hidden"
              onClick={() => {
                setSearchOpen(false);
                closeProfile();
                setMobileMenuOpen(true);
              }}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <MenuIcon className="h-5 w-5" />
            </button> */}

            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#17345f1a] bg-white text-[#122a50] shadow-[0_8px_22px_rgba(18,42,80,0.1)] transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d] md:hidden"
              onClick={openSearch}
              aria-label="Open search"
            >
              <SearchIcon className="h-5 w-5" />
            </button>

            {isLoggedIn ? (
              <div ref={mobileProfileMenuRef} className="relative md:hidden">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-[#17345f1a] bg-white py-1 pl-1 pr-2.5 shadow-[0_8px_22px_rgba(18,42,80,0.12)] transition-all hover:border-[#d9aa3d] hover:bg-[#f8f1df]"
                  onClick={() => {
                    setSearchOpen(false);
                    setProfileOpen(false);
                    setMobileProfileOpen((value) => !value);
                  }}
                  aria-label="Open profile menu"
                  aria-expanded={mobileProfileOpen}
                >
                  <Avatar user={authUser} className="h-10 w-10" />
                  <ChevronDownIcon className="h-4 w-4 text-[#122a50b2]" />
                </button>
                <UserDropdown
                  open={mobileProfileOpen}
                  onClose={closeProfile}
                  containerRef={mobileProfileMenuRef}
                  onLogout={askLogout}
                />
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#17345f] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(23,52,95,0.18)] transition-colors hover:bg-[#d9aa3d] md:hidden"
              >
                <UserIcon className="h-4 w-4" />
                <span>Login</span>
              </Link>
            )}

            <div className="hidden md:block">
              <IconButton label="Cart" count={cartCount} onClick={openCart}>
                <CartIcon />
              </IconButton>
            </div>

            {isLoggedIn ? (
              <>
                <div ref={profileMenuRef} className="relative hidden md:block">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-[#17345f1a] bg-white py-1.5 pl-1.5 pr-2 text-left transition-all duration-200 hover:border-[#d9aa3d] hover:bg-[#f8f1df]"
                    onClick={() => {
                      setMobileProfileOpen(false);
                      setProfileOpen((value) => !value);
                    }}
                    aria-label="Open profile menu"
                    aria-expanded={profileOpen}
                  >
                    <Avatar user={authUser} className="h-9 w-9" />
                    <span className="hidden min-w-0 flex-col 2xl:flex">
                      <span className="text-sm font-bold leading-none text-[#122a50]">
                        Hi, {authUser?.name || "Sarman"}
                      </span>
                      <span className="mt-1 text-[11px] font-medium leading-none text-[#122a50b2]">
                        Pet Parent
                      </span>
                    </span>
                    <ChevronDownIcon className="hidden h-4 w-4 text-[#122a50b2] sm:block" />
                  </button>
                  <UserDropdown
                    open={profileOpen}
                    onClose={closeProfile}
                    containerRef={profileMenuRef}
                    onLogout={askLogout}
                  />
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d] md:flex"
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Login</span>
                </Link>
                {/* <Link
                  to="/register"
                  className="hidden rounded-full bg-[#d9aa3d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(217,170,61,0.22)] transition-all duration-200 hover:bg-[#17345f] md:inline-flex"
                >
                  Sign Up
                </Link> */}
              </>
            )}
          </div>
        </div>
      </div>

      <MobileBottomNav cartCount={cartCount} />
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[80] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#122a50]/40"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(86vw,360px)] flex-col bg-white shadow-[18px_0_36px_rgba(18,42,80,0.2)]">
            <div className="flex items-center justify-between border-b border-[#17345f1a] px-4 py-3">
              <Logo />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#17345f1a] text-[#122a50] transition-colors hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                onClick={closeMobileMenu}
                aria-label="Close menu"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <nav
              className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
              aria-label="Mobile navigation"
            >
              {mobileDrawerItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children?.length > 0;
                const expanded = Boolean(openMobileGroups[item.label]);
                if (hasChildren) {
                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMobileGroups((current) => ({
                            ...current,
                            [item.label]: !current[item.label],
                          }))
                        }
                        className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-extrabold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                        aria-expanded={expanded}
                        aria-controls={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronDownIcon
                          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expanded && (
                        <div
                          id={`mobile-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                          className="ml-8 grid gap-1 border-l border-[#17345f1a] pl-3"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              to={child.to}
                              onClick={closeMobileMenu}
                              className="flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-[#122a50b2] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className="flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-sm font-extrabold text-[#122a50] transition-colors hover:bg-[#f8f1df] hover:text-[#d9aa3d]"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      <SearchDropdown open={searchOpen} onClose={closeSearch} />
      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={confirmLogout}
      />
    </header>
  );
};

export default Header;
