const DEFAULT_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=80";

const CATEGORY_THEME_IMAGES = [
  {
    keywords: ["dog care", "dog food", "dog", "flea", "tick"],
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["cat care", "cat food", "cat", "allergy", "skin"],
    image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["pet travel", "travel", "carrier", "accessories", "collars", "leashes"],
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["wellness", "health", "heartworm", "medicine", "medication", "antibiotic", "digestive"],
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["grooming", "coat", "shampoo"],
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["pain", "arthritis", "joint", "clinic", "vet"],
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80",
  },
  {
    keywords: ["anxiety", "calming", "treat", "toys", "play"],
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80",
  },
];

function findCategoryThemeImage(category = {}) {
  const source = `${category.name || ""} ${category.description || ""}`.toLowerCase();
  const match = CATEGORY_THEME_IMAGES.find(({ keywords }) =>
    keywords.some((keyword) => source.includes(keyword)),
  );

  return match?.image || DEFAULT_CATEGORY_IMAGE;
}

function resolveCategoryThemeImage(category = {}) {
  return category.image || findCategoryThemeImage(category);
}

function withCategoryThemeImage(category = {}) {
  return {
    ...category,
    image: resolveCategoryThemeImage(category),
  };
}

module.exports = {
  CATEGORY_THEME_IMAGES,
  DEFAULT_CATEGORY_IMAGE,
  findCategoryThemeImage,
  resolveCategoryThemeImage,
  withCategoryThemeImage,
};
