export const announcementBarData = {
  tagline: "Care | Health | Happiness",
  phone: "1-800-PET-MEDS",
  trackOrderLabel: "Track Order",
  trackOrderHref: "/contact",
};

export const navbarLinks = [
  { label: "Home", href: "/" },
  {
    label: "Shop",
    href: "/products",
    children: [
      { label: "Dog", href: "/products?search=Dog" },
      { label: "Cat", href: "/products?search=Cat" },
      { label: "Pet Medicines", href: "/products?search=Medicine" },
      { label: "Food", href: "/products?search=Food" },
      { label: "Grooming", href: "/products?search=Grooming" },
      { label: "Supplements", href: "/products?search=Supplements" },
      { label: "All Products", href: "/products" },
    ],
  },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const navbarActions = {
  searchPlaceholder: "Search pet meds and products",
  loginLabel: "Login",
  loginHref: "/login",
  wishlistHref: "/wishlist",
  cartHref: "/cart",
};
