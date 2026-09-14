import { useState } from "react";
import { StarIcon } from "./common/HeaderIcons";
import { sanitizeRichTextHtml } from "../utils/sanitizeRichText";

const ProductTabs = ({ product, reviews = [] }) => {
  const [activeTab, setActiveTab] = useState("Description");
  const productDetails = product?.productDetails && typeof product.productDetails === "object" ? product.productDetails : {};
  const richDetailsContent = productDetails.content || product.parentContent;

  const tabs = [
    { id: "Description", label: "Product Details", hasContent: !!(richDetailsContent || product.longDescription || product.description || (product.descriptionBullets && product.descriptionBullets.length > 0)) },
    { id: "Reviews", label: `Reviews${reviews.length ? ` (${reviews.length})` : ""}`, hasContent: true },
    { id: "Feeding Guide", label: "Feeding Guide", hasContent: !!(product.feedingGuide && product.feedingGuide.length > 0) },
    { id: "Shipping", label: "Shipping", hasContent: !!product.shippingReturns },
    { id: "Returns", label: "Returns", hasContent: !!product.returnPolicies },
    { id: "Q&A", label: "Q&A", hasContent: !!(product.qa && product.qa.length > 0) }
  ].filter(tab => tab.hasContent);

  const availableTabIds = tabs.map(tab => tab.id);

  // If the currently active tab is hidden, switch to the first available one
  if (!availableTabIds.includes(activeTab) && availableTabIds.length > 0) {
    setActiveTab(availableTabIds[0]);
  }

  const renderStars = (rating) => (
    <span className="flex items-center gap-0.5 text-[#d9aa3d]">
      {Array.from({ length: 5 }).map((_, idx) => (
        <StarIcon
          key={idx}
          className={`h-4 w-4 ${idx < Math.round(rating) ? "fill-[#d9aa3d] text-[#d9aa3d]" : "fill-[#17345f1a] text-[#17345f1a]"}`}
        />
      ))}
    </span>
  );

  const content = {
    Description: (
      <div>
        {richDetailsContent ? (
          <div
            className="prose prose-sm max-w-none overflow-x-auto text-[#122a50] [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-extrabold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-extrabold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_table]:my-4 [&_table]:w-full [&_table]:min-w-[720px] [&_table]:border-collapse [&_td]:border [&_td]:border-[#17345f1a] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[#17345f1a] [&_th]:bg-[#f8f1df] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(richDetailsContent) }}
          />
        ) : (
          <p className="text-sm font-semibold leading-7 text-[#122a50]">
            {product.longDescription || product.description}
          </p>
        )}
        {product.descriptionBullets && product.descriptionBullets.length > 0 && (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm font-semibold leading-6 text-[#122a50]">
            {product.descriptionBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    ),
    Reviews: (
      <div>
        {reviews.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-[#17345f1a] pb-4">
              <span className="text-4xl font-extrabold text-[#122a50]">
                {(reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1)}
              </span>
              <div>
                {renderStars(reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length)}
                <p className="mt-1 text-xs font-semibold text-[#122a50b2]">
                  Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {reviews.map((rev, index) => {
                const reviewerName = rev.userName || rev.customerName || rev.user?.name || rev.name || "Customer";
                const dateStr = rev.createdAt || rev.date ? new Date(rev.createdAt || rev.date).toLocaleDateString() : null;

                return (
                  <div key={rev.id || rev._id || index} className="rounded-xl border border-[#17345f1a] bg-[#fffdf7] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#122a50]">{reviewerName}</span>
                        <span className="rounded-full bg-[#f8f1df] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#17345f]">
                          Verified Purchase
                        </span>
                      </div>
                      {dateStr && <span className="text-xs font-semibold text-[#122a50b2]">{dateStr}</span>}
                    </div>
                    <div className="mt-2">
                      {renderStars(rev.rating || 5)}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50]">
                      {rev.comment || rev.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm font-bold text-[#122a50b2]">No reviews yet for this product.</p>
            <p className="mt-1 text-xs font-semibold text-[#122a5070]">Delivered orders can submit reviews from My Orders page.</p>
          </div>
        )}
      </div>
    ),
    "Feeding Guide": (
      <div>
        {product.feedingGuide && product.feedingGuide.length > 0 && (
          <ul className="list-disc space-y-1.5 pl-5 text-sm font-semibold leading-6 text-[#122a50]">
            {product.feedingGuide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    ),
    Shipping: (
      <div>
        <p className="text-sm font-semibold leading-7 text-[#122a50] whitespace-pre-wrap">
          {product.shippingReturns}
        </p>
      </div>
    ),
    Returns: (
      <div>
        <p className="text-sm font-semibold leading-7 text-[#122a50] whitespace-pre-wrap">
          {product.returnPolicies}
        </p>
      </div>
    ),
    "Q&A": (
      <div className="space-y-4">
        {product.qa && product.qa.map((qaItem, i) => (
          <div key={i} className="border-b pb-4 last:border-0">
             <p className="text-sm font-bold text-[#122a50]">Q: {qaItem.question}</p>
             <p className="text-sm font-semibold text-[#122a50b2]">A: {qaItem.answer}</p>
          </div>
        ))}
      </div>
    ),
  };

  if (tabs.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="overflow-x-auto border-b border-[#17345f1a]">
        <div className="flex min-w-max items-center gap-8">
          {tabs.map((tab) => {
            const isTabActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={`relative pb-3 text-sm font-extrabold transition-colors ${
                  isTabActive
                    ? "text-[#17345f]"
                    : "text-[#122a50] hover:text-[#d9aa3d]"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-[#d9aa3d] transition-all duration-300 ${
                    isTabActive ? "w-full" : "w-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
          {content[activeTab] || content.Description}
        </div>
      </div>
    </section>
  );
};

export default ProductTabs;


