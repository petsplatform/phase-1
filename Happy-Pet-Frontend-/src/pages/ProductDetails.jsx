import { useState, useEffect, useMemo } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import {
  Heart,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Sparkles,
  Minus,
  Plus,
  ChevronRight,
  ChevronDown,
  Share2,
  Check,
  RotateCcw,
  Star,
  MessageSquareQuote,
  CheckCircle2,
  User,
  Layers,
} from "lucide-react";
import { productApi } from "../api/productApi";
import { reviewApi } from "../api/reviewApi";

import { useCart } from "../utils/cartFunctionality.js";
import { useWishlist } from "../utils/wishlistFunctionality.js";
import { copyToClipboard } from "../utils/clipboardUtils.js";
import {
  isPrescriptionRequired,
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
} from "../utils/productUtils";
import {
  formatProductRichContent,
  decodeHtmlEntities,
  isSlugLike,
  hasMeaningfulContent,
} from "../utils/htmlUtils";
import { useAuth } from "../store/authentication/authContext";
import ProductCard from "../components/product/ProductCard.jsx";

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

const detailBulletFields = [
  "features",
  "highlights",
  "benefits",
  "keyFeatures",
  "bulletPoints",
];

function splitSizeAndPackLabel(label) {
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

  return {
    size: parts[0] || value,
    pack: parts.slice(1).join(" + "),
  };
}

function isPresent(value) {
  return value !== undefined && value !== null && value !== "";
}

function getFirstPresent(source, fields) {
  return fields.map((field) => source?.[field]).find(isPresent);
}

function splitText(value) {
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function labelFromKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeDetailContent(value) {
  if (!isPresent(value)) return [];

  if (Array.isArray(value)) {
    return value.flatMap(normalizeDetailContent);
  }

  if (typeof value === "object") {
    const textValue =
      value.text ??
      value.description ??
      value.content ??
      value.value ??
      value.message;

    if (isPresent(textValue)) {
      return splitText(textValue).map((text) => ({
        title: value.title || value.label || value.name,
        text,
      }));
    }

    return Object.entries(value)
      .filter(([, itemValue]) => isPresent(itemValue))
      .flatMap(([key, itemValue]) => {
        const lines = normalizeDetailContent(itemValue);
        return lines.map((line) => ({
          ...line,
          title: line.title || labelFromKey(key),
        }));
      });
  }

  return splitText(value).map((text) => ({ text }));
}

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
        <div
          key={`${item.title || "detail"}-${idx}`}
          className="flex items-start gap-2.5 bg-[#FAF8FF] p-3.5 rounded-xl border border-[#f0ebf8]"
        >
          <span className="w-4 h-4 rounded-full bg-brand-purple/5 text-[#a855f7] flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-2.5 h-2.5" />
          </span>
          <span>
            {item.title && (
              <span className="text-brand-purple font-extrabold">
                {item.title}:{" "}
              </span>
            )}
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { toggleWishlist, wishlistIds } = useWishlist();
  const { currentUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [relatedCatalogProducts, setRelatedCatalogProducts] = useState([]);

  // States
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [showAllImages, setShowAllImages] = useState(false);

  const [reviewsList, setReviewsList] = useState([]);
  const reviewCount = reviewsList.length || Number(product?.reviewCount ?? 0);
  const avgRating = reviewsList.length
    ? reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0) /
      reviewsList.length
    : Number(product?.averageRating ?? 0);

  useEffect(() => {
    if (!id) return;
    reviewApi
      .getProductReviews(id)
      .then((data) => {
        setReviewsList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setReviewsList([]);
      });
  }, [id]);

  // Variant selections
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [activeSizeIndex, setActiveSizeIndex] = useState(0);

  const variantParam =
    searchParams.get("variant") ||
    searchParams.get("size") ||
    searchParams.get("variantId");
  const familyVariantParam =
    searchParams.get("familyVariantId") || searchParams.get("familyId");

  const allSizes = useMemo(() => {
    return (
      product?.sizes || [
        {
          label: "Standard",
          displayLabel: "Standard",
          multiplier: 1.0,
          price: product?.sellPrice || product?.price || 0,
          originalPrice: product?.originalPrice || product?.sellPrice || 0,
          stock: product?.stockQuantity || 50,
          sku: product?.sku || "PROD-STD",
        },
      ]
    );
  }, [product]);

  const isFamily =
    isFamilyProduct(product) &&
    Array.isArray(product?.familyVariants) &&
    product.familyVariants.length > 0;
  const familyVariants = isFamily ? product.familyVariants : [];
  const [activeFamilyId, setActiveFamilyId] = useState(null);

  const activeFamilyVariant = useMemo(() => {
    if (!isFamily || !familyVariants.length) return null;

    if (familyVariantParam) {
      const cleanParam = String(familyVariantParam).replace(/^fv-/, "");
      const byFvId = familyVariants.find(
        (fv) =>
          String(fv.id || fv._id) === String(familyVariantParam) ||
          String(fv.id || fv._id) === cleanParam ||
          String(familyVariantParam) === `fv-${fv.id || fv._id}` ||
          fv.slug === String(familyVariantParam) ||
          String(fv.name || fv.displayName || "").toLowerCase() ===
            String(familyVariantParam).toLowerCase() ||
          String(fv.name || fv.displayName || "").toLowerCase() ===
            cleanParam.toLowerCase(),
      );
      if (byFvId) return byFvId;
    }

    if (activeFamilyId) {
      const byActive = familyVariants.find(
        (fv) => String(fv.id || fv._id) === String(activeFamilyId),
      );
      if (byActive) return byActive;
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
  }, [
    isFamily,
    familyVariants,
    familyVariantParam,
    activeFamilyId,
    variantParam,
    allSizes,
  ]);

  useEffect(() => {
    if (activeFamilyVariant && activeFamilyVariant.id !== activeFamilyId) {
      setActiveFamilyId(activeFamilyVariant.id);
    }
  }, [activeFamilyVariant]);

  const sizes = useMemo(() => {
    if (!isFamily || !familyVariants.length || !activeFamilyVariant) {
      return allSizes;
    }

    const pTitle = (product?.name || product?.title || "").trim();

    // Strategy A: If activeFamilyVariant has explicit skus (such as 1 Pack / 2 Pack with custom prices like 37 & 72)
    if (
      Array.isArray(activeFamilyVariant.skus) &&
      activeFamilyVariant.skus.length > 0
    ) {
      const fvImg =
        (typeof activeFamilyVariant.mainImage === "string"
          ? activeFamilyVariant.mainImage
          : activeFamilyVariant.mainImage?.url ||
            activeFamilyVariant.mainImage?.src) ||
        (typeof activeFamilyVariant.image === "string"
          ? activeFamilyVariant.image
          : activeFamilyVariant.image?.url || activeFamilyVariant.image?.src) ||
        activeFamilyVariant.imageUrl ||
        product.image;

      return activeFamilyVariant.skus.map((s, sIdx) => {
        const salePrice = Number(
          s.pricing?.finalPrice ??
            s.pricing?.salePrice ??
            s.salePrice ??
            s.price ??
            product.sellPrice ??
            37,
        );
        const regPrice = Number(
          s.pricing?.price ??
            s.pricing?.regularPrice ??
            s.regularPrice ??
            s.price ??
            salePrice * 1.35,
        );
        // The admin pack/SKU table stores the customer-facing pack name on
        // the SKU. Prefer that value so the storefront does not invent labels
        // such as "1 Pack" when the admin entered "3 Doses" or "6 Doses".
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
          id: s.id || `${activeFamilyVariant.id}-${sIdx}`,
          sku: s.sku || `${product.sku || "HP"}-${sIdx + 1}`,
          label: packLabel,
          displayLabel: packLabel,
          packOnlyLabel: packLabel,
          price: salePrice,
          originalPrice: regPrice,
          stock: Number(s.stock ?? s.inventory?.stockQuantity ?? 50),
          multiplier: 1.0,
          image: fvImg,
          imageUrl: fvImg,
          familyVariant: activeFamilyVariant,
          familyVariantId: activeFamilyVariant.id,
        };
      });
    }

    // Strategy B: Match from allSizes and clean formulation prefix from pack label
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
          String(sz.familyVariantId) === `fv-${fvId}` ||
          String(sz.familyVariantId).replace(/^fv-/, "") === fvId ||
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

    const targetList = matched.length > 0 ? matched : allSizes;

    return targetList.map((sub, sIdx) => {
      let packOnly = sub.displayLabel || sub.label || "";
      if (pTitle) {
        packOnly = packOnly.replace(
          new RegExp(
            `^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
            "i",
          ),
          "",
        );
      }
      if (fvClean) {
        packOnly = packOnly.replace(
          new RegExp(
            `^${fvClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
            "i",
          ),
          "",
        );
        packOnly = packOnly.replace(
          new RegExp(
            `\\(${fvClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
            "gi",
          ),
          "",
        );
      }
      if (activeFamilyVariant.name) {
        packOnly = packOnly.replace(
          new RegExp(
            `^${String(activeFamilyVariant.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
            "i",
          ),
          "",
        );
      }
      if (activeFamilyVariant.weightRange) {
        packOnly = packOnly.replace(
          new RegExp(
            `^${String(activeFamilyVariant.weightRange).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
            "i",
          ),
          "",
        );
      }
      if (activeFamilyVariant.packColor || activeFamilyVariant.color) {
        const col = String(
          activeFamilyVariant.packColor || activeFamilyVariant.color,
        );
        packOnly = packOnly.replace(new RegExp(`\\(?${col}\\)?`, "gi"), "");
      }
      packOnly = packOnly.replace(/^[\s/–—-]+/, "").trim() || packOnly;
      if (/^\d+$/.test(packOnly)) {
        packOnly = `${packOnly} Pack`;
      }

      return {
        ...sub,
        displayLabel:
          packOnly || sub.displayLabel || sub.label || `${sIdx + 1} Pack`,
        packOnlyLabel:
          packOnly || sub.displayLabel || sub.label || `${sIdx + 1} Pack`,
      };
    });
  }, [isFamily, familyVariants, activeFamilyVariant, allSizes, product]);

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
        return;
      }
    }
    setActiveSizeIndex(0);
  }, [variantParam, sizes]);

  const activeSizeObj = sizes[activeSizeIndex] || sizes[0];

  const parsedSizeOptions = sizes.map((sizeOption) => ({
    ...sizeOption,
    ...splitSizeAndPackLabel(
      sizeOption.displayLabel || sizeOption.packOnlyLabel || sizeOption.label,
    ),
  }));
  const hasSeparateSizeAndPack = parsedSizeOptions.some(
    (sizeOption) => sizeOption.pack,
  );
  const selectedSizeAndPack = splitSizeAndPackLabel(
    activeSizeObj?.displayLabel || activeSizeObj?.packOnlyLabel || activeSizeObj?.label,
  );
  const sizeChoices = [
    ...new Set(
      parsedSizeOptions.map((sizeOption) => sizeOption.size).filter(Boolean),
    ),
  ];
  const packChoices = parsedSizeOptions.filter(
    (sizeOption, index, options) =>
      sizeOption.pack &&
      (!selectedSizeAndPack.size || sizeOption.size === selectedSizeAndPack.size) &&
      options.findIndex(
        (candidate) =>
          candidate.size === sizeOption.size && candidate.pack === sizeOption.pack,
      ) === index,
  );

  const selectSizeOption = (sizeValue) => {
    const nextIndex = parsedSizeOptions.findIndex(
      (sizeOption) =>
        sizeOption.size === sizeValue &&
        (!selectedSizeAndPack.pack || sizeOption.pack === selectedSizeAndPack.pack),
    );
    const fallbackIndex = parsedSizeOptions.findIndex(
      (sizeOption) => sizeOption.size === sizeValue,
    );
    const index = nextIndex === -1 ? fallbackIndex : nextIndex;
    if (index !== -1) {
      const next = sizes[index];
      setActiveSizeIndex(index);
      setQuantity((prev) => Math.min(prev, next.stock || 9999));
      if (next.image) setActiveImage(next.image);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next.id) params.set("variant", next.id);
          return params;
        },
        { replace: true },
      );
    }
  };

  const selectPackOption = (packValue) => {
    const index = parsedSizeOptions.findIndex(
      (sizeOption) =>
        sizeOption.size === selectedSizeAndPack.size &&
        sizeOption.pack === packValue,
    );
    if (index !== -1) {
      const next = sizes[index];
      setActiveSizeIndex(index);
      setQuantity((prev) => Math.min(prev, next.stock || 9999));
      if (next.image) setActiveImage(next.image);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next.id) params.set("variant", next.id);
          return params;
        },
        { replace: true },
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    window.scrollTo({ top: 0, behavior: "smooth" });

    const applyProduct = (nextProduct) => {
      if (!nextProduct) return;
      setProduct(nextProduct);
      setActiveImage(
        nextProduct.images ? nextProduct.images[0] : nextProduct.image,
      );
      setQuantity(1);
      setShowAllImages(false);

      // Initialize variant settings
      if (nextProduct.variants) {
        if (nextProduct.variants.type === "size_color") {
          setSelectedSize(
            nextProduct.variants.defaultSize || nextProduct.variants.sizes[0],
          );
          setSelectedColor(
            nextProduct.variants.defaultColor || nextProduct.variants.colors[0],
          );
          setSelectedOption("");
        } else {
          setSelectedOption(
            nextProduct.variants.default || nextProduct.variants.options[0],
          );
          setSelectedSize("");
          setSelectedColor("");
        }
      } else {
        setSelectedSize("");
        setSelectedColor("");
        setSelectedOption("");
      }
    };

    const loadProduct = async () => {
      try {
        setIsLoadingProduct(true);
        applyProduct(await productApi.getProductById(id));
      } catch (error) {
        console.error("Failed to load STORE_5 product", error);
        if (!cancelled) {
          setProduct(null);
        }
      } finally {
        if (!cancelled) setIsLoadingProduct(false);
      }
    };

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    productApi
      .getProducts({ limit: 8 })
      .then((data) => {
        if (!cancelled) {
          setRelatedCatalogProducts(
            Array.isArray(data.items) ? data.items : [],
          );
        }
      })
      .catch(() => {
        if (!cancelled) setRelatedCatalogProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVariant =
    product?.optionVariants && selectedOption
      ? product.optionVariants.find(
          (variant) => variant.label === selectedOption,
        )
      : null;

  // Dynamic Admin Rich-Text Content (Compatible with Admin WYSIWYG editor responses)
  const richHtmlContent = useMemo(() => {
    if (!product) return "";

    // 1. If active family variant has its own genuine rich content, use that
    const variantContent =
      isFamily && hasMeaningfulContent(activeFamilyVariant?.content)
        ? activeFamilyVariant.content.trim()
        : "";

    // 2. Otherwise fall back cleanly to parent productDetails content
    const fallbackContent =
      product?.productDetails?.content ||
      product?.productDetails?.overview ||
      product?.content ||
      product?.parentContent ||
      product?.overview ||
      product?.longDescription ||
      product?.description ||
      "";

    const raw = variantContent || fallbackContent;
    return formatProductRichContent(raw, product);
  }, [isFamily, activeFamilyVariant, product, selectedVariant]);

  const images = useMemo(() => {
    if (!product) return [];

    // Gather ONLY active variant's image and gallery
    const activeVarImages = [];
    const vImg = activeSizeObj?.image || activeSizeObj?.imageUrl;
    if (vImg && typeof vImg === "string") activeVarImages.push(vImg);

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
        (typeof activeFamilyVariant.imageUrl === "string"
          ? activeFamilyVariant.imageUrl
          : null);
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

    const primaryCandidates = [
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
    const galleryList = [...rawG, ...rawI]
      .map((img) => {
        if (!img) return null;
        if (typeof img === "string" && img.trim()) return img.trim();
        return img.url || img.src || null;
      })
      .filter(Boolean);

    const fallbackMerged = Array.from(
      new Set([...primaryCandidates, ...galleryList]),
    ).filter(Boolean);

    return fallbackMerged.length > 0 ? fallbackMerged : [product?.image || ""];
  }, [product, activeSizeObj, activeFamilyVariant]);

  useEffect(() => {
    if (images && images.length > 0) {
      setActiveImage(images[0]);
    }
  }, [activeSizeIndex, activeFamilyVariant?.id]);

  if (isLoadingProduct && !product) {
    return (
      <main className="flex-grow select-none py-24 min-h-screen bg-brand-cream/10 flex items-center justify-center">
        <div className="text-sm font-bold text-brand-purple">
          Loading product...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-grow select-none py-24 min-h-screen bg-brand-cream/10 flex items-center justify-center">
        <div className="bg-white border border-[#f0ebf8] rounded-[24px] py-16 px-8 text-center max-w-md mx-auto shadow-lg w-full">
          <div className="w-16 h-16 rounded-2xl bg-brand-purple/5 text-brand-purple flex items-center justify-center mx-auto mb-6 shadow-inner">
            <RotateCcw className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-display font-extrabold text-brand-purple">
            Product Not Found
          </h2>
          <p className="text-xs text-brand-brown/65 mt-3 leading-relaxed font-semibold">
            Sorry, the product you are looking for does not exist or has been
            removed from our catalog.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="bg-brand-purple hover:bg-[#3a0038] text-white font-bold text-xs px-8 py-4 rounded-xl transition-all duration-300 shadow-md mt-8 active:scale-97 cursor-pointer"
          >
            Back to Catalog
          </button>
        </div>
      </main>
    );
  }

  const name = product.name;
  const categoryName = product.categoryName;
  const brand = product.brand;
  const features = selectedVariant?.features || product.features;
  // Only display genuine shortDescription under the title/price, never slugs or IDs
  const rawShortDesc = !isFamily
    ? product?.shortDescription || ""
    : product?.shortDescription || selectedVariant?.shortDescription || "";

  const displayedDescription =
    !rawShortDesc || isSlugLike(rawShortDesc) ? "" : rawShortDesc;

  const description = displayedDescription;

  const formattedDescription = description
    ? decodeHtmlEntities(String(description))
    : "";

  // Long description: display genuine longDescription/fullDescription or fall back to product description
  const rawLongDesc = !isFamily
    ? product?.longDescription ||
      product?.fullDescription ||
      product?.productDetails?.overview ||
      product?.overview ||
      product?.description ||
      ""
    : (hasMeaningfulContent(activeFamilyVariant?.longDescription)
        ? activeFamilyVariant.longDescription
        : hasMeaningfulContent(activeFamilyVariant?.description)
          ? activeFamilyVariant.description
          : selectedVariant?.longDescription) ||
      product?.longDescription ||
      product?.fullDescription ||
      product?.productDetails?.overview ||
      product?.overview ||
      product?.description ||
      "";

  const longDescription =
    !rawLongDesc || isSlugLike(rawLongDesc) ? "" : rawLongDesc;

  const sellPrice = Number(
    activeSizeObj?.price ??
      selectedVariant?.pricing?.finalPrice ??
      selectedVariant?.price ??
      selectedVariant?.salePrice ??
      product.sellPrice ??
      product.price ??
      0,
  );
  const originalPrice = Number(
    activeSizeObj?.originalPrice ??
      selectedVariant?.pricing?.price ??
      selectedVariant?.regularPrice ??
      selectedVariant?.mrp ??
      product.originalPrice ??
      sellPrice,
  );
  const discountPercentage = Number(
    originalPrice > sellPrice
      ? Math.round(((originalPrice - sellPrice) / originalPrice) * 100)
      : product.discountPercentage || 0,
  );
  const inStock = activeSizeObj
    ? activeSizeObj.stock !== undefined
      ? Number(activeSizeObj.stock) > 0
      : true
    : product.inStock;

  const isWishlisted = wishlistIds.includes(product.id);

  // Variant calculations & helper
  const getSelectedVariantStock = () => {
    if (activeSizeObj && activeSizeObj.stock !== undefined) {
      return Number(activeSizeObj.stock);
    }
    if (selectedVariant) {
      return Number(
        selectedVariant.stock ??
          selectedVariant.inventory?.stockQuantity ??
          product.stock ??
          9999,
      );
    }
    return product.stock ?? 9999;
  };
  const availableStock = getSelectedVariantStock();
  const displayActiveImage =
    activeImage && images.includes(activeImage)
      ? activeImage
      : images[0] || activeImage;

  // Calculations
  const savings = originalPrice - sellPrice;

  const getColorName = (hex) => {
    const colorMap = {
      "#4A4A4A": "Charcoal Grey",
      "#4B004B": "Royal Purple",
      "#D2B48C": "Beige Velvet",
      "#2B6CB0": "Ocean Blue",
      "#2F855A": "Forest Green",
      "#DD6B20": "Sunset Orange",
    };
    return colorMap[hex] || hex;
  };

  const getProductWithVariants = () => {
    let suffixParts = [];
    if (activeFamilyVariant?.name) suffixParts.push(activeFamilyVariant.name);
    if (activeSizeObj?.displayLabel || activeSizeObj?.label) {
      suffixParts.push(activeSizeObj.displayLabel || activeSizeObj.label);
    } else if (selectedOption) {
      suffixParts.push(selectedOption);
    }

    const suffix =
      suffixParts.length > 0 ? ` (${suffixParts.join(" / ")})` : "";
    const chosenVariantId =
      activeSizeObj?.id || activeFamilyVariant?.id || selectedVariant?.id || "";

    return {
      ...product,
      // Modify ID to make variant unique in the cart
      id: chosenVariantId
        ? `${product.id}-${String(chosenVariantId).replace(/\s+/g, "").replace(/#/g, "")}`
        : product.id,
      name: `${product.name}${suffix}`,
      title: `${product.name}${suffix}`,
      productId: product.productId || product.id,
      selectedVariantId: chosenVariantId,
      variantId: chosenVariantId,
      selectedSize:
        activeSizeObj?.displayLabel || activeSizeObj?.label || selectedSize,
      selectedColor: selectedColor ? getColorName(selectedColor) : "",
      selectedOption: suffixParts.join(" / ") || selectedOption,
      price: sellPrice,
      sellPrice,
      originalPrice,
      discountPercentage,
      image: (images && images[0]) || product.image,
      images,
      stock: availableStock,
      inStock,
    };
  };

  // Handlers
  const handleQuantityChange = (type) => {
    if (type === "dec") {
      setQuantity((prev) => Math.max(1, prev - 1));
    } else {
      setQuantity((prev) => {
        const nextQty = prev + 1;
        if (nextQty > availableStock) {
          toast.error(
            `Cannot order more than available stock (${availableStock})`,
          );
          return prev;
        }
        return nextQty;
      });
    }
  };

  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, currentUser);

  const handleAddToCartClick = () => {
    if (userLacksVet) {
      toast.error("This product is available only for verified veterinarians.");
      navigate(currentUser ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (!inStock) return;
    const finalProduct = getProductWithVariants();
    addToCart(finalProduct, quantity);
    toast.success(`${quantity} x ${finalProduct.name} added to cart! 🛒`);
  };

  const handleBuyNowClick = () => {
    if (userLacksVet) {
      toast.error("This product is available only for verified veterinarians.");
      navigate(currentUser ? "/profile?tab=vet-verification" : "/login");
      return;
    }
    if (!inStock) return;
    const finalProduct = getProductWithVariants();

    sessionStorage.setItem(
      "happypet_buy_now",
      JSON.stringify({ product: finalProduct, quantity, rxData: null }),
    );
    navigate("/checkout?buyNow=1");
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product.id);
  };

  const handleShareClick = async () => {
    await copyToClipboard(window.location.href);
    toast.success("Product URL copied to clipboard! 🔗");
  };

  // Find related products (same category, excluding current product)
  const relatedProducts = relatedCatalogProducts
    .filter((p) => p.categoryName === categoryName && p.id !== product.id)
    .slice(0, 4);

  // If no related products in same category, show other top sellers
  const backupProducts = relatedCatalogProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const displayedRelatedProducts =
    relatedProducts.length > 0 ? relatedProducts : backupProducts;
  const descriptionBullets = normalizeDetailContent(
    getFirstPresent(product, detailBulletFields) || features,
  );
  const shippingDetails = normalizeDetailContent(
    getFirstPresent(product, detailFieldMap.shipping),
  );
  const returnDetails = normalizeDetailContent(
    getFirstPresent(product, detailFieldMap.returns),
  );

  return (
    <main
      className="flex-grow select-none py-12 relative min-h-screen bg-white"
      style={{
        background:
          "linear-gradient(180deg, #FAF8FF 0%, #FFFBF7 50%, #FAF8FF 100%)",
      }}
    >
      {/* Decorative ambient page glows */}
      <div className="absolute top-20 right-0 w-[550px] h-[550px] bg-brand-purple/5 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-0 w-[450px] h-[450px] bg-brand-peach/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
        {/* ── BREADCRUMBS & BACK BUTTON ── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="text-[10px] font-extrabold text-brand-purple uppercase tracking-[0.25em] flex items-center gap-1.5">
            <Link to="/" className="hover:text-brand-purple transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />
            <Link
              to="/products"
              className="hover:text-brand-purple transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-brand-purple/20" />
            <span className="text-brand-purple">{categoryName}</span>
          </div>
        </div>

        {/* ── SINGLE COMBINED PRODUCT DETAIL CARD ── */}
        <div className="bg-white border border-[#f0ebf8] rounded-[24px] shadow-sm mb-16 overflow-hidden">
          {/* Product Presentation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 p-6 sm:p-10 border-b border-[#f0ebf8]">
            {/* Left Column: Image Gallery (lg:span-7) */}
            <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-5">
              {/* Gallery Thumbnails List */}
              {images && images.length > 0 && (
                <div className="flex flex-row md:flex-col gap-3 sm:gap-3.5 md:w-20 lg:w-24 shrink-0 overflow-x-auto md:overflow-y-auto md:max-h-[480px] lg:max-h-[550px] scrollbar-none justify-start">
                  {(() => {
                    const maxInitialThumbnails = 5;
                    const shouldTruncate =
                      images.length > maxInitialThumbnails && !showAllImages;
                    const visibleImages = shouldTruncate
                      ? images.slice(0, maxInitialThumbnails)
                      : images;

                    return visibleImages.map((imgUrl, index) => {
                      const isActive = displayActiveImage === imgUrl;
                      const isLastItemAndTruncated =
                        shouldTruncate && index === maxInitialThumbnails - 1;

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setActiveImage(imgUrl);
                            if (isLastItemAndTruncated) {
                              setShowAllImages(true);
                            }
                          }}
                          className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-20 md:h-20 lg:w-24 lg:h-24 shrink-0 rounded-xl overflow-hidden bg-brand-cream/15 border transition-all duration-300 cursor-pointer ${
                            isActive
                              ? "border-brand-purple ring-2 ring-brand-purple/10 scale-[0.98]"
                              : "border-brand-purple/10 hover:border-brand-purple/40 hover:scale-[1.02]"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`${name} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isLastItemAndTruncated && (
                            <div className="absolute inset-0 bg-[#4B004B]/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-all hover:bg-[#4B004B]/50">
                              <span className="text-sm sm:text-base font-extrabold tracking-wide">
                                +{images.length - 4}
                              </span>
                              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-90">
                                More
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              )}

              {/* Main Image View */}
              <div className="relative flex-1 w-full h-[360px] sm:h-[450px] md:h-[480px] lg:h-[550px] rounded-2xl overflow-hidden bg-brand-cream/30 border border-brand-purple/5 flex items-center justify-center group/main">
                <img
                  src={displayActiveImage}
                  alt={name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/main:scale-105"
                />

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {discountPercentage > 0 && (
                    <span className="bg-brand-peach text-brand-purple text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      {discountPercentage}% OFF
                    </span>
                  )}
                  <span className="bg-[#4B004B] text-brand-peach text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-current" />
                    Premium Care
                  </span>
                </div>

                {/* Stock Status Badge */}
              </div>
            </div>

            {/* Right Column: Information & CTAs (lg:span-5) */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                {/* Brand and category info */}
                <div className="flex items-center gap-2 text-xs font-bold text-brand-purple/60 uppercase tracking-widest mb-3.5 flex-wrap">
                  <span>{brand}</span>
                  <span className="text-brand-purple/20">•</span>
                  <span>{categoryName}</span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl xl:text-4xl font-display font-extrabold text-brand-purple leading-tight tracking-tight mb-2.5">
                  {name}
                  {activeFamilyVariant &&
                    (() => {
                      if (activeFamilyVariant.weightRange) {
                        const color =
                          activeFamilyVariant.packColor ||
                          activeFamilyVariant.color;
                        const cleanFvTitle = color
                          ? `${activeFamilyVariant.weightRange} (${color})`
                          : activeFamilyVariant.weightRange;
                        return (
                          <span className="block sm:inline text-lg sm:text-xl font-bold text-brand-purple/70 sm:ml-2">
                            ({cleanFvTitle})
                          </span>
                        );
                      }
                      const rawFvName =
                        activeFamilyVariant.name ||
                        activeFamilyVariant.displayName ||
                        "";
                      let cleanFvTitle = rawFvName;
                      if (name) {
                        cleanFvTitle =
                          cleanFvTitle
                            .replace(
                              new RegExp(
                                `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
                                "i",
                              ),
                              "",
                            )
                            .replace(
                              new RegExp(
                                `\\(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
                                "gi",
                              ),
                              "",
                            )
                            .trim() || rawFvName;
                      }
                      if (
                        name &&
                        cleanFvTitle.toLowerCase().includes(name.toLowerCase())
                      ) {
                        cleanFvTitle = cleanFvTitle
                          .replace(
                            new RegExp(
                              name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                              "gi",
                            ),
                            "",
                          )
                          .trim();
                      }
                      return (
                        <span className="block sm:inline text-lg sm:text-xl font-bold text-brand-purple/70 sm:ml-2">
                          ({cleanFvTitle || rawFvName})
                        </span>
                      );
                    })()}
                </h1>

                {/* Star Rating Summary */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-brand-purple">
                    {reviewCount ? avgRating.toFixed(1) : "No"}
                  </span>
                  <span className="text-[11px] text-brand-brown/50 font-bold">
                    ({reviewCount} reviews)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("reviews");
                      document
                        .getElementById("details-tabs")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-xs font-extrabold text-[#6D53C6] hover:underline cursor-pointer ml-1"
                  >
                    See Reviews
                  </button>
                </div>
                {/* Short description */}
                {formattedDescription && (
                  <div className="text-sm md:text-base text-brand-brown/75 font-medium leading-relaxed mb-6.5">
                    {/<[a-z][\s\S]*>/i.test(formattedDescription) ? (
                      <div
                        className="leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: formattedDescription,
                        }}
                      />
                    ) : (
                      <p className="whitespace-pre-line leading-relaxed">
                        {formattedDescription}
                      </p>
                    )}
                  </div>
                )}

                {/* Pricing row */}
                <div className="bg-[#FAF8FF] border border-[#f0ebf8] rounded-2xl p-5 mb-6.5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-extrabold text-brand-purple/50 uppercase tracking-wider block mb-1">
                      Special Price
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-brand-purple">
                        ${sellPrice.toFixed(2)}
                      </span>
                      {originalPrice > sellPrice && (
                        <span className="text-sm text-brand-brown/40 line-through font-semibold">
                          ${originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {discountPercentage > 0 && (
                    <div className="text-right">
                      <span className="inline-block bg-brand-purple/5 border border-brand-purple/10 text-brand-purple text-xs font-extrabold px-3.5 py-1.5 rounded-xl">
                        Save ${savings.toFixed(2)} ({discountPercentage}% OFF)
                      </span>
                    </div>
                  )}
                </div>

                {requiresVet && (
                  <div className="mt-2 mb-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple px-3.5 py-1.5 text-xs font-extrabold uppercase text-white shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-peach" />
                      VERIFIED VETERINARIAN REQUIRED
                    </span>
                    {userLacksVet && (
                      <Link
                        to={
                          currentUser
                            ? "/profile?tab=vet-verification"
                            : "/login"
                        }
                        className="text-xs font-extrabold text-[#d9aa3d] hover:text-amber-700 underline cursor-pointer"
                      >
                        Apply for Verification
                      </Link>
                    )}
                  </div>
                )}

                {/* Variant Selector Section */}
                {(isFamily ||
                  product.variants ||
                  (sizes && sizes.length > 1)) && (
                  <div className="border-t border-b border-[#f0ebf8] py-5 mb-6.5 space-y-4">
                    {/* Tier 1: Formulation Selector for Family Products (shown only if not navigating to a specific variant) */}
                    {isFamily &&
                      !familyVariantParam &&
                      familyVariants.length > 1 && (
                        <div className="flex flex-col text-left">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-extrabold text-brand-purple/50 uppercase tracking-wider">
                              Select Formulation
                            </span>
                            {activeFamilyVariant?.name && (
                              <span className="text-xs font-bold text-brand-purple bg-brand-purple/5 px-2.5 py-0.5 rounded-full">
                                {activeFamilyVariant.name ||
                                  activeFamilyVariant.displayName}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {familyVariants.map((fv) => {
                              const isSelected =
                                activeFamilyVariant?.id === fv.id;
                              const colorHex = fv.packColorHex || fv.colorHex;
                              return (
                                <button
                                  key={fv.id}
                                  type="button"
                                  onClick={() => {
                                    setActiveFamilyId(fv.id);
                                    setSearchParams(
                                      (prev) => {
                                        const next = new URLSearchParams(prev);
                                        next.set("familyVariantId", fv.id);
                                        next.delete("variant");
                                        return next;
                                      },
                                      { replace: true },
                                    );
                                  }}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                                    isSelected
                                      ? "bg-brand-purple text-white shadow-sm border border-brand-purple"
                                      : "bg-[#FAF8FF] border border-[#e5ddf0] text-brand-purple hover:bg-brand-purple/5"
                                  }`}
                                >
                                  {colorHex && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-xs shrink-0"
                                      style={{ backgroundColor: colorHex }}
                                    />
                                  )}
                                  <span>
                                    {fv.name || fv.displayName || fv.label}
                                  </span>
                                  {fv.weightRange && (
                                    <span
                                      className={`text-[10px] ${
                                        isSelected
                                          ? "text-brand-peach font-bold"
                                          : "text-brand-brown/50"
                                      }`}
                                    >
                                      ({fv.weightRange})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Tier 2: Pack Size Selector (Strictly scoped to active formulation) */}
                    {sizes && sizes.length > 0 && !hasSeparateSizeAndPack && (
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-extrabold text-brand-purple/50 uppercase tracking-wider mb-2">
                          Select Pack Size
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                          {sizes.map((sz, sIdx) => {
                            const isSelected = activeSizeIndex === sIdx;
                            const packStock = sz.stock;
                            const displayLabel =
                              sz.displayLabel ||
                              sz.packOnlyLabel ||
                              sz.label ||
                              `Pack ${sIdx + 1}`;
                            return (
                              <button
                                key={sz.id || `sz-${sIdx}`}
                                type="button"
                                onClick={() => {
                                  setActiveSizeIndex(sIdx);
                                  setQuantity((prev) =>
                                    Math.min(prev, sz.stock || 9999),
                                  );
                                  if (sz.image) setActiveImage(sz.image);
                                  setSearchParams(
                                    (prev) => {
                                      const next = new URLSearchParams(prev);
                                      if (sz.id) next.set("variant", sz.id);
                                      return next;
                                    },
                                    { replace: true },
                                  );
                                }}
                                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                                  isSelected
                                    ? "bg-brand-purple text-white shadow-sm border border-brand-purple"
                                    : "bg-[#FAF8FF] border border-[#e5ddf0] text-brand-purple hover:bg-brand-purple/5"
                                }`}
                              >
                                <div className="flex flex-col text-left leading-tight">
                                  <span className="font-extrabold tracking-tight">
                                    {displayLabel}
                                  </span>
                                  {sz.price !== undefined &&
                                    sz.price !== null && (
                                      <span
                                        className={`text-[11px] font-semibold mt-0.5 ${
                                          isSelected
                                            ? "text-brand-peach"
                                            : "text-brand-purple/80"
                                        }`}
                                      >
                                        ${Number(sz.price).toFixed(2)}
                                      </span>
                                    )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {hasSeparateSizeAndPack && (
                      <>
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-extrabold text-brand-purple/50 uppercase tracking-wider mb-2">
                            Select Size
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {sizeChoices.map((sizeValue) => (
                              <button
                                key={sizeValue}
                                type="button"
                                onClick={() => selectSizeOption(sizeValue)}
                                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                                  selectedSizeAndPack.size === sizeValue
                                    ? "bg-brand-purple text-white shadow-sm border border-brand-purple"
                                    : "bg-[#FAF8FF] border border-[#e5ddf0] text-brand-purple hover:bg-brand-purple/5"
                                }`}
                              >
                                {sizeValue}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-extrabold text-brand-purple/50 uppercase tracking-wider mb-2">
                            Select Dose / Pack
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {packChoices.map((packOption) => (
                              <button
                                key={`${packOption.size}-${packOption.pack}`}
                                type="button"
                                onClick={() => selectPackOption(packOption.pack)}
                                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex flex-col items-start ${
                                  selectedSizeAndPack.pack === packOption.pack
                                    ? "bg-brand-purple text-white shadow-sm border border-brand-purple"
                                    : "bg-[#FAF8FF] border border-[#e5ddf0] text-brand-purple hover:bg-brand-purple/5"
                                }`}
                              >
                                <span>{packOption.pack}</span>
                                {packOption.price !== undefined &&
                                  packOption.price !== null && (
                                    <span
                                      className={`text-[11px] font-semibold mt-0.5 ${
                                        selectedSizeAndPack.pack === packOption.pack
                                          ? "text-brand-peach"
                                          : "text-brand-purple/80"
                                      }`}
                                    >
                                      ${Number(packOption.price).toFixed(2)}
                                    </span>
                                  )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Standard size/color selector if size_color type */}
                    {product.variants?.type === "size_color" && (
                      <>
                        {/* Size Selector */}
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-extrabold text-brand-purple/50 uppercase tracking-wider mb-2">
                            Select Size
                          </span>
                          <div className="flex flex-wrap gap-2.5">
                            {product.variants.sizes.map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setSelectedSize(size)}
                                className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                                  selectedSize === size
                                    ? "bg-brand-purple text-white shadow-sm border border-brand-purple"
                                    : "bg-[#FAF8FF] border border-[#e5ddf0] text-brand-purple hover:bg-brand-purple/5"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Color Selector */}
                        <div className="flex flex-col text-left">
                          <span className="text-[10px] font-extrabold text-brand-purple/50 uppercase tracking-wider mb-2">
                            Select Color:{" "}
                            <span className="text-brand-purple/80 font-bold capitalize">
                              {getColorName(selectedColor)}
                            </span>
                          </span>
                          <div className="flex flex-wrap gap-2.5 max-w-full">
                            {product.variants.colors.map((color, index) => {
                              const isSelected = selectedColor === color;
                              return (
                                <button
                                  key={`${color}-${index}`}
                                  type="button"
                                  onClick={() => setSelectedColor(color)}
                                  className={`w-8 h-8 shrink-0 rounded-full border transition-all duration-300 relative flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 ${
                                    isSelected
                                      ? "border-brand-purple ring-2 ring-brand-purple/20 scale-105"
                                      : "border-black/10"
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title={getColorName(color)}
                                >
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Single Action Row: Quantity + Add to Cart + Buy Now + Wishlist */}
              <div className="flex items-center gap-2.5 sm:gap-3 mt-4">
                {/* Quantity Increment/Decrement Stepper */}
                <div className="flex items-center h-12 rounded-xl border border-[#E5DDF0] bg-[#FAF8FF] px-1.5 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange("dec")}
                    disabled={!inStock || quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-purple hover:bg-brand-purple/10 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} className="stroke-[2.5]" />
                  </button>
                  <span className="w-8 sm:w-9 text-center text-sm font-black text-brand-purple select-none">
                    {!inStock ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange("inc")}
                    disabled={!inStock || quantity >= availableStock}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-purple hover:bg-brand-purple/10 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCartClick}
                  disabled={!inStock || userLacksVet}
                  className={`flex-1 h-12 flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm cursor-pointer active:scale-98 ${
                    userLacksVet
                      ? "bg-[#17345f]/40 text-white cursor-not-allowed shadow-none opacity-90"
                      : inStock
                        ? "bg-white border-2 border-brand-purple text-brand-purple hover:bg-brand-purple hover:text-white hover:shadow-md"
                        : "bg-brand-brown/5 text-brand-brown/30 border border-brand-brown/10 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="w-4.5 h-4.5 shrink-0" />
                  <span className="truncate">
                    {userLacksVet
                      ? "Apply for Verification"
                      : inStock
                        ? "Add to Cart"
                        : "Out of Stock"}
                  </span>
                </button>

                {/* Buy Now Button */}
                <button
                  onClick={handleBuyNowClick}
                  disabled={!inStock || userLacksVet}
                  className={`flex-1 h-12 flex items-center justify-center gap-2 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 shadow-sm cursor-pointer active:scale-98 ${
                    userLacksVet
                      ? "border border-[#17345f1a] bg-gray-100 text-[#122a50]/40 cursor-not-allowed shadow-none"
                      : inStock
                        ? "bg-brand-purple text-white hover:bg-[#3a0038] hover:shadow-md"
                        : "bg-brand-brown/5 text-brand-brown/30 border border-brand-brown/10 cursor-not-allowed"
                  }`}
                >
                  <span className="truncate">Buy Now</span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={handleWishlistToggle}
                  className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border transition-all duration-300 active:scale-95 shadow-sm cursor-pointer ${
                    isWishlisted
                      ? "bg-brand-purple text-brand-peach border-brand-purple hover:bg-[#3a0038]"
                      : "bg-white border-[#e5ddf0] text-brand-purple hover:bg-[#FAF8FF] hover:border-brand-purple/20"
                  }`}
                  title={
                    isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
                  }
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* ── DETAILS ACCORDION/TABBED VIEW ── */}
          <div id="details-tabs" className="text-left">
            {/* Tabs bar */}
            <div className="flex flex-col md:flex-row border-b border-[#f0ebf8] bg-[#FAF8FF] px-6 sm:px-10 py-4 md:py-0 justify-between items-start md:items-center gap-4 md:gap-0">
              {/* Left Side: Product Details Heading */}
              <div className="text-left py-2 md:py-4">
                <h3 className="text-base sm:text-lg font-display font-extrabold text-brand-purple">
                  Product Details
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-brand-brown/50 uppercase tracking-wider mt-0.5">
                  Everything you need to know
                </p>
              </div>

              {/* Right Side: Tab Buttons */}
              <div className="flex flex-nowrap overflow-x-auto scrollbar-none w-full md:w-auto gap-1 md:gap-0">
                {[
                  { id: "description", label: "Description" },
                  { id: "shipping", label: "Shipping" },
                  { id: "returns", label: "Returns" },
                  { id: "reviews", label: `Reviews (${reviewCount})` },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-3 md:py-5 px-4 sm:px-6 font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer outline-none whitespace-nowrap ${
                        isActive
                          ? "border-brand-purple text-brand-purple bg-white md:bg-transparent"
                          : "border-transparent text-brand-brown/60 hover:text-brand-purple hover:bg-[#fcfaff]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6 sm:p-10">
              {/* Description Tab (incorporates description, highlights, specs table, and directions) */}
              {activeTab === "description" && (
                <div className="space-y-6">
                  {richHtmlContent ? (
                    <div
                      className="variant-rich-text text-[#374151]"
                      dangerouslySetInnerHTML={{ __html: richHtmlContent }}
                    />
                  ) : (
                    <div>
                      <h3 className="text-lg font-extrabold text-brand-purple mb-3">
                        Detailed Description
                      </h3>
                      {longDescription ? (
                        <p className="text-sm sm:text-base text-brand-brown/70 leading-relaxed font-medium">
                          {longDescription}
                        </p>
                      ) : (
                        <p className="text-sm sm:text-base text-brand-brown/70 leading-relaxed font-medium">
                          Description information is not available for this
                          product.
                        </p>
                      )}
                      {descriptionBullets.length > 0 && (
                        <DetailRows
                          items={descriptionBullets}
                          emptyLabel="Description"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Shipping Tab */}
              {activeTab === "shipping" && (
                <div className="space-y-6 max-w-2xl">
                  <h3 className="text-lg font-extrabold text-brand-purple flex items-center gap-2">
                    <Truck className="w-5 h-5 text-brand-purple" />
                    <span>Shipping & Delivery</span>
                  </h3>
                  <DetailRows items={shippingDetails} emptyLabel="Shipping" />
                </div>
              )}

              {/* Returns Tab */}
              {activeTab === "returns" && (
                <div className="space-y-6 max-w-2xl">
                  <h3 className="text-lg font-extrabold text-brand-purple flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-purple" />
                    <span>Easy Returns & Refunds</span>
                  </h3>
                  <DetailRows items={returnDetails} emptyLabel="Returns" />
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  {/* Summary Header */}
                  <div className="bg-[#FAF8FF] border border-[#f0ebf8] rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-white px-5 py-3 rounded-2xl border border-brand-purple/10 shadow-sm">
                        <span className="text-3xl font-extrabold text-brand-purple">
                          {reviewCount ? avgRating.toFixed(1) : "0.0"}
                        </span>
                        <p className="text-[10px] font-bold text-brand-brown/60 mt-0.5">
                          out of 5
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4.5 h-4.5 ${
                                star <= Math.round(avgRating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-brand-purple">
                          Based on {reviewCount} customer reviews
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Reviews List */}
                  {reviewsList.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-brand-purple/10 rounded-2xl bg-white">
                      <p className="text-xs font-semibold text-brand-brown/70">
                        No customer reviews yet for this product.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-none">
                      {reviewsList.map((rev) => (
                        <div
                          key={rev.id || rev._id || rev.author}
                          className="border border-gray-100 p-5 rounded-2xl bg-white shadow-xs space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-brand-purple/10 text-brand-purple font-extrabold text-xs flex items-center justify-center">
                                {(rev.author || rev.name || "U").charAt(0)}
                              </div>
                              <div>
                                <h5 className="text-xs font-extrabold text-brand-purple">
                                  {rev.author || rev.name || "Customer"}
                                </h5>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-brand-brown/50">
                              {rev.date || rev.createdAt || "Recent"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= (rev.rating || 5)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-xs font-medium text-brand-brown/75 leading-relaxed">
                            {rev.comment || rev.text || rev.review}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RELATED PRODUCTS SECTION ── */}
        <section className="border-t border-[#f0ebf8] pt-16 text-left">
          <div className="flex items-center justify-between mb-8.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-peach fill-brand-peach" />
              <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-purple">
                Related Premium Products
              </h3>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-brand-purple hover:underline"
            >
              See All Products
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6.5">
            {displayedRelatedProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                isWishlisted={wishlistIds.includes(prod.id)}
                onToggleWishlist={toggleWishlist}
                onAddToCart={(p) => {
                  addToCart(p, 1);
                  toast.success(`${p.name} added to cart! 🛒`);
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
