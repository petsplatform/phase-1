import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartIcon, HeartIcon, PawIcon, StarIcon } from "./common/HeaderIcons";
import QuantitySelector from "./QuantitySelector";
import {
  isWishlistItemSaved,
  removeWishlistProduct,
  toggleWishlistItem,
  WISHLIST_UPDATED_EVENT,
} from "../utils/wishlist";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { accountApi } from "../api/accountApi";
import { autoOrderApi } from "../api/autoOrderApi";
import { featureFlags } from "../config/siteNavigation";
import CountryDropdown from "./common/CountryDropdown";
import { trimFormValues } from "../utils/phoneValidation";
import {
  getSelectedVariantPrice,
  hasPurchasableVariants,
} from "../utils/catalog";
import { VariantPurchaseCard } from "./ProductFamilySections";

const DEFAULT_COUNTRY = "United States";
const EMPTY_AUTO_ADDRESS = {
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: DEFAULT_COUNTRY,
};
const AUTO_ADDRESS_FIELDS = [
  { key: "name", label: "Full Name", minLength: 2, maxLength: 50 },
  { key: "phone", label: "Phone Number", minLength: 10, maxLength: 10 },
  { key: "address", label: "Street Address", minLength: 5, maxLength: 100 },
  { key: "city", label: "City", minLength: 2, maxLength: 50 },
  { key: "state", label: "State", minLength: 2, maxLength: 50 },
  { key: "postalCode", label: "Postal Code", minLength: 3, maxLength: 10 },
];

const validateAutoAddress = (form) => {
  const nextErrors = {};

  AUTO_ADDRESS_FIELDS.forEach(({ key, label, minLength, maxLength }) => {
    const value = String(form[key] || "").trim();
    if (!value) {
      nextErrors[key] = `${label} is required.`;
    } else if (minLength && value.length < minLength) {
      nextErrors[key] = `${label} must be at least ${minLength} characters.`;
    } else if (maxLength && value.length > maxLength) {
      nextErrors[key] = `${label} must not exceed ${maxLength} characters.`;
    }
  });

  const phoneDigits = String(form.phone || "").replace(/\D/g, "");
  if (!nextErrors.phone && phoneDigits.length !== 10) {
    nextErrors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!String(form.country || "").trim()) {
    nextErrors.country = "Country is required.";
  }

  return nextErrors;
};

const formatAutoAddressOption = (address = {}) => (
  [
    address.name || address.fullName,
    address.address || address.addressLine1 || address.line1,
    address.city,
    address.state,
    address.postalCode || address.zip,
  ].filter(Boolean).join(", ") || "Saved Address"
);

const CheckIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m5 12 4 4L19 6"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StarRating = ({ rating, size = "h-4 w-4" }) => (
  <span className="flex items-center gap-0.5 text-[#d9aa3d]">
    {Array.from({ length: 5 }).map((_, index) => (
      <StarIcon
        key={index}
        className={`${size} ${index < Math.round(rating) ? "fill-[#d9aa3d]" : "fill-[#17345f1a] text-[#17345f1a]"}`}
      />
    ))}
  </span>
);

const optionalId = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  return value;
};

const uniqueBy = (items, getKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const ProductInfo = ({
  product,
  selectedColor,
  onColorChange,
  onVariantChange,
  reviews = [],
  compact = false,
  variantTable = null,
}) => {
  const { addToCart, startBuyNowCheckout, isProductInCart } = useCart();
  const { customer } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const reviewsCount = Array.isArray(reviews) ? reviews.length : 0;
  const avgRating =
    reviewsCount > 0
      ? (
          reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
          reviewsCount
        ).toFixed(1)
      : 0;
  const requiresVariantSelection = hasPurchasableVariants(product);
  const getDefaultSize = (sizes = []) =>
    sizes.find((size) => !size.disabled) || sizes[0] || null;
  const [selectedSize, setSelectedSize] = useState(
    getDefaultSize(product.sizes),
  );
  const [localSelectedColor, setLocalSelectedColor] = useState(
    product.colorVariants?.[0] || null,
  );
  const selectedVariantPricing = getSelectedVariantPrice(
    product,
    selectedSize?.id,
  );
  const activePrice = requiresVariantSelection
    ? selectedVariantPricing?.price
    : selectedSize?.price || product.price;
  const activeOldPrice = requiresVariantSelection
    ? selectedVariantPricing?.oldPrice
    : selectedSize?.oldPrice || product.oldPrice;
  const activeInventory = selectedSize?.inventory || product.inventory;
  const stockValue = Number(
    activeInventory?.stockQuantity ?? selectedSize?.stock ?? product.stock,
  );
  const hasStockInfo = Number.isFinite(stockValue);
  const availableStock = hasStockInfo ? Math.max(0, stockValue) : Infinity;
  const needsVariantSelection = requiresVariantSelection && !selectedSize;
  const hasVariantTable = Boolean(variantTable?.skus?.length);
  const isOutOfStock = hasStockInfo && availableStock <= 0;
  const isLowStock = hasStockInfo && availableStock > 0 && availableStock <= 5;
  const requiresVet = Boolean(product.vetOnly);
  const lacksVetAccess = requiresVet && !customer?.isVetVerified;
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(() =>
    isWishlistItemSaved(product),
  );
  const [autoOrderOpen, setAutoOrderOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [firstOrderDate, setFirstOrderDate] = useState("");
  const [frequencyValue, setFrequencyValue] = useState(30);
  const [shippingAddressIndex, setShippingAddressIndex] = useState("");
  const [addressMode, setAddressMode] = useState("saved");
  const [newAddress, setNewAddress] = useState(EMPTY_AUTO_ADDRESS);
  const [addressErrors, setAddressErrors] = useState({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [creatingAutoOrder, setCreatingAutoOrder] = useState(false);
  const sizesSignature = (product.sizes || [])
    .map((size) => `${size?.id || ""}:${size?.label || ""}:${size?.stock ?? ""}:${size?.disabled ? "1" : "0"}`)
    .join("|");
  const structuredVariants = (product.sizes || []).filter(
    (variant) => variant && (variant.weightRange || variant.size || variant.dose || variant.packSize),
  );
  const hasStructuredVariants = structuredVariants.length > 0;
  const getVariantSizeLabel = (variant) => {
    const safeVariant = variant || {};
    return safeVariant.weightRange || safeVariant.size || safeVariant.label || "";
  };
  const getVariantDoseLabel = (variant) => {
    const safeVariant = variant || {};
    return safeVariant.dose || (safeVariant.packSize ? `${safeVariant.packSize} Pack` : "");
  };
  const sizeOptions = uniqueBy(structuredVariants, getVariantSizeLabel);
  const selectedSizeLabel = getVariantSizeLabel(selectedSize);
  const doseOptions = uniqueBy(
    structuredVariants.filter((variant) => getVariantSizeLabel(variant) === selectedSizeLabel),
    getVariantDoseLabel,
  );

  useEffect(() => {
    const syncWishlistState = () => {
      if (isProductInCart(product)) {
        removeWishlistProduct(product);
        setIsWishlisted(false);
        return;
      }
      setIsWishlisted(isWishlistItemSaved(product));
    };
    syncWishlistState();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
    window.addEventListener("storage", syncWishlistState);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
      window.removeEventListener("storage", syncWishlistState);
    };
  }, [product, isProductInCart]);

  useEffect(() => {
    setLocalSelectedColor(selectedColor || product.colorVariants?.[0] || null);
  }, [product, selectedColor]);

  useEffect(() => {
    setQuantity(1);
  }, [product.id]);

  useEffect(() => {
    setSelectedSize((current) => {
      
      const sizes = product.sizes || [];
      if (sizes.length === 0) return null;
      if (current?.id && sizes.some((size) => size.id === current.id)) {
        return current;
      }
      return getDefaultSize(sizes);
    });
  }, [product.id, sizesSignature]);

  useEffect(() => {
    onVariantChange?.(selectedSize || null);
  }, [onVariantChange, selectedSize?.id]);

  useEffect(() => {
    if (!Number.isFinite(availableStock)) return;
    setQuantity((currentQuantity) =>
      Math.min(Math.max(1, currentQuantity), Math.max(1, availableStock)),
    );
  }, [availableStock, selectedSize?.id]);

  useEffect(() => {
    if (!customer || !autoOrderOpen) return;
    accountApi
      .getAddresses()
      .then((addresses) => {
        setSavedAddresses(addresses);
        if (addresses.length && shippingAddressIndex === "") {
          setShippingAddressIndex(String(addresses[0].index ?? 0));
        }
      })
      .catch(() => setSavedAddresses([]));
  }, [autoOrderOpen, customer, shippingAddressIndex]);

  useEffect(() => {
    if (autoOrderOpen && savedAddresses.length === 0) {
      setAddressMode("new");
    }
  }, [autoOrderOpen, savedAddresses.length]);

  const currentColor = selectedColor || localSelectedColor;
  const selectedSizeSnapshot = selectedSize
    ? {
        ...selectedSize,
        price: activePrice,
        oldPrice: activeOldPrice,
        pricing: selectedVariantPricing?.pricing || selectedSize.pricing,
        inventory: activeInventory,
      }
    : null;
  const purchasableProduct = {
    ...product,
    price: activePrice,
    oldPrice: activeOldPrice,
    stock: availableStock,
    inventory: activeInventory || product.inventory,
    pricing: selectedVariantPricing?.pricing || product.pricing,
    variantId: optionalId(selectedSizeSnapshot?.id),
  };
  const isInCart = isProductInCart(purchasableProduct);

  const handleColorSelect = (variant) => {
    setLocalSelectedColor(variant);
    onColorChange?.(variant);
  };

  const handleAddToWishlist = () => {
    updateWishlist();
  };

  const updateWishlist = () => {
    if (isProductInCart(purchasableProduct)) {
      removeWishlistProduct(purchasableProduct);
      setIsWishlisted(false);
      showToast(`${product.name} is already in your cart`, "warning");
      return;
    }
    const result = toggleWishlistItem({
      ...purchasableProduct,
      selectedSize: selectedSizeSnapshot,
      selectedColor: currentColor,
    });
    setIsWishlisted(Boolean(result.added));
    showToast(result.added ? "Added to wishlist" : "Removed from wishlist");
  };

  const handleAddToCart = () => {
    if (needsVariantSelection) {
      showToast("Please select a variant.", "error");
      return;
    }
    if (isOutOfStock) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }
    if (lacksVetAccess) {
      showToast(
        "This product is available only for verified veterinarians.",
        "error",
      );
      navigate("/account/vet-verification");
      return;
    }
    const result = addToCart({
      ...purchasableProduct,
      quantity,
      selectedSize: selectedSizeSnapshot,
      selectedColor: currentColor,
    });
    if (result?.outOfStock) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }
    const packLabel = selectedSizeSnapshot?.label || selectedSizeSnapshot?.name;
    const addedMessage = packLabel ? `${product.name} — ${packLabel}` : product.name;
    showToast(
      result?.capped
        ? `Only ${result.limit} in stock — added the maximum available quantity of ${addedMessage}`
        : `${addedMessage} added to cart`,
      result?.capped ? "warning" : "success",
    );
  };

  const handleBuyNow = () => {
    if (needsVariantSelection) {
      showToast("Please select a variant.", "error");
      return;
    }
    if (isOutOfStock) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }
    if (lacksVetAccess) {
      showToast(
        "This product is available only for verified veterinarians.",
        "error",
      );
      navigate("/account/vet-verification");
      return;
    }
    startBuyNowCheckout({
      ...purchasableProduct,
      quantity,
      selectedSize: selectedSizeSnapshot,
      selectedColor: currentColor,
    });
    showToast(`${product.name} ready for checkout`);
    navigate("/checkout?buyNow=1");
  };

  const updateNewAddressField = (event) => {
    const { name, value } = event.target;
    setNewAddress((current) => ({ ...current, [name]: value }));
    if (addressErrors[name]) {
      setAddressErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const handleNewAddressCountry = (country) => {
    setNewAddress((current) => ({ ...current, country }));
    if (addressErrors.country) {
      setAddressErrors((current) => {
        const next = { ...current };
        delete next.country;
        return next;
      });
    }
  };

  const saveAutoOrderAddress = async () => {
    const normalized = trimFormValues(newAddress);
    const nextErrors = validateAutoAddress(normalized);
    if (Object.keys(nextErrors).length > 0) {
      setAddressErrors(nextErrors);
      showToast("Please fix the delivery address", "warning");
      return;
    }

    setSavingAddress(true);
    try {
      const nextAddresses = await accountApi.addAddress(normalized);
      setSavedAddresses(nextAddresses);
      const addedAddress = nextAddresses[nextAddresses.length - 1];
      if (addedAddress) {
        setShippingAddressIndex(String(addedAddress.index ?? nextAddresses.length - 1));
      }
      setNewAddress(EMPTY_AUTO_ADDRESS);
      setAddressErrors({});
      setAddressMode("saved");
      showToast("Delivery address added");
    } catch (error) {
      showToast(error?.response?.data?.message || "Could not save address", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCreateAutoOrder = async () => {
    if (!customer) {
      showToast("Please log in to create an auto order", "error");
      navigate("/login");
      return;
    }
    if (needsVariantSelection) {
      showToast("Please select a variant.", "error");
      return;
    }
    if (isOutOfStock) {
      showToast(`${product.name} is out of stock`, "error");
      return;
    }
    if (lacksVetAccess) {
      showToast(
        "This product is available only for verified veterinarians.",
        "error",
      );
      navigate("/account/vet-verification");
      return;
    }
    if (!firstOrderDate) {
      showToast("Choose the first Order placement date", "error");
      return;
    }
    if (shippingAddressIndex === "") {
      showToast("Choose a saved delivery address", "error");
      return;
    }

    setCreatingAutoOrder(true);
    try {
      await autoOrderApi.create({
        productId: product.id,
        variantId: selectedSizeSnapshot?.id || null,
        variantLabel: selectedSizeSnapshot?.label || null,
        quantity,
        frequencyValue,
        firstOrderDate,
        shippingAddressIndex: Number(shippingAddressIndex),
        autoRenew,
      });
      showToast("Auto order created");
      setAutoOrderOpen(false);
      navigate("/account/auto-orders");
    } catch (error) {
      showToast(
        error?.response?.data?.message || "Could not create auto order",
        "error",
      );
    } finally {
      setCreatingAutoOrder(false);
    }
  };

  return (
    <section className="min-w-0">
      {/* {product.badge && (
        <span className="inline-flex rounded-md bg-[#17345f] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
          {product.badge}
        </span>
      )} */}

      <p className="text-xs font-extrabold uppercase tracking-wide text-[#d9aa3d]">
        {product.brand ||
          (typeof product.category === "object"
            ? product.category?.name
            : product.category) ||
          "Best-Vet-Care"}
      </p>

      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-normal text-[#122a50] lg:text-[34px]">
        {product.name}
      </h1>

      {(compact || reviewsCount > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-[#122a50b2]">
          <StarRating rating={Number(avgRating)} />
          <span className="font-extrabold text-[#122a50]">{avgRating}</span>
          <span>
            ({reviewsCount} {reviewsCount === 1 ? "Review" : "Reviews"})
          </span>
        </div>
      )}

      {requiresVet && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-md bg-[#17345f] px-3 py-1 text-xs font-extrabold uppercase text-white">
            Verified Veterinarian Required
          </span>
          {lacksVetAccess && (
            <button
              type="button"
              onClick={() => navigate("/account/vet-verification")}
              className="text-xs font-extrabold text-[#d9aa3d] underline"
            >
              Apply for Verification
            </button>
          )}
        </div>
      )}

      <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-[#122a50]">
        {product.description}
      </p>

      {!compact && product.features && product.features.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 border-b border-[#17345f1a] pb-5 sm:grid-cols-4">
          {product.features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-2">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f8f1df] text-[#d9aa3d]">
                <CheckIcon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-xs font-extrabold text-[#122a50]">
                  {feature.title}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-4 text-[#122a50b2]">
                  {feature.text}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {product.colorVariants && product.colorVariants.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-extrabold text-[#122a50]">
            Color: <span>{currentColor?.label}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colorVariants.map((variant) => (
              <button
                key={variant.id || variant.label}
                type="button"
                className={`flex min-w-[104px] items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-300 ${
                  currentColor?.label === variant.label
                    ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f] shadow-sm"
                    : "border-[#17345f1a] bg-white text-[#122a50] hover:border-[#d9aa3d]"
                }`}
                onClick={() => handleColorSelect(variant)}
              >
                <span
                  className="h-5 w-5 flex-shrink-0 rounded-full border border-[#17345f1a]"
                  style={{ backgroundColor: variant.color || "#ffffff" }}
                />
                <span className="truncate text-sm font-extrabold">
                  {variant.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {product.sizes && product.sizes.length > 0 && !hasVariantTable && (
        <div className="mt-5">
          {hasStructuredVariants ? (
            <>
              <p className="text-sm font-extrabold text-[#122a50]">
                Size / Weight: <span>{selectedSizeLabel || "Select one"}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {sizeOptions.map((variant) => {
                  const label = getVariantSizeLabel(variant);
                  const candidate =
                    structuredVariants.find((item) => getVariantSizeLabel(item) === label && !item.disabled) ||
                    variant;
                  return (
                    <button
                      key={label}
                      type="button"
                      className={`min-w-[112px] rounded-lg border px-4 py-3 text-center transition-all duration-300 ${
                        selectedSizeLabel === label
                          ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f] shadow-sm"
                          : "border-[#17345f1a] bg-white text-[#122a50] hover:border-[#d9aa3d]"
                      } ${candidate.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                      disabled={candidate.disabled}
                      onClick={() => {
                        if (!candidate.disabled) setSelectedSize(candidate);
                      }}
                    >
                      <span className="block text-sm font-extrabold">{label}</span>
                    </button>
                  );
                })}
              </div>

              {doseOptions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-extrabold text-[#122a50]">
                    Dose / Pack: <span>{getVariantDoseLabel(selectedSize) || "Select one"}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {doseOptions.map((variant) => {
                      const doseLabel = getVariantDoseLabel(variant);
                      const candidate = structuredVariants.find(
                        (item) =>
                          getVariantSizeLabel(item) === selectedSizeLabel &&
                          getVariantDoseLabel(item) === doseLabel,
                      );
                      return (
                        <button
                          key={doseLabel}
                          type="button"
                          className={`min-w-[104px] rounded-lg border px-4 py-3 text-center transition-all duration-300 ${
                            selectedSize?.id === candidate?.id
                              ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f] shadow-sm"
                              : "border-[#17345f1a] bg-white text-[#122a50] hover:border-[#d9aa3d]"
                          } ${!candidate || candidate.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                          disabled={!candidate || candidate.disabled}
                          onClick={() => {
                            if (candidate && !candidate.disabled) setSelectedSize(candidate);
                          }}
                        >
                          <span className="block text-sm font-extrabold">{doseLabel}</span>
                          {candidate && <span className="mt-1 block text-xs font-bold">${candidate.price}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold text-[#122a50]">
                {product.optionLabel || "Size"}:{" "}
                <span>{selectedSize?.label || "Select one"}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size.label}
                    type="button"
                    className={`min-w-[88px] rounded-lg border px-4 py-3 text-center transition-all duration-300 ${
                      selectedSize?.label === size.label
                        ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f] shadow-sm"
                        : "border-[#17345f1a] bg-white text-[#122a50] hover:border-[#d9aa3d]"
                    } ${size.disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    disabled={size.disabled}
                    onClick={() => {
                      if (!size.disabled) setSelectedSize(size);
                    }}
                  >
                    <span className="block text-sm font-extrabold">
                      {size.label}
                    </span>
                    <span className="mt-1 block text-xs font-bold">
                      ${size.price}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {!compact && selectedSize?.sku && (
            <p className="mt-3 text-xs font-bold text-[#122a50b2]">
              SKU: <span className="font-extrabold text-[#122a50]">{selectedSize.sku}</span>
            </p>
          )}
          {!compact && selectedSize?.description && (
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-[#122a50b2]">
              {selectedSize.description}
            </p>
          )}
          {needsVariantSelection && (
            <p className="mt-2 text-xs font-extrabold text-red-600">
              Please select a variant.
            </p>
          )}
        </div>
      )}

      {hasVariantTable && (
        <div className="mt-6">
          <VariantPurchaseCard
            product={product}
            variant={variantTable}
            variantHref={null}
          />
        </div>
      )}

      {!hasVariantTable && !isOutOfStock && !needsVariantSelection && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-sm font-extrabold text-[#122a50]">
            Quantity:
          </span>
          <QuantitySelector
            quantity={quantity}
            onChange={setQuantity}
            max={availableStock}
          />
        </div>
      )}

      {!hasVariantTable && <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || needsVariantSelection || lacksVetAccess}
          className={`inline-flex h-12 items-center justify-center gap-3 rounded-lg px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.22)] transition-all duration-300 ${
            isOutOfStock || needsVariantSelection || lacksVetAccess
              ? "cursor-not-allowed bg-[#17345f]/40 shadow-none"
              : "bg-[#17345f] hover:-translate-y-0.5 hover:bg-[#d9aa3d] hover:shadow-xl"
          }`}
        >
          <CartIcon className="h-5 w-5" />
          {lacksVetAccess
            ? "Apply for Verification"
            : needsVariantSelection
              ? "Select Variant"
              : isOutOfStock
                ? "Unavailable"
                : "Add to Cart"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock || needsVariantSelection || lacksVetAccess}
          className={`inline-flex h-12 items-center justify-center gap-3 rounded-lg border px-6 text-sm font-extrabold transition-all duration-300 ${
            isOutOfStock || needsVariantSelection || lacksVetAccess
              ? "cursor-not-allowed border-[#17345f1a] text-[#122a50]/40"
              : "border-[#17345f] bg-white text-[#17345f] hover:-translate-y-0.5 hover:border-[#d9aa3d] hover:bg-[#f8f1df] hover:text-[#d9aa3d] hover:shadow-xl"
          }`}
        >
          <PawIcon className="h-5 w-5" />
          Buy Now
        </button>
      </div>}

      {!compact && !hasVariantTable && <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-extrabold text-[#122a50]">
        <button
          type="button"
          className={`inline-flex items-center gap-2 transition-colors ${
            isInCart
              ? "cursor-not-allowed text-[#122a50]/45"
              : isWishlisted
                ? "text-[#EF4444]"
                : "hover:text-[#d9aa3d]"
          }`}
          onClick={handleAddToWishlist}
          disabled={isInCart}
          aria-pressed={isWishlisted}
          title={isInCart ? "Already in cart" : undefined}
        >
          <HeartIcon
            className={`h-5 w-5 ${isWishlisted ? "fill-[#EF4444]" : ""}`}
          />
          {isInCart
            ? "Already in Cart"
            : isWishlisted
              ? "Saved to Wishlist"
              : "Add to Wishlist"}
        </button>
        {/* <button
          type="button"
          className="inline-flex items-center gap-2 transition-colors hover:text-[#d9aa3d]"
          onClick={handleShare}
        >
          <ShareIcon className="h-5 w-5" />
          Share
        </button> */}
      </div>}

      {!compact && featureFlags.autoOrder && <div className="mt-6 rounded-lg border border-[#17345f1a] bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#122a50]">
              Auto Reorder
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#122a50b2]">
              Schedule repeat deliveries for products you buy regularly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoOrderOpen((open) => !open)}
            disabled={isOutOfStock || needsVariantSelection || lacksVetAccess}
            className="rounded-lg bg-[#17345f] px-4 py-2 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d] disabled:cursor-not-allowed disabled:bg-[#17345f]/40"
          >
            {autoOrderOpen ? "Close" : "Create Auto Reorder"}
          </button>
        </div>

        {autoOrderOpen && (
          <div className="mt-4 grid gap-4 border-t border-[#17345f1a] pt-4 sm:grid-cols-2">
            <label className="text-sm font-extrabold text-[#122a50]">
              First Order placement
              <input
                type="date"
                value={firstOrderDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setFirstOrderDate(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-bold text-[#122a50] outline-none focus:border-[#d9aa3d]"
              />
            </label>
            <label className="text-sm font-extrabold text-[#122a50]">
              Repeat
              <select
                value={frequencyValue}
                onChange={(event) =>
                  setFrequencyValue(Number(event.target.value))
                }
                className="mt-2 h-11 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-bold text-[#122a50] outline-none focus:border-[#d9aa3d]"
              >
                <option value={7}>Every 7 days</option>
                <option value={15}>Every 15 days</option>
                <option value={30}>Every 30 days</option>
                <option value={60}>Every 60 days</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-[#122a50]">
                  Delivery Address
                </span>
                <div className="inline-flex rounded-lg border border-[#17345f1a] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setAddressMode("saved")}
                    disabled={savedAddresses.length === 0}
                    className={`h-8 rounded-md px-3 text-xs font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      addressMode === "saved"
                        ? "bg-[#17345f] text-white"
                        : "text-[#122a50] hover:bg-[#f8f1df]"
                    }`}
                  >
                    Saved
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressMode("new")}
                    className={`h-8 rounded-md px-3 text-xs font-extrabold transition-colors ${
                      addressMode === "new"
                        ? "bg-[#17345f] text-white"
                        : "text-[#122a50] hover:bg-[#f8f1df]"
                    }`}
                  >
                    Add New
                  </button>
                </div>
              </div>

              {addressMode === "saved" ? (
                <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-[#17345f1a] bg-white p-2">
                  {savedAddresses.length === 0 ? (
                    <div className="rounded-lg bg-[#fffdf7] px-3 py-4 text-sm font-semibold text-[#122a50b2]">
                      Add a delivery address first.
                    </div>
                  ) : (
                    savedAddresses.map((address) => {
                      const value = String(address.index);
                      const selected = shippingAddressIndex === value;
                      return (
                        <button
                          key={address.index}
                          type="button"
                          onClick={() => setShippingAddressIndex(value)}
                          className={`flex w-full min-w-0 items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                            selected
                              ? "border-[#d9aa3d] bg-[#fff8e8]"
                              : "border-[#17345f12] bg-white hover:bg-[#fffdf7]"
                          }`}
                        >
                          <span
                            className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-[#17345f] bg-[#17345f]"
                                : "border-[#17345f66] bg-white"
                            }`}
                          >
                            {selected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 break-words text-sm font-bold leading-5 text-[#122a50] [overflow-wrap:anywhere]">
                            {formatAutoAddressOption(address)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-[#17345f1a] bg-[#fffdf7] p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {AUTO_ADDRESS_FIELDS.map(({ key, label, maxLength }) => (
                      <label key={key} className={key === "address" ? "sm:col-span-2" : ""}>
                        <span className="text-xs font-extrabold uppercase text-[#122a50b2]">
                          {label} *
                        </span>
                        <input
                            name={key}
                            value={newAddress[key]}
                            maxLength={maxLength}
                            onChange={updateNewAddressField}
                            className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d] ${
                              addressErrors[key]
                                ? "border-red-300 bg-red-50"
                                : "border-[#17345f1a] bg-white"
                            }`}
                          />
                        {addressErrors[key] && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            {addressErrors[key]}
                          </p>
                        )}
                      </label>
                    ))}
                    <div className="sm:col-span-2">
                      <span className="text-xs font-extrabold uppercase text-[#122a50b2]">
                        Country *
                      </span>
                      <CountryDropdown
                        value={newAddress.country}
                        onChange={handleNewAddressCountry}
                        className={`mt-1 ${addressErrors.country ? "border-red-300 bg-red-50" : ""}`}
                      />
                      {addressErrors.country && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {addressErrors.country}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={saveAutoOrderAddress}
                    disabled={savingAddress}
                    className="mt-3 h-10 rounded-lg border border-[#17345f] px-4 text-sm font-extrabold text-[#17345f] transition-colors hover:bg-[#17345f] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAddress ? "Saving..." : "Save Delivery Address"}
                  </button>
                </div>
              )}
            </div>
            <label className="flex items-center gap-3 text-sm font-extrabold text-[#122a50]">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(event) => setAutoRenew(event.target.checked)}
                className="h-4 w-4 accent-[#17345f]"
              />
              Auto renew
            </label>
            <p className="text-sm font-semibold text-[#122a50b2] sm:col-span-2">
              Automatic payment requires a saved Stripe payment authorization.
              If it is not configured, the schedule will be created but due runs
              will wait for payment setup.
            </p>
            <button
              type="button"
              onClick={handleCreateAutoOrder}
              disabled={creatingAutoOrder || savedAddresses.length === 0}
              className="h-11 rounded-lg bg-[#d9aa3d] px-5 text-sm font-extrabold text-[#17345f] transition-colors hover:bg-[#17345f] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
            >
              {creatingAutoOrder ? "Creating..." : "Create Auto Reorder"}
            </button>
          </div>
        )}
      </div>}
    </section>
  );
};

export default ProductInfo;
