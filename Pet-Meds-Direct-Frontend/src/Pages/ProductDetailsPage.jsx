import { useState, useEffect, useMemo } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Heart,
  Share2,
  ShoppingCart,
  ChevronRight,
  Plus,
  Minus,
  Star,
  ArrowLeft,
  Check,
  ShieldCheck,
  AlertCircle,
  Info,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Package,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  getProductByIdApi,
  getProductsApi,
  transformProduct,
  reviewApi,
  getProductVariantApi,
} from "../helper/axiosInstance";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
  getProductUrl,
} from "../utils/productUtils";
import { formatProductRichContent } from "../utils/htmlUtils";
import { showToast } from "../components/common/toast/ToastHelper";
import ProductCard from "../components/products/ProductCard";

function getVariantStockCount(variant) {
  if (!variant) return 0;
  const inventory = variant.inventory || {};
  const stockValue =
    inventory.stockQuantity ??
    inventory.availableQuantity ??
    inventory.availableStock ??
    inventory.quantity ??
    inventory.stock ??
    variant.stockQuantity ??
    variant.availableStock ??
    variant.quantityAvailable ??
    variant.quantity ??
    variant.stock ??
    variant.stockCount;
  return stockValue === undefined || stockValue === null
    ? 0
    : Math.max(0, Number(stockValue) || 0);
}

function isVariantInStock(variant) {
  if (!variant) return false;
  const stockCount = getVariantStockCount(variant);
  if (stockCount > 0) return true;
  return Boolean(
    variant.inventory?.isInStock === true ||
    variant.isInStock === true ||
    variant.available === true,
  );
}

function splitSizeAndPackLabel(label) {
  const value = String(label || "").trim();
  const plusParts = value
    .split(/\s*\+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const trailingPack = value.match(
    /^(.*?[A-Za-z])[\s-]*(\d+(?:\s*(?:tablets?|doses?|capsules?|packs?|chews?|count|ct))?)$/i,
  );
  const parts =
    plusParts.length > 1
      ? plusParts
      : trailingPack
        ? [trailingPack[1].trim(), trailingPack[2].trim()]
        : [value];

  return {
    size: parts[0] || value,
    pack: parts.slice(1).join(" + "),
  };
}

function getVariantSizeAndPack(variant) {
  const explicitSize =
    variant?.sizeLabel || variant?.weightRange || variant?.weight || variant?.size;
  const explicitPack =
    variant?.packOnlyLabel ||
    variant?.packLabel ||
    variant?.packSize ||
    variant?.packSizeLabel ||
    variant?.doseLabel ||
    variant?.dose ||
    variant?.doses;
  const label =
    explicitSize && explicitPack
      ? `${explicitSize} + ${explicitPack}`
      : variant?.displayLabel || variant?.label || variant?.name || explicitPack;
  return splitSizeAndPackLabel(label);
}

function getCleanOptionLabel(option, activeFamilyVariant, product) {
  if (!option) return "";

  const explicitPack =
    option.packOnlyLabel ||
    option.packLabel ||
    option.packSize ||
    option.packSizeLabel ||
    option.doseLabel ||
    option.dose ||
    option.doses ||
    null;

  if (explicitPack && !String(explicitPack).includes("/")) {
    return String(explicitPack).trim();
  }

  let label = String(option.displayLabel || option.label || option.name || "").trim();
  if (!label) return explicitPack || "Standard";

  // 1. If label contains " / " or "/", take the part after the slash
  if (label.includes(" / ")) {
    const parts = label.split(" / ");
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart) return lastPart;
  } else if (label.includes("/")) {
    const parts = label.split("/");
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart) return lastPart;
  }

  // 2. Strip active family variant name / title / weight
  const fvName = activeFamilyVariant?.name || activeFamilyVariant?.displayName || "";
  if (fvName) {
    label = label.replace(new RegExp(`^${fvName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
    label = label.replace(new RegExp(`\\(${fvName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "gi"), "");
  }

  const pName = (product?.name || product?.title || "").trim();
  if (pName) {
    label = label.replace(new RegExp(`^${pName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
  }

  const weightRange = activeFamilyVariant?.weightRange || "";
  if (weightRange) {
    label = label.replace(new RegExp(`^${weightRange.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
  }

  label = label.replace(/^[\s/–—:-]+/, "").trim();
  label = label.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2");
  const rawFinal = label || explicitPack || option.label || "Standard";
  return String(rawFinal).replace(/(\d+)([a-zA-Z]+)/g, "$1 $2").trim();
}

function extractWeightRange(name) {
  if (!name || typeof name !== "string") return "";
  const match =
    name.match(/(?:[-–—:]\s*)?(\d+(?:\.\d+)?\s*(?:-|to)\s*\d+(?:\.\d+)?\s*(?:lbs?|kg|pounds?))/i) ||
    name.match(/(?:[-–—:]\s*)?((?:up to|over)\s*\d+(?:\.\d+)?\s*(?:lbs?|kg|pounds?))/i);
  return match ? match[1].trim() : "";
}

function getBaseFamilyKey(name) {
  if (!name || typeof name !== "string") return "";
  let clean = name.trim();
  // If title has " for ", the base family/brand is before " for " (e.g. "Revolution for Kittens" -> "revolution")
  const forMatch = clean.match(/^(.*?)\s+for\s+/i);
  if (forMatch && forMatch[1].trim().length >= 3) {
    return forMatch[1].trim().toLowerCase();
  }
  // Otherwise strip weight bracket suffixes: - 0-5 lbs, 0-5lbs, - 5-15 lbs, (0-5 lbs), etc.
  clean = clean.replace(/\s*[-–—:]\s*\d+(\.\d+)?\s*(-|to)\s*\d+(\.\d+)?\s*(lbs?|kg|pounds?).*$/i, "");
  clean = clean.replace(/\s*\(\s*\d+(\.\d+)?\s*(-|to)\s*\d+(\.\d+)?\s*(lbs?|kg|pounds?).*\)$/i, "");
  clean = clean.replace(/\s*[-–—:]\s*(up to|over)\s*\d+(\.\d+)?\s*(lbs?|kg|pounds?).*$/i, "");
  clean = clean.replace(/\s*[-–—/]\s*\d+\s*(doses?|packs?|chews?|tablets?|pipettes?).*$/i, "");
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return words.slice(0, Math.min(2, words.length)).join(" ").toLowerCase();
  }
  return clean.toLowerCase();
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFamilyVariantId = searchParams.get("familyVariantId");
  const queryVariantId =
    searchParams.get("variantId") || searchParams.get("variant");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState(null);
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);
  const [allProductsList, setAllProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getProductByIdApi(id)
      .then((res) => {
        if (!active) return;
        const mappedProduct = transformProduct(res.data);
        setProduct(mappedProduct);
        return getProductsApi({ limit: 100 });
      })
      .then((res) => {
        if (active && res) {
          const items = (res.data?.items || []).map(transformProduct);
          setAllProductsList(items);
        }
      })
      .catch((err) => {
        console.error("Error loading product details:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Find the current product

  const [productReviews, setProductReviews] = useState([]);

  // Component States
  const [activeImage, setActiveImage] = useState("");
  const [activeImageId, setActiveImageId] = useState("main");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantDetails, setVariantDetails] = useState(null);
  const [loadingVariant, setLoadingVariant] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isExpanded, setIsExpanded] = useState(false);
  const [thumbStartIndex, setThumbStartIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      if (!id) return;
      try {
        const apiRes = await reviewApi.getProductReviews(id);
        const reviewItems = Array.isArray(apiRes) ? apiRes : apiRes?.data || [];
        const apiReviews = reviewItems.map((rev, idx) => ({
          id: rev.id || rev._id || `api-rev-${idx}`,
          reviewerName:
            rev.reviewerName ||
            rev.user?.name ||
            rev.userName ||
            "Verified Customer",
          rating: Number(rev.rating) || 5,
          description: rev.comment || rev.description || "",
          date:
            rev.createdAt || rev.date
              ? new Date(rev.createdAt || rev.date).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  },
                )
              : "Recently",
        }));

        if (isMounted) {
          setProductReviews(apiReviews);
        }
      } catch (apiErr) {
        console.warn("Error fetching product reviews from API:", apiErr);
        if (isMounted) {
          setProductReviews([]);
        }
      }
    }

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Reset states when product changes
  useEffect(() => {
    if (product) {
      setActiveImage(product.image);
      setActiveImageId(
        product.gallery && product.gallery.length > 0 ? "gallery-0" : "main",
      );
      setQuantity(1);
      setIsExpanded(false);
      setThumbStartIndex(0);

      // Default option/variant selection
      if (product.optionVariants && product.optionVariants.length > 0) {
        setSelectedVariant(product.optionVariants[0]);
      } else {
        setSelectedVariant(null);
        setVariantDetails(null);
      }

      if (product.colorVariants && product.colorVariants.length > 0) {
        setSelectedColor(product.colorVariants[0].name);
      } else {
        setSelectedColor("");
      }

      // Default size and color recommendations
      const defaultSizes =
        product.category.includes("Prevention") ||
        product.category.includes("Refills")
          ? "6 Chews"
          : "Medium Pack";
      setSelectedSize(defaultSizes);
    }
  }, [product]);

  // Fetch deep variant details from backend variant API whenever selectedVariant changes
  useEffect(() => {
    if (!selectedVariant || !product) {
      setVariantDetails(null);
      return;
    }

    if (selectedVariant.image) {
      setActiveImage(selectedVariant.image);
      setActiveImageId("variant-0");
      setThumbStartIndex(0);
    }
  }, [selectedVariant]);

  // Unified Formulation Variants (Direct Family Variants + Sibling Products from Catalog)
  const formulationVariants = useMemo(() => {
    if (!product) return [];

    const directFamilyVariants = Array.isArray(product.familyVariants)
      ? product.familyVariants
      : [];

    // Check catalog for sibling products sharing the same base brand/family
    const baseKey = getBaseFamilyKey(product.name);
    const prodCategory = (product.category || "").toLowerCase();
    const prodCompanion = Array.isArray(product.petCompanion)
      ? product.petCompanion
      : [];

    const siblingProducts = (allProductsList || []).filter((p) => {
      if (!p || p.id === product.id) return false;

      // 1. Direct parent/base match
      if (
        product.baseProductId &&
        p.baseProductId &&
        String(product.baseProductId) === String(p.baseProductId)
      ) {
        return true;
      }

      // 2. Base family key match (e.g. both "revolution")
      const pKey = getBaseFamilyKey(p.name);
      if (
        baseKey &&
        pKey &&
        (baseKey === pKey || pKey.startsWith(baseKey) || baseKey.startsWith(pKey))
      ) {
        const pCat = (p.category || "").toLowerCase();
        const pComp = Array.isArray(p.petCompanion) ? p.petCompanion : [];
        const matchesCompanion =
          prodCompanion.length === 0 ||
          pComp.length === 0 ||
          prodCompanion.some((c) => pComp.includes(c));
        const matchesCategory =
          !prodCategory ||
          !pCat ||
          prodCategory === pCat ||
          prodCategory.includes(pCat) ||
          pCat.includes(prodCategory);

        if (matchesCompanion || matchesCategory) {
          return true;
        }
      }
      return false;
    });

    // If product has direct family variants with > 1 item, use them as primary
    if (directFamilyVariants.length > 1) {
      return directFamilyVariants.map((fv) => ({
        ...fv,
        isSiblingProduct: false,
      }));
    }

    // If direct family variants is 0 or 1, and sibling products exist in catalog:
    if (siblingProducts.length > 0) {
      const currentEntry = {
        id: product.id,
        slug: product.slug || product.id,
        name: product.name,
        displayName: product.name,
        weightRange: product.weightRange || extractWeightRange(product.name),
        image: product.image,
        packColorHex: product.colorHex || null,
        isSiblingProduct: false,
        product: product,
      };

      const siblingEntries = siblingProducts.map((sp) => ({
        id: sp.id,
        slug: sp.slug || sp.id,
        name: sp.name,
        displayName: sp.name,
        weightRange: sp.weightRange || extractWeightRange(sp.name),
        image: sp.image,
        packColorHex: sp.colorHex || null,
        isSiblingProduct: true,
        product: sp,
      }));

      const combined = [currentEntry, ...siblingEntries];
      const seen = new Set();
      return combined.filter((item) => {
        const key = (item.name || item.id).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return directFamilyVariants.map((fv) => ({
      ...fv,
      isSiblingProduct: false,
    }));
  }, [product, allProductsList]);

  const hasMultipleFormulations = formulationVariants.length > 1;
  const isFamily =
    hasMultipleFormulations ||
    (isFamilyProduct(product) &&
      Array.isArray(product?.familyVariants) &&
      product.familyVariants.length > 0);
  const familyVariants = formulationVariants;
  const [activeFamilyId, setActiveFamilyId] = useState(null);

  useEffect(() => {
    if (formulationVariants.length > 0) {
      if (queryFamilyVariantId) {
        const found = formulationVariants.find(
          (fv) =>
            String(fv.id) === String(queryFamilyVariantId) ||
            String(fv.slug) === String(queryFamilyVariantId) ||
            String(fv.name) === String(queryFamilyVariantId) ||
            String(fv.displayName) === String(queryFamilyVariantId),
        );
        if (found) {
          setActiveFamilyId(found.id);
          return;
        }
      }
      if (selectedVariant) {
        const match = formulationVariants.find(
          (fv) =>
            String(fv.id) === String(selectedVariant.familyVariantId) ||
            String(fv.slug) === String(selectedVariant.familyVariantSlug) ||
            String(fv.id) === String(selectedVariant.id) ||
            ((fv.name || fv.displayName) &&
              selectedVariant.label &&
              (selectedVariant.label.toLowerCase().includes(String(fv.name || fv.displayName).toLowerCase()) ||
                String(fv.name || fv.displayName).toLowerCase().includes(selectedVariant.label.toLowerCase()))),
        );
        if (match) {
          setActiveFamilyId(match.id);
          return;
        }
      }
      setActiveFamilyId((prev) => {
        if (prev && formulationVariants.some((fv) => String(fv.id) === String(prev))) {
          return prev;
        }
        return formulationVariants[0]?.id || null;
      });
    }
  }, [formulationVariants, queryFamilyVariantId]);

  const activeFamilyVariant = useMemo(() => {
    if (!formulationVariants.length) return null;
    return (
      formulationVariants.find((fv) => String(fv.id) === String(activeFamilyId)) ||
      formulationVariants.find((fv) => String(fv.id) === String(product?.id)) ||
      formulationVariants[0]
    );
  }, [formulationVariants, activeFamilyId, product?.id]);

  const handleSelectFormulation = (fv) => {
    if (!fv) return;
    if (fv.isSiblingProduct && (fv.product || fv.id)) {
      const targetSlug = fv.slug || fv.id;
      navigate(`/product/${targetSlug}`);
      return;
    }

    setActiveFamilyId(fv.id);

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("familyVariantId", fv.id);
        next.delete("variantId");
        next.delete("variant");
        return next;
      },
      { replace: true },
    );

    const familyId = String(fv.id ?? "");
    const familySlug = String(fv.slug ?? "");
    const familyLabel = fv.name || fv.displayName || "";

    const matchedOptions = (product?.optionVariants || []).filter(
      (opt) =>
        String(opt.familyVariantId ?? "") === familyId ||
        String(opt.familyVariantSlug ?? "") === familySlug ||
        (familyLabel &&
          opt.label &&
          (opt.label.toLowerCase().includes(familyLabel.toLowerCase()) ||
            familyLabel.toLowerCase().includes(opt.label.toLowerCase()))),
    );

    if (matchedOptions.length > 0) {
      setSelectedVariant(matchedOptions[0]);
    } else if (Array.isArray(fv.skus) && fv.skus.length > 0) {
      const firstSku = fv.skus[0];
      setSelectedVariant({
        ...firstSku,
        id: firstSku.id || firstSku.sku || `${familyId}-sku-0`,
        label: firstSku.packLabel || firstSku.dose || firstSku.label || "Pack 1",
      });
    }

    const fImg = fv.image || fv.mainImage || fv.imageUrl;
    if (fImg) {
      setActiveImage(fImg);
      setActiveImageId("family-main");
    }
  };

  // Family products can contain options for every weight/size family. Keep
  // the Pack / Size selector scoped to the family currently being viewed.
  const displayOptionVariants = useMemo(() => {
    const allOptions = Array.isArray(product?.optionVariants)
      ? product.optionVariants
      : [];

    let rawOptions = allOptions;
    if (isFamily && activeFamilyVariant) {
      const familyId = String(activeFamilyVariant.id ?? "");
      const familySlug = String(activeFamilyVariant.slug ?? "");
      const familyLabel =
        activeFamilyVariant.name || activeFamilyVariant.displayName;
      const matchesFamily = (option) =>
        String(option.familyVariantId ?? "") === familyId ||
        String(option.familyVariantSlug ?? "") === familySlug ||
        (familyLabel &&
          option.label &&
          (option.label.toLowerCase().includes(String(familyLabel).toLowerCase()) ||
            String(familyLabel).toLowerCase().includes(String(option.label).toLowerCase())));

      const matchedOptions = allOptions.filter(matchesFamily);
      if (matchedOptions.length > 0) {
        rawOptions = matchedOptions;
      } else if (Array.isArray(activeFamilyVariant.skus) && activeFamilyVariant.skus.length > 0) {
        rawOptions = activeFamilyVariant.skus.map((sku, index) => ({
          ...sku,
          id: sku.id || sku.sku || `${familyId}-sku-${index}`,
          label:
            sku.packLabel ||
            sku.label ||
            sku.dose ||
            sku.size ||
            `Pack ${index + 1}`,
        }));
      }
    }

    return rawOptions.map((opt) => {
      const varPricing = opt.pricing || {};
      const optSalePrice = Number(
        opt.salePrice ??
          varPricing.finalPrice ??
          varPricing.salePrice ??
          opt.price ??
          product?.sellingPrice ??
          0,
      );
      const cleanLabel = getCleanOptionLabel(opt, activeFamilyVariant, product);

      return {
        ...opt,
        displayLabel: cleanLabel,
        displayPrice: optSalePrice > 0 ? optSalePrice : null,
      };
    });
  }, [product, isFamily, activeFamilyVariant]);

  const parsedDisplayOptions = displayOptionVariants.map((variant) => ({
    ...variant,
    ...getVariantSizeAndPack(variant),
  }));
  const hasSeparateSizeAndPack = parsedDisplayOptions.some(
    (variant) => variant.pack,
  );
  const selectedSizeAndPack = getVariantSizeAndPack(selectedVariant || {});
  const sizeChoices = [
    ...new Set(
      parsedDisplayOptions.map((variant) => variant.size).filter(Boolean),
    ),
  ];
  const packChoices = parsedDisplayOptions.filter(
    (variant, index, options) =>
      variant.pack &&
      (!selectedSizeAndPack.size || variant.size === selectedSizeAndPack.size) &&
      options.findIndex(
        (candidate) =>
          candidate.size === variant.size && candidate.pack === variant.pack,
      ) === index,
  );

  useEffect(() => {
    if (!displayOptionVariants.length) return;
    if (queryVariantId) {
      const match = displayOptionVariants.find(
        (option) =>
          String(option.id) === String(queryVariantId) ||
          String(option.sku) === String(queryVariantId) ||
          String(option.variantId) === String(queryVariantId) ||
          String(option.label) === String(queryVariantId),
      );
      if (match) {
        setSelectedVariant(match);
        return;
      }
    }
    const selectedBelongsToFamily = displayOptionVariants.some(
      (option) => String(option.id) === String(selectedVariant?.id),
    );
    if (!selectedBelongsToFamily && displayOptionVariants[0]) {
      setSelectedVariant(displayOptionVariants[0]);
    }
  }, [displayOptionVariants, queryVariantId]);

  useEffect(() => {
    if (activeFamilyVariant) {
      const fImg = activeFamilyVariant.image || activeFamilyVariant.mainImage || activeFamilyVariant.imageUrl;
      if (fImg) {
        setActiveImage(fImg);
        setActiveImageId("family-main");
      }
    }
  }, [activeFamilyVariant]);

  const richContent = useMemo(() => {
    if (!product) return "";
    const parentRich =
      product?.productDetails?.content ||
      product?.productDetails?.overview ||
      product?.parentContent ||
      product?.content ||
      product?.detailedContent ||
      product?.overview ||
      product?.longDescription ||
      product?.description ||
      "";

    if (isFamily && activeFamilyVariant) {
      const rawFamily =
        activeFamilyVariant.content ||
        activeFamilyVariant.overview ||
        activeFamilyVariant.description ||
        activeFamilyVariant.shortDescription;
      const formatted = formatProductRichContent(rawFamily, {
        ...product,
        ...activeFamilyVariant,
        parentContent: parentRich,
      });
      if (formatted) return formatted;
    }

    return formatProductRichContent(parentRich, product);
  }, [isFamily, activeFamilyVariant, product]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-green border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-deep-navy/60">
            Loading details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
          <ShieldCheck className="w-10 h-10 rotate-180" />
        </div>
        <h2 className="font-display font-extrabold text-[2rem] text-deep-navy mb-3">
          Product Not Found
        </h2>
        <p className="text-deep-navy/60 max-w-md mb-8">
          The product you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary-green text-white font-extrabold text-sm uppercase tracking-wider transition-all hover:bg-dark-green hover:shadow-md active:scale-97 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const { name, category, description, image } = product;
  const displayedTitle =
    activeFamilyVariant?.displayName ||
    activeFamilyVariant?.name ||
    name ||
    "";

  // Merge variant details from variant API with selected variant
  const effectiveVariant = variantDetails
    ? {
        ...selectedVariant,
        ...variantDetails,
        pricing: {
          ...(selectedVariant?.pricing || {}),
          price: variantDetails.price ?? selectedVariant?.pricing?.price,
          finalPrice:
            variantDetails.salePrice ??
            variantDetails.price ??
            selectedVariant?.pricing?.finalPrice,
          hasDiscount: Boolean(
            variantDetails.salePrice &&
            variantDetails.price &&
            Number(variantDetails.salePrice) < Number(variantDetails.price),
          ),
        },
        inventory: {
          ...(selectedVariant?.inventory || {}),
          isInStock:
            variantDetails.stock > 0 ||
            selectedVariant?.inventory?.isInStock !== false,
          stockQuantity:
            variantDetails.stock ??
            selectedVariant?.inventory?.stockQuantity ??
            selectedVariant?.stock,
        },
        stock: variantDetails.stock ?? selectedVariant?.stock,
      }
    : selectedVariant;

  const activeSku =
    effectiveVariant?.sku ||
    effectiveVariant?.slug ||
    product?.sku ||
    product?.slug ||
    "";

  // Resolve price, discount, and stock dynamically from the effective variant if available
  let displaySellingPrice = Number(product?.sellingPrice || 0);
  let displayActualPrice = Number(product?.actualPrice || 0);
  let displayDiscount = product?.discount || null;
  let displayInStock = product?.inStock || false;
  let displayStockCount = product?.stock !== undefined ? product.stock : 0;

  if (effectiveVariant) {
    const varPricing = effectiveVariant.pricing || {};
    displaySellingPrice = Number(
      effectiveVariant.salePrice ??
        varPricing.salePrice ??
        varPricing.finalPrice ??
        effectiveVariant.sellPrice ??
        effectiveVariant.price ??
        product?.sellingPrice ??
        0,
    );

    const rawActual =
      effectiveVariant.regularPrice ??
      effectiveVariant.originalPrice ??
      varPricing.regularPrice ??
      varPricing.price ??
      varPricing.originalPrice ??
      (effectiveVariant.salePrice &&
      effectiveVariant.price &&
      Number(effectiveVariant.price) > Number(effectiveVariant.salePrice)
        ? effectiveVariant.price
        : null) ??
      product?.actualPrice ??
      product?.originalPrice ??
      null;

    let parsedActual =
      rawActual !== null && rawActual !== undefined ? Number(rawActual) : null;

    const discountPct = Number(
      varPricing.discountPercentage ??
        effectiveVariant.discountPercentage ??
        product?.discountPercentage ??
        0,
    );
    if (
      (!parsedActual || parsedActual <= displaySellingPrice) &&
      discountPct > 0 &&
      displaySellingPrice > 0
    ) {
      parsedActual = Number(
        (displaySellingPrice / (1 - discountPct / 100)).toFixed(2),
      );
    }

    displayActualPrice =
      parsedActual && parsedActual > displaySellingPrice
        ? parsedActual
        : displaySellingPrice;

    const hasRealDiscount = displayActualPrice > displaySellingPrice;
    const computedDiscountPct = hasRealDiscount
      ? Math.round(
          ((displayActualPrice - displaySellingPrice) / displayActualPrice) *
            100,
        )
      : 0;

    displayDiscount =
      hasRealDiscount && computedDiscountPct > 0
        ? `${computedDiscountPct}% OFF`
        : null;

    displayInStock = isVariantInStock(effectiveVariant);
    displayStockCount = getVariantStockCount(effectiveVariant);
  } else {
    if (
      product.salePrice &&
      product.regularPrice &&
      Number(product.regularPrice) > Number(product.salePrice)
    ) {
      displaySellingPrice = Number(product.salePrice);
      displayActualPrice = Number(product.regularPrice);
      const pct = Math.round(
        ((displayActualPrice - displaySellingPrice) / displayActualPrice) * 100,
      );
      displayDiscount = pct > 0 ? `${pct}% OFF` : null;
    } else if (displayActualPrice <= displaySellingPrice) {
      displayActualPrice = displaySellingPrice;
      displayDiscount = null;
    }
    displayStockCount =
      product.inventory?.stockQuantity !== undefined
        ? product.inventory.stockQuantity
        : product.stock !== undefined
          ? product.stock
          : 0;
  }

  // For SINGLE products: prioritize product description (Vet Supply Express flow)
  // For FAMILY products: keep as-is (variant description first)
  const isFam = isFamily;
  const displayedDescription = !isFam
    ? product?.description ||
      product?.shortDescription ||
      effectiveVariant?.description ||
      effectiveVariant?.details ||
      ""
    : effectiveVariant?.description ||
      effectiveVariant?.details ||
      product?.shortDescription ||
      product?.description ||
      "";

  const wishlisted = isWishlisted(product.id);

  // Generate sub-images dynamically from product gallery or fallback to main image
  const selectedVariantImages = selectedVariant
    ? [selectedVariant.image, ...(selectedVariant.gallery || [])]
    : product?.colorVariants?.length && selectedColor
      ? [
          product.colorVariants.find(
            (variant) => variant.name === selectedColor,
          )?.mainImage,
          ...(product.colorVariants.find(
            (variant) => variant.name === selectedColor,
          )?.gallery || []),
        ]
      : [];
  const scopedImages = [...new Set(selectedVariantImages.filter(Boolean))];
  const subImages = (scopedImages.length > 0 ? scopedImages : [image]).map(
    (src, idx) => ({
      id: selectedVariant
        ? `variant-${idx}`
        : idx === 0
          ? "main"
          : `gallery-${idx}`,
      src,
      label: `View ${idx + 1}`,
      className: "object-contain",
    }),
  );

  // Sizes depending on category (fallback for non-variant products)
  const sizeOptions =
    category.includes("Prevention") ||
    category.includes("Refills") ||
    category.includes("Relief")
      ? ["3 Chews", "6 Chews", "12 Chews"]
      : ["Small Pack", "Medium Pack", "Large Pack"];

  // Color options representation for variants (from API, fallback to empty)
  const colorOptions = product.colorVariants || [];

  // Handle quantity actions
  const handleQuantityChange = (val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
    } else if (num > displayStockCount) {
      setQuantity(displayStockCount);
      showToast.error(
        `Cannot exceed available stock of ${displayStockCount} units.`,
      );
    } else {
      setQuantity(num);
    }
  };

  const handleVariantSelect = (variant) => {
    const nextStockCount = getVariantStockCount(variant);
    setSelectedVariant(variant);
    setVariantDetails(null);
    setQuantity((currentQuantity) =>
      Math.min(currentQuantity, Math.max(nextStockCount, 1)),
    );
  };

  const handleSizeSelect = (sizeValue) => {
    const selectedPack = selectedSizeAndPack.pack;
    const nextVariant =
      parsedDisplayOptions.find(
        (variant) =>
          variant.size === sizeValue &&
          (!selectedPack || variant.pack === selectedPack),
      ) || parsedDisplayOptions.find((variant) => variant.size === sizeValue);
    if (nextVariant) handleVariantSelect(nextVariant);
  };

  const handlePackSelect = (packValue) => {
    const nextVariant = parsedDisplayOptions.find(
      (variant) =>
        variant.size === selectedSizeAndPack.size && variant.pack === packValue,
    );
    if (nextVariant) handleVariantSelect(nextVariant);
  };

  // Toggle wishlist handler
  const handleWishlistToggle = () => {
    toggleWishlist(product);
    if (!wishlisted) {
      showToast.wishlist(`${name} added to wishlist!`, true);
    } else {
      showToast.wishlist(`${name} removed from wishlist.`, false);
    }
  };

  // Copy product link
  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast.success("Product link copied to clipboard!");
  };

  // Direct add-to-cart for specific variant option
  const handleVariantAddToCart = (variantOption) => {
    if (!product) return;
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    const varStock = getVariantStockCount(variantOption);
    const isVarInStock =
      variantOption.isAvailable !== false && isVariantInStock(variantOption);
    if (!isVarInStock) {
      showToast.error(
        `${variantOption.label || variantOption.size || "Variant"} is out of stock.`,
      );
      return;
    }
    const varPricing = variantOption.pricing || {};
    const vSalePrice = Number(
      variantOption.salePrice ??
        varPricing.finalPrice ??
        variantOption.price ??
        product.sellingPrice ??
        0,
    );
    const vRegPrice = Number(
      variantOption.price ??
        varPricing.price ??
        variantOption.regularPrice ??
        vSalePrice,
    );
    const cartProduct = {
      ...product,
      productId: product.id,
      baseProductId: product.id,
      id: `${product.id}__${variantOption.id || variantOption.sku || "var"}`,
      name: `${product.name} - ${variantOption.label || variantOption.size || "Option"}`,
      title: `${product.name} - ${variantOption.label || variantOption.size || "Option"}`,
      sellingPrice: vSalePrice,
      actualPrice: vRegPrice,
      discount:
        vRegPrice > vSalePrice
          ? `${Math.round(((vRegPrice - vSalePrice) / vRegPrice) * 100)}% OFF`
          : null,
      selectedVariant:
        variantOption.label || variantOption.size || variantOption.name,
      stockLimit: varStock,
      inStock: true,
      sku: variantOption.sku || activeSku,
      image: variantOption.image || activeImage || product.image,
    };
    addToCart(cartProduct, 1);
    showToast.success(
      `Added 1x ${product.name} (${variantOption.label || variantOption.size}) to cart!`,
    );
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!displayInStock) {
      showToast.error(`${displayedTitle || name} is currently out of stock.`);
      return;
    }
    if (quantity > displayStockCount) {
      showToast.error(
        `Cannot add more than ${displayStockCount} units (only ${displayStockCount} in stock).`,
      );
      return;
    }

    const cleanSizeLabel =
      effectiveVariant?.displayLabel ||
      (effectiveVariant
        ? getCleanOptionLabel(effectiveVariant, activeFamilyVariant, product).replace(
            /(\d+)([a-zA-Z]+)/g,
            "$1 $2",
          )
        : selectedSize || "");

    const productToCart = {
      ...product,
      productId: product.id,
      baseProductId: product.id,
      id:
        product.id +
        (effectiveVariant
          ? `__${effectiveVariant.id || effectiveVariant.sku || "var"}`
          : "") +
        (selectedColor ? `__${selectedColor}` : "") +
        (cleanSizeLabel ? `__${cleanSizeLabel}` : ""),
      name: `${displayedTitle || name}${cleanSizeLabel ? ` - ${cleanSizeLabel}` : ""}`,
      title: `${displayedTitle || name}${cleanSizeLabel ? ` - ${cleanSizeLabel}` : ""}`,
      sellingPrice: displaySellingPrice,
      actualPrice: displayActualPrice,
      discount: displayDiscount,
      selectedVariant: cleanSizeLabel || displayedTitle || null,
      selectedSize: cleanSizeLabel || null,
      selectedColor: selectedColor || null,
      stockLimit: displayStockCount,
      inStock: displayInStock,
      sku: activeSku,
      image: activeImage || product.image,
    };
    addToCart(productToCart, quantity);
    const variantLabel = cleanSizeLabel ? ` (${cleanSizeLabel})` : "";
    showToast.success(
      `${quantity} x ${displayedTitle || name}${variantLabel} added to cart!`,
    );
  };

  // Buy now handler
  const handleBuyNow = () => {
    if (!displayInStock) {
      showToast.error(`${displayedTitle || name} is currently out of stock.`);
      return;
    }
    if (quantity > displayStockCount) {
      showToast.error(
        `Cannot buy more than ${displayStockCount} units (only ${displayStockCount} in stock).`,
      );
      return;
    }

    const cleanSizeLabel =
      effectiveVariant?.displayLabel ||
      (effectiveVariant
        ? getCleanOptionLabel(effectiveVariant, activeFamilyVariant, product).replace(
            /(\d+)([a-zA-Z]+)/g,
            "$1 $2",
          )
        : selectedSize || "");

    const productToCart = {
      ...product,
      productId: product.id,
      baseProductId: product.id,
      id:
        product.id +
        (effectiveVariant
          ? `__${effectiveVariant.id || effectiveVariant.sku || "var"}`
          : "") +
        (selectedColor ? `__${selectedColor}` : "") +
        (cleanSizeLabel ? `__${cleanSizeLabel}` : ""),
      name: `${displayedTitle || name}${cleanSizeLabel ? ` - ${cleanSizeLabel}` : ""}`,
      title: `${displayedTitle || name}${cleanSizeLabel ? ` - ${cleanSizeLabel}` : ""}`,
      sellingPrice: displaySellingPrice,
      actualPrice: displayActualPrice,
      discount: displayDiscount,
      selectedVariant: cleanSizeLabel || displayedTitle || null,
      selectedSize: cleanSizeLabel || null,
      selectedColor: selectedColor || null,
      stockLimit: displayStockCount,
      inStock: displayInStock,
      sku: activeSku,
      image: activeImage || product.image,
    };
    sessionStorage.setItem(
      "pet_meds_buy_now",
      JSON.stringify({ ...productToCart, quantity }),
    );
    navigate("/checkout?buyNow=1");
  };

  // Related products logic (same category or same companion type, excluding current)
  const relatedProducts = allProductsList
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category === category ||
          p.petCompanion.some((c) => product.petCompanion.includes(c))),
    )
    .slice(0, 4);

  const getDynamicValue = (str) => {
    if (!str) return "";
    const trimmed = str.trim();
    if (trimmed === "") return "";
    if (trimmed.toLowerCase().startsWith("provide detailed")) return "";
    return trimmed;
  };

  const displayDescription = getDynamicValue(description);
  const fullDescriptionText = displayDescription;
  const displayShipping =
    getDynamicValue(product.shippingReturns) ||
    getDynamicValue(product.shippingInfo) ||
    getDynamicValue(product.shipping) ||
    getDynamicValue(product.productDetails?.shippingReturns) ||
    getDynamicValue(product.productDetails?.shipping) ||
    "";
  const displayReturns =
    getDynamicValue(product.returnPolicies) ||
    getDynamicValue(product.returnPolicy) ||
    getDynamicValue(product.returns) ||
    getDynamicValue(product.productDetails?.returnPolicies) ||
    getDynamicValue(product.productDetails?.returns) ||
    "";

  const richShippingContent = formatProductRichContent(displayShipping);
  const richReturnsContent = formatProductRichContent(displayReturns);

  return (
    <main className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-deep-navy/40 mb-8 sm:mb-12 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
          <Link to="/" className="hover:text-primary-green transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            to="/products"
            className="hover:text-primary-green transition-colors"
          >
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-deep-navy/50">{category}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-deep-navy font-extrabold truncate max-w-[180px] sm:max-w-[300px]">
            {name}
          </span>
        </nav>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-[2.5rem] border border-slate-100 p-4 sm:p-8 lg:p-12 shadow-[0_20px_50px_-20px_rgba(15,45,82,0.05)] mb-16">
          {/* Left Side: Product Images Area (Grid Column: 6) */}
          <div className="lg:col-span-6 min-w-0 w-full flex flex-col-reverse sm:grid sm:grid-cols-[80px_1fr] lg:grid-cols-[96px_1fr] gap-4 items-stretch h-auto sm:h-[400px] lg:h-[460px]">
            {/* Sub-Images (Thumbnails Column) */}
            <div className="flex flex-row sm:flex-col gap-3 min-h-0 overflow-x-auto sm:overflow-y-auto scrollbar-none w-full sm:w-auto py-1 sm:py-0">
              {(() => {
                const maxVisible = 5;
                const hasMore = subImages.length > maxVisible;
                const visibleThumbs = hasMore
                  ? subImages.slice(
                      thumbStartIndex,
                      thumbStartIndex + maxVisible,
                    )
                  : subImages;

                return visibleThumbs.map((thumb, index) => {
                  const isLast = hasMore && index === maxVisible - 1;
                  const remainingCount =
                    subImages.length - (thumbStartIndex + maxVisible);
                  const displayCount =
                    remainingCount > 0
                      ? remainingCount
                      : subImages.length - maxVisible;
                  const isActive = activeImageId === thumb.id;

                  return (
                    <button
                      key={thumb.id}
                      onClick={() => {
                        setActiveImage(thumb.src);
                        setActiveImageId(thumb.id);
                        if (isLast) {
                          setThumbStartIndex((prev) => {
                            const nextIndex = prev + 1;
                            if (nextIndex > subImages.length - maxVisible) {
                              return 0;
                            }
                            return nextIndex;
                          });
                        }
                      }}
                      className={`w-14 sm:w-full aspect-square shrink-0 relative rounded-2xl bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border flex items-center justify-center p-2 overflow-hidden transition-all duration-300 cursor-pointer ${
                        isActive && !isLast
                          ? "border-[#58b947] ring-3 ring-[#58b947]/10 shadow-md scale-102 bg-white"
                          : "border-slate-100 hover:border-slate-300 hover:scale-102"
                      }`}
                    >
                      <img
                        src={thumb.src}
                        alt={thumb.label}
                        className={`w-full h-full object-contain drop-shadow-sm transition-transform duration-300 ${thumb.className}`}
                      />
                      {isLast && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px] flex flex-col items-center justify-center text-white transition-opacity duration-300 hover:bg-black/50">
                          <span className="text-sm font-black tracking-wider">
                            +{displayCount}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">
                            More
                          </span>
                        </div>
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Main Interactive Image Showcase */}
            <div className="relative w-full h-[320px] sm:h-full rounded-[2rem] bg-gradient-to-b from-[#f8fafc] via-[#f8fafc] to-[#f1f5f9] border border-slate-100 flex items-center justify-center p-6 sm:p-8 overflow-hidden">
              {displayDiscount && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-rose-500 text-white tracking-wider uppercase shadow-sm">
                    {displayDiscount}
                  </span>
                </div>
              )}

              {/* Display Current Selected View/Image */}
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={activeImage}
                  alt={name}
                  className={`w-full h-full object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.08)] transition-all duration-500 ease-out`}
                />
              </div>
            </div>
          </div>

          {/* Right Side: Product Details & Options Area (Grid Column: 6) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Product Category and Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-dark-green border border-primary-green/15">
                  {category}
                </span>
                <span
                  className={`text-xs font-bold ${
                    displayInStock ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {displayInStock ? "" : "• Out of Stock"}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-display font-extrabold text-[1.8rem] sm:text-[2.5rem] text-deep-navy leading-tight tracking-tight mb-2">
                {displayedTitle}
              </h1>

              {/* Star Rating ONLY (Shown strictly if product has reviews) */}
              {Boolean(productReviews && productReviews.length > 0) && (
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avgRating =
                      productReviews.reduce(
                        (sum, r) => sum + (Number(r.rating) || 0),
                        0,
                      ) / productReviews.length;
                    return (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(avgRating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 fill-slate-100"
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {requiresVet && (
                <div className="mt-2 mb-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-green px-3.5 py-1.5 text-xs font-extrabold uppercase text-white shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                    VERIFIED VETERINARIAN REQUIRED
                  </span>
                  {userLacksVet && (
                    <Link
                      to={user ? "/profile?tab=vet-verification" : "/login"}
                      className="text-xs font-extrabold text-[#d9aa3d] hover:text-amber-700 underline cursor-pointer"
                    >
                      Apply for Verification
                    </Link>
                  )}
                </div>
              )}

              {/* Short Description */}
              {displayedDescription && (
                <div className="text-sm sm:text-base font-medium text-deep-navy/70 leading-relaxed mb-6">
                  {typeof displayedDescription === "string" &&
                  /<[a-z][\s\S]*>/i.test(displayedDescription) ? (
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: displayedDescription }}
                    />
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed">
                      {displayedDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Options/Size Selector */}
              {((displayOptionVariants && displayOptionVariants.length > 0 &&
                !hasSeparateSizeAndPack) ||
                (!displayOptionVariants.length &&
                  product.capacities &&
                  product.capacities.length > 0)) ? (
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="block text-xs font-extrabold text-deep-navy uppercase tracking-wider">
                      {product.optionLabel || "Select Pack Size"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {displayOptionVariants && displayOptionVariants.length > 0
                      ? displayOptionVariants.map((variant) => {
                          const isSelected = selectedVariant?.id === variant.id;
                          const isVarInStock = isVariantInStock(variant);
                          const btnLabel = variant.displayLabel || variant.label;
                          return (
                            <button
                              key={variant.id}
                              onClick={() => handleVariantSelect(variant)}
                              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? "border-primary-green bg-emerald-50/25 text-dark-green font-extrabold shadow-xs ring-1 ring-primary-green/30"
                                  : isVarInStock
                                    ? "border-slate-200 bg-white text-deep-navy/80 hover:border-slate-400 hover:bg-slate-50"
                                    : "border-slate-100 bg-slate-50 text-slate-400/80 cursor-pointer hover:border-slate-300"
                              }`}
                            >
                              <span className="font-extrabold">{btnLabel}</span>
                              {variant.displayPrice && (
                                <span
                                  className={`text-xs font-black ${
                                    isSelected
                                      ? "text-dark-green"
                                      : "text-deep-navy/60"
                                  }`}
                                >
                                  ${variant.displayPrice.toFixed(2)}
                                </span>
                              )}
                              {!isVarInStock && (
                                <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                                  Out of Stock
                                </span>
                              )}
                            </button>
                          );
                        })
                      : product.capacities.map((cap) => {
                          const isSelected = selectedSize === cap;
                          return (
                            <button
                              key={cap}
                              onClick={() => setSelectedSize(cap)}
                              className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                                isSelected
                                  ? "border-primary-green bg-emerald-50/20 text-dark-green font-extrabold shadow-xs"
                                  : "border-slate-200 bg-white text-deep-navy/70 hover:border-slate-400"
                              }`}
                            >
                              {cap}
                            </button>
                          );
                        })}
                  </div>
                </div>
              ) : hasSeparateSizeAndPack ? (
                <div className="mb-6 space-y-4">
                  <div>
                    <span className="block text-xs font-extrabold text-deep-navy uppercase tracking-wider mb-3">
                      Select Size
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {sizeChoices.map((sizeValue) => (
                        <button
                          key={sizeValue}
                          type="button"
                          onClick={() => handleSizeSelect(sizeValue)}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                            selectedSizeAndPack.size === sizeValue
                              ? "border-primary-green bg-emerald-50/25 text-dark-green font-extrabold shadow-xs ring-1 ring-primary-green/30"
                              : "border-slate-200 bg-white text-deep-navy/80 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {sizeValue}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-extrabold text-deep-navy uppercase tracking-wider mb-3">
                      Select Dose / Pack
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {packChoices.map((packOption) => {
                        const isSelected =
                          selectedSizeAndPack.pack === packOption.pack;
                        const isVarInStock = isVariantInStock(packOption);
                        return (
                          <button
                            key={`${packOption.size}-${packOption.pack}`}
                            type="button"
                            onClick={() => handlePackSelect(packOption.pack)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer flex flex-col items-start ${
                              isSelected
                                ? "border-primary-green bg-emerald-50/25 text-dark-green font-extrabold shadow-xs ring-1 ring-primary-green/30"
                                : isVarInStock
                                  ? "border-slate-200 bg-white text-deep-navy/80 hover:border-slate-400 hover:bg-slate-50"
                                  : "border-slate-100 bg-slate-50 text-slate-400/80"
                            }`}
                          >
                            <span>{packOption.pack}</span>
                            {packOption.displayPrice !== null &&
                              packOption.displayPrice !== undefined && (
                                <span className="text-xs font-black text-dark-green">
                                  ${packOption.displayPrice.toFixed(2)}
                                </span>
                              )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback size selector if needed */
                sizeOptions &&
                sizeOptions.length > 0 && (
                  <div className="mb-6">
                    <span className="block text-xs font-extrabold text-deep-navy uppercase tracking-wider mb-3">
                      Select Pack Size
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {sizeOptions.map((sz) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                              isSelected
                                ? "border-primary-green bg-emerald-50/20 text-dark-green font-extrabold shadow-xs"
                                : "border-slate-200 bg-white text-deep-navy/70 hover:border-slate-400"
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}

              {/* Color/Variant Selector */}
              {colorOptions && colorOptions.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold text-deep-navy uppercase tracking-wider">
                      Select Color Variant
                    </span>
                    <span className="text-xs font-bold text-deep-navy/55">
                      {selectedColor}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${
                          selectedColor === color.name
                            ? "ring-2 ring-offset-2 ring-primary-green scale-105 shadow-sm"
                            : "border border-slate-200"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColor === color.name && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3] mix-blend-difference" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector, Buy Actions, Wishlist & Share buttons */}
            <div>
              {/* Row 1: Quantity Selector (left) & Wishlist / Share (right) */}
              <div className="flex flex-row items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 flex-wrap">
                {/* Quantity box & Total Pricing */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-2xl p-1.5 w-[140px] shrink-0">
                    <button
                      onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100 hover:border-slate-300 text-deep-navy transition-all duration-200 cursor-pointer active:scale-95"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-10 text-center font-extrabold text-sm text-deep-navy bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                    />
                    <button
                      onClick={() => {
                        if (quantity < displayStockCount) {
                          setQuantity(quantity + 1);
                        } else {
                          showToast.error(
                            `Cannot exceed available stock of ${displayStockCount} units.`,
                          );
                        }
                      }}
                      disabled={quantity >= displayStockCount}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200/50 hover:bg-slate-100 hover:border-slate-300 text-deep-navy disabled:opacity-30 disabled:hover:bg-white disabled:hover:border-slate-200/50 transition-all duration-200 cursor-pointer active:scale-95"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] font-black uppercase tracking-wider text-deep-navy/45">
                      Subtotal ({quantity} {quantity === 1 ? "pack" : "packs"})
                    </span>
                    <span className="text-base sm:text-lg font-black text-deep-navy">
                      ${(displaySellingPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Aux Actions: Wishlist and Share (Icons Only, Aligned Right) */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleWishlistToggle}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-300 cursor-pointer active:scale-95 ${
                      wishlisted
                        ? "border-rose-100 bg-rose-50 text-rose-500 hover:bg-rose-100"
                        : "border-slate-200 bg-white text-deep-navy/70 hover:border-slate-300 hover:text-rose-500"
                    }`}
                    title={
                      wishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                    }
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform duration-300 hover:scale-110 ${
                        wishlisted ? "fill-rose-500 text-rose-500" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Row 2: Add to Cart / Buy Now buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={
                    userLacksVet
                      ? () =>
                          navigate(
                            user ? "/profile?tab=vet-verification" : "/login",
                          )
                      : handleAddToCart
                  }
                  disabled={!displayInStock || userLacksVet}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-xs font-black tracking-widest uppercase transition-all duration-300 ${
                    userLacksVet
                      ? "bg-primary-green/40 text-white cursor-not-allowed border-none shadow-none opacity-90"
                      : displayInStock
                        ? "bg-slate-100 text-deep-navy border border-slate-200/60 shadow-xs hover:bg-slate-200 hover:border-slate-300 active:scale-97 cursor-pointer"
                        : "bg-slate-50 text-slate-400 border border-slate-200/30 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {userLacksVet ? "Apply for Verification" : "Add To Cart"}
                  </span>
                </button>
                <button
                  onClick={
                    userLacksVet
                      ? () =>
                          navigate(
                            user ? "/profile?tab=vet-verification" : "/login",
                          )
                      : handleBuyNow
                  }
                  disabled={!displayInStock || userLacksVet}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-xs font-black tracking-widest uppercase text-white transition-all duration-300 ${
                    userLacksVet
                      ? "border border-[#17345f1a] bg-gray-100 text-[#122a50]/40 cursor-not-allowed shadow-none"
                      : displayInStock
                        ? "bg-primary-green shadow-[0_10px_20px_-5px_rgba(88,185,71,0.3)] hover:bg-dark-green hover:shadow-[0_10px_20px_-5px_rgba(47,158,68,0.4)] hover:scale-[1.01] active:scale-97 cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <span>Buy It Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Text Area Section: Description, Shipping, Returns, Reviews */}
        <div className="mb-20">
          <div className="flex border-b border-slate-200/80 mb-6 gap-2 sm:gap-6 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { id: "description", label: "Description" },
              { id: "shipping", label: "Shipping" },
              { id: "returns", label: "Returns" },
              { id: "reviews", label: `Reviews (${productReviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors duration-300 pb-4 ${
                  activeTab === tab.id
                    ? "text-primary-green font-extrabold"
                    : "text-deep-navy/50 hover:text-deep-navy"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green rounded-full animate-fade-in" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Section */}
          <div className="relative">
            {activeTab === "description" && (
              <div className="space-y-6 text-left p-6 sm:p-8 rounded-[2rem] border border-slate-200 bg-[#f8fafc]">
                {(product.prescriptionRequired || requiresVet) && (
                  <div className="p-4.5 rounded-2xl bg-emerald-50/50 border border-primary-green/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-green shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-black uppercase tracking-wider text-deep-navy">
                        Veterinary Prescription Required
                      </h5>
                      <p className="text-xs font-medium text-deep-navy/80 mt-1 leading-relaxed">
                        Veterinary prescription may be required for dispensing
                        this item. Please ensure you have your registered
                        veterinarian's prescription details ready during
                        checkout.
                      </p>
                    </div>
                  </div>
                )}

                {richContent && (
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-deep-navy mb-2">
                      Clinical Overview &amp; Product Summary
                    </h4>
                    <div
                      className="prose prose-slate max-w-none text-xs sm:text-sm text-deep-navy/80 leading-relaxed font-sans rich-content-display variant-rich-content"
                      dangerouslySetInnerHTML={{ __html: richContent }}
                    />
                  </div>
                )}

                {Array.isArray(product.benefits) &&
                  product.benefits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-deep-navy mb-3">
                        Key Health Benefits
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {product.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-deep-navy"
                          >
                            <CheckCircle2 className="w-4 h-4 text-primary-green shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="p-6 sm:p-8 rounded-[2rem] border border-slate-200 bg-[#f8fafc] text-deep-navy font-sans text-sm leading-relaxed shadow-xs text-left space-y-6">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-deep-navy mb-2">
                    Shipping &amp; Delivery Information
                  </h4>
                  {richShippingContent ? (
                    <div
                      className="prose prose-slate max-w-none text-xs sm:text-sm text-deep-navy/80 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: richShippingContent }}
                    />
                  ) : displayShipping ? (
                    <p className="text-xs sm:text-sm font-medium text-deep-navy/70 leading-relaxed whitespace-pre-line">
                      {displayShipping}
                    </p>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs sm:text-sm font-medium text-deep-navy/70 leading-relaxed">
                        Free standard shipping on all orders over $49 within 2–4
                        business days. Temperature-sensitive items are
                        dispatched in insulated coolers with medical ice packs.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "returns" && (
              <div className="p-6 sm:p-8 rounded-[2rem] border border-slate-200 bg-[#f8fafc] text-deep-navy font-sans text-sm leading-relaxed shadow-xs text-left space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-deep-navy">
                  Returns &amp; Refund Policy
                </h4>
                {richReturnsContent ? (
                  <div
                    className="prose prose-slate max-w-none text-xs sm:text-sm text-deep-navy/80 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: richReturnsContent }}
                  />
                ) : displayReturns ? (
                  <p className="text-xs sm:text-sm font-medium text-deep-navy/70 leading-relaxed whitespace-pre-line">
                    {displayReturns}
                  </p>
                ) : (
                  <div className="space-y-3 pt-1">
                    <p className="text-xs sm:text-sm font-medium text-deep-navy/70 leading-relaxed">
                      We offer a 30-day satisfaction guarantee on eligible
                      unopened pet supplies. By pharmacy regulations,
                      prescription medications cannot be returned once shipped.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                {productReviews.length === 0 ? (
                  <div className="p-8 text-center bg-[#f8fafc] rounded-[2rem] border border-slate-200 text-deep-navy/50 font-semibold">
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  productReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-6 rounded-[1.5rem] border border-slate-200/80 bg-white shadow-2xs hover:shadow-xs transition-all text-left"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 text-primary-green font-black flex items-center justify-center text-sm uppercase">
                            {rev.reviewerName
                              ? rev.reviewerName.charAt(0)
                              : "U"}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-deep-navy">
                              {rev.reviewerName}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3.5 w-3.5 ${
                                    star <= rev.rating
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-200 fill-slate-100"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-deep-navy/40">
                          {rev.date}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-deep-navy/70 leading-relaxed pl-1 sm:pl-13">
                        {rev.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-8 sm:mb-12 border-b border-slate-100 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary-green block mb-1">
                  Recommendations
                </span>
                <h2 className="font-display font-extrabold text-[1.8rem] sm:text-[2.2rem] text-deep-navy tracking-tight leading-none">
                  Customers Also Viewed
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
