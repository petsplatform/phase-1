// ─── Profile Sidebar Menu ───
export const profileSidebarMenu = [
  {
    key: "dashboard",
    label: "My Dashboard",
    icon: "LayoutDashboard",
  },
  {
    key: "profile",
    label: "My Profile",
    icon: "User",
  },
  {
    key: "orders",
    label: "My Orders",
    icon: "Package",
  },
  {
    key: "addresses",
    label: "Saved Addresses",
    icon: "MapPin",
  },
  {
    key: "tracking",
    label: "Order Tracking",
    icon: "Truck",
  },
  {
    key: "vet-verification",
    label: "Vet Verification",
    icon: "ShieldCheck",
  },
  {
    key: "support",
    label: "Support",
    icon: "HelpCircle",
  },
];

// ─── Mock User Profile Data ───
export const profileUserData = {
  name: "Dev",
  email: "dev@gmail.com",
  phone: "+1 (555) 123-4567",
  gender: "Male",
  dateOfBirth: "1995-08-15",
  memberTier: "MEMBER",
};

// ─── Dashboard Stat Cards ───
export const dashboardStats = [
  {
    label: "TOTAL ORDERS",
    value: 3,
    color: "#6c5ce7",
  },
  {
    label: "PENDING ORDERS",
    value: 1,
    color: "#e17055",
  },
  {
    label: "DELIVERED ORDERS",
    value: 2,
    color: "#00b894",
  },
  {
    label: "SAVED ADDRESSES",
    value: 2,
    color: "#0984e3",
  },
];

// ─── Recent Orders (Dashboard) ───
export const recentOrders = [
  {
    id: "BP-3042",
    date: "2026-07-04",
    items: "Premium Dog Kibble (x1), Organic Cat Treats (x2)",
    status: "Shipped",
    statusColor: "#6c5ce7",
  },
  {
    id: "BP-2981",
    date: "2026-06-15",
    items: "Squeaky Toy Ball (x1)",
    status: "Delivered",
    statusColor: "#00b894",
  },
  {
    id: "BP-2710",
    date: "2026-05-10",
    items: "Pet Bed Deluxe (x1), Flea & Tick Collar (x1)",
    status: "Delivered",
    statusColor: "#00b894",
  },
];

// ─── Full Order History ───
export const orderHistory = [
  {
    id: "BP-3042",
    date: "2026-07-04",
    items: "Premium Dog Kibble (x1), Organic Cat Treats (x2)",
    price: 58.5,
    status: "Shipped",
    statusColor: "#6c5ce7",
    trackingSteps: [
      { label: "Order Placed", date: "Jul 04, 2026", done: true },
      { label: "Processing", date: "Jul 04, 2026", done: true },
      { label: "Shipped", date: "Jul 05, 2026", done: true },
      { label: "Delivered", date: "", done: false },
    ],
  },
  {
    id: "BP-2981",
    date: "2026-06-15",
    items: "Squeaky Toy Ball (x1)",
    price: 24.99,
    status: "Delivered",
    statusColor: "#00b894",
    trackingSteps: [
      { label: "Order Placed", date: "Jun 15, 2026", done: true },
      { label: "Processing", date: "Jun 15, 2026", done: true },
      { label: "Shipped", date: "Jun 16, 2026", done: true },
      { label: "Delivered", date: "Jun 18, 2026", done: true },
    ],
  },
  {
    id: "BP-2710",
    date: "2026-05-10",
    items: "Pet Bed Deluxe (x1), Flea & Tick Collar (x1)",
    price: 112.4,
    status: "Delivered",
    statusColor: "#00b894",
    trackingSteps: [
      { label: "Order Placed", date: "May 10, 2026", done: true },
      { label: "Processing", date: "May 10, 2026", done: true },
      { label: "Shipped", date: "May 11, 2026", done: true },
      { label: "Delivered", date: "May 13, 2026", done: true },
    ],
  },
];

// ─── Saved Addresses ───
export const savedAddresses = [
  {
    id: 1,
    type: "HOME",
    typeColor: "#00b894",
    name: "John Doe",
    street: "123 Pet Lovers Lane",
    city: "New York, NY 10001",
    phone: "+1 (555) 123-4567",
  },
  {
    id: 2,
    type: "OFFICE",
    typeColor: "#e17055",
    name: "John Doe",
    street: "456 Business Plaza, Suite 90",
    city: "New York, NY 10012",
    phone: "+1 (555) 987-6543",
  },
];

// ─── Support Page Data ───
export const supportData = {
  title: "Support",
  subtitle: "We're here to help! Reach out to us anytime.",
  contactMethods: [
    {
      icon: "Mail",
      label: "Email Us",
      value: "support@petmedsdirect.com",
    },
    {
      icon: "Phone",
      label: "Call Us",
      value: "+1 (800) 555-1000",
    },
  ],
  faqLinks: [
    { question: "How do I track my order?", tab: "tracking" },
    { question: "How do I update my shipping address?", tab: "addresses" },
    { question: "What is your return policy?", href: "/legal/shipping-policy" },
    { question: "How do I cancel an order?", tab: "orders" },
  ],
};
