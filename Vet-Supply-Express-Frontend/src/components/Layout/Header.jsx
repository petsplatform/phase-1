import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Heart,
  ShoppingCart,
  UserRound,
  Menu,
  X,
  ChevronDown,
  User,
  Package,
  MapPin,
  Truck,
  LogOut,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";
import { AuthContext } from "../../context/AuthContext";
import { productApi } from "../../api/productApi";
import logoImg from "../../assets/img.png";
import LogoutConfirmationModal from "../Account/LogoutConfirmationModal";

const ACCOUNT_MENU = [
  { label: "Dashboard", path: "/account/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/account/profile", icon: User },
  { label: "My Orders", path: "/account/orders", icon: Package },
  { label: "Saved Addresses", path: "/account/addresses", icon: MapPin },
  { label: "Track Orders", path: "/account/track-order", icon: Truck },
];

const FALLBACK_CATEGORIES = [
  { id: "CAT-03", name: "Allergy & Skin" },
  { id: "CAT-06", name: "Antibiotic & Digestive" },
  { id: "CAT-05", name: "Anxiety & Calming" },
  { id: "CAT-01", name: "Flea & Tick" },
  { id: "CAT-02", name: "Heartworm" },
  { id: "CAT-04", name: "Pain & Arthritis" },
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

const getInitials = (name = "", email = "") => {
  if (name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email[0] || "U").toUpperCase();
};

const AccountAvatar = ({ user, initials, className = "", textClassName = "" }) => (
  <div className={`${className} overflow-hidden`}>
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
    <span className={`${textClassName} ${user?.avatar ? "hidden" : ""}`}>
      {initials}
    </span>
  </div>
);

const Header = () => {
  const {
    cartCount,
    wishlist,
    setIsSearchOpen,
    setIsCartOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useContext(AppContext);
  const { user, logoutUser } = useContext(AuthContext);

  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isShopHovered, setIsShopHovered] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const shopTimeoutRef = useRef(null);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Search shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "/" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setIsShopHovered(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSearchOpen]);

  // Outside click closes dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown & mega menu on route change
  useEffect(() => {
    setDropdownOpen(false);
    setIsShopHovered(false);
  }, [location.pathname, location.search]);

  // Fetch categories from API
  useEffect(() => {
    let isMounted = true;
    productApi
      .getCategories()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const active = data.filter((c) => c.status?.toLowerCase() !== "inactive");
          setCategories(active.length > 0 ? active : data);
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

  const handleLogout = () => {
    setDropdownOpen(false);
    setIsLogoutOpen(true);
  };

  const handleCloseModal = () => {
    setIsLogoutOpen(false);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise((res) => setTimeout(res, 500));
      logoutUser();
      setIsLogoutOpen(false);
      navigate("/login", { replace: true });
    } catch {
      setIsLoggingOut(false);
    }
  };

  const handleMenuItemClick = () => setDropdownOpen(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop", isShop: true },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const initials = user ? getInitials(user.name, user.email) : "";

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
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 relative ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm shadow-[#0B2D4F]/5 border-b border-[#D9E8F2] py-2"
          : "bg-white border-b border-[#D9E8F2] py-2"
      }`}
    >
      <div className="container-custom flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0874C9] rounded-xl transition-transform duration-300 hover:scale-[1.02]"
        >
          <img
            src={logoImg}
            alt="Vet Supply Express Logo"
            className="h-15 md:h-20 w-auto object-contain filter drop-shadow-sm"
          />
        </Link>

        {/* Center Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-semibold">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            if (link.isShop) {
              return (
                <div
                  key={link.name}
                  className="relative py-2 flex items-center"
                  onMouseEnter={handleShopMouseEnter}
                  onMouseLeave={handleShopMouseLeave}
                >
                  <Link
                    to={link.path}
                    onClick={() => {
                      setIsShopHovered(false);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 text-sm tracking-wide transition-colors duration-200 py-1 ${
                      isActive || isShopHovered
                        ? "text-[#0874C9] font-bold nav-link-underline-active"
                        : "text-[#102A43] hover:text-[#0874C9] nav-link-underline"
                    }`}
                  >
                    <span>{link.name}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isShopHovered ? "rotate-180 text-[#0874C9]" : "text-[#627D98]"
                      }`}
                    />
                  </Link>
                </div>
              );
            }
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm tracking-wide transition-colors duration-300 py-1 ${
                  isActive
                    ? "text-[#0874C9] font-bold nav-link-underline-active"
                    : "text-[#102A43] hover:text-[#0874C9] nav-link-underline"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Header Actions */}
        <div className="hidden lg:flex items-center gap-5">
          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-center rounded-full border border-[#D9E8F2] bg-white p-2.5 text-[#102A43] transition-all duration-300 hover:border-[#0874C9]/40 hover:bg-[#F7FAFC] cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#0874C9]"
            aria-label="Open search overlay (Press /)"
          >
            <Search className="w-4 h-4 text-[#627D98] group-hover:text-[#0874C9] transition-colors" />
          </button>

          {/* Wishlist */}
          <div className="flex items-center gap-2">
            <Link
              to="/wishlist"
              className="relative p-2 text-[#102A43] hover:text-[#0874C9] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0874C9] rounded-full cursor-pointer group"
              aria-label={`Wishlist: ${wishlist.length} items`}
            >
              <Heart className="w-5.5 h-5.5 stroke-[1.8] group-hover:fill-[#0874C9]/5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#F28C18] text-white text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-sm animate-pulse">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-[#102A43] hover:text-[#0874C9] hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0874C9] rounded-full cursor-pointer group"
              aria-label={`Cart: ${cartCount} items`}
            >
              <ShoppingCart className="w-5.5 h-5.5 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#0874C9] text-white text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Account Button / Login */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Trigger button */}
              <button
                id="account-dropdown-trigger"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 bg-[#F7FAFC] hover:bg-[#EAF5FC] border border-[#D9E8F2] hover:border-[#0874C9]/40 rounded-full pl-1.5 pr-3.5 py-1.5 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0874C9] group"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <AccountAvatar
                  user={user}
                  initials={initials}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0874C9] to-[#0B2D4F] flex items-center justify-center shrink-0 shadow-sm"
                  textClassName="text-xs font-black text-white select-none"
                />
                <div className="hidden xl:flex flex-col items-start min-w-0 max-w-[110px]">
                  <span className="text-xs font-extrabold text-[#102A43] truncate w-full leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-[#627D98] truncate w-full leading-tight font-medium">
                    {user.email}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#627D98] transition-transform duration-300 shrink-0 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown panel */}
              <div
                className={`absolute right-0 top-full mt-3 w-72 bg-white border border-[#D9E8F2] rounded-2xl shadow-xl shadow-[#0B2D4F]/10 overflow-hidden z-[9999] transition-all duration-300 origin-top-right ${
                  dropdownOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}
                role="menu"
                aria-labelledby="account-dropdown-trigger"
              >
                {/* Header */}
                <div className="bg-gradient-to-br from-[#0B2D4F] to-[#0874C9] px-5 py-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/60 mb-2.5">
                    Signed In As
                  </p>
                  <div className="flex items-center gap-3">
                    <AccountAvatar
                      user={user}
                      initials={initials}
                      className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0"
                      textClassName="text-sm font-black text-white select-none"
                    />
                    <div className="min-w-0 text-left">
                      <p className="font-heading font-bold text-white text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-white/70 truncate font-medium">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <nav className="p-2">
                  {ACCOUNT_MENU.map(({ label, path, icon: Icon }) => {
                    const isActive = location.pathname === path;
                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={handleMenuItemClick}
                        role="menuitem"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                          isActive
                            ? "bg-[#EAF5FC] text-[#0874C9]"
                            : "text-[#102A43] hover:bg-[#F7FAFC] hover:text-[#0874C9]"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-[#0874C9]" : "text-[#9FB3C8] group-hover:text-[#0874C9]"}`}
                        />
                        <span>{label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0874C9]" />
                        )}
                      </Link>
                    );
                  })}

                  {/* Divider */}
                  <div className="border-t border-[#D9E8F2] my-1.5 mx-1" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all duration-150 cursor-pointer group text-left"
                  >
                    <LogOut className="w-4 h-4 shrink-0 text-red-400 group-hover:text-red-600 transition-colors" />
                    <span>Logout</span>
                  </button>
                </nav>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-xs px-6 py-2.5 rounded-full transition-all duration-300 shadow-md shadow-[#0874C9]/20 hover:shadow-[#F28C18]/20 focus:outline-none focus:ring-2 focus:ring-[#0874C9] cursor-pointer"
            >
              <UserRound className="w-4 h-4" />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile / Tablet actions */}
        <div className="flex lg:hidden items-center gap-2 md:gap-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-[#102A43] hover:text-[#0874C9] transition-colors focus:outline-none rounded-full cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-6 h-6 stroke-[1.8]" />
          </button>
          <Link
            to="/wishlist"
            className="relative p-2 text-[#102A43] hover:text-[#0874C9] transition-colors focus:outline-none rounded-full cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart className="w-6 h-6 stroke-[1.8]" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#F28C18] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className="relative p-2 text-[#102A43] hover:text-[#0874C9] transition-colors focus:outline-none rounded-full cursor-pointer"
            aria-label="Cart"
          >
            <ShoppingCart className="w-6 h-6 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#0874C9] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#102A43] hover:text-[#0874C9] transition-colors focus:outline-none rounded-full cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 stroke-[1.8]" />
            ) : (
              <Menu className="w-6 h-6 stroke-[1.8]" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-[#D9E8F2] shadow-lg z-50 lg:hidden">
            <div className="container-custom py-4 flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                if (link.isShop) {
                  return (
                    <div key={link.name} className="rounded-xl bg-[#F7FAFC] p-2">
                      <div className="flex items-center justify-between px-3 py-2 text-sm font-bold text-[#102A43]">
                        <span>Shop by Category</span>
                        <Link
                          to="/shop"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-xs font-semibold text-[#0874C9] hover:underline"
                        >
                          All Products
                        </Link>
                      </div>
                      <div className="grid grid-cols-1 gap-0.5 mt-1">
                        {activeCategories.map((cat) => (
                          <Link
                            key={cat.id || cat.name}
                            to={`/shop?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm font-medium text-[#102A43] hover:bg-white hover:text-[#0874C9] transition-colors"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#EAF5FC] text-[#0874C9]"
                        : "text-[#102A43] hover:bg-[#F7FAFC] hover:text-[#0874C9]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* Mobile account links when logged in */}
              {user ? (
                <>
                  <div className="border-t border-[#D9E8F2] my-2" />
                  <div className="bg-[#F3F9FD] rounded-xl px-3 py-2.5 flex items-center gap-3 mb-1">
                    <AccountAvatar
                      user={user}
                      initials={initials}
                      className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0874C9] to-[#0B2D4F] flex items-center justify-center shrink-0"
                      textClassName="text-xs font-black text-white"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#102A43] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#627D98] truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {ACCOUNT_MENU.map(({ label, path, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#102A43] hover:bg-[#EAF5FC] hover:text-[#0874C9] transition-colors"
                    >
                      <Icon className="w-4 h-4 text-[#627D98]" />
                      {label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsLogoutOpen(true);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-[#D9E8F2] my-2" />
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 bg-[#0874C9] text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
                  >
                    <UserRound className="w-4 h-4" /> Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Desktop Mega Menu Dropdown */}
        {isShopHovered && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full pt-1.5 z-50 pointer-events-auto"
            onMouseEnter={handleShopMouseEnter}
            onMouseLeave={handleShopMouseLeave}
          >
            <div className="container-custom">
              <div className="bg-white rounded-2xl border border-[#D9E8F2] shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                {/* Top Header Bar */}
                <div className="px-6 sm:px-8 py-3 bg-[#F7FAFC] border-b border-[#D9E8F2] flex items-center justify-between">
                  <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-[#627D98]">
                    Browse Categories
                  </span>
                  <Link
                    to="/shop"
                    onClick={() => setIsShopHovered(false)}
                    className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#0874C9] hover:text-[#F28C18] transition-colors group/all"
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
                    } divide-y sm:divide-y-0 sm:divide-x divide-[#D9E8F2]/60`}
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
                            <span className="font-bold text-sm sm:text-[15px] text-[#102A43] group-hover/item:text-[#0874C9] transition-colors duration-150">
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
        {/* Logout Confirmation Modal */}
        <LogoutConfirmationModal
          isOpen={isLogoutOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmLogout}
          isLoading={isLoggingOut}
        />
      </div>
    </header>
  );
};

export default Header;
