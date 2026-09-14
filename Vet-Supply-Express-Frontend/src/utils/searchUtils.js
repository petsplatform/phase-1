const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const collectProductSearchText = (product = {}) => {
  const values = [
    product.name,
    product.category,
    product.categoryName,
    product.brand,
    product.sku,
    product.shortDescription,
    product.description,
    product.fullDescription,
    product.longDescription,
    Array.isArray(product.tags) ? product.tags.join(" ") : product.tags,
    Array.isArray(product.keywords) ? product.keywords.join(" ") : product.keywords,
  ];

  return normalizeSearchText(values.filter(Boolean).join(" "));
};

export const productMatchesSearch = (product, query) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchableText = collectProductSearchText(product);
  if (!searchableText) return false;
  if (searchableText.includes(normalizedQuery)) return true;

  const terms = normalizedQuery.split(/\s+/).filter((term) => term.length > 1);
  if (terms.length === 0) return true;

  return terms.every((term) => searchableText.includes(term));
};
