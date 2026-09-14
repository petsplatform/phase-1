import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  FileText,
  MessageSquare,
  RotateCcw,
  Star,
  Truck,
  User,
} from "lucide-react";
import { reviewApi } from "../../api/reviewApi";
import { formatProductRichContent } from "../../utils/htmlUtils";
import { isFamilyProduct } from "../../utils/productUtils";

const tabs = [
  { id: "description", label: "Description", icon: FileText },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "returns", label: "Returns", icon: RotateCcw },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
];

const tabFieldMap = {
  shipping: [
    "shippingReturns",
    "shipping",
    "shippingInfo",
    "shippingInformation",
    "shippingDescription",
    "shippingPolicy",
  ],
  returns: [
    "returnPolicies",
    "returns",
    "return",
    "returnsInfo",
    "returnInfo",
    "returnsPolicy",
    "returnPolicy",
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

function normalizeContent(value) {
  if (!isPresent(value)) return [];

  if (Array.isArray(value)) {
    return value.flatMap(normalizeContent);
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
        const lines = normalizeContent(itemValue);
        return lines.map((line) => ({
          ...line,
          title: line.title || labelFromKey(key),
        }));
      });
  }

  return splitText(value).map((text) => ({ text }));
}

function getDescriptionContent(product) {
  const bullets = normalizeContent(
    getFirstPresent(product, descriptionBulletFields),
  ).map((item) => item.text);

  return {
    text: product?.description || product?.shortDescription || "",
    bullets,
  };
}

function EmptyTab({ label }) {
  return (
    <p className="max-w-[500px] text-xs font-sans font-medium leading-relaxed text-brand-muted">
      {label} information is not available for this product.
    </p>
  );
}

function DetailContent({ items, emptyLabel }) {
  if (!items.length) return <EmptyTab label={emptyLabel} />;

  return (
    <div className="space-y-3 text-xs sm:text-sm font-sans font-medium leading-relaxed text-brand-muted">
      {items.map((item, index) => (
        <p key={`${item.title || "item"}-${index}`}>
          {item.title && (
            <>
              <span className="font-heading font-black text-brand-text">
                {item.title}:
              </span>{" "}
            </>
          )}
          {item.text}
        </p>
      ))}
    </div>
  );
}

export default function ProductTabs({
  product,
  selectedOption = "",
  onSelectOption,
  activeFamilyVariant: propActiveFamilyVariant,
  activeFamilyId: propActiveFamilyId,
}) {
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const isFamily =
    isFamilyProduct(product) &&
    Array.isArray(product?.familyVariants) &&
    product.familyVariants.length > 0;
  const familyVariants = isFamily ? product.familyVariants : [];

  const [activeFamilyId, setActiveFamilyId] = useState(() => {
    if (propActiveFamilyId) return propActiveFamilyId;
    if (propActiveFamilyVariant?.id) return propActiveFamilyVariant.id;
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
              .includes(String(fv.name).toLowerCase())) ||
          (Array.isArray(fv.skus) &&
            fv.skus.some(
              (s) =>
                s.id === selectedOption ||
                s.sku === selectedOption ||
                String(
                  s.name || s.label || s.size || s.packLabel,
                ).toLowerCase() === String(selectedOption).toLowerCase(),
            )),
      );
      if (match) return match.id;
    }
    return familyVariants[0]?.id || null;
  });

  useEffect(() => {
    if (propActiveFamilyId) {
      setActiveFamilyId(propActiveFamilyId);
      return;
    }
    if (propActiveFamilyVariant?.id) {
      setActiveFamilyId(propActiveFamilyVariant.id);
      return;
    }
    if (isFamily && selectedOption && familyVariants.length) {
      const match = familyVariants.find(
        (fv) =>
          fv.id === selectedOption ||
          fv.slug === selectedOption ||
          fv.name === selectedOption ||
          fv.displayName === selectedOption ||
          (fv.name &&
            String(selectedOption)
              .toLowerCase()
              .includes(String(fv.name).toLowerCase())) ||
          (Array.isArray(fv.skus) &&
            fv.skus.some(
              (s) =>
                s.id === selectedOption ||
                s.sku === selectedOption ||
                String(
                  s.name || s.label || s.size || s.packLabel,
                ).toLowerCase() === String(selectedOption).toLowerCase(),
            )),
      );
      if (match) {
        setActiveFamilyId(match.id);
      }
    }
  }, [
    propActiveFamilyId,
    propActiveFamilyVariant,
    isFamily,
    selectedOption,
    familyVariants,
  ]);

  const activeFamilyVariant = useMemo(() => {
    if (!isFamily || !familyVariants.length) return null;
    if (
      propActiveFamilyVariant &&
      propActiveFamilyVariant.id === activeFamilyId
    ) {
      return propActiveFamilyVariant;
    }
    return (
      familyVariants.find((fv) => fv.id === activeFamilyId) || familyVariants[0]
    );
  }, [isFamily, familyVariants, activeFamilyId, propActiveFamilyVariant]);

  const richContent = useMemo(() => {
    if (isFamily && activeFamilyVariant) {
      // The default family description is always the product-level rich
      // Content field. Variant labels/descriptions should not replace it.
      return formatProductRichContent(null, product);
    }

    // For SINGLE (SIMPLE) products: display the single product's own content
    const rawSingle =
      product?.productDetails?.content ||
      product?.content ||
      product?.longDescription ||
      product?.description ||
      product?.shortDescription;
    return formatProductRichContent(rawSingle, product);
  }, [isFamily, activeFamilyVariant, product]);

  const descriptionContent = getDescriptionContent(product);
  const shippingContent = normalizeContent(
    getFirstPresent(product, tabFieldMap.shipping),
  );
  const returnsContent = normalizeContent(
    getFirstPresent(product, tabFieldMap.returns),
  );

  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;
    setLoadingReviews(true);

    reviewApi
      .getProductReviews(product.id)
      .then((data) => {
        if (isMounted) {
          setReviews(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (isMounted) setReviews([]);
      })
      .finally(() => {
        if (isMounted) setLoadingReviews(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? (
          reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0) /
          totalReviews
        ).toFixed(1)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="flex flex-wrap gap-1 border-b border-brand-border/60">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-heading font-black transition-colors relative ${
              activeTab === tab.id
                ? "border-b-2 border-brand-coral text-brand-coral"
                : "text-brand-muted hover:text-brand-text"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.id === "reviews" && (
              <span className="ml-1 rounded-full bg-brand-peach px-2 py-0.5 text-[10px] font-heading font-black text-brand-coral">
                {totalReviews}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pt-6 text-left">
        {activeTab === "description" && (
          <div className="space-y-6">
            {richContent ? (
              <div
                className="variant-rich-text text-xs sm:text-sm leading-relaxed text-brand-text"
                dangerouslySetInnerHTML={{ __html: richContent }}
              />
            ) : (
              <EmptyTab label="Description" />
            )}

            {descriptionContent.bullets.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {descriptionContent.bullets.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle
                      size={16}
                      className="shrink-0 text-brand-teal"
                    />
                    <span className="text-xs sm:text-sm font-heading font-bold text-brand-text">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "shipping" && (
          <DetailContent items={shippingContent} emptyLabel="Shipping" />
        )}

        {activeTab === "returns" && (
          <DetailContent items={returnsContent} emptyLabel="Returns" />
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Reviews Rating Summary Bar */}
            {totalReviews > 0 && avgRating && (
              <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-brand-border bg-brand-bg/40 p-5 sm:p-6">
                <div className="text-center">
                  <span className="font-heading text-3xl sm:text-4xl font-black text-brand-text">
                    {avgRating}
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= Math.round(Number(avgRating))
                            ? "fill-amber-400 text-amber-400"
                            : "text-brand-border fill-transparent"
                        }
                      />
                    ))}
                  </div>
                  <span className="mt-1 block text-xs font-heading font-bold text-brand-muted">
                    Based on {totalReviews} review
                    {totalReviews === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl bg-brand-border/30"
                  />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid gap-3.5">
                {reviews.map((rev, index) => {
                  const reviewerName =
                    rev.author ||
                    rev.user?.fullName ||
                    rev.user?.name ||
                    (rev.user?.firstName
                      ? `${rev.user.firstName} ${rev.user.lastName || ""}`.trim()
                      : null) ||
                    rev.userName ||
                    rev.customerName ||
                    rev.fullName ||
                    rev.name ||
                    (rev.user?.email ? rev.user.email.split("@")[0] : null) ||
                    (rev.email ? rev.email.split("@")[0] : null) ||
                    "Verified Customer";
                  const revRating = Number(rev.rating) || 5;
                  const revDate =
                    rev.date ||
                    (rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString()
                      : "");

                  return (
                    <div
                      key={rev.id || rev._id || index}
                      className="rounded-2xl border border-brand-border bg-white p-4 sm:p-5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 place-items-center rounded-full bg-brand-teal/10 text-brand-teal">
                            <User size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-heading font-black text-brand-text">
                              {reviewerName}
                            </h4>
                            {revDate && (
                              <p className="text-[11px] font-sans font-semibold text-brand-muted">
                                {revDate}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= revRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-brand-border fill-transparent"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-xs sm:text-sm font-sans font-medium leading-relaxed text-brand-text">
                        {rev.comment ||
                          rev.text ||
                          rev.content ||
                          "No comment provided."}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-border p-8 text-center bg-brand-bg/20">
                <Star size={24} className="mx-auto text-brand-muted/30" />
                <p className="mt-2 text-xs sm:text-sm font-heading font-bold text-brand-muted">
                  No reviews for this product yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
