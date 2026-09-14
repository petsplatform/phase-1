import { useState, useEffect, useMemo } from "react";
import {
  Info,
  Truck,
  Undo2,
  ShieldCheck,
  Star,
  MessageSquare,
  BadgeCheck,
  ThumbsUp,
} from "lucide-react";
import { reviewApi } from "../../api/reviewApi";
import { isFamilyProduct } from "../../utils/productUtils";
import {
  formatProductRichContent,
  isSlugLike,
  hasMeaningfulContent,
} from "../../utils/htmlUtils";

const tabFieldMap = {
  shipping: [
    "shipping",
    "shippingInfo",
    "shippingInformation",
    "shippingDescription",
    "shippingPolicy",
  ],
  return: [
    "return",
    "returns",
    "returnInfo",
    "returnsInfo",
    "returnPolicy",
    "returnsPolicy",
    "refundPolicy",
  ],
};

const descriptionBulletFields = [
  "features",
  "highlights",
  "benefits",
  "keyFeatures",
  "bulletPoints",
];

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

function normalizeTabContent(value) {
  if (!isPresent(value)) return [];

  if (Array.isArray(value)) {
    return value.flatMap(normalizeTabContent);
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
        const lines = normalizeTabContent(itemValue);
        return lines.map((line) => ({
          ...line,
          title: line.title || labelFromKey(key),
        }));
      });
  }

  return splitText(value).map((text) => ({ text }));
}

function EmptyContent({ label }) {
  return (
    <p className="text-[15px] font-medium leading-7 text-charcoal-text">
      {label} information is not available for this product.
    </p>
  );
}

function DetailCards({ items, emptyLabel }) {
  if (!items.length) return <EmptyContent label={emptyLabel} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <div
          key={`${item.title || "detail"}-${index}`}
          className="flex gap-3 bg-white p-4 rounded-xl border border-[#e7ddd0]"
        >
          <span className="flex h-6 w-6 mt-0.5 shrink-0 items-center justify-center rounded-full bg-[#edfaf3] text-[#176b59]">
            <ShieldCheck size={14} />
          </span>
          <div>
            {item.title && (
              <h4 className="text-xs font-bold text-on-background leading-tight">
                {item.title}
              </h4>
            )}
            <p className="text-xs text-charcoal-text mt-1.5 leading-relaxed">
              {item.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StarRating({ rating }) {
  const num = Math.round(Number(rating || 5));
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= num
              ? "fill-amber-400 text-amber-500"
              : "fill-none text-neutral-300"
          }
        />
      ))}
    </span>
  );
}

export default function ProductTabs({
  product = {},
  selectedOption = "",
  onSelectOption,
  activeFamilyVariant: propActiveFamilyVariant,
}) {
  const [activeTab, setActiveTab] = useState("description");

  const isFamily =
    isFamilyProduct(product) &&
    Array.isArray(product?.familyVariants) &&
    product.familyVariants.length > 0;
  const familyVariants = isFamily ? product.familyVariants : [];

  const activeFamilyVariant = useMemo(() => {
    if (propActiveFamilyVariant) return propActiveFamilyVariant;
    if (!isFamily || !familyVariants.length) return null;
    if (selectedOption) {
      const match = familyVariants.find(
        (fv) =>
          fv.id === selectedOption ||
          fv.slug === selectedOption ||
          fv.name === selectedOption ||
          fv.displayName === selectedOption ||
          (fv.name &&
            String(selectedOption)
              .toLowerCase()
              .includes(String(fv.name).toLowerCase())),
      );
      if (match) return match;
    }
    return familyVariants[0] || null;
  }, [propActiveFamilyVariant, isFamily, familyVariants, selectedOption]);

  const richContent = useMemo(() => {
    // 1. If it's a family product and active family variant has its own genuine content, display that
    const variantContent = (isFamily && hasMeaningfulContent(activeFamilyVariant?.content))
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
  }, [isFamily, activeFamilyVariant, product]);

  const descriptionText = useMemo(() => {
    const raw = isFamily
      ? (activeFamilyVariant?.description || activeFamilyVariant?.longDescription || product?.description || product?.longDescription || product?.productDetails?.overview || "")
      : (product?.description || product?.longDescription || product?.productDetails?.overview || "");

    if (!raw || isSlugLike(raw)) return "";
    return raw;
  }, [isFamily, activeFamilyVariant, product]);
  const descriptionBullets = normalizeTabContent(
    getFirstPresent(product, descriptionBulletFields),
  );
  const shippingDetails = normalizeTabContent(
    getFirstPresent(product, tabFieldMap.shipping),
  );
  const returnDetails = normalizeTabContent(
    getFirstPresent(product, tabFieldMap.return),
  );

  const [apiReviews, setApiReviews] = useState([]);

  useEffect(() => {
    if (!product.id) return;
    let isMounted = true;
    reviewApi
      .getProductReviews(product.id)
      .then((reviews) => {
        if (isMounted) setApiReviews(Array.isArray(reviews) ? reviews : []);
      })
      .catch(() => {
        if (isMounted) setApiReviews([]);
      });
    return () => { isMounted = false; };
  }, [product.id]);

  const localReviews = (() => {
    try {
      const saved = localStorage.getItem("budget_petshop_reviewed_items");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Object.values(parsed).filter(
        (rev) =>
          String(rev.itemId) === String(product.id) ||
          rev.productName?.toLowerCase() === (product.title || product.name)?.toLowerCase(),
      ).map((rev) => ({
        author: rev.author || "Verified Buyer",
        date: rev.date || "Recently",
        rating: String(rev.rating || 5),
        title: rev.title || "Verified Customer Review",
        comment: rev.reviewText || rev.comment || "",
        verified: true,
        helpfulCount: 1,
      }));
    } catch {
      return [];
    }
  })();

  const allCustomerReviews = [...localReviews, ...apiReviews];

  const tabs = [
    { id: "description", label: "Description", icon: Info },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "return", label: "Return", icon: Undo2 },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  return (
    <section className="py-8">
      {/* Tab Navigation Headers */}
      <div className="flex flex-col gap-4 border-b border-[#eee4d6] pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8a72c7]">
            Product Details
          </p>
          <h2 className="mt-2 text-xl text-on-background font-bold">
            Everything you need to know
          </h2>
        </div>

        <div className="flex gap-1.5 overflow-x-auto rounded-xl bg-[#f8f6f2] p-1 shadow-sm shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-[#8a72c7] text-white shadow-md"
                    : "hover:bg-white hover:text-[#8a72c7] text-charcoal-text"
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.id === "reviews" && allCustomerReviews.length > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-[#8a72c7]/15 text-[#8a72c7]"
                    }`}
                  >
                    {allCustomerReviews.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="mt-8">
        {/* Description Tab */}
        {activeTab === "description" && (
          <div className="rounded-[14px] bg-[#fcfaf7] p-6 ring-1 ring-[#eee4d6] border border-[#f4efe6] flex flex-col justify-between">
            <div className="space-y-5">
              <h3 className="text-lg font-extrabold text-on-background flex items-center gap-2">
                <Info size={18} className="text-[#8a72c7]" />
                Product Overview
              </h3>


              {richContent ? (
                <div
                  className="variant-rich-text prose max-w-none text-on-background text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: richContent }}
                />
              ) : descriptionText ? (
                <p className="text-[16px] font-medium leading-7 text-charcoal-text">
                  {descriptionText}
                </p>
              ) : (
                <EmptyContent label="Description" />
              )}

              {descriptionBullets.length > 0 && (
                <div className="mt-5">
                  <DetailCards
                    items={descriptionBullets}
                    emptyLabel="Description"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === "shipping" && (
          <div className="rounded-[14px] bg-[#fcfaf7] p-6 ring-1 ring-[#eee4d6] border border-[#f4efe6]">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f2eb] text-[#8a72c7]">
                <Truck size={16} />
              </span>
              <h3 className="text-lg font-extrabold text-on-background">
                Shipping Methods & Rates
              </h3>
            </div>

            <DetailCards items={shippingDetails} emptyLabel="Shipping" />
          </div>
        )}

        {/* Return Tab */}
        {activeTab === "return" && (
          <div className="rounded-[14px] bg-[#fcfaf7] p-6 ring-1 ring-[#eee4d6] border border-[#f4efe6] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f2eb] text-[#8a72c7]">
                  <Undo2 size={16} />
                </span>
                <h3 className="text-lg font-extrabold text-on-background">
                  Hassle-Free Returns & Refunds
                </h3>
              </div>

              <DetailCards items={returnDetails} emptyLabel="Return" />
            </div>
          </div>
        )}

        {/* Customer Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="rounded-[14px] bg-[#fcfaf7] p-6 ring-1 ring-[#eee4d6] border border-[#f4efe6]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#eee4d6] mb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8a72c7]/10 text-[#8a72c7]">
                  <Star size={20} className="fill-[#8a72c7] text-[#8a72c7]" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-on-background">
                    Customer Reviews
                  </h3>
                  <p className="text-xs text-charcoal-text mt-0.5">
                    Showing verified feedback from real pet parents.
                  </p>
                </div>
              </div>
            </div>

            {allCustomerReviews.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {allCustomerReviews.map((rev, index) => (
                  <article
                    key={index}
                    className="rounded-2xl bg-white p-5 ring-1 ring-[#eee4d6] border border-[#f4efe6] flex flex-col justify-between hover:shadow-md transition duration-200"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8a72c7] text-sm font-black text-white shadow-xs">
                          {(rev.author || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-background leading-tight">
                            {rev.author}
                          </p>
                          <p className="text-[11px] text-charcoal-text mt-0.5">
                            {rev.date}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3.5">
                        <StarRating rating={rev.rating} />
                      </div>

                      <p className="mt-2.5 text-xs leading-relaxed text-charcoal-text font-medium">
                        "{rev.comment}"
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white py-12 px-4 text-center border border-[#eee4d6]">
                <MessageSquare
                  className="mx-auto text-[#d6cec0] mb-3"
                  size={36}
                />
                <h4 className="text-sm font-bold text-on-background">
                  No Customer Reviews Yet
                </h4>
                <p className="text-xs text-charcoal-text mt-1 max-w-xs mx-auto">
                  Be the first customer to leave a review after purchasing this
                  product!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
