import {
  ArrowLeft,
  Truck,
  RefreshCw,
  CreditCard,
  ShieldCheck,
  Heart,
  Headphones,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import ShopProductCard from "../Components/Shop/ShopProductCard";
import { formatPrice, parsePrice } from "../utils/cart";
import { getProductCategory } from "../utils/shopFilters";
import { useNotification } from "../utils/NotificationContext";
import { productApi } from "../api/productApi";
import { ProductDetailsSkeleton } from "../Components/common/ProductCardSkeleton";
import { isFamilyProduct } from "../utils/productUtils";
import { isSlugLike } from "../utils/htmlUtils";

// Import modular components
import ProductGallery from "../Components/ProductDetails/ProductGallery";
import ProductInfo from "../Components/ProductDetails/ProductInfo";
import ProductTabs from "../Components/ProductDetails/ProductTabs";
import { reviewApi } from "../api/reviewApi";

function ProductDetailsContent({
  productId,
  onAddToCart,
  wishlistIds = [],
  onToggleWishlist,
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const wished = wishlistIds.map(String).includes(String(productId));
  const [activeSizeIndex, setActiveSizeIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();

  const handleToggleWishlist = () => {
    if (onToggleWishlist) {
      onToggleWishlist(product || productId);
    }
  };

  // Local product state containing reviews to support dynamically adding new reviews
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    avgRating: null,
    totalReviews: 0,
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setProduct(null);
    setRelatedProducts([]);

    reviewApi
      .getProductReviews(productId)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        const total = list.length;
        const avg = total
          ? (list.reduce((s, r) => s + Number(r.rating), 0) / total).toFixed(1)
          : null;
        setReviewStats({ avgRating: avg, totalReviews: total });
      })
      .catch(() => {});

    productApi
      .getProductById(productId)
      .then((apiProduct) => {
        if (!isMounted) return;
        setProduct(apiProduct);
        if (apiProduct?.categoryName) {
          return productApi.getProducts({
            category: apiProduct.categoryName,
            limit: 4,
          });
        }
      })
      .then((data) => {
        if (!isMounted || !data?.items) return;
        setRelatedProducts(
          data.items
            .filter((item) => String(item.id) !== String(productId))
            .slice(0, 3),
        );
      })
      .catch((error) => {
        console.error("Failed to load store product details:", error);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Read all sizes options and images directly from product object
  const allSizes = product?.sizes || [{ label: "Standard", multiplier: 1.0 }];

  // Auto pre-select variant from URL query param (?variant=... or ?size=... or ?familyVariantId=...)
  const variantParam =
    searchParams.get("variant") ||
    searchParams.get("size") ||
    searchParams.get("variantId");
  const familyVariantParam =
    searchParams.get("familyVariantId") || searchParams.get("familyId");

  const isFamily = isFamilyProduct(product);
  const familyVariants = Array.isArray(product?.familyVariants)
    ? product.familyVariants
    : [];

  // 1. Resolve which formulation / familyVariant is active on this details page
  const activeFamilyVariant = useMemo(() => {
    if (!isFamily || !familyVariants.length) return null;

    if (familyVariantParam) {
      const byFvId = familyVariants.find(
        (fv) =>
          String(fv.id || fv._id) === String(familyVariantParam) ||
          fv.slug === String(familyVariantParam),
      );
      if (byFvId) return byFvId;
    }

    if (variantParam && allSizes.length > 0) {
      const matched = allSizes.find(
        (s) =>
          String(s.id) === String(variantParam) ||
          String(s.sku) === String(variantParam) ||
          String(s.familyVariantId) === String(variantParam) ||
          String(s.label || "").toLowerCase() ===
            String(variantParam).toLowerCase() ||
          String(s.displayLabel || "").toLowerCase() ===
            String(variantParam).toLowerCase(),
      );
      if (matched?.familyVariant) return matched.familyVariant;
      if (matched?.familyVariantId) {
        const byId = familyVariants.find(
          (fv) => String(fv.id || fv._id) === String(matched.familyVariantId),
        );
        if (byId) return byId;
      }
      if (matched?.color) {
        const byColor = familyVariants.find(
          (fv) =>
            (fv.packColor || fv.color)?.toLowerCase() ===
            matched.color.toLowerCase(),
        );
        if (byColor) return byColor;
      }
      if (matched?.weightRange) {
        const byWeight = familyVariants.find(
          (fv) =>
            fv.weightRange?.toLowerCase() === matched.weightRange.toLowerCase(),
        );
        if (byWeight) return byWeight;
      }
    }

    return familyVariants[0] || null;
  }, [isFamily, familyVariants, familyVariantParam, variantParam, allSizes]);

  // 2. Strictly scope sizes to ONLY this active variant formulation (e.g. Yellow only or Purple only)
  const sizes = useMemo(() => {
    if (!isFamily || !familyVariants.length || !activeFamilyVariant) {
      return allSizes;
    }

    const pTitle = (product?.name || product?.title || "").trim();
    let fvClean = String(
      activeFamilyVariant.name ||
        activeFamilyVariant.displayName ||
        activeFamilyVariant.label ||
        "",
    ).trim();
    if (pTitle) {
      fvClean = fvClean
        .replace(
          new RegExp(
            `^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
            "i",
          ),
          "",
        )
        .replace(
          new RegExp(
            `\\(${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
            "gi",
          ),
          "",
        )
        .trim();
    }
    const fvCleanLower = fvClean.toLowerCase();
    const fvColorLower = String(
      activeFamilyVariant.packColor || activeFamilyVariant.color || "",
    ).toLowerCase();
    const fvWeightLower = String(
      activeFamilyVariant.weightRange || "",
    ).toLowerCase();
    const fvId = String(
      activeFamilyVariant.id || activeFamilyVariant._id || "",
    );

    const matched = allSizes.filter((sz) => {
      if (
        sz.familyVariantId &&
        (String(sz.familyVariantId) === fvId ||
          String(sz.familyVariant?.id) === fvId)
      )
        return true;
      if (
        sz.familyVariant &&
        String(sz.familyVariant.id || sz.familyVariant._id) === fvId
      )
        return true;
      const szLabel = String(sz.label || sz.displayLabel || "").toLowerCase();
      if (fvCleanLower && szLabel.includes(fvCleanLower)) return true;
      if (fvColorLower && szLabel.includes(fvColorLower)) return true;
      if (fvWeightLower && szLabel.includes(fvWeightLower)) return true;
      return false;
    });

    return matched.length > 0 ? matched : allSizes;
  }, [isFamily, familyVariants, activeFamilyVariant, allSizes, product]);

  // 3. Active size index within this scoped variant formulation

  useEffect(() => {
    if (variantParam && sizes.length > 0) {
      const vMatch = sizes.findIndex(
        (s) =>
          String(s.id) === String(variantParam) ||
          String(s.sku) === String(variantParam) ||
          String(s.label || "").toLowerCase() ===
            String(variantParam).toLowerCase() ||
          String(s.displayLabel || "").toLowerCase() ===
            String(variantParam).toLowerCase(),
      );
      if (vMatch !== -1) {
        setActiveSizeIndex(vMatch);
      } else {
        setActiveSizeIndex(0);
      }
    } else {
      setActiveSizeIndex(0);
    }
  }, [variantParam, sizes]);

  // When active variant changes, automatically reset active image to 0 (the variant's image)
  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeSizeIndex, activeFamilyVariant]);

  const activeSizeObj = sizes[activeSizeIndex] || sizes[0];

  const galleryImages = useMemo(() => {
    if (!product) return [];

    // 1. Gather ONLY active variant's uploaded image and its gallery
    const activeVarImages = [];
    const vImg = activeSizeObj?.image || activeSizeObj?.imageUrl;
    if (vImg) activeVarImages.push(vImg);

    if (Array.isArray(activeSizeObj?.gallery)) {
      activeSizeObj.gallery.forEach((g) => {
        const u = typeof g === "string" ? g : g?.url || g?.src;
        if (u && !activeVarImages.includes(u)) activeVarImages.push(u);
      });
    }

    if (activeFamilyVariant) {
      const fvImg =
        (typeof activeFamilyVariant.mainImage === "string"
          ? activeFamilyVariant.mainImage
          : activeFamilyVariant.mainImage?.url ||
            activeFamilyVariant.mainImage?.src) ||
        (typeof activeFamilyVariant.image === "string"
          ? activeFamilyVariant.image
          : activeFamilyVariant.image?.url || activeFamilyVariant.image?.src) ||
        activeFamilyVariant.imageUrl;
      if (fvImg && !activeVarImages.includes(fvImg)) {
        activeVarImages.push(fvImg);
      }
      if (Array.isArray(activeFamilyVariant.gallery)) {
        activeFamilyVariant.gallery.forEach((g) => {
          const u = typeof g === "string" ? g : g?.url || g?.src;
          if (u && !activeVarImages.includes(u)) activeVarImages.push(u);
        });
      }
      if (Array.isArray(activeFamilyVariant.images)) {
        activeFamilyVariant.images.forEach((g) => {
          const u = typeof g === "string" ? g : g?.url || g?.src;
          if (u && !activeVarImages.includes(u)) activeVarImages.push(u);
        });
      }
    }

    if (activeVarImages.length > 0) {
      return Array.from(new Set(activeVarImages)).filter(Boolean);
    }
    const baseCandidates = [
      typeof product.mainImage === "string"
        ? product.mainImage.trim()
        : product.mainImage?.url || product.mainImage?.src,
      typeof product.image === "string"
        ? product.image.trim()
        : product.image?.url || product.image?.src,
      typeof product.thumbnail === "string"
        ? product.thumbnail.trim()
        : product.thumbnail?.url || product.thumbnail?.src,
      typeof product.imageUrl === "string" ? product.imageUrl.trim() : null,
    ].filter(Boolean);

    const rawG = Array.isArray(product.gallery) ? product.gallery : [];
    const rawI = Array.isArray(product.images) ? product.images : [];
    const normGal = [...rawG, ...rawI]
      .map((img) =>
        typeof img === "string" ? img.trim() : img?.url || img?.src || null,
      )
      .filter(Boolean);

    const merged = Array.from(new Set([...baseCandidates, ...normGal])).filter(
      Boolean,
    );

    return merged.length > 0
      ? merged
      : [
          product.image ||
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=80",
        ];
  }, [product, activeSizeObj, activeFamilyVariant]);

  if (isLoading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return (
      <main className="bg-white">
        <section className="page-shell px-4 py-20 text-center">
          <div className="mx-auto max-w-lg rounded-[24px] bg-white p-8 border border-outline">
            <span className="text-4xl">🐾</span>
            <h1 className="mt-4 text-xl font-extrabold text-secondary">
              Product Not Found
            </h1>
            <p className="mt-2 text-xs text-[#6d776f]">
              The requested product cannot be loaded.
            </p>
            <Link
              to="/shop"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
            >
              <ArrowLeft size={14} /> Back to Shop
            </Link>
          </div>
        </section>
      </main>
    );
  }
  const categoryId = getProductCategory(product);
  const categoryLabel = product.categoryName || categoryId || "Accessories";

  const originalAmt = parsePrice(product.originalPrice);
  const saleAmt = parsePrice(product.salePrice);

  // Dynamically update pricing based on selected size/multiplier
  const selectedSizeObj = sizes[activeSizeIndex];
  const hasDirectPrice = selectedSizeObj && selectedSizeObj.price !== undefined;

  const adjustedSaleAmt = hasDirectPrice
    ? parsePrice(selectedSizeObj.price)
    : Number((saleAmt * (selectedSizeObj?.multiplier ?? 1.0)).toFixed(2));

  const adjustedOriginalAmt =
    hasDirectPrice && selectedSizeObj.originalPrice !== undefined
      ? parsePrice(selectedSizeObj.originalPrice)
      : Number((originalAmt * (selectedSizeObj?.multiplier ?? 1.0)).toFixed(2));

  // Only genuine shortDescription and description without unnecessary fallbacks
  const rawShortDescription = isFamily
    ? (activeFamilyVariant?.shortDescription || selectedSizeObj?.shortDescription || product?.shortDescription || "")
    : (product?.shortDescription || selectedSizeObj?.shortDescription || "");

  const cleanShortDescription = (!rawShortDescription || isSlugLike(rawShortDescription))
    ? ""
    : rawShortDescription;

  const rawDescription = isFamily
    ? (activeFamilyVariant?.description || product?.description || "")
    : (product?.description || "");

  const cleanDescription = (!rawDescription || isSlugLike(rawDescription))
    ? ""
    : rawDescription;

  const activeStock =
    selectedSizeObj && selectedSizeObj.stock !== undefined
      ? selectedSizeObj.stock
      : product.stock;

  const productWithActiveVariant = {
    ...product,
    description: cleanDescription,
    shortDescription: cleanShortDescription,
    stock: activeStock,
    sku: selectedSizeObj?.sku || product.sku,
  };

  const displaySalePrice = `$${adjustedSaleAmt}`;
  const displayOriginalPrice = `$${adjustedOriginalAmt}`;
  const savings = Math.max(adjustedOriginalAmt - adjustedSaleAmt, 0);
  const discountPct = adjustedOriginalAmt
    ? Math.round((1 - adjustedSaleAmt / adjustedOriginalAmt) * 100)
    : 0;

  function handleAddToCart(customVariantLabel, customPrice) {
    const selectedSizeLabel = sizes[activeSizeIndex]?.label ?? "";
    const finalVariantLabel =
      typeof customVariantLabel === "string"
        ? customVariantLabel
        : selectedSizeLabel;
    const titleWithVariant = finalVariantLabel
      ? `${product.title} (${finalVariantLabel})`
      : product.title;
    const finalSalePrice =
      typeof customPrice === "string" ? customPrice : displaySalePrice;

    // Parse selected size and color
    const parts = finalVariantLabel ? finalVariantLabel.split(" / ") : [];
    let selectedSize = "";
    let selectedColor = "";
    if (parts.length === 2) {
      selectedSize = parts[0];
      selectedColor = parts[1];
    } else if (parts.length === 1) {
      const part = parts[0];
      const hasColors = product.colors && product.colors.length > 0;
      if (hasColors && product.colors.some((c) => c.name === part)) {
        selectedColor = part;
      } else {
        selectedSize = part;
      }
    }

    const itemToAdd = {
      ...productWithActiveVariant,
      productId: product.id,
      id: finalVariantLabel ? `${product.id}-${finalVariantLabel}` : product.id,
      variantId: selectedSizeObj?.id,
      variantLabel: finalVariantLabel,
      selectedOption: finalVariantLabel,
      selectedSize: selectedSizeObj?.id
        ? { id: selectedSizeObj.id, label: selectedSize || finalVariantLabel }
        : selectedSize,
      selectedColor,
      title: titleWithVariant,
      salePrice: finalSalePrice,
      originalPrice: displayOriginalPrice,
    };
    const success = onAddToCart(itemToAdd, quantity);
    if (success !== false) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  }

  function handleBuyNow(customVariantLabel, customPrice) {
    const selectedSizeLabel = sizes[activeSizeIndex]?.label ?? "";
    const finalVariantLabel =
      typeof customVariantLabel === "string"
        ? customVariantLabel
        : selectedSizeLabel;
    const titleWithVariant = finalVariantLabel
      ? `${product.title} (${finalVariantLabel})`
      : product.title;
    const finalSalePrice =
      typeof customPrice === "string" ? customPrice : displaySalePrice;

    // Parse selected size and color
    const parts = finalVariantLabel ? finalVariantLabel.split(" / ") : [];
    let selectedSize = "";
    let selectedColor = "";
    if (parts.length === 2) {
      selectedSize = parts[0];
      selectedColor = parts[1];
    } else if (parts.length === 1) {
      const part = parts[0];
      const hasColors = product.colors && product.colors.length > 0;
      if (hasColors && product.colors.some((c) => c.name === part)) {
        selectedColor = part;
      } else {
        selectedSize = part;
      }
    }

    const itemToAdd = {
      ...productWithActiveVariant,
      productId: product.id,
      id: finalVariantLabel ? `${product.id}-${finalVariantLabel}` : product.id,
      variantId: selectedSizeObj?.id,
      variantLabel: finalVariantLabel,
      selectedOption: finalVariantLabel,
      selectedSize: selectedSizeObj?.id
        ? { id: selectedSizeObj.id, label: selectedSize || finalVariantLabel }
        : selectedSize,
      selectedColor,
      title: titleWithVariant,
      salePrice: finalSalePrice,
      originalPrice: displayOriginalPrice,
    };
    sessionStorage.setItem(
      "budget_petshop_buy_now",
      JSON.stringify({ ...itemToAdd, quantity }),
    );
    showNotification("Opening checkout...", "cart", itemToAdd);
    setTimeout(() => {
      navigate("/checkout?buyNow=1");
    }, 350);
  }

  return (
    <main className="bg-white min-h-screen pb-16">
      {/* Breadcrumb Navigation & Go Back Trigger */}
      <div className="page-shell px-4 pt-8 pb-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <nav className="flex flex-wrap items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#8a8f88]">
            <Link to="/" className="transition hover:text-secondary">
              Home
            </Link>
            <span>/</span>
            <Link to="/shop" className="transition hover:text-secondary">
              Shop
            </Link>
            {isFamily && (
              <>
                <span>/</span>
                <Link to={`/shop/product/${product.id}/variants`} className="transition hover:text-secondary">
                  {product.title}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-secondary font-black truncate max-w-[200px] sm:max-w-none">
              {isFamily && activeFamilyVariant
                ? `${product.title} (${activeFamilyVariant.displayName || activeFamilyVariant.name || activeFamilyVariant.weightRange || "Selected Option"})`
                : product.title}
            </span>
          </nav>
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {isFamily ? (
              <Link
                to={`/shop/product/${product.id}/variants`}
                className="inline-flex text-secondary items-center gap-1.5 text-[14px] font-bold transition hover:underline"
              >
                ← All Formulations
              </Link>
            ) : (
              <Link
                to="/shop"
                className="inline-flex text-secondary items-center gap-1.5 text-[14px] font-bold transition"
              >
                Back to Shop
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Showcase Panel (Integrated 2-Column Grid) */}
      <section className="page-shell px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:gap-10 md:grid-cols-12 p-4 sm:p-8 lg:p-10">
          {/* Gallery (Spans 7 columns to balance portrait image) */}
          <div className="md:col-span-7 min-w-0">
            <ProductGallery
              images={galleryImages}
              productTitle={product.title}
              productTag={product.tag}
              discountPercent={discountPct}
              activeIndex={activeImageIndex}
              onSelectIndex={setActiveImageIndex}
            />
          </div>

          {/* Details & Action Panel (Spans 5 columns to give details column more breathing room) */}
          <div className="md:col-span-5 min-w-0">
            <ProductInfo
              product={productWithActiveVariant}
              categoryLabel={categoryLabel}
              discountPct={discountPct}
              displaySalePrice={displaySalePrice}
              displayOriginalPrice={displayOriginalPrice}
              savings={savings}
              sizes={sizes}
              activeSizeIndex={activeSizeIndex}
              setActiveSizeIndex={setActiveSizeIndex}
              quantity={quantity}
              setQuantity={setQuantity}
              added={added}
              handleAddToCart={handleAddToCart}
              handleBuyNow={handleBuyNow}
              wished={wished}
              setWished={handleToggleWishlist}
              saleAmt={saleAmt}
              avgRating={reviewStats.avgRating}
              totalReviews={reviewStats.totalReviews}
            />
          </div>

          {/* Trust badges section spanning full 12 columns */}
          <div className="md:col-span-12 min-w-0 mt-8 pt-8 border-t border-outline">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="group flex items-start gap-4 p-4 rounded-2xl bg-surface/50 border border-outline hover:border-secondary/40 hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-xs">
                  <CreditCard
                    size={20}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-on-background tracking-wide">
                    Secure checkout
                  </h4>
                  <p className="text-xs text-charcoal-text mt-1 font-medium leading-relaxed">
                    100% SSL encrypted payment
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 rounded-2xl bg-surface/50 border border-outline hover:border-secondary/40 hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-xs">
                  <ShieldCheck
                    size={20}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-on-background tracking-wide">
                    Genuine Items
                  </h4>
                  <p className="text-xs text-charcoal-text mt-1 font-medium leading-relaxed">
                    100% certified authentic
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 rounded-2xl bg-surface/50 border border-outline hover:border-secondary/40 hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-xs">
                  <Heart
                    size={20}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-on-background tracking-wide">
                    Vet Approved
                  </h4>
                  <p className="text-xs text-charcoal-text mt-1 font-medium leading-relaxed">
                    100% safe & non-toxic materials
                  </p>
                </div>
              </div>

              <div className="group flex items-start gap-4 p-4 rounded-2xl bg-surface/50 border border-outline hover:border-secondary/40 hover:bg-surface hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-all duration-300 shadow-xs">
                  <Headphones
                    size={20}
                    className="group-hover:scale-110  transition-transform duration-300"
                  />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-on-background tracking-wide">
                    24/7 Support
                  </h4>
                  <p className="text-xs text-charcoal-text mt-1 font-medium leading-relaxed">
                    Expert pet care advice anytime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ProductTabs
          product={productWithActiveVariant}
          activeFamilyVariant={activeFamilyVariant}
          selectedOption={sizes[activeSizeIndex]?.label || ""}
          onSelectOption={(optionLabel) => {
            const foundIdx = sizes.findIndex(
              (s) =>
                String(s.label || s.name || s.id).toLowerCase() ===
                  String(optionLabel).toLowerCase() ||
                String(s.label || s.name || s.id)
                  .toLowerCase()
                  .includes(String(optionLabel).toLowerCase()),
            );
            if (foundIdx !== -1) {
              setActiveSizeIndex(foundIdx);
            }
          }}
        />
      </section>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <section className="page-shell px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-extrabold mt-1">Related Products</h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-black text-[#8a72c7] hover:underline uppercase tracking-wider"
            >
              See all
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((rel) => (
              <ShopProductCard
                key={rel.id}
                product={rel}
                onAddToCart={onAddToCart}
                isWished={wishlistIds.includes(rel.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ProductDetailsPage({
  onAddToCart,
  wishlistIds = [],
  onToggleWishlist,
}) {
  const { productId } = useParams();

  return (
    <ProductDetailsContent
      key={productId}
      productId={productId}
      onAddToCart={onAddToCart}
      wishlistIds={wishlistIds}
      onToggleWishlist={onToggleWishlist}
    />
  );
}

export default ProductDetailsPage;
