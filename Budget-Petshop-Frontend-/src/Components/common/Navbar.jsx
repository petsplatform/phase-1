import {
  Heart,
  Menu,
  ShoppingBag,
  ShoppingCart,
  X,
  User,
  Package,
  MapPin,
  Truck,
  Star,
  Lock,
  HelpCircle,
  LogOut,
  ChevronDown,
  Search,
  Phone,
  ArrowRight,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import LogoutModal from "./LogoutModal";
import logo from "../../assets/Logo/logo.png";
import { productApi } from "../../api/productApi";
import { useAuth } from "../../utils/AuthContext";
import { contentApi } from "../../api/contentApi";
import { getProductUrl } from "../../utils/productUtils";

export const FALLBACK_CATEGORIES = [
  { id: "CAT-01", name: "Dog" },
  { id: "CAT-02", name: "Cat" },
  { id: "CAT-03", name: "Pet Medicines" },
  { id: "CAT-04", name: "Food" },
  { id: "CAT-05", name: "Grooming" },
  { id: "CAT-06", name: "Supplements" },
];

export const getGridCols = (count) => {
  if (count <= 5) return Math.max(1, count);
  const rows = Math.ceil(count / 5);
  return Math.min(5, Math.ceil(count / rows));
};

export const GRID_COLS_CLASS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

export const shopMenuItems = [
  { label: "Dog", to: "/shop?search=Dog" },
  { label: "Cat", to: "/shop?search=Cat" },
  { label: "Pet Medicines", to: "/shop?search=Medicine" },
  { label: "Food", to: "/shop?search=Food" },
  { label: "Grooming", to: "/shop?search=Grooming" },
  { label: "Supplements", to: "/shop?search=Supplements" },
  { label: "All Products", to: "/shop" },
];

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
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

function Navbar({ cartItemCount, wishlistItemCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false);
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isAnnouncementOverflowing, setIsAnnouncementOverflowing] = useState(false);
  const announcementContainerRef = useRef(null);
  const announcementTextRef = useRef(null);

  const announcementText =
    announcement?.text || "Welcome to Budget PetShop - Quality Pet Supplies";

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
  }, [announcementText]);

  // Search states and references
  const [searchQuery, setSearchQuery] = useState("");
  const [searchProducts, setSearchProducts] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isSearchInputOpen, setIsSearchInputOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const searchQueryRef = useRef(searchQuery);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  const [categories, setCategories] = useState([]);
  const shopTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getAnnouncement()
      .then((data) => {
        if (!isMounted) return;
        setAnnouncement(isAnnouncementVisible(data) ? data : null);
      })
      .catch((error) => {
        console.error("Failed to load store announcement:", error);
        if (isMounted) setAnnouncement(null);
      });

    productApi
      .getProducts({ limit: 200 })
      .then((data) => {
        if (!isMounted) return;
        const apiProducts = Array.isArray(data.items) ? data.items : [];
        if (apiProducts.length) setSearchProducts(apiProducts);
      })
      .catch((error) => {
        console.error("Failed to load store search products:", error);
      });

    productApi
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

  const handleShopMouseEnter = () => {
    if (shopTimeoutRef.current) {
      clearTimeout(shopTimeoutRef.current);
      shopTimeoutRef.current = null;
    }
    setIsShopMenuOpen(true);
  };

  const handleShopMouseLeave = () => {
    if (shopTimeoutRef.current) {
      clearTimeout(shopTimeoutRef.current);
    }
    shopTimeoutRef.current = setTimeout(() => {
      setIsShopMenuOpen(false);
    }, 200);
  };

  useEffect(() => {
    setIsShopMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsShopMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  // Filter products based on query
  const searchResults = searchQuery.trim()
    ? searchProducts.filter((product) => {
        const term = searchQuery.toLowerCase().trim();
        return (
          product.title?.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.category?.toLowerCase().includes(term)
        );
      })
    : [];

  const handleSearchSubmit = (query) => {
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
      setIsSearchFocused(false);
      setIsMobileSearchFocused(false);
      setIsSearchInputOpen(false);
      setSearchQuery("");
      setOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit(searchQuery);
    }
  };

  const handleResultClick = () => {
    setIsSearchFocused(false);
    setIsMobileSearchFocused(false);
    setIsSearchInputOpen(false);
    setSearchQuery("");
    setOpen(false);
  };

  const { isAuthenticated, logout, user } = useAuth();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const checkAuth = () => {
    setUserName(user?.name || "");
    setUserEmail(user?.email || "");
    setUserAvatar(user?.avatar || user?.avatarUrl || "");
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-state-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-state-change", checkAuth);
    };
  }, [location, user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
        if (!searchQueryRef.current.trim()) {
          setIsSearchInputOpen(false);
        }
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setIsMobileSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    logout("/");
    setIsProfileOpen(false);
    setUserAvatar("");
    window.dispatchEvent(new Event("auth-state-change"));
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setOpen(false);
    setIsLogoutModalOpen(true);
  };

  useEffect(() => {
    const handleResize = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--navbar-height",
          `${height}px`,
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let resizeObserver;
    if (headerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  function renderNavLink(link, className, onClick) {
    if (link.to) {
      return (
        <NavLink
          key={link.label}
          to={link.to}
          onClick={onClick}
          className={({ isActive }) =>
            `${className} ${isActive ? "text-primary" : ""}`.trim()
          }
        >
          {link.label}
        </NavLink>
      );
    }

    if (link.href.startsWith("/")) {
      return (
        <Link
          key={link.label}
          to={link.href}
          onClick={onClick}
          className={className}
        >
          {link.label}
        </Link>
      );
    }

    return (
      <a
        key={link.label}
        href={link.href}
        onClick={onClick}
        className={className}
      >
        {link.label}
      </a>
    );
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-outline bg-background/95 backdrop-blur"
      >
        <div className="border-b border-outline bg-surface-tint text-xs font-semibold text-primary overflow-hidden">
          <div
            ref={announcementContainerRef}
            className="page-shell relative flex items-center justify-center px-4 py-2 sm:px-6 lg:px-8 min-h-[34px] overflow-hidden"
          >
            {/* Hidden measurement element to accurately check if single text line overflows available width */}
            <span
              ref={announcementTextRef}
              className="absolute invisible whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.15em] sm:text-[11px] pointer-events-none opacity-0"
              aria-hidden="true"
            >
              {announcementText}
            </span>

            {/* Announcement Content: Marquee if text overflows screen/container, static centered if it fits */}
            <div className="flex min-w-0 items-center justify-center text-center overflow-hidden w-full max-w-full">
              {isAnnouncementOverflowing ? (
                <div className="animate-announcement-marquee flex gap-12 text-[10px] font-extrabold uppercase tracking-[0.15em] sm:text-[11px]">
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
                    {announcement?.link?.startsWith("http") ? (
                      <a
                        href={announcement.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {announcementText}
                      </a>
                    ) : announcement?.link ? (
                      <Link to={announcement.link} className="hover:underline">
                        {announcementText}
                      </Link>
                    ) : (
                      <span>{announcementText}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
                    {announcement?.link?.startsWith("http") ? (
                      <a
                        href={announcement.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {announcementText}
                      </a>
                    ) : announcement?.link ? (
                      <Link to={announcement.link} className="hover:underline">
                        {announcementText}
                      </Link>
                    ) : (
                      <span>{announcementText}</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 truncate text-[10px] font-extrabold uppercase tracking-[0.15em] sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
                  {announcement?.link?.startsWith("http") ? (
                    <a
                      href={announcement.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {announcementText}
                    </a>
                  ) : announcement?.link ? (
                    <Link to={announcement.link} className="hover:underline">
                      {announcementText}
                    </Link>
                  ) : (
                    <span>{announcementText}</span>
                  )}
                </div>
              )}
            </div>

            {/* 24/7 Customer Support: Completely hidden on phone/mobile (< md screen size), shown on desktop/laptop */}
            <div className="absolute right-4 sm:right-6 lg:right-8 hidden md:flex items-center gap-4 shrink-0 text-[10px] sm:text-xs font-bold">
              <p className="flex items-center gap-1.5 transition-colors hover:opacity-80">
                <Phone className="h-3.5 w-3.5" />
                <span>24/7 Customer Support</span>
              </p>
            </div>
          </div>
        </div>

        <div className="page-shell px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[78px] items-center justify-between gap-4">
            <Link className="shrink-0" to="/">
              <img
                alt="Budget PetShop logo"
                className="h-14 w-auto sm:h-28"
                src={logo}
              />
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {navLinks.map((link) => {
                if (link.label === "Shop") {
                  const isShopActive = location.pathname.startsWith("/shop");
                  return (
                    <div
                      key={link.label}
                      className="py-2"
                      onMouseEnter={handleShopMouseEnter}
                      onMouseLeave={handleShopMouseLeave}
                    >
                      <NavLink
                        to="/shop"
                        onClick={() => {
                          setIsShopMenuOpen(false);
                          setOpen(false);
                        }}
                        className={`text-base font-semibold text-on-background transition-colors hover:text-primary flex items-center gap-1 ${
                          isShopActive || isShopMenuOpen ? "text-primary" : ""
                        }`}
                      >
                        <span>Shop</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isShopMenuOpen
                              ? "rotate-180 text-primary"
                              : "text-charcoal-text"
                          }`}
                        />
                      </NavLink>
                    </div>
                  );
                }

                return renderNavLink(
                  link,
                  "text-base font-semibold text-on-background transition-colors hover:text-primary",
                );
              })}
            </nav>

            <div className="hidden min-w-0 items-center gap-3 lg:flex">
              {/* Desktop Search Icon and Toggleable Input */}
              <div className="relative flex items-center" ref={searchRef}>
                <div
                  className={`relative flex min-w-0 items-center transition-all duration-300 ${isSearchInputOpen ? "w-64 xl:w-72 opacity-100 mr-2" : "w-0 opacity-0 overflow-hidden"}`}
                >
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-full border border-outline bg-surface-soft py-2 px-4 pr-10 text-xs font-semibold text-on-background outline-none transition-all focus:border-primary focus:bg-white focus:shadow-sm"
                    style={{ display: isSearchInputOpen ? "block" : "none" }}
                    autoFocus={isSearchInputOpen}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-soft text-charcoal-text cursor-pointer flex items-center justify-center z-10"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isSearchInputOpen && searchQuery.trim()) {
                      handleSearchSubmit(searchQuery);
                    } else {
                      setIsSearchInputOpen(!isSearchInputOpen);
                    }
                  }}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-full border bg-white transition cursor-pointer select-none active:scale-95 ${
                    isSearchInputOpen
                      ? "border-primary text-primary"
                      : "border-outline-strong hover:border-primary hover:text-secondary"
                  }`}
                  aria-label="Toggle search input"
                >
                  <Search size={20} />
                </button>

                {/* Desktop Search Results Dropdown */}
                {isSearchInputOpen &&
                  isSearchFocused &&
                  searchQuery.trim() !== "" && (
                    <div className="absolute top-full right-0 mt-2 w-[280px] sm:w-[320px] md:w-[350px] lg:w-[400px] max-h-[380px] overflow-y-auto rounded-2xl border border-outline bg-white py-2 shadow-lg z-[100]">
                      {searchResults.length > 0 ? (
                        <div className="grid divide-y divide-outline">
                          {searchResults.slice(0, 6).map((product) => (
                            <Link
                              key={product.id}
                              to={getProductUrl(product)}
                              onClick={handleResultClick}
                              className="flex items-center gap-3 p-3 hover:bg-surface-soft transition text-left"
                            >
                              <img
                                src={product.image}
                                alt={product.title}
                                className="h-10 w-10 rounded-lg object-cover bg-surface-soft border border-outline shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-on-background truncate">
                                  {product.title}
                                </h4>
                                <span className="text-[9px] rounded-full px-2 py-0.5 bg-surface-tint text-primary font-semibold mt-0.5 inline-block">
                                  {product.category}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-extrabold text-secondary">
                                  {product.salePrice}
                                </span>
                                {product.originalPrice && (
                                  <p className="text-[9px] text-[#9A9A9A] line-through font-semibold">
                                    {product.originalPrice}
                                  </p>
                                )}
                              </div>
                            </Link>
                          ))}
                          <div className="p-2 border-t border-outline text-center">
                            <button
                              onClick={() => handleSearchSubmit(searchQuery)}
                              className="text-xs font-bold text-primary hover:text-primary-soft transition-colors w-full py-1.5 rounded-xl hover:bg-surface-tint cursor-pointer"
                            >
                              View all results ({searchResults.length})
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center text-xs font-semibold text-charcoal-text">
                          No products found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  )}
              </div>
              <Link
                to="/wishlist"
                aria-label={`Open wishlist with ${wishlistItemCount} item${wishlistItemCount === 1 ? "" : "s"}`}
                className="relative flex h-12 w-12 items-center justify-center rounded-full border border-outline-strong bg-white transition hover:border-primary hover:text-secondary"
              >
                <Heart size={20} />

                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white shadow-md">
                  {wishlistItemCount}
                </span>
              </Link>

              <Link
                to="/cart"
                aria-label={`Open cart with ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}`}
                className="relative flex h-12 w-12 items-center justify-center rounded-full border border-outline-strong bg-white transition hover:border-primary hover:text-secondary"
              >
                <ShoppingCart size={20} />

                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white shadow-md">
                  {cartItemCount}
                </span>
              </Link>

              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="inline-flex max-w-[180px] items-center gap-2 rounded-full border border-outline-strong bg-white hover:border-secondary hover:text-secondary px-4 py-2.5 text-sm font-bold text-on-background transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/15 text-secondary text-xs font-extrabold shrink-0 overflow-hidden">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : userName ? (
                        userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      ) : (
                        "U"
                      )}
                    </div>
                    <span className="min-w-0 max-w-[80px] truncate">
                      {userName || "My Account"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`opacity-60 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-3xl border border-outline bg-white py-3 shadow-[0_20px_50px_rgba(28,40,33,0.15)] z-[100]">
                      {/* Header info */}
                      <div className="px-4 py-2.5 border-b border-outline mb-1.5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary/15 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : userName ? (
                            userName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          ) : (
                            "U"
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-extrabold text-[#8a8f88] uppercase tracking-wider">
                            Welcome,
                          </p>
                          <p className="text-sm font-bold text-on-background truncate mt-0.5">
                            {userName || "User"}
                          </p>
                          <p className="text-[10px] text-charcoal-text truncate mt-0.5">
                            {userEmail}
                          </p>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="grid px-1.5">
                        <Link
                          to="/profile?tab=dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-on-background hover:bg-surface-tint/50 transition text-left"
                        >
                          <User size={16} className="text-charcoal-text" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          to="/profile?tab=profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-on-background hover:bg-surface-tint/50 transition text-left"
                        >
                          <User size={16} className="text-charcoal-text" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          to="/profile?tab=orders"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-on-background hover:bg-surface-tint/50 transition text-left"
                        >
                          <Package size={16} className="text-charcoal-text" />
                          <span>My Orders</span>
                        </Link>

                        <Link
                          to="/profile?tab=addresses"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-on-background hover:bg-surface-tint/50 transition text-left"
                        >
                          <MapPin size={16} className="text-charcoal-text" />
                          <span>Saved Addresses</span>
                        </Link>

                        <Link
                          to="/profile?tab=tracking"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-on-background hover:bg-surface-tint/50 transition text-left"
                        >
                          <Truck size={16} className="text-charcoal-text" />
                          <span>Order Tracking</span>
                        </Link>

                        <Link
                          to="/profile?tab=support"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3.5 py-2 text-sm font-semibold text-on-background hover:bg-surface-tint/50 transition text-left"
                        >
                          <HelpCircle
                            size={16}
                            className="text-charcoal-text"
                          />
                          <span>Support</span>
                        </Link>
                      </div>

                      {/* Logout Button */}
                      <div className="border-t border-outline mt-2 pt-2 px-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full rounded-2xl px-3.5 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 transition cursor-pointer text-left"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full btn-primary-link bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary/90 cursor-pointer"
                >
                  Login
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline bg-white text-on-background lg:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {open ? (
            <div className="border-t border-outline py-3 lg:hidden">
              {/* Mobile Search */}
              <div className="px-4 mb-4 relative" ref={mobileSearchRef}>
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsMobileSearchFocused(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-full border border-outline bg-surface-soft py-2.5 pl-10 pr-8 text-sm font-semibold text-on-background outline-none transition-all focus:border-primary focus:bg-white"
                  />
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-text pointer-events-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-surface-soft text-charcoal-text cursor-pointer flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Mobile Search Results Dropdown */}
                {isMobileSearchFocused && searchQuery.trim() !== "" && (
                  <div className="absolute left-4 right-4 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-outline bg-white py-2 shadow-lg z-[100]">
                    {searchResults.length > 0 ? (
                      <div className="grid divide-y divide-outline">
                        {searchResults.slice(0, 5).map((product) => (
                          <Link
                            key={product.id}
                            to={getProductUrl(product)}
                            onClick={handleResultClick}
                            className="flex items-center gap-3 p-3 hover:bg-surface-soft transition text-left"
                          >
                            <img
                              src={product.image}
                              alt={product.title}
                              className="h-10 w-10 rounded-lg object-cover bg-surface-soft border border-outline shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-on-background truncate">
                                {product.title}
                              </h4>
                              <span className="text-[9px] rounded-full px-2 py-0.5 bg-surface-tint text-primary font-semibold mt-0.5 inline-block">
                                {product.category}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-extrabold text-secondary">
                                {product.salePrice}
                              </span>
                            </div>
                          </Link>
                        ))}
                        <div className="p-2 border-t border-outline text-center">
                          <button
                            onClick={() => handleSearchSubmit(searchQuery)}
                            className="text-xs font-bold text-primary hover:text-primary-soft transition-colors w-full py-1.5 rounded-xl hover:bg-surface-tint cursor-pointer"
                          >
                            View all results ({searchResults.length})
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-xs font-semibold text-charcoal-text">
                        No products found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <nav className="grid gap-0.5">
                {navLinks.map((link) => {
                  if (link.label === "Shop") {
                    return (
                      <div key={link.label} className="flex flex-col">
                        <div className="flex items-center justify-between rounded-xl px-4 py-1.5 hover:bg-surface">
                          <Link
                            to="/shop"
                            onClick={() => setOpen(false)}
                            className="text-base font-semibold text-on-background hover:text-primary flex-1"
                          >
                            Shop
                          </Link>
                          <button
                            type="button"
                            onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                            className="p-1 text-charcoal-text hover:text-primary"
                            aria-label="Toggle shop subcategories"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${
                                isMobileShopOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </div>
                        {isMobileShopOpen && (
                          <div className="ml-4 pl-2 border-l border-outline/60 flex flex-col gap-1 py-1">
                            <Link
                              to="/shop"
                              onClick={() => setOpen(false)}
                              className="px-3 py-1 text-sm font-bold text-secondary hover:text-primary hover:bg-surface rounded-lg"
                            >
                              All Products
                            </Link>
                            {activeCategories.map((cat) => (
                              <Link
                                key={cat.id || cat.name}
                                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                                onClick={() => setOpen(false)}
                                className="px-3 py-1 text-sm font-semibold text-charcoal-text hover:text-primary hover:bg-surface rounded-lg"
                              >
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return renderNavLink(
                    link,
                    "rounded-xl px-4 py-1.5 text-base font-semibold text-on-background hover:bg-surface",
                    () => setOpen(false),
                  );
                })}
              </nav>

              <div className="mt-3 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/wishlist"
                    onClick={() => setOpen(false)}
                    aria-label={`Open wishlist with ${wishlistItemCount} item${wishlistItemCount === 1 ? "" : "s"}`}
                    className="relative flex h-12 items-center justify-center rounded-full border border-outline-strong bg-white text-on-background"
                  >
                    <Heart size={18} />

                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white shadow-md">
                      {wishlistItemCount}
                    </span>
                  </Link>

                  <Link
                    to="/cart"
                    onClick={() => setOpen(false)}
                    className="relative flex h-12 items-center justify-center rounded-full border border-outline-strong bg-white text-on-background"
                  >
                    <ShoppingCart size={18} />

                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white shadow-md">
                      {cartItemCount}
                    </span>
                  </Link>
                </div>

                {isAuthenticated ? (
                  <div className="grid gap-3">
                    {/* Mobile Profile Card */}
                    <div className="flex items-center gap-3 bg-surface-soft border border-outline rounded-2xl p-4 text-left">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/15 text-secondary font-extrabold shrink-0 overflow-hidden">
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : userName ? (
                          userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        ) : (
                          "U"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-background truncate">
                          {userName || "My Account"}
                        </p>
                        <p className="text-[10px] text-charcoal-text truncate mt-0.5">
                          {userEmail}
                        </p>
                      </div>
                    </div>

                    {/* Navigation Links Grid */}
                    <div className="grid grid-cols-2 gap-2 border-t border-b border-outline border-dashed py-3 my-1">
                      <Link
                        to="/profile?tab=profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-xs font-bold text-on-background hover:bg-surface-tint border border-outline text-left"
                      >
                        <User size={14} className="text-secondary shrink-0" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/profile?tab=orders"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-xs font-bold text-on-background hover:bg-surface-tint border border-outline text-left"
                      >
                        <Package
                          size={14}
                          className="text-secondary shrink-0"
                        />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/profile?tab=addresses"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-xs font-bold text-on-background hover:bg-surface-tint border border-outline text-left"
                      >
                        <MapPin size={14} className="text-secondary shrink-0" />
                        <span>Addresses</span>
                      </Link>

                      <Link
                        to="/profile?tab=tracking"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-xs font-bold text-on-background hover:bg-surface-tint border border-outline text-left"
                      >
                        <Truck size={14} className="text-secondary shrink-0" />
                        <span>Tracking</span>
                      </Link>

                      <Link
                        to="/profile?tab=password"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-xs font-bold text-on-background hover:bg-surface-tint border border-outline text-left"
                      >
                        <Lock size={14} className="text-secondary shrink-0" />
                        <span>Password</span>
                      </Link>

                      <Link
                        to="/profile?tab=support"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5 text-xs font-bold text-on-background hover:bg-surface-tint border border-outline text-left"
                      >
                        <HelpCircle
                          size={14}
                          className="text-secondary shrink-0"
                        />
                        <span>Support</span>
                      </Link>
                    </div>

                    <button
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="w-full rounded-full border border-rose-200 bg-rose-50 py-3 text-center text-xs font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full btn-primary-link bg-secondary px-5 py-3 text-center text-sm font-semibold text-white hover:bg-secondary/90 cursor-pointer"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Desktop Mega Menu Dropdown */}
        {isShopMenuOpen && (
          <div
            className="hidden lg:block absolute left-0 right-0 top-full pt-1.5 z-50 pointer-events-auto"
            onMouseEnter={handleShopMouseEnter}
            onMouseLeave={handleShopMouseLeave}
          >
            <div className="page-shell px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl border border-outline shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                {/* Top Header Bar */}
                <div className="px-6 sm:px-8 py-3 bg-[#fbf7f0] border-b border-outline flex items-center justify-between">
                  <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-charcoal-text">
                    Browse Categories
                  </span>
                  <Link
                    to="/shop"
                    onClick={() => setIsShopMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-secondary hover:text-primary transition-colors group/all"
                  >
                    <span>View All Products</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/all:translate-x-1" />
                  </Link>
                </div>

                {/* Categories Columns */}
                <div className="px-6 py-4 sm:px-8 sm:py-5">
                  <div
                    className={`grid ${
                      GRID_COLS_CLASS[numCols] || "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5"
                    } divide-y sm:divide-y-0 sm:divide-x divide-outline/60`}
                  >
                    {categoryColumns.map((col, colIdx) => (
                      <div
                        key={colIdx}
                        className={`flex flex-col gap-3 justify-start ${
                          colIdx === 0
                            ? "sm:pr-6"
                            : colIdx === categoryColumns.length - 1
                              ? "sm:pl-6"
                              : "sm:px-6"
                        } py-1`}
                      >
                        {col.map((cat) => (
                          <Link
                            key={cat.id || cat.name}
                            to={`/shop?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setIsShopMenuOpen(false)}
                            className="group/item inline-flex items-center text-left py-0.5 transition-transform duration-150 hover:translate-x-1"
                          >
                            <span className="font-bold text-sm sm:text-[15px] text-on-background group-hover/item:text-primary transition-colors duration-150">
                              {cat.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </>
  );
}

export default Navbar;
