import React, { useEffect, useState, useMemo, useContext } from "react";
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
  Heart,
  Home,
  ShieldCheck,
  Truck,
  Info,
  Plus,
  Minus,
  FileText,
  Zap,
} from "lucide-react";
import { productApi } from "../../api/productApi";
import { reviewApi } from "../../api/reviewApi";
import { AppContext } from "../../context/AppContext";
import { AuthContext } from "../../context/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
} from "../../utils/productUtils";
import { formatProductRichContent } from "../../utils/htmlUtils";

const WEIGHT_VARIANTS_DOGS = [
  {
    id: "weight-dog-1",
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
    id: "weight-dog-2",
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
    id: "weight-dog-3",
    weight: "12-24 lbs",
    color: "Orange",
    colorHex: "#f97316",
    multiplier: 1.07,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    id: "weight-dog-4",
    weight: "25-48 lbs",
    color: "Green",
    colorHex: "#10b981",
    multiplier: 1.13,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    id: "weight-dog-5",
    weight: "49-98 lbs",
    color: "Blue",
    colorHex: "#0874C9",
    multiplier: 1.2,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    id: "weight-dog-6",
    weight: "99-132 lbs",
    color: "Brown",
    colorHex: "#78350f",
    multiplier: 1.34,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
];

const WEIGHT_VARIANTS_CATS = [
  {
    id: "weight-cat-1",
    weight: "2.8-6.2 lbs",
    color: "Yellow",
    colorHex: "#eab308",
    multiplier: 1.0,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.35 },
      { doses: "6 Doses", doseMult: 1.9, regMult: 2.65 },
    ],
  },
  {
    id: "weight-cat-2",
    weight: "6.3-15.4 lbs",
    color: "Orange",
    colorHex: "#f97316",
    multiplier: 1.08,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.35 },
      { doses: "6 Doses", doseMult: 1.9, regMult: 2.65 },
      { doses: "12 Doses", doseMult: 3.7, regMult: 5.15 },
    ],
  },
  {
    id: "weight-cat-3",
    weight: "15.5-22 lbs",
    color: "Purple",
    colorHex: "#a855f7",
    multiplier: 1.15,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.35 },
      { doses: "6 Doses", doseMult: 1.9, regMult: 2.65 },
    ],
  },
];

function cleanImageUrl(url) {
  if (!url) return "";
  if (typeof url !== "string") return url;
  const match = url.match(/\((https?:\/\/[^)]+)\)/);
  if (match) return match[1];
  return url.replace(/^\[|\]$/g, "").trim();
}

export default function ProductVariantPage() {
  const { slug, variantId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { products, addToCart, toggleWishlist, isInWishlist, addToast } =
    useContext(AppContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [addingState, setAddingState] = useState({});
  const [reviewsData, setReviewsData] = useState({ rating: 0, count: 0 });
  const [activeVariantKey, setActiveVariantKey] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedPackKey, setSelectedPackKey] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // Fetch product details
    productApi
      .getProductById(slug)
      .then((res) => {
        if (!active) return;
        const prod = res?.product || res?.data || res;
        if (prod && (prod.id || prod._id || prod.name)) {
          setProduct(prod);

          if (variantId) {
            const variantsList =
              prod.optionVariants ||
              (Array.isArray(prod.variants) ? prod.variants : []);
            const match = variantsList.find(
              (v) =>
                String(v.id) === String(variantId) ||
                String(v.sku) === String(variantId) ||
                String(v.label) === String(variantId),
            );
            if (match) {
              setActiveVariantKey(match.id || match.sku || variantId);
            } else {
              setActiveVariantKey(variantId);
            }
          }
        } else {
          setError("Product not found");
        }
      })
      .catch((err) => {
        if (!active) return;
        if (products && products.length > 0) {
          const found = products.find(
            (p) =>
              String(p.id) === String(slug) || String(p.slug) === String(slug),
          );
          if (found) {
            setProduct(found);
            return;
          }
        }
        productApi
          .getProducts({ limit: 100 })
          .then((listRes) => {
            if (!active) return;
            const items = listRes?.items || [];
            const found = items.find(
              (p) =>
                String(p.id) === String(slug) ||
                String(p.slug) === String(slug),
            );
            if (found) {
              setProduct(found);
            } else {
              setError("Product not found");
            }
          })
          .catch(() => {
            if (active) setError("Product not found");
          });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, variantId, products]);

  // Load reviews rating and review count
  useEffect(() => {
    if (!product?.id && !slug) return;
    const targetId = product?.id || slug;
    reviewApi
      .getProductReviews(targetId)
      .then((res) => {
        if (res) {
          const reviews = res.reviews || (Array.isArray(res) ? res : []);
          if (Array.isArray(reviews) && reviews.length > 0) {
            const avg =
              reviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
              reviews.length;
            setReviewsData({
              rating: avg,
              count: reviews.length,
            });
          }
        }
      })
      .catch(() => {});
  }, [product?.id, slug]);

  useEffect(() => {
    if (product && !loading) {
      if (!isFamilyProduct(product)) {
        navigate(`/product/${product.slug || product.id || slug}`, {
          replace: true,
        });
      }
    }
  }, [product, loading, navigate, slug]);

  const isCatProduct = useMemo(() => {
    if (!product) return false;
    const text =
      `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return text.includes("cat") || text.includes("feline");
  }, [product]);

  // Rich content from API
  const richHtmlContent = useMemo(() => {
    if (!product) return "";

    const parentContent =
      product?.productDetails?.content ||
      product?.parentContent ||
      product?.content ||
      product?.detailedContent ||
      product?.longDescription ||
      product?.overview ||
      product?.description ||
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

    if (activeVariantKey && Array.isArray(product.familyVariants)) {
      const activeFV = product.familyVariants.find(
        (v) =>
          String(v.id) === String(activeVariantKey) ||
          String(v.sku) === String(activeVariantKey),
      );
      if (activeFV) {
        const variantContent =
          activeFV.productDetails?.content ||
          activeFV.content ||
          activeFV.description ||
          activeFV.shortDescription;
        if (isMeaningful(variantContent)) {
          return formatProductRichContent(variantContent, activeFV);
        }
      }
    }

    return formatProductRichContent(parentContent, product);
  }, [product, activeVariantKey]);

  // Dynamic variant builder
  const variantGroups = useMemo(() => {
    if (!product) return [];

    const basePrice = Number(product.price ?? product.sellingPrice) || 29.99;
    const regBase =
      Number(product.originalPrice ?? product.actualPrice) || basePrice * 1.3;

    // This route is the family-variant page. Family variants are the source of
    // truth here; do not mix in optionVariants or generated dosage tiers.
    const familyVariants = Array.isArray(product.familyVariants)
      ? product.familyVariants
      : [];
    if (familyVariants.length > 0) {
      return [
        {
          id: "family-variants",
          groupTitle: "Family Variants",
          badge: `${familyVariants.length} Family Variants`,
          badgeColor: "#0874C9",
          image: cleanImageUrl(product.image),
          rows: familyVariants.map((familyVariant, index) => {
            const pricing = familyVariant.pricing || {};
            const salePrice =
              pricing.finalPrice ??
              familyVariant.salePrice ??
              familyVariant.price ??
              basePrice;
            const regularPrice =
              pricing.price ??
              familyVariant.regularPrice ??
              familyVariant.mrp ??
              salePrice ??
              regBase;
            const inventory = familyVariant.inventory || {};
            const stockQty =
              inventory.stockQuantity ??
              familyVariant.stockQuantity ??
              familyVariant.stock ??
              0;
            const inStock =
              familyVariant.isAvailable !== false &&
              familyVariant.active !== false &&
              (inventory.isInStock ??
                (inventory.stockQuantity !== undefined ? stockQty > 0 : true));
            const familyLabel =
              familyVariant.displayName ||
              familyVariant.name ||
              familyVariant.label ||
              familyVariant.weightRange ||
              `Family Variant ${index + 1}`;
            const familyId =
              familyVariant.id ||
              familyVariant._id ||
              familyVariant.slug ||
              familyVariant.sku ||
              `family-${index}`;

            return {
              key: String(familyId),
              pack: familyLabel,
              sku: familyVariant.sku || product.sku || "VSE-FAMILY",
              regularPrice: Number(regularPrice).toFixed(2),
              salePrice: Number(salePrice).toFixed(2),
              stock: inStock ? (stockQty > 0 ? stockQty : 99) : 0,
              inStock,
              image: cleanImageUrl(
                familyVariant.mainImage ||
                  familyVariant.image ||
                  familyVariant.imageUrl ||
                  product.image,
              ),
              details:
                familyVariant.description ||
                familyVariant.shortDescription ||
                familyVariant.details ||
                "",
              variantObj: familyVariant,
              familyVariantId: familyId,
            };
          }),
        },
      ];
    }

    // Never fabricate options on this family-only route.
    return [];
  }, [product, isCatProduct]);

  // Derived active selections
  const activeGroup = useMemo(() => {
    if (!variantGroups.length) return null;
    if (selectedGroupId) {
      const found = variantGroups.find((g) => g.id === selectedGroupId);
      if (found) return found;
    }
    return variantGroups[0];
  }, [variantGroups, selectedGroupId]);

  const activePack = useMemo(() => {
    if (!activeGroup?.rows?.length) return null;
    if (selectedPackKey) {
      const found = activeGroup.rows.find((r) => r.key === selectedPackKey);
      if (found) return found;
    }
    return activeGroup.rows[0];
  }, [activeGroup, selectedPackKey]);

  useEffect(() => {
    if (variantGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(variantGroups[0].id);
    }
  }, [variantGroups, selectedGroupId]);

  useEffect(() => {
    if (activeGroup?.rows?.length > 0) {
      const exists = activeGroup.rows.some((r) => r.key === selectedPackKey);
      if (!exists) {
        setSelectedPackKey(activeGroup.rows[0].key);
      }
    }
  }, [activeGroup, selectedPackKey]);

  // Add to cart handler for individual variant cards
  const handleAddToCart = (group, row) => {
    if (!product) return;

    const requiresVet = isVetOnly(product);
    const userLacksVet = lacksVetAccess(product, user);

    if (userLacksVet) {
      navigate(user ? "/account/vet-verification" : "/login");
      return;
    }

    if (row.stock === 0) {
      if (addToast) {
        addToast({
          title: "Out of Stock",
          message: `${row.pack} is currently out of stock.`,
          type: "error",
        });
      }
      return;
    }

    const qty = quantities[row.key] || 1;
    setAddingState((prev) => ({ ...prev, [row.key]: true }));

    const cartProduct = {
      ...product,
      id: `${product.id}__${row.key}`,
      baseProductId: product.id,
      productId: product.id,
      name: `${product.name} - ${row.pack}`,
      title: `${product.name} - ${row.pack}`,
      image: cleanImageUrl(row.image || group.image || product.image),
      price: parseFloat(row.salePrice),
      sellingPrice: parseFloat(row.salePrice),
      originalPrice: parseFloat(row.regularPrice),
      actualPrice: parseFloat(row.regularPrice),
      selectedVariant:
        group.id === "native-options"
          ? row.pack
          : `${group.groupTitle} - ${row.pack}`,
      selectedVariantId:
        row.variantObj?.id || row.variantObj?._id || row.familyVariantId,
      variantId:
        row.variantObj?.id || row.variantObj?._id || row.familyVariantId,
      familyVariantId: row.familyVariantId,
      selectedVariantName: row.pack,
      stockLimit: row.stock,
      inStock: row.stock > 0,
      sku: row.sku,
    };

    addToCart(cartProduct, qty);

    if (addToast) {
      addToast({
        title: "Added to Cart",
        message: `Added ${qty}x ${product.name} (${row.pack}) to your cart!`,
        type: "success",
      });
    }

    setTimeout(() => {
      setAddingState((prev) => ({ ...prev, [row.key]: false }));
    }, 500);
  };

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#F7FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-[#0874C9]/20 border-t-[#0874C9] animate-spin" />
          <p className="text-sm font-bold text-[#102A43]/60 font-heading">
            Loading medicine variant matrix...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#F7FAFC]">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#102A43] font-heading">
          Product Not Found
        </h2>
        <p className="text-sm font-medium text-[#627D98] max-w-md mt-2">
          We couldn't retrieve the medicine or dosage variants you requested. It
          may have moved or been updated in our catalog.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0874C9] text-white font-extrabold text-sm hover:bg-[#073B66] transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Medicines</span>
        </Link>
      </main>
    );
  }

  if (product && !isFamilyProduct(product)) {
    return null;
  }

  const baseWishlisted = isInWishlist(product.id);
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);
  const finalRating =
    (reviewsData.count > 0 ? reviewsData.rating : null) ||
    (product?.rating && Number(product.rating) > 0
      ? Number(product.rating)
      : null);
  const finalReviewsCount =
    reviewsData.count ||
    (product?.reviewsCount && Number(product.reviewsCount) > 0
      ? Number(product.reviewsCount)
      : 0);

  return (
    <main className="min-h-screen bg-[#F7FAFC] py-4 sm:py-6 lg:py-8 w-full overflow-x-hidden text-[#102A43]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-8">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-[#627D98] overflow-x-auto scrollbar-none whitespace-nowrap py-1"
        >
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-[#0874C9] transition-colors shrink-0"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-[#627D98]/40 shrink-0" />
          <Link
            to="/shop"
            className="hover:text-[#0874C9] transition-colors shrink-0"
          >
            Medicines
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 text-[#627D98]/40 shrink-0" />
              <Link
                to={`/shop?category=${encodeURIComponent(typeof product.category === "object" ? product.category.name : product.category)}`}
                className="hover:text-[#0874C9] transition-colors truncate max-w-[140px] shrink-0"
              >
                {typeof product.category === "object"
                  ? product.category.name
                  : product.category}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 text-[#627D98]/40 shrink-0" />
          <Link
            to={`/product/${product.slug || product.id || slug}`}
            className="text-[#102A43] hover:text-[#0874C9] font-extrabold truncate max-w-[180px] shrink-0"
          >
            {product.name}
          </Link>
          <ChevronRight className="h-3 w-3 text-[#627D98]/40 shrink-0" />
          <span className="text-[#0874C9] font-extrabold shrink-0">
            Dosage &amp; Variant Studio
          </span>
        </nav>

        {/* ─── 1. TOP PANORAMIC PRODUCT HERO CANOPY ─── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#072440] via-[#0B2D4F] to-[#073B66] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-[#154B78]">
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0874C9]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-[#18A9E5]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Integrated Square Image Badge */}
            <Link
              to={`/product/${product.slug || product.id || slug}${activePack?.familyVariantId ? `?familyVariantId=${encodeURIComponent(activePack.familyVariantId)}` : ""}`}
              className="relative shrink-0 w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-2xl bg-white/95 p-3 flex items-center justify-center shadow-lg border border-white/20 hover:ring-2 hover:ring-[#0874C9] cursor-pointer group transition-all"
              title="Click to view full product details"
            >
              <img
                src={cleanImageUrl(activePack?.image || product.image)}
                alt={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 right-2 text-center text-[9px] font-black uppercase tracking-wider py-0.5 rounded-md bg-[#0B2D4F]/90 text-white backdrop-blur-xs group-hover:bg-[#0874C9] transition-colors">
                {activePack?.pack || "Variant Format"}
              </span>
            </Link>

            {/* Product Identity & Meta */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-[#18A9E5] border border-[#18A9E5]/30">
                  <Sparkles className="w-3 h-3 text-[#18A9E5]" />
                  Variant &amp; Regimen Studio
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white/80 border border-white/15">
                  {typeof product.category === "object"
                    ? product.category.name
                    : product.category || "Pet Health"}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white/80 border border-white/15">
                  {isCatProduct ? "Feline Formulation" : "Canine Formulation"}
                </span>
                {requiresVet && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0874C9] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    Vet Licensed Only
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black tracking-tight text-white leading-tight">
                {product.name}
              </h1>

              <p className="text-xs sm:text-sm text-white/70 font-medium leading-relaxed max-w-3xl line-clamp-2">
                {product.description ||
                  "Certified veterinary formulation with verified batch lot serialization and cold-chain temperature control."}
              </p>
            </div>

            {/* Quick Actions & Navigation Link */}
            <div className="shrink-0 flex flex-col items-center md:items-end gap-3 pt-2 md:pt-0">
              {Boolean(finalRating && Number(finalRating) > 0) && (
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-extrabold text-white">
                    {Number(finalRating).toFixed(1)}
                  </span>
                  {finalReviewsCount > 0 && (
                    <span className="text-[11px] text-white/60">
                      ({finalReviewsCount} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── 2. STEP 1: FORMULATION & WEIGHT BRACKET SELECTOR (IF MULTIPLE) ─── */}
        {variantGroups.length > 1 && (
          <section className="rounded-3xl bg-white border border-[#D9E8F2] p-5 sm:p-7 shadow-sm text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E8F2]/60 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-full bg-[#0874C9] text-white text-xs font-black flex items-center justify-center shadow-xs">
                  1
                </span>
                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-[#102A43] uppercase tracking-wider">
                    Select Formulation / Weight Class
                  </h3>
                  <p className="text-xs text-[#627D98] font-medium">
                    Calibrated specifically for patient therapeutic safety
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#0874C9] bg-[#EAF5FC] px-3 py-1 rounded-full border border-[#0874C9]/20 self-start sm:self-auto">
                {variantGroups.length} Weight Classes Available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {variantGroups.map((group) => {
                const isSelected = group.id === activeGroup?.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      if (group.rows.length) {
                        setSelectedPackKey(group.rows[0].key);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 min-w-0 ${
                      isSelected
                        ? "border-[#0874C9] bg-[#EAF5FC]/60 ring-2 ring-[#0874C9]/20 shadow-sm"
                        : "border-[#D9E8F2] bg-white hover:border-[#0874C9]/40 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="size-3.5 rounded-full shrink-0 border border-white shadow-2xs"
                        style={{
                          backgroundColor: group.badgeColor || "#0874C9",
                        }}
                      />
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-[#0874C9] bg-[#0874C9] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <Check size={10} className="stroke-[3]" />
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-heading font-extrabold text-xs sm:text-sm text-[#102A43] block truncate">
                        {group.groupTitle}
                      </span>
                      {group.badge && (
                        <span className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider block truncate mt-0.5">
                          {group.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── 3. STEP 2: TREATMENT SUPPLY & PACK COMPARISON MATRIX (FULL WIDTH CARDS) ─── */}
        <section className="rounded-3xl bg-white border border-[#D9E8F2] p-5 sm:p-7 lg:p-8 shadow-sm text-left space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9E8F2]/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="size-6 rounded-full bg-[#0874C9] text-white text-xs font-black flex items-center justify-center shadow-xs">
                {variantGroups.length > 1 ? "2" : "1"}
              </span>
              <div>
                <h3 className="font-heading font-black text-sm sm:text-base text-[#102A43] uppercase tracking-wider">
                  Select Pack Supply &amp; Dosage Tier
                </h3>
                <p className="text-xs text-[#627D98] font-medium">
                  Compare supply formats and lock in direct dispensing savings
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
              Bulk Savings Applied Across All Tiers
            </span>
          </div>

          {/* Panoramic Tier Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {activeGroup?.rows?.map((row, rIdx) => {
              const isSelected = row.key === activePack?.key;
              const rowSale = parseFloat(row.salePrice);
              const rowReg = parseFloat(row.regularPrice);
              const savePercent =
                rowReg > rowSale
                  ? Math.round(((rowReg - rowSale) / rowReg) * 100)
                  : 0;

              let tierLabel = "Standard Supply";
              if (rIdx === 0) tierLabel = "Starter Format";
              else if (rIdx === 1) tierLabel = "🔥 Most Popular";
              else if (rIdx >= 2) tierLabel = "⭐ Maximum Value";

              return (
                <div
                  key={row.key}
                  onClick={() => {
                    setSelectedPackKey(row.key);
                    navigate(
                      `/product/${product.slug || product.id || slug}?familyVariantId=${encodeURIComponent(row.familyVariantId || row.key)}`,
                    );
                  }}
                  className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border-2 min-w-0 hover:border-[#0874C9] hover:shadow-lg ${
                    isSelected
                      ? "border-[#0874C9] bg-gradient-to-b from-[#EAF5FC]/70 via-white to-white ring-2 ring-[#0874C9]/25 shadow-md scale-[1.01]"
                      : "border-[#D9E8F2] bg-white hover:bg-slate-50/70"
                  }`}
                  title="Click to view product details"
                >
                  {/* Top Tier Badge & Checkmark */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-heading font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-[#0874C9] text-white shadow-2xs"
                          : "bg-slate-100 text-[#102A43]/70"
                      }`}
                    >
                      {tierLabel}
                    </span>

                    <div
                      className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-[#0874C9] bg-[#0874C9] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={10} className="stroke-[3]" />}
                    </div>
                  </div>

                  {/* Pack Name & Thumbnail */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-xl bg-[#F7FAFC] border border-[#D9E8F2] p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <img
                        src={cleanImageUrl(
                          row.image || activeGroup?.image || product.image,
                        )}
                        alt={row.pack}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-heading font-black text-base text-[#102A43] truncate">
                        {row.pack}
                      </h4>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between mb-4">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-heading font-black text-[#102A43]">
                          ${row.salePrice}
                        </span>
                        {rowReg > rowSale && (
                          <span className="text-xs font-semibold text-slate-400 line-through">
                            ${row.regularPrice}
                          </span>
                        )}
                      </div>
                      {savePercent > 0 && (
                        <span className="text-[10px] font-extrabold text-emerald-700 block mt-0.5">
                          Save {savePercent}% Off Standard
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Instant Add to Cart Action on each card */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPackKey(row.key);
                      handleAddToCart(activeGroup, row);
                    }}
                    disabled={row.stock === 0}
                    className={`w-full h-11 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                      row.stock === 0
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : addingState[row.key]
                          ? "bg-emerald-600 text-white shadow-emerald-600/30"
                          : "bg-[#0874C9] hover:bg-[#073B66] text-white shadow-[#0874C9]/20"
                    }`}
                  >
                    {addingState[row.key] ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                        <span>Add To Cart</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── 4. FULL-WIDTH PRODUCT OVERVIEW & SPECIFICATIONS (WITH RICH TYPOGRAPHY) ─── */}
        {richHtmlContent ? (
          <section className="rounded-3xl bg-white border border-[#D9E8F2] p-6 sm:p-8 lg:p-12 shadow-sm text-left w-full max-w-full overflow-hidden">
            <div className="w-full max-w-none space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0874C9]/20 bg-[#EAF5FC] px-4 py-2 text-xs font-heading font-extrabold uppercase tracking-wider text-[#0874C9]">
                <Layers className="size-4 text-[#0874C9]" />
                <span>Product Overview &amp; Regimen Specifications</span>
              </div>

              {/* Dedicated rich content typography container */}
              <div
                className="variant-rich-content variant-rich-text rich-content-display product-rich-content font-sans"
                dangerouslySetInnerHTML={{ __html: richHtmlContent }}
              />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
