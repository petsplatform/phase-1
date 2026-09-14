export const CATEGORIES = [
  "All Products",
  "Dogs",
  "Cats",
  "Food & Nutrition",
  "Treats & Snacks",
  "Health & Care",
  "Grooming & Bath",
  "Toys & Playtime",
  "Beds & Furniture",
  "Collars & Leashes",
  "Bowls & Feeders",
  "Clothing",
  "Travel & Carriers",
  "Training",
  "Litter & Hygiene",
  "Accessories",
  "Supplements",
  "New Arrivals",
  "Best Sellers",
  "On Sale",
];

export const CATEGORY_SLUG_MAP = {
  "food-nutrition": "Food & Nutrition",
  "toys-play": "Toys & Playtime",
  accessories: "Accessories",
  "grooming-hygiene": "Grooming & Bath",
  "travel-comfort": "Travel & Carriers",
  "health-care": "Health & Care",
  cats: "Cats",
  dogs: "Dogs",
  fish: "All Products",
  birds: "All Products",
  "small-pets": "All Products",
  "treats-snacks": "Treats & Snacks",
  "beds-furniture": "Beds & Furniture",
  "collars-leashes": "Collars & Leashes",
  "bowls-feeders": "Bowls & Feeders",
  clothing: "Clothing",
  training: "Training",
  "litter-hygiene": "Litter & Hygiene",
  supplements: "Supplements",
  "new-arrivals": "New Arrivals",
  "best-sellers": "Best Sellers",
  "on-sale": "On Sale",
};

export function slugToCategory(slug) {
  if (!slug) return "All Products";
  return CATEGORY_SLUG_MAP[slug.toLowerCase()] ?? "All Products";
}

export function categoryToSlug(label) {
  const found = Object.entries(CATEGORY_SLUG_MAP).find(([, v]) => v === label);
  return found ? found[0] : label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
