import { parsePrice } from "./cart";

export const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating", label: "Highest Rated" },
  { id: "name-asc", label: "Name: A-Z" },
];

export function getProductCategory(product = {}) {
  return (
    product.categoryId ||
    product.categoryName ||
    product.category?.id ||
    product.category?.name ||
    product.category ||
    "Uncategorized"
  );
}

export function filterByCategory(products, categoryId) {
  if (!categoryId || categoryId === "all") return products;
  const normalizedCategory = String(categoryId).toLowerCase();

  return products.filter((product) => {
    const candidates = [
      getProductCategory(product),
      product.categoryId,
      product.categoryName,
      product.category?.id,
      product.category?.name,
      product.category,
    ];

    return candidates.some(
      (value) => String(value || "").toLowerCase() === normalizedCategory,
    );
  });
}

export function filterBySearch(products, query) {
  if (!query || !query.trim()) return products;
  const lower = query.trim().toLowerCase();
  return products.filter(
    (product) =>
      product.title.toLowerCase().includes(lower) ||
      (product.description && product.description.toLowerCase().includes(lower)),
  );
}

export function filterByMaxPrice(products, maxPrice) {
  if (!maxPrice || maxPrice === Infinity) return products;
  return products.filter((product) => parsePrice(product.salePrice) <= maxPrice);
}

export function sortProducts(products, sortId) {
  const sorted = [...products];
  switch (sortId) {
    case "price-asc":
      return sorted.sort(
        (a, b) => parsePrice(a.salePrice) - parsePrice(b.salePrice),
      );
    case "price-desc":
      return sorted.sort(
        (a, b) => parsePrice(b.salePrice) - parsePrice(a.salePrice),
      );
    case "rating":
      return sorted.sort((a, b) => Number(b.rating) - Number(a.rating));
    case "name-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
}

export function filterByAvailability(products, inStock, outOfStock) {
  return products.filter((product) => {
    const isIn = product.stock === undefined || product.stock > 0;
    const isOut = product.stock === 0;
    if (inStock && isIn) return true;
    if (outOfStock && isOut) return true;
    return false;
  });
}

export function filterByPetTypes(products, petTypes) {
  if (!petTypes || petTypes.length === 0) return products;
  return products.filter((product) => {
    if (!product.petType) return false;
    return petTypes.some((type) =>
      product.petType.toLowerCase().includes(type.toLowerCase()),
    );
  });
}

export function filterByFoodTypes(products, foodTypes) {
  if (!foodTypes || foodTypes.length === 0) return products;
  return products.filter((product) => {
    const categoryText = `${product.categoryName || ""} ${product.category || ""}`.toLowerCase();
    const productText = `${product.title || ""} ${product.description || ""} ${product.foodType || ""}`.toLowerCase();

    return foodTypes.some((foodType) => {
      const normalizedFoodType = foodType.toLowerCase();
      return categoryText.includes(normalizedFoodType) || productText.includes(normalizedFoodType);
    });
  });
}

export function applyFilters(
  products,
  {
    category,
    search,
    maxPrice,
    sort,
    inStock,
    outOfStock,
    petTypes,
    foodTypes,
  },
) {
  let result = filterByCategory(products, category);
  result = filterBySearch(result, search);
  result = filterByMaxPrice(result, maxPrice);
  if (inStock !== undefined && outOfStock !== undefined) {
    result = filterByAvailability(result, inStock, outOfStock);
  }
  if (petTypes) {
    result = filterByPetTypes(result, petTypes);
  }
  if (foodTypes) {
    result = filterByFoodTypes(result, foodTypes);
  }
  return sortProducts(result, sort);
}

export function getPriceRange(products) {
  if (!products.length) return { min: 0, max: 100 };
  const prices = products.map((product) => parsePrice(product.salePrice));
  return {
    min: Math.floor(Math.min(...prices)),
    max: Math.ceil(Math.max(...prices)),
  };
}
