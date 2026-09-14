import React, { useEffect, useState, useMemo } from "react";
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
import {
  getProductByIdApi,
  getProductVariantApi,
  getProductsApi,
  transformProduct,
  reviewApi,
} from "../helper/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
} from "../utils/productUtils";
import { formatProductRichContent } from "../utils/htmlUtils";
import { showToast } from "../components/common/toast/ToastHelper";

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
    id: "weight-dog-4",
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
    id: "weight-dog-5",
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
    id: "weight-dog-6",
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
    id: "weight-cat-1",
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
    id: "weight-cat-2",
    weight: "5.6-16.5 lbs",
    color: "Teal",
    colorHex: "#0d9488",
    multiplier: 1.15,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
      { doses: "12 Doses", doseMult: 3.76, regMult: 5.3 },
    ],
  },
  {
    id: "weight-cat-3",
    weight: "above 16.5 lbs",
    color: "Purple",
    colorHex: "#a855f7",
    multiplier: 1.3,
    packs: [
      { doses: "3 Doses", doseMult: 1.0, regMult: 1.4 },
      { doses: "6 Doses", doseMult: 1.92, regMult: 2.7 },
    ],
  },
];

function cleanImageUrl(url) {
  if (!url) return "";
  if (typeof url === "object") {
    return cleanImageUrl(url.url || url.src || url.path || url.location || "");
  }
  if (typeof url !== "string") return url;
  const match = url.match(/\((https?:\/\/[^)]+)\)/);
  if (match) return match[1];
  return url.replace(/^\[|\]$/g, "").trim();
}

export default function ProductVariantPage() {
  const { id, variantId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [addingState, setAddingState] = useState({});
  const [reviewsData, setReviewsData] = useState({ rating: 0, count: 0 });
  const [productReviews, setProductReviews] = useState([]);
  const [activeVariantKey, setActiveVariantKey] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedPackKey, setSelectedPackKey] = useState(null);
  const [activeQty, setActiveQty] = useState(1);
  const [addingSuccess, setAddingSuccess] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("details");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // Fetch product details
    getProductByIdApi(id)
      .then((res) => {
        if (!active) return;
        const mappedProduct = transformProduct(res.data);
        setProduct(mappedProduct);

        // Keep the route selection stable. A family variant page must open the
        // requested family member, not the first member of the parent product.
        if (variantId) {
          const familyMatch = (mappedProduct.familyVariants || []).find(
            (fv) =>
              String(fv.id) === String(variantId) ||
              String(fv.slug) === String(variantId) ||
              String(fv.name) === String(variantId) ||
              String(fv.displayName) === String(variantId) ||
              (Array.isArray(fv.skus) &&
                fv.skus.some(
                  (sku) =>
                    String(sku.id) === String(variantId) ||
                    String(sku.sku) === String(variantId),
                )),
          );
          const variantsList =
            mappedProduct.optionVariants ||
            (Array.isArray(mappedProduct.variants)
              ? mappedProduct.variants
              : []);
          const match =
            familyMatch ||
            variantsList.find(
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
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load product for variants page:", err);
        // Fallback: try search from product list
        getProductsApi({ limit: 100 })
          .then((listRes) => {
            if (!active) return;
            const items = (listRes.data?.items || []).map(transformProduct);
            const found = items.find(
              (p) =>
                String(p.id) === String(id) || String(p.slug) === String(id),
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
  }, [id, variantId]);

  // Load reviews rating and review list
  useEffect(() => {
    if (!id) return;
    reviewApi
      .getProductReviews(id)
      .then((res) => {
        if (res && res.data) {
          const reviews = res.data.reviews || res.data || [];
          if (Array.isArray(reviews)) {
            setProductReviews(reviews);
            if (reviews.length > 0) {
              const avg =
                reviews.reduce((acc, r) => acc + (r.rating || 5), 0) /
                reviews.length;
              setReviewsData({
                rating: avg,
                count: reviews.length,
              });
            }
          }
        }
      })
      .catch(() => {});
  }, [id]);

  // Safety redirect guard: if product is SIMPLE (not FAMILY), redirect to standard product details page
  useEffect(() => {
    if (product && !loading) {
      if (!isFamilyProduct(product)) {
        navigate(`/product/${product.id || id}`, { replace: true });
      }
    }
  }, [product, loading, navigate, id]);

  const isCatProduct = useMemo(() => {
    if (!product) return false;
    const text =
      `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return text.includes("cat") || text.includes("feline");
  }, [product]);

  const variantGroups = useMemo(() => {
    if (!product) return [];

    const basePrice = Number(product.sellingPrice) || 31.95;
    const regBase = Number(product.actualPrice) || basePrice * 1.35;
    const weightList = isCatProduct
      ? WEIGHT_VARIANTS_CATS
      : WEIGHT_VARIANTS_DOGS;

    // Case 0: Backend explicit familyVariants
    if (product.familyVariants && product.familyVariants.length > 0) {
      return product.familyVariants.map((fVar, fIdx) => {
        const fName = fVar.displayName || fVar.name || `Variant ${fIdx + 1}`;
        const groupTitle = `${product.name} (${fName})`;
        const subtitle =
          fVar.shortDescription && fVar.shortDescription !== fVar.weightRange
            ? fVar.shortDescription
            : fVar.weightRange
              ? `Weight Range: ${fVar.weightRange}`
              : "Available Pack Options";

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

        // Family pages must use images owned by this family member only.
        // Falling back to product.gallery here was the reason sibling variant
        // images appeared on the selected variant page.
        const familyImageCandidates = [
          fVar.mainImage,
          fVar.image,
          fVar.imageUrl,
          ...(Array.isArray(fVar.gallery) ? fVar.gallery : []),
          ...(Array.isArray(fVar.images) ? fVar.images : []),
          ...skus.flatMap((sku) => [
            sku.mainImage,
            sku.image,
            sku.imageUrl,
            ...(Array.isArray(sku.gallery) ? sku.gallery : []),
          ]),
          product.image,
        ];
        const variantImage = cleanImageUrl(familyImageCandidates.find(Boolean));

        const rows = skus.map((s, sIdx) => {
          const unitSale = Number(
            s.pricing?.finalPrice ??
              s.pricing?.salePrice ??
              s.salePrice ??
              s.price ??
              basePrice,
          );
          const unitReg = Number(
            s.pricing?.price ?? s.regularPrice ?? s.oldPrice ?? regBase,
          );

          const packLabel =
            s.packLabel || s.dose || s.size || s.label || `Pack ${sIdx + 1}`;
          const fullLabel = `${fName} - ${packLabel}`.trim();

          return {
            key: String(s.id || `${fVar.id}-sku-${sIdx}`),
            variantId: s.id,
            pack: packLabel,
            label: fullLabel,
            sku:
              s.sku ||
              `PMD-${(product.id || "MED").slice(-4).toUpperCase()}-${fIdx + 1}-${sIdx + 1}`,
            regularPrice: Number(unitReg).toFixed(2),
            salePrice: Number(unitSale).toFixed(2),
            stock: Number(s.inventory?.stockQuantity ?? s.stock ?? 50),
            stockStatus:
              s.inventory?.stockStatus ||
              (s.stock === 0 ? "OUT_OF_STOCK" : "IN_STOCK"),
            isLowStock:
              s.inventory?.stockStatus === "LOW_STOCK" ||
              (s.stock > 0 && s.stock <= 5),
            image: variantImage,
            variantObj: s,
          };
        });

        return {
          id: String(fVar.id || `grp-fam-${fIdx}`),
          slug: fVar.slug,
          familyVariant: fVar,
          groupTitle,
          subtitle,
          content:
            fVar.productDetails?.content ||
            fVar.content ||
            fVar.overview ||
            fVar.detailedContent ||
            fVar.description ||
            fVar.shortDescription ||
            "",
          badge: fVar.packColor || fVar.weightRange || `${rows.length} Packs`,
          badgeColor: fVar.packColorHex || "#58b947",
          image: variantImage,
          rows,
        };
      });
    }

    // Check if product has real backend optionVariants (like the Virbac response)
    if (product.optionVariants && product.optionVariants.length > 0) {
      return [
        {
          id: "native-options",
          groupTitle: product.optionLabel
            ? `Select ${product.optionLabel}`
            : "Available Formats & Sizes",
          badge: `${product.optionVariants.length} Sizes`,
          badgeColor: "#58b947",
          image: cleanImageUrl(product.image),
          rows: product.optionVariants.map((ov, index) => {
            const varPricing = ov.pricing || {};
            const salePrice =
              varPricing.finalPrice !== undefined &&
              varPricing.finalPrice !== null
                ? varPricing.finalPrice
                : ov.salePrice !== undefined && ov.salePrice !== null
                  ? ov.salePrice
                  : ov.price || basePrice;
            const regPrice =
              varPricing.price !== undefined && varPricing.price !== null
                ? varPricing.price
                : ov.regularPrice || ov.price || regBase;
            const inventory = ov.inventory || {};
            const inStock =
              inventory.isInStock !== undefined
                ? inventory.isInStock
                : ov.stock !== undefined
                  ? ov.stock > 0
                  : true;
            const stockQty =
              inventory.stockQuantity !== undefined
                ? inventory.stockQuantity
                : ov.stock !== undefined
                  ? ov.stock
                  : 10;
            const isLowStock =
              inventory.stockStatus === "LOW_STOCK" ||
              (stockQty > 0 && stockQty <= 5);

            return {
              key: ov.id || ov.sku || `ov-${index}`,
              pack:
                ov.label ||
                ov.size ||
                ov.weightRange ||
                ov.name ||
                `Option ${index + 1}`,
              sku:
                ov.sku ||
                `VIRBAC-${(product.id || "MED").slice(-4).toUpperCase()}-${index + 1}`,
              regularPrice: Number(regPrice).toFixed(2),
              salePrice: Number(salePrice).toFixed(2),
              stock: inStock ? stockQty : 0,
              stockStatus:
                inventory.stockStatus ||
                (isLowStock
                  ? "LOW_STOCK"
                  : inStock
                    ? "IN_STOCK"
                    : "OUT_OF_STOCK"),
              isLowStock: isLowStock,
              image: cleanImageUrl(ov.image || product.image),
              details: ov.details || ov.description || "",
              packSize: ov.packSize || null,
              variantObj: ov,
            };
          }),
        },
      ];
    }

    // Otherwise generate realistic weight-based variant groupings for dummy/reference items
    return weightList.map((variant, gIdx) => {
      const gPrice = basePrice * variant.multiplier;
      const gReg = regBase * variant.multiplier;
      return {
        id: variant.id || `weight-${gIdx}`,
        groupTitle: `${variant.weight} (${variant.color})`,
        badge: variant.color,
        badgeColor: variant.colorHex,
        image: cleanImageUrl(product.image),
        rows: variant.packs.map((pack, pIdx) => {
          const packSale = (gPrice * pack.doseMult).toFixed(2);
          const packReg = (gReg * pack.regMult).toFixed(2);
          return {
            key: `${variant.id || gIdx}-${pIdx}`,
            pack: pack.doses,
            sku: `PMD-${(product.id || "MED").slice(-4).toUpperCase()}-${variant.color.slice(0, 3).toUpperCase()}-${pack.doses.replace(/\s+/g, "")}`,
            regularPrice: packReg,
            salePrice: packSale,
            stock: 99,
            stockStatus: "IN_STOCK",
            isLowStock: false,
            image: cleanImageUrl(product.image),
          };
        }),
      };
    });
  }, [product, isCatProduct]);

  // Active Group Resolution
  const activeGroup = useMemo(() => {
    if (!variantGroups.length) return null;
    const routeKey = activeVariantKey || variantId;
    if (routeKey) {
      const routeGroup = variantGroups.find(
        (group) =>
          String(group.id) === String(routeKey) ||
          String(group.slug) === String(routeKey) ||
          group.rows.some(
            (row) =>
              String(row.variantId) === String(routeKey) ||
              String(row.sku) === String(routeKey),
          ),
      );
      if (routeGroup) return routeGroup;
    }
    return (
      variantGroups.find((g) => g.id === selectedGroupId) || variantGroups[0]
    );
  }, [variantGroups, selectedGroupId, activeVariantKey, variantId]);

  // Active Pack Resolution
  const activePack = useMemo(() => {
    if (!activeGroup || !activeGroup.rows.length) return null;
    return (
      activeGroup.rows.find((r) => r.key === selectedPackKey) ||
      activeGroup.rows[0]
    );
  }, [activeGroup, selectedPackKey]);

  const richHtmlContent = useMemo(() => {
    const parentContent =
      product?.productDetails?.content ||
      product?.productDetails?.overview ||
      product?.parentContent ||
      product?.content ||
      product?.detailedContent ||
      product?.overview ||
      product?.longDescription ||
      product?.description ||
      "";
    const selectedContent =
      activeGroup?.content ||
      activeGroup?.overview ||
      activeGroup?.description ||
      activeGroup?.shortDescription ||
      activeGroup?.familyVariant?.content ||
      activeGroup?.familyVariant?.overview ||
      activeGroup?.familyVariant?.description ||
      activeGroup?.familyVariant?.shortDescription ||
      activeGroup?.familyVariant?.productDetails?.content ||
      activeGroup?.familyVariant?.productDetails?.overview ||
      activeGroup?.familyVariant?.detailedContent ||
      activeGroup?.familyVariant?.longDescription;
    return formatProductRichContent(selectedContent || parentContent, {
      ...product,
      ...(activeGroup?.familyVariant || {}),
      parentContent,
    });
  }, [activeGroup, product]);

  const minStartingPrice = useMemo(() => {
    if (!variantGroups.length) return Number(product?.sellingPrice) || 0;
    const allPrices = variantGroups
      .flatMap((g) =>
        g.rows.map(
          (r) => parseFloat(r.salePrice) || parseFloat(r.regularPrice) || 0,
        ),
      )
      .filter((p) => p > 0);
    return allPrices.length
      ? Math.min(...allPrices)
      : Number(product?.sellingPrice) || 0;
  }, [variantGroups, product]);

  const isChooserMode = !variantId && variantGroups.length > 1;

  useEffect(() => {
    if (!variantGroups.length) return;
    const routeKey = activeVariantKey || variantId;
    const routeGroup =
      routeKey &&
      variantGroups.find(
        (group) =>
          String(group.id) === String(routeKey) ||
          String(group.slug) === String(routeKey) ||
          group.rows.some(
            (row) =>
              String(row.variantId) === String(routeKey) ||
              String(row.sku) === String(routeKey),
          ),
      );
    const targetGroup = routeGroup || variantGroups[0];
    if (targetGroup) {
      setSelectedGroupId(targetGroup.id);
    }
  }, [variantGroups, activeVariantKey, variantId]);

  useEffect(() => {
    if (variantId && product) {
      const prodSlug = product.slug || product.id || id;
      navigate(
        `/product/${prodSlug}?familyVariantId=${encodeURIComponent(variantId)}`,
        { replace: true },
      );
    }
  }, [variantId, product, id, navigate]);

  useEffect(() => {
    if (activeGroup && activeGroup.rows.length) {
      const exists = activeGroup.rows.some((r) => r.key === selectedPackKey);
      if (!exists) {
        setSelectedPackKey(activeGroup.rows[0].key);
      }
    }
  }, [activeGroup, selectedPackKey]);

  const handleAddToCartActive = () => {
    if (!product || !activePack) return;

    const requiresVet = isVetOnly(product);
    const userLacksVet = lacksVetAccess(product, user);
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    if (activePack.stock === 0) {
      showToast.error(`${activePack.pack} is currently out of stock.`);
      return;
    }

    const cartProduct = {
      ...product,
      id: `${product.id}__${activePack.key}`,
      baseProductId: product.id,
      productId: product.id,
      name: `${product.name} - ${activePack.pack}`,
      title: `${product.name} - ${activePack.pack}`,
      image: cleanImageUrl(
        activePack.image || activeGroup?.image || product.image,
      ),
      sellingPrice: parseFloat(activePack.salePrice),
      actualPrice: parseFloat(activePack.regularPrice),
      selectedVariant:
        activeGroup.id === "native-options"
          ? activePack.pack
          : `${activeGroup.groupTitle} - ${activePack.pack}`,
      stockLimit: activePack.stock,
      inStock: activePack.stock > 0,
      sku: activePack.sku,
    };

    addToCart(cartProduct, activeQty);
    setAddingSuccess(true);
    showToast.success(
      `Added ${activeQty}x ${product.name} (${activePack.pack}) to your cart!`,
    );
    setTimeout(() => setAddingSuccess(false), 1800);
  };

  const handleBuyNowActive = () => {
    if (!product || !activePack) return;

    const requiresVet = isVetOnly(product);
    const userLacksVet = lacksVetAccess(product, user);
    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    if (activePack.stock === 0) {
      showToast.error(`${activePack.pack} is currently out of stock.`);
      return;
    }

    const cartProduct = {
      ...product,
      id: `${product.id}__${activePack.key}`,
      baseProductId: product.id,
      productId: product.id,
      name: `${product.name} - ${activePack.pack}`,
      title: `${product.name} - ${activePack.pack}`,
      image: cleanImageUrl(
        activePack.image || activeGroup?.image || product.image,
      ),
      sellingPrice: parseFloat(activePack.salePrice),
      actualPrice: parseFloat(activePack.regularPrice),
      selectedVariant:
        activeGroup.id === "native-options"
          ? activePack.pack
          : `${activeGroup.groupTitle} - ${activePack.pack}`,
      stockLimit: activePack.stock,
      inStock: activePack.stock > 0,
      sku: activePack.sku,
      quantity: activeQty,
    };

    sessionStorage.setItem("pet_meds_buy_now", JSON.stringify(cartProduct));
    navigate("/checkout?buyNow=1");
  };

  const handleStepQuantity = (rowKey, delta) => {
    setQuantities((prev) => {
      const cur = prev[rowKey] || 1;
      const next = Math.max(1, Math.min(99, cur + delta));
      return { ...prev, [rowKey]: next };
    });
  };

  const handleAddToCart = (group, row) => {
    if (!product) return;

    const requiresVet = isVetOnly(product);
    const userLacksVet = lacksVetAccess(product, user);

    if (userLacksVet) {
      navigate(user ? "/profile?tab=vet-verification" : "/login");
      return;
    }

    if (row.stock === 0) {
      showToast.error(`${row.pack} is currently out of stock.`);
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
      sellingPrice: parseFloat(row.salePrice),
      actualPrice: parseFloat(row.regularPrice),
      selectedVariant:
        group.id === "native-options"
          ? row.pack
          : `${group.groupTitle} - ${row.pack}`,
      stockLimit: row.stock,
      inStock: row.stock > 0,
      sku: row.sku,
    };

    addToCart(cartProduct, qty);
    showToast.success(
      `Added ${qty}x ${product.name} (${row.pack}) to your cart!`,
    );

    setTimeout(() => {
      setAddingState((prev) => ({ ...prev, [row.key]: false }));
    }, 450);
  };

  const handleToggleBaseWishlist = () => {
    if (!product) return;
    const wishlisted = isWishlisted(product.id);
    toggleWishlist(product);
    if (!wishlisted) {
      showToast.wishlist(`${product.name} added to wishlist!`, true);
    } else {
      showToast.wishlist(`${product.name} removed from wishlist.`, false);
    }
  };

  const handleToggleGroupWishlist = (group) => {
    if (!product) return;
    const groupWishlistId = `${product.id}__${group.id}`;
    const wishlisted = isWishlisted(groupWishlistId);

    const variantWishlistItem = {
      ...product,
      id: groupWishlistId,
      baseProductId: product.id,
      productId: product.id,
      name: `${product.name} (${group.groupTitle})`,
      title: `${product.name} (${group.groupTitle})`,
      image: cleanImageUrl(group.image || product.image),
      sellingPrice: parseFloat(
        group.rows?.[0]?.salePrice || product.sellingPrice,
      ),
      actualPrice: parseFloat(
        group.rows?.[0]?.regularPrice || product.actualPrice || 0,
      ),
      inStock: true,
    };

    toggleWishlist(variantWishlistItem);
    if (!wishlisted) {
      showToast.wishlist(
        `${product.name} (${group.groupTitle}) added to wishlist!`,
        true,
      );
    } else {
      showToast.wishlist(
        `${product.name} (${group.groupTitle}) removed from wishlist.`,
        false,
      );
    }
  };

  useEffect(() => {
    if (activePack?.stock && activeQty > activePack.stock) {
      setActiveQty(Math.max(1, activePack.stock));
    }
  }, [activePack]);

  if (loading) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary-green/20 border-t-primary-green animate-spin" />
          <p className="text-sm font-bold text-deep-navy/60 font-display">
            Loading medicine variant matrix...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#f8fafc]">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-deep-navy font-display">
          Product Not Found
        </h2>
        <p className="text-sm font-medium text-deep-navy/60 max-w-md mt-2">
          We couldn't retrieve the medicine or dosage variants you requested. It
          may have moved or been updated in our catalog.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-green text-white font-extrabold text-sm hover:bg-dark-green transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse All Medicines</span>
        </Link>
      </main>
    );
  }

  const baseWishlisted = isWishlisted(product.id);
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
  const displayShipping =
    product.shippingReturns ||
    product.shippingInfo ||
    product.shipping ||
    product.productDetails?.shippingReturns ||
    product.productDetails?.shipping ||
    product.deliveryInfo ||
    "";
  const shippingContent = formatProductRichContent(displayShipping, product);

  const displayReturns =
    product.returnPolicies ||
    product.returnPolicy ||
    product.returns ||
    product.productDetails?.returnPolicies ||
    product.productDetails?.returns ||
    product.refundPolicy ||
    "";
  const returnsContent = formatProductRichContent(displayReturns, product);

  // ─── FAMILY VARIANTS CHOOSER SCREEN (MATCHES USER SCREENSHOT) ───
  if (isChooserMode) {
    return (
      <main className="min-h-screen bg-[#f8fafc] py-4 sm:py-6 lg:py-8 w-full overflow-x-hidden text-[#122a50]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-deep-navy/50 overflow-x-auto scrollbar-none whitespace-nowrap py-1"
          >
            <Link
              to="/"
              className="flex items-center gap-1 hover:text-primary-green transition-colors shrink-0"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
            <Link
              to="/products"
              className="hover:text-primary-green transition-colors shrink-0"
            >
              Medicines
            </Link>
            {product.category && (
              <>
                <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
                <Link
                  to={`/products?category=${encodeURIComponent(typeof product.category === "object" ? product.category.name : product.category)}`}
                  className="hover:text-primary-green transition-colors truncate max-w-[140px] shrink-0"
                >
                  {typeof product.category === "object"
                    ? product.category.name
                    : product.category}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
            <Link
              to={`/product/${product.slug || product.id || id}`}
              className="text-deep-navy/70 hover:text-primary-green font-extrabold truncate max-w-[180px] shrink-0"
            >
              {product.name}
            </Link>
            <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
            <span className="text-primary-green font-extrabold shrink-0">
              Family Variants
            </span>
          </nav>

          {/* 1. Top Product Summary Banner (Exact match to screenshot) */}
          <section className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6 text-left">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#fffdf8] border border-slate-100 p-2 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src={cleanImageUrl(product.image)}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#c69220] block">
                PET-MEDS-DIRECT
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-deep-navy tracking-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-[#f4f7f6] text-deep-navy/80 border border-slate-200/60">
                  {variantGroups.length} variants available
                </span>
                {minStartingPrice > 0 && (
                  <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-deep-navy text-white shadow-2xs">
                    Starting from ${minStartingPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 2. Choose Formulation Section (Exact match to screenshot) */}
          <section className="space-y-6 text-left">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-primary-green">
                FAMILY VARIANTS
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-black text-deep-navy">
                Choose {product.name}
              </h2>
              <p className="text-xs sm:text-sm text-deep-navy/60 font-medium">
                Select a formulation to view its image, pack sizes, pricing, and
                details.
              </p>
            </div>

            {/* 2-Column Grid of Variant Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {variantGroups.map((group) => {
                const firstPack = group.rows[0];
                const packCount = group.rows.length;
                const isAdding = firstPack ? addingState[firstPack.key] : false;

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-primary-green/40 transition-all duration-200 flex flex-col justify-between gap-5"
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <Link
                        to={`/product/${product.slug || product.id || id}?familyVariantId=${encodeURIComponent(group.id)}${firstPack?.id ? `&variantId=${encodeURIComponent(firstPack.id)}` : ""}`}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0 hover:border-primary-green/50 transition-colors cursor-pointer"
                        title={`View ${group.groupTitle}`}
                      >
                        <img
                          src={cleanImageUrl(group.image || product.image)}
                          alt={group.groupTitle}
                          className="max-h-full max-w-full object-contain"
                        />
                      </Link>

                      {/* Formulation Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${product.slug || product.id || id}?familyVariantId=${encodeURIComponent(group.id)}${firstPack?.id ? `&variantId=${encodeURIComponent(firstPack.id)}` : ""}`}
                          className="text-base sm:text-lg font-display font-extrabold text-deep-navy hover:text-primary-green transition-colors block truncate"
                        >
                          {group.familyVariant?.displayName ||
                            group.familyVariant?.name ||
                            group.groupTitle}
                        </Link>
                        <p className="text-xs text-deep-navy/55 font-medium mt-0.5">
                          Family formulation
                        </p>
                        <p className="text-xs text-deep-navy/45 mt-0.5">
                          {packCount} pack option{packCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Pack Row & VIEW VARIANT Action */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      {firstPack && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-deep-navy/75 truncate">
                            {firstPack.pack || firstPack.label}
                          </span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-extrabold text-deep-navy">
                              ${parseFloat(firstPack.salePrice).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(group, firstPack)}
                              disabled={isAdding || firstPack.stock === 0}
                              className={`px-3.5 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                                isAdding
                                  ? "bg-primary-green text-white"
                                  : "bg-deep-navy text-white hover:bg-primary-green"
                              }`}
                            >
                              {isAdding ? "ADDED" : "ADD"}
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <Link
                          to={`/product/${product.slug || product.id || id}?familyVariantId=${encodeURIComponent(group.id)}${firstPack?.id ? `&variantId=${encodeURIComponent(firstPack.id)}` : ""}`}
                          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-primary-green hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          <span>VIEW VARIANT</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Specifications & Policy Tabs */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm text-left">
            <div className="flex overflow-x-auto border-b border-slate-200 bg-[#fffdf8]">
              {[["details", "Product Details"]].map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveDetailTab(tabId)}
                  className={`relative whitespace-nowrap px-5 py-4 text-xs font-bold transition-colors ${
                    activeDetailTab === tabId
                      ? "text-[#c69220]"
                      : "text-deep-navy/55 hover:text-deep-navy"
                  }`}
                >
                  {label}
                  {activeDetailTab === tabId && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d9aa3d]" />
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-40 p-6 sm:p-8">
              {activeDetailTab === "details" && (
                <div>
                  {richHtmlContent ? (
                    <div
                      className="variant-rich-content rich-content-display max-w-5xl font-sans text-sm leading-relaxed text-deep-navy/80"
                      dangerouslySetInnerHTML={{ __html: richHtmlContent }}
                    />
                  ) : (
                    <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc] text-sm text-deep-navy/70">
                      <p className="font-bold text-deep-navy mb-1">
                        {product.name}
                      </p>
                      <p>
                        {product.description ||
                          "Product details are maintained and verified by our veterinary pharmacy team."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === "shipping" && (
                <div className="space-y-6">
                  {shippingContent ? (
                    <div
                      className="prose prose-slate max-w-5xl text-sm leading-relaxed text-deep-navy/80"
                      dangerouslySetInnerHTML={{ __html: shippingContent }}
                    />
                  ) : (
                    <div className="space-y-4 max-w-4xl text-left">
                      <h4 className="font-display font-black text-base text-deep-navy uppercase tracking-wider">
                        Shipping &amp; Delivery Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                          <span className="font-bold text-sm text-deep-navy block mb-1">
                            🚚 Free Ground Shipping
                          </span>
                          <p className="text-xs text-deep-navy/70">
                            Free standard delivery on all orders over $49.
                            Arrives within 2–4 business days.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                          <span className="font-bold text-sm text-deep-navy block mb-1">
                            ❄️ Cold-Chain Care
                          </span>
                          <p className="text-xs text-deep-navy/70">
                            Temperature-sensitive items are dispatched in
                            insulated coolers with medical-grade ice packs.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                          <span className="font-bold text-sm text-deep-navy block mb-1">
                            📦 Real-Time Tracking
                          </span>
                          <p className="text-xs text-deep-navy/70">
                            Full tracking updates sent directly to your email
                            upon pharmacy dispatch.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-deep-navy/75 leading-relaxed">
                        Non-prescription orders placed by 2:00 PM EST ship
                        same-day. Prescription medications ship immediately upon
                        licensed veterinarian authorization.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === "returns" && (
                <div className="space-y-6">
                  {returnsContent ? (
                    <div
                      className="prose prose-slate max-w-5xl text-sm leading-relaxed text-deep-navy/80"
                      dangerouslySetInnerHTML={{ __html: returnsContent }}
                    />
                  ) : (
                    <div className="space-y-4 max-w-4xl text-left">
                      <h4 className="font-display font-black text-base text-deep-navy uppercase tracking-wider">
                        Returns &amp; Refund Policy
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                          <span className="font-bold text-sm text-deep-navy block mb-1">
                            ⭐ 30-Day Satisfaction Guarantee
                          </span>
                          <p className="text-xs text-deep-navy/70">
                            Return unopened and eligible pet supplies within 30
                            days for a full refund or exchange.
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                          <span className="font-bold text-sm text-deep-navy block mb-1">
                            ⚕️ Pharmacy Safety Regulations
                          </span>
                          <p className="text-xs text-deep-navy/70">
                            Due to federal and state pharmacy laws, prescription
                            medications cannot be returned or refunded once
                            shipped.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-deep-navy/75 leading-relaxed">
                        If your order arrives damaged or contains any
                        discrepancy, contact our customer care team within 48
                        hours for immediate replacement.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeDetailTab === "reviews" && (
                <div>
                  {productReviews.length > 0 ? (
                    <div className="space-y-4">
                      {productReviews.map((review, index) => (
                        <div
                          key={review.id || index}
                          className="border-b border-slate-100 pb-3 last:border-0"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-deep-navy">
                              {review.user?.name ||
                                review.name ||
                                review.reviewerName ||
                                "Customer"}
                            </span>
                            <span className="text-xs text-[#c69220]">
                              {review.rating || 5}/5
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-deep-navy/70">
                            {review.comment || review.text || ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-[#f8fafc] rounded-2xl border border-slate-200 text-deep-navy/60 font-medium">
                      <p className="text-sm font-bold text-deep-navy mb-1">
                        No customer reviews yet
                      </p>
                      <p className="text-xs text-deep-navy/60">
                        Be the first verified pet parent to review{" "}
                        {product.name}!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] py-4 sm:py-6 lg:py-8 w-full overflow-x-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-8">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-deep-navy/50 overflow-x-auto scrollbar-none whitespace-nowrap py-1"
        >
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-primary-green transition-colors shrink-0"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
          <Link
            to="/products"
            className="hover:text-primary-green transition-colors shrink-0"
          >
            Medicines
          </Link>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
              <Link
                to={`/products?category=${encodeURIComponent(typeof product.category === "object" ? product.category.name : product.category)}`}
                className="hover:text-primary-green transition-colors truncate max-w-[140px] shrink-0"
              >
                {typeof product.category === "object"
                  ? product.category.name
                  : product.category}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
          <Link
            to={`/product/${product.slug || product.id || id}`}
            className="text-deep-navy/70 hover:text-primary-green font-extrabold truncate max-w-[180px] shrink-0"
          >
            {product.name}
          </Link>
          {variantGroups.length > 1 && (
            <>
              <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
              <Link
                to={`/product/${product.slug || product.id || id}/variants`}
                className="hover:text-primary-green transition-colors shrink-0"
              >
                Family Variants
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 text-deep-navy/30 shrink-0" />
          <span className="text-primary-green font-extrabold shrink-0">
            {activeGroup?.groupTitle || "Dosage & Variant Studio"}
          </span>
        </nav>

        {/* ─── 1. TOP PANORAMIC PRODUCT HERO CANOPY ─── */}
        <section className="relative overflow-hidden rounded-2xl bg-white text-deep-navy p-5 sm:p-7 lg:p-8 shadow-sm border border-slate-200">
          {/* Ambient Glows */}
          <div className="hidden" />
          <div className="hidden" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Integrated Square Image Badge */}
            <Link
              to={`/product/${product.slug || product.id || id}`}
              className="relative shrink-0 w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-xl bg-[#fffdf8] p-3 flex items-center justify-center shadow-sm border border-slate-100 hover:ring-2 hover:ring-primary-green cursor-pointer group transition-all"
              title="Click to view full product details"
            >
              <img
                src={cleanImageUrl(activePack?.image || product.image)}
                alt={product.name}
                className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-2 left-2 right-2 text-center text-[9px] font-black uppercase tracking-wider py-0.5 rounded-md bg-[#f8f0dc] text-deep-navy group-hover:bg-primary-green group-hover:text-white transition-colors">
                {activePack?.pack || "Variant Format"}
              </span>
            </Link>

            {/* Product Identity & Meta */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f8f0dc] text-[10px] font-black uppercase tracking-wider text-[#c69220] border border-[#ead9ad]">
                  <Sparkles className="w-3 h-3 text-[#c69220]" />
                  Variant &amp; Regimen Studio
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-black uppercase tracking-wider text-deep-navy/70 border border-slate-200">
                  {typeof product.category === "object"
                    ? product.category.name
                    : product.category || "Pet Health"}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-black uppercase tracking-wider text-deep-navy/70 border border-slate-200">
                  {isCatProduct ? "Feline Formulation" : "Canine Formulation"}
                </span>
                {requiresVet && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-green text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-amber-300" />
                    Vet Licensed Only
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-deep-navy leading-tight">
                {activeGroup?.groupTitle || product.name}
              </h1>

              <p className="text-xs sm:text-sm text-deep-navy/65 font-medium leading-relaxed max-w-3xl line-clamp-2">
                {activeGroup?.subtitle ||
                  activeGroup?.familyVariant?.description ||
                  product.description ||
                  "Certified veterinary formulation with verified batch lot serialization and cold-chain temperature control."}
              </p>

              {/* Quick Specs Strip */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-deep-navy/65">
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#c69220]" />
                  <span>Free Cold-Chain Shipping $49+</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-mono text-deep-navy/50 text-[11px]">
                  SKU: {activePack?.sku || "PMD-MED"}
                </span>
              </div>
            </div>

            {/* Quick Actions & Navigation Link */}
            <div className="shrink-0 flex flex-col items-center md:items-end gap-3 pt-2 md:pt-0">
              {Boolean(finalRating && Number(finalRating) > 0) && (
                <div className="flex items-center gap-1 bg-[#f8f0dc] px-3 py-1.5 rounded-full border border-[#ead9ad]">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-extrabold text-deep-navy">
                    {Number(finalRating).toFixed(1)}
                  </span>
                  {finalReviewsCount > 0 && (
                    <span className="text-[11px] text-deep-navy/60">
                      ({finalReviewsCount} reviews)
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleBaseWishlist}
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                    baseWishlisted
                      ? "bg-rose-50 border-rose-200 text-rose-500"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-deep-navy"
                  }`}
                  title={
                    baseWishlisted ? "Remove from wishlist" : "Save to wishlist"
                  }
                >
                  <Heart
                    className={`w-4 h-4 ${baseWishlisted ? "fill-rose-400 text-rose-400" : ""}`}
                  />
                </button>

                {variantGroups.length > 1 && (
                  <Link
                    to={`/product/${product.slug || product.id || id}/variants`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-deep-navy font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-2xs"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Formulations</span>
                  </Link>
                )}

                <Link
                  to={`/product/${product.slug || product.id || id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-deep-navy hover:bg-primary-green border border-deep-navy text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#e3b33e]" />
                  <span>Base Product</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. STEP 1: FORMULATION / TARGET WEIGHT BRACKET (FULL WIDTH) ─── */}
        {variantGroups.length > 1 && (
          <section className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-sm text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-full bg-primary-green text-white text-xs font-black flex items-center justify-center shadow-xs">
                  1
                </span>
                <div>
                  <h3 className="font-display font-black text-sm sm:text-base text-deep-navy uppercase tracking-wider">
                    Select Formulation or Target Weight Bracket
                  </h3>
                  <p className="text-xs text-deep-navy/60 font-medium">
                    Calibrated specifically for patient therapeutic safety
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-primary-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
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
                      navigate(
                        `/product/${product.slug || product.id || id}/variants/${group.id}`,
                        { replace: true },
                      );
                    }}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 min-w-0 ${
                      isSelected
                        ? "border-primary-green bg-emerald-50/60 ring-2 ring-primary-green/20 shadow-sm"
                        : "border-slate-200/80 bg-white hover:border-primary-green/40 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="size-3.5 rounded-full shrink-0 border border-white shadow-2xs"
                        style={{
                          backgroundColor: group.badgeColor || "#58b947",
                        }}
                      />
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-primary-green bg-primary-green text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <Check size={10} className="stroke-[3]" />
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="font-display font-extrabold text-xs sm:text-sm text-deep-navy block truncate">
                        {group.groupTitle}
                      </span>
                      {group.badge && (
                        <span className="text-[10px] font-bold text-deep-navy/50 uppercase tracking-wider block truncate mt-0.5">
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
        <section className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 lg:p-8 shadow-sm text-left space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="size-6 rounded-full bg-primary-green text-white text-xs font-black flex items-center justify-center shadow-xs">
                1
              </span>
              <div>
                <h3 className="font-display font-black text-sm sm:text-base text-deep-navy uppercase tracking-wider">
                  Select Pack Supply &amp; Dosage Tier
                </h3>
                <p className="text-xs text-deep-navy/60 font-medium">
                  Compare supply formats and lock in direct dispensing savings
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-dark-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">
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
                  }}
                  className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border-2 min-w-0 hover:border-primary-green hover:shadow-lg ${
                    isSelected
                      ? "border-primary-green bg-gradient-to-b from-emerald-50/80 via-white to-white ring-2 ring-primary-green/25 shadow-md scale-[1.01]"
                      : "border-slate-200/80 bg-white hover:bg-slate-50/70"
                  }`}
                  title="Click to view product details"
                >
                  {/* Top Tier Badge & Checkmark */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-display font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-primary-green text-white shadow-2xs"
                          : "bg-slate-100 text-deep-navy/70"
                      }`}
                    >
                      {tierLabel}
                    </span>

                    <div
                      className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-primary-green bg-primary-green text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check size={10} className="stroke-[3]" />}
                    </div>
                  </div>

                  {/* Pack Name & Thumbnail */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-xl bg-[#f8fafc] border border-slate-200/80 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                      <img
                        src={cleanImageUrl(
                          row.image || activeGroup?.image || product.image,
                        )}
                        alt={row.pack}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-black text-base text-deep-navy truncate">
                        {row.pack}
                      </h4>
                      {row.stock === 0 ? (
                        <span className="text-[11px] font-bold text-rose-600 block">
                          ● Out of Stock
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between mb-4">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-display font-black text-deep-navy">
                          ${row.salePrice}
                        </span>
                        {rowReg > rowSale && (
                          <span className="text-xs font-semibold text-slate-400 line-through">
                            ${row.regularPrice}
                          </span>
                        )}
                      </div>
                      {savePercent > 0 && (
                        <span className="text-[10px] font-extrabold text-dark-green block mt-0.5">
                          Save {savePercent}% Off Standard
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-deep-navy/40 uppercase">
                      {row.sku ? row.sku.slice(-6) : "PACK"}
                    </span>
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
                    className={`w-full h-11 rounded-xl font-display font-extrabold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                      row.stock === 0
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        : addingState[row.key]
                          ? "bg-dark-green text-white shadow-dark-green/30"
                          : "bg-primary-green hover:bg-dark-green text-white shadow-primary-green/20"
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
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm text-left">
          <div className="flex overflow-x-auto border-b border-slate-200 bg-[#fffdf8]">
            {[
              ["details", "Product Details"],
              ["shipping", "Shipping"],
              ["returns", "Returns"],
              ["reviews", `Reviews (${finalReviewsCount})`],
            ].map(([tabId, label]) => (
              <button
                key={tabId}
                type="button"
                onClick={() => setActiveDetailTab(tabId)}
                className={`relative whitespace-nowrap px-5 py-4 text-xs font-bold transition-colors ${
                  activeDetailTab === tabId
                    ? "text-[#c69220]"
                    : "text-deep-navy/55 hover:text-deep-navy"
                }`}
              >
                {label}
                {activeDetailTab === tabId && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d9aa3d]" />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-40 p-6 sm:p-8">
            {activeDetailTab === "details" && (
              <div>
                {richHtmlContent ? (
                  <div
                    className="variant-rich-content rich-content-display max-w-5xl font-sans text-sm leading-relaxed text-deep-navy/80"
                    dangerouslySetInnerHTML={{ __html: richHtmlContent }}
                  />
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc] text-sm text-deep-navy/70">
                    <p className="font-bold text-deep-navy mb-1">
                      {activeGroup?.groupTitle || product.name}
                    </p>
                    <p>
                      {activeGroup?.subtitle ||
                        product.description ||
                        "Product formulation details are maintained and verified by our veterinary pharmacy team."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "shipping" && (
              <div className="space-y-6">
                {shippingContent ? (
                  <div
                    className="prose prose-slate max-w-5xl text-sm leading-relaxed text-deep-navy/80"
                    dangerouslySetInnerHTML={{ __html: shippingContent }}
                  />
                ) : (
                  <div className="space-y-4 max-w-4xl text-left">
                    <h4 className="font-display font-black text-base text-deep-navy uppercase tracking-wider">
                      Shipping &amp; Delivery Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                        <span className="font-bold text-sm text-deep-navy block mb-1">
                          🚚 Free Ground Shipping
                        </span>
                        <p className="text-xs text-deep-navy/70">
                          Free standard delivery on all orders over $49. Arrives
                          within 2–4 business days.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                        <span className="font-bold text-sm text-deep-navy block mb-1">
                          ❄️ Cold-Chain Care
                        </span>
                        <p className="text-xs text-deep-navy/70">
                          Temperature-sensitive items are dispatched in
                          insulated coolers with medical-grade ice packs.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                        <span className="font-bold text-sm text-deep-navy block mb-1">
                          📦 Real-Time Tracking
                        </span>
                        <p className="text-xs text-deep-navy/70">
                          Full tracking updates sent directly to your email upon
                          pharmacy dispatch.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-deep-navy/75 leading-relaxed">
                      Non-prescription orders placed by 2:00 PM EST ship
                      same-day. Prescription medications ship immediately upon
                      licensed veterinarian authorization.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "returns" && (
              <div className="space-y-6">
                {returnsContent ? (
                  <div
                    className="prose prose-slate max-w-5xl text-sm leading-relaxed text-deep-navy/80"
                    dangerouslySetInnerHTML={{ __html: returnsContent }}
                  />
                ) : (
                  <div className="space-y-4 max-w-4xl text-left">
                    <h4 className="font-display font-black text-base text-deep-navy uppercase tracking-wider">
                      Returns &amp; Refund Policy
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
                      <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                        <span className="font-bold text-sm text-deep-navy block mb-1">
                          ⭐ 30-Day Satisfaction Guarantee
                        </span>
                        <p className="text-xs text-deep-navy/70">
                          Return unopened and eligible pet supplies within 30
                          days for a full refund or exchange.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-200 bg-[#f8fafc]">
                        <span className="font-bold text-sm text-deep-navy block mb-1">
                          ⚕️ Pharmacy Safety Regulations
                        </span>
                        <p className="text-xs text-deep-navy/70">
                          Due to federal and state pharmacy laws, prescription
                          medications cannot be returned or refunded once
                          shipped.
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-deep-navy/75 leading-relaxed">
                      If your order arrives damaged or contains any discrepancy,
                      contact our customer care team within 48 hours for
                      immediate replacement.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === "reviews" && (
              <div>
                {productReviews.length > 0 ? (
                  <div className="space-y-4">
                    {productReviews.map((review, index) => (
                      <div
                        key={review.id || index}
                        className="border-b border-slate-100 pb-3 last:border-0"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-bold text-deep-navy">
                            {review.user?.name ||
                              review.name ||
                              review.reviewerName ||
                              "Customer"}
                          </span>
                          <span className="text-xs text-[#c69220]">
                            {review.rating || 5}/5
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-deep-navy/70">
                          {review.comment || review.text || ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#f8fafc] rounded-2xl border border-slate-200 text-deep-navy/60 font-medium">
                    <p className="text-sm font-bold text-deep-navy mb-1">
                      No customer reviews yet
                    </p>
                    <p className="text-xs text-deep-navy/60">
                      Be the first verified pet parent to review{" "}
                      {activeGroup?.groupTitle || product.name}!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
