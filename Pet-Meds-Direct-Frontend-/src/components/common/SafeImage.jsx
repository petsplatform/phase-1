const IMAGE_FALLBACKS = {
  product: "/images/placeholders/product-placeholder.svg",
  category: "/images/placeholders/category-placeholder.svg",
  avatar: "/images/placeholders/avatar-placeholder.svg",
  banner: "/images/placeholders/banner-placeholder.svg",
  brand: "/images/placeholders/brand-placeholder.svg",
};

function getFallbackSrc(fallback) {
  if (!fallback) return IMAGE_FALLBACKS.product;
  return IMAGE_FALLBACKS[fallback] || fallback;
}

function isExternalDemoImage(src) {
  return typeof src === "string" && /(^https?:)?\/\/images\.unsplash\.com\//i.test(src);
}

export default function SafeImage({
  src,
  alt = "",
  fallback = "product",
  loading = "lazy",
  onError,
  ...props
}) {
  const fallbackSrc = getFallbackSrc(fallback);
  const resolvedSrc = src && !isExternalDemoImage(src) ? src : fallbackSrc;

  const handleError = (event) => {
    onError?.(event);
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied === "true") return;
    image.dataset.fallbackApplied = "true";
    image.src = fallbackSrc;
  };

  return (
    <img
      {...props}
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
    />
  );
}

export function ProductImage(props) {
  return <SafeImage fallback="product" {...props} />;
}

export function CategoryImage(props) {
  return <SafeImage fallback="category" {...props} />;
}

export function AvatarImage(props) {
  return <SafeImage fallback="avatar" {...props} />;
}

export function BannerImage(props) {
  return <SafeImage fallback="banner" {...props} />;
}

export function BrandImage(props) {
  return <SafeImage fallback="brand" {...props} />;
}
