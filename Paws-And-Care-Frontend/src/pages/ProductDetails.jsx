import React, { useState, useEffect, useMemo } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { reviewApi } from "../api/reviewApi";
import { useAuth } from "../context/AuthContext";
import {
  isVetOnly,
  lacksVetAccess,
  isFamilyProduct,
  getProductUrl,
} from "../utils/productUtils";
import { isSlugLike } from "../utils/htmlUtils";
import { authApi } from "../api/authApi";
import {
  Heart,
  ShoppingCart,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Maximize2,
  Check,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Calendar,
  AlertCircle,
  Package,
  RefreshCcw,
  MapPin,
  Headphones,
  Layers,
  ArrowRight,
} from "lucide-react";
import { productApi } from "../api/productApi";
import { mapPawsProducts } from "../api/catalogAdapter";
import { formatProductRichContent } from "../utils/htmlUtils";
import ProductTabs from "../components/product-details/ProductTabs";

const BUY_NOW_STORAGE_KEY = "paws_care_buy_now_checkout";

const splitSizeAndPackLabel = (label) => {
  const parts = String(label || "")
    .split(/\s*\+\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    size: parts[0] || String(label || "").trim(),
    pack: parts.slice(1).join(" + "),
  };
};

function getRichHtmlContent(product) {
  return formatProductRichContent(null, product);
}

export default function ProductDetails({
  wishlist = [],
  onToggleWishlist,
  onAddToCart,
  products = [],
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Find product by slug
  const matchedProduct = useMemo(() => {
    return products.find((p) => p.slug === slug || p.id === slug);
  }, [products, slug]);

  const [fetchedProduct, setFetchedProduct] = useState(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);

  useEffect(() => {
    if (matchedProduct) {
      setFetchedProduct(null);
      return;
    }
    let active = true;
    setIsFetchingProduct(true);
    productApi
      .getProductById(slug)
      .then((raw) => {
        if (!active) return;
        if (raw) {
          const mapped = mapPawsProducts([raw])[0];
          setFetchedProduct(mapped || raw);
        }
      })
      .catch((err) => {
        console.warn("Direct product fetch failed:", err);
      })
      .finally(() => {
        if (active) setIsFetchingProduct(false);
      });

    return () => {
      active = false;
    };
  }, [matchedProduct, slug]);

  const product = matchedProduct || fetchedProduct;

  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);

  // States
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [zoomMode, setZoomMode] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [selectedOption, setSelectedOption] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addedToCartFeedback, setAddedToCartFeedback] = useState(false);
  const [wishlistFeedback, setWishlistFeedback] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  const [userReviews, setUserReviews] = useState([]);

  // Fetch reviews for active product from API
  useEffect(() => {
    if (!product) return;
    const fetchApiReviews = async () => {
      try {
        const targetId = product.id || product.productId || slug;
        const apiReviews = await reviewApi.getProductReviews(targetId);
        const session = authApi.getSession();
        const loggedInName =
          user?.name ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          session?.customer?.name ||
          "";

        if (Array.isArray(apiReviews)) {
          const normalized = apiReviews.map((r, idx) => {
            let reviewerName =
              r.userName ||
              r.name ||
              r.customerName ||
              r.reviewerName ||
              (typeof r.user === "object"
                ? r.user?.name || r.user?.firstName
                : "") ||
              (typeof r.customer === "object"
                ? r.customer?.name || r.customer?.firstName
                : "") ||
              "";

            if (!reviewerName || reviewerName === "Verified Customer") {
              if (loggedInName) {
                reviewerName = loggedInName;
              } else {
                reviewerName = "Verified Customer";
              }
            }

            return {
              id: r.id || r._id || idx + 1,
              name: reviewerName,
              time: r.createdAt
                ? new Date(r.createdAt).toLocaleDateString()
                : "Recently",
              rating: Number(r.rating || r.stars) || 0,
              description: r.comment || r.description || r.reviewText || "",
            };
          });
          setUserReviews(normalized);
        } else {
          setUserReviews([]);
        }
      } catch (err) {
        console.warn("API product reviews fetch error:", err);
        setUserReviews([]);
      }
    };
    fetchApiReviews();
  }, [product, slug, user]);

  const computedRating = useMemo(() => {
    if (userReviews.length > 0) {
      const total = userReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      return (total / userReviews.length).toFixed(1);
    }
    return product?.rating ? Number(product.rating).toFixed(1) : 0;
  }, [userReviews, product]);

  const computedReviewCount = useMemo(() => {
    if (userReviews.length > 0) return userReviews.length;
    return product?.reviewCount || 0;
  }, [userReviews, product]);

  const [searchParams] = useSearchParams();

  // Determine if product is a family product with multiple formulations
  const isFamily = useMemo(() => isFamilyProduct(product), [product]);
  const familyVariants = useMemo(() => {
    return isFamily && Array.isArray(product?.familyVariants)
      ? product.familyVariants
      : [];
  }, [isFamily, product]);

  const [activeFamilyId, setActiveFamilyId] = useState(null);

  // Sync active family variant with URL search params or fallback to first family variant
  useEffect(() => {
    if (isFamily && familyVariants.length > 0) {
      const requestedFv =
        searchParams.get("familyVariantId") ||
        searchParams.get("familyVariant");
      const requestedOpt =
        searchParams.get("option") || searchParams.get("variant");

      let matchedFv = null;
      if (requestedFv) {
        matchedFv = familyVariants.find(
          (fv) =>
            String(fv.id) === String(requestedFv) ||
            String(fv.slug) === String(requestedFv) ||
            String(fv.displayName || fv.name).toLowerCase() ===
              String(requestedFv).toLowerCase(),
        );
      }
      if (!matchedFv && requestedOpt) {
        matchedFv = familyVariants.find(
          (fv) =>
            String(fv.displayName || fv.name).toLowerCase() ===
              String(requestedOpt).toLowerCase() ||
            (Array.isArray(fv.skus) &&
              fv.skus.some(
                (s) =>
                  String(s.id) === String(requestedOpt) ||
                  String(s.sku) === String(requestedOpt) ||
                  String(
                    s.name || s.label || s.size || s.packLabel,
                  ).toLowerCase() === String(requestedOpt).toLowerCase(),
              )),
        );
      }
      setActiveFamilyId(matchedFv ? matchedFv.id : familyVariants[0]?.id);
    }
  }, [isFamily, familyVariants, searchParams]);

  const activeFamilyVariant = useMemo(() => {
    if (!isFamily || !familyVariants.length) return null;
    return (
      familyVariants.find((fv) => fv.id === activeFamilyId) || familyVariants[0]
    );
  }, [isFamily, familyVariants, activeFamilyId]);

  // Extract the pack options / SKUs inside the active formulation
  const familyOptions = useMemo(() => {
    if (!isFamily || !activeFamilyVariant) return [];
    if (
      Array.isArray(activeFamilyVariant.skus) &&
      activeFamilyVariant.skus.length > 0
    ) {
      return activeFamilyVariant.skus.map((s, sIdx) => {
        const rawName =
          s.name ||
          s.label ||
          s.packLabel ||
          s.size ||
          s.weight ||
          s.optionName;
        const fallbackName =
          activeFamilyVariant.displayName ||
          activeFamilyVariant.name ||
          `Option ${sIdx + 1}`;
        const displayName =
          rawName && !/^1\s*pack$/i.test(String(rawName).trim())
            ? rawName
            : fallbackName;
        return {
          id: s.id || `${activeFamilyVariant.id}-${sIdx}`,
          sku: s.sku || product?.sku,
          label: displayName,
          name: displayName,
          price: Number(
            s.pricing?.finalPrice ??
              s.pricing?.salePrice ??
              s.salePrice ??
              s.price ??
              product?.price ??
              29.99,
          ),
          regularPrice: Number(
            s.pricing?.price ??
              s.regularPrice ??
              s.oldPrice ??
              (s.price ? s.price * 1.35 : (product?.price || 29.99) * 1.35),
          ),
          stock: s.inventory?.stockQuantity ?? s.stock ?? product?.stock ?? 50,
          image: s.image || activeFamilyVariant.image || product?.image,
        };
      });
    }
    return [];
  }, [isFamily, activeFamilyVariant, product]);

  const activeOptions = useMemo(() => {
    if (isFamily && familyOptions.length > 0) {
      return familyOptions;
    }
    return (product?.options || product?.capacities || []).map((opt, idx) => {
      const vObj = (product?.optionVariants || []).find(
        (v) =>
          v.label === opt ||
          v.name === opt ||
          String(v.id) === String(opt) ||
          v.pack === opt,
      );
      return {
        id: vObj?.id || `opt-${idx}`,
        sku: vObj?.sku || product?.sku,
        label: opt,
        name: opt,
        price: Number(
          vObj?.pricing?.finalPrice ??
            vObj?.salePrice ??
            vObj?.price ??
            product?.price ??
            29.99,
        ),
        regularPrice: Number(
          vObj?.pricing?.price ??
            vObj?.regularPrice ??
            vObj?.oldPrice ??
            product?.originalPrice ??
            (product?.price || 29.99) * 1.35,
        ),
        stock:
          vObj?.inventory?.stockQuantity ?? vObj?.stock ?? product?.stock ?? 50,
        image: vObj?.image || product?.image,
      };
    });
  }, [isFamily, familyOptions, product]);

  const sizePackOptions = useMemo(
    () => activeOptions.map((option) => ({ ...option, ...splitSizeAndPackLabel(option.label) })),
    [activeOptions],
  );
  const hasSeparateSizeAndPack = sizePackOptions.some((option) => option.pack);
  const selectedSizePack = splitSizeAndPackLabel(selectedOption);
  const sizeChoices = [...new Set(sizePackOptions.map((option) => option.size).filter(Boolean))];
  const packChoices = sizePackOptions.filter(
    (option, index, options) =>
      option.pack &&
      (!selectedSizePack.size || option.size === selectedSizePack.size) &&
      options.findIndex(
        (candidate) => candidate.size === option.size && candidate.pack === option.pack,
      ) === index,
  );

  const chooseSize = (size) => {
    const matchingOption = sizePackOptions.find(
      (option) => option.size === size && (!selectedSizePack.pack || option.pack === selectedSizePack.pack),
    ) || sizePackOptions.find((option) => option.size === size);
    if (matchingOption) {
      setSelectedOption(matchingOption.label);
      setQuantity(1);
    }
  };

  const choosePack = (pack) => {
    const matchingOption = sizePackOptions.find(
      (option) => option.pack === pack && (!selectedSizePack.size || option.size === selectedSizePack.size),
    );
    if (matchingOption) {
      setSelectedOption(matchingOption.label);
      setQuantity(1);
    }
  };

  // Scroll to top on load/slug change and initialize selected option
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (product) {
      setActiveImgIndex(0);
      setQuantity(1);
      const requestedOption =
        searchParams.get("option") || searchParams.get("variant");
      if (activeOptions.length > 0) {
        if (
          requestedOption &&
          activeOptions.some(
            (o) =>
              String(o.label).toLowerCase() ===
              String(requestedOption).toLowerCase(),
          )
        ) {
          const found = activeOptions.find(
            (o) =>
              String(o.label).toLowerCase() ===
              String(requestedOption).toLowerCase(),
          );
          setSelectedOption(found.label);
        } else if (!activeOptions.some((o) => o.label === selectedOption)) {
          setSelectedOption(activeOptions[0].label);
        }
      } else {
        setSelectedOption("");
      }
    }
  }, [slug, product, activeOptions, searchParams]);

  // Related products (4 products from same category, excluding active one)
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, products]);

  // Delivery date estimate (3 days from now)
  const deliveryEstimate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Find active variant if product has optionVariants or familyVariants
  const activeVariant = useMemo(() => {
    if (!product) return null;
    if (isFamily && familyOptions.length > 0) {
      const match = familyOptions.find(
        (fo) =>
          fo.label === selectedOption ||
          fo.name === selectedOption ||
          String(fo.id) === String(selectedOption),
      );
      if (match) return match;
      return familyOptions[0] || null;
    }
    if (!selectedOption) return null;
    if (product.optionVariants) {
      const match = product.optionVariants.find(
        (v) =>
          v.label === selectedOption ||
          v.name === selectedOption ||
          String(v.id) === String(selectedOption) ||
          v.pack === selectedOption,
      );
      if (match) return match;
    }
    if (product.familyVariants) {
      const match = product.familyVariants.find(
        (v) =>
          v.displayName === selectedOption ||
          v.name === selectedOption ||
          String(v.id) === String(selectedOption) ||
          v.label === selectedOption,
      );
      if (match) return match;
    }
    return null;
  }, [product, isFamily, familyOptions, selectedOption]);

  const activeVariantImage = useMemo(() => {
    if (isFamily && activeFamilyVariant) {
      const fvImg =
        activeFamilyVariant.image ||
        activeFamilyVariant.imageUrl ||
        activeFamilyVariant.mainImage;
      if (typeof fvImg === "string" && fvImg.trim()) return fvImg.trim();
    }
    if (!activeVariant) return null;
    if (typeof activeVariant.image === "string" && activeVariant.image.trim())
      return activeVariant.image.trim();
    if (activeVariant.image?.url) return activeVariant.image.url;
    if (activeVariant.image?.src) return activeVariant.image.src;
    if (
      typeof activeVariant.imageUrl === "string" &&
      activeVariant.imageUrl.trim()
    )
      return activeVariant.imageUrl.trim();
    if (
      typeof activeVariant.mainImage === "string" &&
      activeVariant.mainImage.trim()
    )
      return activeVariant.mainImage.trim();
    if (activeVariant.mainImage?.url) return activeVariant.mainImage.url;
    if (
      Array.isArray(activeVariant.images) &&
      activeVariant.images.length > 0
    ) {
      const first = activeVariant.images[0];
      return typeof first === "string" ? first : first?.url || first?.src;
    }
    if (
      typeof activeVariant.thumbnail === "string" &&
      activeVariant.thumbnail.trim()
    )
      return activeVariant.thumbnail.trim();
    if (typeof activeVariant.photo === "string" && activeVariant.photo.trim())
      return activeVariant.photo.trim();
    return null;
  }, [isFamily, activeFamilyVariant, activeVariant]);

  // Combined gallery isolating active variant images when selected
  const computedGallery = useMemo(() => {
    if (!product) return [];

    // 1. If in a family product, isolate the active family variant imagery
    if (isFamily && activeFamilyVariant) {
      const fvImages = [];
      const fvMain =
        activeFamilyVariant.image ||
        activeFamilyVariant.imageUrl ||
        activeFamilyVariant.mainImage;
      if (fvMain && !fvImages.includes(fvMain)) fvImages.push(fvMain);
      if (Array.isArray(activeFamilyVariant.gallery)) {
        activeFamilyVariant.gallery.forEach((g) => {
          const u = typeof g === "string" ? g.trim() : g?.url || g?.src;
          if (u && !fvImages.includes(u)) fvImages.push(u);
        });
      }
      if (Array.isArray(activeFamilyVariant.images)) {
        activeFamilyVariant.images.forEach((g) => {
          const u = typeof g === "string" ? g.trim() : g?.url || g?.src;
          if (u && !fvImages.includes(u)) fvImages.push(u);
        });
      }
      if (fvImages.length > 0) return fvImages;
    }

    // 2. If active variant has specific imagery, isolate and display strictly that variant's imagery
    if (activeVariant) {
      const activeVarImages = [];
      const vImg = activeVariantImage;
      if (vImg && !activeVarImages.includes(vImg)) activeVarImages.push(vImg);

      if (Array.isArray(activeVariant.gallery)) {
        activeVariant.gallery.forEach((g) => {
          const u = typeof g === "string" ? g.trim() : g?.url || g?.src;
          if (u && !activeVarImages.includes(u)) activeVarImages.push(u);
        });
      }
      if (Array.isArray(activeVariant.images)) {
        activeVariant.images.forEach((g) => {
          const u = typeof g === "string" ? g.trim() : g?.url || g?.src;
          if (u && !activeVarImages.includes(u)) activeVarImages.push(u);
        });
      }

      if (activeVarImages.length > 0) {
        return activeVarImages;
      }
    }

    // 3. Base product imagery fallback
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
    const normGal = [...rawG, ...rawI]
      .map((img) => {
        if (!img) return null;
        if (typeof img === "string" && img.trim()) return img.trim();
        return img.url || img.src || null;
      })
      .filter(Boolean);

    const merged = Array.from(
      new Set([...primaryCandidates, ...normGal]),
    ).filter(Boolean);
    return merged.length > 0 ? merged : [product.image || "/vite.svg"];
  }, [
    product,
    isFamily,
    activeFamilyVariant,
    activeVariant,
    activeVariantImage,
  ]);

  // Reset active image index to 0 whenever the selected option or variant changes
  useEffect(() => {
    setActiveImgIndex(0);
  }, [selectedOption, activeVariant?.id]);

  const currentMainImage = useMemo(() => {
    if (computedGallery && computedGallery.length > 0) {
      if (computedGallery[activeImgIndex]) {
        return computedGallery[activeImgIndex];
      }
      return computedGallery[0];
    }
    return activeVariantImage || product?.image || "/vite.svg";
  }, [computedGallery, activeImgIndex, activeVariantImage, product]);

  const displayPrice = useMemo(() => {
    if (activeVariant) {
      return (
        activeVariant.pricing?.finalPrice ??
        activeVariant.salePrice ??
        activeVariant.price
      );
    }
    return product?.salePrice ?? product?.price ?? 0;
  }, [product, activeVariant]);

  const displayOriginalPrice = useMemo(() => {
    if (activeVariant) {
      return activeVariant.pricing?.price ?? activeVariant.regularPrice ?? null;
    }
    return product?.originalPrice ?? null;
  }, [product, activeVariant]);

  const displayStock = useMemo(() => {
    if (activeVariant) {
      return activeVariant.inventory?.stockQuantity ?? activeVariant.stock ?? 0;
    }
    return product?.stock ?? 0;
  }, [product, activeVariant]);

  const displayInStock = useMemo(() => {
    if (activeVariant) {
      return (
        activeVariant.inventory?.isInStock ??
        activeVariant.isAvailable ??
        displayStock > 0
      );
    }
    return product?.inStock ?? displayStock > 0;
  }, [product, activeVariant, displayStock]);

  const savings = useMemo(() => {
    if (!displayOriginalPrice || displayOriginalPrice <= displayPrice)
      return null;
    return Math.round(
      ((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100,
    );
  }, [displayPrice, displayOriginalPrice]);

  const shortBlurb = useMemo(() => {
    const raw =
      isFamily && activeFamilyVariant
        ? activeFamilyVariant.description ||
          activeFamilyVariant.shortDescription ||
          activeFamilyVariant.details ||
          activeVariant?.description ||
          ""
        : activeVariant?.description ||
          product?.shortDescription ||
          product?.productDetails?.overview ||
          product?.productDetails?.description ||
          product?.description ||
          "";
    if (!raw || isSlugLike(raw)) return "";
    return raw.replace(/<[^>]*>/g, "").trim();
  }, [isFamily, activeFamilyVariant, activeVariant, product]);

  // Loading state while resolving product
  if (!product && isFetchingProduct) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-bg px-4 py-16 text-center">
        <div className="size-12 rounded-full border-4 border-brand-coral border-t-transparent animate-spin mb-4" />
        <h2 className="font-heading font-black text-xl text-brand-text">
          Loading Product Details...
        </h2>
      </div>
    );
  }

  // Redirection/fallback if product is not found
  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-brand-bg px-4 py-16 text-center">
        <AlertCircle size={48} className="text-brand-coral mb-4" />
        <h1 className="font-heading font-black text-2xl text-brand-text mb-2">
          Product Not Found
        </h1>
        <p className="font-sans text-brand-muted text-sm max-w-md mb-6">
          The product you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full px-6 py-2.5 font-heading font-bold text-sm transition-colors shadow-md"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>
    );
  }

  // Cart helper
  const handleAddToCart = () => {
    if (!displayInStock) return;
    const fvName =
      activeFamilyVariant?.displayName || activeFamilyVariant?.name;
    const isDifferent =
      isFamily &&
      fvName &&
      selectedOption &&
      !selectedOption.toLowerCase().includes(fvName.toLowerCase()) &&
      selectedOption.toLowerCase() !== fvName.toLowerCase();
    const finalVariantLabel =
      isFamily && fvName
        ? isDifferent
          ? `${fvName} - ${selectedOption}`
          : selectedOption || fvName
        : selectedOption;
    const finalTitle = finalVariantLabel
      ? `${product.name || product.title} (${finalVariantLabel})`
      : product.name || product.title;

    onAddToCart(
      {
        ...product,
        id: `${product.id}-${activeVariant?.id || selectedOption || "std"}`,
        productId: product.productId || product.id,
        variantId: activeVariant?.id || null,
        variantLabel: finalVariantLabel,
        selectedOption: finalVariantLabel,
        name: finalTitle,
        title: finalTitle,
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        stock: displayStock,
        inStock: displayInStock,
        image: currentMainImage,
      },
      quantity,
    );
    setAddedToCartFeedback(true);
    setTimeout(() => setAddedToCartFeedback(false), 2000);
  };

  const handleBuyNow = () => {
    if (!displayInStock) return;
    const fvName =
      activeFamilyVariant?.displayName || activeFamilyVariant?.name;
    const isDifferent =
      isFamily &&
      fvName &&
      selectedOption &&
      !selectedOption.toLowerCase().includes(fvName.toLowerCase()) &&
      selectedOption.toLowerCase() !== fvName.toLowerCase();
    const finalVariantLabel =
      isFamily && fvName
        ? isDifferent
          ? `${fvName} - ${selectedOption}`
          : selectedOption || fvName
        : selectedOption;
    const finalTitle = finalVariantLabel
      ? `${product.name || product.title} (${finalVariantLabel})`
      : product.name || product.title;

    window.sessionStorage.setItem(
      BUY_NOW_STORAGE_KEY,
      JSON.stringify({
        id: `${product.id}-${activeVariant?.id || selectedOption || "std"}`,
        productId: product.productId || product.id,
        variantId: activeVariant?.id || null,
        variantLabel: finalVariantLabel,
        option: finalVariantLabel,
        selectedOption: finalVariantLabel,
        name: finalTitle,
        title: finalTitle,
        quantity,
        price: displayPrice,
        originalPrice: displayOriginalPrice,
        image: currentMainImage,
        selectedSize: selectedOption
          ? { label: finalVariantLabel, price: displayPrice }
          : null,
      }),
    );
    navigate("/checkout?buyNow=1");
  };

  // Wishlist helper
  const handleWishlistToggle = () => {
    onToggleWishlist(product.id);
    setWishlistFeedback(true);
    setTimeout(() => setWishlistFeedback(false), 1500);
  };

  // Share helper
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  // Image zoom handler
  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPosition({ x, y });
  };

  const isWishlisted = wishlist.includes(product?.id);

  const shippingText =
    product?.shipping ||
    "Free standard shipping is available on every order. Most orders are processed within 1 business day and typically arrive within 3-5 business days after dispatch. You will receive tracking details by email once your order ships.";

  const returnsText =
    product?.returns ||
    "We offer a 30-day hassle-free return or exchange window for eligible items. Products should be unused, in their original packaging, and accompanied by order details. Contact our support team to start a return or swap.";

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-6">
        {/* ── Breadcrumbs ─────────────────────────────────────────────────── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-brand-muted mb-6 flex-wrap"
        >
          <Link to="/" className="hover:text-brand-teal transition-colors">
            Home
          </Link>
          <ChevronRight size={10} className="text-brand-border" />
          <Link to="/shop" className="hover:text-brand-teal transition-colors">
            Shop
          </Link>
          <ChevronRight size={10} className="text-brand-border" />
          <span className="text-brand-teal font-semibold">
            {product.category}
          </span>
          <ChevronRight size={10} className="text-brand-border" />
          <span
            className="text-brand-text truncate font-bold max-w-[200px]"
            title={product.name}
          >
            {product.name}
          </span>
        </nav>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 bg-brand-surface rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 lg:p-10 border border-brand-border/60 shadow-sm mb-6 sm:mb-12 overflow-hidden">
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Main Image Viewer */}
            <div
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-brand-bg border border-brand-border/40 cursor-zoom-in"
              onMouseEnter={() => setZoomMode(true)}
              onMouseLeave={() => setZoomMode(false)}
              onMouseMove={handleMouseMove}
            >
              <img
                src={currentMainImage}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-100 ${
                  zoomMode ? "scale-[2.2] origin-center" : "scale-100"
                }`}
                style={
                  zoomMode
                    ? {
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      }
                    : undefined
                }
                draggable={false}
              />

              {/* Badges on main image */}
              {product.badge && (
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  <span className="bg-brand-coral text-white font-heading font-black text-xs px-3 py-1 rounded-full shadow-sm tracking-wide uppercase">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Wishlist and Maximize float overlay controls */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110 bg-white ${
                    isWishlisted
                      ? "text-brand-coral"
                      : "text-brand-muted hover:text-brand-coral"
                  }`}
                  aria-label="Wishlist toggle"
                >
                  <Heart
                    size={18}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode(!zoomMode)}
                  className="w-10 h-10 rounded-full bg-white text-brand-muted hover:text-brand-teal flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                  aria-label="Zoom image"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Prev/Next arrows overlay */}
              {computedGallery && computedGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImgIndex((prev) =>
                        prev === 0 ? computedGallery.length - 1 : prev - 1,
                      )
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-brand-text flex items-center justify-center shadow-md transition-transform active:scale-90"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImgIndex((prev) =>
                        prev === computedGallery.length - 1 ? 0 : prev + 1,
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-brand-text flex items-center justify-center shadow-md transition-transform active:scale-90"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery (Bottom Carousel) */}
            {computedGallery && computedGallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-thin">
                {computedGallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`w-20 aspect-square rounded-xl overflow-hidden border-2 bg-brand-bg transition-all shrink-0 cursor-pointer ${
                      activeImgIndex === idx
                        ? "border-brand-teal scale-[1.02] shadow-sm"
                        : "border-transparent opacity-75 hover:opacity-100 hover:border-brand-border"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Details (lg: 6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <div>
              {/* Category & Brand info */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="font-heading font-extrabold text-xs text-brand-teal uppercase tracking-wider">
                  {product.category} · {product.brand}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-brand-text leading-tight mt-2">
                {product.name}
              </h1>

              {/* Rating Row */}
              <div className="flex items-center gap-2 mt-2.5">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < Math.round(Number(computedRating) || 0)
                          ? "fill-brand-golden text-brand-golden"
                          : "text-brand-border"
                      }
                    />
                  ))}
                </div>
                <span className="font-heading font-extrabold text-xs text-brand-text">
                  {Number(computedRating) > 0 ? computedRating : "No rating"}
                </span>
                <span className="font-sans text-xs text-brand-muted">
                  ({computedReviewCount}{" "}
                  {computedReviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>

            <hr className="border-brand-border/40" />

            {/* Pricing Section */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-heading font-black text-3xl text-brand-coral">
                ${displayPrice.toFixed(2)}
              </span>
              {displayOriginalPrice && (
                <>
                  <span className="font-sans text-base text-brand-muted line-through">
                    ${displayOriginalPrice.toFixed(2)}
                  </span>
                  <span className="font-heading font-black text-xs text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-full">
                    Save {savings}%
                  </span>
                </>
              )}
            </div>

            {requiresVet && (
              <div className="mt-2 mb-1 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal px-3.5 py-1.5 text-xs font-extrabold uppercase text-white shadow-xs">
                  <ShieldCheck size={14} className="text-amber-300" />
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

            {/* Short benefit blurb */}
            {shortBlurb && (
              <p className="font-sans text-sm text-brand-muted leading-relaxed">
                {shortBlurb}
              </p>
            )}

            {/* Product Configuration Options (Size / Pack Options Selector) */}
            {activeOptions && activeOptions.length > 0 && !hasSeparateSizeAndPack && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-heading font-black text-xs text-brand-text uppercase tracking-wide">
                    {product.optionLabel ||
                      (isFamily ? "Select Pack Size" : "Select Size / Option")}
                    :
                  </label>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {activeOptions.map((opt) => {
                    const optLabel = opt.label || opt.name;
                    const optPrice = opt.price;
                    const isSelected = selectedOption === optLabel;

                    return (
                      <button
                        key={opt.id || optLabel}
                        type="button"
                        onClick={() => {
                          setSelectedOption(optLabel);
                          setQuantity(1);
                        }}
                        className={`inline-flex flex-col items-center justify-center min-w-[95px] px-4 py-2.5 rounded-xl text-xs font-heading font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-brand-teal text-white border-brand-teal shadow-xs ring-2 ring-brand-teal/30"
                            : "bg-white text-brand-muted border-brand-border hover:border-brand-teal/50 hover:text-brand-teal"
                        }`}
                      >
                        <span className="font-heading font-black text-sm">
                          {optLabel}
                        </span>
                        {optPrice && (
                          <span
                            className={`text-[11px] font-bold mt-0.5 ${isSelected ? "text-white/90" : "text-brand-coral"}`}
                          >
                            ${Number(optPrice).toFixed(2)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedOption && (
                  <p className="text-xs text-brand-muted font-sans mt-1">
                    Selected:{" "}
                    <strong className="text-brand-teal">
                      {selectedOption}
                    </strong>
                  </p>
                )}
              </div>
            )}

            {hasSeparateSizeAndPack && (
              <div className="space-y-4">
                <div>
                  <label className="font-heading font-black text-xs text-brand-text uppercase tracking-wide">
                    Size:
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {sizeChoices.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => chooseSize(size)}
                        className={`rounded-xl border px-4 py-2.5 text-xs font-heading font-black transition-all ${
                          selectedSizePack.size === size
                            ? "border-brand-teal bg-brand-teal text-white shadow-xs ring-2 ring-brand-teal/30"
                            : "border-brand-border bg-white text-brand-muted hover:border-brand-teal/50 hover:text-brand-teal"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-heading font-black text-xs text-brand-text uppercase tracking-wide">
                    Dose / Pack:
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {packChoices.map((option) => (
                      <button
                        key={`${option.size}-${option.pack}`}
                        type="button"
                        onClick={() => choosePack(option.pack)}
                        className={`inline-flex min-w-[95px] flex-col items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-heading font-bold transition-all ${
                          selectedSizePack.pack === option.pack
                            ? "border-brand-teal bg-brand-teal text-white shadow-xs ring-2 ring-brand-teal/30"
                            : "border-brand-border bg-white text-brand-muted hover:border-brand-teal/50 hover:text-brand-teal"
                        }`}
                      >
                        <span className="font-heading font-black text-sm">{option.pack}</span>
                        {option.price ? (
                          <span className={`mt-0.5 text-[11px] font-bold ${selectedSizePack.pack === option.pack ? "text-white/90" : "text-brand-coral"}`}>
                            ${Number(option.price).toFixed(2)}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {/* {selectedOption && (
                  <p className="text-xs text-brand-muted font-sans">
                    Selected: <strong className="text-brand-teal">{selectedSizePack.size} + {selectedSizePack.pack}</strong>
                  </p>
                )} */}
              </div>
            )}

            {/* Qty Selector, Add/Buy/Wishlist & Share Actions */}
            <div className="flex flex-col gap-4 mt-2">
              {/* Row 1: Quantity selector on the left, Heart icon on the right */}
              <div className="flex items-start justify-between gap-3 w-full">
                {/* Quantity selector */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center border border-brand-border/60 bg-white rounded-2xl overflow-hidden justify-between w-32 h-12 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || !displayInStock}
                      className="w-10 h-full flex items-center justify-center text-brand-muted hover:text-brand-coral hover:bg-brand-bg transition-colors disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <span className="text-lg font-bold">-</span>
                    </button>
                    <span className="font-heading font-black text-sm text-brand-text select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) => Math.min(displayStock || 99, q + 1))
                      }
                      disabled={
                        quantity >= (displayStock || 1) || !displayInStock
                      }
                      className="w-10 h-full flex items-center justify-center text-brand-muted hover:text-brand-teal hover:bg-brand-bg transition-colors disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <span className="text-lg font-bold">+</span>
                    </button>
                  </div>
                </div>

                {/* Wishlist button on the right */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    aria-label={
                      isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                    }
                    className={`h-12 w-12 rounded-2xl border flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0 shadow-xs ${
                      isWishlisted
                        ? "bg-brand-coral/10 border-brand-coral text-brand-coral hover:bg-brand-coral/20"
                        : "bg-white border-brand-border/60 text-brand-muted hover:border-brand-coral hover:text-brand-coral hover:bg-brand-coral/5"
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={isWishlisted ? "currentColor" : "none"}
                      className="transition-all duration-200"
                    />
                  </button>
                </div>
              </div>

              {/* Row 2: Add to Cart | Buy Now */}
              <div className="flex flex-row gap-2.5 sm:gap-3 items-center w-full pt-1">
                {/* Add to Cart button */}
                <button
                  type="button"
                  onClick={
                    userLacksVet
                      ? () =>
                          navigate(
                            user ? "/profile?tab=vet-verification" : "/login",
                          )
                      : handleAddToCart
                  }
                  disabled={!displayInStock || userLacksVet}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 h-11 sm:h-12 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-heading font-black transition-all duration-200 shadow-sm whitespace-nowrap ${
                    userLacksVet
                      ? "bg-brand-teal/40 text-white cursor-not-allowed shadow-none border-none opacity-90"
                      : addedToCartFeedback
                        ? "bg-brand-teal text-white scale-98 shadow-inner"
                        : displayInStock
                          ? "bg-brand-coral text-white hover:bg-brand-coral-dark hover:shadow-md active:scale-95 cursor-pointer"
                          : "bg-brand-border text-brand-muted cursor-not-allowed"
                  }`}
                >
                  {!userLacksVet &&
                    (addedToCartFeedback ? (
                      <Check size={16} />
                    ) : (
                      <ShoppingCart size={16} />
                    ))}
                  <span>
                    {userLacksVet
                      ? "Apply Verification"
                      : addedToCartFeedback
                        ? "Added!"
                        : "Add to Cart"}
                  </span>
                </button>

                {/* Buy Now button */}
                <button
                  type="button"
                  onClick={
                    userLacksVet
                      ? () =>
                          navigate(
                            user ? "/profile?tab=vet-verification" : "/login",
                          )
                      : handleBuyNow
                  }
                  disabled={!displayInStock || userLacksVet}
                  className={`flex-1 inline-flex items-center justify-center h-11 sm:h-12 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-heading font-black transition-all duration-200 border-2 whitespace-nowrap ${
                    userLacksVet
                      ? "border border-[#17345f1a] bg-gray-100 text-[#122a50]/40 cursor-not-allowed shadow-none"
                      : displayInStock
                        ? "bg-brand-surface text-brand-teal border-brand-teal hover:bg-brand-teal/5 hover:shadow-sm active:scale-95 cursor-pointer"
                        : "bg-brand-bg text-brand-muted border-brand-border cursor-not-allowed"
                  }`}
                >
                  <span>Buy Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Tabs (Description with rich content, Shipping, Returns, Reviews) ── */}
        <section className="bg-brand-surface rounded-2xl sm:rounded-[2rem] border border-brand-border/60 p-4 sm:p-8 lg:p-10 mb-8 sm:mb-12 shadow-xs overflow-hidden">
          <ProductTabs
            product={product}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            activeFamilyVariant={activeFamilyVariant}
            activeFamilyId={activeFamilyId}
          />
        </section>

        {/* ── Related Products ────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-brand-border/40 pb-4">
              <h2 className="font-heading font-black text-xl sm:text-2xl text-brand-text text-left">
                Related Essentials
              </h2>
              <Link
                to="/shop"
                className="font-heading font-bold text-xs sm:text-sm text-brand-teal hover:text-brand-coral transition-colors"
              >
                View All Essentials →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => {
                const isRelatedWishlisted = wishlist.includes(p.id);
                const relatedUrl = getProductUrl(p);
                return (
                  <article
                    key={p.id}
                    className="group bg-brand-surface border border-brand-border/50 rounded-2xl p-4 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col relative justify-between min-h-[360px] text-left"
                  >
                    <div>
                      {/* Related Image */}
                      <Link
                        to={relatedUrl}
                        className="block relative aspect-square w-full rounded-xl overflow-hidden bg-brand-bg border border-brand-border/30 mb-3.5"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {p.badge && (
                          <span className="absolute top-2.5 left-2.5 bg-brand-coral text-white font-heading font-black text-[9px] px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </Link>

                      {/* Related Info */}
                      <span className="font-heading font-bold text-[9px] uppercase tracking-wider text-brand-teal">
                        {p.category}
                      </span>
                      <h3 className="font-heading font-black text-sm text-brand-text leading-snug group-hover:text-brand-coral transition-colors line-clamp-1 mt-0.5">
                        <Link to={relatedUrl}>{p.name}</Link>
                      </h3>
                      <p className="font-sans text-[11px] text-brand-muted line-clamp-2 mt-1 leading-relaxed">
                        {p.shortDescription}
                      </p>
                    </div>

                    {/* Related Action & Price */}
                    <div className="mt-4 pt-3 border-t border-brand-border/40 flex items-center justify-between">
                      <span className="font-heading font-black text-base text-brand-coral">
                        ${p.price.toFixed(2)}
                      </span>
                      <Link
                        to={relatedUrl}
                        className="bg-brand-teal hover:bg-brand-deep-teal text-white rounded-full p-2 transition-colors cursor-pointer"
                        aria-label="View Product Details"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
