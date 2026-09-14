import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Check,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useNotification } from "../../utils/NotificationContext";
import { useAuth } from "../../utils/AuthContext";
import { isVetOnly, lacksVetAccess, isFamilyProduct } from "../../utils/productUtils";
import { isSlugLike } from "../../utils/htmlUtils";

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

export default function ProductInfo({
  product,
  categoryLabel,
  discountPct,
  displaySalePrice,
  displayOriginalPrice,
  savings,
  sizes,
  activeSizeIndex,
  setActiveSizeIndex,
  quantity,
  setQuantity,
  added,
  handleAddToCart,
  handleBuyNow,
  wished,
  setWished,
  saleAmt,
  avgRating,
  totalReviews,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requiresVet = isVetOnly(product);
  const userLacksVet = lacksVetAccess(product, user);
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const { showNotification } = useNotification();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showNotification("Product link copied to clipboard!", "success");
    } catch (err) {
      showNotification("Failed to copy link.", "error");
    }
  };

  const isFamily = isFamilyProduct(product);
  const familyVariants = Array.isArray(product?.familyVariants) ? product.familyVariants : [];
  const selectedSizeObj = sizes?.[activeSizeIndex];
  const selectedSizeLabel = selectedSizeObj?.label ?? "";

  const availableStock = useMemo(() => {
    if (selectedSizeObj && selectedSizeObj.stock !== undefined) {
      return Number(selectedSizeObj.stock);
    }
    return product?.stock !== undefined ? Number(product.stock) : 50;
  }, [selectedSizeObj, product]);
  const isOutOfStock = availableStock <= 0 || product?.stock === 0;

  const activeFamilyVariant = useMemo(() => {
    if (!familyVariants.length) return null;
    if (selectedSizeObj?.familyVariant) return selectedSizeObj.familyVariant;
    if (selectedSizeObj?.familyVariantId) {
      const byFvId = familyVariants.find(
        (fv) => String(fv.id || fv._id) === String(selectedSizeObj.familyVariantId)
      );
      if (byFvId) return byFvId;
    }
    if (selectedSizeObj?.color) {
      const byColor = familyVariants.find(
        (fv) => (fv.packColor || fv.color)?.toLowerCase() === selectedSizeObj.color.toLowerCase()
      );
      if (byColor) return byColor;
    }
    if (selectedSizeObj?.weightRange) {
      const byWeight = familyVariants.find(
        (fv) => fv.weightRange?.toLowerCase() === selectedSizeObj.weightRange.toLowerCase()
      );
      if (byWeight) return byWeight;
    }
    if (selectedSizeLabel) {
      const match = familyVariants.find(
        (fv) =>
          fv.id === selectedSizeObj?.familyVariantId ||
          fv.id === selectedSizeObj?.id ||
          fv.id === selectedSizeLabel ||
          fv.slug === selectedSizeLabel ||
          fv.name === selectedSizeLabel ||
          fv.displayName === selectedSizeLabel ||
          (fv.name &&
            String(selectedSizeLabel)
              .toLowerCase()
              .includes(String(fv.name).toLowerCase())) ||
          (fv.label &&
            String(selectedSizeLabel)
              .toLowerCase()
              .includes(String(fv.label).toLowerCase())),
      );
      if (match) return match;
    }
    return familyVariants[0] || null;
  }, [familyVariants, selectedSizeObj, selectedSizeLabel]);

  const cleanFvName = useMemo(() => {
    if (!activeFamilyVariant) return "";
    const activeFvName =
      activeFamilyVariant.displayName ||
      activeFamilyVariant.name ||
      activeFamilyVariant.label ||
      selectedSizeObj?.variantName ||
      "";
    const pTitle = (product?.name || product?.title || "").trim();
    let clean = activeFvName;
    if (pTitle) {
      clean = clean
        .replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "")
        .replace(new RegExp(`\\(${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "gi"), "")
        .trim();
    }
    return clean || activeFvName;
  }, [activeFamilyVariant, selectedSizeObj, product]);

  const getPackLabel = (sz) => {
    if (!sz) return "";
    let lbl = sz.packOnlyLabel || sz.displayLabel || sz.label || "Standard";
    const pTitle = (product?.name || product?.title || "").trim();
    if (pTitle) {
      lbl = lbl.replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
    }
    if (cleanFvName) {
      lbl = lbl.replace(new RegExp(`^${cleanFvName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
      lbl = lbl.replace(new RegExp(`\\(${cleanFvName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "gi"), "");
    }
    if (activeFamilyVariant?.name) {
      lbl = lbl.replace(new RegExp(`^${activeFamilyVariant.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
    }
    if (activeFamilyVariant?.weightRange) {
      lbl = lbl.replace(new RegExp(`^${activeFamilyVariant.weightRange.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
    }
    lbl = lbl.replace(/^[\s/–—-]+/, "").trim() || lbl;
    if (/^\d+$/.test(lbl)) {
      lbl = `${lbl} Pack`;
    }
    return lbl;
  };

  const colors = useMemo(() => {
    return product.colors || [];
  }, [product]);

  const activeColor = colors[activeColorIndex]?.name || "";
  const activeSize = (sizes && sizes[activeSizeIndex]?.label) || "";
  const variantString = [activeSize, activeColor].filter(Boolean).join(" / ");

  const parsedSizeOptions = sizes.map((sizeOption) => ({
    ...sizeOption,
    ...splitSizeAndPackLabel(getPackLabel(sizeOption)),
  }));
  const hasSeparateSizeAndPack = parsedSizeOptions.some(
    (sizeOption) => sizeOption.pack,
  );
  const selectedSizeAndPack = splitSizeAndPackLabel(
    getPackLabel(selectedSizeObj),
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
    const nextIndex =
      parsedSizeOptions.findIndex(
        (sizeOption) =>
          sizeOption.size === sizeValue &&
          (!selectedSizeAndPack.pack || sizeOption.pack === selectedSizeAndPack.pack),
      ) ?? -1;
    const fallbackIndex = parsedSizeOptions.findIndex(
      (sizeOption) => sizeOption.size === sizeValue,
    );
    const index = nextIndex === -1 ? fallbackIndex : nextIndex;
    if (index !== -1) setActiveSizeIndex(index);
  };

  const selectPackOption = (packValue) => {
    const index = parsedSizeOptions.findIndex(
      (sizeOption) =>
        sizeOption.size === selectedSizeAndPack.size &&
        sizeOption.pack === packValue,
    );
    if (index !== -1) setActiveSizeIndex(index);
  };

  const commonUses = useMemo(() => {
    if (product.commonUses && product.commonUses.length > 0) {
      return product.commonUses;
    }
    const cat = product.category?.toLowerCase() || "";
    const title = product.title?.toLowerCase() || "";

    if (cat === "food") {
      return [
        "Daily Meals",
        "Muscle Growth",
        "Digestive Health",
        "Daily Energy",
      ];
    } else if (cat === "beds") {
      return [
        "Deep Sleep",
        "Joint Relief",
        "Relaxing Bolsters",
        "Lounging & Cuddles",
      ];
    } else if (cat === "toys") {
      return [
        "Boredom Relief",
        "Active Chewing",
        "Fetch Games",
        "Outdoor Play",
      ];
    } else if (cat === "grooming") {
      return [
        "At-Home Baths",
        "Weekly Coat Care",
        "Nail Trimming",
        "Detangling",
      ];
    } else if (title.includes("bowl")) {
      return [
        "Hiking & Walks",
        "Road Trips & Travel",
        "Fresh Water Access",
        "Food Serving",
      ];
    } else if (title.includes("harness") || title.includes("leash")) {
      return [
        "Daily Walks",
        "Outdoor Training",
        "Car Safety Hookup",
        "Night Walking",
      ];
    } else {
      return [
        "Everyday Use",
        "Pet Comfort",
        "Interactive Play",
        "Travel & Transport",
      ];
    }
  }, [product]);

  const variantGroups = useMemo(() => {
    if (!sizes || sizes.length === 0) return [];
    const pTitle = (product?.name || product?.title || "").trim();

    // Strategy 1: Explicit familyVariants from backend
    if (familyVariants && familyVariants.length > 1) {
      const groups = familyVariants
        .map((fv) => {
          const fvId = String(fv.id || fv._id || "");
          const fvName = String(fv.name || fv.displayName || fv.label || "").trim();
          let fvClean = fvName;
          if (pTitle) {
            fvClean = fvClean
              .replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "")
              .trim();
            fvClean = fvClean
              .replace(new RegExp(`\\(${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "gi"), "")
              .trim();
          }
          fvClean = fvClean || fvName;
          const fvCleanLower = fvClean.toLowerCase();
          const fvColorLower = (fv.packColor || "").toLowerCase();
          const fvWeightLower = (fv.weightRange || "").toLowerCase();

          const subSizes = sizes
            .map((sz, originalIndex) => ({ ...sz, originalIndex }))
            .filter((sz) => {
              if (sz.familyVariantId && (String(sz.familyVariantId) === fvId || String(sz.familyVariantId) === String(fv.id))) return true;
              if (sz.familyVariant?.id && String(sz.familyVariant.id) === fvId) return true;
              const szLabel = String(sz.label || sz.displayLabel || "").toLowerCase();
              if (fvCleanLower && szLabel.includes(fvCleanLower)) return true;
              if (fvColorLower && szLabel.includes(fvColorLower)) return true;
              if (fvWeightLower && szLabel.includes(fvWeightLower)) return true;
              return false;
            });

          const formattedSubSizes = subSizes.map((sub) => {
            let packOnly = sub.displayLabel || sub.label;
            if (pTitle) {
              packOnly = packOnly.replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
            }
            if (fvClean) {
              packOnly = packOnly.replace(new RegExp(`^${fvClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
              packOnly = packOnly.replace(new RegExp(`\\(${fvClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "gi"), "");
            }
            if (fv.name) {
              packOnly = packOnly.replace(new RegExp(`^${fv.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
            }
            if (fv.weightRange) {
              packOnly = packOnly.replace(new RegExp(`^${fv.weightRange.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "");
            }
            packOnly = packOnly.replace(/^[\s/–—-]+/, "").trim() || packOnly;
            if (/^\d+$/.test(packOnly)) {
              packOnly = `${packOnly} Pack`;
            }
            return {
              ...sub,
              packOnlyLabel: packOnly,
            };
          });

          const fvImg =
            (typeof fv.mainImage === "string" ? fv.mainImage : fv.mainImage?.url || fv.mainImage?.src) ||
            (typeof fv.image === "string" ? fv.image : fv.image?.url || fv.image?.src) ||
            fv.imageUrl ||
            formattedSubSizes[0]?.image;

          return {
            id: fv.id || fvClean,
            name: fvClean,
            fullName: fvName,
            image: fvImg,
            colorHex: fv.packColorHex || fv.colorHex,
            weightRange: fv.weightRange,
            subSizes: formattedSubSizes,
          };
        })
        .filter((g) => g.subSizes.length > 0);

      // If all or multiple sizes are represented across 2+ groups, return it!
      if (groups.length > 1) {
        return groups;
      }
    }

    // Strategy 2: Slash or hyphen delimited variants (e.g. "200mg / 30 tabs", "500mg / 60 tabs" or "5.6-11 lbs (Purple) / 20")
    const hasDelimiters = sizes.some((s) => s.label && (s.label.includes(" / ") || s.label.includes(" - ")));
    if (hasDelimiters) {
      const gMap = {};
      sizes.forEach((sz, originalIndex) => {
        const delimiter = sz.label.includes(" / ") ? " / " : " - ";
        const parts = sz.label.split(delimiter);
        let groupKey = parts[0].trim();
        if (pTitle) {
          groupKey = groupKey.replace(new RegExp(`^${pTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`, "i"), "").trim() || groupKey;
        }
        let subKey = parts.slice(1).join(delimiter).trim();
        if (/^\d+$/.test(subKey)) {
          subKey = `${subKey} Pack`;
        }

        const matchedFv = Array.isArray(familyVariants)
          ? familyVariants.find((f) => {
              const fName = String(f.name || f.displayName || f.label || "").toLowerCase();
              const gLower = groupKey.toLowerCase();
              return fName.includes(gLower) || (f.packColor && gLower.includes(String(f.packColor).toLowerCase())) || (f.weightRange && gLower.includes(String(f.weightRange).toLowerCase()));
            })
          : null;

        if (!gMap[groupKey]) {
          gMap[groupKey] = {
            id: groupKey,
            name: groupKey,
            image: sz.image || matchedFv?.image || matchedFv?.mainImage,
            colorHex: sz.colorHex || matchedFv?.packColorHex,
            weightRange: sz.weightRange || matchedFv?.weightRange,
            subSizes: [],
          };
        }
        gMap[groupKey].subSizes.push({
          ...sz,
          originalIndex,
          packOnlyLabel: subKey || sz.displayLabel || sz.label,
        });
      });

      const groups = Object.values(gMap);
      if (groups.length > 1) {
        return groups;
      }
    }

    return [];
  }, [sizes, familyVariants, product]);

  const activeGroup = useMemo(() => {
    if (!variantGroups.length) return null;
    return (
      variantGroups.find((g) =>
        g.subSizes.some((s) => s.originalIndex === activeSizeIndex)
      ) || variantGroups[0]
    );
  }, [variantGroups, activeSizeIndex]);

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#8a72c7]/10 text-secondary border border-[#8a72c7]/20">
            {categoryLabel}
          </span>
          {product.stock === 0 && (
            <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-[#fff0f1] text-[#d32f2f] border border-[#ffccd0] flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d32f2f]" />
              Out of Stock
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-5 mb-2 font-sans font-extrabold text-[2.2rem] leading-[1.1] text-on-background tracking-tight">
          {product.title}
        </h1>

        {/* Star Rating Row — only shown when real reviews exist */}
        {avgRating && totalReviews > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= Math.round(parseFloat(avgRating))
                      ? "fill-amber-400 text-amber-500"
                      : "fill-none text-neutral-300"
                  }
                />
              ))}
            </div>
            <span className="text-sm font-black text-on-background">
              {avgRating}
            </span>
            <span className="text-xs text-charcoal-text font-medium">
              ({totalReviews} customer reviews)
            </span>
          </div>
        )}

        {/* Pricing details — removed when pack/variant options exist below, and off badge removed */}
        <div className="flex flex-wrap items-end gap-3 mt-4 mb-5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-charcoal-text">
              Price
            </span>
            <span className="text-4xl font-extrabold text-secondary tracking-tight leading-none">
              {displaySalePrice}
            </span>
          </div>
          {savings > 0 && displayOriginalPrice !== displaySalePrice && (
            <div className="flex items-center gap-2 pb-1">
              <span className="text-base font-bold text-charcoal-text/45 line-through">
                {displayOriginalPrice}
              </span>
              <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-secondary">
                Save ${Number(savings).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {requiresVet && (
          <div className="mt-3.5 mb-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8a72c7] px-3.5 py-1.5 text-xs font-extrabold uppercase text-white shadow-xs">
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

        {/* Short Description (Only displayed if genuine shortDescription is available and not a technical slug) */}
        {(() => {
          const rawShortDesc =
            activeFamilyVariant?.shortDescription ||
            selectedSizeObj?.shortDescription ||
            product?.shortDescription ||
            product?.productDetails?.overview ||
            "";

          if (!rawShortDesc || isSlugLike(rawShortDesc)) return null;

          return (
            <>
              {/* Divider */}
              <div className="my-5 h-px bg-outline" />

              <div className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-charcoal-text font-medium">
                {typeof rawShortDesc === "string" && /<[a-z][\s\S]*>/i.test(rawShortDesc) ? (
                  <div
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: rawShortDesc }}
                  />
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">
                    {rawShortDesc}
                  </p>
                )}
              </div>
            </>
          );
        })()}

        {/* Variant Selection Section */}
        {(sizes.length > 0 || colors.length > 0) && (
          <div className="mt-5 flex flex-col gap-4 p-4 rounded-2xl bg-surface/40 border border-outline/70">
            {/* TWO-TIER VARIANT SELECTION (When variant groups exist) */}
            {variantGroups.length > 1 ? (
              <>
                {/* Tier 1: Formulation / Strength / Dog Weight */}
                {false ? (
                  <>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-charcoal-text block mb-2">
                        Select Size
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {sizeChoices.map((sizeValue) => (
                          <button
                            key={sizeValue}
                            type="button"
                            onClick={() => selectSizeOption(sizeValue)}
                            disabled={product.stock === 0}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                              selectedSizeAndPack.size === sizeValue
                                ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/25"
                                : "bg-white text-on-background border-[#e7ddd0] hover:bg-[#8a72c7]/5"
                            }`}
                          >
                            {sizeValue}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-charcoal-text block mb-2">
                        Select Dose / Pack
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {packChoices.map((packOption) => {
                          const isActive = selectedSizeAndPack.pack === packOption.pack;
                          const itemPrice = packOption.price != null
                            ? Number(String(packOption.price).replace(/[^0-9.]/g, ""))
                            : null;
                          return (
                            <button
                              key={`${packOption.size}-${packOption.pack}`}
                              type="button"
                              onClick={() => selectPackOption(packOption.pack)}
                              disabled={product.stock === 0}
                              className={`flex flex-col items-start px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                                isActive
                                  ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/25"
                                  : "bg-white text-on-background border-[#e7ddd0] hover:bg-[#8a72c7]/5"
                              }`}
                            >
                              <span>{packOption.pack}</span>
                              {itemPrice !== null && !isNaN(itemPrice) && (
                                <span className={`text-[11px] font-semibold mt-0.5 ${isActive ? "text-white/90" : "text-secondary"}`}>
                                  ${itemPrice.toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-charcoal-text">
                      1. Formulation / Strength:
                    </span>
                    <span className="text-xs font-bold text-secondary bg-[#8a72c7]/10 px-2.5 py-0.5 rounded-full">
                      {activeGroup?.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variantGroups.map((grp) => {
                      const isGrpActive = grp.id === activeGroup?.id;
                      return (
                        <button
                          key={grp.id}
                          type="button"
                          onClick={() => {
                            if (grp.subSizes.length > 0) {
                              setActiveSizeIndex(grp.subSizes[0].originalIndex);
                            }
                          }}
                          className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                            isGrpActive
                              ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/25 scale-[1.02]"
                              : "bg-white text-on-background border-[#e7ddd0] hover:bg-[#8a72c7]/5 hover:border-[#8a72c7]/40 shadow-2xs hover:shadow-xs"
                          }`}
                        >
                          {grp.colorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-xs"
                              style={{ backgroundColor: grp.colorHex }}
                            />
                          )}
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-extrabold tracking-tight">
                              {grp.name}
                            </span>
                            {grp.weightRange && grp.weightRange !== grp.name && (
                              <span
                                className={`text-[10px] font-semibold mt-0.5 ${
                                  isGrpActive ? "text-white/80" : "text-charcoal-text"
                                }`}
                              >
                                {grp.weightRange}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}

                {/* Tier 2: Pack Size / Count for Selected Formulation */}
                {activeGroup?.subSizes?.length > 0 && (
                  <div className="pt-3 border-t border-outline/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-charcoal-text">
                        2. Pack Size / Count:
                      </span>
                      <span className="text-xs font-bold text-secondary bg-[#8a72c7]/10 px-2.5 py-0.5 rounded-full">
                        {activeGroup.subSizes.find((s) => s.originalIndex === activeSizeIndex)?.packOnlyLabel ||
                          sizes[activeSizeIndex]?.displayLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeGroup.subSizes.map((sub) => {
                        const isSubActive = sub.originalIndex === activeSizeIndex;
                        const itemPrice =
                          sub.price !== undefined && sub.price !== null
                            ? Number(String(sub.price).replace(/[^0-9.]/g, ""))
                            : null;

                        return (
                          <button
                            key={sub.id || sub.originalIndex}
                            type="button"
                            onClick={
                              product.stock === 0
                                ? undefined
                                : () => setActiveSizeIndex(sub.originalIndex)
                            }
                            disabled={product.stock === 0}
                            className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                              product.stock === 0
                                ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                                : isSubActive
                                  ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/25 scale-[1.02]"
                                  : "bg-white text-on-background border-[#e7ddd0] hover:bg-[#8a72c7]/5 hover:border-[#8a72c7]/40 shadow-2xs hover:shadow-xs"
                            }`}
                          >
                            <div className="flex flex-col text-left leading-tight">
                              <span className="font-extrabold tracking-tight">
                                {sub.packOnlyLabel}
                              </span>
                              {itemPrice !== null && !isNaN(itemPrice) && (
                                <span
                                  className={`text-[11px] font-semibold mt-0.5 ${
                                    isSubActive ? "text-white/90" : "text-secondary"
                                  }`}
                                >
                                  ${itemPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : sizes.length > 0 ? (
              /* Scoped Single-Tier Pack Size Selection */
              <div className="space-y-3">
                {activeFamilyVariant && (
                  <div className="flex items-center justify-between pb-3 border-b border-outline/50">
                    <div className="flex items-center gap-2 min-w-0">
                      {(activeFamilyVariant.packColorHex || selectedSizeObj?.colorHex) && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                          style={{ backgroundColor: activeFamilyVariant.packColorHex || selectedSizeObj?.colorHex }}
                        />
                      )}
                      <div className="text-xs font-black text-on-background truncate">
                        Formulation: <span className="text-secondary">{cleanFvName}</span>
                        {activeFamilyVariant.weightRange && activeFamilyVariant.weightRange !== cleanFvName && (
                          <span className="ml-1 text-[11px] font-semibold text-charcoal-text">
                            ({activeFamilyVariant.weightRange})
                          </span>
                        )}
                      </div>
                    </div>
                    {isFamily && (
                      <Link
                        to={`/shop/product/${product.id}/variants`}
                        className="text-xs font-extrabold text-secondary hover:underline whitespace-nowrap ml-3 inline-flex items-center gap-1 shrink-0"
                      >
                        <span>All Formulations</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                )}

                {hasSeparateSizeAndPack ? (
                  <>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-charcoal-text block mb-2">
                        Select Size
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {sizeChoices.map((sizeValue) => (
                          <button
                            key={sizeValue}
                            type="button"
                            onClick={() => selectSizeOption(sizeValue)}
                            disabled={product.stock === 0}
                            className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                              selectedSizeAndPack.size === sizeValue
                                ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/25"
                                : "bg-white text-on-background border-[#e7ddd0] hover:bg-[#8a72c7]/5"
                            }`}
                          >
                            {sizeValue}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-charcoal-text block mb-2">
                        Select Dose / Pack
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {packChoices.map((packOption) => {
                          const isActive = selectedSizeAndPack.pack === packOption.pack;
                          const itemPrice = packOption.price != null
                            ? Number(String(packOption.price).replace(/[^0-9.]/g, ""))
                            : null;
                          return (
                            <button
                              key={`${packOption.size}-${packOption.pack}`}
                              type="button"
                              onClick={() => selectPackOption(packOption.pack)}
                              disabled={product.stock === 0}
                              className={`flex flex-col items-start px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                                isActive
                                  ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/25"
                                  : "bg-white text-on-background border-[#e7ddd0] hover:bg-[#8a72c7]/5"
                              }`}
                            >
                              <span>{packOption.pack}</span>
                              {itemPrice !== null && !isNaN(itemPrice) && (
                                <span className={`text-[11px] font-semibold mt-0.5 ${isActive ? "text-white/90" : "text-secondary"}`}>
                                  ${itemPrice.toFixed(2)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-charcoal-text">
                      {isFamily ? "Select Pack Size / Count:" : "Select Size / Option:"}
                    </span>
                    <span className="text-xs font-bold text-secondary bg-[#8a72c7]/10 px-2.5 py-0.5 rounded-full">
                      {getPackLabel(sizes[activeSizeIndex])}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((sz, idx) => {
                      const isActive = idx === activeSizeIndex;
                      const labelText = getPackLabel(sz);
                      const itemPrice =
                        sz.price !== undefined && sz.price !== null
                          ? Number(String(sz.price).replace(/[^0-9.]/g, ""))
                          : null;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={
                            product.stock === 0
                              ? undefined
                              : () => setActiveSizeIndex(idx)
                          }
                          disabled={product.stock === 0}
                          className={`group relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 cursor-pointer ${
                            product.stock === 0
                              ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400"
                              : isActive
                                ? "bg-secondary text-white border-secondary shadow-md shadow-secondary/25 scale-[1.02]"
                                : "bg-white text-on-background border-[#e7ddd0] hover:bg-[#8a72c7]/5 hover:border-[#8a72c7]/40 shadow-2xs hover:shadow-xs"
                          }`}
                        >
                          {sz.colorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-xs"
                              style={{ backgroundColor: sz.colorHex }}
                            />
                          )}
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-extrabold tracking-tight">
                              {labelText}
                            </span>
                            {itemPrice !== null && !isNaN(itemPrice) && (
                              <span
                                className={`text-[11px] font-semibold mt-0.5 ${
                                  isActive ? "text-white/90" : "text-secondary"
                                }`}
                              >
                                ${itemPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                )}
              </div>
            ) : null}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-charcoal-text">
                    Color:
                  </span>
                  <span className="text-xs font-bold text-secondary bg-[#8a72c7]/10 px-2 py-0.5 rounded-md">
                    {colors[activeColorIndex]?.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {colors.map((col, idx) => {
                    const isActive = idx === activeColorIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={
                          product.stock === 0
                            ? undefined
                            : () => setActiveColorIndex(idx)
                        }
                        disabled={product.stock === 0}
                        title={col.name}
                        className={`group relative flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
                          product.stock === 0
                            ? "opacity-40 cursor-not-allowed"
                            : "cursor-pointer hover:scale-110"
                        }`}
                        style={{
                          backgroundColor: col.code,
                          borderColor: isActive ? "#8a72c7" : "#e7ddd0",
                          boxShadow: isActive
                            ? "0 0 0 3px rgba(138,114,199,0.25)"
                            : "none",
                        }}
                      >
                        {isActive && (
                          <Check
                            size={12}
                            className={
                              col.code === "#E5C7A3" || col.code === "#FAF9F5"
                                ? "text-secondary"
                                : "text-white"
                            }
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single Action Row: Quantity + Add to Cart + Buy Now + Wishlist */}
      <div className="mt-8 pt-6 border-t border-outline flex items-center gap-2.5 sm:gap-3">
        {/* Quantity Increment/Decrement Stepper */}
        <div className="flex items-center h-12 rounded-2xl border border-[#e7ddd0] bg-white px-1.5 shadow-2xs shrink-0">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={isOutOfStock || quantity <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-charcoal-text hover:bg-surface-soft hover:text-on-background transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
            aria-label="Decrease quantity"
          >
            <Minus size={14} className="stroke-[2.5]" />
          </button>
          <span className="w-8 sm:w-9 text-center text-sm font-black text-on-background select-none">
            {isOutOfStock ? 0 : quantity}
          </span>
          <button
            type="button"
            onClick={() => {
              const limit = Math.max(1, availableStock || 1);
              setQuantity((q) => (q < limit ? q + 1 : q));
            }}
            disabled={isOutOfStock || quantity >= availableStock}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-charcoal-text hover:bg-surface-soft hover:text-on-background transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
            aria-label="Increase quantity"
          >
            <Plus size={14} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={
            userLacksVet
              ? () => navigate(user ? "/profile?tab=vet-verification" : "/login")
              : isOutOfStock
              ? undefined
              : () => handleAddToCart(variantString)
          }
          disabled={isOutOfStock || userLacksVet}
          className={`flex-1 h-12 flex items-center justify-center gap-2 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 active:scale-[0.98] ${
            userLacksVet
              ? "bg-[#17345f]/40 text-white cursor-not-allowed shadow-none opacity-90"
              : isOutOfStock
              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-80"
              : "text-[#8a72c7] bg-[#8a72c7]/5 border border-[#8a72c7]/25 hover:bg-[#8a72c7]/10 hover:border-[#8a72c7]/40 cursor-pointer shadow-sm"
          }`}
        >
          <ShoppingCart size={15} className="shrink-0" />
          <span className="truncate">{userLacksVet ? "Apply for Verification" : isOutOfStock ? "Out of Stock" : added ? "Added to Cart!" : "Add to Cart"}</span>
        </button>

        {/* Buy Now Button */}
        <button
          type="button"
          onClick={
            userLacksVet
              ? () => navigate(user ? "/profile?tab=vet-verification" : "/login")
              : isOutOfStock
              ? undefined
              : () => handleBuyNow(variantString)
          }
          disabled={isOutOfStock || userLacksVet}
          className={`flex-1 h-12 flex items-center justify-center gap-2 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 active:scale-[0.98] ${
            userLacksVet
              ? "border border-[#17345f1a] bg-gray-100 text-[#122a50]/40 cursor-not-allowed shadow-none"
              : isOutOfStock
              ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed opacity-80"
              : "text-white bg-[#8a72c7] hover:bg-[#7a61b8] cursor-pointer shadow-md hover:shadow-[#8a72c7]/20"
          }`}
        >
          <span className="truncate">{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
        </button>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={() => setWished()}
          className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl border transition duration-300 cursor-pointer shadow-sm active:scale-95 ${
            wished
              ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
              : "bg-white border-[#e7ddd0] hover:bg-surface-soft text-[#8a72c7] hover:border-[#8a72c7]/30"
          }`}
          aria-label={wished ? "Remove from Wishlist" : "Add to Wishlist"}
          title={wished ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={16} fill={wished ? "#e8546a" : "none"} stroke={wished ? "#e8546a" : "currentColor"} />
        </button>
      </div>
    </div>
  );
}
