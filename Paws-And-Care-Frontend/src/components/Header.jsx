import React, { useState, useEffect, useRef } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  MapPin,
  ClipboardList,
  Truck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import logoImg from "../assets/logo_refined.png";
import { useAuth } from "../context/AuthContext";
import { getProductUrl } from "../utils/productUtils";
import { productApi } from "../api/productApi";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Contact", to: "/contact" },
];

const FALLBACK_CATEGORIES = [
  { id: "CAT-03", name: "Allergy & Skin", _count: { products: 4 } },
  { id: "CAT-06", name: "Antibiotic & Digestive", _count: { products: 8 } },
  { id: "CAT-05", name: "Anxiety & Calming", _count: { products: 4 } },
  { id: "CAT-01", name: "Flea & Tick", _count: { products: 4 } },
  { id: "CAT-02", name: "Heartworm", _count: { products: 4 } },
  { id: "CAT-04", name: "Pain & Arthritis", _count: { products: 4 } },
];

const getGridCols = (count) => {
  if (count <= 5) return Math.max(1, count);
  const rows = Math.ceil(count / 5);
  return Math.min(5, Math.ceil(count / rows));
};

const GRID_COLS_CLASS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
};

export default function Header({
  wishlistCount = 3,
  cartCount = 2,
  products = [],
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setShowLogoutConfirm } = useAuth() || {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const shopTimeoutRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute live search suggestions
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [searchQuery, products]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    if (trimmed) {
      navigate(`/shop?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/shop");
    }
  };

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  // Fetch categories from API
  useEffect(() => {
    let isMounted = true;
    productApi
      .getCategories()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.warn("Failed to load categories for nav:", err);
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
    setIsShopHovered(true);
  };

  const handleShopMouseLeave = () => {
    if (shopTimeoutRef.current) {
      clearTimeout(shopTimeoutRef.current);
    }
    shopTimeoutRef.current = setTimeout(() => {
      setIsShopHovered(false);
    }, 200);
  };

  // Close mega menu on route change
  useEffect(() => {
    setIsShopHovered(false);
  }, [location.pathname, location.search]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsShopHovered(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeCategories =
    categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const numCols = React.useMemo(() => {
    return getGridCols(activeCategories.length);
  }, [activeCategories.length]);

  const categoryColumns = React.useMemo(() => {
    const list = activeCategories;
    const cols = Array.from({ length: numCols }, () => []);
    list.forEach((item, idx) => {
      cols[idx % numCols].push(item);
    });
    return cols;
  }, [activeCategories, numCols]);

  return (
    <header className="sticky top-0 z-50 bg-brand-surface border-b border-brand-border/60 shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={logoImg}
                alt="PawsAndCare Logo"
                className="h-11 w-11 sm:h-14 sm:w-14 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              <span className="font-heading font-black text-xl sm:text-3xl text-brand-text tracking-tight group-hover:text-brand-coral transition-colors duration-200">
                Paws<span className="text-brand-coral">&</span>Care
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(({ label, to }) => {
              if (label === "Shop") {
                return (
                  <div
                    key={label}
                    className="relative py-2 flex items-center"
                    onMouseEnter={handleShopMouseEnter}
                    onMouseLeave={handleShopMouseLeave}
                  >
                    <Link
                      to={to}
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsShopHovered(false);
                      }}
                      className={`font-heading font-bold text-sm tracking-wide transition-all duration-200 relative py-2 flex items-center gap-1.5 cursor-pointer ${
                        isActive(to) || isShopHovered
                          ? "text-brand-coral"
                          : "text-brand-muted hover:text-brand-coral"
                      }`}
                    >
                      <span>{label}</span>
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 ${
                          isShopHovered
                            ? "rotate-180 text-brand-coral"
                            : "text-brand-muted/70"
                        }`}
                      />
                      {(isActive(to) || isShopHovered) && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-coral rounded-full" />
                      )}
                    </Link>
                  </div>
                );
              }

              return (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-heading font-bold text-sm tracking-wide transition-all duration-200 relative py-2 ${
                    isActive(to)
                      ? "text-brand-coral"
                      : "text-brand-muted hover:text-brand-coral"
                  }`}
                >
                  {label}
                  {isActive(to) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-coral rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Search Bar - Desktop & Tablet */}
          <div
            className="hidden md:flex flex-1 max-w-md mx-4 relative"
            ref={searchRef}
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search premium products for your pets..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-4 pr-10 py-2.5 rounded-full border border-brand-border bg-brand-bg/30 text-brand-text text-sm focus:outline-none focus:border-brand-teal focus:bg-brand-surface transition-all duration-200 font-sans"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-coral transition-colors rounded-full cursor-pointer"
                aria-label="Submit Search"
              >
                <Search size={18} />
              </button>
            </form>

            {/* Live Suggestions Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-brand-border/60 shadow-xl overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-1.5 text-[11px] font-heading font-extrabold uppercase tracking-wider text-brand-muted border-b border-brand-border/40">
                      Suggested Products
                    </div>
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        to={getProductUrl(item)}
                        onClick={() => {
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-brand-bg/60 transition-colors"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg border border-brand-border/40 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-xs text-brand-text truncate">
                            {item.name}
                          </p>
                          <p className="font-sans text-[11px] text-brand-muted truncate">
                            {item.category} •{" "}
                            <span className="font-bold text-brand-teal">
                              ${item.price}
                            </span>
                          </p>
                        </div>
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full text-center py-2.5 px-4 bg-brand-bg/50 hover:bg-brand-bg font-heading font-bold text-xs text-brand-coral border-t border-brand-border/40 transition-colors cursor-pointer"
                    >
                      View all results for "{searchQuery.trim()}" →
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="font-sans text-xs text-brand-muted mb-2">
                      No matching products found for "{searchQuery}"
                    </p>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="font-heading font-bold text-xs text-brand-coral hover:underline cursor-pointer"
                    >
                      Search all products in shop
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Search Toggle for Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 text-brand-muted hover:text-brand-coral transition-colors duration-200 cursor-pointer"
              aria-label="Search"
            >
              <Search size={22} />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 text-brand-text hover:text-brand-coral transition-colors duration-200 relative flex items-center group"
              aria-label="View Wishlist"
            >
              <Heart
                size={22}
                className="transition-transform duration-200 group-hover:scale-110"
              />
              {wishlistCount > 0 && (
                <span
                  key={wishlistCount}
                  className="absolute -top-1.5 -right-1.5 bg-brand-coral text-white font-heading font-black text-[10px] min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full border-2 border-brand-surface shadow-xs animate-bounce"
                  style={{
                    animationIterationCount: 1,
                    animationDuration: "400ms",
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* View Cart */}
            <Link
              to="/cart"
              className="p-2 text-brand-text hover:text-brand-coral transition-colors duration-200 relative flex items-center"
              aria-label="View Cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-coral text-white font-heading font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-surface">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown / Login */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand-bg hover:bg-brand-peach border border-brand-border/60 rounded-full font-heading font-bold text-xs text-brand-text transition-colors duration-250 cursor-pointer select-none ml-2"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-teal text-white flex items-center justify-center font-heading font-black text-sm uppercase shrink-0">
                      {user.firstName ? user.firstName.charAt(0) : "U"}
                    </div>
                  )}
                  <span className="hidden md:inline truncate max-w-[80px]">
                    {user.firstName}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-brand-border/60 rounded-2xl shadow-lg py-2 z-50 text-left animate-slide-in-right sm:animate-none">
                    <div className="px-4 py-2 border-b border-brand-border/40 text-xs">
                      <strong className="block text-brand-text font-heading text-sm">
                        {user.firstName} {user.lastName}
                      </strong>
                      <span className="block text-brand-muted truncate font-sans">
                        {user.email}
                      </span>
                    </div>

                    <Link
                      to="/account"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-heading font-bold text-brand-muted hover:text-brand-teal hover:bg-brand-bg/50 transition-colors"
                    >
                      <LayoutDashboard size={13} />
                      <span>My Dashboard</span>
                    </Link>

                    <Link
                      to="/account/orders"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-heading font-bold text-brand-muted hover:text-brand-teal hover:bg-brand-bg/50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <ClipboardList size={13} />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/account/track-order"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-heading font-bold text-brand-muted hover:text-brand-teal hover:bg-brand-bg/50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Truck size={13} />
                      <span>Track Order</span>
                    </Link>

                    <Link
                      to="/account/profile"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-heading font-bold text-brand-muted hover:text-brand-teal hover:bg-brand-bg/50 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <User size={13} />
                      <span>Profile Settings</span>
                    </Link>

                    <Link
                      to="/account/addresses"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-heading font-bold text-brand-muted hover:text-brand-teal hover:bg-brand-bg/50 transition-colors"
                    >
                      <MapPin size={13} />
                      <span>Saved Addresses</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      className="flex items-center gap-2 px-4 py-2 text-xs font-heading font-bold text-brand-muted hover:text-brand-teal hover:bg-brand-bg/50 transition-colors"
                    >
                      <Heart size={13} />
                      <span>My Wishlist</span>
                    </Link>

                    <hr className="border-brand-border/40 my-1.5" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-heading font-bold text-brand-coral hover:bg-brand-coral/5 transition-colors cursor-pointer text-left"
                    >
                      <LogOut size={13} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-1.5 px-5 py-2 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full font-heading font-bold text-sm transition-all duration-250 shadow-xs hover:shadow-md cursor-pointer ml-2"
              >
                <User size={16} />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-brand-muted hover:text-brand-coral transition-colors duration-200"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - displayed inline under header or when toggled */}
        <div
          className={`md:hidden pb-4 px-1 ${isMobileSearchOpen ? "block" : "hidden sm:block"}`}
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full border border-brand-border bg-brand-bg/30 text-brand-text text-sm focus:outline-none focus:border-brand-teal focus:bg-brand-surface transition-all duration-200 font-sans"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-coral transition-colors cursor-pointer"
              aria-label="Submit Search"
            >
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Mega Menu Dropdown */}
      {isShopHovered && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full pt-1.5 z-50 pointer-events-auto"
          onMouseEnter={handleShopMouseEnter}
          onMouseLeave={handleShopMouseLeave}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl border border-brand-border/80 shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2">
              {/* Top Header Bar */}
              <div className="px-6 sm:px-8 py-2.5 bg-brand-bg/40 border-b border-brand-border/60 flex items-center justify-between">
                <span className="font-heading font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-brand-muted/80">
                  Browse Categories
                </span>
                <Link
                  to="/shop"
                  onClick={() => setIsShopHovered(false)}
                  className="inline-flex items-center gap-1.5 font-heading font-bold text-xs sm:text-sm text-brand-golden hover:text-brand-coral transition-colors group/all"
                >
                  <span>View All Products</span>
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover/all:translate-x-1"
                  />
                </Link>
              </div>

              {/* Categories Columns */}
              <div className="px-6 py-4 sm:px-8 sm:py-5">
                <div
                  className={`grid ${
                    GRID_COLS_CLASS[numCols] || "grid-cols-1 sm:grid-cols-3 lg:grid-cols-5"
                  } divide-y sm:divide-y-0 sm:divide-x divide-brand-border/50`}
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
                          onClick={() => setIsShopHovered(false)}
                          className="group/item inline-flex items-center text-left py-0.5 transition-transform duration-150 hover:translate-x-1"
                        >
                          <span className="font-heading font-bold text-sm sm:text-[15px] text-brand-text group-hover/item:text-brand-coral transition-colors duration-150">
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

      {/* Mobile Drawer Navigation Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-brand-text/30 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-brand-surface shadow-2xl pt-5 pb-4 transition-transform duration-300 transform ease-in-out">
            <div className="flex items-center justify-between px-4 pb-4 border-b border-brand-border/60">
              <div className="flex items-center gap-2">
                <img
                  src={logoImg}
                  alt="PawsAndCare Logo"
                  className="h-8 w-8 object-contain rounded-lg"
                />
                <span className="font-heading font-extrabold text-lg text-brand-text">
                  Paws&Care
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-brand-muted hover:text-brand-coral transition-colors duration-200"
                aria-label="Close Menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex-1 h-0 overflow-y-auto px-4">
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map(({ label, to }) => {
                  if (label === "Shop") {
                    return (
                      <div key={label} className="flex flex-col">
                        <div className="flex items-center justify-between rounded-xl">
                          <Link
                            to={to}
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex-1 flex items-center px-4 py-3 rounded-l-xl font-heading font-bold text-base transition-colors duration-150 ${
                              isActive(to)
                                ? "bg-brand-bg text-brand-coral"
                                : "text-brand-muted hover:bg-brand-bg/50 hover:text-brand-coral"
                            }`}
                          >
                            {label}
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              setIsMobileCategoriesOpen((prev) => !prev)
                            }
                            className="p-3 text-brand-muted hover:text-brand-coral transition-colors cursor-pointer"
                            aria-label="Toggle categories"
                          >
                            <ChevronDown
                              size={18}
                              className={`transition-transform duration-200 ${
                                isMobileCategoriesOpen
                                  ? "rotate-180 text-brand-coral"
                                  : ""
                              }`}
                            />
                          </button>
                        </div>

                        {/* Collapsible Category links for mobile */}
                        {isMobileCategoriesOpen && (
                          <div className="ml-4 pl-3 border-l-2 border-brand-border/70 my-1 flex flex-col gap-1 py-1 animate-in fade-in">
                            <Link
                              to="/shop"
                              onClick={() => setIsMenuOpen(false)}
                              className="px-3 py-2 rounded-lg font-heading font-bold text-xs text-brand-golden hover:text-brand-coral flex items-center justify-between"
                            >
                              <span>View All Products</span>
                              <ArrowRight size={13} />
                            </Link>
                            {activeCategories.map((cat) => (
                              <Link
                                key={cat.id || cat.name}
                                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="px-3 py-1.5 rounded-lg font-heading font-semibold text-xs text-brand-text hover:text-brand-coral hover:bg-brand-bg/50 transition-colors"
                              >
                                {cat.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={label}
                      to={to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center px-4 py-3 rounded-xl font-heading font-bold text-base transition-colors duration-150 ${
                        isActive(to)
                          ? "bg-brand-bg text-brand-coral"
                          : "text-brand-muted hover:bg-brand-bg/50 hover:text-brand-coral"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-brand-border/60 flex flex-col gap-4">
                <Link
                  to="/wishlist"
                  className="flex items-center justify-between px-4 py-2 font-heading font-bold text-brand-muted hover:text-brand-coral transition-colors duration-150"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Heart size={20} className="text-brand-coral" />
                    <span>My Wishlist</span>
                  </div>
                  {wishlistCount > 0 && (
                    <span className="bg-brand-coral text-white font-heading font-black text-[10px] min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                {user ? (
                  <>
                    <Link
                      to="/account"
                      className="flex items-center gap-3 px-4 py-2 font-heading font-bold text-brand-muted hover:text-brand-teal transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={20} className="text-brand-teal" />
                      <span>My Dashboard</span>
                    </Link>
                    <Link
                      to="/account/track-order"
                      className="flex items-center gap-3 px-4 py-2 font-heading font-bold text-brand-muted hover:text-brand-teal transition-colors duration-150"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Truck size={20} className="text-brand-teal" />
                      <span>Track Order</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 font-heading font-bold text-brand-coral hover:text-brand-coral/80 transition-colors duration-150 w-full text-left cursor-pointer"
                    >
                      <LogOut size={20} className="text-brand-coral" />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-xl font-heading font-bold text-base transition-colors duration-150 text-center shadow-xs"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>Log In / Sign Up</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Drawer footer */}
            <div className="p-4 border-t border-brand-border/60 bg-brand-bg/20 text-center text-xs text-brand-muted font-sans">
              <p>
                © 2026 Paws & Care. All rights reserved. Developed By{" "}
                <a
                  href="https://techrabbit.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-brand-coral hover:underline transition-colors"
                >
                  Tech Rabbit
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
