import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, User, MapPin, Heart, LogOut, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountSidebar() {
  const { setShowLogoutConfirm } = useAuth();

  const menuItems = [
    { label: 'Dashboard',        to: '/account',           icon: LayoutDashboard, end: true  },
    { label: 'My Orders',        to: '/account/orders',    icon: ShoppingBag,     end: false },
    { label: 'Track Order',      to: '/account/track-order', icon: Truck,           end: true  },
    { label: 'Profile Settings', to: '/account/profile',   icon: User,            end: true  },
    { label: 'Saved Addresses',  to: '/account/addresses', icon: MapPin,          end: true  },
    { label: 'Vet Verification', to: '/account/vet-verification', icon: ShieldCheck, end: true },
    { label: 'My Wishlist',      to: '/wishlist',          icon: Heart,           end: true  }
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <aside className="bg-brand-surface border border-brand-border/60 p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-sm w-full lg:w-64 shrink-0 text-left min-w-0">
      
      {/* Menu links list */}
      <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none border-b lg:border-b-0 border-brand-border/40 mb-1 lg:mb-0 w-full min-w-0">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 
                `flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0 ${
                  isActive 
                    ? 'bg-brand-teal text-white shadow-sm' 
                    : 'text-brand-muted hover:bg-brand-bg/50 hover:text-brand-teal'
                }`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-heading font-bold text-xs sm:text-sm text-brand-muted hover:bg-brand-coral/10 hover:text-brand-coral transition-colors shrink-0 lg:w-full text-left whitespace-nowrap cursor-pointer mt-0 lg:mt-4"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </nav>

    </aside>
  );
}
