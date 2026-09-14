import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Star,
  Truck,
  Package,
  FileText,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { getProductTotalStock, useProducts } from "../../context/ProductContext";
import { adminApi } from "../../lib/api";
import { sanitizeRichTextHtml } from "../../utils/sanitizeRichText";

function DetailList({ title, items }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-[var(--text-muted)]">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();

  const [product, setProduct] = useState(null);
  const [activeVariant, setActiveVariant] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedCapacity, setSelectedCapacity] = useState(null);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const found = products.find((p) => p.id === id);
    if (found) {
      const setProductData = (data) => {
        const normalized = {
          ...found,
          ...data,
          category: data.category?.name || data.category || found.category || "",
        };
        setProduct(normalized);
        setActiveVariant(normalized.colorVariants?.[0] || null);
        setSelectedCapacity(normalized.capacities?.[0] || null);
      };

      setProductData(found);
      adminApi.product(id).then(setProductData).catch(() => {});
    }
  }, [id, products]);

  if (!product)
    return (
      <div className="p-8 text-center text-gray-500">Loading product...</div>
    );

  // Generate some helper data if missing
  const images = (() => {
    if (!activeVariant) {
      const standardImages = [];
      if (product.mainImage || product.image)
        standardImages.push(product.mainImage || product.image);
      if (product.gallery && product.gallery.length > 0) {
        standardImages.push(...product.gallery);
      }
      return standardImages;
    }
    const variantImages = [];
    if (activeVariant.mainImage) variantImages.push(activeVariant.mainImage);
    if (activeVariant.gallery && activeVariant.gallery.length > 0) {
      variantImages.push(...activeVariant.gallery);
    }
    return variantImages;
  })();

  const activeCapacityVariant = product.optionVariants?.find(
    (v) =>
      v.label === selectedCapacity ||
      v.size === selectedCapacity ||
      v.weightRange === selectedCapacity,
  );
  const displayPrice = activeCapacityVariant?.price ?? product.price;
  const displayMrp =
    activeCapacityVariant?.regularPrice ?? activeCapacityVariant?.mrp ?? product.mrp;
  const totalStock = getProductTotalStock(product);
  const productDetails = product.productDetails && typeof product.productDetails === "object"
    ? product.productDetails
    : {};
  const hasStructuredDetails = Boolean(
    productDetails.content ||
      productDetails.overview ||
      productDetails.ingredients ||
      productDetails.safety ||
      productDetails.benefits?.length ||
      productDetails.directions?.length ||
      productDetails.faq?.length,
  );

  const tabs = [
    { id: "description", label: "Description", icon: FileText },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "returns", label: "Returns", icon: RotateCcw },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Breadcrumb / Back */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/products/list")}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[var(--primary)] transition-colors"
        >
          <ChevronLeft size={18} />
          Back to Products
        </button>
      </div>

      {/* Top Grid: Image Gallery & Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-8 mb-12">
        {/* Left Column: Image Gallery */}
        <div className="w-full min-w-0">
          <div className="flex flex-col-reverse md:flex-row gap-5">
            {/* Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:w-[64px] shrink-0 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white transition-colors ${
                    activeImageIdx === idx
                      ? "border-[var(--primary)]"
                      : "border-[var(--border-color)] hover:border-[var(--accent-gold)]"
                  }`}
                >
                  <img
                    src={img}
                    className="h-full w-full object-cover"
                    alt=""
                  />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative flex min-h-[300px] md:min-h-[430px] flex-1 items-center justify-center overflow-hidden rounded-2xl border bg-white"
              style={{
                borderColor: "var(--border-color)",
                boxShadow: "var(--admin-shadow)",
              }}
            >
              <span className="absolute left-4 top-4 z-10 rounded-xl bg-[var(--bg-soft)] px-4 py-1 text-[13px] font-extrabold text-[var(--primary)]">
                {images.length > 0 ? `${activeImageIdx + 1}/${images.length}` : "No image"}
              </span>
              {images.length > 0 ? (
                <img
                  src={images[activeImageIdx]}
                  className="max-h-[400px] w-auto max-w-full object-contain p-8 mix-blend-multiply"
                  alt="Product"
                />
              ) : (
                <span className="text-sm text-gray-400">No product image</span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Right Column: Product Info */}
        <div className="min-w-0 flex-1 space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold text-[var(--primary)] leading-tight tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-4xl font-black text-[var(--primary)]">
                ${Number(displayPrice).toLocaleString()}
              </span>
              {Number(displayMrp) > Number(displayPrice) && (
                <span className="text-xl font-bold text-gray-400 line-through decoration-red-400/50 decoration-2">
                  ${Number(displayMrp).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm font-medium leading-relaxed text-[var(--text-muted)] max-w-lg">
              {product.description}
          </p>

          <hr className="border-gray-100" />

          <div className="space-y-6">
            {/* Color Variant Selector */}
            {product.colorVariants && product.colorVariants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">
                    Color:{" "}
                    <span className="text-[var(--text-muted)]">
                      {activeVariant?.label}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colorVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setActiveVariant(v);
                        setActiveImageIdx(0);
                      }}
                      className={`relative flex h-14 w-14 items-center justify-center rounded-xl border-2 transition-all ${
                        activeVariant?.id === v.id
                          ? "border-[var(--primary)]"
                          : "border-transparent bg-white hover:border-[var(--border-color)]"
                      }`}
                      title={v.label}
                    >
                      <span
                        className="h-8 w-8 rounded-full border border-black/5 shadow-sm"
                        style={{ backgroundColor: v.color || "#ffffff" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Capacity Selector */}
            {product.capacities && product.capacities.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">
                    Package Size:{" "}
                    <span className="text-[var(--text-muted)]">
                      {selectedCapacity}
                    </span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.capacities.map((cap) => (
                    <button
                      key={cap}
                      onClick={() => setSelectedCapacity(cap)}
                      className={`min-w-[80px] px-5 py-2.5 text-sm font-bold border-2 rounded-xl transition-all ${
                        selectedCapacity === cap
                          ? "border-[var(--primary)] bg-[var(--bg-soft)] text-[var(--primary)]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[var(--primary)]"
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {product.optionVariants?.length > 0 && (
        <div className="mb-12 overflow-x-auto rounded-3xl border bg-[var(--card-bg)] p-6" style={{ borderColor: "var(--border-color)", boxShadow: "var(--admin-shadow)" }}>
          <h2 className="mb-4 text-lg font-bold text-[var(--primary)]">Product Variants</h2>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-3 py-2">Size / Weight</th>
                <th className="px-3 py-2">Dose / Pack</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Selling Price</th>
                <th className="px-3 py-2">MRP</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {product.optionVariants.map((variant) => (
                <tr key={variant.id || variant.label} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-3">{variant.size || variant.weightRange || variant.label || "—"}</td>
                  <td className="px-3 py-3">{variant.dose || variant.packLabel || "—"}</td>
                  <td className="px-3 py-3 font-mono text-xs">{variant.sku || "—"}</td>
                  <td className="px-3 py-3 font-semibold">${Number(variant.price || 0).toFixed(2)}</td>
                  <td className="px-3 py-3">${Number(variant.regularPrice ?? variant.mrp ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-3">{variant.stock ?? "—"}</td>
                  <td className="max-w-xs whitespace-pre-wrap px-3 py-3 text-[var(--text-muted)]">{variant.description || variant.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Grid: Tabs & Extra Details */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] lg:items-start">
        <div className="w-full min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <div className="flex flex-wrap gap-1 border-b border-[var(--border-color)]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-bold transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--primary)]"
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="pt-6 relative min-h-[200px]">
              <AnimatePresence mode="wait">
                {activeTab === "description" && (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {product.description && (
                      <p className="max-w-[500px] whitespace-pre-wrap text-[13px] font-medium leading-relaxed text-[var(--text-muted)]">
                        {product.description}
                      </p>
                    )}
                    {productDetails.content && (
                      <div
                        className="prose prose-sm mt-5 max-w-none text-[var(--text-muted)]"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeRichTextHtml(productDetails.content),
                        }}
                      />
                    )}
                    {productDetails.overview && (
                      <p className="mt-5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--text-muted)]">
                        {productDetails.overview}
                      </p>
                    )}
                    {productDetails.benefits?.length > 0 && (
                      <DetailList title="Benefits" items={productDetails.benefits} />
                    )}
                    {productDetails.directions?.length > 0 && (
                      <DetailList title="Directions" items={productDetails.directions} />
                    )}
                    {productDetails.ingredients && (
                      <DetailList title="Ingredients" items={[productDetails.ingredients]} />
                    )}
                    {productDetails.safety && (
                      <DetailList title="Safety" items={[productDetails.safety]} />
                    )}
                    {productDetails.faq?.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {productDetails.faq.map((item, index) => (
                          <div key={`${item.question || "faq"}-${index}`}>
                            <p className="font-bold text-gray-800">{item.question}</p>
                            <p className="mt-1 whitespace-pre-wrap text-[13px] text-[var(--text-muted)]">{item.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {!product.description && !hasStructuredDetails && (
                      <p className="text-[13px] text-[var(--text-muted)]">No description provided.</p>
                    )}
                  </motion.div>
                )}

                {activeTab === "shipping" && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {product.shippingReturns ? (
                      <p className="max-w-[500px] text-[13px] font-medium leading-relaxed text-[var(--text-muted)]">
                        {product.shippingReturns}
                      </p>
                    ) : null}
                  </motion.div>
                )}

                {activeTab === "returns" && (
                  <motion.div
                    key="returns"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {product.returnPolicies ? (
                      <p className="max-w-[500px] text-[13px] font-medium leading-relaxed text-[var(--text-muted)]">
                        {product.returnPolicies}
                      </p>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Right Side Info Box */}
        <div
          className="min-w-0 flex-1 rounded-3xl border bg-[var(--card-bg)] p-6"
          style={{
            borderColor: "var(--border-color)",
            boxShadow: "var(--admin-shadow)",
          }}
        >
          <h3 className="text-lg font-bold text-[var(--primary)] mb-4">
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 bg-white p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                SKU
              </span>
              <p className="text-sm font-semibold text-gray-800 font-mono">
                {product.sku || "—"}
              </p>
            </div>
            <div className="space-y-1 bg-white p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Category
              </span>
              <p className="text-sm font-semibold text-gray-800">
                {product.category || "Uncategorized"}
              </p>
            </div>
            <div className="space-y-1 bg-white p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Stock
              </span>
              <p
                className={`text-sm font-semibold ${totalStock <= 0 ? "text-red-600" : "text-gray-800"}`}
              >
                {totalStock} Units
              </p>
            </div>
            <div className="space-y-1 bg-white p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Status
              </span>
              <p className="text-sm font-semibold capitalize text-gray-800">
                {totalStock <= 0
                  ? "Out of Stock"
                  : product.status === "active"
                    ? "Active"
                    : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
