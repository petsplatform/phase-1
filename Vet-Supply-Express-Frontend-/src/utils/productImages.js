const DEFAULT_ALLOWED_REMOTE_IMAGE_HOSTS = [
  "res.cloudinary.com",
  "images.unsplash.com",
  "plus.unsplash.com",
];

function getAllowedRemoteImageHosts() {
  const configuredHosts = String(import.meta.env.VITE_ALLOWED_IMAGE_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...DEFAULT_ALLOWED_REMOTE_IMAGE_HOSTS, ...configuredHosts]);
}

function getImageUrl(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return "";

  return (
    value.url ||
    value.secure_url ||
    value.src ||
    value.path ||
    value.image ||
    ""
  );
}

export function isBrowserSafeImageSource(src) {
  const value = getImageUrl(src).trim();
  if (!value) return false;

  if (
    value.startsWith("/") ||
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:")
  ) {
    return true;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      const apiUrl = import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL) : null;
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const allowedHosts = getAllowedRemoteImageHosts();

      return (
        url.origin === currentOrigin ||
        (apiUrl && url.origin === apiUrl.origin) ||
        allowedHosts.has(url.hostname.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  return true;
}

export function normalizeImageSource(src) {
  const value = getImageUrl(src).trim();
  if (!value) return "";

  // Catalog media is served by the API. Resolve backend-relative upload paths
  // against the API origin instead of the Vite frontend origin.
  const backendPath = value.startsWith("/") ? value : `/${value}`;
  const isBackendMediaPath = /^\/(?:api\/)?(uploads|storage|media)\//i.test(backendPath);
  if (isBackendMediaPath && import.meta.env.VITE_API_URL) {
    try {
      const apiOrigin = new URL(import.meta.env.VITE_API_URL).origin;
      const resolved = `${apiOrigin}${backendPath}`;
      return isBrowserSafeImageSource(resolved) ? resolved : "";
    } catch {
      return "";
    }
  }

  return isBrowserSafeImageSource(value) ? value : "";
}

export function normalizeProductImages(product = {}) {
  const colorVariantImages = Array.isArray(product.colorVariants)
    ? product.colorVariants.flatMap((variant) => [
        variant?.mainImage,
        variant?.image,
        ...(Array.isArray(variant?.gallery) ? variant.gallery : []),
      ])
    : [];
  const optionVariantImages = Array.isArray(product.optionVariants)
    ? product.optionVariants.flatMap((variant) => [
        variant?.mainImage,
        variant?.image,
        ...(Array.isArray(variant?.gallery) ? variant.gallery : []),
      ])
    : [];

  const rawImages = [
    product.mainImage,
    product.image,
    product.imageUrl,
    product.thumbnail,
    ...colorVariantImages,
    ...optionVariantImages,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.gallery) ? product.gallery : []),
  ];

  return [
    ...new Set(rawImages.map((src) => normalizeImageSource(src)).filter(Boolean)),
  ];
}
