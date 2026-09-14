/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { CartIcon, ChevronDownIcon } from "../components/common/HeaderIcons";
import ProductGallery from "../components/ProductGallery";
import ProductInfo from "../components/ProductInfo";
import ProductTabs from "../components/ProductTabs";
import RelatedProducts from "../components/RelatedProducts";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getFamilyVariants, hasPurchasableVariants, mapCatalogProduct, normalizeArrayField } from "../utils/catalog";

const ProductDetailsLoader = () => (
  <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
    <Header />
    <main className="px-4 pb-44 pt-5 sm:px-5 lg:px-[22px] lg:pb-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
          <span className="h-3 w-10 rounded-full bg-[#17345f14]" />
          <span className="h-3 w-3 rounded-full bg-[#17345f14]" />
          <span className="h-3 w-20 rounded-full bg-[#17345f14]" />
          <span className="h-3 w-3 rounded-full bg-[#17345f14]" />
          <span className="h-3 w-28 rounded-full bg-[#17345f14]" />
        </div>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(260px,42%)_minmax(0,1fr)] lg:items-start">
          <div className="rounded-2xl border border-[#17345f12] bg-white p-4 shadow-sm">
            <div className="aspect-square animate-pulse rounded-xl bg-[#f3ead8]" />
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="aspect-square animate-pulse rounded-lg bg-[#17345f12]" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#17345f12] bg-white p-5 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4d6] px-3 py-1.5 text-xs font-extrabold text-[#17345f]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading product
            </div>
            <div className="mt-5 h-8 w-3/4 animate-pulse rounded-full bg-[#17345f14]" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-[#17345f10]" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-[#17345f10]" />
            <div className="mt-6 h-10 w-40 animate-pulse rounded-full bg-[#d9aa3d33]" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-lg bg-[#17345f10]" />
              ))}
            </div>
            <div className="mt-6 h-12 w-full animate-pulse rounded-lg bg-[#17345f]" />
          </div>

        </section>
      </div>
    </main>
    <Footer />
  </div>
);

const ProductDetails = () => {
  const { slug } = useParams();
  const location = useLocation();
  const clickedProduct = location.state?.product;
  const { addToCart } = useCart();
  const { customer } = useAuth();
  const { showToast } = useToast();
  const [apiProduct, setApiProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(!clickedProduct);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedOptionVariant, setSelectedOptionVariant] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (slug) {
      setLoadingProduct(!clickedProduct);
      productApi
        .getProductById(slug)
        .then((data) => setApiProduct(data))
        .catch(() => setApiProduct(null))
        .finally(() => setLoadingProduct(false));
    }
  }, [clickedProduct, slug]);

  useEffect(() => {
    const targetId = apiProduct?.id || apiProduct?._id || clickedProduct?.id || clickedProduct?._id || slug;
    if (targetId) {
      reviewApi
        .getProductReviews(targetId)
        .then((data) => setReviews(Array.isArray(data) ? data : []))
        .catch(() => setReviews([]));
    }
  }, [apiProduct?.id, clickedProduct?.id, slug]);

  useEffect(() => {
    // Fetch a few random/latest products to act as related products
    productApi
      .getProducts({ limit: 8 })
      .then((data) => {
        if (data?.items) {
          const baseUrl = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace("/api", "")
            : "http://localhost:5000";
          const mapped = data.items
            .filter((p) => p.id !== slug) // exclude current product
            .map((p) => {
              const imageUrl = p.image
                ? p.image.startsWith("http")
                  ? p.image
                  : `${baseUrl}${p.image.startsWith("/") ? "" : "/"}${p.image}`
                : null;
              const normalized = mapCatalogProduct(p);
              return {
                ...normalized,
                slug: p.id,
                image: imageUrl,
                badge: normalized.pricing?.hasDiscount ? "Discount" : null,
                optionType: p.optionType || "size",
                optionLabel: p.optionLabel || "Size",
              };
            });
          setRelatedProducts(mapped);
        }
      })
      .catch(() => {});
  }, [slug]);

  const rawProduct = apiProduct || clickedProduct;

  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:5000";

  const formatImageUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http")
      ? url
      : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const parseArrayField = normalizeArrayField;

  const capacities = parseArrayField(rawProduct?.capacities);
  const colorVariants = parseArrayField(rawProduct?.colorVariants).map(
    (variant) => ({
      ...variant,
      mainImage: formatImageUrl(variant.mainImage),
      gallery: parseArrayField(variant.gallery)
        .map(formatImageUrl)
        .filter(Boolean),
    }),
  );
  const optionVariants = parseArrayField(rawProduct?.optionVariants).map((variant) => ({
    ...variant,
    image: formatImageUrl(variant.image || variant.mainImage),
    gallery: parseArrayField(variant.gallery).map(formatImageUrl).filter(Boolean),
  }));

  const selectedProduct = rawProduct
    ? {
        ...mapCatalogProduct(rawProduct),
        image: formatImageUrl(
          rawProduct.image || rawProduct.mainImage || rawProduct.images?.[0] ||
          normalizeArrayField(rawProduct.optionVariants)?.[0]?.image ||
          normalizeArrayField(rawProduct.optionVariants)?.[0]?.mainImage,
        ),
        capacities,
        colorVariants,
        optionVariants,
        optionType: rawProduct.optionType || "size",
        optionLabel: rawProduct.optionLabel || "Size",
      }
    : null;

  const parsedGallery = parseArrayField(rawProduct?.gallery);

  const realGallery = Array.isArray(parsedGallery)
    ? parsedGallery.map(formatImageUrl)
    : [];
  const variantImages = colorVariants.flatMap((variant) => [
    variant.mainImage,
    ...(variant.gallery || []),
  ]);
  const optionVariantImages = optionVariants.flatMap((variant) => [
    variant.image,
    ...(variant.gallery || []),
  ]);
  const allImages = [
    selectedProduct?.image,
    ...realGallery,
    ...variantImages,
    ...optionVariantImages,
  ].filter(Boolean);

  // Create a unique array of images
  const uniqueImages = [...new Set(allImages)];

  const product = selectedProduct
    ? {
        ...selectedProduct,
        id: selectedProduct.id,
        description: selectedProduct.description,
        longDescription: selectedProduct.description,
        images:
          uniqueImages.length > 0
            ? uniqueImages
            : selectedProduct.image
              ? [selectedProduct.image]
              : [],
        sizes:
          optionVariants && optionVariants.length > 0
            ? optionVariants
              .filter((variant) => String(variant.status || "Active").toLowerCase() === "active")
              .map((variant) => ({
                id: variant.id,
                label: variant.label,
                size: variant.size,
                weightRange: variant.weightRange,
                dose: variant.dose,
                packSize: variant.packSize,
                image: variant.image,
                gallery: variant.gallery || [],
                description: variant.description || variant.details,
                sku: variant.sku,
                price: Number(variant.pricing?.finalPrice ?? variant.price ?? selectedProduct.price).toFixed(2),
                oldPrice: variant.pricing?.hasDiscount ? Number(variant.pricing.price).toFixed(2) : null,
                stock: variant.inventory?.stockQuantity ?? variant.stock,
                inventory: variant.inventory,
                pricing: variant.pricing,
                disabled: !variant.isAvailable,
              }))
            : selectedProduct.capacities && selectedProduct.capacities.length > 0
              ? selectedProduct.capacities.map((c, index) => ({
                  id: `${selectedProduct.id}-option-${index + 1}`,
                  label: c,
                  price: selectedProduct.price,
                  oldPrice: selectedProduct.oldPrice,
                  stock: selectedProduct.stock,
                  inventory: selectedProduct.inventory,
                  pricing: selectedProduct.pricing,
                }))
            : [],
        optionLabel: selectedProduct.optionLabel,
        optionType: selectedProduct.optionType,
        colorVariants: selectedProduct.colorVariants || [],
        hasVariants: selectedProduct.hasVariants,
        displayPriceLabel: selectedProduct.displayPriceLabel,
        badge: selectedProduct.salePrice ? "Discount" : null,
      }
    : null;

  useEffect(() => {
    setSelectedColor(product?.colorVariants?.[0] || null);
    setSelectedOptionVariant(null);
  }, [product?.id]);

  if (loadingProduct && !product) {
    return <ProductDetailsLoader />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Product Not Found</h2>
        <Link to="/products" className="mt-4 text-[#d9aa3d] underline">
          Return to Products
        </Link>
      </div>
    );
  }

  if (product.productType === "FAMILY" || product.familyVariants?.length > 0 || getFamilyVariants(product).length > 0) {
    return <Navigate to={`/products/${product.slug || product.id}`} replace />;
  }

  const selectedVariantImages = selectedOptionVariant?.image
    ? [selectedOptionVariant.image, ...(selectedOptionVariant.gallery || [])].filter(Boolean)
    : selectedColor
    ? [selectedColor.mainImage, ...(selectedColor.gallery || [])].filter(
        Boolean,
      )
    : [];
  const displayImages =
    selectedVariantImages.length > 0 ? selectedVariantImages : product.images;

  const productWithSelectedColor = {
    ...product,
    selectedColor,
    image: displayImages[0] || product.image,
    images: displayImages,
  };

  const simpleVariantTable = product.sizes?.length > 0
    ? {
        id: `${product.id}-options`,
        name: product.name,
        displayName: product.optionLabel || "Available Options",
        image: product.image,
        skus: product.sizes.map((size) => ({
          id: size.id || size.label,
          packLabel: size.label || size.name || "Option",
          sku: size.sku,
          regularPrice: Number(size.oldPrice || size.price || product.price),
          price: Number(size.price || product.price),
          stock: Number(size.inventory?.stockQuantity ?? size.stock ?? product.stock ?? 0),
          status: size.disabled ? "Inactive" : "Active",
          image: size.image,
        })),
      }
    : null;

  const requiresVariantSelection = hasPurchasableVariants(product);
  const isOutOfStock = Number.isFinite(Number(product.stock)) && Number(product.stock) <= 0;
  const lacksVetAccess = Boolean(product.vetOnly) && !customer?.isVetVerified;

  const handleMobileAddToCart = () => {
    if (requiresVariantSelection) {
      showToast("Please select a variant.", "error");
      return;
    }
    if (isOutOfStock) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }
    if (lacksVetAccess) {
      showToast("This product is available only for verified veterinarians.", "error");
      return;
    }
    const result = addToCart({ ...productWithSelectedColor, quantity: 1 });
    if (result?.outOfStock) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }
    showToast(`${product.name} added to cart`);
  };

  const handleProductSupport = () => {
    window.dispatchEvent(new CustomEvent("petcare-open-support", {
      detail: {
        source: "PRODUCT",
        subject: "Product Question",
        productId: product.id,
        metadata: {
          productName: product.name,
          sku: product.sku,
        },
      },
    }));
  };

  return (
    <>
      <SEO
        title={`${product.name} | Best-Vet-Care`}
        description={product.description}
        ogTitle={`${product.name} | Best-Vet-Care`}
        ogDescription={product.description}
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />

        <main className="px-4 pb-44 pt-5 sm:px-5 lg:px-[22px] lg:pb-8">
          <div className="mx-auto max-w-[1440px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">
                Home
              </Link>

              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <Link
                to="/products"
                className="transition-colors hover:text-[#d9aa3d]"
              >
                Dog Food
              </Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <span className="font-extrabold text-[#122a50]">
                {product.name}
              </span>
            </nav>

            <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(260px,42%)_minmax(0,1fr)] lg:items-start">
              <div className="rounded-2xl border border-[#17345f12] bg-white p-5 shadow-sm">
                <ProductGallery
                  images={displayImages}
                  productName={product.name}
                />
              </div>
              <div className="rounded-2xl border border-[#17345f12] bg-white p-5 shadow-sm">
                <ProductInfo
                  product={productWithSelectedColor}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  onVariantChange={setSelectedOptionVariant}
                  reviews={reviews}
                  compact
                  variantTable={simpleVariantTable}
                />
              </div>
            </section>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleProductSupport}
                className="rounded-lg border border-[#17345f] px-4 py-2 text-sm font-extrabold text-[#17345f] transition-colors hover:bg-[#17345f] hover:text-white"
              >
                Need Help with this product?
              </button>
            </div>

            <ProductTabs product={product} reviews={reviews} />
            <RelatedProducts
              relatedProducts={relatedProducts.slice(0, 4)}
              recentlyViewed={relatedProducts.slice(4, 8)}
            />
          </div>
        </main>

        <Footer />

        {/* <div className="fixed inset-x-0 bottom-[74px] z-[55] border-t border-[#17345f1a] bg-white p-3 shadow-[0_-12px_32px_rgba(18,42,80,0.12)] lg:hidden">
          <div className="mx-auto flex max-w-[640px] items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-[#122a50]">
                {product.name}
              </p>
              <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
                <span className="flex flex-col">
                  <span className="text-[9px] font-extrabold uppercase leading-none text-[#122a50a6]">
                    Selling Price
                  </span>
                  <span className="mt-1 text-lg font-extrabold leading-none text-[#d9aa3d]">
                    {product.displayPriceLabel || `$${product.price}`}
                  </span>
                </span>
                {product.oldPrice && (
                  <span className="flex flex-col">
                    <span className="text-[9px] font-extrabold uppercase leading-none text-[#122a5070]">
                      MRP
                    </span>
                    <span className="mt-1 text-xs font-bold leading-none text-[#122a50b2] line-through">
                      ${product.oldPrice}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleMobileAddToCart}
              disabled={isOutOfStock || requiresVariantSelection || lacksVetAccess}
              className={`inline-flex h-11 flex-shrink-0 items-center justify-center gap-2 rounded-lg px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.25)] transition-colors ${
                isOutOfStock || requiresVariantSelection || lacksVetAccess ? "cursor-not-allowed bg-[#17345f]/40 shadow-none" : "bg-[#17345f] hover:bg-[#d9aa3d]"
              }`}
            >
              <CartIcon className="h-4 w-4" />
              {lacksVetAccess ? "Vet Required" : requiresVariantSelection ? "Select Variant" : isOutOfStock ? "Unavailable" : "Add to Cart"}
            </button>
          </div>
        </div> */}
      </div>
    </>
  );
};

export default ProductDetails;
