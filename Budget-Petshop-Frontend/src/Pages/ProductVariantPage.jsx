import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Check,
  ShieldCheck,
  ShoppingCart,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Heart,
  Package,
  Plus,
  Minus,
  Eye,
} from "lucide-react";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { parsePrice } from "../utils/cart";
import { useNotification } from "../utils/NotificationContext";
import { useAuth } from "../utils/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
} from "../utils/productUtils";
import ProductTabs from "../components/ProductDetails/ProductTabs";

function getColorHex(colorName, fallback = "#8a72c7") {
  if (!colorName) return fallback;
  const map = {
    purple: "#8a72c7",
    yellow: "#eab308",
    teal: "#0d9488",
    blue: "#2563eb",
    red: "#dc2626",
    green: "#16a34a",
    orange: "#ea580c",
    pink: "#db2777",
    brown: "#854d0e",
    gold: "#d97706",
  };
  const lower = String(colorName).toLowerCase().trim();
  return map[lower] || (lower.startsWith("#") ? lower : fallback);
}

export default function ProductVariantPage({
  onAddToCart,
  wishlistIds = [],
  onToggleWishlist,
}) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewStats, setReviewStats] = useState({
    avgRating: 4.7,
    totalReviews: 2061,
  });
  const [quantities, setQuantities] = useState({});
  const [addingState, setAddingState] = useState({});

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setProduct(null);

    // Fetch review stats
    reviewApi
      .getProductReviews(productId)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        if (list.length > 0) {
          const total = list.length;
          const avg = (
            list.reduce(
              (s, r) => s + Number(r.rating ?? r.star ?? r.stars ?? 0),
              0,
            ) / total
          ).toFixed(1);
          setReviewStats({ avgRating: avg, totalReviews: total });
        }
      })
      .catch(() => {});

    // Fetch product
    productApi
      .getProductById(productId)
      .then((apiProduct) => {
        if (!isMounted) return;
        setProduct(apiProduct);
      })
      .catch((error) => {
        console.error("Failed to load product for variant page:", error);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Safety Guard: if product is loaded and is a SIMPLE product (not FAMILY), redirect directly to product details!
  useEffect(() => {
    if (product && !isLoading) {
      if (!isFamilyProduct(product)) {
        navigate(`/shop/product/${product.id || productId}`, { replace: true });
      }
    }
  }, [product, isLoading, navigate, productId]);

  // Reliable main product image with fallbacks
  const mainProductImage = useMemo(() => {
    if (!product) return "";
    return (
      (typeof product.image === "string" && product.image.trim()) ||
      product.image?.url ||
      product.image?.src ||
      product.imageUrl ||
      (Array.isArray(product.images) && product.images[0]
        ? typeof product.images[0] === "string"
          ? product.images[0]
          : product.images[0]?.url || product.images[0]?.src
        : null) ||
      (Array.isArray(product.gallery) && product.gallery[0]
        ? typeof product.gallery[0] === "string"
          ? product.gallery[0]
          : product.gallery[0]?.url || product.gallery[0]?.src
        : null) ||
      ""
    );
  }, [product]);

  // Build variant groups matching clean style
  const variantGroups = useMemo(() => {
    if (!product) return [];

    const baseSalePrice = parsePrice(product.salePrice) || 29.99;
    const baseOriginalPrice =
      parsePrice(product.originalPrice) ||
      Number((baseSalePrice * 1.35).toFixed(2));

    // Case 0: Backend explicit familyVariants
    if (product.familyVariants && product.familyVariants.length > 0) {
      return product.familyVariants.map((fVar, fIdx) => {
        const fName = fVar.displayName || fVar.name || `Variant ${fIdx + 1}`;
        const prodTitle = product.name || product.title || "";
        let cleanFName = fName;
        if (prodTitle) {
          cleanFName = cleanFName.replace(
            new RegExp(
              `^${prodTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
              "i",
            ),
            "",
          );
          cleanFName = cleanFName.replace(
            new RegExp(
              `\\(${prodTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
              "gi",
            ),
            "",
          );
        }
        cleanFName = cleanFName.trim() || fName;
        const groupTitle = cleanFName;

        const validFImg =
          (typeof fVar.mainImage === "string" && fVar.mainImage.trim()) ||
          fVar.mainImage?.url ||
          fVar.mainImage?.src ||
          (typeof fVar.image === "string" && fVar.image.trim()) ||
          fVar.image?.url ||
          fVar.image?.src ||
          fVar.imageUrl ||
          (Array.isArray(fVar.gallery) && fVar.gallery[0]
            ? typeof fVar.gallery[0] === "string"
              ? fVar.gallery[0]
              : fVar.gallery[0]?.url
            : null) ||
          (Array.isArray(fVar.images) && fVar.images[0]
            ? typeof fVar.images[0] === "string"
              ? fVar.images[0]
              : fVar.images[0]?.url
            : null) ||
          null;

        const variantImage =
          validFImg ||
          product.gallery?.[fIdx] ||
          product.images?.[fIdx % (product.images?.length || 1)] ||
          product.image;

        let skus =
          Array.isArray(fVar.skus) && fVar.skus.length > 0 ? fVar.skus : [];
        if (skus.length === 0 && Array.isArray(product.optionVariants)) {
          skus = product.optionVariants.filter((ov) => {
            if (!ov) return false;
            const ovFId = String(ov.familyVariantId || ov.familyId || "");
            const fvId = String(fVar.id || "");
            if (fvId && ovFId && fvId === ovFId) return true;
            if (
              ov.familyVariantSlug &&
              fVar.slug &&
              ov.familyVariantSlug === fVar.slug
            )
              return true;
            const ovLabel = String(ov.label || ov.name || "").toLowerCase();
            const fvLower = cleanFName.toLowerCase();
            if (fvLower && ovLabel.includes(fvLower)) return true;
            if (
              fVar.packColor &&
              ovLabel.includes(String(fVar.packColor).toLowerCase())
            )
              return true;
            if (
              fVar.weightRange &&
              ovLabel.includes(String(fVar.weightRange).toLowerCase())
            )
              return true;
            return false;
          });
        }

        // Resilient fallback: ensure at least one pack option is always available
        if (skus.length === 0) {
          skus = [
            {
              id: fVar.id || `fvar-${fIdx}`,
              packLabel: fVar.weightRange || fVar.packColor || "Standard Pack",
              price:
                fVar.pricing?.finalPrice ??
                fVar.price ??
                fVar.salePrice ??
                baseSalePrice,
              regularPrice:
                fVar.pricing?.price ??
                fVar.regularPrice ??
                fVar.price ??
                baseOriginalPrice,
              stock: fVar.stock ?? 50,
              sku: fVar.sku || product.sku,
            },
          ];
        }

        const rows = skus.map((s, sIdx) => {
          const unitSale = Number(
            s.pricing?.finalPrice ??
              s.pricing?.salePrice ??
              s.salePrice ??
              s.price ??
              baseSalePrice,
          );
          const unitReg = Number(
            s.pricing?.price ??
              s.regularPrice ??
              s.oldPrice ??
              (unitSale * 1.35).toFixed(2),
          );

          let packLabel =
            s.packLabel || s.dose || s.size || s.label || `Pack ${sIdx + 1}`;
          if (prodTitle) {
            packLabel = packLabel.replace(
              new RegExp(
                `^${prodTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
                "i",
              ),
              "",
            );
          }
          if (cleanFName) {
            packLabel = packLabel.replace(
              new RegExp(
                `^${cleanFName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
                "i",
              ),
              "",
            );
          }
          if (fVar.weightRange) {
            packLabel = packLabel.replace(
              new RegExp(
                `^${fVar.weightRange.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
                "i",
              ),
              "",
            );
          }
          packLabel =
            packLabel.replace(/^[\s/–—-]+/, "").trim() || `Pack ${sIdx + 1}`;
          if (/^\d+$/.test(packLabel)) {
            packLabel = `${packLabel} Pack`;
          }
          const fullLabel = `${cleanFName} - ${packLabel}`.trim();

          return {
            key: String(s.id || `${fVar.id}-sku-${sIdx}`),
            variantId: s.id || fVar.id,
            pack: packLabel,
            label: fullLabel,
            image: variantImage,
            regularPrice: unitReg.toFixed(2),
            salePrice: unitSale.toFixed(2),
            stock:
              s.inventory?.stockQuantity ?? s.stock ?? (product.stock || 50),
            sku: s.sku || product.sku,
          };
        });

        const colorHex = fVar.packColorHex || getColorHex(fVar.packColor);

        return {
          id: String(fVar.id || `grp-fam-${fIdx}`),
          cleanTitle: cleanFName,
          groupTitle,
          color: fVar.packColor || null,
          colorHex,
          weightRange: fVar.weightRange || null,
          image: variantImage,
          rows,
        };
      });
    }

    // Case 1: Product already has explicit optionVariants from backend
    if (product.optionVariants && product.optionVariants.length > 0) {
      const items = product.optionVariants;
      const groupsMap = {};

      items.forEach((v, index) => {
        const label = v.label || `Option ${index + 1}`;
        let groupTitle = `${product.title}`;
        let packLabel = label;

        if (label.includes(" - ")) {
          const parts = label.split(" - ");
          groupTitle = `${product.title} ${parts[0]}`;
          packLabel = parts.slice(1).join(" - ");
        } else if (label.includes(" / ")) {
          const parts = label.split(" / ");
          groupTitle = `${product.title} (${parts[0]})`;
          packLabel = parts[1];
        }

        if (/^\d+$/.test(packLabel.trim())) {
          packLabel = `${packLabel.trim()} Pack`;
        }

        if (!groupsMap[groupTitle]) {
          groupsMap[groupTitle] = {
            id: `grp-${index}`,
            groupTitle,
            cleanTitle:
              groupTitle.replace(product.title, "").trim() || groupTitle,
            image:
              v.image ||
              product.images?.[index % product.images.length] ||
              product.image,
            rows: [],
          };
        }

        const unitSalePrice =
          v.pricing?.finalPrice ?? v.price ?? v.salePrice ?? baseSalePrice;
        const unitRegPrice =
          v.pricing?.price ?? v.regularPrice ?? v.mrp ?? unitSalePrice * 1.35;

        groupsMap[groupTitle].rows.push({
          key: String(v.id || `${productId}-opt-${index}`),
          variantId: v.id,
          pack: packLabel,
          label: v.label,
          regularPrice: Number(unitRegPrice).toFixed(2),
          salePrice: Number(unitSalePrice).toFixed(2),
          stock: v.stock ?? v.inventory?.stockQuantity ?? (product.stock || 50),
          sku: v.sku || product.sku,
        });
      });

      return Object.values(groupsMap);
    }

    // Case 2: Product has sizes / capacities / colors
    if (product.sizes && product.sizes.length > 1) {
      const rows = product.sizes.map((s, idx) => {
        const multiplier = s.multiplier ?? 1.0;
        const rowSale =
          s.price !== undefined
            ? parsePrice(s.price)
            : Number((baseSalePrice * multiplier).toFixed(2));
        const rowReg =
          s.originalPrice !== undefined
            ? parsePrice(s.originalPrice)
            : Number((baseOriginalPrice * multiplier).toFixed(2));

        let packLabel = s.label || `Pack ${idx + 1}`;
        if (/^\d+$/.test(packLabel.trim())) {
          packLabel = `${packLabel.trim()} Pack`;
        }

        return {
          key: String(s.id || `${productId}-size-${idx}`),
          variantId: s.id,
          pack: packLabel,
          label: s.label,
          regularPrice: Number(rowReg).toFixed(2),
          salePrice: Number(rowSale).toFixed(2),
          stock: s.stock ?? (product.stock || 50),
          sku: s.sku || product.sku,
        };
      });

      return [
        {
          id: "grp-sizes",
          groupTitle: `${product.title} - Available Options`,
          cleanTitle: "Available Pack Options",
          image: product.image,
          rows,
        },
      ];
    }

    // Default Fallback
    const packMultiplier = [
      { label: "3 Doses", mult: 1.0, regMult: 1.4 },
      { label: "6 Doses", mult: 1.92, regMult: 2.7 },
      { label: "12 Doses", mult: 3.75, regMult: 5.3 },
    ];

    return [
      {
        id: "grp-treatment-default",
        groupTitle: `${product.title} Pack Selection`,
        cleanTitle: "Standard Formulations",
        image: product.image,
        rows: packMultiplier.map((pm, idx) => ({
          key: `${productId}-pack-${idx}`,
          variantId: `${productId}-pack-${idx}`,
          pack: pm.label,
          label: pm.label,
          regularPrice: Number(baseSalePrice * pm.regMult).toFixed(2),
          salePrice: Number(baseSalePrice * pm.mult).toFixed(2),
          stock: product.stock || 50,
          sku: `${product.sku || "MED"}-${pm.label.replace(/\s+/g, "").toUpperCase()}`,
        })),
      },
    ];
  }, [product, productId]);

  const handleStepQuantity = (variantKey, delta, maxStock = 99) => {
    const current = quantities[variantKey] || 1;
    const limit =
      Number.isFinite(Number(maxStock)) && Number(maxStock) > 0
        ? Number(maxStock)
        : 99;
    const nextVal = Math.max(1, Math.min(limit, current + delta));
    setQuantities((prev) => ({ ...prev, [variantKey]: nextVal }));
  };

  const handleAddVariantToCart = (group, row) => {
    if (!product) return;

    // Check vet lock
    const requiresVet = isVetOnly(product);
    const userLacksVet = lacksVetAccess(product, user);
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    const qty = quantities[row.key] || 1;
    const variantLabel = row.label || row.pack;
    const titleWithVariant = `${product.title} (${variantLabel})`;

    const itemToAdd = {
      ...product,
      productId: product.id,
      id: `${product.id}-${row.key}`,
      variantId: row.variantId,
      variantLabel,
      selectedOption: variantLabel,
      title: titleWithVariant,
      salePrice: `$${row.salePrice}`,
      originalPrice: `$${row.regularPrice}`,
      stock: row.stock,
      image: group.image || product.image,
    };

    const success = onAddToCart(itemToAdd, qty);
    if (success !== false) {
      setAddingState((prev) => ({ ...prev, [row.key]: true }));
      setTimeout(() => {
        setAddingState((prev) => ({ ...prev, [row.key]: false }));
      }, 1400);
    }
  };

  if (isLoading) {
    return (
      <main className="bg-white min-h-[70vh] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
          <p className="text-sm font-semibold text-charcoal-text">
            Loading variant options...
          </p>
        </div>
      </main>
    );
  }

  if (product && !isFamilyProduct(product)) {
    return (
      <main className="bg-white min-h-[70vh] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
          <p className="text-sm font-semibold text-charcoal-text">
            Redirecting to product details...
          </p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-white py-20 px-4 text-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl border border-outline bg-surface">
          <span className="text-5xl">🐾</span>
          <h1 className="mt-4 text-xl font-extrabold text-on-background">
            Product Not Found
          </h1>
          <p className="mt-2 text-xs text-charcoal-text">
            The requested product variant options could not be retrieved.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-xs font-extrabold text-white transition hover:opacity-90"
          >
            <ArrowLeft size={14} /> Return to Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7f0] pb-20">
      {/* Sleek Breadcrumbs Bar */}
      <div className="border-b border-[#e7ddd0] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="page-shell px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
          <nav className="flex items-center gap-2 font-semibold text-charcoal-text">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight size={13} className="text-outline-strong" />
            <Link to="/shop" className="hover:text-primary transition-colors">
              Shop
            </Link>
            {product.categoryName && (
              <>
                <ChevronRight size={13} className="text-outline-strong" />
                <span className="text-charcoal-text">
                  {product.categoryName}
                </span>
              </>
            )}
            <ChevronRight size={13} className="text-outline-strong" />
            <span className="text-primary font-bold truncate max-w-[200px] sm:max-w-md">
              {product.title}
            </span>
          </nav>
        </div>
      </div>

      <div className="page-shell px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Modern Professional Product Hero Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e7ddd0] shadow-[0_4px_25px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Left: Image & Product Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7 flex-1 min-w-0">
            {/* Main Product Image Card (No redirect on click) */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 rounded-2xl bg-[#FAF9F5] border border-[#e7ddd0] p-3 flex items-center justify-center overflow-hidden shadow-2xs relative select-none">
              {mainProductImage || variantGroups[0]?.image ? (
                <img
                  src={mainProductImage || variantGroups[0]?.image}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-charcoal-text/40">
                  <Package size={36} className="text-secondary/40" />
                  <span className="text-[11px] font-bold mt-1">Product</span>
                </div>
              )}
            </div>

            {/* Product Details & Meta */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2"></div>

              {/* Product Title (No link / No redirect) */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-on-background tracking-tight leading-tight">
                {product.title}
              </h1>

              {/* Rating & Stock Social Proof */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs"></div>

              {/* Formulations Count Badge */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-0.5">
                <span className="text-xs sm:text-sm font-black text-secondary bg-secondary/10 border border-secondary/20 px-3.5 py-1 rounded-full shadow-2xs">
                  {variantGroups.length} Variant Formulation
                  {variantGroups.length > 1 ? "s" : ""} Available
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clean Trust & Benefits Highlights (Balances empty right space) */}
          <div className="w-full lg:w-auto flex flex-row lg:flex-col justify-center sm:justify-start lg:justify-center flex-wrap gap-2.5 p-4 rounded-2xl bg-[#FAF8F5] border border-[#e7ddd0] shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-on-background">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={13} />
              </span>
              <span>100% Genuine Pet Treatments</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-on-background">
              <span className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Package size={13} />
              </span>
              <span>Fast Tracked Dispatch</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-on-background">
              <span className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <Sparkles size={13} />
              </span>
              <span>Manufacturer Sealed Fresh</span>
            </div>
          </div>
        </div>

        {/* Two-Column Formulations Grid (e.g. Left Medium, Right Large) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {variantGroups.map((group) => {
            const groupWishlistId = `${product.id}__${group.id}`;
            const isGroupWishlisted = wishlistIds.includes(groupWishlistId);
            const cardAccentColor = group.colorHex || "#8a72c7";

            return (
              <section
                key={group.id}
                className="bg-white rounded-2xl border border-[#e7ddd0] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] flex flex-col h-full"
              >
                {/* Dynamic Color Accent Top Bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: cardAccentColor }}
                />

                {/* Formulation Card Header */}
                <div className="bg-[#fbf9f6] px-4 py-3.5 sm:px-5 border-b border-[#eee4d6] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Formulation Thumbnail with Eye Icon on Hover */}
                    <Link
                      to={`/shop/product/${product.id}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.id)}`}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-white border border-[#e7ddd0] p-1.5 flex items-center justify-center overflow-hidden group/img cursor-pointer shadow-2xs hover:shadow-md hover:border-secondary transition-all"
                      title="View product details"
                    >
                      <img
                        src={group.image || product.image}
                        alt={group.cleanTitle || group.groupTitle}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover/img:scale-110"
                        loading="lazy"
                      />
                      {/* Hover Overlay with Eye Icon */}
                      <div className="absolute inset-0 bg-secondary/75 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-200">
                        <Eye size={24} className="text-white drop-shadow-md transition-transform duration-200 scale-75 group-hover/img:scale-100" />
                      </div>
                    </Link>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <h2 className="text-base sm:text-lg font-black text-on-background">
                          <Link
                            to={`/shop/product/${product.id}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.id)}`}
                            className="hover:text-secondary transition-colors"
                            title="View product details"
                          >
                            {group.cleanTitle || group.groupTitle}
                          </Link>
                        </h2>
                        {group.weightRange && (
                          <span className="text-[11px] font-bold text-on-background bg-white border border-[#e0d6c8] px-2.5 py-0.5 rounded-full shadow-2xs">
                            {group.weightRange}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-secondary bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 rounded-full">
                        {group.rows.length} Pack Option
                        {group.rows.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Wishlist Heart Toggle */}
                  {onToggleWishlist && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleWishlist({
                          ...product,
                          id: groupWishlistId,
                          baseProductId: product.id,
                          productId: product.id,
                          title: `${product.title} (${group.groupTitle})`,
                          image: group.image || product.image,
                        })
                      }
                      className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 ${
                        isGroupWishlisted
                          ? "bg-secondary text-white shadow-xs scale-105"
                          : "bg-white text-charcoal-text border border-[#e0d6c8] hover:border-secondary hover:text-secondary shadow-2xs"
                      }`}
                      title={`Save ${group.groupTitle} to wishlist`}
                      aria-label="Save variant to wishlist"
                    >
                      <Heart
                        size={14}
                        className={
                          isGroupWishlisted ? "fill-white text-white" : ""
                        }
                      />
                    </button>
                  )}
                </div>

                {/* Formulation Body: Exact Table Layout matching User Design */}
                <div className="p-4 sm:p-5 flex-1 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[320px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-[#122a50] text-xs sm:text-sm font-bold">
                        <th className="pb-2.5 font-bold">Pack</th>
                        <th className="pb-2.5 font-bold text-center">QTY</th>
                        <th className="pb-2.5 font-bold">Price</th>
                        <th className="pb-2.5 font-bold">You Pay</th>
                        <th className="pb-2.5 text-right font-bold sr-only">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/80">
                      {group.rows.map((row) => {
                        const isRowOutOfStock = row.stock === 0;
                        const currentQty = quantities[row.key] || 1;
                        const isAdding = addingState[row.key];
                        const stockLimit =
                          Number.isFinite(Number(row.stock)) &&
                          Number(row.stock) > 0
                            ? Math.min(row.stock, 10)
                            : 10;

                        return (
                          <tr
                            key={row.key}
                            className="hover:bg-[#fbf9f6] transition-colors"
                          >
                            {/* Pack Name */}
                            <td className="py-3.5 pr-2 align-middle">
                              <span className="font-bold text-[#122a50] text-sm sm:text-base block">
                                {row.pack}
                              </span>
                              {/* {row.sku && (
                                <span className="block text-[10px] text-charcoal-text/50 font-semibold uppercase tracking-wider">
                                  SKU: {row.sku}
                                </span>
                              )} */}
                            </td>

                            {/* QTY Increment/Decrement Stepper */}
                            <td className="py-3.5 px-2 text-center align-middle">
                              <div className="inline-flex items-center h-8 sm:h-9 rounded-xl border border-[#dcd1c2] bg-white px-1 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStepQuantity(row.key, -1, row.stock)
                                  }
                                  disabled={isRowOutOfStock || currentQty <= 1}
                                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-charcoal-text hover:bg-[#f4efe6] hover:text-on-background transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={12} className="stroke-[2.5]" />
                                </button>
                                <span className="w-6 sm:w-7 text-center text-xs font-black text-on-background select-none">
                                  {isRowOutOfStock ? 0 : currentQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStepQuantity(row.key, 1, row.stock)
                                  }
                                  disabled={
                                    isRowOutOfStock || currentQty >= stockLimit
                                  }
                                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-charcoal-text hover:bg-[#f4efe6] hover:text-on-background transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={12} className="stroke-[2.5]" />
                                </button>
                              </div>
                            </td>

                            {/* Regular Price (Strike-through) */}
                            <td className="py-3.5 px-2 align-middle">
                              {row.regularPrice ? (
                                <span className="text-sm font-medium text-slate-400 line-through">
                                  ${row.regularPrice}
                                </span>
                              ) : (
                                <span className="text-sm text-slate-300">
                                  -
                                </span>
                              )}
                            </td>

                            {/* You Pay (Golden / Amber Bold Price) */}
                            <td className="py-3.5 px-2 align-middle">
                              <span className="text-base sm:text-lg font-black text-[#d97706] whitespace-nowrap">
                                ${row.salePrice}
                              </span>
                            </td>

                            {/* Add Button with Theme Color */}
                            <td className="py-3.5 pl-2 text-right align-middle">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAddVariantToCart(group, row)
                                }
                                disabled={isRowOutOfStock || isAdding}
                                className={`px-4 sm:px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shadow-xs active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5 ml-auto ${
                                  isRowOutOfStock
                                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                                    : isAdding
                                      ? "bg-emerald-600 text-white shadow-sm scale-95"
                                      : "bg-secondary hover:bg-[#7861b5] text-white shadow-xs hover:shadow-md"
                                }`}
                              >
                                {isRowOutOfStock ? (
                                  "Sold Out"
                                ) : isAdding ? (
                                  <span className="flex items-center gap-1">
                                    <Check size={13} className="stroke-[3]" />{" "}
                                    Added
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <ShoppingCart size={13} /> Add
                                  </span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

        {/* ── PRODUCT CONTENT & SPECIFICATIONS ── */}
        <ProductTabs product={product} />
      </div>
    </main>
  );
}
