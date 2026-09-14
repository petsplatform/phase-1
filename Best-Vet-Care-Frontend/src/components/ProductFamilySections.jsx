import { Link } from "react-router-dom";
import { useState } from "react";
import { CartIcon, StarIcon } from "./common/HeaderIcons";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { sanitizeRichTextHtml } from "../utils/sanitizeRichText";

const baseUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

export const formatImageUrl = (url) => {
  if (!url) return null;
  return String(url).startsWith("http")
    ? url
    : `${baseUrl}${String(url).startsWith("/") ? "" : "/"}${url}`;
};

export const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const splitPackLabel = (label) => {
  const value = String(label || "").trim();
  const plusParts = value.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean);
  const trailingPack = value.match(/^(.*?[A-Za-z])[\s-]*(\d+(?:\s*(?:tablets?|doses?|capsules?|packs?|count|ct))?)$/i);
  const parts = plusParts.length > 1
    ? plusParts
    : trailingPack
      ? [trailingPack[1].trim(), trailingPack[2].trim()]
      : [value];
  return {
    size: parts[0] || "—",
    pack: parts.slice(1).join(" + ") || "—",
  };
};

export const ProductRichText = ({ title, content }) => {
  if (!content) return null;
  return (
    <section className="mt-8 rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-extrabold text-[#122a50]">{title}</h2>
      <div className="mt-4 overflow-x-auto whitespace-pre-wrap text-sm font-semibold leading-7 text-[#122a50cc]">
        {String(content)}
      </div>
    </section>
  );
};

const RichContent = ({ html }) => {
  if (!html) return null;
  return (
    <div
      className="prose prose-sm max-w-none overflow-x-auto text-[#122a50cc] [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-extrabold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-extrabold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_table]:my-4 [&_table]:w-full [&_table]:min-w-[720px] [&_table]:border-collapse [&_td]:border [&_td]:border-[#17345f1a] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[#17345f1a] [&_th]:bg-[#f8f1df] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(html) }}
    />
  );
};

export const ProductSupportTabs = ({ product, reviews = [], detailsContent = null }) => {
  const [activeTab, setActiveTab] = useState("details");
  const tabs = [
    { id: "details", label: "Product Details" },
    { id: "shipping", label: "Shipping" },
    { id: "returns", label: "Returns" },
    { id: "reviews", label: `Reviews (${reviews.length || product?.reviewCount || 0})` },
  ];

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
      <div className="flex overflow-x-auto border-b border-[#17345f12] bg-[#fffdf7]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-fit px-5 py-4 text-sm font-extrabold transition-colors ${
              activeTab === tab.id
                ? "bg-white text-[#d9aa3d] shadow-[inset_0_-3px_0_#d9aa3d]"
                : "text-[#122a50b2] hover:text-[#122a50]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 text-sm font-semibold leading-7 text-[#122a50cc]">
        {activeTab === "details" && (
          <div className="space-y-4">
            {detailsContent}
            {!detailsContent && product?.description && <p>{product.description}</p>}
            {!detailsContent && !product?.description && <p>No product details available.</p>}
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="whitespace-pre-wrap">{product?.shippingReturns}</div>
        )}

        {activeTab === "returns" && (
          <div className="whitespace-pre-wrap">{product?.returnPolicies}</div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article key={review.id || `${review.customerName}-${review.createdAt}`} className="rounded-xl border border-[#17345f12] bg-[#fffdf7] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-extrabold text-[#122a50]">{review.customerName || review.name || "Customer"}</p>
                    <RatingLine rating={review.rating || 0} count={0} />
                  </div>
                  {(review.title || review.comment) && (
                    <p className="mt-2">{review.title || review.comment}</p>
                  )}
                  {review.title && review.comment && (
                    <p className="mt-1 text-[#122a50a6]">{review.comment}</p>
                  )}
                </article>
              ))
            ) : (
              <p>No reviews yet.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const DetailBlock = ({ title, children }) => (
  <section className="border-b border-[#17345f12] py-5 last:border-b-0">
    <h2 className="text-xl font-extrabold text-[#122a50]">{title}</h2>
    <div className="mt-3 text-sm font-semibold leading-7 text-[#122a50cc]">{children}</div>
  </section>
);

const DetailList = ({ items }) => (
  <ul className="grid gap-2 sm:grid-cols-2">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#d9aa3d]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const ProductVariantDetails = ({ product, variants = [], selectedVariant = null, embedded = false }) => {
  const visibleVariants = selectedVariant ? [selectedVariant] : variants;
  if (!product || visibleVariants.length === 0) return null;
  const productName = product.name || "This product";
  const details = product.productDetails && typeof product.productDetails === "object" ? product.productDetails : {};
  const richContent = selectedVariant?.content || details.content;
  const benefits = Array.isArray(details.benefits) ? details.benefits : [];
  const directions = Array.isArray(details.directions) ? details.directions : [];
  const faq = Array.isArray(details.faq)
    ? details.faq.filter((item) => item?.question || item?.answer)
    : [];
  const hasDetails = Boolean(
    richContent ||
      details.overview ||
      benefits.length > 0 ||
      directions.length > 0 ||
      details.ingredients ||
      details.safety ||
      faq.length > 0,
  );

  if (!hasDetails) return null;

  if (richContent) {
    const content = (
      <>
        <DetailBlock title={`${selectedVariant?.displayName || selectedVariant?.name || productName} Details`}>
          <RichContent html={richContent} />
        </DetailBlock>
      </>
    );

    if (embedded) return content;

    return (
      <div className="mt-8 rounded-2xl border border-[#17345f1a] bg-white px-5 py-2 shadow-sm">
        {content}
      </div>
    );
  }

  const content = (
    <>
      {details.overview && (
        <DetailBlock title={`${productName} Details`}>
          <p className="whitespace-pre-wrap">{details.overview}</p>
        </DetailBlock>
      )}

      {benefits.length > 0 && (
        <DetailBlock title="Key Benefits">
          <DetailList items={benefits} />
        </DetailBlock>
      )}

      {directions.length > 0 && (
        <DetailBlock title="How To Choose">
          <DetailList items={directions} />
        </DetailBlock>
      )}

      {details.ingredients && (
        <DetailBlock title="Ingredients / Composition">
          <p className="whitespace-pre-wrap">{details.ingredients}</p>
        </DetailBlock>
      )}

      {details.safety && (
        <DetailBlock title="Safety Information">
          <p className="whitespace-pre-wrap">{details.safety}</p>
        </DetailBlock>
      )}

      {faq.length > 0 && (
        <DetailBlock title="Frequently Asked Questions">
          <div className="grid gap-4">
            {faq.map((item, index) => (
            <div key={`${item.question || "faq"}-${index}`}>
              <h3 className="font-extrabold text-[#122a50]">{item.question}</h3>
              <p className="mt-1">{item.answer}</p>
            </div>
            ))}
          </div>
        </DetailBlock>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="mt-8 rounded-2xl border border-[#17345f1a] bg-white px-5 py-2 shadow-sm">
      {content}
    </div>
  );
};

export const RatingLine = ({ rating = 0, count = 0 }) => (
  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#122a50b2]">
    <span className="flex items-center gap-0.5 text-[#d9aa3d]">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={`h-4 w-4 ${index < Math.round(rating || 0) ? "fill-[#d9aa3d]" : "fill-[#17345f1a]"}`}
        />
      ))}
    </span>
    <span>{Number(rating || 0).toFixed(1)}</span>
    <span>({count || 0})</span>
  </div>
);

export const VariantPurchaseCard = ({ product, variant, variantHref }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [quantities, setQuantities] = useState({});
  const productSlug = product.slug || product.id;
  const detailsHref = variantHref === undefined
    ? `/products/${productSlug}/${variant.slug}`
    : variantHref;
  const activeSkus = (variant.skus || []).filter((sku) => sku.status !== "Inactive");
  const image = formatImageUrl(variant.image || activeSkus.find((sku) => sku.image)?.image) || "/images/img_product_item_image.png";

  const addSku = (sku) => {
    const quantity = Math.max(1, Math.min(Number(quantities[sku.id] || 1), Number(sku.stock || 0)));
    const result = addToCart({
      ...product,
      productId: product.id,
      name: product.name,
      image: formatImageUrl(sku.image || variant.image || product.image) || image,
      price: Number(sku.price || sku.salePrice || sku.regularPrice),
      oldPrice: Number(sku.regularPrice) > Number(sku.price || sku.salePrice || sku.regularPrice) ? Number(sku.regularPrice) : 0,
      stock: Number(sku.stock || 0),
      variantId: sku.id,
      variantLabel: variant.name,
      optionLabel: "Pack",
      quantity,
      selectedSize: {
        id: sku.id,
        label: sku.packLabel,
        sku: sku.sku,
        familyVariantId: variant.id,
        familyVariantName: variant.name,
        familyVariantSlug: variant.slug,
        price: Number(sku.price || sku.salePrice || sku.regularPrice),
        stock: Number(sku.stock || 0),
        image,
      },
    });
    showToast(result?.outOfStock ? `${product.name} — ${sku.packLabel} is out of stock` : `${product.name} — ${sku.packLabel} added to cart`, result?.outOfStock ? "error" : "success");
  };

  return (
    <article className="overflow-hidden rounded-xl border border-[#17345f1a] bg-white shadow-[0_10px_24px_rgba(18,42,80,0.06)]">
      {detailsHref ? (
        <Link
          to={detailsHref}
          className="block border-b border-[#17345f12] bg-[#f8f1df] px-4 py-3 text-base font-extrabold leading-5 text-[#122a50] hover:text-[#d9aa3d]"
        >
          {variant.displayName || variant.name}
        </Link>
      ) : (
        <div className="border-b border-[#17345f12] bg-[#f8f1df] px-4 py-3 text-base font-extrabold leading-5 text-[#122a50]">
          {variant.displayName || variant.name}
        </div>
      )}

      <div className="grid gap-4 px-4 py-5 sm:grid-cols-[150px_minmax(0,1fr)]">
        <div className="min-w-0">
          {detailsHref ? (
            <Link to={detailsHref} className="flex min-h-[150px] items-center justify-center rounded-lg bg-[#fffdf7] p-3">
              <img src={image} alt={variant.name} className="max-h-[135px] w-full max-w-[150px] object-contain" />
            </Link>
          ) : (
            <div className="flex min-h-[150px] items-center justify-center rounded-lg bg-[#fffdf7] p-3">
              <img src={image} alt={variant.name} className="max-h-[135px] w-full max-w-[150px] object-contain" />
            </div>
          )}
        </div>

        <div className="min-w-0 overflow-x-auto">
          <div className="min-w-[440px]">
            <div className="grid grid-cols-[minmax(120px,1fr)_minmax(90px,0.8fr)_64px_82px_92px_70px] border-b border-[#17345f1a] pb-3 text-xs font-extrabold text-[#122a50]">
              <span>Size</span>
              <span>Dose / Pack</span>
              <span className="text-center">QTY</span>
              <span className="text-center">Price</span>
              <span className="text-center">You Pay</span>
              <span />
            </div>
            {activeSkus.map((sku) => {
              const price = Number(sku.price || sku.salePrice || sku.regularPrice);
              const mrp = Number(sku.regularPrice || price);
              const out = Number(sku.stock || 0) <= 0;
              const { size, pack } = splitPackLabel(sku.packLabel);
              return (
                <div key={sku.id} className="grid grid-cols-[minmax(120px,1fr)_minmax(90px,0.8fr)_64px_82px_92px_70px] items-center border-b border-[#17345f0d] py-3 text-sm text-[#122a50] last:border-b-0">
                  <div className="font-semibold">{size}</div>
                  <div className="font-semibold text-center">{pack}</div>
                  <div className="text-center">
                    <select
                      value={quantities[sku.id] || 1}
                      disabled={out}
                      onChange={(event) => setQuantities((q) => ({ ...q, [sku.id]: Number(event.target.value) }))}
                      className="h-8 w-[50px] rounded-md border border-[#17345f26] bg-white px-2 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]"
                    >
                      {Array.from({ length: Math.min(10, Math.max(1, Number(sku.stock || 1))) }).map((_, index) => (
                        <option key={index + 1} value={index + 1}>{index + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="text-center text-xs font-semibold text-[#122a5080]">
                    {mrp > price ? <span className="line-through">{money(mrp)}</span> : <span>{money(mrp)}</span>}
                  </div>
                  <div className="text-center text-base font-extrabold text-[#d9aa3d]">{money(price)}</div>
                  <button type="button" disabled={out} onClick={() => addSku(sku)} className="inline-flex h-8 items-center justify-center rounded-lg bg-[#17345f] px-3 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(18,42,80,0.18)] transition hover:bg-[#d9aa3d] disabled:cursor-not-allowed disabled:bg-[#17345f]/35 disabled:shadow-none">
                    {out ? "Out" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
};
