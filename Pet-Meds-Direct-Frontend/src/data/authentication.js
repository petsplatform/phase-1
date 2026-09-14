export const loginPageData = {
  title: "Welcome Back",
  subtitle: "Sign in to access your dashboard, orders, and wishlist",
  emailLabel: "Email Address",
  emailPlaceholder: "Enter your email address (e.g., larissa@example.com)",
  sendCodeButton: "Send OTP Code",
  sendCodeLoading: "Sending code...",
  
  otpTitle: "Verify Your Email",
  otpSubtitle: "We sent a 6-digit verification code to",
  otpLabel: "Enter 6-Digit OTP Code",
  verifyButton: "Verify & Sign In",
  verifyLoading: "Verifying...",
  resendText: "Didn't receive code?",
  resendAction: "Resend Code",
  resendCountdown: "Resend in {seconds}s",
  
  successTitle: "Login Successful!",
  successSubtitle: "Welcome back, Larissa! Redirecting to homepage...",
};

export const profileDropdownMenu = [
  {
    label: "My Dashboard",
    href: "/profile?tab=dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "My Orders",
    href: "/profile?tab=orders",
    icon: "Package",
  },
  {
    label: "Wishlist",
    href: "/wishlist",
    icon: "Heart",
  },
  {
    label: "Saved Addresses",
    href: "/profile?tab=addresses",
    icon: "MapPin",
  },
  {
    label: "Account Details",
    href: "/profile?tab=profile",
    icon: "Lock",
  },
  {
    label: "Order Tracking",
    href: "/profile?tab=tracking",
    icon: "Truck",
  },
  {
    label: "Support",
    href: "/contact",
    icon: "HelpCircle",
    isDividerBefore: true,
  },
  {
    label: "Logout",
    href: "#logout",
    icon: "LogOut",
    isLogout: true,
    isRed: true,
  },
];

