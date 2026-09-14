const socialUrls = {
  facebook: import.meta.env.VITE_FACEBOOK_URL || "",
  instagram: import.meta.env.VITE_INSTAGRAM_URL || "",
  pinterest: import.meta.env.VITE_PINTEREST_URL || "",
  youtube: import.meta.env.VITE_YOUTUBE_URL || "",
};

export const featureFlags = {
  // Offers page is temporarily hidden; keep the page and coupon APIs committed.
  offers: false,
  // Blog is temporarily disabled across the storefront.
  blog: false,
  // Temporarily paused PDF features; keep their pages and APIs committed.
  autoOrder: false,
  reviews: true,
  sitemap: true,
  rewardPoints: false,
  affiliateProgram: true,
  discountsCoupons: false,
  // Pets 2.0 is temporarily paused. Keep its code and APIs available for reactivation.
  petDetails: false,
  petAssistant: false,
  // 24/7 Customer Support is temporarily paused; keep the support implementation committed.
  customerSupport: false,
  // Customer Care Price Match and Feedback are temporarily paused.
  priceMatchFeedback: false,
  // Public ordering and shipping guide pages are temporarily paused.
  orderGuide: false,
  shippingCharges: false,
};

export const shopMenuItems = [
  { label: "Dog", to: "/products?search=Dog" },
  { label: "Cat", to: "/products?search=Cat" },
  { label: "Pet Medicines", to: "/products?search=Medicine" },
  { label: "Food", to: "/products?search=Food" },
  { label: "Grooming", to: "/products?search=Grooming" },
  { label: "Supplements", to: "/products?search=Supplements" },
  { label: "All Products", to: "/products" },
];

export const helpMenuItems = [
  featureFlags.orderGuide && { label: "How to Order", to: "/how-to-order" },
  featureFlags.shippingCharges && { label: "Shipping Charges", to: "/shipping-charges" },
  { label: "Contact", to: "/contact" },
  { label: "Returns", to: "/return-policy" },
].filter(Boolean);

export const publicSocialLinks = [
  {
    key: "facebook",
    label: "Facebook",
    url: socialUrls.facebook,
  },
  {
    key: "instagram",
    label: "Instagram",
    url: socialUrls.instagram,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    url: socialUrls.pinterest,
  },
  {
    key: "youtube",
    label: "YouTube",
    url: socialUrls.youtube,
  },
].filter((item) => /^https?:\/\//i.test(item.url));

export const footerNavigation = [
  {
    title: "Shop",
    links: [
      { label: "Products", to: "/products" },
      featureFlags.discountsCoupons && { label: "Discounts & Coupons", to: "/discounts" },
    ].filter(Boolean),
  },
  {
    title: "Help",
    links: [
      featureFlags.orderGuide && { label: "How to Order", to: "/how-to-order" },
      featureFlags.shippingCharges && { label: "Shipping Charges", to: "/shipping-charges" },
      featureFlags.reviews && { label: "Reviews", to: "/reviews" },
      { label: "Contact", to: "/contact" },
    ].filter(Boolean),
  },
  {
    title: "Programs",
    links: [
      featureFlags.autoOrder && { label: "Auto-Order", to: "/account/auto-orders" },
      featureFlags.rewardPoints && { label: "Reward Points", to: "/reward-points" },
      featureFlags.affiliateProgram && { label: "Affiliate Program", to: "/affiliate-program" },
    ].filter(Boolean),
  },
  {
    title: "Information",
    links: [
      { label: "About Us", to: "/about" },
      featureFlags.blog && { label: "Blog", to: "/blog" },
      featureFlags.sitemap && { label: "Sitemap", to: "/sitemap" },
    ].filter(Boolean),
  },
];
