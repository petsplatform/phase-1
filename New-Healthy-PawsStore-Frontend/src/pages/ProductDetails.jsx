import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  Home,
  ChevronRight,
  Truck,
  ShieldCheck,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ImageGallery from "../components/product-details/ImageGallery";
import ProductInfo from "../components/product-details/ProductInfo";
import ProductTabs from "../components/product-details/ProductTabs";
import RelatedProducts from "../components/product-details/RelatedProducts";
import { catalogApi } from "../api/catalogApi";
import { useToast } from "../context/ToastContext";
import { isFamilyProduct } from "../utils/productUtils";

export default function ProductDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);

  const variantParam =
    searchParams.get("variant") ||
    searchParams.get("size") ||
    searchParams.get("variantId");
  const familyVariantParam =
    searchParams.get("familyVariantId") || searchParams.get("familyId");

  useEffect(() => {
    let active = true;

    catalogApi
      .getProduct(id)
      .then((nextProduct) => {
        if (active) setProduct(nextProduct);
      })
      .catch((error) => {
        if (active) setProduct(null);
        showToast(error.message || "Could not load product details.", "error");
      });

    return () => {
      active = false;
    };
  }, [id, showToast]);

  const allSizes = useMemo(() => {
    return (
      product?.sizes || [
        {
          id: product?.id || "std",
          label: product?.optionLabel || "Standard",
          displayLabel: "Standard",
          multiplier: 1.0,
          price: Number(product?.price || 0),
          originalPrice: Number(product?.oldPrice || product?.price || 0),
          stock: Number(product?.stock ?? 50),
          sku: product?.sku || "PROD-STD",
          image: product?.image,
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
      const cleanParam = String(familyVariantParam).replace(/^fv-/, "").trim();
      const byFvId = familyVariants.find(
        (fv, idx) =>
          String(fv.id || fv._id) === String(familyVariantParam) ||
          String(fv.id || fv._id) === cleanParam ||
          String(familyVariantParam) === `fv-${fv.id || fv._id}` ||
          String(idx) === cleanParam ||
          String(idx) === String(familyVariantParam) ||
          fv.slug === String(familyVariantParam) ||
          fv.slug === cleanParam ||
          String(fv.name || fv.displayName || "").toLowerCase() ===
            String(familyVariantParam).toLowerCase() ||
          String(fv.name || fv.displayName || "").toLowerCase() ===
            cleanParam.toLowerCase() ||
          (cleanParam &&
            String(fv.name || fv.displayName || "")
              .toLowerCase()
              .includes(cleanParam.toLowerCase())),
      );
      if (byFvId) return byFvId;
    }

    if (activeFamilyId) {
      const byActive = familyVariants.find(
        (fv, idx) =>
          String(fv.id || fv._id) === String(activeFamilyId) ||
          String(idx) === String(activeFamilyId),
      );
      if (byActive) return byActive;
    }

    if (variantParam && allSizes.length > 0) {
      const cleanVParam = String(variantParam).toLowerCase();
      const matched = allSizes.find(
        (s) =>
          String(s.id).toLowerCase() === cleanVParam ||
          String(s.sku || "").toLowerCase() === cleanVParam ||
          String(s.familyVariantId || "").toLowerCase() === cleanVParam ||
          String(s.label || "").toLowerCase() === cleanVParam ||
          String(s.displayLabel || "").toLowerCase() === cleanVParam ||
          String(s.packOnlyLabel || "").toLowerCase() === cleanVParam ||
          (cleanVParam &&
            String(s.label || "")
              .toLowerCase()
              .includes(cleanVParam)),
      );
      if (matched?.familyVariant) return matched.familyVariant;
      if (matched?.familyVariantId) {
        const byId = familyVariants.find(
          (fv, idx) =>
            String(fv.id || fv._id) === String(matched.familyVariantId) ||
            String(idx) === String(matched.familyVariantId),
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

    if (variantParam) {
      const vLower = String(variantParam).toLowerCase();
      const byName = familyVariants.find((fv) => {
        const fn = String(fv.name || fv.displayName || "").toLowerCase();
        return fn && (vLower.includes(fn) || fn.includes(vLower));
      });
      if (byName) return byName;
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
  }, [activeFamilyVariant, activeFamilyId]);

  const sizes = useMemo(() => {
    if (!isFamily || !familyVariants.length || !activeFamilyVariant) {
      return allSizes;
    }

    const pTitle = (product?.title || product?.name || "").trim();

    // Strategy A: If activeFamilyVariant has explicit skus
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
            product.price ??
            29.99,
        );
        const regPrice = Number(
          s.pricing?.price ??
            s.pricing?.regularPrice ??
            s.regularPrice ??
            s.price ??
            salePrice * 1.35,
        );
        const rawName =
          s.packLabel ||
          s.pack ||
          s.dose ||
          s.doses ||
          s.dosage ||
          s.name ||
          s.label ||
          s.size ||
          s.weight ||
          s.optionName;
        const familyName =
          activeFamilyVariant.name || activeFamilyVariant.displayName || "";
        const normalizedRawName = String(rawName || "").trim().toLowerCase();
        const normalizedFamilyName = String(familyName).trim().toLowerCase();
        const normalizedProductName = String(pTitle).trim().toLowerCase();
        const fallbackName =
          s.dosesCount ? `${s.dosesCount} Doses` : `${sIdx + 1} Pack`;
        const displayName =
          rawName &&
          !/^1\s*pack$/i.test(String(rawName).trim()) &&
          normalizedRawName !== normalizedFamilyName &&
          normalizedRawName !== normalizedProductName
            ? rawName
            : fallbackName;

        return {
          id: s.id || `${activeFamilyVariant.id}-${sIdx}`,
          sku: s.sku || `${product.sku || "HP"}-${sIdx + 1}`,
          name: displayName,
          label: displayName,
          displayLabel: displayName,
          packOnlyLabel: displayName,
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

    // Strategy B: Match from allSizes
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
            `^${pTitle.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
            "i",
          ),
          "",
        )
        .replace(
          new RegExp(
            `\\(${pTitle.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\)`,
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

    if (matched.length > 0) {
      return matched.map((sub, sIdx) => {
        let packOnly = sub.displayLabel || sub.label || "";
        if (pTitle) {
          packOnly = packOnly.replace(
            new RegExp(
              `^${pTitle.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
              "i",
            ),
            "",
          );
        }
        if (fvClean) {
          packOnly = packOnly.replace(
            new RegExp(
              `^${fvClean.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[-–—:/]?\\s*`,
              "i",
            ),
            "",
          );
          packOnly = packOnly.replace(
            new RegExp(
              `\\(${fvClean.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\)`,
              "gi",
            ),
            "",
          );
        }
        const rawName = sub.name || sub.label || sub.displayLabel;
        const fallbackName =
          activeFamilyVariant.name ||
          activeFamilyVariant.displayName ||
          "Standard Option";
        const cleanName =
          rawName && !/^1\s*pack$/i.test(String(rawName).trim())
            ? rawName
            : fallbackName;

        return {
          ...sub,
          name: cleanName,
          label: cleanName,
          displayLabel: cleanName,
          packOnlyLabel: cleanName,
          image: fvImg,
          imageUrl: fvImg,
          familyVariant: activeFamilyVariant,
          familyVariantId: activeFamilyVariant.id,
          description: activeFamilyVariant.description || sub.description || "",
        };
      });
    }

    // Default pack tiers for this active formulation
    const baseSale = Number(activeFamilyVariant.price ?? product.price ?? 499);
    const baseReg = Number(
      activeFamilyVariant.originalPrice ?? product.oldPrice ?? baseSale * 1.35,
    );

    return [
      {
        id: `${activeFamilyVariant.id}-std`,
        sku: `${product.sku || "HP"}-${activeFamilyVariant.id}-STD`,
        name: activeFamilyVariant.name || "Standard Option",
        label: activeFamilyVariant.name || "Standard Option",
        displayLabel: activeFamilyVariant.name || "Standard Option",
        packOnlyLabel: activeFamilyVariant.name || "Standard Option",
        price: baseSale,
        originalPrice: baseReg,
        stock: Number(activeFamilyVariant.stock ?? 50),
        multiplier: 1.0,
        image: fvImg,
        imageUrl: fvImg,
        familyVariant: activeFamilyVariant,
        familyVariantId: activeFamilyVariant.id,
        description: activeFamilyVariant.description || "",
      },
      {
        id: `${activeFamilyVariant.id}-val`,
        sku: `${product.sku || "HP"}-${activeFamilyVariant.id}-VAL`,
        label: "Value Pack",
        displayLabel: "Value Pack",
        packOnlyLabel: "Value Pack",
        price: Number((baseSale * 1.9).toFixed(2)),
        originalPrice: Number((baseSale * 2.5).toFixed(2)),
        stock: Number(activeFamilyVariant.stock ?? 50),
        multiplier: 1.9,
        image: fvImg,
        imageUrl: fvImg,
        familyVariant: activeFamilyVariant,
        familyVariantId: activeFamilyVariant.id,
        description: activeFamilyVariant.description || "",
      },
    ];
  }, [isFamily, familyVariants, activeFamilyVariant, allSizes, product]);

  const [activeSizeIndex, setActiveSizeIndex] = useState(0);

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

  const handleSelectFamilyVariant = (fv) => {
    setActiveFamilyId(fv.id);
    setActiveSizeIndex(0);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("familyVariantId", fv.id);
        next.delete("variant");
        return next;
      },
      { replace: true },
    );
  };

  const handleSelectSizeIndex = (idx) => {
    setActiveSizeIndex(idx);
    const sz = sizes[idx];
    if (sz?.id) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("variant", sz.id);
          return next;
        },
        { replace: true },
      );
    }
  };

  const variantImages = useMemo(() => {
    if (!product) return [];

    // Strictly isolate active formulation's images when viewing a family product
    if (isFamily && activeFamilyVariant) {
      const fvImages = [];
      const fvImg =
        (typeof activeFamilyVariant.mainImage === "string"
          ? activeFamilyVariant.mainImage
          : activeFamilyVariant.mainImage?.url ||
            activeFamilyVariant.mainImage?.src) ||
        (typeof activeFamilyVariant.image === "string"
          ? activeFamilyVariant.image
          : activeFamilyVariant.image?.url || activeFamilyVariant.image?.src) ||
        activeFamilyVariant.imageUrl;

      if (fvImg) fvImages.push(fvImg);

      const fvGal = [
        ...(Array.isArray(activeFamilyVariant.gallery)
          ? activeFamilyVariant.gallery
          : []),
        ...(Array.isArray(activeFamilyVariant.images)
          ? activeFamilyVariant.images
          : []),
      ];
      fvGal.forEach((g) => {
        const u = typeof g === "string" ? g : g?.url || g?.src;
        if (u && !fvImages.includes(u)) fvImages.push(u);
      });

      if (fvImages.length > 0) {
        return Array.from(new Set(fvImages)).filter(Boolean);
      }
    }

    const activeVarImages = [];
    const sizeImg = activeSizeObj?.image || activeSizeObj?.imageUrl;
    if (sizeImg) activeVarImages.push(sizeImg);

    if (Array.isArray(activeSizeObj?.gallery)) {
      activeSizeObj.gallery.forEach((g) => {
        const u = typeof g === "string" ? g : g?.url || g?.src;
        if (u && !activeVarImages.includes(u)) activeVarImages.push(u);
      });
    }

    if (activeVarImages.length > 0) {
      return Array.from(new Set(activeVarImages)).filter(Boolean);
    }

    // Fallback to product images only if no variant-specific imagery exists
    const primaryCandidates = [
      product.mainImage,
      product.image,
      product.imageUrl,
    ]
      .map((img) => (typeof img === "string" ? img : img?.url || img?.src))
      .filter(Boolean);

    const rawGallery = Array.isArray(product.gallery) ? product.gallery : [];
    const rawImages = Array.isArray(product.images) ? product.images : [];
    const galleryCandidates = [...rawGallery, ...rawImages]
      .map((img) => (typeof img === "string" ? img : img?.url || img?.src))
      .filter(Boolean);

    const combined = Array.from(
      new Set([...primaryCandidates, ...galleryCandidates]),
    ).filter(Boolean);
    return combined.length > 0 ? combined : [product.image].filter(Boolean);
  }, [product, activeSizeObj, activeFamilyVariant]);

  if (!product) {
    return (
      <div className="min-h-screen bg-softCream/30 text-textMain">
        <Header />
        <main className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-[420px] animate-pulse rounded-3xl bg-sageLight" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softCream/30 text-textMain">
      <Header />

      <main className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-muted sm:text-[13px]"
        >
          <Link
            to="/"
            className="flex items-center gap-1 transition-colors hover:text-primary"
          >
            <Home size={14} />
            Home
          </Link>
          <ChevronRight size={12} />
          <Link to="/products" className="transition-colors hover:text-primary">
            Products
          </Link>
          <ChevronRight size={12} />
          <Link
            to={`/products?category=${encodeURIComponent(product.category || "")}`}
            className="transition-colors hover:text-primary"
          >
            {product.category || "Pet Care"}
          </Link>
          <ChevronRight size={12} />
          <span className="min-w-0 max-w-full truncate font-bold text-textMain sm:max-w-[360px] md:max-w-none">
            {product.title}
          </span>
        </nav>

        {/* Hero Section: Gallery & Info */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="w-full min-w-0">
            <ImageGallery
              mainImage={variantImages[0] || product.image}
              title={product.title}
              discount={product.discount}
              allImages={variantImages.length ? variantImages : undefined}
            />
          </div>

          <div className="min-w-0 flex-1">
            <ProductInfo
              product={product}
              isFamily={isFamily}
              familyVariants={familyVariants}
              activeFamilyVariant={activeFamilyVariant}
              sizes={sizes}
              activeSizeIndex={activeSizeIndex}
              activeSizeObj={activeSizeObj}
              onSelectFamilyVariant={handleSelectFamilyVariant}
              onSelectSizeIndex={handleSelectSizeIndex}
            />
          </div>
        </div>

        {/* Brand Assurance Trust Perks Strip */}
        <div className="mt-8 pt-8 border-t border-borderSoft grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-borderSoft shadow-2xs hover:border-secondary/40 transition">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondaryDark">
              <Truck size={20} />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-primaryDark">
                Fast Delivery
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Quick 24-48h dispatch on all orders
              </p>
            </div>
          </div>

          <div className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-borderSoft shadow-2xs hover:border-secondary/40 transition">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primaryDark">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-primaryDark">
                100% Genuine
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Direct manufacturer sourcing
              </p>
            </div>
          </div>

          <div className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-borderSoft shadow-2xs hover:border-secondary/40 transition">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondaryDark">
              <Sparkles size={20} />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-primaryDark">
                Vet Approved
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Clinical grade formulations
              </p>
            </div>
          </div>

          <div className="group flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-borderSoft shadow-2xs hover:border-secondary/40 transition">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primaryDark">
              <RotateCcw size={20} />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-primaryDark">
                Hassle-Free
              </h4>
              <p className="text-xs text-muted font-semibold mt-0.5">
                Dedicated customer support
              </p>
            </div>
          </div>
        </div>

        {/* Full-width Product Tabs */}
        <section className="mt-10 rounded-3xl border border-borderSoft bg-white p-6 sm:p-8 shadow-xs">
          <ProductTabs
            product={product}
            selectedOption={
              activeSizeObj?.displayLabel ||
              activeSizeObj?.label ||
              activeFamilyVariant?.name
            }
            activeFamilyVariant={activeFamilyVariant}
          />
        </section>

        {/* ── RELATED PRODUCTS SECTION ── */}
        <section className="mt-10 rounded-3xl border border-borderSoft bg-softCream/40 p-6 sm:p-8">
          <RelatedProducts currentId={product.id} category={product.category} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
