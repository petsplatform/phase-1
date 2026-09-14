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
  Layers,
} from "lucide-react";
import { reviewApi } from "../../api/reviewApi";
import { isFamilyProduct } from "../../utils/productUtils";
import { formatProductRichContent } from "../../utils/htmlUtils";

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

function getDescriptionContent(product, activeVariant) {
  const bullets = normalizeContent(
    getFirstPresent(activeVariant, descriptionBulletFields) ||
      getFirstPresent(product, descriptionBulletFields),
  ).map((item) => item.text);

  const rawText =
    activeVariant?.description ||
    activeVariant?.shortDescription ||
    activeVariant?.details ||
    product?.description ||
    product?.shortDescription ||
    product?.productDetails?.overview ||
    product?.overview ||
    "";

  return {
    text: rawText,
    bullets,
  };
}

function EmptyTab({ label }) {
  return (
    <p className="max-w-[500px] text-[13px] font-medium leading-relaxed text-muted">
      {label} information is not available for this product.
    </p>
  );
}

function DetailContent({ items, emptyLabel }) {
  if (!items.length) return <EmptyTab label={emptyLabel} />;

  return (
    <div className="space-y-3 text-[13px] font-medium leading-relaxed text-muted">
      {items.map((item, index) => (
        <p key={`${item.title || "item"}-${index}`}>
          {item.title && (
            <>
              <span className="font-bold text-textMain">
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
  selectedOption,
  onSelectOption,
  activeFamilyVariant: propActiveFamilyVariant,
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
      if (match) return match.id;
    }
    return familyVariants[0]?.id || null;
  });

  useEffect(() => {
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
              .includes(String(fv.name).toLowerCase())),
      );
      if (match) {
        setActiveFamilyId(match.id);
      }
    }
  }, [isFamily, selectedOption, familyVariants]);

  const activeFamilyVariant = useMemo(() => {
    if (propActiveFamilyVariant) return propActiveFamilyVariant;
    if (!isFamily || !familyVariants.length) return null;
    return (
      familyVariants.find((fv) => fv.id === activeFamilyId) || familyVariants[0]
    );
  }, [propActiveFamilyVariant, isFamily, familyVariants, activeFamilyId]);

  const richContent = useMemo(() => {
    const parentRich =
      product?.productDetails?.content ||
      product?.productDetails?.overview ||
      product?.content ||
      product?.overview ||
      product?.longDescription ||
      product?.description ||
      product?.shortDescription;

    if (isFamily && activeFamilyVariant) {
      const rawFamily =
        activeFamilyVariant.content ||
        activeFamilyVariant.overview ||
        activeFamilyVariant.description ||
        activeFamilyVariant.shortDescription;

      const formatted = formatProductRichContent(rawFamily, {
        ...product,
        ...activeFamilyVariant,
        parentContent: parentRich,
      });

      if (formatted) return formatted;
    }

    return formatProductRichContent(parentRich, product);
  }, [isFamily, activeFamilyVariant, product]);

  const descriptionContent = useMemo(() => {
    return getDescriptionContent(product, activeFamilyVariant);
  }, [product, activeFamilyVariant]);
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
          setReviews(data || []);
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
    >
      <div className="flex flex-wrap gap-1 border-b border-borderSoft">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-bold transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-secondary text-textMain"
                : "text-muted hover:text-textMain"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.id === "reviews" && (
              <span className="ml-1 rounded-full bg-sageLight px-2 py-0.5 text-[11px] font-extrabold text-secondaryDark">
                {totalReviews}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {activeTab === "description" && (
          <div className="space-y-6">
            {richContent ? (
              <div
                className="variant-rich-text prose max-w-none text-[13px] leading-relaxed text-textMain"
                dangerouslySetInnerHTML={{ __html: richContent }}
              />
            ) : descriptionContent.text ? (
              descriptionContent.text.includes("<") ? (
                <div
                  className="variant-rich-text prose max-w-none text-[13px] leading-relaxed text-textMain"
                  dangerouslySetInnerHTML={{ __html: descriptionContent.text }}
                />
              ) : (
                <p className="max-w-2xl text-[14px] font-semibold leading-relaxed text-muted">
                  {descriptionContent.text}
                </p>
              )
            ) : (
              <EmptyTab label="Description" />
            )}

            {descriptionContent.bullets.length > 0 && (
              <ul className="mt-5 space-y-2.5">
                {descriptionContent.bullets.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <CheckCircle
                      size={16}
                      className="shrink-0 text-secondary"
                    />
                    <span className="text-[13px] font-semibold text-textMain">
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
            {/* Reviews Summary */}
            {totalReviews > 0 && avgRating && (
              <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-borderSoft bg-sageLight/30 p-4 sm:p-6">
                <div className="text-center">
                  <span className="font-display text-[36px] font-extrabold text-textMain">
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
                            : "text-gray-300 fill-transparent"
                        }
                      />
                    ))}
                  </div>
                  <span className="mt-1 block text-[12px] font-semibold text-muted">
                    Based on {totalReviews} review
                    {totalReviews === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            )}

            {/* Reviews List */}
            {loadingReviews ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-sageLight/50"
                  />
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid gap-4">
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
                      className="rounded-xl border border-borderSoft bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="grid size-8 place-items-center rounded-full bg-sageLight text-secondaryDark">
                            <User size={16} />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-extrabold text-textMain">
                              {reviewerName}
                            </h4>
                            {revDate && (
                              <p className="text-[11px] font-semibold text-muted">
                                {revDate}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= revRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300 fill-transparent"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-[13px] font-medium leading-relaxed text-textMain">
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
              <div className="rounded-xl border border-dashed border-borderSoft p-6 text-center">
                <p className="text-[13px] font-semibold text-muted">
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
