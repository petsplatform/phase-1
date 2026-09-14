import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Check,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ShoppingCart,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  CheckCircle2,
  Heart,
  Home,
  ShieldCheck,
  Truck,
  RotateCcw,
  Info,
  Plus,
  Minus,
  PawPrint,
  Award,
  Zap,
  CheckCircle,
  SlidersHorizontal,
  ChevronDown,
  Lock,
  Eye,
} from "lucide-react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { catalogApi } from "../api/catalogApi";
import { cartApi } from "../api/cartApi";
import { reviewApi } from "../api/reviewApi";
import { useToast } from "../context/ToastContext";
import { getStoredAuthUser } from "../services/authService";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
} from "../utils/productUtils";
import { formatProductRichContent } from "../utils/htmlUtils";
import {
  isWishlistItemSaved,
  toggleWishlistItem,
  WISHLIST_UPDATED_EVENT,
} from "../services/wishlistService";

const WEIGHT_VARIANTS_DOGS = [
  {
    weight: "2.8-5.5 lbs",
    color: "Yellow",
    colorHex: "#eab308",
    multiplier: 1.0,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.95, regMult: 2.75, tier: "Most Popular" },
    ],
  },
  {
    weight: "5.6-11 lbs",
    color: "Purple",
    colorHex: "#a855f7",
    multiplier: 1.03,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7, tier: "Most Popular" },
      {
        doses: "12 Doses",
        doseMult: 3.76,
        regMult: 5.3,
        tier: "Best Value (Save 35%)",
      },
    ],
  },
  {
    weight: "11.1-22 lbs",
    color: "Caramel",
    colorHex: "#d97706",
    multiplier: 1.09,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7, tier: "Most Popular" },
      {
        doses: "12 Doses",
        doseMult: 3.76,
        regMult: 5.3,
        tier: "Best Value (Save 35%)",
      },
    ],
  },
  {
    weight: "22.1-44 lbs",
    color: "Teal",
    colorHex: "#0d9488",
    multiplier: 1.18,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7, tier: "Most Popular" },
      {
        doses: "12 Doses",
        doseMult: 3.76,
        regMult: 5.3,
        tier: "Best Value (Save 35%)",
      },
    ],
  },
  {
    weight: "44.1-88 lbs",
    color: "Red",
    colorHex: "#dc2626",
    multiplier: 1.32,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7, tier: "Most Popular" },
      {
        doses: "12 Doses",
        doseMult: 3.76,
        regMult: 5.3,
        tier: "Best Value (Save 35%)",
      },
    ],
  },
  {
    weight: "above 88 lbs",
    color: "Brown",
    colorHex: "#78350f",
    multiplier: 1.55,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7, tier: "Most Popular" },
      {
        doses: "12 Doses",
        doseMult: 3.76,
        regMult: 5.3,
        tier: "Best Value (Save 35%)",
      },
    ],
  },
];

const WEIGHT_VARIANTS_CATS = [
  {
    weight: "2.8-5.5 lbs",
    color: "Yellow",
    colorHex: "#eab308",
    multiplier: 1.0,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.95, regMult: 2.75, tier: "Most Popular" },
    ],
  },
  {
    weight: "5.6-16.5 lbs",
    color: "Teal",
    colorHex: "#0d9488",
    multiplier: 1.15,
    packs: [
      {
        doses: "3 Doses",
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Regimen",
      },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7, tier: "Most Popular" },
      {
        doses: "12 Doses",
        doseMult: 3.76,
        regMult: 5.3,
        tier: "Best Value (Save 35%)",
      },
    ],
  },
];

const distinctVariantLabel = (productTitle, candidate, fallback) => {
  const value = String(candidate || "").trim();
  const normalizedValue = value.toLowerCase().replace(/[()]/g, "").trim();
  const normalizedTitle = String(productTitle || "").toLowerCase().replace(/[()]/g, "").trim();
  return value && normalizedValue !== normalizedTitle ? value : fallback;
};

export default function ProductVariant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState({});
  const [addingState, setAddingState] = useState({});
  const [wishlistVersion, setWishlistVersion] = useState(0);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [activePackKey, setActivePackKey] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);

  useEffect(() => {
    const handleWishlistChange = () => setWishlistVersion((v) => v + 1);
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistChange);
    window.addEventListener("storage", handleWishlistChange);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistChange);
      window.removeEventListener("storage", handleWishlistChange);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setProduct(null);

    catalogApi
      .getProduct(id)
      .then((p) => {
        if (!active) return;
        setProduct(p);
      })
      .catch((err) => {
        console.error("Failed to load product for variant page:", err);
        showToast(err.message || "Could not load product.", "error");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, showToast]);

  useEffect(() => {
    const targetId = product?.id || id;
    if (!targetId) return;
    reviewApi
      .getProductReviews(targetId)
      .then((data) => {
        setReviewsList(Array.isArray(data) ? data : []);
      })
      .catch(() => setReviewsList([]));
  }, [product?.id, id]);

  const totalReviews = reviewsList.length || Number(product?.reviews ?? 0);
  const avgRating =
    reviewsList.length > 0
      ? (
          reviewsList.reduce(
            (acc, r) => acc + Number(r.rating || r.star || 5),
            0,
          ) / reviewsList.length
        ).toFixed(1)
      : product?.rating && Number(product.rating) > 0
        ? Number(product.rating).toFixed(1)
        : null;

  // Safety Guard: if product is loaded and is a SIMPLE product (not FAMILY), redirect directly to product details!
  useEffect(() => {
    if (product && !isLoading) {
      if (!isFamilyProduct(product)) {
        navigate(`/products/${product.id || id}`, { replace: true });
      }
    }
  }, [product, isLoading, navigate, id]);

  const richHtmlContent = useMemo(() => {
    const parentContent =
      product?.productDetails?.content ||
      product?.parentContent ||
      product?.content ||
      product?.htmlContent ||
      product?.detailedContent ||
      product?.longDescription ||
      product?.description ||
      "";
    return formatProductRichContent(parentContent, product);
  }, [product]);

  function resolveVariantImage(item, fallbackImage = null) {
    if (!item) return fallbackImage;
    const candidates = [
      item.mainImage,
      item.image,
      item.imageUrl,
      item.thumbnail,
      item.image_url,
      item.photo,
      ...(Array.isArray(item.images) ? item.images : []),
      ...(Array.isArray(item.gallery) ? item.gallery : []),
    ];

    for (const cand of candidates) {
      if (!cand) continue;
      if (typeof cand === "string" && cand.trim().length > 0) {
        return cand.trim();
      }
      if (typeof cand === "object") {
        const nested = cand.url || cand.src || cand.secure_url;
        if (typeof nested === "string" && nested.trim().length > 0) {
          return nested.trim();
        }
      }
    }
    return fallbackImage;
  }

  const variantGroups = useMemo(() => {
    if (!product) return [];

    const baseSalePrice = Number(product.price) || 29.99;
    const baseOriginalPrice =
      Number(product.oldPrice) || Number((baseSalePrice * 1.35).toFixed(2));

    // Case 0: Backend explicit familyVariants
    if (product.familyVariants && product.familyVariants.length > 0) {
      return product.familyVariants.map((fVar, fIdx) => {
        const fName = distinctVariantLabel(
          product.title,
          fVar.displayName || fVar.name || fVar.label,
          fVar.weightRange || fVar.packColor || `Variant ${fIdx + 1}`,
        );
        const groupTitle = `${product.title} (${fName})`;
        const subtitle =
          fVar.shortDescription && fVar.shortDescription !== fVar.weightRange
            ? fVar.shortDescription
            : fVar.weightRange
              ? `Weight Range: ${fVar.weightRange}`
              : "Available Pack Options";

        const variantImage = resolveVariantImage(
          fVar,
          product.gallery?.[fIdx] ||
            product.images?.[fIdx % (product.images?.length || 1)] ||
            product.image,
        );

        let skus =
          Array.isArray(fVar.skus) && fVar.skus.length > 0 ? fVar.skus : [];
        if (skus.length === 0 && Array.isArray(product.optionVariants)) {
          skus = product.optionVariants.filter(
            (ov) =>
              ov.familyVariantId === fVar.id ||
              ov.familyVariantSlug === fVar.slug ||
              (ov.label && ov.label.startsWith(fName)),
          );
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
              s.pricing?.regularPrice ??
              s.regularPrice ??
              s.price ??
              unitSale * 1.35,
          );
          const rawName =
            s.name || s.label || s.size || s.weight || s.optionName;
          const fallbackName =
            s.packLabel ||
            s.pack ||
            s.packSize ||
            s.doses ||
            `${fName} Pack ${sIdx + 1}`;
          const displayName =
            distinctVariantLabel(product.title, rawName, fallbackName) &&
            !/^1\s*pack$/i.test(String(rawName || "").trim())
              ? distinctVariantLabel(product.title, rawName, fallbackName)
              : fallbackName;
          const packSubtitle =
            s.subtitle ||
            s.description ||
            (s.dosesCount ? `${s.dosesCount} Doses Regimen` : null) ||
            fVar.subtitle ||
            "Genuine Sealed Clinical Packaging";

          let defaultTier = s.tier || s.badge || null;
          if (!defaultTier) {
            if (sIdx === 0) defaultTier = "Starter Supply";
            else if (sIdx === 1) defaultTier = "🔥 Most Popular";
            else defaultTier = "⭐ Best Value";
          }

          return {
            key: `fv-${fVar.id || fIdx}-sku-${s.id || sIdx}`,
            variantId: s.id || `${fVar.id}-${sIdx}`,
            name: displayName,
            pack: displayName,
            label: displayName,
            subtitle: packSubtitle,
            doses: packSubtitle,
            regularPrice: unitReg.toFixed(2),
            salePrice: unitSale.toFixed(2),
            savingsPct: Math.round(
              ((unitReg - unitSale) / (unitReg || 1)) * 100,
            ),
            stock: Number(s.stock ?? s.inventory?.stockQuantity ?? 50),
            sku: s.sku || `${product.sku || "HP"}-${fIdx + 1}-${sIdx + 1}`,
            tier: defaultTier,
          };
        });

        const fallbackRows = [
          {
            key: `fv-${fVar.id || fIdx}-row-1`,
            variantId: `${fVar.id}-std`,
            name: fName || "Standard Option",
            pack: fName || "Standard Option",
            label: fName || "Standard Option",
            subtitle: fVar.subtitle || "Genuine Sealed Clinical Packaging",
            doses: fVar.subtitle || "Genuine Sealed Clinical Packaging",
            regularPrice: (baseSalePrice * 1.35).toFixed(2),
            salePrice: baseSalePrice.toFixed(2),
            savingsPct: 26,
            stock: 50,
            sku: `${product.sku || "HP"}-${fIdx + 1}`,
            tier: "Starter Supply",
          },
        ];

        return {
          id: `fv-${fVar.id || fIdx}`,
          groupTitle,
          shortLabel: fName,
          subtitle,
          image: variantImage,
          rows: rows.length > 0 ? rows : fallbackRows,
        };
      });
    }

    // Case 1: Backend explicit optionVariants
    if (product.optionVariants && product.optionVariants.length > 0) {
      const groupsMap = {};

      product.optionVariants.forEach((v, index) => {
        const label = v.label || `Option ${index + 1}`;
        let groupTitle = `${product.title}`;
        let packLabel = label;
        let shortFormName = label;

        if (label.includes(" - ")) {
          const parts = label.split(" - ");
          groupTitle = `${product.title} ${parts[0]}`;
          packLabel = parts.slice(1).join(" - ");
          shortFormName = parts[0];
        } else if (label.includes(" / ")) {
          const parts = label.split(" / ");
          groupTitle = `${product.title} (${parts[0]})`;
          packLabel = parts[1];
          shortFormName = parts[0];
        }

        shortFormName = distinctVariantLabel(
          product.title,
          shortFormName,
          `Variant ${index + 1}`,
        );
        groupTitle = `${product.title} (${shortFormName})`;

        const optImage = resolveVariantImage(
          v,
          product.images?.[index % (product.images?.length || 1)] ||
            product.image,
        );

        if (!groupsMap[groupTitle]) {
          groupsMap[groupTitle] = {
            id: `grp-${index}`,
            groupTitle,
            shortLabel: shortFormName.replace(/[()]/g, "").trim(),
            subtitle: "Available Pack Options",
            image: optImage,
            rows: [],
          };
        }

        const unitSale = Number(
          v.pricing?.finalPrice ?? v.price ?? v.salePrice ?? baseSalePrice,
        );
        const unitReg = Number(
          v.pricing?.price ?? v.regularPrice ?? v.oldPrice ?? unitSale * 1.35,
        );

        let defaultTier = "Standard Pack";
        if (index === 0) defaultTier = "Starter Supply";
        else if (index === 1) defaultTier = "🔥 Most Popular";
        else defaultTier = "⭐ Best Value";

        groupsMap[groupTitle].rows.push({
          key: String(v.id || `${id}-opt-${index}`),
          variantId: v.id,
          pack: distinctVariantLabel(product.title, packLabel, `Pack ${index + 1}`),
          label: distinctVariantLabel(product.title, v.label, `Pack ${index + 1}`),
          regularPrice: unitReg.toFixed(2),
          salePrice: unitSale.toFixed(2),
          stock: v.stock ?? (product.stock || 50),
          sku: v.sku || product.sku,
          tier: defaultTier,
        });
      });

      return Object.values(groupsMap);
    }

    // Case 2: Product sizes
    if (product.sizes && product.sizes.length > 1) {
      const rows = product.sizes.map((s, idx) => {
        const mult = s.multiplier ?? 1.0;
        const rowSale =
          s.price !== undefined
            ? Number(s.price)
            : Number((baseSalePrice * mult).toFixed(2));
        const rowReg =
          s.originalPrice !== undefined
            ? Number(s.originalPrice)
            : Number((baseOriginalPrice * mult).toFixed(2));

        let defaultTier = "Standard Pack";
        if (idx === 0) defaultTier = "Starter Supply";
        else if (idx === 1) defaultTier = "🔥 Most Popular";
        else defaultTier = "⭐ Best Value";

        return {
          key: String(s.id || `${id}-size-${idx}`),
          variantId: s.id,
          pack: s.label || `Option ${idx + 1}`,
          label: s.label,
          regularPrice: rowReg.toFixed(2),
          salePrice: rowSale.toFixed(2),
          stock: s.stock ?? (product.stock || 50),
          sku: s.sku || product.sku,
          tier: defaultTier,
        };
      });

      return [
        {
          id: "grp-sizes",
          groupTitle: `${product.title} - Available Options`,
          image: product.image,
          rows,
        },
      ];
    }

    // Case 3: Weight variant tables if pet category detects cat/dog treatment
    const catLower = (product.category || "").toLowerCase();
    const titleLower = (product.title || "").toLowerCase();
    const isCat = catLower.includes("cat") || titleLower.includes("cat");
    const weightList = isCat ? WEIGHT_VARIANTS_CATS : WEIGHT_VARIANTS_DOGS;

    return weightList.map((wv, gIdx) => {
      const gTitle = `${product.title} (${wv.weight})`;
      return {
        id: `weight-${gIdx}`,
        groupTitle: gTitle,
        shortWeight: wv.weight,
        colorHex: wv.colorHex,
        image: product.image,
        rows: wv.packs.map((pm, rIdx) => {
          const rowSale = (baseSalePrice * wv.multiplier * pm.doseMult).toFixed(
            2,
          );
          const rowReg = (baseSalePrice * wv.multiplier * pm.regMult).toFixed(
            2,
          );
          return {
            key: `${id}-w${gIdx}-p${rIdx}`,
            variantId: `${id}-w${gIdx}-p${rIdx}`,
            pack: pm.doses,
            label: `${wv.weight} - ${pm.doses}`,
            regularPrice: rowReg,
            salePrice: rowSale,
            stock: product.stock !== undefined ? product.stock : 99,
            sku: `${product.sku || "PET"}-${wv.color.toUpperCase()}-${pm.doses.replace(/\s+/g, "")}`,
            tier:
              pm.tier ||
              (rIdx === 0
                ? "Starter Regimen"
                : rIdx === 1
                  ? "🔥 Most Popular"
                  : "⭐ Best Value"),
          };
        }),
      };
    });
  }, [product, id]);

  // Set default active pack when variant groups load
  useEffect(() => {
    if (
      !activePackKey &&
      variantGroups.length > 0 &&
      variantGroups[0].rows?.length > 0
    ) {
      setActivePackKey(variantGroups[0].rows[0].key);
    }
  }, [variantGroups, activePackKey]);

  const handleStepQuantity = (variantKey, delta) => {
    const current = quantities[variantKey] || 1;
    const nextVal = Math.max(1, Math.min(99, current + delta));
    setQuantities((prev) => ({ ...prev, [variantKey]: nextVal }));
  };

  const handleToggleWishlist = async (itemToToggle) => {
    try {
      const result = await toggleWishlistItem(itemToToggle);
      setWishlistVersion((v) => v + 1);
      showToast(
        result.saved
          ? `${itemToToggle.title} added to wishlist.`
          : `${itemToToggle.title} removed from wishlist.`,
        "success",
      );
    } catch (err) {
      showToast(err.message || "Failed to update wishlist.", "error");
    }
  };

  const handleAddVariantToCart = async (group, row) => {
    if (!product) return;

    const user = getStoredAuthUser();
    if (isVetOnly(product) && lacksVetAccess(product, user)) {
      navigate(user ? "/account/vet-verification" : "/login");
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
      price: parseFloat(row.salePrice),
      oldPrice: parseFloat(row.regularPrice),
      quantity: qty,
      image: group.image || product.image,
    };

    try {
      await cartApi.addItem(itemToAdd);
      setAddingState((prev) => ({ ...prev, [row.key]: true }));
      showToast(`${titleWithVariant} added to cart!`, "success");
      setTimeout(() => {
        setAddingState((prev) => ({ ...prev, [row.key]: false }));
      }, 1500);
    } catch (err) {
      showToast(err.message || "Could not add item to cart.", "error");
    }
  };

  const handleBuyNow = (group, row) => {
    if (!product) return;
    const user = getStoredAuthUser();
    if (isVetOnly(product) && lacksVetAccess(product, user)) {
      navigate(user ? "/account/vet-verification" : "/login");
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
      price: parseFloat(row.salePrice),
      oldPrice: parseFloat(row.regularPrice),
      quantity: qty,
      image: group.image || product.image,
    };

    try {
      window.sessionStorage.setItem(
        "healthy_paws_buy_now_checkout",
        JSON.stringify(itemToAdd),
      );
      showToast(`${titleWithVariant} ready for checkout.`, "success");
      navigate("/checkout?buyNow=1");
    } catch {
      showToast("Could not open checkout. Please try again.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-textMain">
        <Header />
        <main className="mx-auto max-w-[1360px] px-4 py-20 text-center">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
          <p className="mt-4 text-sm font-extrabold text-muted">
            Loading veterinary dosing studio...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-textMain">
        <Header />
        <main className="mx-auto max-w-[1360px] px-4 py-20 text-center">
          <div className="mx-auto max-w-md rounded-3xl border border-borderSoft bg-white p-8 shadow-card">
            <span className="text-5xl">🐾</span>
            <h1 className="mt-4 font-display text-2xl font-black text-primaryDark">
              Product Not Found
            </h1>
            <p className="mt-2 text-xs font-semibold text-muted">
              The requested variant catalog could not be retrieved.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primaryDark px-6 py-2.5 text-xs font-black text-white hover:bg-secondary transition"
            >
              <ArrowLeft size={14} /> Back to Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Find currently active pack for the sticky dock
  let activePackObj = null;
  let activeGroupObj = null;
  for (const g of variantGroups) {
    const found = g.rows.find((r) => r.key === activePackKey);
    if (found) {
      activePackObj = found;
      activeGroupObj = g;
      break;
    }
  }
  if (!activePackObj && variantGroups[0]?.rows?.[0]) {
    activePackObj = variantGroups[0].rows[0];
    activeGroupObj = variantGroups[0];
  }

  const targetProductId =
    id || product?.productId || product?.id || product?._id;
  const activeFvId = activeGroupObj?.id
    ? String(activeGroupObj.id).replace(/^fv-/, "")
    : "";
  const heroRedirectUrl = `/products/${targetProductId}${
    activePackObj
      ? `?variant=${encodeURIComponent(activePackObj.variantId)}&familyVariantId=${encodeURIComponent(activeFvId)}`
      : ""
  }`;

  const isBaseWishlisted = isWishlistItemSaved(product.id);
  const filteredGroups =
    selectedGroupFilter === "all"
      ? variantGroups
      : variantGroups.filter((g) => g.id === selectedGroupFilter);

  return (
    <div className="min-h-screen bg-background text-textMain font-body relative overflow-hidden pb-24 sm:pb-28">
      <Header />

      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 left-0 w-[450px] h-[450px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sticky Top Breadcrumb & Status Bar */}
      <div className="border-b border-borderSoft bg-white/95 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-[1360px] px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs">
          <nav className="flex items-center gap-2 font-bold text-muted">
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} className="text-borderSoft" />
            <Link
              to="/products"
              className="hover:text-primary transition-colors"
            >
              Products
            </Link>
            <ChevronRight size={13} className="text-borderSoft" />
            <span className="text-primaryDark font-black truncate max-w-[180px] sm:max-w-xs md:max-w-md">
              {product.title}
            </span>
          </nav>

        </div>
      </div>

      <main className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-10">
        {/* ── 1. MODERN VETERINARY HERO STUDIO ── */}
        <section className="bg-white rounded-[32px] border border-borderSoft p-6 sm:p-8 lg:p-10 shadow-[0_12px_40px_var(--color-shadow)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Studio Image Showcase (Clickable link to Product Details) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div
                className="relative w-full max-w-[340px] aspect-square rounded-3xl bg-gradient-to-b from-sageLight/70 to-softCream p-6 border border-borderSoft flex items-center justify-center group overflow-hidden shadow-xs hover:border-secondary/60 hover:shadow-md transition-all duration-300 cursor-pointer block"
                title="Click to view full product specifications"
              >
                {product.discount && (
                  <span className="absolute top-4 left-4 z-10 rounded-full bg-orange px-3 py-1 text-[11px] font-black text-white shadow-xs pointer-events-none">
                    {product.discount}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleWishlist(product);
                  }}
                  aria-label="Save to wishlist"
                  className={`absolute top-4 right-4 z-20 grid size-10 place-items-center rounded-full border border-borderSoft bg-white/95 backdrop-blur-sm transition hover:bg-sageLight cursor-pointer ${
                    isBaseWishlisted ? "text-red" : "text-secondaryDark"
                  } shadow-xs active:scale-95`}
                >
                  <Heart
                    size={18}
                    className={isBaseWishlisted ? "fill-red" : ""}
                  />
                </button>

                <div className="flex flex-col items-center justify-center w-full h-full pointer-events-none">
                  <img
                    src={
                      product.mainImage ||
                      product.image ||
                      (Array.isArray(product.images) && product.images[0]) ||
                      variantGroups[0]?.image
                    }
                    alt={product.title}
                    className="max-h-[220px] sm:max-h-[250px] w-auto object-contain transition-transform duration-500 group-hover:scale-108 drop-shadow-sm"
                  />

                  <div className="absolute bottom-3 inset-x-3 rounded-2xl bg-white/95 backdrop-blur-sm border border-borderSoft/80 py-2 px-3 flex items-center justify-center gap-2 text-[11px] font-extrabold text-primaryDark shadow-2xs group-hover:bg-primaryDark group-hover:text-white transition-colors duration-300 z-10 pointer-events-none">
                    <ShieldCheck
                      size={14}
                      className="text-secondaryDark group-hover:text-amber-300 transition-colors"
                    />
                    <span>100% Genuine Sealed Packaging</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Product Overview & Weight Selector */}
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sageLight text-primaryDark border border-secondary/20 flex items-center gap-1">
                  <Sparkles size={12} className="text-secondaryDark" />
                  {product.category || "Pet Care"}
                </span>

                {product.brand && (
                  <span className="text-xs font-bold text-muted bg-softCream px-3 py-1 rounded-full border border-borderSoft">
                    Brand: {product.brand}
                  </span>
                )}

                <span className="text-[11px] font-extrabold text-secondaryDark bg-sageLight/70 px-3 py-1 rounded-full border border-secondary/30 flex items-center gap-1">
                  <Award size={13} className="text-secondaryDark" /> Clinical
                  Regimen
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-primaryDark tracking-tight leading-tight">
                <Link
                  to={heroRedirectUrl}
                  className="hover:text-secondary transition-colors inline-block"
                  title="Click to view full product details"
                >
                  {product.title}
                </Link>
              </h1>

              {/* Star Rating & Reviews - Only display if real rating/reviews exist */}
              {avgRating && Number(avgRating) > 0 && totalReviews > 0 ? (
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-muted">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={
                          s <= Math.round(Number(avgRating))
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-gray-300"
                        }
                      />
                    ))}
                    <span className="ml-1.5 font-black text-primaryDark">
                      {avgRating} / 5
                    </span>
                  </div>
                  <span className="text-borderSoft">•</span>
                  <span>
                    Based on {totalReviews} review
                    {totalReviews === 1 ? "" : "s"}
                  </span>
                </div>
              ) : null}

              {/* Benefits Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primaryDark bg-softCream/80 p-2.5 rounded-xl border border-borderSoft">
                  <CheckCircle size={15} className="text-secondary shrink-0" />
                  <span>Prompt relief & long-lasting defense</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primaryDark bg-softCream/80 p-2.5 rounded-xl border border-borderSoft">
                  <CheckCircle size={15} className="text-secondary shrink-0" />
                  <span>Custom dosing tailored to weight</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primaryDark bg-softCream/80 p-2.5 rounded-xl border border-borderSoft">
                  <CheckCircle size={15} className="text-secondary shrink-0" />
                  <span>100% Genuine manufacturer batches</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-primaryDark bg-softCream/80 p-2.5 rounded-xl border border-borderSoft">
                  <CheckCircle size={15} className="text-secondary shrink-0" />
                  <span>Fresh shelf life guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. THE FORMULATION SHOWCASE & PACK MATRIX (HEALTHY PAWS STORE DESIGN) ── */}
        <div className="space-y-12">
          {filteredGroups.map((group) => {
            const displayTitle =
              group.shortLabel ||
              group.groupTitle
                .replace(product.title, "")
                .replace(/[()]/g, "")
                .trim() ||
              group.groupTitle;

            return (
              <section
                key={group.id}
                className="bg-white rounded-[32px] border border-borderSoft p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_var(--color-shadow)] space-y-6 transition-all"
              >
                {/* Formulation Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-borderSoft">
                  <div className="flex items-center gap-3.5">
                    <div className="relative size-12 sm:size-14 rounded-2xl bg-sageLight/70 border border-borderSoft p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <img
                        src={group.image}
                        alt={displayTitle}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-xl sm:text-2xl font-black text-primaryDark">
                          <Link
                            to={`/products/${targetProductId}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.shortLabel || group.id.replace(/^fv-/, ""))}`}
                            className="hover:underline hover:text-secondaryDark transition-colors"
                            title="View this formulation details"
                          >
                            {displayTitle}
                          </Link>
                        </h2>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sageLight text-secondaryDark border border-secondary/20">
                          <ShieldCheck size={12} className="text-secondary" />
                          Verified Formulation
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-muted mt-0.5">
                        {group.subtitle ||
                          `Authentic ${product.title} formulation tailored to specific pet care requirements`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-secondaryDark bg-secondary/10 px-3.5 py-1.5 rounded-full border border-secondary/20">
                      {group.rows.length}{" "}
                      {group.rows.length === 1 ? "Option" : "Options"} Available
                    </span>
                  </div>
                </div>

                {/* Formulation Showcase: Left Spotlight + Right Pack Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left Column: Variant Formulation Spotlight */}
                  <div className="lg:col-span-4 flex flex-col justify-between rounded-[28px] border border-borderSoft bg-gradient-to-b from-sageLight/40 via-softCream/60 to-white p-6 relative overflow-hidden shadow-2xs group/spotlight">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-black uppercase tracking-wider text-secondaryDark bg-white px-3 py-1 rounded-full border border-borderSoft shadow-2xs flex items-center gap-1.5">
                          <Sparkles size={12} className="text-secondary" />
                          Formulation Spotlight
                        </span>
                        <span className="text-[11px] font-bold text-muted">
                          {product.brand || "Healthy Paws"}
                        </span>
                      </div>

                      {/* Main Variant Formulation Image */}
                      <Link
                        to={`/products/${targetProductId}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.shortLabel || group.id.replace(/^fv-/, ""))}`}
                        className="relative w-full aspect-square max-w-[200px] mx-auto flex items-center justify-center p-3 my-2 cursor-pointer group/spotlightImg rounded-2xl bg-white shadow-xs border border-borderSoft overflow-hidden block"
                        title="Click to view full product details"
                      >
                        <img
                          src={group.image}
                          alt={displayTitle}
                          className="max-h-[170px] w-auto object-contain transition-transform duration-500 group-hover/spotlightImg:scale-108 drop-shadow-md"
                        />

                        {/* Hover Overlay with Eye Icon */}
                        <div className="absolute inset-0 bg-primaryDark/20 opacity-0 group-hover/spotlightImg:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white text-primaryDark flex items-center justify-center shadow-lg transform translate-y-1 group-hover/spotlightImg:translate-y-0 transition-all duration-300">
                            <Eye className="w-5 h-5 text-secondaryDark" />
                          </div>
                        </div>
                      </Link>

                      <div className="text-center mt-3">
                        <h3 className="font-display text-lg font-black text-primaryDark">
                          {displayTitle}
                        </h3>
                        <p className="text-xs font-bold text-muted mt-1 leading-relaxed">
                          {group.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-borderSoft/80 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-primaryDark">
                        <CheckCircle
                          size={14}
                          className="text-secondary shrink-0"
                        />
                        <span>Direct Laboratory Sealed Packaging</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-extrabold text-primaryDark">
                        <ShieldCheck
                          size={14}
                          className="text-secondaryDark shrink-0"
                        />
                        <span>Full Active Ingredient Guarantee</span>
                      </div>
                      <Link
                        to={`/products/${targetProductId}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.shortLabel || group.id.replace(/^fv-/, ""))}`}
                        className="mt-2 text-xs font-black text-secondaryDark hover:text-primary transition-colors inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-white border border-borderSoft hover:border-secondary/40 shadow-2xs"
                      >
                        <span>View Full Clinical Specs</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Pack Selection Cards Grid */}
                  <div
                    className={`lg:col-span-8 grid grid-cols-1 ${
                      group.rows.length >= 3
                        ? "sm:grid-cols-2 lg:grid-cols-3"
                        : group.rows.length === 2
                          ? "sm:grid-cols-2"
                          : "sm:grid-cols-1 max-w-md"
                    } gap-4`}
                  >
                    {group.rows.map((row) => {
                      const isOutOfStock = row.stock === 0;
                      const currentQty = quantities[row.key] || 1;
                      const isAdding = addingState[row.key];
                      const isSelected = activePackKey === row.key;
                      const savePct =
                        parseFloat(row.regularPrice) > parseFloat(row.salePrice)
                          ? Math.round(
                              (1 -
                                parseFloat(row.salePrice) /
                                  parseFloat(row.regularPrice)) *
                                100,
                            )
                          : 0;

                      return (
                        <div
                          key={row.key}
                          onClick={() => setActivePackKey(row.key)}
                          className={`group/card rounded-[24px] border p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 relative cursor-pointer ${
                            isSelected
                              ? "bg-white border-secondaryDark ring-3 ring-secondary/20 shadow-lg -translate-y-0.5"
                              : "bg-white border-borderSoft hover:border-secondary/50 hover:shadow-md hover:-translate-y-0.5"
                          } ${isOutOfStock ? "opacity-60" : ""}`}
                        >
                          {/* Top Highlights & Tier Badge */}
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  row.tier?.includes("Best Value")
                                    ? "bg-orange text-white shadow-xs"
                                    : row.tier?.includes("Popular")
                                      ? "bg-sageLight text-secondaryDark border border-secondary/30"
                                      : "bg-softCream text-muted border border-borderSoft"
                                }`}
                              >
                                {row.tier ||
                                  (savePct > 0
                                    ? `Save ${savePct}%`
                                    : "Starter Regimen")}
                              </span>

                              {savePct > 0 && (
                                <span className="text-[10px] font-black text-secondaryDark bg-secondary/15 px-2 py-0.5 rounded-full">
                                  {savePct}% OFF
                                </span>
                              )}
                            </div>

                            {/* Option Name & Subtitle */}
                            <h4 className="font-display text-lg font-black text-primaryDark group-hover/card:text-secondaryDark transition-colors">
                              <Link
                                to={`/products/${targetProductId}?variant=${encodeURIComponent(row.variantId || row.key)}&familyVariantId=${encodeURIComponent(group.shortLabel || group.id.replace(/^fv-/, ""))}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline transition-all"
                                title="View details for this option"
                              >
                                {row.name || row.pack}
                              </Link>
                            </h4>
                            <p className="mt-1 text-[11px] text-muted font-semibold leading-snug">
                              {row.subtitle ||
                                row.doses ||
                                `Genuine ${row.name || row.pack} Sealed Packaging`}
                            </p>

                            {/* Price Display */}
                            <div className="mt-4 pb-4 border-b border-borderSoft">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-black text-primaryDark">
                                  ${row.salePrice}
                                </span>
                                {parseFloat(row.regularPrice) >
                                  parseFloat(row.salePrice) && (
                                  <span className="text-[11px] font-extrabold text-muted line-through">
                                    ${row.regularPrice}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px] font-bold text-muted">
                                {isOutOfStock && (
                                  <span className="text-error font-extrabold">
                                    Out of stock
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quantity Stepper & Actions */}
                          <div className="mt-4 space-y-2.5">
                            {/* Stepper Row */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-muted">
                                Quantity:
                              </span>
                              <div className="inline-flex items-center rounded-full border border-borderSoft bg-softCream shadow-2xs overflow-hidden">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepQuantity(row.key, -1);
                                  }}
                                  disabled={isOutOfStock || currentQty <= 1}
                                  className="h-7 w-7 flex items-center justify-center text-muted hover:bg-sageLight hover:text-primaryDark transition disabled:opacity-30 cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-7 text-center text-xs font-black text-primaryDark select-none">
                                  {currentQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStepQuantity(row.key, 1);
                                  }}
                                  disabled={
                                    isOutOfStock || currentQty >= row.stock
                                  }
                                  className="h-7 w-7 flex items-center justify-center text-muted hover:bg-sageLight hover:text-primaryDark transition disabled:opacity-30 cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Dual Action Buttons */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddVariantToCart(group, row);
                                }}
                                disabled={isOutOfStock || isAdding}
                                className={`w-full inline-flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 ${
                                  isOutOfStock
                                    ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                                    : isAdding
                                      ? "bg-secondaryDark text-white shadow-md scale-95"
                                      : "cta-banner-btn"
                                }`}
                              >
                                {isOutOfStock ? (
                                  "Sold Out"
                                ) : isAdding ? (
                                  <>
                                    <Check size={12} className="stroke-[3]" />{" "}
                                    Added!
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart size={12} /> Add
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBuyNow(group, row);
                                }}
                                disabled={isOutOfStock}
                                className="w-full inline-flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border border-primaryDark bg-white text-primaryDark hover:bg-sageLight transition active:scale-95 cursor-pointer disabled:opacity-50"
                              >
                                <PawPrint size={12} fill="currentColor" />
                                <span>Buy Now</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* ── 3. BRAND ASSURANCE 4-COLUMN STRIP ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          <div className="p-5 rounded-3xl bg-white border border-borderSoft flex items-center gap-4 shadow-2xs">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondaryDark">
              <Truck size={22} />
            </span>
            <div>
              <h4 className="text-sm font-black text-primaryDark">
                Fast Delivery
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Quick dispatch on all orders
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-borderSoft flex items-center gap-4 shadow-2xs">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primaryDark">
              <ShieldCheck size={22} />
            </span>
            <div>
              <h4 className="text-sm font-black text-primaryDark">
                100% Genuine
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Direct manufacturer sourcing
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-borderSoft flex items-center gap-4 shadow-2xs">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondaryDark">
              <Sparkles size={22} />
            </span>
            <div>
              <h4 className="text-sm font-black text-primaryDark">
                Vet Approved
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Clinical grade formulations
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-borderSoft flex items-center gap-4 shadow-2xs">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primaryDark">
              <RotateCcw size={22} />
            </span>
            <div>
              <h4 className="text-sm font-black text-primaryDark">
                Hassle-Free
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Dedicated customer support
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. DYNAMIC ADMIN RICH-TEXT SPECIFICATIONS ── */}
        <section className="bg-white rounded-[32px] p-6 sm:p-10 border border-borderSoft shadow-[0_12px_36px_var(--color-shadow)] text-left">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-sageLight px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-secondaryDark">
              <Layers className="size-3.5 text-secondaryDark" />
              <span>Detailed Overview &amp; Specifications</span>
            </div>

            <div
              className="variant-rich-text prose max-w-none text-textMain leading-relaxed"
              dangerouslySetInnerHTML={{ __html: richHtmlContent }}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
