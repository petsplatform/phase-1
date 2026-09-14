import React from "react";
import { Link } from "react-router-dom";
import AccountSidebar from "../../components/account/AccountSidebar";
import { useAuth } from "../../context/AuthContext";
import { useOrders } from "../../context/OrderContext";
import {
  ShoppingBag,
  MapPin,
  ClipboardList,
  Sparkles,
  Star,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { orders } = useOrders();

  // If user isn't logged in, redirect them or render a simple OTP login panel
  // For development demo correctness, we will mock auto logged-in guest state, so user is always verified.
  const activeUser = user || {
    firstName: "Guest",
    lastName: "Pet Parent",
    email: "guest@pawsandcare.com",
    mobile: "9876543210",
    joinedDate: "July 2026",
    addresses: [],
  };

  const recentOrder = orders[0];

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 text-left">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Dashboard Left Sidebar */}
          <AccountSidebar />

          {/* Dashboard Main Content area */}
          <div className="flex-1 space-y-6 min-w-0 w-full">
            {/* Welcome banner Card */}
             <div className="bg-brand-surface border border-brand-border/60 p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4 min-w-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />

              <div className="flex items-center gap-3 sm:gap-4 relative z-10 text-left min-w-0 flex-1">
                {/* Avatar Display */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-brand-teal/20 overflow-hidden bg-brand-teal/5 flex items-center justify-center shrink-0">
                  {activeUser.avatar ? (
                    <img src={activeUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-teal text-white flex items-center justify-center font-heading font-black text-xl sm:text-2xl uppercase">
                      {activeUser.firstName ? activeUser.firstName.charAt(0) : 'U'}
                    </div>
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 bg-brand-teal/10 text-brand-teal text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <Sparkles size={10} className="fill-current" />
                    <span>Member Profile</span>
                  </span>
                  <h1 className="font-heading font-black text-lg sm:text-2xl text-brand-text leading-tight mt-1 truncate">
                    Welcome Back, {activeUser.firstName}!
                  </h1>
                  <p className="font-sans text-xs text-brand-muted truncate">
                    Member since {activeUser.joinedDate ? String(activeUser.joinedDate).split('T')[0] : '2026'} · {activeUser.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
              <div className="bg-white border border-brand-border/60 p-4 sm:p-5 rounded-2xl shadow-xs text-left space-y-2">
                <div className="w-8 h-8 rounded-full bg-brand-teal/15 flex items-center justify-center text-brand-teal">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-brand-muted">
                    Total Orders
                  </span>
                  <strong className="font-heading font-black text-lg sm:text-xl text-brand-text">
                    {orders.length} Orders
                  </strong>
                </div>
              </div>

              <div className="bg-white border border-brand-border/60 p-4 sm:p-5 rounded-2xl shadow-xs text-left space-y-2">
                <div className="w-8 h-8 rounded-full bg-brand-coral/15 flex items-center justify-center text-brand-coral">
                  🐾
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-brand-muted">
                    Saved Addresses
                  </span>
                  <strong className="font-heading font-black text-lg sm:text-xl text-brand-text">
                    {activeUser.addresses?.length || 0} Addresses
                  </strong>
                </div>
              </div>
            </div>

            {/* Recent Order Preview Card */}
            <div className="bg-white border border-brand-border/60 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm text-left space-y-4 min-w-0">
              <div className="flex justify-between items-center border-b border-brand-border/40 pb-2 flex-wrap gap-2">
                <h3 className="font-heading font-black text-base sm:text-lg text-brand-text">
                  Recent Purchase
                </h3>
                {recentOrder && (
                  <Link
                    to={`/account/orders/${recentOrder.orderId}`}
                    className="font-heading font-bold text-xs text-brand-teal hover:text-brand-coral transition-colors"
                  >
                    Manage Order →
                  </Link>
                )}
              </div>

              {recentOrder ? (
                <div className="space-y-4 min-w-0">
                  {/* Summary items */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-bg/30 p-3 sm:p-4 rounded-2xl border border-brand-border/40 text-xs min-w-0">
                    <div className="min-w-0">
                      <span className="block text-[9px] uppercase font-bold text-brand-muted">
                        Order ID
                      </span>
                      <strong className="text-brand-text font-heading text-xs truncate block" title={recentOrder.orderId}>
                        {recentOrder.orderId}
                      </strong>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9px] uppercase font-bold text-brand-muted">
                        Purchase Date
                      </span>
                      <strong className="text-brand-text font-sans text-xs truncate block">
                        {recentOrder.orderDate ? String(recentOrder.orderDate).split('T')[0] : 'Recent'}
                      </strong>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9px] uppercase font-bold text-brand-muted">
                        Shipping Status
                      </span>
                      <strong className="text-brand-teal font-bold text-xs truncate block">
                        {(() => {
                          const raw = recentOrder.shipmentStatus || recentOrder.shipment_status || recentOrder.shipment?.shipmentStatus || recentOrder.orderStatus || recentOrder.status || '';
                          const clean = String(raw).toLowerCase().replace(/_/g, '').replace(/\s+/g, '');
                          if (clean.includes('delivered') || clean.includes('completed')) return 'Delivered';
                          if (clean.includes('outfor')) return 'Out for Delivery';
                          if (clean.includes('shipped') || clean.includes('intransit')) return 'Shipped';
                          if (clean.includes('processing') || clean.includes('packed')) return 'Processing';
                          return raw || 'Order Confirmed';
                        })()}
                      </strong>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[9px] uppercase font-bold text-brand-muted">
                        Total Charged
                      </span>
                      <strong className="text-brand-coral font-bold text-xs truncate block">
                        ${recentOrder.pricing.total.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Items preview list */}
                  <div className="space-y-2.5 min-w-0">
                    {recentOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-xs font-sans gap-2 min-w-0"
                      >
                        <span className="text-brand-muted truncate flex-1 min-w-0">
                          🐾 {item.name}{" "}
                          <strong className="text-brand-text">
                            x{item.quantity}
                          </strong>{" "}
                          {item.option && `(${item.option})`}
                        </span>
                        <span className="font-semibold text-brand-text shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-brand-muted text-xs font-sans">
                  No orders placed yet. Spoils are waiting!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
