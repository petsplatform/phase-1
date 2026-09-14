import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { AuthContext } from "../../context/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
  getProductUrl,
} from "../../utils/productUtils";
import {
  Heart,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Check,
  Share2,
  Star,
  User,
  Calendar,
  MessageSquare,
  Loader2,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info,
  Package,
  Award,
  FileText,
  Zap,
  RotateCcw,
} from "lucide-react";
import ProductImage from "../Common/ProductImage";
import { reviewApi } from "../../api/reviewApi";
import { productApi } from "../../api/productApi";
import { formatProductRichContent } from "../../utils/htmlUtils";

const splitSizeAndPackLabel = (label) => {
  const value = String(label || "").trim();
  const plusParts = value
    .split(/\s*\+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const trailingPack = value.match(
    /^(.*?[A-Za-z])[\s-]*(\d+(?:\s*(?:tablets?|doses?|capsules?|packs?|count|ct))?)$/i,
  );
  const parts =
    plusParts.length > 1
      ? plusParts
      : trailingPack
        ? [trailingPack[1].trim(), trailingPack[2].trim()]
        : [value];
  return { size: parts[0] || value, pack: parts.slice(1).join(" + ") };
};

const isOptionBelongingToFamily = (ov, familyVariant) => {
  if (!ov || !familyVariant) return true;
  const fvId = String(familyVariant.id || familyVariant._id || "");
  const fvSlug = String(familyVariant.slug || "");
  const fvName = String(familyVariant.displayName || familyVariant.name || "")
    .trim()
    .toLowerCase();
  const fvWeight = String(familyVariant.weightRange || "")
    .trim()
    .toLowerCase();

  const ovFamId = String(
    ov.familyVariantId || ov.familyId || ov.variantId || "",
  );
  const ovFamSlug = String(ov.familyVariantSlug || ov.variantSlug || "");
  const ovLabel = String(ov.label || ov.name || ov.size || "")
    .trim()
    .toLowerCase();
  const ovVarName = String(ov.variantName || "")
    .trim()
    .toLowerCase();

  // 1. Direct family ID or slug match
  if (fvId && ovFamId && ovFamId === fvId) return true;
  if (fvSlug && ovFamSlug && ovFamSlug === fvSlug) return true;

  // 2. Extract weight bracket (e.g. "2.8 to 5.5", "5.6 to 11", "2.8-5.5", "5.6-11")
  const extractWeightBracket = (txt) => {
    const m = String(txt || "").match(
      /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:lbs?|kg)?/i,
    );
    if (m) return `${m[1]}-${m[2]}`;
    return null;
  };
  const fvWeightKey =
    extractWeightBracket(fvWeight) || extractWeightBracket(fvName);
  const ovWeightKey =
    extractWeightBracket(ovVarName) || extractWeightBracket(ovLabel);
  if (fvWeightKey && ovWeightKey) {
    return fvWeightKey === ovWeightKey;
  }

  // 3. Name or label substring match
  if (fvName && (ovVarName.includes(fvName) || fvName.includes(ovVarName)))
    return true;
  if (fvName && (ovLabel.includes(fvName) || fvName.includes(ovLabel)))
    return true;
  if (fvWeight && (ovVarName.includes(fvWeight) || ovLabel.includes(fvWeight)))
    return true;

  return false;
};

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFamilyVariantId =
    searchParams.get("familyVariantId") ||
    searchParams.get("variantId") ||
    searchParams.get("variant") ||
    searchParams.get("familyVariant");
  const navigate = useNavigate();
  const { products, loadingProducts, addToCart, toggleWishlist, isInWishlist } =
    useContext(AppContext);
  const { user } = useContext(AuthContext);

  const matchedFromContext = products.find(
    (p) => p.slug === slug || String(p.id) === slug || String(p._id) === slug,
  );
  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [variantDetails, setVariantDetails] = useState(null);
  const [loadingVariant, setLoadingVariant] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeFamilyId, setActiveFamilyId] = useState(null);

  // Prioritize fully fetched single-product API details over condensed catalog list
  const product = fetchedProduct || matchedFromContext;

  const effectiveVariant = variantDetails
    ? { ...selectedVariant, ...variantDetails }
    : selectedVariant;

  // Use only media belonging to the selected variant. Parent product images
  // are used only when the selected variant does not provide its own media.
  const variantGallery = useMemo(() => {
    if (!product) return [];

    const variant = variantDetails
      ? { ...selectedVariant, ...variantDetails }
      : selectedVariant;
    const rawVariant = variant?.rawVariant || {};
    const media = [
      variant?.image,
      variant?.mainImage,
      variant?.imageUrl,
      rawVariant.image,
      rawVariant.mainImage,
      rawVariant.imageUrl,
      ...(Array.isArray(variant?.gallery) ? variant.gallery : []),
      ...(Array.isArray(variant?.images) ? variant.images : []),
      ...(Array.isArray(rawVariant.gallery) ? rawVariant.gallery : []),
      ...(Array.isArray(rawVariant.images) ? rawVariant.images : []),
    ]
      .map((item) =>
        typeof item === "string" ? item : item?.url || item?.src || "",
      )
      .filter(Boolean);

    return Array.from(new Set(media));
  }, [product, selectedVariant, variantDetails]);

  useEffect(() => {
    let isMounted = true;
    if (slug) {
      setFetchingProduct(true);
      productApi
        .getProductById(slug)
        .then((data) => {
          if (isMounted && data) {
            setFetchedProduct(data);
          }
        })
        .catch((err) => {
          console.warn(
            "Notice: could not load individual product details from API:",
            err,
          );
        })
        .finally(() => {
          if (isMounted) setFetchingProduct(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);

  // Recommendations: Customers Also Viewed
  const relatedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products
      .filter(
        (p) =>
          String(p.id) !== String(product?.id) &&
          String(p.slug) !== String(product?.slug),
      )
      .slice(0, 4);
  }, [products, product]);

  const isCatProduct = useMemo(() => {
    if (!product) return false;
    const text =
      `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return text.includes("cat") || text.includes("feline");
  }, [product]);

  const isFamily = Boolean(
    isFamilyProduct(product) &&
    Array.isArray(product?.familyVariants) &&
    product.familyVariants.length > 0,
  );
  const familyVariants = isFamily ? product.familyVariants : [];

  useEffect(() => {
    if (isFamily && familyVariants.length > 0) {
      if (queryFamilyVariantId) {
        const found = familyVariants.find(
          (fv) =>
            String(fv.id) === String(queryFamilyVariantId) ||
            String(fv._id) === String(queryFamilyVariantId) ||
            String(fv.slug) === String(queryFamilyVariantId) ||
            String(fv.sku) === String(queryFamilyVariantId) ||
            String(fv.name).toLowerCase() ===
              String(queryFamilyVariantId).toLowerCase() ||
            String(fv.displayName).toLowerCase() ===
              String(queryFamilyVariantId).toLowerCase() ||
            (fv.weightRange &&
              String(fv.weightRange).toLowerCase() ===
                String(queryFamilyVariantId).toLowerCase()),
        );
        if (found) {
          setActiveFamilyId(found.id || found._id);
          return;
        }
      }
      if (selectedVariant) {
        const match = familyVariants.find(
          (fv) =>
            fv.id === selectedVariant.familyVariantId ||
            fv._id === selectedVariant.familyVariantId ||
            fv.id === selectedVariant.variantId ||
            fv._id === selectedVariant.variantId ||
            fv.slug === selectedVariant.familyVariantSlug ||
            fv.slug === selectedVariant.variantSlug ||
            fv.id === selectedVariant.id ||
            fv._id === selectedVariant.id ||
            (fv.name &&
              selectedVariant.label &&
              (selectedVariant.label
                .toLowerCase()
                .includes(fv.name.toLowerCase()) ||
                fv.name
                  .toLowerCase()
                  .includes(selectedVariant.label.toLowerCase()))),
        );
        if (match) {
          setActiveFamilyId(match.id || match._id);
          return;
        }
      }
      setActiveFamilyId((prev) => {
        if (
          prev &&
          familyVariants.some((fv) => String(fv.id || fv._id) === String(prev))
        ) {
          return prev;
        }
        return familyVariants[0]?.id || familyVariants[0]?._id || null;
      });
    }
  }, [isFamily, familyVariants, queryFamilyVariantId, selectedVariant]);

  const activeFamilyVariant = useMemo(() => {
    if (!isFamily || !familyVariants.length) return null;
    return (
      familyVariants.find((fv) => fv.id === activeFamilyId) || familyVariants[0]
    );
  }, [isFamily, familyVariants, activeFamilyId]);

  const richContent = useMemo(() => {
    if (!product) return "";

    const parentRawContent =
      product?.productDetails?.content ||
      product?.productDetails?.overview ||
      product?.parentContent ||
      product?.content ||
      product?.detailedContent ||
      product?.longDescription ||
      product?.fullDescription ||
      product?.description ||
      product?.shortDescription ||
      "";

    const isMeaningful = (txt) => {
      if (!txt) return false;
      if (typeof txt !== "string") return true;
      const clean = txt
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim();
      const hasMedia = /<(img|table|iframe|video|svg)\b/i.test(txt);
      return clean.length > 0 || hasMedia;
    };

    if (isFamily && activeFamilyVariant) {
      const rawFamily =
        activeFamilyVariant?.productDetails?.content ||
        activeFamilyVariant?.content ||
        activeFamilyVariant?.description ||
        activeFamilyVariant?.shortDescription ||
        effectiveVariant?.content ||
        effectiveVariant?.description;

      if (isMeaningful(rawFamily)) {
        return formatProductRichContent(rawFamily, activeFamilyVariant);
      }

      // If variant inside familyVariants has no content added, fall back to productDetails inside content
      if (isMeaningful(parentRawContent)) {
        return formatProductRichContent(parentRawContent, product);
      }
    }

    const rawVariantContent =
      effectiveVariant?.productDetails?.content ||
      effectiveVariant?.content ||
      effectiveVariant?.description;

    if (isMeaningful(rawVariantContent)) {
      return formatProductRichContent(rawVariantContent, effectiveVariant);
    }

    return formatProductRichContent(parentRawContent, product);
  }, [product, isFamily, activeFamilyVariant, effectiveVariant]);

  const displayShipping = useMemo(() => {
    if (!product) return "";
    return (
      product?.shippingReturns ||
      product?.shippingInfo ||
      product?.shipping ||
      product?.productDetails?.shippingReturns ||
      product?.productDetails?.shipping ||
      ""
    );
  }, [product]);

  const displayReturns = useMemo(() => {
    if (!product) return "";
    return (
      product?.returnPolicies ||
      product?.returnPolicy ||
      product?.returns ||
      product?.productDetails?.returnPolicies ||
      product?.productDetails?.returns ||
      ""
    );
  }, [product]);

  const richShippingContent = useMemo(
    () =>
      displayShipping ? formatProductRichContent(displayShipping, product) : "",
    [displayShipping, product],
  );

  const richReturnsContent = useMemo(
    () =>
      displayReturns ? formatProductRichContent(displayReturns, product) : "",
    [displayReturns, product],
  );

  // Universal packaging and variant options for all products in catalog
  const displayVariants = useMemo(() => {
    if (!product) return [];

    const rawVariantOptions =
      product.optionVariants && product.optionVariants.length > 0
        ? product.optionVariants
        : product.skus && product.skus.length > 0
          ? product.skus
          : [];

    if (rawVariantOptions.length > 0) {
      let rawOptions = rawVariantOptions;

      if (isFamily && activeFamilyVariant) {
        const filtered = rawOptions.filter((ov) =>
          isOptionBelongingToFamily(ov, activeFamilyVariant),
        );
        if (filtered.length > 0) {
          rawOptions = filtered;
        }
      }

      return rawOptions.map((ov, idx) => {
        const varPricing = ov.pricing || {};
        const salePrice = Number(
          varPricing.finalPrice ??
            ov.salePrice ??
            ov.price ??
            product.price ??
            0,
        );
        const regularPrice = Number(
          varPricing.price ??
            ov.regularPrice ??
            ov.price ??
            product.originalPrice ??
            salePrice * 1.25,
        );
        const inv = ov.inventory || {};
        const stockQty =
          inv.stockQuantity ?? ov.stockQuantity ?? ov.stock ?? 25;
        const inStock =
          ov.isAvailable !== false && (inv.isInStock ?? true) && stockQty > 0;

        // Clean SKU / Pack label: show only size/pack info, stripping out any formulation/variant name
        const getCleanSkuLabel = () => {
          if (
            ov.skuLabel &&
            typeof ov.skuLabel === "string" &&
            ov.skuLabel.trim()
          ) {
            return ov.skuLabel.trim();
          }
          if (
            ov.packLabel &&
            typeof ov.packLabel === "string" &&
            ov.packLabel.trim()
          ) {
            return ov.packLabel.trim();
          }
          if (
            ov.sku_label &&
            typeof ov.sku_label === "string" &&
            ov.sku_label.trim()
          ) {
            return ov.sku_label.trim();
          }
          if (
            ov.pack_label &&
            typeof ov.pack_label === "string" &&
            ov.pack_label.trim()
          ) {
            return ov.pack_label.trim();
          }

          let text = String(ov.label || ov.size || ov.name || "").trim();
          if (text.includes(" / ")) {
            const parts = text.split(" / ");
            return parts[parts.length - 1].trim();
          }
          const vName =
            ov.variantName ||
            activeFamilyVariant?.displayName ||
            activeFamilyVariant?.name ||
            "";
          if (vName && text.toLowerCase().includes(vName.toLowerCase())) {
            text = text.replace(
              new RegExp(vName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
              "",
            );
            text = text.replace(/^[\s\-\/\|:]+|[\s\-\/\|:]+$/g, "").trim();
          }
          return text || `Format ${idx + 1}`;
        };

        const packLabel = getCleanSkuLabel();
        const doseMatch = packLabel.match(
          /(\d+)\s*(?:doses?|months?|pack|ct|chews|tablets)/i,
        );
        const doses = doseMatch
          ? parseInt(doseMatch[1])
          : idx === 0
            ? 30
            : idx === 1
              ? 60
              : 90;

        const variantId =
          ov.id || ov._id || ov.variantId || ov.variant?.id || ov.sku || null;

        return {
          // Keep the real backend variant identifier. A generated UI id such
          // as "opt-0" cannot be validated by the order API.
          id: variantId || `opt-${idx}`,
          variantId,
          sku:
            ov.sku ||
            `VSE-${(product.id || "MED").slice(-4).toUpperCase()}-${idx + 1}`,
          label: packLabel,
          size: ov.size || packLabel,
          packLabel: ov.packLabel || packLabel,
          skuLabel: ov.skuLabel || packLabel,
          variantName: ov.variantName || "",
          packSize: ov.packSize || `${doses} Units`,
          dose: ov.dose || `${doses} Daily Doses`,
          dosesCount: doses,
          price: salePrice,
          salePrice: salePrice,
          regularPrice: regularPrice,
          stockQuantity: stockQty,
          inStock: inStock,
          isAvailable: inStock,
          image: ov.image || product.image,
          details:
            ov.details ||
            ov.description ||
            `Clinical veterinary packaging format for ${product.name}.`,
          description: ov.description || ov.details || "",
          badge:
            idx === 1
              ? "Most Popular"
              : idx === 2
                ? "Best Value"
                : "Starter Pack",
          rawVariant: ov,
        };
      });
    }

    // For SIMPLE products without backend optionVariants, do not fabricate artificial variant tiers
    if (!isFamilyProduct(product)) {
      return [];
    }

    // Default clinical packaging tiers for FAMILY products without pre-seeded backend optionVariants
    const baseP = Number(product.price || 24.99);
    const regP = Number(product.originalPrice || baseP * 1.25);
    const code = (product.id || product.slug || "VET").slice(-4).toUpperCase();

    return [
      {
        id: `tier-s-${product.id || "std"}`,
        sku: `VSE-${code}-S30`,
        label: "Small Pack (30 Doses)",
        size: "Small (30 Doses)",
        packSize: "30 Doses / 1-Month Supply",
        dose: "1 Dose Daily Protocol",
        dosesCount: 30,
        price: Number(baseP.toFixed(2)),
        salePrice: Number(baseP.toFixed(2)),
        regularPrice: Number(regP.toFixed(2)),
        stockQuantity: 35,
        inStock: true,
        isAvailable: true,
        image: product.image,
        details:
          "Standard 30-day clinical supply course. Tamper-evident sealed container recommended for routine maintenance.",
        description:
          "Standard 30-day clinical supply course. Tamper-evident sealed container recommended for routine maintenance.",
        badge: "Starter Format",
      },
      {
        id: `tier-m-${product.id || "std"}`,
        sku: `VSE-${code}-M60`,
        label: "Medium Pack (60 Doses)",
        size: "Medium (60 Doses)",
        packSize: "60 Doses / 2-Month Supply",
        dose: "1-2 Doses Daily Protocol",
        dosesCount: 60,
        price: Number((baseP * 1.88).toFixed(2)),
        salePrice: Number((baseP * 1.88).toFixed(2)),
        regularPrice: Number((regP * 1.95).toFixed(2)),
        stockQuantity: 28,
        inStock: true,
        isAvailable: true,
        image: product.image,
        details:
          "Extended 60-day veterinary supply course. Recommended for continuous therapy and symptom relief with savings.",
        description:
          "Extended 60-day veterinary supply course. Recommended for continuous therapy and symptom relief with savings.",
        badge: "Most Popular",
      },
      {
        id: `tier-l-${product.id || "std"}`,
        sku: `VSE-${code}-L90`,
        label: "Large Pack (90 Doses)",
        size: "Large (90 Doses)",
        packSize: "90 Doses / 3-Month Supply",
        dose: "Clinical Multi-Pack Protocol",
        dosesCount: 90,
        price: Number((baseP * 2.65).toFixed(2)),
        salePrice: Number((baseP * 2.65).toFixed(2)),
        regularPrice: Number((regP * 2.85).toFixed(2)),
        stockQuantity: 19,
        inStock: true,
        isAvailable: true,
        image: product.image,
        details:
          "Max-value 90-day clinic multi-pack. Tamper-evident bulk packaging with lowest cost per daily treatment dose.",
        description:
          "Max-value 90-day clinic multi-pack. Tamper-evident bulk packaging with lowest cost per daily treatment dose.",
        badge: "Best Value",
      },
    ];
  }, [product]);

  const parsedDisplayVariants = displayVariants.map((variant) => ({
    ...variant,
    ...splitSizeAndPackLabel(variant.label),
  }));
  const hasSeparateSizeAndPack = parsedDisplayVariants.some(
    (variant) => variant.pack,
  );
  const selectedSizePack = splitSizeAndPackLabel(selectedVariant?.label);
  const sizeChoices = [
    ...new Set(
      parsedDisplayVariants.map((variant) => variant.size).filter(Boolean),
    ),
  ];
  const packChoices = parsedDisplayVariants.filter(
    (variant, index, variants) =>
      variant.pack &&
      (!selectedSizePack.size || variant.size === selectedSizePack.size) &&
      variants.findIndex(
        (candidate) =>
          candidate.size === variant.size && candidate.pack === variant.pack,
      ) === index,
  );
  const selectVariantBy = (predicate) => {
    const variant = parsedDisplayVariants.find(predicate);
    if (variant) {
      setSelectedVariant(variant);
      if (variant.image) setActiveImage(variant.image);
    }
  };

  const handleSelectFamilyVariant = (fv) => {
    if (!fv) return;
    const fvId = fv.id || fv._id;
    setActiveFamilyId(fvId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("familyVariantId", fvId);
        return next;
      },
      { replace: true },
    );
    const fImg = fv.image || fv.mainImage || fv.imageUrl;
    if (fImg) {
      setActiveImage(fImg);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (product && (product.id || product._id)) {
      const pId = product.id || product._id;
      setLoadingReviews(true);
      reviewApi
        .getProductReviews(pId)
        .then((data) => {
          if (isMounted) {
            setReviews(Array.isArray(data) ? data : []);
            setLoadingReviews(false);
          }
        })
        .catch((err) => {
          console.error("Error fetching product reviews:", err);
          if (isMounted) {
            setReviews([]);
            setLoadingReviews(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [product]);

  useEffect(() => {
    if (product) {
      const initialImg =
        selectedVariant?.image ||
        activeFamilyVariant?.image ||
        activeFamilyVariant?.mainImage ||
        product.image;
      if (initialImg) {
        setActiveImage(initialImg);
      }
      if (displayVariants.length > 0) {
        if (
          !selectedVariant ||
          !displayVariants.some((v) => v.id === selectedVariant.id)
        ) {
          const defaultVar =
            displayVariants.find((v) => v.isAvailable !== false) ||
            displayVariants[0];
          setSelectedVariant(defaultVar);
        }
      } else {
        setSelectedVariant(null);
        setVariantDetails(null);
      }
    }
  }, [product, displayVariants]);

  // When selectedVariant changes, update active image and fetch variant API details
  useEffect(() => {
    if (!selectedVariant) {
      setVariantDetails(null);
      return;
    }

    if (selectedVariant.image) {
      setActiveImage(selectedVariant.image);
    }

    const prodSlug = product?.slug || product?.id;
    const varSlug =
      selectedVariant.id || selectedVariant.sku || selectedVariant.slug;

    if (prodSlug && varSlug) {
      let isMounted = true;
      setLoadingVariant(true);
      productApi
        .getProductVariant(prodSlug, varSlug)
        .then((data) => {
          if (isMounted && data) {
            setVariantDetails(data);
            if (data.image) setActiveImage(data.image);
          }
        })
        .catch((err) => {
          console.warn(
            "Notice: getProductVariant call error, using embedded data:",
            err,
          );
        })
        .finally(() => {
          if (isMounted) setLoadingVariant(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [selectedVariant, product?.slug, product?.id]);

  useEffect(() => {
    if (variantGallery.length > 0) {
      setActiveImage(variantGallery[0]);
    }
  }, [selectedVariant?.id, variantDetails?.id, variantGallery.join("|")]);

  const activeStockQuantity = effectiveVariant
    ? (effectiveVariant.inventory?.stockQuantity ??
      effectiveVariant.stockQuantity ??
      effectiveVariant.stock ??
      0)
    : product
      ? (product.stockQuantity ?? 0)
      : 0;

  const activePrice = Number(
    effectiveVariant
      ? (effectiveVariant.pricing?.finalPrice ??
          effectiveVariant.price ??
          effectiveVariant.salePrice ??
          product?.price ??
          0)
      : (product?.price ?? 0),
  );

  const activeRegularPrice = Number(
    effectiveVariant
      ? (effectiveVariant.pricing?.price ??
          effectiveVariant.regularPrice ??
          product?.originalPrice ??
          activePrice)
      : (product?.originalPrice ?? activePrice),
  );

  // For SINGLE products: prioritize product description
  // For FAMILY products: keep as-is (variant description first)
  const isFam = isFamilyProduct(product);
  const isMeaningfulText = (t) => {
    if (!t || typeof t !== "string") return Boolean(t);
    return (
      t
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim().length > 0
    );
  };

  const displayedDescription = !isFam
    ? (isMeaningfulText(product?.description) && product.description) ||
      (isMeaningfulText(product?.shortDescription) &&
        product.shortDescription) ||
      (isMeaningfulText(effectiveVariant?.description) &&
        effectiveVariant.description) ||
      (isMeaningfulText(effectiveVariant?.details) &&
        effectiveVariant.details) ||
      ""
    : (isMeaningfulText(effectiveVariant?.description) &&
        effectiveVariant.description) ||
      (isMeaningfulText(effectiveVariant?.details) &&
        effectiveVariant.details) ||
      (isMeaningfulText(product?.productDetails?.overview) &&
        product.productDetails.overview) ||
      (isMeaningfulText(product?.productDetails?.description) &&
        product.productDetails.description) ||
      (isMeaningfulText(product?.shortDescription) &&
        product.shortDescription) ||
      (isMeaningfulText(product?.description) && product.description) ||
      "";

  const activeSku = effectiveVariant?.sku || product?.sku;

  useEffect(() => {
    if (quantity > activeStockQuantity && activeStockQuantity > 0) {
      setQuantity(Math.max(1, activeStockQuantity));
    }
  }, [effectiveVariant, activeStockQuantity]);

  if (!product) {
    if (loadingProducts || fetchingProduct) {
      return (
        <div className="py-20 bg-[#F7FAFC] min-h-screen flex flex-col items-center justify-center text-center select-none">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0874C9] mb-4"></div>
          <p className="text-sm text-[#627D98] font-medium">
            Loading product details...
          </p>
        </div>
      );
    }

    return (
      <div className="py-20 bg-[#F7FAFC] min-h-screen flex flex-col items-center justify-center text-center select-none text-left">
        <h2 className="font-heading font-extrabold text-2xl text-[#102A43]">
          Product Not Found
        </h2>
        <p className="text-sm text-[#627D98] mt-2 mb-6">
          We couldn't find the product matching the request.
        </p>
        <Link
          to="/shop"
          className="bg-[#0874C9] hover:bg-[#F28C18] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer"
        >
          Back to Shop Catalog
        </Link>
      </div>
    );
  }

  const isWish = isInWishlist(product.id);

  const activeStockStatus = effectiveVariant
    ? effectiveVariant.inventory?.stockStatus ||
      (activeStockQuantity <= 0
        ? "OUT_OF_STOCK"
        : activeStockQuantity <= 5
          ? "LOW_STOCK"
          : "IN_STOCK")
    : (product.stockStatus ?? "IN_STOCK");

  const isOutOfStock = effectiveVariant
    ? effectiveVariant.isAvailable === false ||
      (effectiveVariant.inventory
        ? !effectiveVariant.inventory.isInStock
        : activeStockQuantity === 0)
    : product.stockQuantity === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    let activeVariant = effectiveVariant || selectedVariant;
    if (
      !activeVariant &&
      product.optionVariants &&
      product.optionVariants.length > 0
    ) {
      activeVariant =
        product.optionVariants.find((v) => v.isAvailable !== false) ||
        product.optionVariants[0];
    }

    if (activeVariant) {
      const cartProduct = {
        ...product,
        id: `${product.id}__${activeVariant.id || activeVariant.sku}`,
        baseProductId: product.id,
        productId: product.id,
        name: `${product.name} - ${activeVariant.label || activeVariant.size || "Option"}`,
        title: `${product.name} - ${activeVariant.label || activeVariant.size || "Option"}`,
        image: activeVariant.image || product.image,
        price: activePrice,
        sellingPrice: activePrice,
        originalPrice: activeRegularPrice,
        actualPrice: activeRegularPrice,
        sku: activeSku,
        stockQuantity: activeStockQuantity,
        stockLimit: activeStockQuantity,
        stockStatus: activeStockStatus,
        selectedVariantName: activeVariant.label || activeVariant.size,
        selectedVariantId:
          activeVariant.variantId ||
          activeVariant.id ||
          activeVariant._id ||
          activeVariant.sku ||
          null,
      };
      addToCart(cartProduct, quantity);
    } else {
      const cartProduct = {
        ...product,
        productId: product.id,
      };
      addToCart(cartProduct, quantity);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    let activeVariant = effectiveVariant || selectedVariant;
    if (
      !activeVariant &&
      product.optionVariants &&
      product.optionVariants.length > 0
    ) {
      activeVariant =
        product.optionVariants.find((v) => v.isAvailable !== false) ||
        product.optionVariants[0];
    }

    if (activeVariant) {
      const cartProduct = {
        ...product,
        id: `${product.id}__${activeVariant.id || activeVariant.sku}`,
        baseProductId: product.id,
        productId: product.id,
        name: `${product.name} - ${activeVariant.label || activeVariant.size || "Option"}`,
        title: `${product.name} - ${activeVariant.label || activeVariant.size || "Option"}`,
        image: activeVariant.image || product.image,
        price: activePrice,
        sellingPrice: activePrice,
        originalPrice: activeRegularPrice,
        actualPrice: activeRegularPrice,
        sku: activeSku,
        stockQuantity: activeStockQuantity,
        stockLimit: activeStockQuantity,
        stockStatus: activeStockStatus,
        selectedVariantName: activeVariant.label || activeVariant.size,
        selectedVariantId:
          activeVariant.variantId ||
          activeVariant.id ||
          activeVariant._id ||
          activeVariant.sku ||
          null,
      };
      addToCart(cartProduct, quantity);
    } else {
      const cartProduct = {
        ...product,
        productId: product.id,
      };
      addToCart(cartProduct, quantity);
    }
    navigate("/checkout");
  };

  return (
    <div className="py-10 bg-[#F7FAFC] min-h-screen border-b border-[#D9E8F2] select-none text-left">
      <div className="container-custom">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center gap-2 text-xs font-bold text-[#627D98] uppercase tracking-wider">
          <Link
            to="/shop"
            className="hover:text-[#0874C9] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Shop Catalog</span>
          </Link>
          <span>/</span>
          <span className="text-[#102A43] truncate max-w-xs">
            {product.name}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white border border-[#D9E8F2] rounded-3xl p-6 md:p-10 shadow-sm items-start">
          {/* Left Column: Image Gallery Preview */}
          <div className="lg:col-span-6 flex flex-col md:flex-row gap-4 w-full">
            {/* Thumbnails Sidebar */}
            {(variantGallery.length > 1 ||
              (!selectedVariant && product.gallery?.length > 1)) && (
              <div className="flex md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 shrink-0 md:w-20">
                {(variantGallery.length > 0
                  ? variantGallery
                  : product.gallery
                ).map((imgUrl, idx) => {
                  const isActive = activeImage === imgUrl;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(imgUrl)}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 bg-[#F7FAFC] transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? "border-[#0874C9] shadow-sm shadow-[#0874C9]/10"
                          : "border-[#D9E8F2] hover:border-[#0874C9]/50"
                      }`}
                    >
                      <ProductImage
                        src={imgUrl}
                        alt={`${product.name} preview ${idx + 1}`}
                        product={product}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Image View */}
            <div className="aspect-square flex-grow bg-[#F7FAFC] border border-[#D9E8F2] rounded-2xl overflow-hidden relative shadow-inner order-1 md:order-2">
              <ProductImage
                src={activeImage || variantGallery[0] || product.image}
                alt={product.name}
                product={product}
                className="w-full h-full object-cover transition-all duration-500"
              />
              {product.discountPercent > 0 && (
                <div className="absolute top-4 left-4 bg-[#F28C18] text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                  {product.discountPercent}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Meta details and Purchase Controls */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0874C9] bg-[#EAF5FC] px-2.5 py-1 rounded-md border border-[#0874C9]/10">
                {product.category}
              </span>
              <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-[#102A43] mt-3 leading-tight flex flex-wrap items-baseline gap-2">
                <span>{effectiveVariant?.name || product.name}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 text-xs font-semibold text-[#627D98]">
                {reviews.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const avgRating =
                          reviews.reduce(
                            (acc, r) => acc + Number(r.rating || 5),
                            0,
                          ) / reviews.length;
                        return (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(avgRating)
                                ? "fill-[#F28A16] text-[#F28A16]"
                                : "fill-transparent text-[#CBD5E1]"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="font-extrabold text-[#102A43]">
                      {(
                        reviews.reduce(
                          (acc, r) => acc + Number(r.rating || 5),
                          0,
                        ) / reviews.length
                      ).toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("reviews")}
                      className="text-[#0874C9] hover:underline cursor-pointer font-bold ml-0.5"
                    >
                      ({reviews.length} review{reviews.length > 1 ? "s" : ""})
                    </button>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>

            {requiresVet && (
              <div className="mt-2 mb-1 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0874C9] px-3.5 py-1.5 text-xs font-extrabold uppercase text-white shadow-xs">
                  <ShieldCheck size={14} className="text-amber-300" />
                  VERIFIED VETERINARIAN REQUIRED
                </span>
                {userLacksVet && (
                  <Link
                    to={user ? "/account/vet-verification" : "/login"}
                    className="text-xs font-extrabold text-[#d9aa3d] hover:text-amber-700 underline cursor-pointer"
                  >
                    Apply for Verification
                  </Link>
                )}
              </div>
            )}

            {/* Price block */}
            <div className="bg-[#F7FAFC] border border-[#D9E8F2]/60 p-5 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#627D98] font-bold uppercase tracking-wider">
                  Price
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-[#0874C9]">
                    ${activePrice.toFixed(2)}
                  </span>
                  {activeRegularPrice > activePrice && (
                    <span className="text-sm text-[#627D98] line-through font-semibold">
                      ${activeRegularPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Variant / Product Description */}
            {displayedDescription && (
              <div className="text-sm text-[#627D98] leading-relaxed">
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

            {/* Selected Formulation (Only show the active variant, not any other variant) */}
            {isFamily && activeFamilyVariant && (
              <div className="flex flex-col gap-2.5 border-t border-[#D9E8F2] pt-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#627D98] block">
                    Selected Formulation:
                  </span>
                  {familyVariants.length > 1 && (
                    <Link
                      to={`/product/${product.slug || product.id || slug}/variants`}
                      className="text-[11px] font-bold text-[#0874C9] hover:underline flex items-center gap-1"
                    >
                      Change Formulation →
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <span className="px-4.5 py-2.5 rounded-xl text-xs md:text-sm font-bold border bg-[#0874C9] text-white border-[#0874C9] shadow-sm shadow-[#0874C9]/10 inline-flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    {activeFamilyVariant.displayName ||
                      activeFamilyVariant.name ||
                      activeFamilyVariant.label ||
                      activeFamilyVariant.weightRange}
                  </span>
                </div>
              </div>
            )}

            {/* Variant Selector */}
            {displayVariants &&
              displayVariants.length > 0 &&
              !hasSeparateSizeAndPack && (
                <div className="flex flex-col gap-3.5 border-t border-[#D9E8F2] pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#627D98] block">
                      Select {product.optionLabel || "Packaging Option"}:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {displayVariants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const isAvailable =
                        v.isAvailable !== false && v.inStock !== false;
                      return (
                        <button
                          key={v.id}
                          disabled={!isAvailable}
                          onClick={() => {
                            setSelectedVariant(v);
                            if (v.image) setActiveImage(v.image);
                          }}
                          className={`px-4.5 py-2.5 rounded-xl text-xs md:text-sm font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#0874C9] text-white border-[#0874C9] shadow-sm shadow-[#0874C9]/10"
                              : isAvailable
                                ? "bg-white text-[#102A43] border-[#D9E8F2] hover:border-[#0874C9] hover:bg-[#F7FAFC]"
                                : "bg-slate-50 text-slate-400 border-[#D9E8F2] opacity-40 cursor-not-allowed"
                          }`}
                        >
                          {v.skuLabel || v.packLabel || v.label}
                          {!isAvailable && " (Out of Stock)"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {hasSeparateSizeAndPack && (
              <div className="flex flex-col gap-4 border-t border-[#D9E8F2] pt-5">
                <div>
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-[#627D98]">
                    Select Size:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {sizeChoices.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() =>
                          selectVariantBy(
                            (variant) =>
                              variant.size === size &&
                              (!selectedSizePack.pack ||
                                variant.pack === selectedSizePack.pack),
                          )
                        }
                        className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                          selectedSizePack.size === size
                            ? "border-[#0874C9] bg-[#0874C9] text-white shadow-sm"
                            : "border-[#D9E8F2] bg-white text-[#627D98] hover:border-[#0874C9]"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-[#627D98]">
                    Select Dose / Pack:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {packChoices.map((variant) => (
                      <button
                        key={`${variant.size}-${variant.pack}`}
                        type="button"
                        onClick={() =>
                          selectVariantBy(
                            (candidate) =>
                              candidate.pack === variant.pack &&
                              (!selectedSizePack.size ||
                                candidate.size === selectedSizePack.size),
                          )
                        }
                        className={`flex min-w-[100px] flex-col items-center rounded-xl border px-4 py-2.5 text-xs font-bold transition-all ${
                          selectedSizePack.pack === variant.pack
                            ? "border-[#0874C9] bg-[#0874C9] text-white shadow-sm"
                            : "border-[#D9E8F2] bg-white text-[#627D98] hover:border-[#0874C9]"
                        }`}
                      >
                        <span>{variant.pack}</span>
                        <span className="mt-0.5 text-[11px]">
                          ${Number(variant.price || 0).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Purchase triggers matching the unified design */}
            <div className="flex flex-col gap-4 border-t border-[#D9E8F2] pt-5">
              {/* Row 1: Quantity Increment & Price */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {!isOutOfStock ? (
                    <div className="inline-flex items-center rounded-xl border border-[#D9E8F2] bg-white shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="px-3.5 py-2.5 text-xs font-bold text-[#627D98] hover:text-[#102A43] disabled:opacity-30 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-heading text-sm font-black text-[#102A43]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            Math.min(activeStockQuantity, q + 1),
                          )
                        }
                        disabled={quantity >= activeStockQuantity}
                        className="px-3.5 py-2.5 text-xs font-bold text-[#627D98] hover:text-[#102A43] cursor-pointer disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-red-500 font-bold uppercase tracking-wider bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      Currently Unavailable
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#627D98] block">
                      Calculated Total:
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-heading text-2xl font-black text-[#102A43]">
                        ${(activePrice * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Add To Cart, Instant Buy, Heart */}
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={
                    userLacksVet
                      ? () =>
                          navigate(
                            user ? "/account/vet-verification" : "/login",
                          )
                      : handleAddToCart
                  }
                  disabled={isOutOfStock || userLacksVet}
                  className={`flex-1 px-6 py-3.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                    userLacksVet || isOutOfStock
                      ? "bg-[#0874C9]/40 cursor-not-allowed"
                      : "bg-[#0874C9] hover:bg-[#073B66] cursor-pointer hover:-translate-y-0.5"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    {userLacksVet
                      ? "Verification Required"
                      : isOutOfStock
                        ? "Out of Stock"
                        : "Add to Cart"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={
                    userLacksVet
                      ? () =>
                          navigate(
                            user ? "/account/vet-verification" : "/login",
                          )
                      : handleBuyNow
                  }
                  disabled={isOutOfStock || userLacksVet}
                  className="flex-1 px-6 py-3.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider bg-[#073B66] text-white hover:bg-[#0B2D4F] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Zap className="w-4 h-4 text-[#18A9E5]" />
                  <span>Instant Buy</span>
                </button>

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`p-3.5 rounded-xl border border-[#D9E8F2] shadow-2xs hover:shadow-xs transition-all cursor-pointer bg-white shrink-0 ${
                    isWish
                      ? "text-red-500 border-red-200 hover:bg-red-50/30"
                      : "text-[#627D98] hover:text-[#0874C9] hover:border-[#0874C9]/30"
                  }`}
                  aria-label="Toggle Wishlist"
                >
                  <Heart
                    className={`w-4 h-4 ${isWish ? "fill-red-500" : ""}`}
                  />
                </button>
              </div>

              {/* Bottom Logistics Note */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#D9E8F2]/60 text-[11px] font-semibold text-[#627D98]">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#0874C9]" />
                  <span>Free Insured Cold-Chain Shipping over $49</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#F28A16]" />
                  <span>30-Day Guaranteed Returns</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PRODUCT DETAILS TABS (FULL DESCRIPTION, SHIPPING INFO, REVIEWS)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-12 bg-white border border-[#D9E8F2] rounded-3xl p-6 md:p-8 shadow-sm text-left">
          <div className="border-b border-[#D9E8F2] flex items-center gap-6 sm:gap-8 md:gap-10 mb-6 overflow-x-auto scrollbar-none whitespace-nowrap">
            {[
              { id: "description", label: "Description" },
              { id: "shipping", label: "Shipping" },
              { id: "returns", label: "Returns" },
              { id: "reviews", label: `Reviews (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3.5 text-xs sm:text-sm font-extrabold tracking-wider uppercase transition-colors cursor-pointer border-b-2 -mb-[2px] shrink-0 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-[#0874C9] text-[#0874C9]"
                    : "border-transparent text-[#627D98] hover:text-[#0874C9]"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="text-sm text-[#627D98] leading-relaxed">
            {activeTab === "description" && (
              <div className="space-y-6 text-left">
                {product.prescriptionRequired && (
                  <div className="p-4.5 rounded-2xl bg-[#EAF5FC] border border-[#0874C9]/30 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#0874C9] shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-heading font-black uppercase tracking-wider text-[#0B2D4F]">
                        Veterinary Prescription Required
                      </h5>
                      <p className="text-xs font-medium text-[#102A43] mt-1 leading-relaxed">
                        Veterinary prescription may be required for dispensing
                        this item. Please ensure you have your registered
                        veterinarian's prescription details ready during
                        checkout.
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Product Overview on TOP */}
                <div>
                  <h4 className="text-sm font-heading font-black uppercase tracking-wider text-[#102A43] mb-3">
                    Clinical Overview &amp; Product Summary
                  </h4>
                  {richContent ? (
                    <div
                      className="variant-rich-content variant-rich-text rich-content-display product-rich-content font-sans"
                      dangerouslySetInnerHTML={{ __html: richContent }}
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-medium text-[#627D98] leading-relaxed whitespace-pre-line">
                      {product.fullDescription || product.description}
                    </p>
                  )}
                </div>

                {/* Key Health Benefits (only if provided in product data) */}
                {Array.isArray(product.benefits) &&
                  product.benefits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-heading font-black uppercase tracking-wider text-[#102A43] mb-3">
                        Key Health Benefits
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {product.benefits.map((benefit, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#102A43]"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#0874C9] shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-4 text-left">
                <h4 className="text-sm font-heading font-black uppercase tracking-wider text-[#102A43] mb-3">
                  Shipping &amp; Delivery Information
                </h4>
                {richShippingContent ? (
                  <div
                    className="variant-rich-content variant-rich-text rich-content-display product-rich-content font-sans"
                    dangerouslySetInnerHTML={{ __html: richShippingContent }}
                  />
                ) : displayShipping ? (
                  <p className="text-xs sm:text-sm font-medium text-[#627D98] leading-relaxed whitespace-pre-line">
                    {displayShipping}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-[#627D98]/70 leading-relaxed">
                    Standard shipping is available for this item. Orders are
                    processed within 24-48 business hours with verified
                    tracking.
                  </p>
                )}
              </div>
            )}

            {activeTab === "returns" && (
              <div className="space-y-4 text-left">
                <h4 className="text-sm font-heading font-black uppercase tracking-wider text-[#102A43] mb-3">
                  Returns &amp; Refund Policy
                </h4>
                {richReturnsContent ? (
                  <div
                    className="variant-rich-content variant-rich-text rich-content-display product-rich-content font-sans"
                    dangerouslySetInnerHTML={{ __html: richReturnsContent }}
                  />
                ) : displayReturns ? (
                  <p className="text-xs sm:text-sm font-medium text-[#627D98] leading-relaxed whitespace-pre-line">
                    {displayReturns}
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-medium text-[#627D98]/70 leading-relaxed">
                    Unopened items in original packaging may be returned within
                    30 days of receipt. Please contact customer service for
                    return authorizations.
                  </p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="flex flex-col gap-6 text-left">
                {loadingReviews ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 text-[#0874C9] animate-spin" />
                    <p className="text-xs text-[#627D98] font-medium">
                      Loading customer reviews...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Reviews Summary Banner - ONLY IF reviews exist */}
                    {reviews.length > 0 && (
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#F7FAFC] to-[#EAF5FC]/50 border border-[#D9E8F2] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                          <span className="text-xs font-heading font-black uppercase tracking-wider text-[#0874C9] block mb-1">
                            Verified Customer Feedback
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-heading font-black text-4xl text-[#102A43]">
                              {(
                                reviews.reduce(
                                  (acc, r) => acc + (r.rating || 5),
                                  0,
                                ) / reviews.length
                              ).toFixed(1)}
                            </span>
                            <div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className="w-4 h-4 text-amber-400 fill-amber-400"
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-semibold text-[#627D98] mt-0.5 block">
                                Based on {reviews.length} verified review
                                {reviews.length > 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-[#627D98] border-t sm:border-t-0 sm:border-l border-[#D9E8F2] pt-4 sm:pt-0 sm:pl-6">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>100% Verified Purchases</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Review List */}
                    {reviews.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                        <MessageSquare className="w-8 h-8 text-[#627D98]/40 mb-3" />
                        <h4 className="font-heading font-bold text-sm text-[#102A43]">
                          No reviews yet
                        </h4>
                        <p className="text-xs text-[#627D98] mt-1">
                          Be the first to share your experience with this
                          product after placing an order!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((rev) => {
                          const reviewerName =
                            rev.author ||
                            rev.authorName ||
                            rev.user?.fullName ||
                            rev.user?.name ||
                            (rev.user?.firstName
                              ? `${rev.user.firstName} ${rev.user.lastName || ""}`.trim()
                              : null) ||
                            rev.userName ||
                            rev.customerName ||
                            rev.fullName ||
                            rev.name ||
                            (rev.user?.email
                              ? rev.user.email.split("@")[0]
                              : null) ||
                            (rev.email ? rev.email.split("@")[0] : null) ||
                            "Verified Customer";

                          const reviewerInitial = reviewerName
                            ? reviewerName.trim().charAt(0).toUpperCase()
                            : "V";

                          const rawDate =
                            rev.date ||
                            rev.createdAt ||
                            rev.created_at ||
                            rev.reviewDate;

                          const reviewDate = rawDate
                            ? isNaN(new Date(rawDate).getTime())
                              ? rawDate
                              : new Date(rawDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                            : "Recent Purchase";

                          return (
                            <div
                              key={rev.id || rev._id}
                              className="p-5 rounded-2xl border border-[#D9E8F2]/80 bg-white hover:border-[#0874C9]/30 transition-all shadow-2xs space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="size-9 rounded-full bg-[#EAF5FC] text-[#0874C9] font-heading font-black text-xs flex items-center justify-center">
                                    {reviewerInitial}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-heading font-black text-xs text-[#102A43]">
                                        {reviewerName}
                                      </h5>
                                      {rev.verified && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                          <ShieldCheck className="w-3 h-3" />
                                          Verified Buyer
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-3 h-3 ${
                                            star <= (rev.rating || 5)
                                              ? "text-amber-400 fill-amber-400"
                                              : "text-slate-200 fill-slate-100"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[11px] font-semibold text-[#627D98]/70">
                                  {reviewDate}
                                </span>
                              </div>

                              {rev.title && (
                                <h6 className="font-heading font-bold text-xs text-[#102A43] pt-1 pl-12">
                                  {rev.title}
                                </h6>
                              )}

                              {rev.comment && (
                                <p className="text-xs text-[#627D98] leading-relaxed pt-1 pl-12">
                                  {rev.comment}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Related Products: Customers Also Viewed */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 text-left">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#D9E8F2]">
              <div>
                <span className="text-[10px] font-heading font-black uppercase tracking-widest text-[#0874C9] block">
                  Recommendations
                </span>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-[#102A43] mt-0.5">
                  Customers Also Viewed
                </h3>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold text-[#0874C9] hover:underline flex items-center gap-1"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => {
                const rpPrice = Number(
                  rp.price ?? rp.sellingPrice ?? 0,
                ).toFixed(2);
                return (
                  <div
                    key={rp.id}
                    className="bg-white border border-[#D9E8F2] rounded-2xl p-4 flex flex-col justify-between hover:border-[#0874C9]/40 hover:shadow-sm transition-all group"
                  >
                    <div>
                      <Link
                        to={getProductUrl(rp)}
                        className="relative w-full h-44 rounded-xl bg-[#F7FAFC] border border-[#D9E8F2]/60 flex items-center justify-center p-3 overflow-hidden mb-3 block"
                      >
                        <ProductImage
                          src={rp.image}
                          alt={rp.name}
                          product={rp}
                          className="max-h-[90%] max-w-[90%] object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        {rp.category && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#EAF5FC] text-[#0874C9] text-[9px] font-black uppercase border border-[#0874C9]/15">
                            {typeof rp.category === "object"
                              ? rp.category.name
                              : rp.category}
                          </span>
                        )}
                      </Link>

                      <h4 className="font-heading font-bold text-sm text-[#102A43] line-clamp-2 leading-snug group-hover:text-[#0874C9] transition-colors">
                        <Link to={getProductUrl(rp)}>{rp.name}</Link>
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#D9E8F2]/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#627D98] block">
                          Price
                        </span>
                        <span className="font-heading font-black text-sm text-[#102A43]">
                          ${rpPrice}
                        </span>
                      </div>
                      <Link
                        to={getProductUrl(rp)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#073B66] text-white text-xs font-bold hover:bg-[#0874C9] transition-colors shadow-2xs"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
