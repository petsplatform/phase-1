import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CUSTOMER_BLOCKED_REASON_KEY } from "../api/sessionStorage";
import {
  LayoutDashboard,
  User,
  Package,
  MapPin,
  Truck,
  Lock,
  HelpCircle,
  LogOut,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

// Modular Components
import DashboardTab from "../Components/profiles/DashboardTab";
import ProfileInfoTab from "../Components/profiles/ProfileInfoTab";
import OrderHistoryTab from "../Components/profiles/OrderHistoryTab";
import SavedAddressesTab from "../Components/profiles/SavedAddressesTab";
import OrderTrackingTab from "../Components/profiles/OrderTrackingTab";
// import ChangePasswordTab from "../Components/profiles/ChangePasswordTab";
import VetVerificationTab from "../Components/profiles/VetVerificationTab";
import HelpSupportTab from "../Components/profiles/HelpSupportTab";

// Notification Context
import { useNotification } from "../utils/NotificationContext";
import LogoutModal from "../Components/common/LogoutModal";
import { accountApi } from "../api/accountApi";
import { orderApi } from "../api/orderApi";
import { useAuth } from "../utils/AuthContext";

// Mock Data
import { INITIAL_ORDERS, INITIAL_ADDRESSES } from "../utils/profileMockData";

const DEFAULT_COUNTRY = "United States";

export default function ProfilePage({
  wishlistItems = [],
  toggleWishlist,
  onAddToCart,
  onClearWishlist,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { showNotification } = useNotification();
  const { isAuthenticated, logout, updateUser, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.removeItem(CUSTOMER_BLOCKED_REASON_KEY);
    } else {
      const blockedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (blockedReason) {
        showNotification(blockedReason, "error");
        navigate("/login");
      }
    }
  }, [isAuthenticated, navigate, showNotification]);

  // Profile Form States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileGender, setProfileGender] = useState(user?.gender || "Male");
  const [profileDob, setProfileDob] = useState(user?.dob || "1995-08-15");
  const [profileAvatar, setProfileAvatar] = useState(
    user?.avatar || user?.avatarUrl || "",
  );
  const [profileMessage, setProfileMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Handle Cancel Order
  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel order ${orderId}?`,
    );
    if (!confirmCancel) return;

    try {
      if (isAuthenticated) {
        await orderApi.cancelOrder(orderId);
      }
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          error.message ||
          `Order ${orderId} could not be cancelled.`,
        "error",
      );
      return;
    }

    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: "Cancelled" } : order,
      ),
    );

    // Update selectedOrder if it is currently displayed
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, status: "Cancelled" } : prev,
    );

    showNotification(
      `Order ${orderId} has been cancelled successfully.`,
      "success",
    );
  };

  // Addresses State
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem("userAddresses");
    return saved ? JSON.parse(saved) : INITIAL_ADDRESSES;
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressTitle, setAddressTitle] = useState("Home");
  const [addressName, setAddressName] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [addressCountry, setAddressCountry] = useState("United States");
  const [addressPhone, setAddressPhone] = useState("");

  // Order Tracking State
  const [trackIdInput, setTrackIdInput] = useState("");
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [trackingError, setTrackingError] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) {
      setIsOrdersLoading(false);
      return;
    }

    setIsOrdersLoading(true);

    Promise.allSettled([
      accountApi.getDashboard(),
      accountApi.getProfile(),
      orderApi.getMyOrders(),
      accountApi.getAddresses(),
    ]).then(
      ([dashboardResult, profileResult, ordersResult, addressesResult]) => {
        if (!isMounted) return;

        if (profileResult.status === "fulfilled" && profileResult.value) {
          const profile = profileResult.value;
          setProfileName(profile.name || "");
          setProfileEmail(profile.email || "");
          setProfilePhone(profile.phone || "");
          setProfileAvatar(profile.avatar || profile.avatarUrl || "");
        }

        let localOrders = [];
        try {
          const stored = localStorage.getItem("budget_petshop_orders");
          if (stored) {
            const parsed = JSON.parse(stored);
            localOrders = Array.isArray(parsed)
              ? parsed.map(normalizeOrder).filter(Boolean)
              : [];
          }
        } catch {
          localOrders = [];
        }

        let fetchedOrders = [];
        if (
          ordersResult.status === "fulfilled" &&
          Array.isArray(ordersResult.value)
        ) {
          fetchedOrders = ordersResult.value;
        } else if (
          dashboardResult.status === "fulfilled" &&
          Array.isArray(dashboardResult.value?.recentOrders)
        ) {
          fetchedOrders = dashboardResult.value.recentOrders;
        }

        const mergedMap = new Map();
        [...fetchedOrders, ...localOrders].forEach((ord) => {
          if (!ord) return;
          const key = String(
            ord.id || ord.reference || ord.orderNumber || ord.trackingId || "",
          );
          if (key && key !== "ORD-UNKNOWN" && !mergedMap.has(key)) {
            mergedMap.set(key, ord);
          }
        });

        setOrders(Array.from(mergedMap.values()));

        if (
          addressesResult.status === "fulfilled" &&
          Array.isArray(addressesResult.value)
        ) {
          setAddresses(addressesResult.value);
          localStorage.setItem(
            "userAddresses",
            JSON.stringify(addressesResult.value),
          );
        }

        setIsOrdersLoading(false);
      },
    ).catch(() => {
      if (isMounted) setIsOrdersLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name || "");
    setProfileEmail(user.email || "");
    setProfilePhone(user.phone || "");
    setProfileAvatar(user.avatar || user.avatarUrl || "");
  }, [user]);

  // Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
    setSelectedOrder(null);
  };

  // Handle Logout
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    logout("/login");
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      if (isAuthenticated) {
        const updatedProfile = await accountApi.updateProfile({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
          gender: profileGender,
          dob: profileDob,
          avatar: profileAvatar,
        });
        updateUser(updatedProfile);
      }

      setIsEditingProfile(false);
      setProfileMessage("Profile updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error) {
      setProfileMessage(
        error.response?.data?.message ||
          error.message ||
          "Profile could not be updated.",
      );
    }
  };

  const handleAvatarUpload = async (file, validationError = "") => {
    setAvatarError("");

    if (validationError) {
      setAvatarError(validationError);
      return;
    }

    if (!file || isAvatarUploading) return;

    setIsAvatarUploading(true);
    try {
      const updatedProfile = await accountApi.uploadAvatar(file);
      const updated = updateUser(updatedProfile);
      const avatarUrl = updated.avatar || updated.avatarUrl || "";
      setProfileAvatar(avatarUrl);
      setProfileMessage("Profile photo updated successfully!");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Avatar could not be uploaded. Please try again.";
      setAvatarError(message);
      showNotification(message, "error");
      throw error;
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleCancelProfile = () => {
    setProfileName(user?.name || "");
    setProfileEmail(user?.email || "");
    setProfilePhone(user?.phone || "");
    setProfileGender(user?.gender || "Male");
    setProfileDob(user?.dob || "1995-08-15");
    setProfileAvatar(user?.avatar || user?.avatarUrl || "");
    setIsEditingProfile(false);
  };

  // Handle Add Address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    const street = String(addressStreet || "").trim();
    const city = String(addressCity || "").trim();
    const state = String(addressState || "").trim();
    const zip = String(addressZip || "").trim();
    const country = String(addressCountry || "United States").trim();

    if (street.length < 5 || street.length > 100) {
      showNotification("Please enter a valid street address (5 to 100 characters).", "error");
      return;
    }
    if (city.length < 2 || city.length > 50) {
      showNotification("Please enter a valid city name (2 to 50 characters).", "error");
      return;
    }
    if (state.length < 2 || state.length > 50) {
      showNotification("Please enter a valid state/province (2 to 50 characters).", "error");
      return;
    }
    if (zip.length < 3 || zip.length > 10) {
      showNotification("Please enter a valid ZIP/Postal code (3 to 10 characters).", "error");
      return;
    }

    const defaultName = addressName || user?.name || "Customer";
    const defaultPhone = addressPhone || user?.phone || "";

    const newAddr = {
      id: Date.now().toString(),
      title: addressTitle || "Home",
      name: defaultName,
      street,
      city,
      state,
      zip,
      phone: defaultPhone,
      country,
      isDefault: addresses.length === 0,
    };
    try {
      if (isAuthenticated) {
        const updatedFromApi = await accountApi.addAddress({
          name: defaultName,
          phone: defaultPhone,
          address: street,
          city,
          state,
          zip,
          country,
          isDefault: addresses.length === 0,
        });
        if (Array.isArray(updatedFromApi)) {
          setAddresses(updatedFromApi);
          localStorage.setItem("userAddresses", JSON.stringify(updatedFromApi));
        }
      } else {
        const updated = [...addresses, newAddr];
        setAddresses(updated);
        localStorage.setItem("userAddresses", JSON.stringify(updated));
      }
      showNotification("Address added successfully!", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Address could not be saved.",
        "error",
      );
      return;
    }

    // Reset Form
    setAddressTitle("Home");
    setAddressName("");
    setAddressStreet("");
    setAddressCity("");
    setAddressState("");
    setAddressZip("");
    setAddressCountry("United States");
    setAddressPhone("");
    setShowAddressForm(false);
  };

  const getAddressIndex = (address) =>
    Number(
      address?.index ?? addresses.findIndex((addr) => addr.id === address?.id),
    );

  const normalizeAddressPayload = (values = {}) => ({
    title: values.title || "Saved Address",
    name: values.name?.trim() || "",
    phone: values.phone?.trim() || "",
    address: values.address?.trim() || values.street?.trim() || "",
    street: values.address?.trim() || values.street?.trim() || "",
    apartment: values.apartment?.trim() || "",
    city: values.city?.trim() || "",
    state: values.state?.trim() || "",
    zip: values.zip?.trim() || values.zipCode?.trim() || "",
    country: values.country?.trim() || DEFAULT_COUNTRY,
    isDefault: Boolean(values.isDefault),
  });

  const mergeDefaultState = (items, selectedIndex, isDefault) => {
    if (!isDefault) return items;
    return items.map((item, index) => ({
      ...item,
      isDefault: index === selectedIndex,
    }));
  };

  const handleUpdateAddress = async (address, values) => {
    const index = getAddressIndex(address);
    if (index < 0) throw new Error("Address could not be found.");
    const payload = normalizeAddressPayload(values);

    if (isAuthenticated) {
      const updatedFromApi = await accountApi.updateAddress(index, payload);
      if (Array.isArray(updatedFromApi)) {
        const merged = mergeDefaultState(updatedFromApi, index, payload.isDefault);
        setAddresses(merged);
        localStorage.setItem("userAddresses", JSON.stringify(merged));
      }
      showNotification("Address updated successfully.", "success");
      return;
    }

    const updated = addresses.map((item, itemIndex) =>
      itemIndex === index
        ? { ...item, ...payload, id: item.id, index: item.index ?? itemIndex }
        : { ...item, isDefault: payload.isDefault ? false : item.isDefault },
    );
    setAddresses(updated);
    localStorage.setItem("userAddresses", JSON.stringify(updated));
    showNotification("Address updated successfully.", "success");
  };

  const handleSetDefaultAddress = async (address) => {
    const index = getAddressIndex(address);
    if (index < 0 || address.isDefault) return;
    const payload = normalizeAddressPayload({ ...address, isDefault: true });

    try {
      if (isAuthenticated) {
        const updatedFromApi = await accountApi.updateAddress(index, payload);
        if (Array.isArray(updatedFromApi)) {
          const merged = mergeDefaultState(updatedFromApi, index, true);
          setAddresses(merged);
          localStorage.setItem("userAddresses", JSON.stringify(merged));
        }
      } else {
        const updated = addresses.map((item, itemIndex) => ({
          ...item,
          isDefault: itemIndex === index,
        }));
        setAddresses(updated);
        localStorage.setItem("userAddresses", JSON.stringify(updated));
      }
      showNotification("Default address updated.", "success");
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Default address could not be updated.",
        "error",
      );
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (id) => {
    try {
      if (isAuthenticated) {
        const address = addresses.find((addr) => addr.id === id);
        const index = Number(
          address?.index ?? addresses.findIndex((addr) => addr.id === id),
        );
        await accountApi.removeAddress(index);
      }
      const updated = addresses.filter((addr) => addr.id !== id);
      setAddresses(updated);
      localStorage.setItem("userAddresses", JSON.stringify(updated));
    } catch (error) {
      showNotification(
        error.response?.data?.message ||
          error.message ||
          "Address could not be deleted.",
        "error",
      );
    }
  };

  // Handle Track Order Search
  const handleTrackOrder = async (e) => {
    e.preventDefault();
    setTrackingError("");
    setTrackingInfo(null);

    if (!trackIdInput.trim()) {
      setTrackingError("Please enter a valid Order ID.");
      return;
    }

    const matched = orders.find(
      (o) =>
        o.id.toLowerCase() === trackIdInput.trim().toLowerCase() ||
        String(o.trackingId || "").toLowerCase() ===
          trackIdInput.trim().toLowerCase(),
    );

    if (matched) {
      setTrackingInfo(matched);
    } else {
      try {
        if (!isAuthenticated)
          throw new Error("Login is required to track this order.");
        const order = await orderApi.getOrderById(trackIdInput.trim());
        setTrackingInfo(order);
      } catch (error) {
        setTrackingError(
          error.response?.data?.message ||
            error.message ||
            `Order ID or Tracking ID "${trackIdInput}" could not be found.`,
        );
      }
    }
  };

  // Auto populate tracking ID if clicked from order details
  const triggerTracking = (order) => {
    setTrackIdInput(order.id);
    setTrackingInfo(order);
    handleTabChange("tracking");
  };

  // Handle Change Password
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!currentPassword) {
      setPassError("Current password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }

    // Simulate password change success
    setPassSuccess("Your password has been changed successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="bg-background min-h-screen pb-16">
      {/* Breadcrumbs */}
      <div className="page-shell px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#8a8f88]">
          <Link to="/" className="transition hover:text-secondary">
            Home
          </Link>
          <span>/</span>
          <span className="text-secondary font-bold">My Account</span>
        </nav>
      </div>

      <section className="page-shell px-4 py-2 sm:px-6 lg:px-8">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Account Navigation Card */}
          <div className="lg:col-span-3 bg-white border border-outline rounded-3xl p-6 shadow-sm">
            {/* Header User Card */}
            <div className="flex items-center gap-4 border-b border-outline pb-6 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary font-extrabold text-xl shrink-0 overflow-hidden">
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                )}
              </div>
              <div className="overflow-hidden text-left">
                <h3 className="text-lg font-bold text-on-background truncate">
                  {profileName}
                </h3>
                <p className="text-xs text-charcoal-text truncate">
                  {profileEmail}
                </p>
                <span className="inline-block mt-1 bg-secondary/20 border border-secondary/10 text-secondary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Member
                </span>
              </div>
            </div>

            {/* Sidebar Tabs List */}
            <nav className="grid gap-1">
              <button
                onClick={() => handleTabChange("dashboard")}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-secondary/10 text-secondary font-bold shadow-sm"
                    : "text-on-background hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard
                    size={18}
                    className={
                      activeTab === "dashboard"
                        ? "text-secondary"
                        : "text-charcoal-text"
                    }
                  />
                  <span>My Dashboard</span>
                </div>
                <ArrowRight
                  size={14}
                  className={`opacity-60 transition ${activeTab === "dashboard" ? "translate-x-1 opacity-100" : ""}`}
                />
              </button>

              <button
                onClick={() => handleTabChange("profile")}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-secondary/10 text-secondary font-bold shadow-sm"
                    : "text-on-background hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User
                    size={18}
                    className={
                      activeTab === "profile"
                        ? "text-secondary"
                        : "text-charcoal-text"
                    }
                  />
                  <span>My Profile</span>
                </div>
                <ArrowRight
                  size={14}
                  className={`opacity-60 transition ${activeTab === "profile" ? "translate-x-1 opacity-100" : ""}`}
                />
              </button>

              <button
                onClick={() => handleTabChange("orders")}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-secondary/10 text-secondary font-bold shadow-sm"
                    : "text-on-background hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package
                    size={18}
                    className={
                      activeTab === "orders"
                        ? "text-secondary"
                        : "text-charcoal-text"
                    }
                  />
                  <span>My Orders</span>
                </div>
                <ArrowRight
                  size={14}
                  className={`opacity-60 transition ${activeTab === "orders" ? "translate-x-1 opacity-100" : ""}`}
                />
              </button>

              <button
                onClick={() => handleTabChange("addresses")}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === "addresses"
                    ? "bg-secondary/10 text-secondary font-bold shadow-sm"
                    : "text-on-background hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin
                    size={18}
                    className={
                      activeTab === "addresses"
                        ? "text-secondary"
                        : "text-charcoal-text"
                    }
                  />
                  <span>Saved Addresses</span>
                </div>
                <ArrowRight
                  size={14}
                  className={`opacity-60 transition ${activeTab === "addresses" ? "translate-x-1 opacity-100" : ""}`}
                />
              </button>

              <button
                onClick={() => handleTabChange("tracking")}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === "tracking"
                    ? "bg-secondary/10 text-secondary font-bold shadow-sm"
                    : "text-on-background hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck
                    size={18}
                    className={
                      activeTab === "tracking"
                        ? "text-secondary"
                        : "text-charcoal-text"
                    }
                  />
                  <span>Order Tracking</span>
                </div>
                <ArrowRight
                  size={14}
                  className={`opacity-60 transition ${activeTab === "tracking" ? "translate-x-1 opacity-100" : ""}`}
                />
              </button>

              <button
                onClick={() => handleTabChange("vet-verification")}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === "vet-verification"
                    ? "bg-secondary/10 text-secondary font-bold shadow-sm"
                    : "text-on-background hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    size={18}
                    className={
                      activeTab === "vet-verification"
                        ? "text-secondary"
                        : "text-charcoal-text"
                    }
                  />
                  <span>Vet Verification</span>
                </div>
                <ArrowRight
                  size={14}
                  className={`opacity-60 transition ${activeTab === "vet-verification" ? "translate-x-1 opacity-100" : ""}`}
                />
              </button>

              {/* <button
                onClick={() => handleTabChange('password')}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === 'password'
                    ? 'bg-surface-soft text-primary font-bold shadow-sm'
                    : 'text-on-background hover:bg-surface-tint/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} className={activeTab === 'password' ? 'text-primary' : 'text-charcoal-text'} />
                  <span>Change Password</span>
                </div>
                <ArrowRight size={14} className={`opacity-60 transition ${activeTab === 'password' ? 'translate-x-1 opacity-100' : ''}`} />
              </button> */}

              <button
                onClick={() => handleTabChange("support")}
                className={`flex items-center justify-between w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition cursor-pointer ${
                  activeTab === "support"
                    ? "bg-secondary/10 text-secondary font-bold shadow-sm"
                    : "text-on-background hover:bg-secondary/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle
                    size={18}
                    className={
                      activeTab === "support"
                        ? "text-secondary"
                        : "text-charcoal-text"
                    }
                  />
                  <span>Support</span>
                </div>
                <ArrowRight
                  size={14}
                  className={`opacity-60 transition ${activeTab === "support" ? "translate-x-1 opacity-100" : ""}`}
                />
              </button>

              {/* Red Logout Button */}
              <div className="border-t border-outline mt-4 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition cursor-pointer text-left"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Right Column: Tab Contents Card */}
          <div className="lg:col-span-9 bg-white border border-outline rounded-3xl p-6 sm:p-8 shadow-sm min-h-[500px]">
            {/* Render Active Tab Component */}
            {activeTab === "dashboard" && (
              <DashboardTab
                orders={orders}
                addresses={addresses}
                handleTabChange={handleTabChange}
                setSelectedOrder={setSelectedOrder}
                isLoading={isOrdersLoading}
              />
            )}

            {activeTab === "profile" && (
              <ProfileInfoTab
                profileName={profileName}
                setProfileName={setProfileName}
                profileEmail={profileEmail}
                setProfileEmail={setProfileEmail}
                profilePhone={profilePhone}
                setProfilePhone={setProfilePhone}
                profileGender={profileGender}
                setProfileGender={setProfileGender}
                profileDob={profileDob}
                setProfileDob={setProfileDob}
                profileAvatar={profileAvatar}
                setProfileAvatar={setProfileAvatar}
                isAvatarUploading={isAvatarUploading}
                onAvatarUpload={handleAvatarUpload}
                avatarError={avatarError}
                handleSaveProfile={handleSaveProfile}
                handleCancelProfile={handleCancelProfile}
                isEditingProfile={isEditingProfile}
                setIsEditingProfile={setIsEditingProfile}
                profileMessage={profileMessage}
                handleTabChange={handleTabChange}
              />
            )}

            {activeTab === "orders" && (
              <OrderHistoryTab
                orders={orders}
                selectedOrder={selectedOrder}
                setSelectedOrder={setSelectedOrder}
                triggerTracking={triggerTracking}
                onCancelOrder={handleCancelOrder}
                isLoading={isOrdersLoading}
              />
            )}

            {activeTab === "addresses" && (
              <SavedAddressesTab
                addresses={addresses}
                showAddressForm={showAddressForm}
                setShowAddressForm={setShowAddressForm}
                addressTitle={addressTitle}
                setAddressTitle={setAddressTitle}
                addressName={addressName}
                setAddressName={setAddressName}
                addressStreet={addressStreet}
                setAddressStreet={setAddressStreet}
                addressCity={addressCity}
                setAddressCity={setAddressCity}
                addressState={addressState}
                setAddressState={setAddressState}
                addressZip={addressZip}
                setAddressZip={setAddressZip}
                addressCountry={addressCountry}
                setAddressCountry={setAddressCountry}
                addressPhone={addressPhone}
                setAddressPhone={setAddressPhone}
                handleAddAddress={handleAddAddress}
                handleDeleteAddress={handleDeleteAddress}
                handleUpdateAddress={handleUpdateAddress}
                handleSetDefaultAddress={handleSetDefaultAddress}
              />
            )}

            {activeTab === "tracking" && (
              <OrderTrackingTab
                trackIdInput={trackIdInput}
                setTrackIdInput={setTrackIdInput}
                trackingInfo={trackingInfo}
                trackingError={trackingError}
                handleTrackOrder={handleTrackOrder}
              />
            )}

            {activeTab === "vet-verification" && <VetVerificationTab />}

            {/* {activeTab === 'password' && (
              <ChangePasswordTab
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPass1={showPass1}
                setShowPass1={setShowPass1}
                showPass2={showPass2}
                setShowPass2={setShowPass2}
                passError={passError}
                passSuccess={passSuccess}
                handleChangePassword={handleChangePassword}
              />
            )} */}

            {activeTab === "support" && <HelpSupportTab />}
          </div>
        </div>
      </section>
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
      />
    </main>
  );
}
