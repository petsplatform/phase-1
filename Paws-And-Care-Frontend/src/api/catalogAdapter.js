import { findSelectedVariant, getVariantPrice } from '../utils/cartVariants';
import { normalizeAddressForApi } from '../utils/addressPayload';

const fallbackImage = '/vite.svg';

const asArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const money = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

export const mapPawsProduct = (product = {}, index = 0) => {
  const pricing = product.pricing || {};
  const variants = asArray(product.optionVariants);
  const options = variants.length
    ? variants.map((variant) => variant.label || variant.name || variant.id).filter(Boolean)
    : asArray(product.capacities);
  const price = money(product.displayPrice ?? pricing.finalPrice ?? product.price, 0);
  const originalPrice = money(product.displayMrp ?? pricing.price ?? product.originalPrice, 0);
  const stock = money(product.inventory?.stockQuantity ?? product.stock, 0);
  const category = product.category?.name || product.categoryName || product.category || 'Pet Essentials';

  // Extract valid image URLs from optionVariants
  const variantImages = variants
    .map((v) => {
      if (!v) return null;
      if (typeof v.image === 'string' && v.image.trim()) return v.image.trim();
      if (v.image?.url) return v.image.url;
      if (v.image?.src) return v.image.src;
      if (typeof v.imageUrl === 'string' && v.imageUrl.trim()) return v.imageUrl.trim();
      if (Array.isArray(v.images) && v.images.length > 0) {
        const first = v.images[0];
        return typeof first === 'string' ? first : first?.url || first?.src;
      }
      if (typeof v.thumbnail === 'string' && v.thumbnail.trim()) return v.thumbnail.trim();
      if (typeof v.photo === 'string' && v.photo.trim()) return v.photo.trim();
      return null;
    })
    .filter(Boolean);

  const primaryCandidates = [
    typeof product.mainImage === 'string' ? product.mainImage.trim() : product.mainImage?.url || product.mainImage?.src,
    typeof product.image === 'string' ? product.image.trim() : product.image?.url || product.image?.src,
    typeof product.thumbnail === 'string' ? product.thumbnail.trim() : product.thumbnail?.url || product.thumbnail?.src,
    typeof product.imageUrl === 'string' ? product.imageUrl.trim() : null,
  ].filter(Boolean);

  const rawGallery = Array.isArray(product.gallery) ? product.gallery : [];
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const galleryList = [...rawGallery, ...rawImages]
    .map((img) => {
      if (!img) return null;
      if (typeof img === 'string' && img.trim()) return img.trim();
      return img.url || img.src || null;
    })
    .filter(Boolean);

  const colorVariantImages = (Array.isArray(product.colorVariants) ? product.colorVariants : [])
    .flatMap((v) => {
      if (!v) return [];
      const vMain = typeof v.mainImage === 'string' ? v.mainImage.trim() : v.mainImage?.url || v.mainImage?.src;
      const vImg = typeof v.image === 'string' ? v.image.trim() : v.image?.url || v.image?.src;
      const vUrl = typeof v.imageUrl === 'string' ? v.imageUrl.trim() : null;
      const vGal = Array.isArray(v.gallery) ? v.gallery.map((g) => (typeof g === 'string' ? g.trim() : g?.url || g?.src)) : [];
      return [vMain, vImg, vUrl, ...vGal];
    })
    .filter(Boolean);

  const familyImages = (Array.isArray(product.familyVariants) ? product.familyVariants : [])
    .flatMap((fv) => {
      if (!fv) return [];
      const fMain = typeof fv.mainImage === 'string' ? fv.mainImage.trim() : fv.mainImage?.url || fv.mainImage?.src;
      const fImg = typeof fv.image === 'string' ? fv.image.trim() : fv.image?.url || fv.image?.src;
      const fUrl = typeof fv.imageUrl === 'string' ? fv.imageUrl.trim() : null;
      const fGal = Array.isArray(fv.gallery) ? fv.gallery.map((g) => (typeof g === 'string' ? g.trim() : g?.url || g?.src)) : [];
      return [fMain, fImg, fUrl, ...fGal];
    })
    .filter(Boolean);

  // Merge base gallery, variant images and family images so all photos are accessible
  const gallery = Array.from(
    new Set([...primaryCandidates, ...galleryList, ...colorVariantImages, ...variantImages, ...familyImages]),
  ).filter(Boolean);
  const image = primaryCandidates[0] || gallery[0] || fallbackImage;

  // Ensure each variant has a resolved image property
  const normalizedVariants = variants.map((variant, vIdx) => {
    const vImg =
      (typeof variant.image === 'string' && variant.image.trim() ? variant.image.trim() : null) ||
      variant.image?.url ||
      variant.image?.src ||
      (typeof variant.imageUrl === 'string' && variant.imageUrl.trim() ? variant.imageUrl.trim() : null) ||
      (Array.isArray(variant.images) && variant.images.length > 0
        ? typeof variant.images[0] === 'string'
          ? variant.images[0]
          : variant.images[0]?.url || variant.images[0]?.src
        : null) ||
      (typeof variant.thumbnail === 'string' && variant.thumbnail.trim() ? variant.thumbnail.trim() : null) ||
      (typeof variant.photo === 'string' && variant.photo.trim() ? variant.photo.trim() : null) ||
      variantImages[vIdx] ||
      image;

    return {
      ...variant,
      image: vImg,
      imageUrl: vImg,
    };
  });

  const rawRating =
    product.rating ??
    product.avgRating ??
    product.averageRating ??
    product.ratings ??
    product.starRating ??
    product.average_rating;

  const rawReviewCount =
    product.reviewCount ??
    product.numReviews ??
    product.totalReviews ??
    product.reviewsCount ??
    product.reviews_count ??
    (Array.isArray(product.reviews) ? product.reviews.length : 0);

  const reviewCount = money(rawReviewCount, 0);
  let rating = money(rawRating, 0);

  if (rating === 0 && reviewCount > 0) {
    rating = 4;
  }

  return {
    ...product,
    id: product.id || product._id || product.sku || `product-${index + 1}`,
    productId: product.id || product._id || product.sku || `product-${index + 1}`,
    slug: product.slug || product.id || product._id || product.sku || `product-${index + 1}`,
    name: product.name || 'Unnamed product',
    sku: product.sku || '',
    category,
    brand: product.brand || product.vendor || 'Paws & Care',
    price,
    originalPrice: originalPrice > price ? originalPrice : null,
    image,
    gallery: gallery.length > 0 ? gallery : [image],
    options,
    shortDescription: product.shortDescription || product.description || '',
    fullDescription: product.fullDescription || product.description || '',
    rating,
    reviewCount,
    stock,
    inStock: product.inventory?.isInStock ?? stock > 0,
    isBestSeller: Boolean(product.isBestSeller),
    isNew: Boolean(product.isNew),
    isOnSale: originalPrice > price,
    optionVariants: normalizedVariants,
    productType: product.productType
      ? String(product.productType).trim().toUpperCase()
      : (Array.isArray(product.familyVariants) && product.familyVariants.length > 0)
        ? 'FAMILY'
        : 'SIMPLE',
    familyVariants: asArray(product.familyVariants),
    productDetails: product.productDetails || {},
    parentContent: product.parentContent || '',
  };
};

export const mapPawsProducts = (payload) => {
  const items = Array.isArray(payload) ? payload : payload?.items || [];
  return items.map(mapPawsProduct);
};

export const toCollectionItem = (product, quantity = 1, option = '') => {
  const selectedOption = option || product?.options?.[0] || '';
  const activeVariant = findSelectedVariant(product, selectedOption, product?.variantId);
  const price = activeVariant
    ? getVariantPrice(activeVariant, product?.price)
    : money(product?.selectedSize?.price ?? product?.price);

  return {
    id: [product?.id, selectedOption].filter(Boolean).join('__'),
    productId: product?.productId || product?.id,
    variantId: product?.variantId || activeVariant?.id || null,
    slug: product?.slug,
    name: product?.name,
    sku: product?.sku,
    quantity,
    price,
    image: activeVariant?.image || product?.image,
    option: selectedOption,
    variantLabel: selectedOption,
    selectedSize: selectedOption ? { label: selectedOption, price } : null,
    stock: product?.stock,
    prescriptionRequired: Boolean(product?.prescriptionRequired || product?.requiresPrescription),
  };
};

export const normalizeOrder = (order = {}) => {
  const contactDetails = order.contactDetails || {
    firstName: order.firstName || order.customerName?.split(' ')?.[0] || '',
    lastName: order.lastName || order.customerName?.split(' ')?.slice(1).join(' ') || '',
    email: order.email || '',
    mobile: order.phone || order.mobile || '',
  };

  const rawAddress =
    order.shippingAddress ||
    order.shipping_address ||
    order.deliveryAddress ||
    order.address ||
    {};

  const shippingAddress = normalizeAddressForApi(rawAddress, {
    firstName: contactDetails.firstName,
    lastName: contactDetails.lastName,
    mobile: contactDetails.mobile,
  });

  const rawEst = order.estimatedDeliveryDate || order.shipment?.estimatedDeliveryDate || order.estimatedDelivery || order.delivery_estimate;
  const oDate = order.orderDate || order.createdAt;

  const deliveryEstimate = (() => {
    if (rawEst && rawEst !== '—' && rawEst !== '3-5 business days') {
      const d = new Date(rawEst);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return rawEst;
    }
    return 'N/A';
  })();

  return {
    ...order,
    orderId: order.orderId || order.id || order._id,
    orderDate: oDate,
    orderStatus: order.orderStatus || order.status || 'Order Confirmed',
    shippingAddress,
    courierName: order.courierName || order.courier || order.shipment?.courierName || order.shipment?.courier || 'N/A',
    trackingNumber: order.trackingNumber || order.trackingId || order.shipment?.trackingNumber || order.shipment?.trackingId || 'N/A',
    awbNumber: order.awbNumber || order.awb || order.shipment?.awbNumber || order.shipment?.awb || 'N/A',
    trackingUrl: order.trackingUrl || order.tracking_url || order.shipment?.trackingUrl || null,
    estimatedDeliveryDate: rawEst || null,
    deliveryEstimate,
    contactDetails,
    pricing: order.pricing || {
      subtotal: money(order.subtotal),
      discount: money(order.discount),
      shipping: money(order.shipping),
      tax: money(order.tax),
      total: money(order.total ?? order.amount),
    },
    items: (order.items || []).map((item) => ({
      ...item,
      id: item.productId || item.id,
      option: item.option || item.variantLabel || item.selectedSize?.label || '',
      price: money(item.price),
      quantity: Number(item.quantity) || 1,
      prescriptionRequired: Boolean(item.prescriptionRequired || item.requiresPrescription),
      prescriptionUrl: item.prescriptionUrl || undefined,
    })),
    prescriptions: order.prescriptions || [],
  };
};

