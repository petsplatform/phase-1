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
  ChevronDown,
  CheckCircle2,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Info,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";
import { useCart } from "../utils/cartFunctionality";
import { useWishlist } from "../utils/wishlistFunctionality.js";
import { useAuth } from "../store/authentication/authContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
} from "../utils/productUtils";
import { formatProductRichContent, isSlugLike } from "../utils/htmlUtils";

const WEIGHT_VARIANTS_DOGS = [
  {
    weight: "2.8-5.5 lbs",
    color: "Yellow",
    colorHex: "#eab308",
    multiplier: 1.0,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.95, regMult: 2.75 },
    ],
  },
  {
    weight: "5.6-11 lbs",
    color: "Purple",
    colorHex: "#a855f7",
    multiplier: 1.03,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    weight: "11.1-22 lbs",
    color: "Caramel",
    colorHex: "#d97706",
    multiplier: 1.09,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    weight: "22.1-44 lbs",
    color: "Teal",
    colorHex: "#0d9488",
    multiplier: 1.18,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    weight: "44.1-88 lbs",
    color: "Red",
    colorHex: "#dc2626",
    multiplier: 1.32,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    weight: "above 88 lbs",
    color: "Brown",
    colorHex: "#78350f",
    multiplier: 1.55,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
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
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.95, regMult: 2.75 },
    ],
  },
  {
    weight: "5.6-11 lbs",
    color: "Orange",
    colorHex: "#ea580c",
    multiplier: 1.06,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    weight: "11.1-22 lbs",
    color: "Green",
    colorHex: "#16a34a",
    multiplier: 1.15,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
];

const detailFieldMap = {
  shipping: [
    "shipping",
    "shippingInfo",
    "shippingInformation",
    "shippingDescription",
    "shippingPolicy",
  ],
  returns: [
    "returns",
    "return",
    "returnsInfo",
    "returnInfo",
    "returnsPolicy",
    "returnPolicy",
    "refundPolicy",
  ],
};

const isPresent = (value) => value !== undefined && value !== null && value !== "";

const splitDetailText = (value) =>
  String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const normalizeDetailContent = (value) => {
  if (!isPresent(value)) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeDetailContent);

  if (typeof value === "object") {
    const textValue = value.text ?? value.description ?? value.content ?? value.value ?? value.message;
    if (isPresent(textValue)) {
      return splitDetailText(textValue).map((text) => ({
        title: value.title || value.label || value.name,
        text,
      }));
    }
    return Object.entries(value)
      .filter(([, itemValue]) => isPresent(itemValue))
      .flatMap(([key, itemValue]) =>
        normalizeDetailContent(itemValue).map((line) => ({
          ...line,
          title: line.title || key.replace(/([A-Z])/g, " $1").replace(/[_-]+/g, " "),
        })),
      );
  }

  return splitDetailText(value).map((text) => ({ text }));
};

function DetailRows({ items, emptyLabel }) {
  if (!items.length) {
    return (
      <p className="text-sm text-brand-brown/70 leading-relaxed font-medium">
        {emptyLabel} information is not available for this product.
      </p>
    );
  }

  return (
    <div className="space-y-3.5 mt-4 text-xs font-semibold text-brand-brown/75">
      {items.map((item, idx) => (
        <div key={`${item.title || "detail"}-${idx}`} className="flex items-start gap-2.5 bg-[#FAF8FF] p-3.5 rounded-xl border border-[#f0ebf8]">
          <span className="w-4 h-4 rounded-full bg-brand-purple/5 text-[#a855f7] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-2.5 h-2.5" />
          </span>
          <span>
            {item.title && <span className="text-brand-purple font-extrabold">{item.title}: </span>}
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProductVariant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { wishlistIds, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    avgRating: "4.7",
    totalReviews: 2061,
  });

  const variantFilterTab = "all";
  const [activeDetailsTab, setActiveDetailsTab] = useState("description");
  const [quantities, setQuantities] = useState({});
  const [addingState, setAddingState] = useState({});

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setProduct(null);

    // Fetch review statistics
    reviewApi
      .getProductReviews(id)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setReviewsList(list);
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

    // Fetch product details
    productApi
      .getProductById(id)
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
  }, [id]);

  // Safety Guard: if product is loaded and is a SIMPLE product (not FAMILY), redirect directly to product details!
  useEffect(() => {
    if (product && !isLoading) {
      if (!isFamilyProduct(product)) {
        navigate(`/product/${product.id || id}`, { replace: true });
      }
    }
  }, [product, isLoading, navigate, id]);

  // Main product image resolution
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

  // Dynamic Admin Rich-Text Content (Compatible with Admin WYSIWYG editor API responses)
  const richHtmlContent = useMemo(() => {
    const parentContent =
      product?.productDetails?.content ||
      product?.content ||
      product?.parentContent ||
      "";
    return formatProductRichContent(parentContent, product);
  }, [product]);

  const prodDescription = useMemo(() => {
    const raw =
      product?.shortDescription ||
      product?.productDetails?.overview ||
      product?.productDetails?.description ||
      "";
    if (!raw || isSlugLike(raw)) return "";
    return raw.replace(/<[^>]*>/g, "").trim();
  }, [product]);

  // Build modern variant groups tailored to Happy Pet
  const variantGroups = useMemo(() => {
    if (!product) return [];

    const basePrice = Number(product.sellPrice || product.price || 36.63);
    const prodTitle = product.name || product.title || "Pet Product";
    const isCat =
      product.petType?.toLowerCase() === "cat" ||
      product.categoryName?.toLowerCase().includes("cat") ||
      prodTitle.toLowerCase().includes("cat");

    const templateWeights = isCat ? WEIGHT_VARIANTS_CATS : WEIGHT_VARIANTS_DOGS;
    const speciesLabel = isCat ? "Cats" : "Dogs";

    // Helper to get clean formulation label (e.g., "2.8-5.5 lbs (Yellow)")
    const getCleanFormulationLabel = (fVar, idx) => {
      const cap = (s) =>
        s ? String(s).replace(/\b[a-z]/g, (c) => c.toUpperCase()) : s;
      const color = fVar.packColor || fVar.color;
      if (fVar.weightRange) {
        return color ? `${fVar.weightRange} (${cap(color)})` : fVar.weightRange;
      }
      let raw = fVar.displayName || fVar.name || `Variant ${idx + 1}`;
      // Normalize whitespace
      raw = raw.replace(/[\u00A0\s]+/g, " ").trim();
      const normTitle = (prodTitle || "").replace(/[\u00A0\s]+/g, " ").trim();
      if (normTitle) {
        const esc = normTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        raw = raw.replace(new RegExp(esc, "gi"), "");
      }
      if (normTitle) {
        normTitle.split(/\s+/).forEach((w) => {
          if (w.length >= 4) {
            const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            raw = raw.replace(new RegExp(`\\b${esc}\\b`, "gi"), "");
          }
        });
      }
      raw = raw
        .replace(/\bfor\s+(dogs?|cats?|pets?)\b/gi, "")
        .replace(/^[-–—:/,\s()]+|[-–—:/,\s()]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // Capitalize inside parentheses e.g. (yellow) -> (Yellow)
      raw = raw.replace(/\(([^)]+)\)/g, (_, m) => `(${cap(m)})`);

      if (color && !raw.toLowerCase().includes(String(color).toLowerCase())) {
        raw = raw ? `${raw} (${cap(color)})` : cap(color);
      }
      return raw || fVar.displayName || fVar.name || `Variant ${idx + 1}`;
    };

    // Case 0: Backend explicit familyVariants
    if (product.familyVariants && product.familyVariants.length > 0) {
      return product.familyVariants.map((fVar, fIdx) => {
        const cleanFName = getCleanFormulationLabel(fVar, fIdx);

        // Group title should never have double parentheses
        let groupTitle = "";
        if (cleanFName.toLowerCase().includes(prodTitle.toLowerCase())) {
          groupTitle = cleanFName;
        } else if (cleanFName.includes("(") && cleanFName.includes(")")) {
          groupTitle = `${prodTitle} - ${cleanFName}`;
        } else {
          groupTitle = `${prodTitle} (${cleanFName})`;
        }

        const subtitle =
          fVar.shortDescription &&
          fVar.shortDescription !== fVar.weightRange &&
          !isSlugLike(fVar.shortDescription)
            ? fVar.shortDescription
            : fVar.weightRange
              ? `Weight: ${fVar.weightRange}`
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
              (ov.label &&
                ov.label.toLowerCase().includes(cleanFName.toLowerCase())),
          );
        }

        const rows = skus.map((s, sIdx) => {
          const unitSale = Number(
            s.pricing?.finalPrice ??
              s.pricing?.salePrice ??
              s.salePrice ??
              s.price ??
              basePrice,
          );
          const unitReg = Number(
            s.pricing?.price ??
              s.pricing?.regularPrice ??
              s.regularPrice ??
              s.price ??
              unitSale * 1.35,
          );
          const packLabel =
            s.packLabel ||
            s.packName ||
            s.pack ||
            s.packSizeLabel ||
            s.packSize ||
            s.doseLabel ||
            s.doses ||
            s.label ||
            s.name ||
            `${s.dosesCount || sIdx + 1} Pack`;

          return {
            key: `fv-${fVar.id || fIdx}-sku-${s.id || sIdx}`,
            pack: packLabel,
            doses: s.dosesCount ? `${s.dosesCount} Doses` : s.doseLabel || s.doses || null,
            sku: s.sku || `${product.sku || "HP"}-${fIdx + 1}-${sIdx + 1}`,
            regularPrice: unitReg.toFixed(2),
            salePrice: unitSale.toFixed(2),
            savingsPct: Math.round(
              ((unitReg - unitSale) / (unitReg || 1)) * 100,
            ),
            stock: Number(s.stock ?? s.inventory?.stockQuantity ?? 50),
            variantId: s.id || `${fVar.id}-${sIdx}`,
          };
        });

        const fallbackRows = [
          {
            key: `fv-${fVar.id || fIdx}-row-1`,
            pack: `1 Pack`,
            doses: null,
            sku: `${product.sku || "HP"}-${fIdx + 1}-STD`,
            regularPrice: (basePrice * 1.35).toFixed(2),
            salePrice: basePrice.toFixed(2),
            savingsPct: 26,
            stock: 50,
            variantId: `${fVar.id}-std`,
          },
          {
            key: `fv-${fVar.id || fIdx}-row-2`,
            pack: `2 Pack`,
            doses: null,
            sku: `${product.sku || "HP"}-${fIdx + 1}-VAL`,
            regularPrice: (basePrice * 2.5).toFixed(2),
            salePrice: (basePrice * 1.9).toFixed(2),
            savingsPct: 24,
            stock: 50,
            variantId: `${fVar.id}-val`,
          },
        ];

        const colorVal = fVar.packColor || fVar.color || null;
        let colorHexVal = fVar.packColorHex || fVar.colorHex || null;
        if (!colorHexVal && colorVal) {
          const cLower = String(colorVal).toLowerCase();
          if (cLower.includes("yellow")) colorHexVal = "#eab308";
          else if (cLower.includes("purple")) colorHexVal = "#a855f7";
          else if (cLower.includes("blue")) colorHexVal = "#3b82f6";
          else if (cLower.includes("green") || cLower.includes("teal"))
            colorHexVal = "#10b981";
          else if (cLower.includes("red")) colorHexVal = "#ef4444";
        }

        return {
          id: `fv-${fVar.id || fIdx}`,
          rawId: fVar.id || `${fIdx}`,
          title: groupTitle,
          shortLabel: cleanFName,
          subtitle,
          description:
            (!isSlugLike(fVar.shortDescription) ? fVar.shortDescription : "") ||
            (!isSlugLike(fVar.description) ? fVar.description : "") ||
            (!isSlugLike(fVar.overview) ? fVar.overview : "") ||
            (fVar.weightRange ? `Formulated for ${fVar.weightRange}` : "") ||
            prodDescription ||
            "",
          color: colorVal,
          colorHex: colorHexVal || "#4B004B",
          image: variantImage,
          rows: rows.length > 0 ? rows : fallbackRows,
        };
      });
    }

    // If backend provided optionVariants, map them cleanly
    if (product.optionVariants && product.optionVariants.length > 0) {
      return product.optionVariants.map((v, idx) => {
        const rowSale =
          v.pricing?.finalPrice ?? v.price ?? v.salePrice ?? basePrice;
        const rowReg = v.pricing?.price ?? v.regularPrice ?? rowSale * 1.35;
        const label =
          v.packLabel ||
          v.packName ||
          v.label ||
          v.name ||
          `Option ${idx + 1}`;

        return {
          id: `opt-grp-${v.id || idx}`,
          title: `${prodTitle} - ${label}`,
          shortLabel: label,
          color: null,
          colorHex: "#4B004B",
          image:
            v.image ||
            product.images?.[idx % product.images.length] ||
            product.image,
          rows: [
            {
              key: `opt-${v.id || idx}-std`,
              pack: `${label} (Standard Pack)`,
              doses: "Standard Pack",
              sku: v.sku || `${product.sku || "HP"}-${idx + 1}`,
              regularPrice: Number(rowReg).toFixed(2),
              salePrice: Number(rowSale).toFixed(2),
              savingsPct: Math.round(((rowReg - rowSale) / rowReg) * 100),
              stock: v.stock ?? 50,
              variantId: v.id,
            },
            {
              key: `opt-${v.id || idx}-val`,
              pack: `${label} (Value Pack)`,
              doses: "Value Pack (2x)",
              sku: v.sku
                ? `${v.sku}-val`
                : `${product.sku || "HP"}-${idx + 1}-VAL`,
              regularPrice: Number(rowReg * 1.95).toFixed(2),
              salePrice: Number(rowSale * 1.88).toFixed(2),
              savingsPct: Math.round(
                ((rowReg * 1.95 - rowSale * 1.88) / (rowReg * 1.95)) * 100,
              ),
              stock: v.stock ?? 50,
              variantId: `${v.id}-value`,
            },
          ],
        };
      });
    }

    // Default: Treatment variant spectrum with color swatches
    return templateWeights.map((vw, index) => {
      const weightBasePrice = Number((basePrice * vw.multiplier).toFixed(2));
      const groupTitle = `${prodTitle} for ${speciesLabel} ${vw.weight} (${vw.color})`;
      const variantImage =
        product.images?.[index % product.images.length] || product.image;

      return {
        id: `group-${vw.color.toLowerCase()}`,
        title: groupTitle,
        shortLabel: `${vw.weight} (${vw.color})`,
        color: vw.color,
        colorHex: vw.colorHex,
        image: variantImage,
        rows: vw.packs.map((pk) => {
          const sPrice = Number(weightBasePrice * pk.doseMult);
          const rPrice = Number(weightBasePrice * pk.regMult);
          const pct = Math.round(((rPrice - sPrice) / rPrice) * 100);

          return {
            key: `${product.id}-${vw.color.toLowerCase()}-${pk.doses.replace(/\s+/g, "")}`,
            pack: pk.doses,
            doses: pk.doses,
            sku: `${product.sku || "HP"}-${vw.color.substring(0, 3).toUpperCase()}-${pk.doses.replace(/\s+/g, "")}`,
            regularPrice: rPrice.toFixed(2),
            salePrice: sPrice.toFixed(2),
            savingsPct: pct > 0 ? pct : 25,
            stock:
              product.stockQuantity !== undefined ? product.stockQuantity : 99,
            variantId: `${vw.color}-${pk.doses}`,
          };
        }),
      };
    });
  }, [product]);

  const handleQtyChange = (key, val, maxStock) => {
    const limit =
      Number.isFinite(Number(maxStock)) && Number(maxStock) > 0
        ? Number(maxStock)
        : 99;
    const parsed = parseInt(val, 10) || 1;
    const qty = Math.max(1, Math.min(limit, parsed));
    if (parsed > limit) {
      toast.error(
        `Only ${limit} item${limit > 1 ? "s" : ""} available in stock.`,
      );
    }
    setQuantities((prev) => ({ ...prev, [key]: qty }));
  };

  const handleStepQty = (key, delta, maxStock) => {
    setQuantities((prev) => {
      const current = prev[key] || 1;
      const limit =
        Number.isFinite(Number(maxStock)) && Number(maxStock) > 0
          ? Number(maxStock)
          : 99;
      if (delta > 0 && current >= limit) {
        toast.error(
          `Only ${limit} item${limit > 1 ? "s" : ""} available in stock.`,
        );
        return prev;
      }
      const next = Math.max(1, Math.min(limit, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const handleAddRowToCart = (group, row) => {
    if (!product) return;

    if (isVetOnly(product) && lacksVetAccess(product, user)) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    const qty = quantities[row.key] || 1;
    const maxStock =
      Number.isFinite(Number(row.stock)) && Number(row.stock) > 0
        ? Number(row.stock)
        : 99;
    if (qty > maxStock) {
      toast.error(`Cannot add more than available stock (${maxStock}).`);
      return;
    }

    const variantLabel = `${group.color ? group.color + " " : ""}${row.pack}`;

    const cartItem = {
      ...product,
      id: `${product.id}-${row.key}`,
      productId: product.id,
      name: `${product.name || product.title} (${variantLabel})`,
      title: `${product.name || product.title} (${variantLabel})`,
      variantLabel,
      selectedOption: variantLabel,
      sellPrice: Number(row.salePrice),
      price: Number(row.salePrice),
      originalPrice: Number(row.regularPrice),
      stock: maxStock,
      image: group.image || product.image,
    };

    addToCart(cartItem, qty);
    toast.success(`Added ${qty} × "${cartItem.name}" to cart! 🛒`);

    setAddingState((prev) => ({ ...prev, [row.key]: true }));
    setTimeout(() => {
      setAddingState((prev) => ({ ...prev, [row.key]: false }));
    }, 1200);
  };

  const displayedGroups = useMemo(() => {
    if (variantFilterTab === "all") return variantGroups;
    return variantGroups.filter((g) => g.id === variantFilterTab);
  }, [variantGroups, variantFilterTab]);

  if (isLoading) {
    return (
      <div className="bg-[#FAF8FF] min-h-[70vh] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
          <p className="text-xs font-bold text-brand-purple uppercase tracking-wider">
            Loading Pack Options &amp; Variants...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#FAF8FF] py-20 px-4 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-purple/5 text-brand-purple flex items-center justify-center mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-display font-extrabold text-brand-purple">
          Product Not Found
        </h1>
        <p className="text-xs text-brand-brown/60 mt-1 max-w-sm">
          We couldn't retrieve the requested product. It may have been moved or
          updated.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-purple text-white text-xs font-bold rounded-xl shadow-md hover:bg-brand-purple/90 transition-all"
        >
          <ArrowLeft size={14} /> Back to Products Catalog
        </Link>
      </div>
    );
  }

  const prodName = product.name || product.title || "Product";
  const categoryName = product.categoryName || product.category || "Pet Care";
  const reviewCount = reviewsList.length || Number(product.reviewCount ?? 0);
  const averageRating = reviewsList.length
    ? reviewsList.reduce((sum, review) => sum + Number(review.rating ?? review.star ?? review.stars ?? 0), 0) / reviewsList.length
    : Number(product.averageRating ?? reviewStats.avgRating ?? 0);
  const shippingDetails = normalizeDetailContent(
    detailFieldMap.shipping.map((field) => product[field]).find(isPresent),
  );
  const returnDetails = normalizeDetailContent(
    detailFieldMap.returns.map((field) => product[field]).find(isPresent),
  );

  return (
    <div
      className="min-h-screen select-none relative pb-12"
      style={{
        background:
          "linear-gradient(180deg, #FAF8FF 0%, #FFFBF7 50%, #FAF8FF 100%)",
      }}
    >
      {/* Decorative ambient page glows matching Happy Pet theme */}
      <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-brand-purple/5 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute bottom-10 left-0 w-[450px] h-[450px] bg-brand-peach/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 sm:pt-4 relative z-10 text-left">
        {/* ── BREADCRUMBS & TOP ACTIONS ── */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-brand-purple/10 pb-2.5">
          <div className="text-[11px] font-extrabold text-brand-purple uppercase tracking-[0.2em] flex flex-wrap items-center gap-1.5">
            <Link
              to="/"
              className="hover:text-brand-purple/70 transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/30" />
            <Link
              to="/products"
              className="hover:text-brand-purple/70 transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/30" />
            <span className="text-brand-purple/60">{categoryName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/30" />
            <span className="text-brand-purple font-black">Pack Options</span>
          </div>
        </div>

        {/* ── PRODUCT HERO HEADER CARD ── */}
        <div className="bg-gradient-to-br from-[#FFF7EF] via-white to-[#FFFBF7] border border-[#F0E6D8] rounded-2xl p-4 sm:p-6 shadow-2xs mb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 flex-1 min-w-0">
            {/* Product Main Image Card (No redirect) */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-2xl bg-white border border-[#F0E6D8] p-2 flex items-center justify-center overflow-hidden shadow-2xs relative select-none">
              {mainProductImage || variantGroups[0]?.image ? (
                <img
                  src={mainProductImage || variantGroups[0]?.image}
                  alt={prodName}
                  className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-brand-purple/40">
                  <Package size={30} className="text-brand-purple/40" />
                  <span className="text-[10px] font-bold mt-1">Product</span>
                </div>
              )}
            </div>

            {/* Product Title & Details */}
            <div className="space-y-2 flex-1 min-w-0 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-purple/5 border border-brand-purple/15 text-brand-purple text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-peach" />
                <span>Happy Pet • Multi-Pack &amp; Variant Studio</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-black text-brand-purple leading-tight">
                {prodName}
              </h1>

              {/* Product Short Description (Properly bound, no fallback) */}
              {prodDescription && (
                <p className="text-xs sm:text-sm text-brand-brown/80 font-medium leading-relaxed max-w-2xl line-clamp-3">
                  {prodDescription}
                </p>
              )}

              {/* Variant Formulations Count Badge */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="text-xs sm:text-sm font-black text-brand-purple bg-brand-purple/5 border border-brand-purple/15 px-3 py-1 rounded-full">
                  {variantGroups.length} Variant Formulation
                  {variantGroups.length > 1 ? "s" : ""} Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── BESPOKE HAPPY PET VARIANT CARDS SECTION (Both variants properly showing directly) ── */}
        <div className="space-y-3">
          {displayedGroups.map((group) => {
            const groupWishlistId = `${product.id}__${group.id}`;
            const isGroupWishlisted = wishlistIds.includes(groupWishlistId);

            return (
              <div
                key={group.id}
                className="bg-white border border-[#F0E6D8] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(75,0,75,0.03)] transition-all duration-300 hover:border-brand-purple/30"
              >
                {/* Card Top Header Banner */}
                <div className="px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#FFF7EF] via-[#FFFBF7] to-white border-b border-[#F0E6D8] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {group.colorHex ? (
                      <span
                        className="w-3 h-3 rounded-full shadow-sm shrink-0 border-2 border-white ring-2 ring-brand-purple/10"
                        style={{ backgroundColor: group.colorHex }}
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
                        <Package size={13} />
                      </span>
                    )}
                    <div>
                      <h2 className="text-lg sm:text-xl font-display font-black text-brand-purple truncate">
                        <Link
                          to={`/product/${product.id}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.rawId || group.id)}`}
                          className="hover:underline hover:text-brand-purple/80 transition-colors"
                          title="View this formulation details"
                        >
                          {group.title}
                        </Link>
                      </h2>
                      <p className="text-xs text-brand-brown/70 font-semibold mt-0.5">
                        Guaranteed fresh inventory • {group.rows.length} Pack
                        Option{group.rows.length > 1 ? "s" : ""} Available
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        toggleWishlist(groupWishlistId, {
                          ...product,
                          name: group.title,
                          image: group.image || product.image,
                          selectedOption: group.shortLabel,
                        });
                      }}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                        isGroupWishlisted
                          ? "bg-brand-purple text-brand-peach shadow-md shadow-brand-purple/20 scale-105"
                          : "bg-white text-brand-purple/50 hover:text-brand-purple hover:bg-brand-purple/5 border border-[#E5DDF0]"
                      }`}
                      title={`Save ${group.title} to wishlist`}
                      aria-label="Save variant to wishlist"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isGroupWishlisted
                            ? "fill-brand-peach text-brand-peach"
                            : ""
                        }`}
                      />
                    </button>

                    <span className="text-xs font-black text-brand-purple bg-brand-peach/25 border border-brand-peach/40 px-2.5 py-0.5 rounded-full shadow-2xs">
                      {group.rows.length} Pack Sizes
                    </span>
                  </div>
                </div>

                {/* Card Body: Left Feature Card + Right Pack Option Cards Grid */}
                <div className="p-3 sm:p-4 flex flex-col lg:flex-row items-stretch gap-3 sm:gap-3.5">
                  {/* Left Feature Showcase Card */}
                  <div className="w-full lg:w-[195px] shrink-0 flex flex-col justify-between p-3 rounded-xl bg-gradient-to-b from-[#FFF7EF] via-[#FFF4EC] to-[#FFEFEA] border border-[#F5E6D8] text-center shadow-2xs">
                    <div>
                      <span className="inline-flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-brand-brown bg-white/90 backdrop-blur-xs py-0.5 px-2 rounded-full border border-brand-peach/30 shadow-2xs mb-1.5">
                        🐾 Verified Formula
                      </span>

                      <Link
                        to={`/product/${product.id}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.rawId || group.id)}`}
                        className="relative w-[100px] h-[95px] mx-auto flex items-center justify-center p-2 rounded-xl bg-white shadow-xs border border-brand-purple/5 group/img overflow-hidden cursor-pointer block"
                        title="Click to view full product details"
                      >
                        <img
                          src={group.image || product.image}
                          alt={group.title}
                          className="max-h-[85px] w-auto object-contain transition-transform duration-500 group-hover/img:scale-108"
                          loading="lazy"
                        />

                        {/* Hover Overlay with Eye Icon */}
                        <div className="absolute inset-0 bg-brand-purple/20 opacity-0 group-hover/img:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full bg-white/95 text-brand-purple flex items-center justify-center shadow-lg transform translate-y-1 group-hover/img:translate-y-0 opacity-0 group-hover/img:opacity-100 transition-all duration-300 hover:bg-brand-peach hover:text-brand-purple">
                            <Eye className="w-4 h-4" />
                          </div>
                        </div>
                      </Link>

                      <h3 className="mt-1.5 text-xs sm:text-sm font-black text-brand-purple leading-snug">
                        {group.shortLabel}
                      </h3>
                      {group.description && (
                        <p className="mt-0.5 text-[11px] text-brand-brown/70 font-semibold line-clamp-2 leading-snug">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 pt-2 border-t border-brand-peach/20 flex flex-col gap-1">
                      <Link
                        to={`/product/${product.id}?variant=${encodeURIComponent(group.rows[0]?.variantId || group.id)}&familyVariantId=${encodeURIComponent(group.rawId || group.id)}`}
                        className="inline-flex items-center justify-center gap-1 text-xs font-black text-brand-purple hover:text-white hover:bg-brand-purple py-1.5 px-2 rounded-lg bg-white border border-brand-purple/20 transition-all shadow-2xs"
                        title="View ingredients and full details"
                      >
                        <span>View Specs</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>

                  {/* Right Pack Options Cards Grid */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
                    {group.rows.map((row) => {
                      const currentQty = quantities[row.key] || 1;
                      const isAdding = addingState[row.key];
                      const isOutOfStock = row.stock === 0;
                      const stockLimit = Number.isFinite(Number(row.stock))
                        ? Number(row.stock)
                        : 99;
                      const isMaxStock = currentQty >= stockLimit;

                      const regPriceNum = Number(row.regularPrice);
                      const salePriceNum = Number(row.salePrice);
                      const savingsAmount =
                        regPriceNum > salePriceNum
                          ? (regPriceNum - salePriceNum).toFixed(2)
                          : null;
                      const savingsPct =
                        row.savingsPct ||
                        (regPriceNum > salePriceNum
                          ? Math.round(
                              ((regPriceNum - salePriceNum) / regPriceNum) *
                                100,
                            )
                          : null);

                      return (
                        <div
                          key={row.key}
                          className="relative rounded-xl border border-[#F0E6D8] bg-[#FFFDFB] hover:bg-white hover:border-brand-purple/40 p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 transition-all duration-200 shadow-2xs hover:shadow-md group/pack"
                        >
                          {/* Card Content Top & Middle */}
                          <div className="space-y-2">
                            {/* Pack Title & Meta / Stock */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-base sm:text-lg font-display font-black text-brand-purple group-hover/pack:text-[#380038] transition-colors leading-tight">
                                  <Link
                                    to={`/product/${product.id}?variant=${encodeURIComponent(row.variantId || row.key)}&familyVariantId=${encodeURIComponent(group.rawId || group.id)}`}
                                    className="hover:underline transition-all"
                                    title="View details for this pack"
                                  >
                                    {row.pack}
                                  </Link>
                                </h4>
                              </div>
                            </div>

                            {/* Compact Pricing Box with Savings Pill */}
                            <div className="p-2.5 sm:p-3 rounded-xl bg-[#FFF9F2] border border-[#F5E6D8] flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[10px] text-brand-brown/60 uppercase tracking-wider block font-bold leading-none mb-1">
                                  You Pay
                                </span>
                                <div className="flex items-baseline gap-1.5 sm:gap-2">
                                  <span className="text-2xl sm:text-3xl font-display font-black text-brand-purple leading-none">
                                    ${row.salePrice}
                                  </span>
                                  {row.regularPrice &&
                                    regPriceNum > salePriceNum && (
                                      <span className="text-xs text-brand-brown/40 line-through font-semibold">
                                        ${row.regularPrice}
                                      </span>
                                    )}
                                </div>
                              </div>

                              {/* Savings Badge */}
                              {savingsAmount && Number(savingsAmount) > 0 && (
                                <div className="text-right shrink-0">
                                  <span className="inline-block text-[11px] font-black text-emerald-700 bg-emerald-100/90 border border-emerald-300/80 px-2 py-0.5 rounded-md shadow-2xs">
                                    Save ${savingsAmount}
                                  </span>
                                  {savingsPct > 0 && (
                                    <span className="text-[10px] font-extrabold text-brand-brown/60 block mt-0.5">
                                      {savingsPct}% OFF
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Value / Trust / Dose detail row to fill spacing cleanly */}
                            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-brand-brown/70 pt-1 border-t border-[#F5E6D8]/60">
                              <span className="inline-flex items-center gap-1 text-brand-brown/75">
                                <Truck
                                  size={12}
                                  className="text-brand-purple shrink-0"
                                />
                                Fast Dispatch
                              </span>
                              {row.doses ? (
                                <span className="inline-flex items-center gap-1 font-bold text-brand-purple bg-brand-peach/25 border border-brand-peach/40 px-2 py-0.5 rounded">
                                  {row.doses}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <ShieldCheck
                                    size={12}
                                    className="text-emerald-600 shrink-0"
                                  />
                                  100% Genuine
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Stepper & Add to Cart Button */}
                          <div className="pt-2 flex items-center gap-2">
                            {/* Quantity Increment/Decrement Stepper */}
                            <div className="flex items-center h-9.5 rounded-xl border border-[#E5DDF0] bg-[#FAF8FF] px-1 shadow-2xs shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepQty(row.key, -1, row.stock)
                                }
                                disabled={isOutOfStock || currentQty <= 1}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-purple hover:bg-brand-purple/10 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={13} className="stroke-[2.5]" />
                              </button>
                              <span className="w-7 text-center text-xs font-black text-brand-purple select-none">
                                {isOutOfStock ? 0 : currentQty}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStepQty(row.key, 1, row.stock)
                                }
                                disabled={isOutOfStock || isMaxStock}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-purple hover:bg-brand-purple/10 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
                                aria-label="Increase quantity"
                              >
                                <Plus size={13} className="stroke-[2.5]" />
                              </button>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                              type="button"
                              onClick={() => handleAddRowToCart(group, row)}
                              disabled={isOutOfStock}
                              className={`flex-1 h-9.5 px-3.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                                isOutOfStock
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : isAdding
                                    ? "bg-emerald-600 text-white shadow-emerald-200"
                                    : "bg-brand-purple hover:bg-[#380038] text-white hover:shadow-md"
                              }`}
                            >
                              {isOutOfStock ? (
                                "Sold Out"
                              ) : isAdding ? (
                                <span className="flex items-center gap-1.5">
                                  <Check size={14} className="stroke-[3]" />{" "}
                                  Added
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  <ShoppingCart size={14} /> Add to Cart
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PRODUCT CONTENT & DETAILED SPECIFICATIONS ── */}
        <div className="mt-8 mb-6 bg-white border border-[#F0E6D8] rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-5 sm:px-8 py-4 bg-gradient-to-r from-[#FFF7EF] via-[#FFFBF7] to-white border-b border-[#F0E6D8] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-display font-black text-brand-purple">
                Product Overview &amp; Specifications
              </h3>
              <p className="text-xs font-semibold text-brand-brown/60 mt-0.5">
                Detailed formulation guides, indications, and administration
                directions
              </p>
            </div>
            <Link
              to={`/product/${product.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-purple hover:text-white hover:bg-brand-purple bg-brand-purple/5 px-3 py-1.5 rounded-xl border border-brand-purple/15 transition-all"
              title="View on product details page"
            >
              <span>Full Details Page</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="border-b border-[#f0ebf8] bg-[#FAF8FF] px-5 sm:px-8 flex overflow-x-auto scrollbar-none">
            {[
              { id: "description", label: "Description" },
              { id: "shipping", label: "Shipping" },
              { id: "returns", label: "Returns" },
              { id: "reviews", label: `Reviews (${reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDetailsTab(tab.id)}
                className={`py-3.5 sm:py-4 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer outline-none whitespace-nowrap ${
                  activeDetailsTab === tab.id
                    ? "border-brand-purple text-brand-purple bg-white"
                    : "border-transparent text-brand-brown/60 hover:text-brand-purple hover:bg-[#fcfaff]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-8">
            {activeDetailsTab === "description" && (
              richHtmlContent ? (
                <div className="variant-rich-text text-[#374151] text-sm sm:text-base leading-relaxed overflow-x-auto" dangerouslySetInnerHTML={{ __html: richHtmlContent }} />
              ) : (
                <p className="text-sm text-brand-brown/70 font-medium">Detailed product specifications and administration instructions are not currently available for this item.</p>
              )
            )}

            {activeDetailsTab === "shipping" && (
              <div className="space-y-6 max-w-2xl">
                <h3 className="text-lg font-extrabold text-brand-purple flex items-center gap-2"><Truck className="w-5 h-5" /> Shipping &amp; Delivery</h3>
                <DetailRows items={shippingDetails} emptyLabel="Shipping" />
              </div>
            )}

            {activeDetailsTab === "returns" && (
              <div className="space-y-6 max-w-2xl">
                <h3 className="text-lg font-extrabold text-brand-purple flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Easy Returns &amp; Refunds</h3>
                <DetailRows items={returnDetails} emptyLabel="Returns" />
              </div>
            )}

            {activeDetailsTab === "reviews" && (
              <div className="space-y-6">
                <div className="bg-[#FAF8FF] border border-[#f0ebf8] rounded-2xl p-5 flex items-center gap-4">
                  <div className="text-center bg-white px-5 py-3 rounded-2xl border border-brand-purple/10 shadow-sm">
                    <span className="text-3xl font-extrabold text-brand-purple">{reviewCount ? averageRating.toFixed(1) : "0.0"}</span>
                    <p className="text-[10px] font-bold text-brand-brown/60 mt-0.5">out of 5</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`w-4 h-4 ${star <= Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />)}
                    </div>
                    <p className="text-xs font-bold text-brand-purple">Based on {reviewCount} customer reviews</p>
                  </div>
                </div>
                {reviewsList.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-brand-purple/10 rounded-2xl bg-white"><p className="text-xs font-semibold text-brand-brown/70">No customer reviews yet for this product.</p></div>
                ) : (
                  <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-none">
                    {reviewsList.map((review) => (
                      <div key={review.id || review._id || review.author} className="border border-gray-100 p-5 rounded-2xl bg-white shadow-xs space-y-2 text-left">
                        <div className="flex items-center justify-between gap-3"><h5 className="text-xs font-extrabold text-brand-purple">{review.author || review.name || "Customer"}</h5><span className="text-[10px] font-bold text-brand-brown/50">{review.date || review.createdAt || "Recent"}</span></div>
                        <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`w-3.5 h-3.5 ${star <= Number(review.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}</div>
                        <p className="text-xs font-medium text-brand-brown/75 leading-relaxed">{review.comment || review.text || review.review}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
