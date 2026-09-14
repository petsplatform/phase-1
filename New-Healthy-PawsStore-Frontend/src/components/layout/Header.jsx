import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  Home,
  LogOut,
  Package,
  PackageCheck,
  PawPrint,
  Search,
  Settings,
  ShoppingCart,
  Truck,
  UserRound,
  X,
  Phone,
  ShieldCheck,
  Award,
  ArrowRight,
} from "lucide-react";
import logo from "../../assets/logo/logo.png";
import { getCustomerToken } from "../../api/client";
import { cartApi, CART_UPDATED_EVENT } from "../../api/cartApi";
import { catalogApi } from "../../api/catalogApi";
import { contentApi } from "../../api/contentApi";
import { getStoredAuthUser, logout } from "../../services/authService";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../common/ConfirmModal";
import {
  getWishlistItemId,
  getStoredWishlist,
  refreshWishlistFromApi,
  WISHLIST_UPDATED_EVENT,
} from "../../services/wishlistService";

const FALLBACK_CATEGORIES = [
  { name: "Dog Food" },
  { name: "Cat Food" },
  { name: "Medicine" },
  { name: "Treats" },
  { name: "Toys" },
  { name: "Grooming" },
  { name: "Health Care" },
  { name: "Supplements" },
];

function getGridCols(count) {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count === 4) return 4;
  return 5;
}

const GRID_COLS_CLASS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

const navItems = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  // { label: "Wishlist", href: "/wishlist" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

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

function AnnouncementContent({ text, link }) {
  if (link) {
    const isExt = link.startsWith("http");
    if (isExt) {
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:underline transition-colors"
        >
          <ShieldCheck size={13} className="shrink-0 text-amber-400" />
          <span>{text}</span>
        </a>
      );
    }
    return (
      <Link
        to={link}
        className="inline-flex items-center gap-1.5 hover:underline transition-colors"
      >
        <ShieldCheck size={13} className="shrink-0 text-amber-400" />
        <span>{text}</span>
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <ShieldCheck size={13} className="shrink-0 text-amber-400" />
      <span>{text}</span>
    </span>
  );
}

export function Logo() {
  return (
    <a
      href="/"
      className="block h-[54px] w-[168px] shrink-0 sm:h-[64px] sm:w-[220px] lg:h-[72px] lg:w-[260px]"
      aria-label="HealthyPawsStore home"
    >
      <img
        src={logo}
        alt="HealthyPawsStore"
        className="h-full w-full object-contain object-left"
      />
    </a>
  );
}

export default function Header({ showNav = true, iconCounts = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { showToast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authUser, setAuthUser] = useState(() =>
    getCustomerToken() ? getStoredAuthUser() : null,
  );
  const [wishlistCount, setWishlistCount] = useState(() =>
    getUniqueWishlistCount(),
  );
  const [cartCount, setCartCount] = useState(0);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [isAnnouncementOverflowing, setIsAnnouncementOverflowing] = useState(false);
  const announcementContainerRef = useRef(null);
  const announcementTextRef = useRef(null);

  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const productsDropdownRef = useRef(null);
  const megaMenuRef = useRef(null);
  const productsTimeoutRef = useRef(null);
  const [categories, setCategories] = useState([]);

  // Category navigation helpers ensuring clean route transition
  const handleCategoryClick = (categoryName) => {
    setIsProductsDropdownOpen(false);
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleViewAllProducts = () => {
    setIsProductsDropdownOpen(false);
    navigate("/products");
  };

  // Hover handlers with debounce buffer to avoid menu flickering
  const handleProductsMouseEnter = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
      productsTimeoutRef.current = null;
    }
    setIsProductsDropdownOpen(true);
  };

  const handleProductsMouseLeave = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
    }
    productsTimeoutRef.current = setTimeout(() => {
      setIsProductsDropdownOpen(false);
    }, 200);
  };

  // Close dropdown on route change
  useEffect(() => {
    setIsProductsDropdownOpen(false);
  }, [location.pathname, location.search]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsProductsDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close desktop products dropdown on outside click (excluding megaMenuRef and productsDropdownRef)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isProductsDropdownOpen &&
        productsDropdownRef.current &&
        !productsDropdownRef.current.contains(e.target) &&
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target)
      ) {
        setIsProductsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProductsDropdownOpen]);

  // Fetch categories for nav
  useEffect(() => {
    let isMounted = true;
    catalogApi
      .getCategories()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const active = data.filter(
            (c) => c.status?.toLowerCase() !== "inactive",
          );
          setCategories(active.length > 0 ? active : data);
        }
      })
      .catch((error) => {
        console.warn("Failed to load categories for nav:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCategories =
    categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const numCols = useMemo(() => {
    return getGridCols(activeCategories.length);
  }, [activeCategories.length]);

  const categoryColumns = useMemo(() => {
    const list = activeCategories;
    const cols = Array.from({ length: numCols }, () => []);
    list.forEach((item, idx) => {
      cols[idx % numCols].push(item);
    });
    return cols;
  }, [activeCategories, numCols]);

  const announcementText =
    announcement?.text || "Genuine Vet Approved Medicines • 100% Quality Guarantee";

  useEffect(() => {
    let resizeObserver = null;

    const checkAnnouncementOverflow = () => {
      if (announcementContainerRef.current && announcementTextRef.current) {
        const containerWidth = announcementContainerRef.current.clientWidth;
        const textWidth = announcementTextRef.current.scrollWidth;
        setIsAnnouncementOverflowing(textWidth > containerWidth - 16);
      }
    };

    checkAnnouncementOverflow();
    window.addEventListener("resize", checkAnnouncementOverflow);

    if (announcementContainerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(checkAnnouncementOverflow);
      resizeObserver.observe(announcementContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkAnnouncementOverflow);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [announcementText]);

  const profileRef = useRef(null);
  const mobileProfileRef = useRef(null);

  useEffect(() => {
    let active = true;

    contentApi
      .getAnnouncement()
      .then((data) => {
        if (active) setAnnouncement(isAnnouncementVisible(data) ? data : null);
      })
      .catch((error) => {
        console.error("Failed to load announcement:", error);
        if (active) setAnnouncement(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const syncUser = () =>
      setAuthUser(getCustomerToken() ? getStoredAuthUser() : null);

    syncUser();
    window.addEventListener("storage", syncUser);
    window.addEventListener("healthyPawsAuthChange", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("healthyPawsAuthChange", syncUser);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const syncWishlistCount = () => setWishlistCount(getUniqueWishlistCount());

    syncWishlistCount();
    if (getCustomerToken()) {
      refreshWishlistFromApi()
        .then(() => {
          if (active) syncWishlistCount();
        })
        .catch(() => {});
    }
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount);
    window.addEventListener("storage", syncWishlistCount);

    return () => {
      active = false;
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistCount);
      window.removeEventListener("storage", syncWishlistCount);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const syncCartCount = async (event) => {
      const eventItems = Array.isArray(event?.detail) ? event.detail : null;
      if (eventItems) {
        setCartCount(getUniqueCartCount(eventItems));
        return;
      }

      try {
        const items = await cartApi.getCart();
        if (active) setCartCount(getUniqueCartCount(items));
      } catch {
        if (active) setCartCount(0);
      }
    };

    syncCartCount();
    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      const insideDesktopProfile = profileRef.current?.contains(event.target);
      const insideMobileProfile = mobileProfileRef.current?.contains(
        event.target,
      );

      if (!insideDesktopProfile && !insideMobileProfile) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActiveRoute = (href) => {
    if (href === "#") return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      showToast("Please enter a search term.", "error");
      return;
    }

    navigate(`/products?q=${encodeURIComponent(query)}`);
    setSearchOpen(false);
  };

  const requestLogout = () => {
    setProfileOpen(false);
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate("/login");
  };

  return (
    <header className="relative z-30 bg-softCream shadow-[0_2px_12px_rgba(36,49,47,0.08)]">
      {/* Top Announcement Bar - Centered across all screens */}
      <div className="bg-secondaryDark text-white overflow-hidden select-none border-b border-white/10">
        <div
          ref={announcementContainerRef}
          className="mx-auto flex min-h-[34px] max-w-[1600px] items-center justify-center px-4 py-1 text-[11px] sm:text-xs font-bold"
        >
          {/* Hidden reference measurement */}
          <span
            ref={announcementTextRef}
            className="sr-only invisible absolute whitespace-nowrap pointer-events-none"
            aria-hidden="true"
          >
            {announcementText}
          </span>

          {/* If overflowing, smooth continuous marquee */}
          {isAnnouncementOverflowing ? (
            <div className="animate-announcement-marquee flex gap-12 text-[11px] sm:text-xs font-bold text-white whitespace-nowrap">
              <span className="inline-flex items-center gap-2">
                <AnnouncementContent
                  text={announcementText}
                  link={announcement?.link}
                />
              </span>
              <span className="inline-flex items-center gap-2" aria-hidden="true">
                <AnnouncementContent
                  text={announcementText}
                  link={announcement?.link}
                />
              </span>
              <span className="inline-flex items-center gap-2" aria-hidden="true">
                <AnnouncementContent
                  text={announcementText}
                  link={announcement?.link}
                />
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center text-center text-[11px] sm:text-xs font-bold text-white">
              <AnnouncementContent
                text={announcementText}
                link={announcement?.link}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-[74px] items-center gap-4 px-4 py-3 sm:px-6 md:min-h-[83px] md:gap-8 lg:px-[68px]">
        <Logo />
        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto hidden h-11 max-w-[515px] flex-1 overflow-hidden rounded-lg border border-borderSoft bg-white shadow-[0_8px_20px_rgba(36,49,47,0.06)] md:flex"
        >
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 px-5 text-[13px] font-semibold outline-none placeholder:text-muted/75"
            placeholder="Search for food, treats, toys, medicines..."
          />
          <button
            className="grid w-14 place-items-center bg-secondaryDark text-white"
            aria-label="Search"
            type="submit"
          >
            <Search size={21} />
          </button>
        </form>
        <div className="ml-auto hidden items-center gap-8 md:flex">
          <HeaderIcon
            label="Wishlist"
            href="/wishlist"
            icon={Heart}
            count={iconCounts.wishlist ?? wishlistCount}
          />
          {authUser ? (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="relative flex min-w-[58px] flex-col items-center justify-center gap-1.5 text-[12px] font-extrabold leading-none text-textMain focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-secondaryDark text-[12px] font-extrabold text-white ring-2 ring-white shadow-sm">
                  {authUser.avatar ? (
                    <img
                      src={authUser.avatar}
                      alt=""
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(authUser.name)
                  )}
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap leading-none">
                  Profile
                  <ChevronDown size={12} />
                </span>
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[58px] z-40 w-[250px] overflow-hidden rounded-2xl border border-borderSoft bg-white text-textMain shadow-contact"
                >
                  <div className="flex items-center gap-3 border-b border-borderSoft bg-sageLight px-4 py-4">
                    <span className="grid size-11 place-items-center rounded-full bg-secondaryDark text-[14px] font-extrabold text-white">
                      {authUser.avatar ? (
                        <img
                          src={authUser.avatar}
                          alt=""
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(authUser.name)
                      )}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-[14px] font-extrabold">
                        {authUser.name}
                      </strong>
                      <span className="block truncate text-[12px] font-semibold text-muted">
                        {authUser.email}
                      </span>
                    </span>
                  </div>
                  <ProfileLink
                    href="/account/details"
                    icon={UserRound}
                    label="My Profile"
                  />
                  <ProfileLink
                    href="/account/orders"
                    icon={PackageCheck}
                    label="My Orders"
                  />
                  <ProfileLink href="/wishlist" icon={Heart} label="Wishlist" />
                  <ProfileLink
                    href="/account/dashboard"
                    icon={Settings}
                    label="Dashboard"
                  />
                  <button
                    type="button"
                    onClick={requestLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-extrabold text-error transition hover:bg-sageLight focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-secondary"
                    role="menuitem"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <HeaderIcon label="Account" href="/login" icon={UserRound} filled />
          )}
          <HeaderIcon
            label="Cart"
            href="/cart"
            icon={ShoppingCart}
            count={iconCounts.cart ?? cartCount}
          />
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <a
            href="/wishlist"
            aria-label="Wishlist"
            className="relative grid size-10 place-items-center rounded-full border border-borderSoft bg-white text-primary shadow-sm"
          >
            <Heart size={18} />
            {(iconCounts.wishlist ?? wishlistCount) > 0 && (
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-orange text-[9px] font-extrabold text-white">
                {iconCounts.wishlist ?? wishlistCount}
              </span>
            )}
          </a>
          <button
            type="button"
            onClick={() => {
              setSearchOpen((value) => !value);
              setProfileOpen(false);
            }}
            className="grid size-10 place-items-center rounded-full border border-borderSoft bg-white text-primary shadow-sm"
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          {authUser && (
            <div ref={mobileProfileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="flex h-10 items-center gap-2 rounded-full border border-borderSoft bg-white px-2 pr-3 text-secondaryDark shadow-sm"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-secondaryDark text-[11px] font-extrabold text-white">
                  {authUser.avatar ? (
                    <img
                      src={authUser.avatar}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    getInitials(authUser.name)
                  )}
                </span>
                <ChevronDown size={14} />
              </button>
              {profileOpen && (
                <MobileProfileMenu
                  authUser={authUser}
                  onLogout={requestLogout}
                />
              )}
            </div>
          )}
          {!authUser && (
            <a
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full bg-secondaryDark px-4 text-[12px] font-extrabold text-white shadow-sm"
            >
              Login
            </a>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-borderSoft bg-softCream px-4 pb-4 md:hidden">
          <form
            onSubmit={handleSearchSubmit}
            className="flex h-11 overflow-hidden rounded-lg border border-borderSoft bg-white shadow-[0_8px_20px_rgba(36,49,47,0.06)]"
          >
            <input
              autoFocus
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-w-0 flex-1 px-4 text-[13px] font-semibold outline-none placeholder:text-muted/75"
              placeholder="Search products..."
            />
            <button
              className="grid w-12 place-items-center bg-secondaryDark text-white"
              aria-label="Search products"
              type="submit"
            >
              <Search size={19} />
            </button>
          </form>
        </div>
      )}

      {showNav && (
        <nav className="border-y border-borderSoft bg-white relative">
          <div className="hidden h-[51px] items-center justify-center gap-9 px-6 text-[13px] font-extrabold md:flex lg:px-[68px]">
            {navItems.map((item) => {
              const active = isActiveRoute(item.href);
              const isProductsItem = item.label === "Products" || item.href === "/products";

              if (isProductsItem) {
                return (
                  <div
                    key={item.label}
                    ref={productsDropdownRef}
                    className="relative flex h-full items-center"
                    onMouseEnter={handleProductsMouseEnter}
                    onMouseLeave={handleProductsMouseLeave}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setIsProductsDropdownOpen(false)}
                      className={`relative flex h-full items-center gap-1.5 px-1 ${
                        active
                          ? "text-secondaryDark after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-secondary"
                          : "text-textMain hover:text-secondaryDark transition-colors"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          isProductsDropdownOpen ? "rotate-180 text-secondary" : "text-muted"
                        }`}
                      />
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`relative flex h-full items-center gap-1 px-1 ${
                    active
                      ? "text-secondaryDark after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-secondary"
                      : "text-textMain hover:text-secondaryDark transition-colors"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Mega Menu Dropdown */}
          {isProductsDropdownOpen && (
            <div
              ref={megaMenuRef}
              className="hidden md:block absolute left-0 right-0 top-full pt-1.5 z-50 pointer-events-auto"
              onMouseEnter={handleProductsMouseEnter}
              onMouseLeave={handleProductsMouseLeave}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl border border-borderSoft shadow-[0_20px_50px_rgba(20,61,60,0.12)] overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                  {/* Top Header Bar */}
                  <div className="px-6 sm:px-8 py-3 bg-sageLight/60 border-b border-borderSoft flex items-center justify-between">
                    <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-primaryDark">
                      Browse Categories
                    </span>
                    <button
                      type="button"
                      onClick={handleViewAllProducts}
                      className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-secondary hover:text-secondaryDark transition-colors group/all cursor-pointer"
                    >
                      <span>View All Products</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/all:translate-x-1" />
                    </button>
                  </div>

                  {/* Categories Columns */}
                  <div className="px-6 py-4 sm:px-8 sm:py-5">
                    <div
                      className={`grid ${
                        GRID_COLS_CLASS[numCols] || "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                      } divide-y sm:divide-y-0 sm:divide-x divide-borderSoft/60`}
                    >
                      {categoryColumns.map((col, colIdx) => (
                        <div
                          key={colIdx}
                          className={`flex flex-col gap-2.5 justify-start ${
                            colIdx === 0
                              ? "sm:pr-6"
                              : colIdx === categoryColumns.length - 1
                              ? "sm:pl-6"
                              : "sm:px-6"
                          } py-1`}
                        >
                          {col.map((cat) => (
                            <button
                              type="button"
                              key={cat.id || cat.name}
                              onClick={() => handleCategoryClick(cat.name)}
                              className="group/item inline-flex items-center text-left py-0.5 transition-transform duration-150 hover:translate-x-1 cursor-pointer"
                            >
                              <span className="font-bold text-sm text-textMain group-hover/item:text-secondary transition-colors duration-150">
                                {cat.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </nav>
      )}
      <MobileBottomBar
        cartCount={iconCounts.cart ?? cartCount}
        wishlistCount={iconCounts.wishlist ?? wishlistCount}
      />
      <ConfirmModal
        open={logoutOpen}
        title="Logout from your account?"
        message="You will need to sign in again to view orders, saved addresses, and account details."
        confirmText="Yes, Logout"
        tone="danger"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </header>
  );
}

function MobileProfileMenu({ authUser, onLogout }) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-12 z-50 w-[254px] overflow-hidden rounded-[18px] border border-borderSoft bg-white text-textMain shadow-contact"
    >
      <div className="flex items-center gap-3 border-b border-borderSoft bg-sageLight px-4 py-4">
        <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-secondaryDark text-[14px] font-extrabold text-white">
          {authUser.avatar ? (
            <img
              src={authUser.avatar}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            getInitials(authUser.name)
          )}
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-[14px] font-extrabold">
            {authUser.name}
          </strong>
          <span className="block truncate text-[12px] font-semibold text-muted">
            {authUser.email}
          </span>
        </span>
      </div>
      <ProfileLink
        href="/account/dashboard"
        icon={Settings}
        label="My Dashboard"
      />
      <ProfileLink
        href="/account/orders"
        icon={PackageCheck}
        label="My Orders"
      />
      <ProfileLink href="/wishlist" icon={Heart} label="Wishlist" />
      <ProfileLink
        href="/account/addresses"
        icon={PawPrint}
        label="Saved Addresses"
      />
      <ProfileLink
        href="/account/details"
        icon={UserRound}
        label="Account Details"
      />
      <ProfileLink
        href="/account/track-order"
        icon={Truck}
        label="Order Tracking"
      />
      <div className="border-t border-borderSoft" />
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-[13px] font-extrabold text-error transition hover:bg-sageLight"
        role="menuitem"
      >
        <LogOut size={17} />
        Logout
      </button>
    </div>
  );
}

function MobileBottomBar({ cartCount, wishlistCount }) {
  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Product", href: "/products", icon: Package },
    { label: "Wishlist", href: "/wishlist", icon: Heart, count: wishlistCount },
    { label: "Cart", href: "/cart", icon: ShoppingCart, count: cartCount },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 grid h-[66px] grid-cols-4 border-t border-white/10 bg-primaryDark text-white shadow-[0_-10px_24px_rgba(14,48,47,0.22)] md:hidden"
      aria-label="Mobile bottom navigation"
    >
      {items.map(({ label, href, icon: Icon, count }) => (
        <a
          key={label}
          href={href}
          className="relative flex flex-col items-center justify-center gap-1 text-[11px] font-extrabold"
        >
          <span
            className={`grid size-7 place-items-center rounded-full ${count ? "relative" : ""}`}
          >
            <Icon size={19} />
            {count !== null && count !== undefined && count > 0 && (
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-orange text-[9px] font-extrabold text-white">
                {count}
              </span>
            )}
          </span>
          {label}
        </a>
      ))}
    </nav>
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getUniqueWishlistCount() {
  return new Set(
    getStoredWishlist()
      .map((item) => getWishlistItemId(item))
      .filter(Boolean),
  ).size;
}

function getUniqueCartCount(items = []) {
  return new Set(
    items
      .map((item) =>
        String(item.productId || item.id || item.slug || item.title || ""),
      )
      .filter(Boolean),
  ).size;
}

function HeaderIcon({ label, href, icon: Icon, count, filled = false }) {
  return (
    <a
      href={href}
      className="relative flex flex-col items-center gap-1 text-[12px] font-extrabold text-textMain focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
    >
      <Icon
        size={24}
        className="text-primary"
        fill={filled ? "currentColor" : "none"}
      />
      {count !== null && count !== undefined && (
        <span className="absolute -right-2 -top-1 grid size-5 place-items-center rounded-full bg-orange text-[10px] text-white">
          {count}
        </span>
      )}
      {label}
    </a>
  );
}

function ProfileLink({ href, icon: Icon, label }) {
  return (
    <a
      href={href}
      role="menuitem"
      className="flex items-center gap-3 px-4 py-3 text-[13px] font-extrabold text-textMain transition hover:bg-sageLight focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-secondary"
    >
      <Icon size={17} className="text-secondaryDark" />
      {label}
    </a>
  );
}
