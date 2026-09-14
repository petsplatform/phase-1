import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Heart, ShoppingCart, UserRound, X,
  Home, ShoppingBag, Mail, User, Package, MapPin,
  Truck, LogOut, Info
} from "lucide-react";
import { AppContext } from "../../context/AppContext";
import { AuthContext } from "../../context/AuthContext";
import logoImg from "../../assets/img.png";
import LogoutConfirmationModal from "../Account/LogoutConfirmationModal";

const getInitials = (name = "", email = "") => {
  if (name.trim()) return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (email[0] || "U").toUpperCase();
};

const ACCOUNT_LINKS = [
  { name: "My Profile",      path: "/account/profile",     icon: User },
  { name: "My Orders",       path: "/account/orders",      icon: Package },
  { name: "Saved Addresses", path: "/account/addresses",   icon: MapPin },
  { name: "Track Orders",    path: "/account/track-order", icon: Truck },
];

const MobileMenu = () => {
  const {
    isMobileMenuOpen, setIsMobileMenuOpen,
    wishlist, cartCount,
    setIsSearchOpen, setIsCartOpen, setIsWishlistOpen
  } = useContext(AppContext);
  const { user, logoutUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!isMobileMenuOpen) return null;

  const handleLinkClick = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
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
      setIsMobileMenuOpen(false);
      navigate("/login", { replace: true });
    } catch {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { name: "Home", path: "/", icon: <Home className="w-5 h-5" /> },
    { name: "Shop", path: "/shop", icon: <ShoppingBag className="w-5 h-5" /> },
    { name: "About", path: "/about", icon: <Info className="w-5 h-5" /> },
    { name: "Contact", path: "/contact", icon: <Mail className="w-5 h-5" /> }
  ];

  const initials = user ? getInitials(user.name, user.email) : "";

  return (
    <div className="fixed inset-0 z-50 lg:hidden select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0B2D4F]/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />

      {/* Slide-in Panel */}
      <div className="fixed top-0 bottom-0 right-0 w-full max-w-sm bg-white shadow-2xl flex flex-col border-l border-[#D9E8F2] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-[#D9E8F2] flex items-center justify-between shrink-0">
          <Link to="/" onClick={handleLinkClick} className="flex items-center">
            <img src={logoImg} alt="Vet Supply Express Logo" className="h-[44px] w-auto object-contain" />
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[#102A43] hover:text-[#0874C9] rounded-full focus:outline-none cursor-pointer" aria-label="Close menu">
            <X className="w-6 h-6 stroke-[1.8]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#D9E8F2] shrink-0">
          <button
            onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
            className="flex items-center gap-3 w-full bg-[#F7FAFC] border border-[#D9E8F2] rounded-full px-4 py-2.5 text-sm text-[#627D98] text-left cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#627D98]" />
            <span>Search medicines, supplies...</span>
          </button>
        </div>

        {/* Main Nav */}
        <nav className="p-4 flex flex-col gap-1 shrink-0">
          <span className="text-[11px] font-bold tracking-wider text-[#9FB3C8] uppercase px-3 mb-2">Main Navigation</span>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.name} to={link.path} onClick={handleLinkClick}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? "bg-[#EAF5FC] text-[#0874C9] font-bold" : "text-[#102A43] hover:bg-[#F7FAFC] hover:text-[#0874C9]"}`}
              >
                {link.icon}
                <span className="text-base font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick actions */}
        <div className="px-4 pb-4 flex flex-col gap-1 shrink-0">
          <div className="border-t border-[#D9E8F2] pt-4 mb-2">
            <span className="text-[11px] font-bold tracking-wider text-[#9FB3C8] uppercase px-3 block mb-2">Cart & Wishlist</span>
          </div>
          <button onClick={() => { setIsMobileMenuOpen(false); setIsWishlistOpen(true); }}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[#102A43] hover:bg-[#F7FAFC] hover:text-[#0874C9] text-left cursor-pointer">
            <div className="flex items-center gap-4"><Heart className="w-5 h-5" /><span className="text-base font-medium">My Wishlist</span></div>
            {wishlist.length > 0 && <span className="bg-[#F28C18] text-white text-xs font-bold px-2 py-0.5 rounded-full">{wishlist.length}</span>}
          </button>
          <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[#102A43] hover:bg-[#F7FAFC] hover:text-[#0874C9] text-left cursor-pointer">
            <div className="flex items-center gap-4"><ShoppingCart className="w-5 h-5" /><span className="text-base font-medium">My Cart</span></div>
            {cartCount > 0 && <span className="bg-[#0874C9] text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>}
          </Link>
        </div>

        {/* Account Section — shown only when logged in */}
        {user && (
          <div className="px-4 pb-4 flex flex-col gap-1 shrink-0">
            <div className="border-t border-[#D9E8F2] pt-4 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-[#9FB3C8] uppercase px-3 block mb-2">My Account</span>
            </div>
            {ACCOUNT_LINKS.map(({ name, path, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link key={path} to={path} onClick={handleLinkClick}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? "bg-[#EAF5FC] text-[#0874C9] font-bold" : "text-[#102A43] hover:bg-[#F7FAFC] hover:text-[#0874C9]"}`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-base font-medium">{name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="p-4 border-t border-[#D9E8F2] bg-[#F7FAFC] flex flex-col gap-3 mt-auto shrink-0">
          {user ? (
            <div className="flex flex-col gap-3">
              {/* User card */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#0B2D4F] to-[#0874C9] p-3 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-white select-none">{initials}</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-black text-white truncate">{user.name}</span>
                  <span className="text-xs text-white/65 truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm py-3 px-6 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold text-base py-3 px-6 rounded-xl transition-all duration-300 w-full cursor-pointer shadow-md">
              <UserRound className="w-5 h-5" />
              <span>Login to Account</span>
            </Link>
          )}
          <div className="text-center text-xs text-[#627D98] mt-1">Veterinary Supply Express © 2026</div>
        </div>

        {/* Logout Confirmation Modal */}
        <LogoutConfirmationModal
          isOpen={isLogoutOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmLogout}
          isLoading={isLoggingOut}
        />
      </div>
    </div>
  );
};

export default MobileMenu;
