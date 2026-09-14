import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Check,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Sparkles,
  Package,
  Layers,
  ChevronRight,
  Heart,
  Home,
  ShieldCheck,
  Truck,
  RotateCcw,
  Info,
  Plus,
  Minus,
  Award,
  Zap,
  CheckCircle2,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  Eye,
  PawPrint,
} from "lucide-react";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { mapPawsProducts } from "../api/catalogAdapter";
import { useAuth } from "../context/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
} from "../utils/productUtils";
import { formatProductRichContent } from "../utils/htmlUtils";

const BUY_NOW_STORAGE_KEY = "paws_care_buy_now_checkout";

const WEIGHT_VARIANTS_DOGS = [
  {
    weight: "2.8-5.5 lbs",
    subtitle: "Toy / Very Small Dogs",
    color: "Yellow",
    colorHex: "#EAB308",
    multiplier: 1.0,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.95,
        regMult: 2.75,
        tier: "🔥 Most Popular",
      },
    ],
  },
  {
    weight: "5.6-11 lbs",
    subtitle: "Small Dogs",
    color: "Purple",
    colorHex: "#A855F7",
    multiplier: 1.03,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.92,
        regMult: 2.7,
        tier: "🔥 Most Popular",
      },
      {
        doses: "12 Doses",
        doseCount: 12,
        doseMult: 3.76,
        regMult: 5.3,
        tier: "⭐ Best Value",
      },
    ],
  },
  {
    weight: "11.1-22 lbs",
    subtitle: "Medium Small Dogs",
    color: "Caramel",
    colorHex: "#D97706",
    multiplier: 1.09,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.92,
        regMult: 2.7,
        tier: "🔥 Most Popular",
      },
      {
        doses: "12 Doses",
        doseCount: 12,
        doseMult: 3.76,
        regMult: 5.3,
        tier: "⭐ Best Value",
      },
    ],
  },
  {
    weight: "22.1-44 lbs",
    subtitle: "Medium Dogs",
    color: "Teal",
    colorHex: "#0D9488",
    multiplier: 1.18,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.92,
        regMult: 2.7,
        tier: "🔥 Most Popular",
      },
      {
        doses: "12 Doses",
        doseCount: 12,
        doseMult: 3.76,
        regMult: 5.3,
        tier: "⭐ Best Value",
      },
    ],
  },
  {
    weight: "44.1-88 lbs",
    subtitle: "Large Dogs",
    color: "Coral",
    colorHex: "#F33F59",
    multiplier: 1.32,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.92,
        regMult: 2.7,
        tier: "🔥 Most Popular",
      },
      {
        doses: "12 Doses",
        doseCount: 12,
        doseMult: 3.76,
        regMult: 5.3,
        tier: "⭐ Best Value",
      },
    ],
  },
  {
    weight: "above 88 lbs",
    subtitle: "Giant Dogs",
    color: "Brown",
    colorHex: "#78350F",
    multiplier: 1.55,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.92,
        regMult: 2.7,
        tier: "🔥 Most Popular",
      },
      {
        doses: "12 Doses",
        doseCount: 12,
        doseMult: 3.76,
        regMult: 5.3,
        tier: "⭐ Best Value",
      },
    ],
  },
];

const WEIGHT_VARIANTS_CATS = [
  {
    weight: "2.8-5.5 lbs",
    subtitle: "Kittens & Small Cats",
    color: "Yellow",
    colorHex: "#EAB308",
    multiplier: 1.0,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.95,
        regMult: 2.75,
        tier: "🔥 Most Popular",
      },
    ],
  },
  {
    weight: "5.6-16.5 lbs",
    subtitle: "Adult Cats",
    color: "Teal",
    colorHex: "#0D9488",
    multiplier: 1.15,
    packs: [
      {
        doses: "3 Doses",
        doseCount: 3,
        doseMult: 1.0,
        regMult: 1.4,
        tier: "Starter Pack",
      },
      {
        doses: "6 Doses",
        doseCount: 6,
        doseMult: 1.92,
        regMult: 2.7,
        tier: "🔥 Most Popular",
      },
      {
        doses: "12 Doses",
        doseCount: 12,
        doseMult: 3.76,
        regMult: 5.3,
        tier: "⭐ Best Value",
      },
    ],
  },
];

export default function ProductVariant({
  wishlist = [],
  onToggleWishlist,
  onAddToCart,
  products = [],
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(() => {
    return (
      products.find(
        (p) =>
          String(p.slug) === String(slug) ||
          String(p.id) === String(slug) ||
          String(p.productId) === String(slug),
      ) || null
    );
  });

  const [isLoading, setIsLoading] = useState(!product);
  const [reviewStats, setReviewStats] = useState({
    avgRating: 4.9,
    totalReviews: 128,
  });

  const [activeFilterTab, setActiveFilterTab] = useState("all");
  const [activePackKey, setActivePackKey] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [addingState, setAddingState] = useState({});

  useEffect(() => {
    let active = true;

    const found = products.find(
      (p) =>
        String(p.slug) === String(slug) ||
        String(p.id) === String(slug) ||
        String(p.productId) === String(slug),
    );

    if (found) {
      setProduct(found);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      productApi
        .getProductById(slug)
        .then((raw) => {
          if (!active) return;
          if (raw) {
            const mapped = mapPawsProducts([raw])[0];
            setProduct(mapped || raw);
          }
        })
        .catch((err) => {
          console.error("Failed to load product for variant studio:", err);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }

    if (product?.id) {
      reviewApi
        .getProductReviews(product.id)
        .then((data) => {
          if (!active) return;
          const list = Array.isArray(data) ? data : [];
          if (list.length > 0) {
            const total = list.length;
            const avg = (
              list.reduce((s, r) => s + Number(r.rating ?? r.star ?? 5), 0) /
              total
            ).toFixed(1);
            setReviewStats({ avgRating: avg, totalReviews: total });
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [slug, products, product?.id]);

  // Safety Guard: if product is loaded and is a SIMPLE product (not FAMILY), redirect directly to product details!
  useEffect(() => {
    if (product && !isLoading) {
      if (!isFamilyProduct(product)) {
        navigate(`/product/${product.slug || product.id || slug}`, {
          replace: true,
        });
      }
    }
  }, [product, isLoading, navigate, slug]);

  const richHtmlContent = useMemo(() => {
    return formatProductRichContent(null, product);
  }, [product]);

  // Build Normalized Variant Groups
  const variantGroups = useMemo(() => {
    if (!product) return [];

    const baseSalePrice = Number(product.price) || 29.99;
    const baseOriginalPrice =
      Number(product.originalPrice) ||
      Number(product.oldPrice) ||
      Number((baseSalePrice * 1.35).toFixed(2));

    // Case 0: Backend explicit familyVariants
    if (product.familyVariants && product.familyVariants.length > 0) {
      return product.familyVariants.map((fVar, fIdx) => {
        const fName = fVar.displayName || fVar.name || `Variant ${fIdx + 1}`;
        const groupTitle = `${product.name || product.title} (${fName})`;
        const subtitle =
          fVar.shortDescription && fVar.shortDescription !== fVar.weightRange
            ? fVar.shortDescription
            : fVar.weightRange
              ? `Weight Range: ${fVar.weightRange}`
              : "Available Pack Options";

        const rawFImg = fVar.image;
        const validFImg =
          typeof rawFImg === "string" &&
          (rawFImg.startsWith("http") || rawFImg.startsWith("/"))
            ? rawFImg
            : null;

        const variantImage =
          validFImg ||
          product.gallery?.[fIdx] ||
          product.images?.[fIdx % (product.images?.length || 1)] ||
          product.image;

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
              s.regularPrice ??
              s.oldPrice ??
              (unitSale * 1.35).toFixed(2),
          );
          const savePct =
            unitReg > unitSale
              ? Math.round(((unitReg - unitSale) / unitReg) * 100)
              : 0;
          const rawPack =
            s.name ||
            s.label ||
            s.packLabel ||
            s.dose ||
            s.size ||
            s.weight ||
            s.optionName;
          const fallbackName = fName || fVar.name || "Standard Option";
          const displayName =
            rawPack && !/^1\s*pack$/i.test(String(rawPack).trim())
              ? String(rawPack).trim()
              : fallbackName;

          const fullLabel = displayName;

          let defaultTier = s.tier || s.badge || "";
          if (!defaultTier) {
            if (sIdx === 0) defaultTier = "Starter Supply";
            else if (sIdx === 1) defaultTier = "🔥 Most Popular";
            else defaultTier = "⭐ Best Value";
          }

          const rawSkuImg = s.image;
          const validSkuImg =
            typeof rawSkuImg === "string" &&
            (rawSkuImg.startsWith("http") || rawSkuImg.startsWith("/"))
              ? rawSkuImg
              : variantImage;

          const packSubtitle =
            s.subtitle ||
            s.description ||
            (s.dosesCount ? `${s.dosesCount} Doses Regimen` : null) ||
            fVar.subtitle ||
            "Genuine factory sealed package • High quality pet safe material";

          return {
            key: `fv-${fVar.id || fIdx}-sku-${s.id || sIdx}`,
            variantId: s.id || `${fVar.id}-${sIdx}`,
            name: displayName,
            pack: displayName,
            label: fullLabel,
            subtitle: packSubtitle,
            image: validSkuImg,
            regularPrice: unitReg.toFixed(2),
            salePrice: unitSale.toFixed(2),
            savePct,
            stock:
              s.inventory?.stockQuantity ?? s.stock ?? (product.stock || 50),
            sku: s.sku || `${product.sku || "PET"}-${fIdx + 1}-${sIdx + 1}`,
            tier: s.pricing?.discountPercentage
              ? `Save ${s.pricing.discountPercentage}%`
              : defaultTier || (savePct > 0 ? `Save ${savePct}%` : ""),
          };
        });

        return {
          id: String(fVar.id || `grp-fam-${fIdx}`),
          groupTitle,
          cleanTitle: fName,
          subtitle,
          color: fVar.packColor || null,
          colorHex: fVar.packColorHex || null,
          image: variantImage,
          rows,
        };
      });
    }

    // Case 1: Backend explicit optionVariants
    if (product.optionVariants && product.optionVariants.length > 0) {
      const groupsMap = {};

      product.optionVariants.forEach((v, index) => {
        const label = v.label || v.name || `Option ${index + 1}`;
        let groupTitle = `${product.name || product.title}`;
        let packLabel = label;

        let cleanTitle = product.name || product.title;
        if (label.includes(" - ")) {
          const parts = label.split(" - ");
          groupTitle = `${product.name || product.title} (${parts[0]})`;
          packLabel = parts.slice(1).join(" - ");
          cleanTitle = parts[0].trim();
        } else if (label.includes(" / ")) {
          const parts = label.split(" / ");
          groupTitle = `${product.name || product.title} (${parts[0]})`;
          packLabel = parts[1];
          cleanTitle = parts[0].trim();
        }

        const variantImage =
          (typeof v.image === "string" && v.image.trim()
            ? v.image.trim()
            : null) ||
          v.image?.url ||
          v.image?.src ||
          (typeof v.imageUrl === "string" && v.imageUrl.trim()
            ? v.imageUrl.trim()
            : null) ||
          (Array.isArray(v.images) && v.images.length > 0
            ? typeof v.images[0] === "string"
              ? v.images[0]
              : v.images[0]?.url || v.images[0]?.src
            : null) ||
          (typeof v.thumbnail === "string" && v.thumbnail.trim()
            ? v.thumbnail.trim()
            : null) ||
          (typeof v.photo === "string" && v.photo.trim()
            ? v.photo.trim()
            : null) ||
          product.gallery?.[index] ||
          product.images?.[index % (product.images?.length || 1)] ||
          product.image;

        if (!groupsMap[groupTitle]) {
          groupsMap[groupTitle] = {
            id: `grp-${index}`,
            groupTitle,
            cleanTitle,
            subtitle: "Available Pack Options",
            image: variantImage,
            rows: [],
          };
        }

        const unitSale = Number(
          v.pricing?.finalPrice ?? v.price ?? v.salePrice ?? baseSalePrice,
        );
        const unitReg = Number(
          v.pricing?.price ??
            v.regularPrice ??
            v.oldPrice ??
            (unitSale * 1.35).toFixed(2),
        );

        let defaultTier = "";
        if (index === 1) defaultTier = "🔥 Most Popular";
        else if (index >= 2) defaultTier = "⭐ Best Value";
        else if (index === 0) defaultTier = "Starter Option";

        const savePct =
          unitReg > unitSale
            ? Math.round(((unitReg - unitSale) / unitReg) * 100)
            : 0;

        groupsMap[groupTitle].rows.push({
          key: String(v.id || `${slug}-opt-${index}`),
          variantId: v.id,
          pack: packLabel,
          label: label,
          image: variantImage,
          regularPrice: unitReg.toFixed(2),
          salePrice: unitSale.toFixed(2),
          savePct,
          stock: v.stock ?? (product.stock || 50),
          sku: v.sku || product.sku,
          tier: defaultTier || (savePct > 0 ? `Save ${savePct}%` : ""),
        });
      });

      return Object.values(groupsMap);
    }

    // Case 2: Product sizes
    if (product.sizes && product.sizes.length > 0) {
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

        let defaultTier = "";
        if (idx === 1) defaultTier = "🔥 Most Popular";
        else if (idx >= 2) defaultTier = "⭐ Best Value";
        else if (idx === 0) defaultTier = "Starter Size";

        const savePct =
          rowReg > rowSale
            ? Math.round(((rowReg - rowSale) / rowReg) * 100)
            : 0;

        return {
          key: String(s.id || `${slug}-size-${idx}`),
          variantId: s.id,
          pack: s.label || `Size ${idx + 1}`,
          label: s.label,
          image: s.image || product.gallery?.[idx] || product.image,
          regularPrice: rowReg.toFixed(2),
          salePrice: rowSale.toFixed(2),
          savePct,
          stock: s.stock ?? (product.stock || 50),
          sku: s.sku || product.sku,
          tier: defaultTier || (savePct > 0 ? `Save ${savePct}%` : ""),
        };
      });

      return [
        {
          id: "grp-sizes",
          groupTitle: `${product.name || product.title}`,
          subtitle: "Available Sizes & Formats",
          image: product.image,
          rows,
        },
      ];
    }

    // Case 3: Weight variant tables (for health & flea/tick items)
    const catLower = (product.category || "").toLowerCase();
    const titleLower = (product.name || product.title || "").toLowerCase();
    const isCat = catLower.includes("cat") || titleLower.includes("cat");
    const weightData = isCat ? WEIGHT_VARIANTS_CATS : WEIGHT_VARIANTS_DOGS;

    const baseWeightSale = baseSalePrice;
    const baseWeightOrig = baseOriginalPrice;

    return weightData.map((item, idx) => {
      const gTitle = `${product.name || product.title} (${item.weight})`;
      const variantImage =
        product.gallery?.[idx % (product.gallery?.length || 1)] ||
        product.images?.[idx % (product.images?.length || 1)] ||
        product.image;

      const rows = item.packs.map((p, pIdx) => {
        const rowSale = (baseWeightSale * item.multiplier * p.doseMult).toFixed(
          2,
        );
        const rowReg = (baseWeightOrig * item.multiplier * p.regMult).toFixed(
          2,
        );
        const savePct = Math.round(
          ((parseFloat(rowReg) - parseFloat(rowSale)) / parseFloat(rowReg)) *
            100,
        );

        return {
          key: `${slug}-w-${idx}-p-${pIdx}`,
          variantId: `${item.color}-${p.doses}`,
          pack: p.doses,
          label: `${item.weight} - ${p.doses}`,
          image: variantImage,
          regularPrice: rowReg,
          salePrice: rowSale,
          savePct,
          stock: product.stock || 50,
          sku: `${product.sku || "PET"}-${item.color.slice(0, 3).toUpperCase()}-${p.doseCount}`,
          tier: p.tier || (savePct > 0 ? `Save ${savePct}%` : ""),
        };
      });

      return {
        id: `grp-weight-${idx}`,
        groupTitle: gTitle,
        shortWeight: item.weight,
        subtitle: item.subtitle,
        color: item.color,
        colorHex: item.colorHex,
        image: variantImage,
        rows,
      };
    });
  }, [product, slug]);

  const displayedGroups = useMemo(() => {
    if (activeFilterTab === "all") return variantGroups;
    return variantGroups.filter((g) => g.id === activeFilterTab);
  }, [variantGroups, activeFilterTab]);

  const allFlatRows = useMemo(() => {
    const list = [];
    variantGroups.forEach((g) => {
      (g.rows || []).forEach((r) => list.push({ ...r, group: g }));
    });
    return list;
  }, [variantGroups]);

  const totalVariantCount = allFlatRows.length;

  const lowestStartingPrice = useMemo(() => {
    let min = Infinity;
    allFlatRows.forEach((r) => {
      const s = parseFloat(r.salePrice);
      if (!isNaN(s) && s < min) min = s;
    });
    return min !== Infinity
      ? min.toFixed(2)
      : product?.price
        ? Number(product.price).toFixed(2)
        : "19.99";
  }, [allFlatRows, product]);

  const handleStepQty = (key, delta, maxStock = 99) => {
    setQuantities((prev) => {
      const current = prev[key] || 1;
      const next = Math.max(1, Math.min(maxStock, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const handleAddToCartVariant = (row, group) => {
    if (!product || !onAddToCart) return;

    if (isVetOnly(product) && lacksVetAccess(product, user)) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    const qty = quantities[row.key] || 1;
    const variantLabel = row.label || row.pack;
    const groupLabel =
      group.cleanTitle ||
      group.shortLabel ||
      (group.groupTitle
        ? group.groupTitle
            .replace(product.name || product.title || "", "")
            .replace(/[()]/g, "")
            .trim()
        : "");
    const isDifferent =
      groupLabel &&
      variantLabel &&
      !variantLabel.toLowerCase().includes(groupLabel.toLowerCase()) &&
      variantLabel.toLowerCase() !== groupLabel.toLowerCase();
    const finalVariantName = isDifferent
      ? `${groupLabel} - ${variantLabel}`
      : variantLabel || groupLabel;
    const titleWithVariant = finalVariantName
      ? `${product.name || product.title} (${finalVariantName})`
      : product.name || product.title;

    const itemToAdd = {
      ...product,
      productId: product.id,
      id: `${product.id}-${row.key}`,
      variantId: row.variantId,
      variantLabel: finalVariantName,
      selectedOption: finalVariantName,
      name: titleWithVariant,
      title: titleWithVariant,
      price: parseFloat(row.salePrice),
      originalPrice: parseFloat(row.regularPrice),
      oldPrice: parseFloat(row.regularPrice),
      image: row.image || group.image || product.image,
    };

    onAddToCart(itemToAdd, qty, finalVariantName);

    setAddingState((prev) => ({ ...prev, [row.key]: true }));
    setTimeout(() => {
      setAddingState((prev) => ({ ...prev, [row.key]: false }));
    }, 1500);
  };

  const handleBuyNowVariant = (row, group) => {
    if (!product) return;

    if (isVetOnly(product) && lacksVetAccess(product, user)) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    const qty = quantities[row.key] || 1;
    const variantLabel = row.label || row.pack;
    const groupLabel =
      group.cleanTitle ||
      group.shortLabel ||
      (group.groupTitle
        ? group.groupTitle
            .replace(product.name || product.title || "", "")
            .replace(/[()]/g, "")
            .trim()
        : "");
    const isDifferent =
      groupLabel &&
      variantLabel &&
      !variantLabel.toLowerCase().includes(groupLabel.toLowerCase()) &&
      variantLabel.toLowerCase() !== groupLabel.toLowerCase();
    const finalVariantName = isDifferent
      ? `${groupLabel} - ${variantLabel}`
      : variantLabel || groupLabel;
    const titleWithVariant = finalVariantName
      ? `${product.name || product.title} (${finalVariantName})`
      : product.name || product.title;

    const itemToAdd = {
      ...product,
      productId: product.id,
      id: `${product.id}-${row.key}`,
      variantId: row.variantId,
      variantLabel: finalVariantName,
      selectedOption: finalVariantName,
      name: titleWithVariant,
      title: titleWithVariant,
      price: parseFloat(row.salePrice),
      originalPrice: parseFloat(row.regularPrice),
      oldPrice: parseFloat(row.regularPrice),
      quantity: qty,
      image: row.image || group.image || product.image,
    };

    try {
      window.sessionStorage.setItem(
        BUY_NOW_STORAGE_KEY,
        JSON.stringify(itemToAdd),
      );
      navigate("/checkout?buyNow=1");
    } catch {
      navigate("/checkout?buyNow=1");
    }
  };

  const isBaseWishlisted =
    Array.isArray(wishlist) &&
    wishlist.some(
      (id) =>
        String(id) === String(product?.id) ||
        String(id) === String(product?.productId) ||
        String(id) === String(product?.slug),
    );

  const handleToggleBaseWishlist = () => {
    if (!onToggleWishlist || !product) return;
    onToggleWishlist({
      ...product,
      id: product.id,
      productId: product.id,
      slug: product.slug,
      name: product.name || product.title,
      title: product.title || product.name,
      image: product.image,
      price: parseFloat(lowestStartingPrice),
      originalPrice: product.originalPrice,
    });
  };

  const handleToggleRowWishlist = (row, group) => {
    if (!onToggleWishlist || !product) return;
    const variantWishlistId = `${product.id}-${row.key}`;
    const variantLabel = row.label || row.pack;

    onToggleWishlist({
      ...product,
      id: variantWishlistId,
      baseProductId: product.id,
      productId: product.id,
      slug: product.slug,
      name: `${product.name || product.title} (${variantLabel})`,
      title: `${product.title || product.name} (${variantLabel})`,
      image: row.image || group.image || product.image,
      price: parseFloat(row.salePrice),
      originalPrice: parseFloat(row.regularPrice),
      selectedOption: variantLabel,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full border-4 border-brand-teal/20 border-t-brand-teal animate-spin" />
          <p className="text-sm font-heading font-black text-brand-muted">
            Loading pack options &amp; variant matrix...
          </p>
        </div>
      </div>
    );
  }

  if (product && !isFamilyProduct(product)) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full border-4 border-brand-teal/20 border-t-brand-teal animate-spin" />
          <p className="text-sm font-heading font-black text-brand-text">
            Redirecting to product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-bg py-20 px-4 text-center">
        <div className="max-w-md mx-auto p-8 rounded-[2.5rem] border border-brand-border bg-brand-surface shadow-sm">
          <span className="text-5xl">🐾</span>
          <h1 className="mt-4 font-heading text-2xl font-black text-brand-text">
            Product Not Found
          </h1>
          <p className="mt-2 text-xs font-sans text-brand-muted">
            The requested product configuration could not be loaded.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-coral px-6 py-2.5 text-xs font-heading font-black text-white hover:bg-brand-coral-dark transition"
          >
            <ArrowLeft size={14} /> Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const productDetailsUrl = `/product/${product.slug || product.id}`;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans relative pb-20">
      {/* ── Top Breadcrumbs Bar ───────────────────────────────────────────── */}
      <div className="border-b border-brand-border/60 bg-brand-surface/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <nav className="flex items-center gap-2 font-heading font-bold text-brand-muted">
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-brand-coral transition-colors"
            >
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} className="text-brand-border" />
            <Link
              to="/shop"
              className="hover:text-brand-coral transition-colors"
            >
              Shop
            </Link>
            <ChevronRight size={13} className="text-brand-border" />
            <Link
              to={productDetailsUrl}
              className="text-brand-text font-black hover:text-brand-coral transition-colors truncate max-w-[180px] sm:max-w-xs"
            >
              {product.name || product.title}
            </Link>
            <ChevronRight size={13} className="text-brand-border" />
            <span className="text-brand-teal font-black">
              Variant Matrix &amp; Multi-Packs
            </span>
          </nav>

          <Link
            to={productDetailsUrl}
            className="inline-flex items-center gap-1.5 font-heading font-black text-xs text-brand-teal hover:text-brand-deep-teal transition-colors"
          >
            <span>View Full Product Page</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8 text-left">
        {/* ── 1. STUDIO HEADER DECK ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-brand-peach/40 via-brand-surface to-brand-peach/20 border border-brand-border/80 rounded-[2.5rem] p-6 sm:p-8 lg:p-10 shadow-[0_12px_36px_rgba(74,36,26,0.04)] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-heading font-black uppercase tracking-wider bg-brand-peach text-brand-coral border border-brand-border/60 flex items-center gap-1">
                <Sparkles size={12} />
                {product.category || "Pet Essentials"}
              </span>

              {product.brand && (
                <span className="text-xs font-bold text-brand-muted bg-white px-3 py-1 rounded-full border border-brand-border/60">
                  Brand: {product.brand}
                </span>
              )}

              <span className="text-[11px] font-bold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full border border-brand-teal/20 flex items-center gap-1">
                <ShieldCheck size={13} /> Authentic Factory Sealed
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black text-brand-text tracking-tight leading-tight">
              <p
                className="hover:text-brand-coral transition-colors"
                title="Click to view full product details"
              >
                {product.name || product.title}
              </p>
            </h1>

            {/* Star Rating & Reviews */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <p className="text-xs text-brand-muted font-semibold hover:text-brand-coral transition-colors">
                Based on {reviewStats.totalReviews} verified pet parent reviews
              </p>

              <span className="text-brand-border hidden sm:inline">•</span>

              <span className="text-xs font-heading font-black text-brand-teal bg-white px-3 py-1 rounded-full border border-brand-border/60 shadow-2xs">
                {totalVariantCount} Option{totalVariantCount > 1 ? "s" : ""}{" "}
                Available
              </span>
            </div>

            <p className="text-xs sm:text-sm text-brand-muted font-sans font-medium leading-relaxed max-w-2xl pt-1">
              Browse and select from all available formats, sizes, and
              multi-pack options below. Click on any variant thumbnail or name
              to inspect detailed specifications, sizing tables, and
              ingredients.
            </p>
          </div>

          {/* Hero Price & Actions Deck */}
          <div className="shrink-0 flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t lg:border-t-0 lg:border-l border-brand-border/80 pt-4 lg:pt-0 lg:pl-8 gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-heading font-black uppercase tracking-widest text-brand-muted block">
                Options Starting From
              </span>
              <div className="text-3xl sm:text-4xl font-heading font-black text-brand-coral leading-none mt-1">
                ${lowestStartingPrice}
              </div>
              <span className="mt-1 inline-block text-[11px] font-heading font-black text-brand-coral bg-brand-peach/60 px-3 py-0.5 rounded-full border border-brand-coral/20">
                Bulk savings applied
              </span>
            </div>
          </div>
        </div>

        {/* ── 4. DEDICATED VARIANT MATRIX & PACK SELECTION DECK ─────────────── */}
        {/* Distinctive horizontal matrix row design — NOT standard vertical product cards! */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/70">
            <div>
              <span className="text-[11px] font-heading font-black uppercase tracking-wider text-brand-teal">
                Interactive Variant Studio
              </span>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text">
                Select Your Desired Format &amp; Pack Size
              </h2>
            </div>
            <span className="text-xs font-heading font-bold text-brand-muted hidden sm:inline">
              Click any image to view full specifications &amp; sizing
            </span>
          </div>

          <div className="space-y-12">
            {displayedGroups.map((group) => {
              const displayTitle =
                group.cleanTitle ||
                group.shortLabel ||
                group.groupTitle
                  .replace(product.name || product.title || "", "")
                  .replace(/[()]/g, "")
                  .trim() ||
                group.groupTitle;

              return (
                <section
                  key={group.id}
                  className="bg-brand-surface rounded-[32px] border border-brand-border/90 p-6 sm:p-8 lg:p-10 shadow-sm space-y-6 transition-all"
                >
                  {/* Formulation Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-brand-border/70">
                    <div className="flex items-center gap-3.5">
                      <div className="relative size-12 sm:size-14 rounded-2xl bg-brand-peach/40 border border-brand-border p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        <img
                          src={group.image || product.image}
                          alt={displayTitle}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-heading text-xl sm:text-2xl font-black text-brand-text">
                            <Link
                              to={`${productDetailsUrl}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.id)}&option=${encodeURIComponent(group.rows[0]?.label || group.rows[0]?.pack || displayTitle)}`}
                              className="hover:underline hover:text-brand-coral transition-colors"
                              title="View this formulation details"
                            >
                              {displayTitle}
                            </Link>
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-heading font-extrabold bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                            <ShieldCheck
                              size={12}
                              className="text-brand-teal"
                            />
                            Verified Formulation
                          </span>
                        </div>
                        <p className="text-xs font-sans font-semibold text-brand-muted mt-0.5">
                          {group.subtitle ||
                            `Authentic ${product.name || product.title} formulation tailored to specific pet care requirements`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-heading font-extrabold text-brand-teal bg-brand-teal/10 px-3.5 py-1.5 rounded-full border border-brand-teal/20">
                        {group.rows.length}{" "}
                        {group.rows.length === 1 ? "Option" : "Options"}{" "}
                        Available
                      </span>
                    </div>
                  </div>

                  {/* Formulation Showcase: Left Spotlight + Right Pack Cards */}
                  <div className="flex flex-col lg:flex-row items-stretch gap-4 sm:gap-5">
                    {/* Left Column: Compact Variant Formulation Spotlight */}
                    <div className="w-full lg:w-[220px] shrink-0 flex flex-col justify-between rounded-2xl border border-brand-border/80 bg-gradient-to-b from-brand-peach/30 via-white to-brand-surface p-4 text-center shadow-2xs group/spotlight">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-heading font-black uppercase tracking-wider text-brand-coral bg-white px-2.5 py-0.5 rounded-full border border-brand-border/70 shadow-2xs flex items-center gap-1">
                            <Sparkles size={11} className="text-brand-coral" />
                            Spotlight
                          </span>
                          <span className="text-[10px] font-heading font-bold text-brand-muted">
                            {product.brand || "Paws & Care"}
                          </span>
                        </div>

                        {/* Main Variant Formulation Image */}
                        <Link
                          to={`${productDetailsUrl}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.id)}&option=${encodeURIComponent(group.rows[0]?.label || group.rows[0]?.pack || displayTitle)}`}
                          className="relative w-[110px] h-[105px] mx-auto flex items-center justify-center p-2 my-1.5 cursor-pointer group/spotlightImg rounded-xl bg-white shadow-xs border border-brand-border/60 overflow-hidden block"
                          title="Click to view full product details"
                        >
                          <img
                            src={group.image || product.image}
                            alt={displayTitle}
                            className="max-h-[90px] w-auto object-contain transition-transform duration-500 group-hover/spotlightImg:scale-108 drop-shadow-xs"
                          />

                          {/* Hover Overlay with Eye Icon */}
                          <div className="absolute inset-0 bg-brand-text/20 opacity-0 group-hover/spotlightImg:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-white text-brand-text flex items-center justify-center shadow-lg transform translate-y-1 group-hover/spotlightImg:translate-y-0 transition-all duration-300">
                              <Eye className="w-4 h-4 text-brand-coral" />
                            </div>
                          </div>
                        </Link>

                        <div className="text-center mt-1.5">
                          <h3 className="font-heading text-sm sm:text-base font-black text-brand-text leading-tight">
                            {displayTitle}
                          </h3>
                          {group.subtitle && (
                            <p className="text-[11px] font-sans font-semibold text-brand-muted mt-1 leading-snug line-clamp-2">
                              {group.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-brand-border/70 flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-heading font-extrabold text-brand-teal">
                          <ShieldCheck size={13} className="shrink-0" />
                          <span>100% Genuine Formula</span>
                        </div>
                        <Link
                          to={`${productDetailsUrl}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.id)}&option=${encodeURIComponent(group.rows[0]?.label || group.rows[0]?.pack || displayTitle)}`}
                          className="text-xs font-heading font-black text-brand-coral hover:text-brand-text transition-colors inline-flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-white border border-brand-border hover:border-brand-coral/40 shadow-2xs"
                        >
                          <span>View Specs</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>

                    {/* Right Column: Pack Selection Cards Grid (Variants inside this variant) */}
                    <div
                      className={`flex-1 grid grid-cols-1 ${
                        group.rows.length >= 3
                          ? "sm:grid-cols-2 lg:grid-cols-3"
                          : group.rows.length === 2
                            ? "sm:grid-cols-2"
                            : "sm:grid-cols-1 max-w-md"
                      } gap-3.5`}
                    >
                      {group.rows.map((row) => {
                        const isOutOfStock = row.stock === 0;
                        const currentQty = quantities[row.key] || 1;
                        const isAdding = addingState[row.key];
                        const isSelected = activePackKey === row.key;
                        const regNum = parseFloat(row.regularPrice) || 0;
                        const saleNum = parseFloat(row.salePrice) || 0;
                        const savingsAmount =
                          regNum > saleNum
                            ? (regNum - saleNum).toFixed(2)
                            : null;
                        const savePct =
                          row.savePct ||
                          (regNum > saleNum
                            ? Math.round(((regNum - saleNum) / regNum) * 100)
                            : 0);
                        const variantTargetUrl = `${productDetailsUrl}?variant=${encodeURIComponent(row.variantId || row.key)}&familyVariantId=${encodeURIComponent(group.id)}&option=${encodeURIComponent(row.label || row.pack)}`;

                        const variantWishlistId = `${product.id}-${row.key}`;
                        const isRowWishlisted =
                          Array.isArray(wishlist) &&
                          wishlist.some(
                            (id) =>
                              String(id) === String(variantWishlistId) ||
                              String(id) === String(product.id),
                          );

                        return (
                          <div
                            key={row.key}
                            onClick={() => setActivePackKey(row.key)}
                            className={`group/card rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all duration-300 relative cursor-pointer ${
                              isSelected
                                ? "bg-white border-brand-coral ring-2 ring-brand-coral/20 shadow-md -translate-y-0.5"
                                : "bg-white border-brand-border hover:border-brand-coral/50 hover:shadow-md hover:-translate-y-0.5"
                            } ${isOutOfStock ? "opacity-60" : ""}`}
                          >
                            {/* Top Content Block */}
                            <div className="space-y-2.5">
                              {/* Header: SKU & Pack Name + Badges & Wishlist */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-heading text-lg sm:text-xl font-black text-brand-text group-hover/card:text-brand-coral transition-colors leading-tight">
                                    <Link
                                      to={variantTargetUrl}
                                      onClick={(e) => e.stopPropagation()}
                                      className="hover:underline transition-all"
                                      title="View details for this option"
                                    >
                                      {row.pack || row.name || row.label}
                                    </Link>
                                  </h4>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleRowWishlist(row, group);
                                    }}
                                    className={`size-7 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                                      isRowWishlisted
                                        ? "bg-brand-coral text-white border-brand-coral shadow-2xs"
                                        : "bg-white text-brand-muted border-brand-border hover:text-brand-coral"
                                    }`}
                                    title="Save to wishlist"
                                  >
                                    <Heart
                                      size={12}
                                      fill={
                                        isRowWishlisted
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                  </button>
                                </div>
                              </div>

                              {row.subtitle && (
                                <p className="text-[11px] text-brand-muted font-sans font-semibold leading-snug line-clamp-2">
                                  {row.subtitle}
                                </p>
                              )}

                              {/* Dedicated Pricing Deck */}
                              <div className="p-3 rounded-xl bg-brand-peach/35 border border-brand-peach/60 flex items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] font-heading font-black uppercase tracking-wider text-brand-muted block leading-none mb-1">
                                    You Pay
                                  </span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl sm:text-3xl font-heading font-black text-brand-coral leading-none">
                                      ${row.salePrice}
                                    </span>
                                    {regNum > saleNum && (
                                      <span className="text-xs font-sans font-extrabold text-brand-muted line-through">
                                        ${row.regularPrice}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {savingsAmount &&
                                  parseFloat(savingsAmount) > 0 && (
                                    <div className="text-right shrink-0">
                                      <span className="inline-block text-[11px] font-heading font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-md shadow-2xs">
                                        Save ${savingsAmount}
                                      </span>
                                      {savePct > 0 && (
                                        <span className="text-[10px] font-heading font-black text-brand-coral block mt-0.5">
                                          {savePct}% OFF
                                        </span>
                                      )}
                                    </div>
                                  )}
                              </div>

                              {/* Value & Dispatch Assurance Strip */}
                              <div className="flex items-center justify-between gap-2 text-[11px] font-heading font-bold text-brand-muted pt-1 border-t border-brand-border/50">
                                <span className="inline-flex items-center gap-1 text-brand-muted">
                                  <Truck
                                    size={12}
                                    className="text-brand-teal shrink-0"
                                  />
                                  Fast Dispatch
                                </span>
                                <span className="inline-flex items-center gap-1 text-brand-muted">
                                  <ShieldCheck
                                    size={12}
                                    className="text-brand-coral shrink-0"
                                  />
                                  Direct Sealed
                                </span>
                                {isOutOfStock ? (
                                  <span className="text-rose-600 font-extrabold">
                                    Out of stock
                                  </span>
                                ) : (
                                  <></>
                                )}
                              </div>
                            </div>

                            {/* Bottom Action Deck */}
                            <div className="pt-2 border-t border-brand-border/40 space-y-2.5">
                              {/* Quantity Stepper Row */}
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-heading font-extrabold text-brand-muted">
                                  Quantity:
                                </span>
                                <div className="inline-flex items-center rounded-xl border border-brand-border bg-brand-bg shadow-2xs overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepQty(row.key, -1, row.stock);
                                    }}
                                    disabled={isOutOfStock || currentQty <= 1}
                                    className="h-7 w-7 flex items-center justify-center text-brand-muted hover:bg-brand-peach hover:text-brand-coral transition disabled:opacity-30 cursor-pointer"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus size={12} />
                                  </button>
                                  <span className="w-7 text-center text-xs font-heading font-black text-brand-text select-none">
                                    {currentQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStepQty(row.key, 1, row.stock);
                                    }}
                                    disabled={
                                      isOutOfStock ||
                                      currentQty >= (row.stock || 99)
                                    }
                                    className="h-7 w-7 flex items-center justify-center text-brand-muted hover:bg-brand-peach hover:text-brand-coral transition disabled:opacity-30 cursor-pointer"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Dual Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCartVariant(row, group);
                                  }}
                                  disabled={isOutOfStock || isAdding}
                                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-heading font-black transition-all cursor-pointer shadow-xs active:scale-95 ${
                                    isOutOfStock
                                      ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                                      : isAdding
                                        ? "bg-brand-teal text-white shadow-md scale-95"
                                        : "bg-brand-coral hover:bg-brand-coral-dark text-white"
                                  }`}
                                >
                                  {isOutOfStock ? (
                                    "Sold Out"
                                  ) : isAdding ? (
                                    <>
                                      <Check size={13} className="stroke-[3]" />{" "}
                                      Added!
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart size={13} /> Add
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBuyNowVariant(row, group);
                                  }}
                                  disabled={isOutOfStock}
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-heading font-black border-2 border-brand-teal text-brand-teal bg-white hover:bg-brand-teal hover:text-white transition active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                  <PawPrint size={13} fill="currentColor" />
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
        </div>

        {/* ── 5. DETAILED SPECIFICATIONS & OVERVIEW (Only shown if description exists) ── */}
        {richHtmlContent ? (
          <section className="bg-brand-surface rounded-[2.5rem] p-6 sm:p-10 border border-brand-border/80 shadow-2xs text-left">
            <div className="max-w-4xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-teal/20 bg-brand-teal/10 px-3.5 py-1.5 text-[11px] font-heading font-black uppercase tracking-wider text-brand-teal">
                <Layers size={14} className="text-brand-teal" />
                <span>Full Product Specifications &amp; Overview</span>
              </div>

              <div
                className="variant-rich-text prose max-w-none text-brand-text leading-relaxed"
                dangerouslySetInnerHTML={{ __html: richHtmlContent }}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
