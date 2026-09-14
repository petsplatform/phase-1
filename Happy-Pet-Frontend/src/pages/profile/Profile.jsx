import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Package,
  MapPin,
  Truck,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../store/authentication/authContext";
import { accountApi } from "../../api/accountApi";
import toast from "react-hot-toast";

import { CUSTOMER_BLOCKED_REASON_KEY } from "../../api/axios";

// Sub-components
import MyDashboardTab from "./MyDashboardTab";
import MyProfileTab from "./MyProfileTab";
import SavedAddressesTab from "./SavedAddressesTab";
import MyOrdersTab from "./MyOrdersTab";
import OrderTrackingTab from "./OrderTrackingTab";
import ChangePasswordTab from "./ChangePasswordTab";
import VetVerificationTab from "./VetVerificationTab";
import SupportTab from "./SupportTab";

const withAddressIds = (addresses = []) =>
  addresses.map((address, index) => ({
    id: address.id || `addr_${index}`,
    country: "United States",
    isDefault: index === 0,
    ...address,
  }));

export default function Profile() {
  const { currentUser, logout, loading, updateUser, uploadAvatar, removeAvatar, setPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  // State for Edit Profile Mode
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    avatar: null,
  });

  // Sync state with currentUser when loaded or entering edit mode
  useEffect(() => {
    if (currentUser) {
      queueMicrotask(() => {
        setFormData({
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "+1 (555) 123-4567",
          dob: currentUser.dob || "1995-08-15 (Male)",
          avatar: currentUser.avatar || null,
        });
      });
    }
  }, [currentUser, isEditing]);

  // State for Saved Addresses list
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem("happypet_addresses");
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: "addr_default",
              name: currentUser ? currentUser.name : "John Smith",
              address: "123 Pet Care Ln",
              city: "Austin",
              state: "TX",
              zip: "78701",
              country: "United States",
              isDefault: true,
            },
          ];
    } catch {
      return [];
    }
  });

  // Sync addresses list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("happypet_addresses", JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    accountApi
      .getAddresses()
      .then((serverAddresses) => {
        if (isMounted) setAddresses(withAddressIds(serverAddresses));
      })
      .catch((error) => {
        console.error("Failed to load saved addresses:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // State for Address Form (Adding/Editing)
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    isDefault: false,
  });

  // State for form edits (Change Password)
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      const blockedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (blockedReason) {
        toast.error(blockedReason, { id: "blocked-user-toast" });
      }
      navigate("/login");
    }
  }, [currentUser, loading, navigate]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream/10">
        <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleTabChange = (tabName, orderId) => {
    const params = { tab: tabName };
    if (orderId) {
      params.orderId = orderId;
    }
    setSearchParams(params);
    // Reset address form if switching tabs
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (
      !passwordForm.oldPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await setPassword({
        currentPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setIsChangingPassword(false);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Password changed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Password could not be changed.");
      setIsChangingPassword(false);
    }
  };

  return (
    <main
      className="flex-grow select-none flex flex-col lg:flex-row min-h-[calc(100vh-130px)]"
      style={{
        background:
          "linear-gradient(135deg, #FBF8F5 0%, #F7F2FB 50%, #FAF8F7 100%)",
      }}
    >
      {/* Left Pane (Admin Panel Sidebar) */}
      <div className="w-full lg:w-72 xl:w-80 bg-white border-b lg:border-b-0 lg:border-r border-[#5C3EBA]/10 flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-10">
        {/* User details header card */}
        <div className="p-6 border-b border-[#5C3EBA]/5 flex items-center gap-4 text-left">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover shadow-sm border border-[#EAE5F8] flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#ECE6FC] text-[#5C3EBA] font-extrabold flex items-center justify-center text-lg shadow-sm border border-[#EAE5F8] flex-shrink-0">
              {currentUser.name ? currentUser.name[0].toUpperCase() : "P"}
            </div>
          )}
          <div className="overflow-hidden flex-grow">
            <h3 className="text-sm font-extrabold text-brand-purple truncate">
              {currentUser.name}
            </h3>
            <p className="text-[11px] text-[#8A4F2A] truncate">
              {currentUser.email}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF5EB] text-[#2E7D32] text-[9px] font-extrabold tracking-wider uppercase border border-[#E2EFE2]">
              <span>Member</span>
            </div>
          </div>
        </div>

        {/* Navigation links (Responsive: horizontal scroll on mobile, vertical stack on desktop) */}
        <nav className="p-4 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible scrollbar-none text-left flex-grow">
          {[
            { key: "dashboard", name: "My Dashboard", icon: LayoutDashboard },
            { key: "profile", name: "My Profile", icon: User },
            { key: "orders", name: "My Orders", icon: Package },
            { key: "addresses", name: "Saved Addresses", icon: MapPin },
            { key: "tracking", name: "Order Tracking", icon: Truck },
            { key: "vet-verification", name: "Vet Verification", icon: ShieldCheck },
            // { key: "password", name: "Change Password", icon: Lock },
            { key: "support", name: "Support", icon: HelpCircle },
          ].map((item) => {
            const IconComp = item.icon;
            const isSelected = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
                className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs lg:text-sm font-bold transition-all duration-200 cursor-pointer flex-shrink-0 lg:w-full ${
                  isSelected
                    ? "bg-[#5C3EBA]/5 text-[#5C3EBA] font-extrabold border-l-4 border-[#5C3EBA] pl-3 lg:pl-3"
                    : "text-brand-purple/70 hover:bg-[#5C3EBA]/3 hover:text-brand-purple"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconComp
                    className={`w-4.5 h-4.5 ${isSelected ? "text-[#5C3EBA]" : "text-brand-purple/40"}`}
                  />
                  <span>{item.name}</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 hidden lg:block transition-transform duration-200 ${
                    isSelected
                      ? "text-[#5C3EBA] translate-x-0.5"
                      : "opacity-30 text-brand-purple"
                  }`}
                />
              </button>
            );
          })}

          {/* Logout button for mobile screen scrollbar list */}
          <button
            onClick={logout}
            className="flex lg:hidden items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50/50 transition-all duration-200 cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4 text-red-500/80" />
            <span>Logout</span>
          </button>
        </nav>

        {/* Logout button (Desktop view) */}
        <div className="hidden lg:block p-4 border-t border-[#5C3EBA]/5 mt-auto">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50/50 rounded-xl transition-all duration-200 cursor-pointer text-left"
          >
            <LogOut className="w-4.5 h-4.5 text-red-500/80" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Right Pane (Dynamic Main Content box) */}
      <div className="flex-grow p-3.5 sm:p-6 md:p-10 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto w-full lg:max-w-none lg:mx-0 overflow-hidden">
        {/* Breadcrumb & Title */}
        <div className="text-left">
          <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-brand-purple transition-colors">
              Home
            </Link>
            <span className="text-brand-purple/20">/</span>
            <span className="text-brand-purple">My Account</span>
            <span className="text-brand-purple/20">/</span>
            <span className="text-brand-purple/60">{activeTab}</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-brand-purple tracking-tight">
            {activeTab === "dashboard" && "My Dashboard"}
            {activeTab === "profile" && "My Profile Settings"}
            {activeTab === "orders" && "My Purchase History"}
            {activeTab === "addresses" && "Saved Delivery Addresses"}
            {activeTab === "tracking" && "Order Tracking Status"}
            {activeTab === "vet-verification" && "Vet Verification"}
            {activeTab === "password" && "Security & Password"}
            {activeTab === "support" && "Customer Support"}
          </h1>
        </div>

        {/* Dynamic Card Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-gray-100 flex-grow min-h-[480px] flex flex-col justify-between overflow-hidden">
          {/* Tab: My Dashboard */}
          {activeTab === "dashboard" && (
            <MyDashboardTab
              handleTabChange={handleTabChange}
              addressesCount={addresses.length}
            />
          )}

          {/* Tab: My Profile */}
          {activeTab === "profile" && (
            <MyProfileTab
              currentUser={currentUser}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              formData={formData}
              setFormData={setFormData}
              updateUser={updateUser}
              uploadAvatar={uploadAvatar}
              removeAvatar={removeAvatar}
              toast={toast}
            />
          )}

          {/* Tab: My Orders */}
          {activeTab === "orders" && (
            <MyOrdersTab handleTabChange={handleTabChange} />
          )}

          {/* Tab: Saved Addresses */}
          {activeTab === "addresses" && (
            <SavedAddressesTab
              currentUser={currentUser}
              addresses={addresses}
              setAddresses={setAddresses}
              isAddingAddress={isAddingAddress}
              setIsAddingAddress={setIsAddingAddress}
              editingAddressId={editingAddressId}
              setEditingAddressId={setEditingAddressId}
              addressForm={addressForm}
              setAddressForm={setAddressForm}
              toast={toast}
            />
          )}

          {/* Tab: Order Tracking */}
          {activeTab === "tracking" && <OrderTrackingTab />}

          {/* Tab: Vet Verification */}
          {activeTab === "vet-verification" && <VetVerificationTab toast={toast} />}

          {/* Tab: Change Password */}
          {/* {activeTab === "password" && (
            <ChangePasswordTab
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              handlePasswordChangeSubmit={handlePasswordChangeSubmit}
              isChangingPassword={isChangingPassword}
            />
          )} */}

          {/* Tab: Support */}
          {activeTab === "support" && <SupportTab />}
        </div>
      </div>
    </main>
  );
}
