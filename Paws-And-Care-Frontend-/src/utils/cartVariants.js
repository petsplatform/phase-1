export const money = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const getVariantLabel = (variant = {}) => variant.label || variant.name || variant.id || '';

export const getVariantPrice = (variant = {}, fallback = 0) => {
  return money(
    variant.pricing?.finalPrice ?? variant.salePrice ?? variant.price,
    fallback,
  );
};

export const resolveSelectedOption = (item = {}, product = {}) => {
  return (
    item.option ||
    item.variantLabel ||
    item.selectedOption ||
    item.selectedSize?.label ||
    product.selectedOption ||
    ''
  );
};

export const findSelectedVariant = (product = {}, option = '', variantId = null) => {
  return product.optionVariants?.find((variant) => {
    const label = getVariantLabel(variant);
    return variant.id === variantId || label === option;
  }) || null;
};

export const resolveCartItemProduct = (item, products) => {
  const product = products.find((p) => p.id === item.id || p.productId === item.id);
  if (!product) return null;

  const option = resolveSelectedOption(item, product);
  const activeVariant = findSelectedVariant(product, option, item.variantId);
  const price = activeVariant
    ? getVariantPrice(activeVariant, product.price)
    : money(item.price ?? item.selectedSize?.price, product.price);
  const stock = activeVariant
    ? money(activeVariant.inventory?.stockQuantity ?? activeVariant.stock, product.stock)
    : product.stock;
  const image = activeVariant?.image || product.image;

  const prescriptionRequired = Boolean(
    item.prescriptionRequired ?? 
    product.prescriptionRequired ?? 
    item.requiresPrescription ?? 
    product.requiresPrescription
  );

  return {
    ...item,
    option,
    variantId: item.variantId || activeVariant?.id || null,
    prescriptionRequired,
    product: {
      ...product,
      price,
      image,
      stock,
      selectedOption: option,
      prescriptionRequired,
    },
  };
};
