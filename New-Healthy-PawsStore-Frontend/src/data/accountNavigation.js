import {
  LayoutDashboard,
  LocateFixed,
  LogOut,
  MapPin,
  Package,
  UserRound,
  ShieldCheck,
} from "lucide-react";

export const accountNavigation = [
  { label: "My Dashboard", path: "/account/dashboard", icon: LayoutDashboard },
  { label: "My Orders", path: "/account/orders", icon: Package },
  { label: "Track Order", path: "/account/track-order", icon: LocateFixed },
  { label: "Saved Addresses", path: "/account/addresses", icon: MapPin },
  { label: "Account Details", path: "/account/details", icon: UserRound },
  { label: "Vet Verification", path: "/account/vet-verification", icon: ShieldCheck },
  { label: "Logout", path: "/login", icon: LogOut, action: "logout" },
];

export const orderStatuses = {
  pending: { label: "Pending", className: "bg-sageLight text-secondaryDark" },
  confirmed: { label: "Confirmed", className: "bg-sageLight text-secondaryDark" },
  processing: { label: "Processing", className: "bg-cream text-orange" },
  shipped: { label: "Shipped", className: "bg-sageLight text-secondaryDark" },
  "out-for-delivery": { label: "Out for Delivery", className: "bg-cream text-orange" },
  delivered: { label: "Delivered", className: "bg-sageLight text-success" },
  cancelled: { label: "Cancelled", className: "bg-sageLight text-error" },
  refunded: { label: "Refunded", className: "bg-sageLight text-muted" },
};
