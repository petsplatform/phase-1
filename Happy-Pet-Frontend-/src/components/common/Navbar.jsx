import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import logo from "../../assets/logo/logo-bg.png";
import {
  Search,
  Heart,
  ShoppingCart,
  Phone,
  Menu,
  X,
  User,
  Package,
  MapPin,
  Truck,
  Lock,
  HelpCircle,
  LogOut,
  ChevronDown,
  Mail,
  ArrowRight,
} from "lucide-react";
import { useCart } from "../../utils/cartFunctionality";
import { useWishlist } from "../../utils/wishlistFunctionality";
import { useAuth } from "../../store/authentication/authContext";
import { contentApi } from "../../api/contentApi";
import { productApi } from "../../api/productApi";
import { shopMenuItems } from "../../config/siteNavigation";

export { shopMenuItems };

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
  if (!link) return text;
  if (/^https?:\/\//i.test(link)) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-brand-peach transition-colors"
      >
        {text}
      </a>
    );
  }
  return (
    <Link to={link} className="hover:text-brand-peach transition-colors">
      {text}
    </Link>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const { cartItemCount } = useCart();
  const { wishlistIds } = useWishlist();
  const wishlistCount = wishlistIds.length;
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const productsDropdownRef = useRef(null);
  const megaMenuRef = useRef(null);
  const productsTimeoutRef = useRef(null);
  const [categories, setCategories] = useState([]);

  const { currentUser, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [searchProducts, setSearchProducts] = useState([]);

  const [isAnnouncementOverflowing, setIsAnnouncementOverflowing] = useState(false);
  const announcementContainerRef = useRef(null);
  const announcementTextRef = useRef(null);

  const announcementText =
    announcement?.text || "Genuine Vet Approved Medicines";

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

  useEffect(() => {
    let isMounted = true;

    contentApi
      .getAnnouncement()
      .then((data) => {
        if (!isMounted) return;
        setAnnouncement(isAnnouncementVisible(data) ? data : null);
      })
      .catch((error) => {
        console.error("Failed to load announcement:", error);
        if (isMounted) setAnnouncement(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    productApi
      .getProducts({ limit: 50 })
      .then((data) => {
        if (isMounted) {
          setSearchProducts(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch(() => {
        if (isMounted) setSearchProducts([]);
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isProfileOpen &&
        !event.target.closest(".profile-dropdown-container")
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfileOpen]);

  // Sync navbar search input with URL search param
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  // Filter products for autocomplete suggestions (max 5 items)
  const searchSuggestions = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return searchProducts
      .filter(
        (product) =>
          String(product.name || "")
            .toLowerCase()
            .includes(query) ||
          String(product.categoryName || "")
            .toLowerCase()
            .includes(query) ||
          String(product.description || "")
            .toLowerCase()
            .includes(query),
      )
      .slice(0, 5);
  }, [searchProducts, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/products");
    }
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Track scroll position to add sticky styles
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full z-50 transition-all duration-300">
      {/* Top Announcement & Utility Bar */}
      <div className="bg-brand-purple text-brand-cream text-[11px] font-medium border-b border-brand-purple/20 overflow-hidden">
        <div
          ref={announcementContainerRef}
          className="relative flex items-center justify-center px-4 py-2 sm:px-6 lg:px-8 min-h-[34px] overflow-hidden max-w-7xl mx-auto"
        >
          {/* Hidden measurement element to accurately check if single text line overflows available width */}
          <span
            ref={announcementTextRef}
            className="absolute invisible whitespace-nowrap text-[11px] font-medium pointer-events-none opacity-0"
            aria-hidden="true"
          >
            {announcementText}
          </span>

          {/* Announcement Content: Completely centered across the bar */}
          <div className="flex min-w-0 items-center justify-center text-center overflow-hidden w-full max-w-full">
            {isAnnouncementOverflowing ? (
              <div className="animate-announcement-marquee flex gap-12 text-[11px] font-medium text-brand-cream/90">
                <span className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 bg-brand-peach rounded-full animate-pulse shrink-0"></span>
                  <AnnouncementContent
                    text={announcementText}
                    link={announcement?.link}
                  />
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 bg-brand-peach rounded-full animate-pulse shrink-0"></span>
                  <AnnouncementContent
                    text={announcementText}
                    link={announcement?.link}
                  />
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 truncate text-[11px] font-medium text-brand-cream/90 text-center">
                <span className="w-1.5 h-1.5 bg-brand-peach rounded-full animate-pulse shrink-0"></span>
                <AnnouncementContent
                  text={announcementText}
                  link={announcement?.link}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        className={`w-full transition-all duration-300 bg-white border-b border-brand-purple/10 relative ${
          isScrolled ? "fixed top-0 left-0 shadow-md py-2.5 z-50" : "py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Main 3-Column Layout Container */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Column - Logo */}
            <div className="flex-1 flex justify-start">
              <Link to="/" className="flex-shrink-0 flex items-center group">
                <img
                  src={logo}
                  alt="Happy Pet Rx Logo"
                  className="h-18 sm:h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
                />
              </Link>
            </div>

            {/* Center Column - Desktop Navigation Links */}
            <div className="hidden lg:flex flex-initial justify-center">
              <nav className="flex items-center gap-1.5">
                <Link
                  to="/"
                  className={`text-[16px] font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                    location.pathname === "/"
                      ? "text-brand-peach font-bold bg-brand-peach/10"
                      : "text-brand-purple hover:text-brand-peach hover:bg-brand-purple/[0.04]"
                  }`}
                >
                  Home
                </Link>

                {/* Products / Shop with Mega-Menu Dropdown */}
                <div
                  ref={productsDropdownRef}
                  className="relative py-2"
                  onMouseEnter={handleProductsMouseEnter}
                  onMouseLeave={handleProductsMouseLeave}
                >
                  <Link
                    to="/products"
                    onClick={() => setIsProductsDropdownOpen(false)}
                    className={`text-[16px] font-medium px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      location.pathname.startsWith("/products") || isProductsDropdownOpen
                        ? "text-brand-peach font-bold bg-brand-peach/10"
                        : "text-brand-purple hover:text-brand-peach hover:bg-brand-purple/[0.04]"
                    }`}
                  >
                    <span>Products</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isProductsDropdownOpen
                          ? "rotate-180 text-brand-peach"
                          : "text-brand-purple/60"
                      }`}
                    />
                  </Link>
                </div>

                <Link
                  to="/about"
                  className={`text-[16px] font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                    location.pathname === "/about"
                      ? "text-brand-peach font-bold bg-brand-peach/10"
                      : "text-brand-purple hover:text-brand-peach hover:bg-brand-purple/[0.04]"
                  }`}
                >
                  About
                </Link>

                <Link
                  to="/contact"
                  className={`text-[16px] font-medium px-4 py-2 rounded-full transition-all duration-200 ${
                    location.pathname === "/contact"
                      ? "text-brand-peach font-bold bg-brand-peach/10"
                      : "text-brand-purple hover:text-brand-peach hover:bg-brand-purple/[0.04]"
                  }`}
                >
                  Contact
                </Link>
              </nav>
            </div>

            {/* Right Column - Actions */}
            <div className="flex-1 flex justify-end items-center gap-2.5 sm:gap-3.5">
              {/* Desktop Search Toggle Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex w-10 h-10 rounded-full hover:bg-brand-purple/5 text-brand-purple transition-all duration-200 items-center justify-center"
                aria-label="Open search"
              >
                <Search className="w-5.5 h-5.5" />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="w-10 h-10 rounded-full hover:bg-brand-purple/5 text-brand-purple transition-all duration-200 flex items-center justify-center relative group"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <Heart className="w-5.5 h-5.5 transition-transform duration-200 group-hover:scale-105" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-peach text-brand-purple text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-brand-purple text-brand-cream text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
                  Wishlist
                </span>
              </Link>

              {/* Shopping Cart */}
              <Link
                to="/cart"
                className="w-10 h-10 rounded-full hover:bg-brand-purple/5 text-brand-purple transition-all duration-200 flex items-center justify-center relative group"
                aria-label="Shopping Cart"
              >
                <div className="relative">
                  <ShoppingCart className="w-5.5 h-5.5 transition-transform duration-200 group-hover:scale-105" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-peach text-brand-purple text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-brand-purple text-brand-cream text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-md">
                  View Cart
                </span>
              </Link>

              {/* Login Button at the end */}
              {currentUser ? (
                <div className="relative profile-dropdown-container hidden sm:block">
                  {/* Premium Profile Pill Button */}
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2.5 bg-white border border-brand-purple/15 hover:border-brand-purple/30 hover:shadow-md pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer group shadow-sm"
                    aria-label="Open profile menu"
                  >
                    {/* Avatar */}
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full border-2 border-brand-purple/20 bg-brand-cream object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple/80 text-brand-cream font-extrabold flex items-center justify-center text-[11px] flex-shrink-0 shadow-inner">
                        {currentUser.name
                          ? currentUser.name[0].toUpperCase()
                          : "P"}
                      </div>
                    )}

                    {/* Name & Email Stack */}
                    <div className="text-left leading-none">
                      <p className="text-[11px] font-extrabold text-brand-purple truncate max-w-[90px]">
                        {currentUser.name.split(" ")[0]}
                      </p>
                      <p className="text-[10px] font-medium text-brand-brown/55 truncate max-w-[90px] mt-0.5">
                        {currentUser.email}
                      </p>
                    </div>

                    {/* Chevron */}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-brand-purple/50 flex-shrink-0 transition-transform duration-200 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-72 bg-white border border-brand-purple/8 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Welcome / User Info Header */}
                      <div className="px-5 py-4 bg-gradient-to-br from-brand-purple/[0.04] to-brand-peach/[0.04] border-b border-brand-purple/8">
                        <div className="flex items-center gap-3.5">
                          {currentUser.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt={currentUser.name}
                              className="w-11 h-11 rounded-full border-2 border-brand-purple/15 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-purple to-[#3b003b] text-brand-cream font-extrabold flex items-center justify-center text-base flex-shrink-0 shadow-md">
                              {currentUser.name
                                ? currentUser.name[0].toUpperCase()
                                : "P"}
                            </div>
                          )}
                          <div className="overflow-hidden flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-brown/40 mb-0.5">
                              Logged in as
                            </p>
                            <p className="text-sm font-extrabold text-brand-purple truncate">
                              {currentUser.name}
                            </p>
                            <p className="text-[11px] font-medium text-brand-brown/60 truncate mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3 inline-block text-brand-purple/40 flex-shrink-0" />
                              {currentUser.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu List */}
                      <div className="py-2 flex flex-col">
                        {[
                          {
                            name: "My Profile",
                            to: "/profile?tab=profile",
                            icon: User,
                          },
                          {
                            name: "My Orders",
                            to: "/profile?tab=orders",
                            icon: Package,
                          },
                          {
                            name: "Saved Addresses",
                            to: "/profile?tab=addresses",
                            icon: MapPin,
                          },
                          {
                            name: "Order Tracking",
                            to: "/profile?tab=tracking",
                            icon: Truck,
                          },
                          {
                            name: "Support",
                            to: "/profile?tab=support",
                            icon: HelpCircle,
                          },
                        ].map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <Link
                              key={item.name}
                              to={item.to}
                              onClick={() => setIsProfileOpen(false)}
                              className="px-5 py-2.5 flex items-center gap-3.5 text-[11px] font-semibold text-brand-purple/90 hover:bg-brand-purple/[0.04] hover:text-brand-purple transition-all duration-150 text-left"
                            >
                              <span className="w-7 h-7 rounded-lg bg-brand-purple/[0.06] flex items-center justify-center flex-shrink-0">
                                <IconComponent className="w-3.5 h-3.5 text-brand-purple/70" />
                              </span>
                              <span>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Divider & Logout Button */}
                      <div className="p-2 border-t border-brand-purple/8">
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3.5 px-3 py-2.5 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-150 cursor-pointer text-left"
                        >
                          <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                            <LogOut className="w-3.5 h-3.5 text-red-400" />
                          </span>
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold text-brand-cream bg-brand-purple hover:bg-brand-purple/90 rounded-full transition-all duration-200 shadow-sm"
                >
                  Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2.5 rounded-full border border-brand-purple/10 text-brand-purple hover:bg-brand-purple/[0.03] focus:outline-none transition-colors duration-200 lg:hidden flex items-center justify-center"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Futuristic Search Overlay (Desktop Only) */}
          {isSearchOpen && (
            <div className="absolute inset-0 bg-white z-20 flex items-center justify-between animate-in fade-in duration-200">
              {/* Left Side Logo placeholder to align with base header */}
              <div className="flex-1 flex justify-start">
                <img
                  src={logo}
                  alt="Happy Pet Rx Logo"
                  className="h-16 sm:h-20 w-auto object-contain"
                />
              </div>

              {/* Full Width Center Search input */}
              <div className="flex-1 max-w-2xl relative">
                <form className="relative" onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search medications, pet care, wellness..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-purple/[0.03] border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/35 focus:bg-white focus:outline-none text-brand-purple placeholder-brand-brown/50 text-xs px-4 py-2.5 pl-11 rounded-full transition-all duration-300 shadow-inner"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-brand-brown/60" />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-brand-brown/50 hover:text-brand-purple"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Suggestions Dropdown */}
                {searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-md border border-brand-purple/10 rounded-[18px] shadow-[0_20px_50px_rgba(75,0,75,0.12)] overflow-hidden z-50 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                    {searchSuggestions.length > 0 ? (
                      <div className="py-2.5">
                        <div className="px-4.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#a855f7]/60">
                          Suggested Products
                        </div>
                        <div className="mt-1 divide-y divide-brand-purple/5">
                          {searchSuggestions.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => {
                                navigate(
                                  `/products?q=${encodeURIComponent(product.name)}`,
                                );
                                setIsSearchOpen(false);
                              }}
                              className="w-full flex items-center gap-4 px-4.5 py-3 hover:bg-brand-purple/[0.03] transition-all duration-200 text-left cursor-pointer group"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg border border-brand-purple/5"
                              />
                              <div className="flex-grow min-w-0">
                                <h4 className="text-xs font-semibold text-brand-purple truncate group-hover:text-brand-peach transition-colors">
                                  {product.name}
                                </h4>
                                <span className="text-[10px] text-brand-brown/60 font-medium">
                                  {product.categoryName}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-bold text-brand-purple">
                                  ${product.sellPrice.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="px-4.5 pt-2.5 pb-1 border-t border-brand-purple/5 text-center">
                          <button
                            type="button"
                            onClick={handleSearchSubmit}
                            className="text-[10px] font-extrabold text-[#a855f7] hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            See all matching products
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-brand-brown/60 text-xs font-medium">
                        No matching products found for "
                        <span className="font-bold text-brand-purple">
                          {searchQuery}
                        </span>
                        "
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close Button on the Right */}
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-brand-purple/5 text-brand-purple transition-all duration-200 flex items-center justify-center"
                  aria-label="Close search"
                >
                  <X className="w-5.5 h-5.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Mega Menu Dropdown */}
        {isProductsDropdownOpen && (
          <div
            ref={megaMenuRef}
            className="hidden lg:block absolute left-0 right-0 top-full pt-1.5 z-50 pointer-events-auto"
            onMouseEnter={handleProductsMouseEnter}
            onMouseLeave={handleProductsMouseLeave}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl border border-[#F0E6D8] shadow-[0_20px_50px_rgba(75,0,75,0.14)] overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                {/* Top Header Bar */}
                <div className="px-6 sm:px-8 py-3 bg-[#FFF7EF] border-b border-[#F0E6D8] flex items-center justify-between">
                  <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-brand-purple">
                    Browse Categories
                  </span>
                  <Link
                    to="/products"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewAllProducts();
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-brand-purple hover:text-brand-peach transition-colors group/all cursor-pointer"
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
                    } divide-y sm:divide-y-0 sm:divide-x divide-[#F0E6D8]/60`}
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
                            to={`/products?category=${encodeURIComponent(cat.name)}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleCategoryClick(cat.name);
                            }}
                            className="group/item inline-flex items-center text-left py-0.5 transition-transform duration-150 hover:translate-x-1 cursor-pointer"
                          >
                            <span className="font-bold text-sm sm:text-[15px] text-brand-purple group-hover/item:text-brand-peach transition-colors duration-150">
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
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-brand-purple/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
          ></div>

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-brand-cream z-50 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto lg:hidden transition-transform duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-brand-purple/10">
                <img
                  src={logo}
                  alt="Happy Pet Rx Logo"
                  className="h-18 w-auto object-contain"
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-brand-purple hover:bg-brand-purple/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="my-5 relative">
                <form className="relative" onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-brand-purple/10 focus:border-brand-peach focus:outline-none text-brand-purple placeholder-brand-brown/50 text-sm px-4 py-2 pl-9 rounded-full"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-brand-brown/60" />
                  </div>
                </form>

                {/* Mobile Suggestions Dropdown */}
                {searchQuery.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-brand-purple/10 rounded-xl shadow-lg overflow-hidden z-50 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                    {searchSuggestions.length > 0 ? (
                      <div className="py-2 max-h-60 overflow-y-auto scrollbar-none">
                        <div className="px-3.5 py-1 text-[9px] font-extrabold uppercase tracking-widest text-[#a855f7]/60">
                          Suggested Products
                        </div>
                        <div className="mt-1 divide-y divide-brand-purple/5">
                          {searchSuggestions.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => {
                                navigate(
                                  `/products?q=${encodeURIComponent(product.name)}`,
                                );
                                setIsMobileMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-brand-purple/[0.03] transition-all duration-200 text-left cursor-pointer group"
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded-md border border-brand-purple/5 flex-shrink-0"
                              />
                              <div className="flex-grow min-w-0">
                                <h4 className="text-[11px] font-semibold text-brand-purple truncate group-hover:text-brand-peach transition-colors">
                                  {product.name}
                                </h4>
                                <span className="text-[9px] text-brand-brown/60 block">
                                  ${product.sellPrice.toFixed(2)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="px-3.5 pt-2 border-t border-brand-purple/5 text-center">
                          <button
                            type="button"
                            onClick={handleSearchSubmit}
                            className="text-[9px] font-extrabold text-[#a855f7] hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            See all results
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-brand-brown/60 text-[11px] font-medium">
                        No matches found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Links */}
              <nav className="flex flex-col gap-1 text-left">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left font-semibold text-brand-purple py-2.5 border-b border-brand-purple/5 block hover:text-brand-peach"
                >
                  Home
                </Link>

                {/* Mobile Products Accordion */}
                <div className="border-b border-brand-purple/5 py-1">
                  <div className="flex items-center justify-between py-2 font-semibold text-brand-purple">
                    <Link
                      to="/products"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:text-brand-peach flex-1"
                    >
                      Products
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsMobileProductsOpen((prev) => !prev)}
                      className="p-1.5 rounded-lg hover:bg-brand-purple/5 text-brand-purple/70 cursor-pointer"
                      aria-label="Toggle Products Submenu"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isMobileProductsOpen ? "rotate-180 text-brand-peach" : ""
                        }`}
                      />
                    </button>
                  </div>
                  {isMobileProductsOpen && (
                    <div className="pl-3 pb-2 flex flex-col gap-1 border-l-2 border-brand-peach/30 ml-2">
                      <Link
                        to="/products"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsMobileMenuOpen(false);
                          navigate("/products");
                        }}
                        className="text-xs font-bold text-brand-purple hover:text-brand-peach py-1.5 px-2 rounded-lg hover:bg-brand-purple/5 block text-left cursor-pointer"
                      >
                        All Products
                      </Link>
                      {activeCategories.map((cat) => (
                        <Link
                          key={cat.id || cat.name}
                          to={`/products?category=${encodeURIComponent(cat.name)}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            navigate(`/products?category=${encodeURIComponent(cat.name)}`);
                          }}
                          className="text-xs font-semibold text-brand-brown/75 hover:text-brand-purple py-1.5 px-2 rounded-lg hover:bg-brand-purple/5 block text-left cursor-pointer"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left font-semibold text-brand-purple py-2.5 border-b border-brand-purple/5 block hover:text-brand-peach"
                >
                  About
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-left font-semibold text-brand-purple py-2.5 border-b border-brand-purple/5 block hover:text-brand-peach"
                >
                  Contact
                </Link>
              </nav>

              {currentUser && (
                <div className="mt-6 pt-6 border-t border-brand-purple/10">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-brown/40 mb-3 text-left">
                    My Account
                  </p>
                  <div className="flex flex-col">
                    {[
                      {
                        name: "My Profile",
                        to: "/profile?tab=profile",
                        icon: User,
                      },
                      {
                        name: "My Orders",
                        to: "/profile?tab=orders",
                        icon: Package,
                      },
                      {
                        name: "Saved Addresses",
                        to: "/profile?tab=addresses",
                        icon: MapPin,
                      },
                      {
                        name: "Order Tracking",
                        to: "/profile?tab=tracking",
                        icon: Truck,
                      },
                      {
                        name: "Change Password",
                        to: "/profile?tab=password",
                        icon: Lock,
                      },
                      {
                        name: "Support",
                        to: "/profile?tab=support",
                        icon: HelpCircle,
                      },
                    ].map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full flex items-center gap-3.5 py-2.5 border-b border-brand-purple/5 text-xs font-semibold text-brand-purple/90 hover:text-brand-purple transition-all duration-150 text-left"
                        >
                          <span className="w-7 h-7 rounded-lg bg-brand-purple/[0.06] flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-3.5 h-3.5 text-brand-purple/70" />
                          </span>
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="pt-6 border-t border-brand-purple/10 mt-6 text-xs text-brand-brown/70 flex flex-col gap-3">
              {currentUser ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 bg-brand-cream/50 p-3 rounded-2xl border border-brand-purple/5">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-full border border-brand-purple/10 bg-brand-cream animate-in zoom-in duration-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-purple text-brand-cream font-bold flex items-center justify-center text-sm border border-brand-purple/10 animate-in zoom-in duration-200">
                        {currentUser.name
                          ? currentUser.name[0].toUpperCase()
                          : "P"}
                      </div>
                    )}
                    <div className="overflow-hidden text-left">
                      <p className="font-bold text-brand-purple truncate text-sm">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-brand-brown/70 truncate">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full py-2.5 text-sm font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-medium text-brand-purple border border-brand-purple/15 bg-white rounded-full"
                >
                  Login
                </Link>
              )}
              <a
                href="tel:1-800-HAPPY-PET"
                className="flex items-center gap-2 font-medium text-brand-purple mt-2"
              >
                <Phone className="w-4 h-4 text-brand-purple" /> 24/7 Customer
                Support
              </a>
              <div>Open 24/7 for prescriptions.</div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
