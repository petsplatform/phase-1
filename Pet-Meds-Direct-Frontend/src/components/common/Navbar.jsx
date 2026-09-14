import { useState, useEffect, useRef, useMemo } from "react";
import {
  Heart,
  Menu,
  Search,
  ShoppingCart,
  Truck,
  ShieldCheck,
  UserRound,
  X,
  LayoutDashboard,
  Package,
  ChevronDown,
  LogOut,
  Lock,
  MapPin,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import brandLogo from "../../assets/Logo/logo-bg.png";
import { navbarActions, navbarLinks } from "../../data/navigationData";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import {
  getProductsApi,
  transformProduct,
  getStoreContentApi,
  getCategoriesApi,
} from "../../helper/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { profileDropdownMenu } from "../../data/authentication";
import toast from "react-hot-toast";

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

const iconMap = {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  Lock,
  Truck,
  HelpCircle,
  LogOut,
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
      className={`flex items-center justify-center rounded-full bg-deep-navy font-bold text-white ${className}`}
    >
      {letter}
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isLoggedIn, user, logout } = useAuth();
  const location = useLocation();
  const userAvatar = user?.avatar || "";
  const userAvatarLetter =
    user?.avatarLetter || user?.name?.charAt(0)?.toUpperCase() || "U";

  const [productsList, setProductsList] = useState([]);
  const [popupData, setPopupData] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  const [categories, setCategories] = useState([]);
  const shopDropdownRef = useRef(null);
  const megaMenuRef = useRef(null);
  const shopTimeoutRef = useRef(null);

  // Category navigation helpers ensuring clean route transition
  const handleCategoryClick = (categoryName) => {
    setShopOpen(false);
    setMobileOpen(false);
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  const handleViewAllProducts = () => {
    setShopOpen(false);
    setMobileOpen(false);
    navigate("/products");
  };

  // Hover handlers with debounce buffer to avoid menu flickering
  const handleShopMouseEnter = () => {
    if (shopTimeoutRef.current) {
      clearTimeout(shopTimeoutRef.current);
      shopTimeoutRef.current = null;
    }
    setShopOpen(true);
  };

  const handleShopMouseLeave = () => {
    if (shopTimeoutRef.current) {
      clearTimeout(shopTimeoutRef.current);
    }
    shopTimeoutRef.current = setTimeout(() => {
      setShopOpen(false);
    }, 200);
  };

  // Close dropdown on route change
  useEffect(() => {
    setShopOpen(false);
  }, [location.pathname, location.search]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShopOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close desktop shop dropdown on outside click (excluding megaMenuRef and shopDropdownRef)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        shopOpen &&
        shopDropdownRef.current &&
        !shopDropdownRef.current.contains(e.target) &&
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target)
      ) {
        setShopOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shopOpen]);

  // Fetch categories for nav
  useEffect(() => {
    let isMounted = true;
    getCategoriesApi()
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || [];
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

  useEffect(() => {
    getProductsApi({ limit: 100 })
      .then((res) => {
        const items = (res.data?.items || []).map(transformProduct);
        setProductsList(items);
      })
      .catch((err) => {
        console.error("Error loading products for navbar search:", err);
      });

    getStoreContentApi()
      .then((res) => {
        if (res && res.success && res.data) {
          // Map the optional store popup.
          const apiPopup = res.data.popup;
          if (
            apiPopup &&
            apiPopup.status === "Active" &&
            apiPopup.title &&
            apiPopup.message
          ) {
            const dismissed = sessionStorage.getItem(
              `pet_meds_dismissed_popup_${apiPopup.id || "default"}`,
            );
            if (!dismissed) {
              setPopupData(apiPopup);
              setTimeout(() => {
                setShowPopup(true);
              }, 1200);
            }
          }
        }
      })
      .catch((err) => {
        console.warn(
          "Error loading store content for navbar dynamic elements:",
          err,
        );
      });
  }, []);

  const closePopup = () => {
    setShowPopup(false);
    if (popupData) {
      sessionStorage.setItem(
        `pet_meds_dismissed_popup_${popupData.id || "default"}`,
        "true",
      );
    }
  };

  const filteredProducts = searchQuery.trim()
    ? productsList.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const isHomePage = location.pathname === "/";
  const getHref = (href) => {
    if (href.startsWith("/")) return href;
    return isHomePage ? href : `/${href}`;
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5e9ec] bg-white/95 backdrop-blur-md">
      {/* ─── Announcement Bar ─── */}
      <div className="w-full border-b border-[#0f2d52]/10 bg-[#0f2d52] text-white">
        <div className="mx-auto flex min-h-[36px] max-w-[1400px] items-center justify-center overflow-x-auto px-3 py-2 text-[11px] font-semibold sm:px-6 sm:text-xs">
          <div className="flex min-w-max items-center justify-center">
            <div className="flex items-center gap-2 px-3 sm:px-4">
              <Truck
                className="h-4 w-4 shrink-0 text-[#d9aa3d]"
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">
                Free Shipping on All Orders
              </span>
            </div>
            <span className="h-4 w-px bg-[#0f2d52]/20" aria-hidden="true" />
            <div className="flex items-center gap-2 px-3 sm:px-4">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-[#d9aa3d]"
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">
                Genuine Vet Approved Medicines
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Navigation Bar ─── */}
      <nav className="border-b border-[#e8eef3] bg-white relative">
        <div className="mx-auto flex h-[64px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:h-[78px] sm:gap-5 sm:px-6 lg:h-[84px] lg:px-8">
          {searchOpen ? (
            /* ─── Search mode: replaces entire nav content ─── */
            <>
              <div className="flex flex-1 items-center justify-center px-2 sm:px-4 md:relative">
                <div className="md:relative w-full max-w-2xl">
                  <div className="flex h-11 w-full items-center gap-3 rounded-full border border-deep-navy/12 bg-[#f8f9fb] px-4 sm:h-14 sm:gap-4 sm:px-6">
                    <Search className="h-5 w-5 shrink-0 text-deep-navy/40" />
                    <input
                      type="text"
                      placeholder={navbarActions.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full bg-transparent text-sm font-medium text-deep-navy outline-none placeholder:text-deep-navy/40 sm:text-base"
                    />
                  </div>

                  {/* Dropdown Results Overlay */}
                  {searchQuery && (
                    <div className="absolute top-full left-4 right-4 md:left-0 md:right-0 z-50 mt-2.5 md:mt-3 max-h-[380px] overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_20px_50px_rgba(15,45,82,0.12)]">
                      {filteredProducts.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-deep-navy/45 border-b border-slate-100">
                            Search Results ({filteredProducts.length})
                          </div>
                          {filteredProducts.map((p) => (
                            <Link
                              key={p.id}
                              to={`/product/${p.id}`}
                              onClick={() => {
                                setSearchQuery("");
                                setSearchOpen(false);
                              }}
                              className="flex items-center gap-4 rounded-2xl p-2 hover:bg-slate-50 transition-all duration-200 group"
                            >
                              <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-100/50 group-hover:bg-white group-hover:shadow-xs transition-colors">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-primary-green bg-emerald-50/50 px-2 py-0.5 rounded-full border border-primary-green/10">
                                    {p.category}
                                  </span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-extrabold text-deep-navy truncate group-hover:text-primary-green transition-colors">
                                  {p.name}
                                </h4>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs sm:text-sm font-black text-deep-navy">
                                  ${p.sellingPrice.toFixed(2)}
                                </div>
                                {p.discount && (
                                  <div className="text-[10px] font-bold text-rose-500 line-through">
                                    ${p.actualPrice.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center">
                          <div className="text-sm font-bold text-deep-navy/60 mb-1">
                            No products found
                          </div>
                          <div className="text-xs text-deep-navy/40">
                            Try searching for keywords like "Frontline",
                            "Apoquel", "Dogs", "Cats"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-deep-navy/60 transition-colors hover:bg-soft-mint hover:text-deep-navy cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </>
          ) : (
            /* ─── Normal nav content ─── */
            <>
              {/* Logo */}
              <Link
                to="/"
                onClick={closeMobile}
                className="flex shrink-0 items-center gap-2 sm:gap-2.5"
              >
                <span className="flex h-10 w-10 shrink-0 items-start justify-center overflow-hidden rounded-xl bg-soft-mint ring-1 ring-deep-navy/8 sm:h-12 sm:w-12 sm:rounded-2xl lg:h-14 lg:w-14">
                  <img
                    src={brandLogo}
                    alt=""
                    className="h-[155%] w-[155%] max-w-none object-cover object-top"
                  />
                </span>
                <span>
                  <span className="block font-display text-base font-extrabold leading-tight tracking-[-0.02em] text-deep-navy sm:text-xl lg:text-[22px]">
                    PetMedsDirect
                  </span>
                  <span className="hidden text-[12px] font-medium leading-tight text-deep-navy/50 sm:block sm:text-[13px]">
                    Your Pet. Our Priority.
                  </span>
                </span>
              </Link>

              {/* Desktop nav links */}
              <ul className="hidden items-center gap-1.5 lg:flex">
                {navbarLinks.map((link) => {
                  const isShopLink =
                    link.label === "Shop" || link.href === "/products";

                  if (isShopLink) {
                    return (
                      <li key={link.label}>
                        <div
                          ref={shopDropdownRef}
                          className="relative flex items-center"
                          onMouseEnter={handleShopMouseEnter}
                          onMouseLeave={handleShopMouseLeave}
                        >
                          <button
                            type="button"
                            onClick={() => setShopOpen((open) => !open)}
                            className={`relative flex items-center gap-1 rounded-full px-3.5 py-2 text-[15px] font-bold transition-colors cursor-pointer ${
                              shopOpen
                                ? "bg-soft-mint text-deep-navy"
                                : "text-deep-navy/80 hover:bg-soft-mint hover:text-deep-navy"
                            }`}
                            aria-haspopup="menu"
                            aria-expanded={shopOpen}
                          >
                            <span>{link.label}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                shopOpen ? "rotate-180 text-primary-green" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li key={link.label}>
                      {link.children?.length ? (
                        <div className="relative">
                          <button
                            type="button"
                            className="relative flex items-center gap-1 rounded-full px-3.5 py-2 text-[15px] font-bold transition-colors text-deep-navy/80 hover:bg-soft-mint hover:text-deep-navy"
                          >
                            {link.label}
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <div className="absolute left-0 top-full z-50 w-56 pt-2">
                            <div className="overflow-hidden rounded-2xl border border-[#e8eef3] bg-white py-2 shadow-[0_18px_40px_rgba(15,45,82,0.16)]">
                              {link.children.map((child) => (
                                <Link
                                  key={child.label}
                                  to={getHref(child.href)}
                                  className="block px-4 py-2.5 text-sm font-bold text-deep-navy transition-colors hover:bg-soft-mint hover:text-deep-navy"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          to={getHref(link.href)}
                          className="relative rounded-lg px-3.5 py-2 text-[15px] font-bold text-deep-navy/80 transition-colors hover:bg-soft-mint hover:text-deep-navy"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Desktop right actions */}
              <div className="hidden items-center gap-3 lg:flex">
                <button
                  type="button"
                  aria-label="Open search"
                  onClick={() => setSearchOpen(true)}
                  className="grid h-11 w-11 place-items-center rounded-full text-deep-navy/70 transition-colors hover:bg-soft-mint hover:text-deep-navy"
                >
                  <Search className="h-[22px] w-[22px]" />
                </button>

                <span className="mx-1 h-7 w-px bg-deep-navy/10" />

                <Link
                  to={navbarActions.wishlistHref}
                  aria-label="Wishlist"
                  className="relative grid h-11 w-11 place-items-center rounded-full text-deep-navy/70 transition-colors hover:bg-soft-mint hover:text-deep-navy"
                >
                  <Heart className="h-[22px] w-[22px]" />
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary-green text-[11px] font-bold leading-none text-white ring-2 ring-white">
                    {wishlistCount}
                  </span>
                </Link>

                <Link
                  to={navbarActions.cartHref}
                  aria-label="Cart"
                  className="relative grid h-11 w-11 place-items-center rounded-full text-deep-navy/70 transition-colors hover:bg-soft-mint hover:text-deep-navy"
                >
                  <ShoppingCart className="h-[22px] w-[22px]" />
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary-green text-[11px] font-bold leading-none text-white ring-2 ring-white">
                    {cartCount}
                  </span>
                </Link>

                <span className="mx-1 h-7 w-px bg-deep-navy/10" />

                {isLoggedIn ? (
                  <div className="relative z-50">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-3 rounded-full hover:bg-slate-50 transition-colors p-1.5 cursor-pointer text-left focus:outline-none"
                    >
                      <UserAvatar
                        src={userAvatar}
                        letter={userAvatarLetter}
                        className="h-11 w-11 text-base"
                      />
                      <div className="hidden xl:flex flex-col select-none pr-1">
                        <span className="text-sm font-extrabold text-deep-navy flex items-center gap-1">
                          Hi, {user.name}
                          <ChevronDown
                            className={`h-4 w-4 text-deep-navy/60 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                          />
                        </span>
                        <span className="text-[11px] font-bold text-deep-navy/55 leading-none">
                          {user.role}
                        </span>
                      </div>
                    </button>

                    {dropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-[#e8eef3] bg-white p-4 shadow-[0_20px_50px_rgba(15,45,82,0.12)] z-50">
                          <div className="flex items-center gap-3 px-3 pb-3 border-b border-slate-100">
                            <UserAvatar
                              src={userAvatar}
                              letter={userAvatarLetter}
                              className="h-10 w-10 text-sm shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-deep-navy">
                                Hi, {user.name}
                              </span>
                              <span className="text-[10px] font-extrabold text-deep-navy/50">
                                {user.role}
                              </span>
                            </div>
                          </div>
                          <ul className="flex flex-col gap-0.5 mt-2">
                            {profileDropdownMenu.map((item) => {
                              const Icon = iconMap[item.icon];
                              if (item.isLogout) {
                                return (
                                  <li
                                    key={item.label}
                                    className="mt-1 border-t border-slate-100 pt-1"
                                  >
                                    <button
                                      onClick={() => {
                                        setDropdownOpen(false);
                                        setShowLogoutConfirm(true);
                                      }}
                                      className="w-full flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-extrabold text-rose-500 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                                    >
                                      {Icon && (
                                        <Icon className="h-4.5 w-4.5 text-rose-500" />
                                      )}
                                      {item.label}
                                    </button>
                                  </li>
                                );
                              }
                              return (
                                <li key={item.label}>
                                  {item.isDividerBefore && (
                                    <hr className="my-1 border-slate-100" />
                                  )}
                                  <Link
                                    to={item.href}
                                    onClick={() => setDropdownOpen(false)}
                                    className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-extrabold text-deep-navy/80 hover:bg-soft-mint hover:text-deep-navy transition-colors"
                                  >
                                    {Icon && (
                                      <Icon className="h-4.5 w-4.5 text-deep-navy/40" />
                                    )}
                                    {item.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    to={navbarActions.loginHref}
                    className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary-green px-6 text-[15px] font-bold text-white transition-all hover:bg-dark-green"
                  >
                    <UserRound className="h-[18px] w-[18px]" />
                    {navbarActions.loginLabel}
                  </Link>
                )}
              </div>

              {/* Mobile right icons */}
              <div className="flex items-center gap-0.5 sm:gap-1.5 lg:hidden">
                <button
                  type="button"
                  aria-label="Open search"
                  onClick={() => setSearchOpen(true)}
                  className="grid h-10 w-10 place-items-center rounded-full text-deep-navy/70 hover:bg-soft-mint sm:h-11 sm:w-11"
                >
                  <Search className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                </button>

                <Link
                  to={navbarActions.wishlistHref}
                  aria-label="Wishlist"
                  className="relative grid h-10 w-10 place-items-center rounded-full text-deep-navy/70 hover:bg-soft-mint sm:h-11 sm:w-11"
                >
                  <Heart className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                  <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary-green text-[9px] font-bold text-white ring-2 ring-white sm:h-[18px] sm:min-w-[18px] sm:text-[10px]">
                    {wishlistCount}
                  </span>
                </Link>

                <Link
                  to={navbarActions.cartHref}
                  aria-label="Cart"
                  className="relative grid h-10 w-10 place-items-center rounded-full text-deep-navy/70 hover:bg-soft-mint sm:h-11 sm:w-11"
                >
                  <ShoppingCart className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                  <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary-green text-[9px] font-bold text-white ring-2 ring-white sm:h-[18px] sm:min-w-[18px] sm:text-[10px]">
                    {cartCount}
                  </span>
                </Link>

                <button
                  type="button"
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((v) => !v)}
                  className="grid h-10 w-10 place-items-center rounded-full text-deep-navy/70 hover:bg-soft-mint sm:h-11 sm:w-11"
                >
                  {mobileOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop Mega Menu Dropdown */}
        {shopOpen && (
          <div
            ref={megaMenuRef}
            className="hidden lg:block absolute left-0 right-0 top-full pt-1.5 z-50 pointer-events-auto"
            onMouseEnter={handleShopMouseEnter}
            onMouseLeave={handleShopMouseLeave}
          >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl border border-[#e8eef3] shadow-[0_20px_50px_rgba(15,45,82,0.14)] overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2">
                {/* Top Header Bar */}
                <div className="px-6 sm:px-8 py-3.5 bg-[#f8fafc] border-b border-[#e8eef3] flex items-center justify-between">
                  <span className="font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-deep-navy/70">
                    Browse Categories
                  </span>
                  <button
                    type="button"
                    onClick={handleViewAllProducts}
                    className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-primary-green hover:text-emerald-700 transition-colors group/all cursor-pointer"
                  >
                    <span>View All Products</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/all:translate-x-1" />
                  </button>
                </div>

                {/* Categories Columns */}
                <div className="px-6 py-5 sm:px-8 sm:py-6">
                  <div
                    className={`grid ${
                      GRID_COLS_CLASS[numCols] || "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                    } divide-y sm:divide-y-0 sm:divide-x divide-slate-100`}
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
                            <span className="font-bold text-sm text-deep-navy group-hover/item:text-primary-green transition-colors duration-150">
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

      {/* ─── Mobile menu ─── */}
      <div
        className={`border-b border-[#e8eef3] bg-white transition-all duration-300 lg:hidden ${
          mobileOpen
            ? "max-h-[650px] py-5 opacity-100 overflow-y-auto shadow-[0_8px_24px_rgba(15,45,82,0.06)]"
            : "max-h-0 py-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] flex-col gap-0.5 px-4 sm:px-8">
          {navbarLinks.map((link) => {
            const isShopLink =
              link.label === "Shop" || link.href === "/products";
            return (
              <div key={link.label}>
                <Link
                  to={getHref(link.href)}
                  onClick={closeMobile}
                  className="flex items-center justify-between rounded-lg px-3 py-1.5 text-[15px] font-bold text-deep-navy/80 transition-colors hover:bg-soft-mint hover:text-deep-navy"
                >
                  {link.label}
                  {(link.children?.length || isShopLink) && (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Link>
                {isShopLink && activeCategories.length > 0 ? (
                  <div className="ml-4 flex flex-col border-l border-deep-navy/10 pl-3 my-1">
                    {activeCategories.map((cat) => (
                      <button
                        key={cat.id || cat.name}
                        type="button"
                        onClick={() => handleCategoryClick(cat.name)}
                        className="text-left rounded-lg px-3 py-1.5 text-sm font-semibold text-deep-navy/65 hover:bg-soft-mint hover:text-deep-navy transition-colors cursor-pointer"
                      >
                        {cat.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleViewAllProducts}
                      className="text-left rounded-lg px-3 py-1.5 text-sm font-bold text-primary-green hover:bg-soft-mint transition-colors cursor-pointer"
                    >
                      View All Products →
                    </button>
                  </div>
                ) : link.children?.length ? (
                  <div className="ml-4 flex flex-col border-l border-deep-navy/10 pl-3">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        to={getHref(child.href)}
                        onClick={closeMobile}
                        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-deep-navy/65 hover:bg-soft-mint hover:text-deep-navy"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <hr className="my-2 border-deep-navy/8" />
          {isLoggedIn ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
                <UserAvatar
                  src={userAvatar}
                  letter={userAvatarLetter}
                  className="h-11 w-11 text-base shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-deep-navy">
                    Hi, {user.name}
                  </span>
                  <span className="text-[11px] font-bold text-deep-navy/55">
                    {user.role}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {profileDropdownMenu
                  .filter((item) => !item.isLogout)
                  .map((item) => {
                    const Icon = iconMap[item.icon];
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={closeMobile}
                        className="flex items-center gap-2 rounded-xl p-2.5 text-xs font-bold text-deep-navy/80 hover:bg-soft-mint transition-colors"
                      >
                        {Icon && <Icon className="h-4 w-4 text-deep-navy/40" />}
                        {item.label}
                      </Link>
                    );
                  })}
              </div>
              <button
                onClick={() => {
                  closeMobile();
                  setShowLogoutConfirm(true);
                }}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-6 py-3.5 text-[14px] font-bold text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to={navbarActions.loginHref}
              onClick={closeMobile}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-green px-6 py-3.5 text-[15px] font-bold text-white hover:bg-dark-green"
            >
              <UserRound className="h-[18px] w-[18px]" />
              {navbarActions.loginLabel}
            </Link>
          )}
        </div>
      </div>

      {/* ─── Logout Confirmation Dialog ─── */}
      {showLogoutConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay with blur */}
            <div
              className="absolute inset-0 bg-[#0f2d52]/55 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setShowLogoutConfirm(false)}
            />

            {/* Dialog Container */}
            <div className="relative w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-6 text-center shadow-[0_25px_60px_rgba(15,45,82,0.2)] border border-[#e8eef3] transition-all z-50 animate-float">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
                <LogOut className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-black text-deep-navy font-display">
                Confirm Logout
              </h3>
              <p className="mt-2 text-xs font-semibold text-deep-navy/60 leading-relaxed px-2">
                Are you sure you want to log out of your account? You will need
                to verify your email again next time.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full rounded-2xl border border-deep-navy/8 bg-slate-50 py-3 text-xs font-black text-deep-navy hover:bg-[#eef2f6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowLogoutConfirm(false);
                    toast.success("Logged out successfully");
                  }}
                  className="w-full rounded-2xl bg-rose-500 py-3 text-xs font-black text-white hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
