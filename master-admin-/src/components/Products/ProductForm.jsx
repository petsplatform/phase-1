import { useState, useRef, useEffect } from "react";
import { X, Upload, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { uploadApi } from "../../api/uploadApi";
import {
  showValidationError,
} from "../../utils/formValidation";
import { showToast } from "../../lib/toast";
import { sanitizeRichTextHtml } from "../../utils/sanitizeRichText";

const optionTypes = {
  size: {
    label: "Size",
    helper: "Best for belts, clothes, beds, houses and accessories.",
    placeholder: "XS, S, M, L, XL or Small, Medium, Large",
  },
  weight: {
    label: "Weight",
    helper: "Best for food, treats and dry goods.",
    placeholder: "100 g, 250 g, 1 kg, 5 kg",
  },
  volume: {
    label: "Volume",
    helper: "Best for liquid products, shampoo, medicine and sprays.",
    placeholder: "50 ml, 100 ml, 1 L",
  },
  length: {
    label: "Length",
    helper: "Best for leashes, belts, ropes and measured accessories.",
    placeholder: "30 cm, 60 cm, 1 m",
  },
  custom: {
    label: "Option",
    helper: "Use for any product-specific option.",
    placeholder: "Pack of 2, Puppy, Adult",
  },
};

const getOptionLabel = (optionType) =>
  optionTypes[optionType]?.label || optionTypes.size.label;
const normalizeOptionType = (optionType) =>
  Object.prototype.hasOwnProperty.call(optionTypes, optionType) ? optionType : "size";
const petTypeOptions = [
  "Dog",
  "Cat",
  "Mouse",
  "Horse",
  "Bird",
  "Fish",
  "Rabbit",
  "Other",
];

const cleanNumberValue = (value) => {
  if (value === undefined || value === null) return "";
  return value;
};

const getUploadedImageUrls = (response) => {
  const items = Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.data?.data)
      ? response.data.data
      : Array.isArray(response)
        ? response
        : [];
  return items.map((item) => item?.url).filter(Boolean);
};

const getVariantDerivedValues = (variants = []) => {
  const activeVariant = variants.find(
    (variant) => String(variant.status || "Active").toLowerCase() === "active",
  );
  const primaryVariant = activeVariant || variants[0] || null;
  const stock = variants.reduce((total, variant) => {
    if (String(variant.status || "Active").toLowerCase() !== "active") {
      return total;
    }
    const quantity = Number(variant.stock);
    return total + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  return {
    price: primaryVariant ? Number(primaryVariant.price) : 0,
    salePrice: primaryVariant ? Number(primaryVariant.regularPrice) : 0,
    stock,
  };
};

const getFamilyDerivedValues = (familyVariants = []) => {
  const skus = familyVariants
    .filter((variant) => String(variant.status || "Active").toLowerCase() === "active")
    .flatMap((variant) => (Array.isArray(variant.skus) ? variant.skus : []))
    .filter((sku) => String(sku.status || "Active").toLowerCase() === "active");
  const availableSkus = skus.filter((sku) => Number(sku.stock) > 0);
  const priceSource = (availableSkus.length ? availableSkus : skus)
    .slice()
    .sort((a, b) => Number(a.salePrice || a.regularPrice || 0) - Number(b.salePrice || b.regularPrice || 0))[0];

  return {
    price: priceSource ? Number(priceSource.salePrice || priceSource.regularPrice || 0) : 0,
    salePrice: priceSource ? Number(priceSource.regularPrice || priceSource.salePrice || 0) : 0,
    stock: skus.reduce((total, sku) => total + (Number(sku.stock) || 0), 0),
  };
};

const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

const normalizeOptionVariantForForm = (variant = {}, index = 0) => ({
  id: variant.id || `${variant.label || variant.size || "variant"}-init-${index}`,
  label: variant.label || variant.name || variant.size || variant.weightRange || "",
  size: variant.size ?? variant.weightRange ?? variant.label ?? variant.name ?? "",
  weightRange: variant.weightRange ?? variant.size ?? variant.label ?? variant.name ?? "",
  dose: variant.dose ?? variant.packLabel ?? variant.packSizeLabel ?? "",
  packSize: cleanNumberValue(variant.packSize ?? variant.packSizeValue),
  image: variant.image ?? variant.mainImage ?? null,
  gallery: Array.isArray(variant.gallery) ? variant.gallery : [],
  description: variant.description ?? variant.details ?? "",
  sku: variant.sku ?? "",
  price: cleanNumberValue(
    variant.price ?? variant.sellingPrice ?? variant.salePrice ?? variant.pricing?.finalPrice,
  ),
  regularPrice: cleanNumberValue(
    variant.regularPrice ?? variant.mrp ?? variant.pricing?.price ?? variant.salePrice,
  ),
  stock: cleanNumberValue(variant.stock ?? variant.inventory?.stockQuantity),
  status: variant.status || "Active",
});

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const makeFamilyVariant = (source = {}, index = 0) => ({
  id: source.id || `family-${Date.now()}-${index + 1}`,
  name: source.name || "",
  displayName: source.displayName || source.name || "",
  slug: source.slug || slugify(source.name || ""),
  strength: source.strength || "",
  weightRange: source.weightRange || "",
  packColor: source.packColor || "",
  image: source.image || "",
  // Keep selected files until handleSubmit uploads them. These fields are
  // removed from the persisted payload after the upload completes.
  imageFile: source.imageFile,
  shortDescription: source.shortDescription || source.description || "",
  content: source.content || "",
  status: source.status || "Active",
  seoTitle: source.seoTitle || "",
  seoDescription: source.seoDescription || "",
  skus: Array.isArray(source.skus) ? source.skus : [],
});

const makeFamilySku = (source = {}, index = 0) => ({
  id: source.id || `sku-${Date.now()}-${index + 1}`,
  packLabel: source.packLabel || "",
  sku: source.sku || "",
  regularPrice: source.regularPrice ?? "",
  salePrice: source.salePrice ?? source.price ?? "",
  stock: source.stock ?? "",
  status: source.status || "Active",
  image: source.image || "",
});

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const linesToHtmlList = (items) => {
  const lines = Array.isArray(items)
    ? items
    : String(items || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

  if (!lines.length) return "";
  return `<ul>${lines.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
};

const plainTextToHtml = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

const isFleaTickProduct = (product = {}) => {
  const text = `${product?.name || ""} ${product?.slug || ""} ${product?.sku || ""} ${product?.category || ""}`.toLowerCase();
  return text.includes("flea") || text.includes("tick") || text.includes("simparica");
};

const buildFleaTickDetailContent = ({ productName = "Best Vet Care Flea & Tick Chews for Dogs", variantName = "", weightRange = "" } = {}) => {
  const title = variantName || productName;
  const rangeText = weightRange || variantName || "the selected weight range";
  return `
    <h2>${escapeHtml(title)} Details</h2>
    <p>Are you concerned about your dog's protection from fleas, ticks, heartworms, and intestinal worms? ${escapeHtml(title)} is prepared as a clear demo product detail section for validating how long-form medicine content appears on the product page.</p>
    <p>This all-in-one treatment layout helps customers review the recommended pet range, coverage, ingredients, directions, safety notes, and dosing guide before choosing a pack size.</p>

    <h3>Recommended For:</h3>
    <ul>
      <li>Dogs.</li>
      <li>Recommended for dogs from 8 weeks of age and weighing ${escapeHtml(rangeText)}.</li>
    </ul>

    <h3>${escapeHtml(title)} Coverage:</h3>
    <ul>
      <li>Helps protect against flea infestations.</li>
      <li>Helps control tick exposure according to label directions.</li>
      <li>Supports monthly protection routines for repeat care plans.</li>
      <li>Pack options make it simple to choose 3, 6, or 12 dose supplies.</li>
      <li>Always follow veterinary guidance and the product label for medical products.</li>
    </ul>

    <h3>Active Ingredients:</h3>
    <p>Sarolaner 48 mg, Moxidectin 0.96 mg, Pyrantel 200 mg.</p>

    <h3>Directions</h3>
    <ul>
      <li>Administer one chew orally once a month or as directed by your veterinarian.</li>
      <li>It can be administered with or without food.</li>
      <li>After treatment, observe the dog to ensure the complete dose is consumed.</li>
      <li>If a dose is missed, give one dose and resume the monthly dosing schedule.</li>
      <li>For continuous year-round protection, continue treatment without interruption.</li>
    </ul>

    <h3>Dosing Guide</h3>
    <table>
      <thead>
        <tr>
          <th>Dog Weight</th>
          <th>Pack Color</th>
          <th>Sarolaner Strength (mg)</th>
          <th>Moxidectin Strength (mg)</th>
          <th>Pyrantel Strength (mg)</th>
          <th>Doses Administered</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>2.8 - 5.5 lbs</td><td>Yellow</td><td>3</td><td>0.06</td><td>12.5</td><td>One</td></tr>
        <tr><td>5.6 - 11.0 lbs</td><td>Purple</td><td>6</td><td>0.12</td><td>25.0</td><td>One</td></tr>
        <tr><td>11.1 - 22.0 lbs</td><td>Caramel</td><td>12</td><td>0.24</td><td>50.0</td><td>One</td></tr>
        <tr><td>22.1 - 44.0 lbs</td><td>Blue</td><td>24</td><td>0.48</td><td>100.0</td><td>One</td></tr>
        <tr><td>44.1 - 88.0 lbs</td><td>Green</td><td>48</td><td>0.96</td><td>200.0</td><td>One</td></tr>
        <tr><td>88.1 - 132.0 lbs</td><td>Brown</td><td>72</td><td>1.44</td><td>300.0</td><td>One</td></tr>
      </tbody>
    </table>

    <h3>Safety</h3>
    <p>For dogs only. Keep out of reach of children and uninformed people. Consult a veterinarian before use if your pet is pregnant, nursing, unwell, taking other medication, or has a history of seizures or neurologic disorders.</p>

    <h3>Storage Guide:</h3>
    <p>Store in a cool, dry place and keep the product in its original packaging until use.</p>
  `;
};

const buildProductDetailsContent = (data = {}, product = {}) => {
  const sections = [];
  if (data.overview) sections.push(`<p>${escapeHtml(data.overview)}</p>`);
  if (data.benefits?.length) sections.push("<h2>Key Benefits</h2>", linesToHtmlList(data.benefits));
  if (data.directions?.length) sections.push("<h2>How To Choose</h2>", linesToHtmlList(data.directions));
  if (data.ingredients) sections.push("<h2>Ingredients / Composition</h2>", plainTextToHtml(data.ingredients));
  if (data.safety) sections.push("<h2>Safety Information</h2>", plainTextToHtml(data.safety));
  if (Array.isArray(data.faq) && data.faq.some((item) => item?.question || item?.answer)) {
    sections.push("<h2>Frequently Asked Questions</h2>");
    data.faq.forEach((item) => {
      if (item?.question) sections.push(`<h3>${escapeHtml(item.question)}</h3>`);
      if (item?.answer) sections.push(`<p>${escapeHtml(item.answer)}</p>`);
    });
  }
  if (!sections.length && isFleaTickProduct(product)) {
    return buildFleaTickDetailContent({ productName: product.name });
  }
  return sections.join("");
};

const makeProductDetails = (source = {}, product = {}) => {
  const data = source && typeof source === "object" ? source : {};
  const generatedContent = buildProductDetailsContent(data, product);
  return {
    content: data.content || generatedContent,
    overview: data.overview || "",
    benefits: Array.isArray(data.benefits) ? data.benefits.join("\n") : data.benefits || "",
    directions: Array.isArray(data.directions) ? data.directions.join("\n") : data.directions || "",
    ingredients: data.ingredients || "",
    safety: data.safety || "",
    faq: Array.isArray(data.faq) && data.faq.length
      ? data.faq
    : [
        { question: "", answer: "" },
        { question: "", answer: "" },
      ],
  };
};

const splitLines = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

function RichTextEditor({ value, onChange, placeholder = "Write content here..." }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command, commandValue = null) => {
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || "");
  };

  const handlePaste = (event) => {
    const html = event.clipboardData?.getData("text/html");
    if (!html) return;
    event.preventDefault();
    document.execCommand("insertHTML", false, sanitizeRichTextHtml(html));
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <div className="overflow-hidden border border-gray-300 bg-white">
      <div className="flex items-center gap-1 border-b border-gray-300 bg-white px-3 py-2">
        <select
          defaultValue="p"
          onChange={(event) => exec("formatBlock", event.target.value)}
          className="mr-3 h-7 min-w-[96px] border-0 bg-white text-sm font-medium text-gray-700 outline-none"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        {[
          ["bold", "B", "font-bold"],
          ["italic", "I", "italic"],
          ["underline", "U", "underline"],
          ["insertOrderedList", "1.", ""],
          ["insertUnorderedList", "UL", ""],
          ["removeFormat", "Tx", ""],
        ].map(([command, label, className]) => (
          <button
            key={command}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              exec(command);
            }}
            className={`flex h-7 min-w-7 items-center justify-center px-1 text-sm text-gray-700 hover:bg-gray-100 ${className}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onPaste={handlePaste}
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        className="min-h-[92px] px-4 py-3 text-sm leading-7 text-gray-800 outline-none [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-2 [&_th]:py-1 [&_th]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
        data-placeholder={placeholder}
      />
      <style>{`[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:#9ca3af;pointer-events:none}`}</style>
    </div>
  );
}

const shouldPrepareFamilyDemo = (product = {}) => {
  const data = product && typeof product === "object" ? product : {};
  const text = `${data.name || ""} ${data.slug || ""} ${data.sku || ""}`.toLowerCase();
  return (
    data.productType === "FAMILY" ||
    text.includes("flea") ||
    text.includes("tick") ||
    text.includes("weight") ||
    text.includes("bag") ||
    text.includes("chew")
  );
};

const makeDemoFamilyVariants = (product = {}) => {
  const data = product && typeof product === "object" ? product : {};
  const basePrice = Number(data.price || 24.99);
  const baseSku = String(data.sku || slugify(data.name || "product")).toUpperCase();
  const image = data.mainImage || data.image || "";
  const productId = data.id || slugify(data.name || "product");
  const primaryOptions = [
    "2-10 lbs (Yellow)",
    "11-20 lbs (Orange)",
    "21-40 lbs (Blue)",
    "41-80 lbs (Green)",
  ];
  const packs = [
    { label: "3 Doses", multiplier: 1 },
    { label: "6 Doses", multiplier: 1.92 },
    { label: "12 Doses", multiplier: 3.75 },
  ];
  return primaryOptions.map((name, variantIndex) =>
    makeFamilyVariant({
      id: `${productId}-family-${variantIndex + 1}`,
      name,
      displayName: `${data.name || "Product"} ${name}`,
      slug: slugify(name),
      weightRange: name,
      packColor: name.match(/\(([^)]+)\)/)?.[1] || "",
      image,
      shortDescription: data.description || "",
      content: buildFleaTickDetailContent({
        productName: data.name || "Best Vet Care Flea & Tick Chews for Dogs",
        variantName: `${data.name || "Best Vet Care Flea & Tick Chews for Dogs"} ${name}`,
        weightRange: name.replace(/\s*\([^)]*\)/, ""),
      }),
      skus: packs.map((pack, packIndex) => {
        const price = Math.max(1, basePrice * pack.multiplier + variantIndex * 2);
        return makeFamilySku({
          id: `${productId}-sku-${variantIndex + 1}-${packIndex + 1}`,
          packLabel: pack.label,
          sku: `${baseSku}-${variantIndex + 1}${packIndex + 1}`,
          regularPrice: Number((price * 1.25).toFixed(2)),
          salePrice: Number(price.toFixed(2)),
          stock: Number(data.stock || 25),
          status: "Active",
          image,
        }, packIndex);
      }),
    }, variantIndex),
  );
};

export default function ProductForm({ onSubmit, initialData = null }) {
  const [isUploading, setIsUploading] = useState(false);
  const initialFamilyVariants =
    initialData?.familyVariants?.length
      ? initialData.familyVariants.map(makeFamilyVariant)
      : shouldPrepareFamilyDemo(initialData)
        ? makeDemoFamilyVariants(initialData)
        : [];
  const initialProductType =
    initialData?.productType === "SIMPLE"
      ? "SIMPLE"
      : initialFamilyVariants.length > 0 || initialData?.productType === "FAMILY"
      ? "FAMILY"
      : "SIMPLE";
  // Initial determination if color variants exist
  const hasInitialVariants = !!(
    initialData?.colorVariants && initialData.colorVariants.length > 0
  );

  const [hasVariants, setHasVariants] = useState(hasInitialVariants);
  const [activeCategories, setActiveCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    sku: initialData?.sku || "",
    category: initialData?.category || "Apparel",
    petType: initialData?.petType || "Dog",
    mrp: initialData?.salePrice || initialData?.mrp || "",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
    status: initialData?.status || "active",
    rating: initialData?.rating || 5,
    reviewsCount: initialData?.reviewsCount || 0,
    description: initialData?.description || "",
    productType: initialProductType,
    parentContent: initialData?.parentContent || "",
    productDetails: makeProductDetails(initialData?.productDetails, initialData),
    seoTitle: initialData?.seoTitle || "",
    seoDescription: initialData?.seoDescription || "",
    shippingReturns: initialData?.shippingReturns || "",
    returnPolicies: initialData?.returnPolicies || "",
    prescriptionRequired: initialData?.prescriptionRequired || false,
    vetOnly: initialData?.vetOnly || false,
    optionType: normalizeOptionType(initialData?.optionType),
    optionLabel:
      initialData?.optionLabel ||
      getOptionLabel(normalizeOptionType(initialData?.optionType)),
    capacities: Array.isArray(initialData?.capacities)
      ? initialData.capacities.join(", ")
      : initialData?.capacities || "",
    mainImage: initialData?.mainImage || initialData?.image || null,
    gallery: initialData?.gallery || [],
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { categoryApi } = await import("../../api/categoryApi");
        const { getAdminToken } = await import("../../lib/api");
        if (!getAdminToken()) return;
        const apiCategories = await categoryApi.getAllCategories({
          status: "Active",
        });
        const activeOnly = apiCategories.filter(
          (cat) => String(cat.status).toLowerCase() === "active",
        );
        setActiveCategories(activeOnly);
        setFormData((prev) => {
          const selected = activeOnly.find((category) =>
            category.id === prev.categoryId ||
            String(category.name).toLowerCase() === String(prev.category || "").toLowerCase(),
          ) || activeOnly[0];
          return selected
            ? { ...prev, category: selected.name, categoryId: selected.id }
            : prev;
        });
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, []);

  // Color Variant Management
  const [colorVariants, setColorVariants] = useState(
    initialData?.colorVariants || [],
  );
  const [optionVariants, setOptionVariants] = useState(() => {
    // Pre-populate from initialData, normalizing field names
    if (initialData?.optionVariants?.length > 0) {
      return initialData.optionVariants.map(normalizeOptionVariantForForm);
    }
    return [];
  });
  const [familyVariants, setFamilyVariants] = useState(() => initialFamilyVariants);
  const [openFamilyVariantId, setOpenFamilyVariantId] = useState(
    initialFamilyVariants?.[0]?.id || null,
  );
  const [currentVariant, setCurrentVariant] = useState({
    label: "",
    color: "#FFFFFF",
    mainImage: null,
    gallery: [],
  });

  const formMainImageRef = useRef(null);
  const variantMainImageRef = useRef(null);
  const variantGalleryRef = useRef(null);
  const [activeTab, setActiveTab] = useState("shippingReturns");

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "category") {
      const selected = activeCategories.find((cat) => cat.name === value);
      setFormData((prev) => ({
        ...prev,
        category: value,
        categoryId: selected?.id || "",
      }));
      return;
    }
    if (name === "optionType") {
      setFormData((prev) => ({
        ...prev,
        optionType: value,
        optionLabel: getOptionLabel(value),
      }));
      return;
    }
    if (name === "productType" && value === "FAMILY" && activeTab === "description") {
      setActiveTab("shippingReturns");
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const capacityLabels = formData.capacities
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const makeOptionVariant = (label, index, source = {}) => ({
    id: source.id || `${label}-${Date.now()}-${index}`,
    label,
    size: source.size ?? source.weightRange ?? label,
    weightRange: source.weightRange ?? source.size ?? label,
    dose: source.dose ?? "",
    packSize: cleanNumberValue(source.packSize),
    image: source.image ?? source.mainImage ?? null,
    imageFile: source.imageFile,
    gallery: source.gallery || [],
    description: source.description ?? source.details ?? "",
    sku: source.sku ?? "",
    price: cleanNumberValue(source.price),
    regularPrice: cleanNumberValue(
      source.regularPrice ?? source.mrp ?? source.salePrice,
    ),
    stock: cleanNumberValue(source.stock),
    status: source.status || "Active",
  });

  const syncOptionVariants = () => {
    setOptionVariants((current) =>
      capacityLabels.map((label, index) => {
        const normalizedLabel = String(label || "").trim().toLowerCase();
        const existing = current.find((variant) => {
          const variantLabel = String(variant.label || "").trim().toLowerCase();
          const variantSize = String(
            variant.size || variant.weightRange || "",
          ).trim().toLowerCase();
          const baseLabel = variantLabel.split(" + ")[0].trim();
          return (
            variantLabel === normalizedLabel ||
            variantSize === normalizedLabel ||
            baseLabel === normalizedLabel
          );
        });
        return makeOptionVariant(label, index, existing);
      }),
    );
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // On first render, only sync if there are no pre-loaded variants
      if (optionVariants.length === 0 && capacityLabels.length > 0) {
        syncOptionVariants();
      }
      return;
    }
    if (capacityLabels.length === 0) {
      setOptionVariants([]);
      return;
    }
    syncOptionVariants();
    // Only resync when the option labels change; row edits must not be overwritten.
  }, [formData.capacities]);

  const updateOptionVariant = (label, field, value) => {
    setOptionVariants((current) =>
      current.map((variant, index) => {
        if (variant.label !== label && variant.id !== label) return variant;
        const nextVariant = makeOptionVariant(variant.label, index, variant);
        const updated = { ...nextVariant, [field]: value };
        if (["size", "weightRange", "dose"].includes(field)) {
          updated.label = [updated.weightRange || updated.size, updated.dose].filter(Boolean).join(" + ") || updated.label;
        }
        return updated;
      }),
    );
  };

  const getVisibleOptionVariants = () =>
    optionVariants.length > 0
      ? optionVariants.map((variant, index) => makeOptionVariant(variant.label, index, variant))
      : capacityLabels.map((label, index) => makeOptionVariant(label, index));

  const addOptionVariant = () => {
    const nextIndex = optionVariants.length + 1;
    setOptionVariants((current) => [
      ...current,
      makeOptionVariant(`Variant ${nextIndex}`, nextIndex, {
        size: "",
        weightRange: "",
        dose: "",
        status: "Active",
      }),
    ]);
  };

  const duplicateOptionVariant = (variant) => {
    const copy = {
      ...variant,
      id: `${variant.id || "variant"}-copy-${Date.now()}`,
      sku: "",
      label: `${variant.label} Copy`,
    };
    setOptionVariants((current) => [...current, copy]);
  };

  const removeOptionVariant = (id) => {
    setOptionVariants((current) => current.filter((variant) => variant.id !== id));
  };

  const handleOptionVariantImage = (variantId, file) => {
    if (!file) return;
    setOptionVariants((current) =>
      current.map((variant) =>
        variant.id === variantId
          ? { ...variant, image: URL.createObjectURL(file), imageFile: file }
          : variant,
      ),
    );
  };

  const addFamilyVariant = () => {
    const nextVariant = makeFamilyVariant({ name: `Variant ${familyVariants.length + 1}` }, familyVariants.length);
    setFamilyVariants((current) => [...current, nextVariant]);
    setOpenFamilyVariantId(nextVariant.id);
  };

  const updateFamilyVariant = (variantId, field, value) => {
    setFamilyVariants((current) =>
      current.map((variant) => {
        if (variant.id !== variantId) return variant;
        const updated = { ...variant, [field]: value };
        if (field === "name" && !variant.slug) updated.slug = slugify(value);
        if (field === "name" && !variant.displayName) updated.displayName = value;
        return updated;
      }),
    );
  };

  const handleFamilyVariantMainImage = (variantId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFamilyVariants((current) => current.map((variant) => (
      variant.id === variantId
        ? { ...variant, image: URL.createObjectURL(file), imageFile: file }
        : variant
    )));
  };

  const removeFamilyVariant = (variantId) => {
    setFamilyVariants((current) => current.filter((variant) => variant.id !== variantId));
  };

  const addFamilySku = (variantId) => {
    setFamilyVariants((current) =>
      current.map((variant) =>
        variant.id === variantId
          ? { ...variant, skus: [...(variant.skus || []), makeFamilySku({}, variant.skus?.length || 0)] }
          : variant,
      ),
    );
  };

  const updateFamilySku = (variantId, skuId, field, value) => {
    setFamilyVariants((current) =>
      current.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              skus: (variant.skus || []).map((sku) =>
                sku.id === skuId ? { ...sku, [field]: value } : sku,
              ),
            }
          : variant,
      ),
    );
  };

  const updateProductDetails = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      productDetails: {
        ...makeProductDetails(prev.productDetails),
        [field]: value,
      },
    }));
  };

  const updateProductFaq = (index, field, value) => {
    setFormData((prev) => {
      const current = makeProductDetails(prev.productDetails).faq;
      const faq = current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      );
      return { ...prev, productDetails: { ...makeProductDetails(prev.productDetails), faq } };
    });
  };

  const addProductFaq = () => {
    setFormData((prev) => ({
      ...prev,
      productDetails: {
        ...makeProductDetails(prev.productDetails),
        faq: [...makeProductDetails(prev.productDetails).faq, { question: "", answer: "" }],
      },
    }));
  };

  const removeProductFaq = (index) => {
    setFormData((prev) => {
      const faq = makeProductDetails(prev.productDetails).faq.filter((_, itemIndex) => itemIndex !== index);
      return { ...prev, productDetails: { ...makeProductDetails(prev.productDetails), faq } };
    });
  };

  const buildProductDetailsPayload = () => {
    const details = makeProductDetails(formData.productDetails);
    return {
      content: details.content,
      overview: details.overview.trim(),
      benefits: splitLines(details.benefits),
      directions: splitLines(details.directions),
      ingredients: details.ingredients.trim(),
      safety: details.safety.trim(),
      faq: details.faq
        .map((item) => ({
          question: String(item.question || "").trim(),
          answer: String(item.answer || "").trim(),
        }))
        .filter((item) => item.question || item.answer),
    };
  };

  const removeFamilySku = (variantId, skuId) => {
    setFamilyVariants((current) =>
      current.map((variant) =>
        variant.id === variantId
          ? { ...variant, skus: (variant.skus || []).filter((sku) => sku.id !== skuId) }
          : variant,
      ),
    );
  };

  // Global Image Handling (Non-variant mode)
  const handleGlobalMainImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        mainImage: URL.createObjectURL(file),
        mainImageFile: file,
      }));
    }
  };

  // Variant Management
  const handleVariantMainImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentVariant((prev) => ({
        ...prev,
        mainImage: URL.createObjectURL(file),
        mainImageFile: file,
      }));
    }
  };

  const handleVariantGallery = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newImages = files.map((file) => URL.createObjectURL(file));
    setCurrentVariant((prev) => ({
      ...prev,
      gallery: [...prev.gallery, ...newImages].slice(0, 5),
      galleryFiles: [...(prev.galleryFiles || []), ...files].slice(0, 5),
    }));
  };

  const removeVariantGalleryImage = (idx) => {
    setCurrentVariant((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== idx),
    }));
  };

  const addColorVariant = () => {
    if (!currentVariant.label || !currentVariant.mainImage) {
      alert("Please provide color name and main image");
      return;
    }
    setColorVariants((prev) => [
      ...prev,
      { ...currentVariant, id: Date.now().toString() },
    ]);
    setCurrentVariant({
      label: "",
      color: "#FFFFFF",
      mainImage: null,
      gallery: [],
    });
  };

  const removeVariant = (id) => {
    setColorVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();



    if (formData.productType === "FAMILY") {
      const normalizedFamilyVariants = familyVariants.map(makeFamilyVariant);
      const activeFamilyVariants = normalizedFamilyVariants.filter((variant) => variant.status !== "Inactive");
      if (activeFamilyVariants.length === 0) {
        showValidationError("Add at least one active product variant.");
        return;
      }
      const invalidVariant = normalizedFamilyVariants.find((variant) => isBlank(variant.name) || isBlank(variant.slug));
      if (invalidVariant) {
        showValidationError("Each family variant needs a name and slug.");
        return;
      }
      const invalidSku = normalizedFamilyVariants
        .flatMap((variant) => (variant.skus || []).map((sku) => ({ variant, sku })))
        .find(({ sku }) => (
          isBlank(sku.packLabel) ||
          isBlank(sku.sku) ||
          isBlank(sku.regularPrice) ||
          isBlank(sku.stock) ||
          Number(sku.regularPrice) <= 0 ||
          Number(sku.salePrice || sku.regularPrice) <= 0 ||
          Number(sku.salePrice || sku.regularPrice) > Number(sku.regularPrice) ||
          !Number.isInteger(Number(sku.stock)) ||
          Number(sku.stock) < 0
        ));
      if (invalidSku) {
        showValidationError(`${invalidSku.variant.name || "Variant"} has an invalid pack/SKU row.`);
        return;
      }

      setIsUploading(true);
      try {
        let parentImage = formData.mainImage;
        if (formData.mainImageFile) {
          const res = await uploadApi.uploadImage(formData.mainImageFile);
          parentImage = res.data.url;
        }
        const uploadedFamilyVariants = await Promise.all(
          normalizedFamilyVariants.map(async (variant) => {
            let imageUrl = variant.image;
            if (variant.imageFile) {
              const res = await uploadApi.uploadImage(variant.imageFile);
              imageUrl = res.data.url;
            }
            const skus = (variant.skus || []).map((sku) => ({
              ...sku,
              regularPrice: Number(sku.regularPrice),
              salePrice: sku.salePrice === "" || sku.salePrice === null || sku.salePrice === undefined
                ? null
                : Number(sku.salePrice),
              stock: Number(sku.stock),
            }));
            const { imageFile, gallery, galleryFiles, ...persistedVariant } = variant;
            return {
              ...persistedVariant,
              image: imageUrl && !String(imageUrl).startsWith("blob:") ? imageUrl : null,
              skus,
            };
          }),
        );
        const purchasableSkus = uploadedFamilyVariants
          .filter((variant) => variant.status !== "Inactive")
          .flatMap((variant) => (variant.skus || []).filter((sku) => sku.status !== "Inactive"));
        const inStockSkus = purchasableSkus.filter((sku) => Number(sku.stock) > 0);
        const priceSource = (inStockSkus.length ? inStockSkus : purchasableSkus)
          .sort((a, b) => Number(a.salePrice || a.regularPrice) - Number(b.salePrice || b.regularPrice))[0];
        await onSubmit({
          ...formData,
          slug: formData.slug || slugify(formData.name),
          productType: "FAMILY",
          productDetails: buildProductDetailsPayload(),
          familyVariants: uploadedFamilyVariants,
          optionVariants: [],
          capacities: [],
          colorVariants: [],
          mainImage: parentImage && !String(parentImage).startsWith("blob:") ? parentImage : null,
          gallery: [],
          price: Number(priceSource?.salePrice || priceSource?.regularPrice || 0),
          mrp: Number(priceSource?.regularPrice || priceSource?.salePrice || 0),
          salePrice: Number(priceSource?.regularPrice || priceSource?.salePrice || 0),
          stock: purchasableSkus.reduce((total, sku) => total + (Number(sku.stock) || 0), 0),
        });
      } catch (error) {
        showValidationError(error.message || "Failed to save product family.");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const visibleOptionVariants = getVisibleOptionVariants();
    const duplicateOption = visibleOptionVariants.find(
      (variant, index) => visibleOptionVariants.findIndex((item) => item.label.toLowerCase() === variant.label.toLowerCase()) !== index,
    );

    if (duplicateOption) {
      showValidationError(`Duplicate variant option "${duplicateOption.label}" is not allowed.`);
      return;
    }

    if (visibleOptionVariants.length === 0) {
      showValidationError("Add at least one product variant option.");
      return;
    }

    const incompleteVariant = visibleOptionVariants.find(
      (variant) =>
        isBlank(variant.price) ||
        isBlank(variant.regularPrice) ||
        isBlank(variant.stock),
    );

    if (incompleteVariant) {
      showValidationError(
        `${incompleteVariant.label} variant requires Selling Price, MRP, and Stock.`,
      );
      return;
    }

    const invalidVariant = visibleOptionVariants
      .find((variant) => {
        const price = Number(variant.price);
        const mrp = Number(variant.regularPrice);
        const stock = Number(variant.stock);
        return (
          !Number.isFinite(price) ||
          price <= 0 ||
          !Number.isFinite(mrp) ||
          mrp <= 0 ||
          price > mrp ||
          !Number.isInteger(stock) ||
          stock < 0
        );
      });

    if (invalidVariant) {
      showValidationError(
        `${invalidVariant.label} variant has invalid price, MRP, or stock.`,
      );
      return;
    }

    if (hasVariants && colorVariants.length === 0) {
      showValidationError(
        "Add at least one color variant or disable color variants mode.",
      );
      return;
    }

    setIsUploading(true);
    try {
      const derivedValues = getVariantDerivedValues(visibleOptionVariants);
      const uploadedOptionVariants = await Promise.all(
        visibleOptionVariants.map(async (variant) => {
          let imageUrl = variant.image;
          if (variant.imageFile) {
            const res = await uploadApi.uploadImage(variant.imageFile);
            imageUrl = res.data.url;
          }
          const { imageFile, ...persistedVariant } = variant;
          return {
            ...persistedVariant,
            image: imageUrl && !String(imageUrl).startsWith("blob:") ? imageUrl : null,
          };
        }),
      );
      const finalData = {
        ...formData,
        productType: "SIMPLE",
        familyVariants: [],
        productDetails: buildProductDetailsPayload(),
        mrp: derivedValues.salePrice,
        salePrice: derivedValues.salePrice,
        price: derivedValues.price,
        stock: derivedValues.stock,
        optionType: normalizeOptionType(formData.optionType),
        optionLabel:
          formData.optionLabel || getOptionLabel(normalizeOptionType(formData.optionType)),
        capacities:
          typeof formData.capacities === "string"
            ? formData.capacities
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : formData.capacities,
        optionVariants: uploadedOptionVariants.map((variant) => ({
          ...variant,
          price: variant.price === "" ? null : Number(variant.price),
          regularPrice:
            variant.regularPrice === "" ? null : Number(variant.regularPrice),
          stock: variant.stock === "" ? null : Number(variant.stock),
          packSize: variant.packSize === "" ? null : Number(variant.packSize),
        })),
      };

      if (hasVariants) {
        const uploadedVariants = await Promise.all(
          colorVariants.map(async (v) => {
            let mainImageUrl = v.mainImage;
            if (v.mainImageFile) {
              const res = await uploadApi.uploadImage(v.mainImageFile);
              mainImageUrl = res.data.url;
            }
            let galleryUrls = v.gallery;
            if (v.galleryFiles && v.galleryFiles.length > 0) {
              const res = await uploadApi.uploadMultipleImages(v.galleryFiles);
              galleryUrls = res.data.map((img) => img.url);
            }
            return { ...v, mainImage: mainImageUrl, gallery: galleryUrls };
          }),
        );
        finalData.colorVariants = uploadedVariants;
        finalData.mainImage = null;
        finalData.gallery = [];
      } else {
        finalData.colorVariants = [];
        finalData.mainImage = null;
        finalData.gallery = [];
      }

      await onSubmit(finalData);
    } catch (error) {
      console.error("Upload error:", error);
      if (!error.toastShown) {
        showToast({
          type: "error",
          title: "Error",
          message:
            error.message ||
            "Unable to save product variant prices. Please try again.",
        });
      }
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const variantSummary = formData.productType === "FAMILY"
    ? getFamilyDerivedValues(familyVariants)
    : getVariantDerivedValues(getVisibleOptionVariants());

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Product Name
          </label>
          <input
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--border-color)" }}
            placeholder="e.g. Classic Cotton Hoodie"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Slug
          </label>
          <input
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            onBlur={() => setFormData((prev) => ({ ...prev, slug: prev.slug || slugify(prev.name) }))}
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1"
            style={{ borderColor: "var(--border-color)" }}
            placeholder="dolo"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Product Structure
          </label>
          <select
            name="productType"
            value={formData.productType}
            onChange={handleChange}
            disabled={Boolean(initialData)}
            aria-disabled={Boolean(initialData)}
            title={initialData ? "Product Structure cannot be changed after creation" : undefined}
            className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${
              initialData ? "cursor-not-allowed bg-gray-50 text-gray-500" : ""
            }`}
            style={{ borderColor: "var(--border-color)" }}
          >
            <option value="SIMPLE">Simple Product</option>
            <option value="FAMILY">Product Family / Variable Product</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-4">
            <div className="flex gap-4 sm:gap-8 border-b border-gray-100 overflow-x-auto">
              {(formData.productType === "SIMPLE"
                ? [{ id: "description", label: "Short Description" }]
                : []
              ).concat([
                { id: "shippingReturns", label: "Shipping" },
                { id: "returnPolicies", label: "Returns" },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-xs font-semibold uppercase tracking-widest relative transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-primary"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                name={activeTab}
                value={formData[activeTab] || ""}
                onChange={handleChange}
                placeholder={
                  activeTab === "description"
                    ? "Provide a short product description..."
                    : `Provide detailed information about ${activeTab.replace(/([A-Z])/g, " $1").toLowerCase()}...`
                }
                rows={4}
                className="w-full px-5 py-4 bg-gray-50/80 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-1 transition-all placeholder:text-gray-400 resize-none"
                style={{ borderColor: "var(--border-color)" }}
              />
            </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-semibold text-gray-900">Content</label>
          <RichTextEditor
            value={makeProductDetails(formData.productDetails).content}
            onChange={(value) => updateProductDetails("content", value)}
            placeholder=""
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            SKU
          </label>
          <input
            required
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg font-mono"
            placeholder="SKU-HDY-001"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          >
            {!activeCategories.some((c) => c.name === formData.category) && (
              <option value={formData.category}>{formData.category}</option>
            )}
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Pet Type
          </label>
          <select
            name="petType"
            value={formData.petType}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border rounded-lg"
          >
            {petTypeOptions.map((petType) => (
              <option key={petType} value={petType}>
                {petType}
              </option>
            ))}
          </select>
        </div>

        {formData.productType === "FAMILY" && (
          <div className="md:col-span-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-soft)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--primary)]">
                  Product Family Variants ({familyVariants.length})
                </h3>
                <p className="text-[10px] font-medium text-[var(--text-muted)]">
                  Add strengths, weight ranges, or sizes here. Each pack row becomes a purchasable SKU.
                </p>
              </div>
              <button
                type="button"
                onClick={addFamilyVariant}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--accent-gold)]"
              >
                <Plus size={14} /> Add Product Variant
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {familyVariants.map((variant, variantIndex) => {
                const isOpen = openFamilyVariantId === variant.id;
                return (
                  <section key={variant.id} className="rounded-xl border border-gray-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFamilyVariantId(isOpen ? null : variant.id)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {variant.image ? (
                            <img src={variant.image} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <Upload size={15} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {variant.name || `Variant ${variantIndex + 1}`}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400">
                          {(variant.skus || []).length} pack/SKU rows · 1 main image
                        </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[var(--primary)]">
                        {isOpen ? "Close" : "Edit"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 p-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Variant name" value={variant.name} onChange={(e) => updateFamilyVariant(variant.id, "name", e.target.value)} />
                          <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Slug" value={variant.slug} onChange={(e) => updateFamilyVariant(variant.id, "slug", slugify(e.target.value))} />
                          <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Strength, e.g. 250 mg" value={variant.strength} onChange={(e) => updateFamilyVariant(variant.id, "strength", e.target.value)} />
                          <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Weight range, e.g. 5.6-11 lbs" value={variant.weightRange} onChange={(e) => updateFamilyVariant(variant.id, "weightRange", e.target.value)} />
                          <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Pack color" value={variant.packColor} onChange={(e) => updateFamilyVariant(variant.id, "packColor", e.target.value)} />
                          <select className="rounded-lg border border-gray-200 px-3 py-2 text-sm" value={variant.status} onChange={(e) => updateFamilyVariant(variant.id, "status", e.target.value)}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Variant Main Image
                            </label>
                            <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[var(--primary)]">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => handleFamilyVariantMainImage(variant.id, event)}
                              />
                              {variant.image ? (
                                <img src={variant.image} alt={variant.name || "Family variant"} className="h-full w-full object-contain p-2" />
                              ) : (
                              <span className="px-3 text-center text-[10px] font-bold uppercase text-gray-400">Upload main image</span>
                              )}
                            </label>
                          </div>
                        </div>
                        <textarea className="mt-3 min-h-20 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Variant short description" value={variant.shortDescription} onChange={(e) => updateFamilyVariant(variant.id, "shortDescription", e.target.value)} />
                        <div className="mt-3">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Variant Product Details
                          </label>
                          <RichTextEditor
                            value={variant.content}
                            onChange={(value) => updateFamilyVariant(variant.id, "content", value)}
                            placeholder="Variant rich content: headings, lists, directions, warnings, FAQ"
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Pack Options / SKUs</h4>
                          <button type="button" onClick={() => addFamilySku(variant.id)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                            Add Pack / SKU
                          </button>
                        </div>
                        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-100">
                          <table className="min-w-[920px] w-full text-left text-xs">
                            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                              <tr>
                                <th className="px-3 py-2">Pack</th>
                                <th className="px-3 py-2">SKU</th>
                                <th className="px-3 py-2">MRP</th>
                                <th className="px-3 py-2">Sale</th>
                                <th className="px-3 py-2">Stock</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(variant.skus || []).map((sku) => (
                                <tr key={sku.id} className="border-t border-gray-100">
                                  <td className="px-3 py-2"><input className="w-full rounded-lg border border-gray-200 px-2 py-1" value={sku.packLabel} onChange={(e) => updateFamilySku(variant.id, sku.id, "packLabel", e.target.value)} placeholder="10 Tablets" /></td>
                                  <td className="px-3 py-2"><input className="w-full rounded-lg border border-gray-200 px-2 py-1 font-mono" value={sku.sku} onChange={(e) => updateFamilySku(variant.id, sku.id, "sku", e.target.value)} placeholder="DOLO-250-10" /></td>
                                  <td className="px-3 py-2"><input type="number" min="0" step="0.01" className="w-full rounded-lg border border-gray-200 px-2 py-1" value={sku.regularPrice} onChange={(e) => updateFamilySku(variant.id, sku.id, "regularPrice", e.target.value)} /></td>
                                  <td className="px-3 py-2"><input type="number" min="0" step="0.01" className="w-full rounded-lg border border-gray-200 px-2 py-1" value={sku.salePrice} onChange={(e) => updateFamilySku(variant.id, sku.id, "salePrice", e.target.value)} /></td>
                                  <td className="px-3 py-2"><input type="number" min="0" step="1" className="w-full rounded-lg border border-gray-200 px-2 py-1" value={sku.stock} onChange={(e) => updateFamilySku(variant.id, sku.id, "stock", e.target.value)} /></td>
                                  <td className="px-3 py-2"><select className="w-full rounded-lg border border-gray-200 px-2 py-1" value={sku.status} onChange={(e) => updateFamilySku(variant.id, sku.id, "status", e.target.value)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></td>
                                  <td className="px-3 py-2"><button type="button" onClick={() => removeFamilySku(variant.id, sku.id)} className="rounded-lg border border-red-100 px-2 py-1 font-bold text-red-600 hover:bg-red-50">Delete</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Variant SEO title" value={variant.seoTitle} onChange={(e) => updateFamilyVariant(variant.id, "seoTitle", e.target.value)} />
                          <input className="rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Variant SEO description" value={variant.seoDescription} onChange={(e) => updateFamilyVariant(variant.id, "seoDescription", e.target.value)} />
                        </div>
                        <button type="button" onClick={() => removeFamilyVariant(variant.id)} className="mt-4 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                          Delete Variant
                        </button>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* VARIANT TOGGLE */}
        <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-blue-900">
              Enable Color Variants
            </h4>
            <p className="text-[10px] text-blue-600 font-medium">
              Toggle this if the product comes in different colors
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* PRESCRIPTION TOGGLE */}
        <div className="md:col-span-2 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Prescription Required
            </h4>
            <p className="text-[10px] text-amber-600 font-medium">
              Customers must upload a prescription at checkout to buy this product
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.prescriptionRequired}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  prescriptionRequired: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        <div className="md:col-span-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-emerald-900">
              Vet Only Product
            </h4>
            <p className="text-[10px] text-emerald-700 font-medium">
              Only verified veterinarians can purchase this product
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.vetOnly}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  vetOnly: e.target.checked,
                }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {formData.productType === "FAMILY" ? (
          /* FAMILY PRODUCT: show main image upload */
          <div className="order-2 md:col-span-2 space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-[320px] gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Main Image
                </label>
                <div
                  onClick={() => formMainImageRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all overflow-hidden"
                >
                  <input
                    type="file"
                    ref={formMainImageRef}
                    onChange={handleGlobalMainImage}
                    className="hidden"
                    accept="image/*"
                  />
                  {formData.mainImage ? (
                    <img
                      src={formData.mainImage}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        Upload
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : formData.productType === "SIMPLE" && hasVariants ? (
          /* COLOR VARIANTS SECTION */
          <div className="order-2 md:col-span-2 space-y-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Color Variants & Images *
                </h3>
                <p className="text-[10px] text-gray-500">
                  Each color variant must have its own images
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/30">
              <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-primary" />
                Add New Color Variant
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Color Name *
                  </label>
                  <input
                    type="text"
                    value={currentVariant.label}
                    onChange={(e) =>
                      setCurrentVariant((prev) => ({
                        ...prev,
                        label: e.target.value,
                      }))
                    }
                    placeholder="e.g. Alpine White"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm transition-all focus:ring-1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Color Theme
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={currentVariant.color}
                      onChange={(e) =>
                        setCurrentVariant((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="w-10 h-10 p-1 rounded-lg border border-gray-200 bg-white cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentVariant.color}
                      onChange={(e) =>
                        setCurrentVariant((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono uppercase"
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Main Image *
                  </label>
                  <div
                    onClick={() => variantMainImageRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden"
                  >
                    <input
                      type="file"
                      ref={variantMainImageRef}
                      onChange={handleVariantMainImage}
                      className="hidden"
                      accept="image/*"
                    />
                    {currentVariant.mainImage ? (
                      <img
                        src={currentVariant.mainImage}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Upload size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                    Gallery (Max 5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {currentVariant.gallery.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white group/img"
                      >
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeVariantGalleryImage(idx)}
                          className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {currentVariant.gallery.length < 5 && (
                      <button
                        type="button"
                        onClick={() => variantGalleryRef.current?.click()}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 bg-white hover:border-primary text-gray-400 transition-all flex items-center justify-center"
                      >
                        <input
                          type="file"
                          multiple
                          ref={variantGalleryRef}
                          onChange={handleVariantGallery}
                          className="hidden"
                          accept="image/*"
                        />
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={addColorVariant}
                className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Color Variant
              </button>
            </div>

            {colorVariants.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Added Variants ({colorVariants.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {colorVariants.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-2xl border border-gray-100 bg-white shadow-sm flex gap-3 relative group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-50 shrink-0 bg-gray-50">
                        <img
                          src={v.mainImage}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div
                            className="w-2 h-2 rounded-full border border-gray-100"
                            style={{ background: v.color }}
                          />
                          <h5 className="text-xs font-bold text-gray-800">
                            {v.label}
                          </h5>
                        </div>
                        <p className="text-[9px] text-gray-400 font-medium">
                          {v.gallery.length + 1} Image(s)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariant(v.id)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Simple products use option-based variants; family products use the editor above. */}
        {formData.productType === "SIMPLE" && (
          <div className="order-1 md:col-span-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Option Type
              </label>
              <select
                name="optionType"
                value={formData.optionType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
              >
                {Object.entries(optionTypes).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {formData.optionLabel || getOptionLabel(formData.optionType)}{" "}
                Options (Comma separated)
              </label>
              <input
                name="capacities"
                value={formData.capacities}
                onChange={handleChange}
                onBlur={syncOptionVariants}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                placeholder={
                  optionTypes[formData.optionType]?.placeholder ||
                  optionTypes.size.placeholder
                }
              />
              <p className="text-[10px] font-medium text-gray-400">
                {optionTypes[formData.optionType]?.helper ||
                  optionTypes.size.helper}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Product Variants</h3>
              <p className="text-[10px] font-medium text-gray-400">
                Each variant can have its own size, dose, image, SKU, price and stock.
              </p>
            </div>
            <button
              type="button"
              onClick={addOptionVariant}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-black"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>
          {getVisibleOptionVariants().length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white">
              <table className="min-w-[1560px] table-fixed text-left text-xs">
                <colgroup>
                  <col className="w-[96px]" />
                  <col className="w-[180px]" />
                  <col className="w-[180px]" />
                  <col className="w-[170px]" />
                  <col className="w-[130px]" />
                  <col className="w-[120px]" />
                  <col className="w-[110px]" />
                  <col className="w-[260px]" />
                  <col className="w-[120px]" />
                  <col className="w-[190px]" />
                </colgroup>
                <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Image</th>
                    <th className="px-3 py-2">Size / Weight</th>
                    <th className="px-3 py-2">Dose / Pack</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Selling Price</th>
                    <th className="px-3 py-2">MRP</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Details</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getVisibleOptionVariants().map((variant) => {
                    const variantKey = variant.id || variant.label;
                    return (
                      <tr key={variantKey} className="border-t border-gray-100 align-top">
                        <td className="px-3 py-2">
                          <label className="flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-gray-50">
                            {variant.image ? (
                              <img src={variant.image} alt={variant.label} className="h-full w-full object-contain" />
                            ) : (
                              <Upload size={16} className="text-gray-400" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(event) => handleOptionVariantImage(variant.id, event.target.files?.[0])}
                            />
                          </label>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={variant.weightRange ?? variant.size ?? ""}
                            onChange={(event) => updateOptionVariant(variantKey, "weightRange", event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1"
                            placeholder="Up to 25 lbs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="grid gap-2">
                            <input
                              value={variant.dose ?? ""}
                              onChange={(event) => updateOptionVariant(variantKey, "dose", event.target.value)}
                              className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1"
                              placeholder="6 Doses"
                            />
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.packSize ?? ""}
                              onChange={(event) => updateOptionVariant(variantKey, "packSize", event.target.value)}
                              className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1"
                              placeholder="Pack size"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={variant.sku ?? ""}
                            onChange={(event) => updateOptionVariant(variantKey, "sku", event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1 font-mono"
                            placeholder="Variant SKU"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price ?? ""}
                            onChange={(event) => updateOptionVariant(variantKey, "price", event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1"
                            placeholder="Selling price"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.regularPrice ?? ""}
                            onChange={(event) => updateOptionVariant(variantKey, "regularPrice", event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1"
                            placeholder="MRP"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={variant.stock ?? ""}
                            onChange={(event) => updateOptionVariant(variantKey, "stock", event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1"
                            placeholder="Stock"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            rows={3}
                            value={variant.description ?? ""}
                            onChange={(event) => updateOptionVariant(variantKey, "description", event.target.value)}
                            className="min-h-20 w-full resize-y rounded-lg border border-gray-200 px-3 py-2 leading-5"
                            placeholder="Variant details"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={variant.status || "Active"}
                            onChange={(event) => updateOptionVariant(variantKey, "status", event.target.value)}
                            className="h-9 w-full rounded-lg border border-gray-200 px-3 py-1"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => duplicateOptionVariant(variant)}
                              className="rounded-lg border border-gray-200 px-2 py-1 font-bold text-gray-600 hover:bg-gray-50"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={() => removeOptionVariant(variant.id)}
                              className="rounded-lg border border-red-100 px-2 py-1 font-bold text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Default Price</p>
              <p className="text-sm font-bold text-gray-900">${variantSummary.price || 0}</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Default MRP</p>
              <p className="text-sm font-bold text-gray-900">${variantSummary.salePrice || 0}</p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Stock</p>
              <p className="text-sm font-bold text-gray-900">{variantSummary.stock || 0}</p>
            </div>
          </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Total Variant Stock
            </label>
            <div className="w-full px-3 py-2 text-sm font-bold text-gray-800 bg-gray-50 border rounded-lg">
              {variantSummary.stock || 0}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border rounded-lg"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className="pt-6 sticky bottom-0  flex justify-end gap-3"
        style={{ borderColor: "var(--border-color)" }}
      >
        <button
          type="submit"
          disabled={isUploading}
          className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isUploading
            ? "Updating..."
            : initialData
              ? "Update Product"
              : "Add Product"}
        </button>
      </div>
    </form>
  );
}
