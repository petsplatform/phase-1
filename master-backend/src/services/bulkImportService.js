const ExcelJS = require("exceljs");
const { prisma, masterPrisma } = require("../config/db");
const { generateId } = require("../utils/ids");
const ApiError = require("../utils/apiError");

// ─── Template Column Definitions ─────────────────────────────────────────────
const TEMPLATE_COLUMNS = [
  { header: "SKU *", key: "sku", width: 18 },
  { header: "Product Name *", key: "name", width: 30 },
  { header: "Category *", key: "category", width: 22 },
  { header: "Pet Type", key: "petType", width: 16 },
  { header: "Description", key: "description", width: 40 },
  { header: "Price (Selling) *", key: "price", width: 18 },
  { header: "MRP (Sale Price)", key: "salePrice", width: 18 },
  { header: "Stock *", key: "stock", width: 12 },
  { header: "Option Type", key: "optionType", width: 14 },
  { header: "Option Label", key: "optionLabel", width: 14 },
  { header: "Capacities", key: "capacities", width: 24 },
  { header: "Shipping & Returns", key: "shippingReturns", width: 30 },
  { header: "Return Policy", key: "returnPolicies", width: 30 },
  { header: "Status", key: "status", width: 12 },
  { header: "Product Structure", key: "productType", width: 24 },
  { header: "Main Image URL", key: "image", width: 34 },
  { header: "Gallery URLs", key: "gallery", width: 40 },
  { header: "Parent Content", key: "parentContent", width: 40 },
  { header: "Product Details (JSON)", key: "productDetails", width: 55 },
  { header: "Option Variants (JSON)", key: "optionVariants", width: 55 },
  { header: "Family Variants (JSON)", key: "familyVariants", width: 55 },
  { header: "Color Variants (JSON)", key: "colorVariants", width: 45 },
  { header: "SEO Title", key: "seoTitle", width: 30 },
  { header: "SEO Description", key: "seoDescription", width: 45 },
  { header: "Prescription Required", key: "prescriptionRequired", width: 20 },
  { header: "Vet Only", key: "vetOnly", width: 12 },
];

// ─── Pet type values (must match AddProductForm.jsx) ─────────────────────────
const PET_TYPES = ["Dog", "Cat", "Mouse", "Horse", "Bird", "Fish", "Rabbit", "Other"];

// ─── Extract plain text from any ExcelJS cell value type ─────────────────────
function getCellText(cell) {
  const val = cell.value;
  if (val === null || val === undefined) return "";
  if (typeof val === "object" && Array.isArray(val.richText)) {
    return val.richText.map((r) => r.text || "").join("");
  }
  if (typeof val === "object" && val.result !== undefined) return String(val.result);
  if (typeof val === "object" && val.text !== undefined) return String(val.text);
  return String(val);
}

function parseJsonCell(value, label, fallback) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    throw new Error(`${label} must contain valid JSON`);
  }
}

function parseBooleanCell(value) {
  return ["true", "1", "yes", "y"].includes(String(value || "").trim().toLowerCase());
}

// ─── Generate Excel Template ──────────────────────────────────────────────────
async function generateTemplate(db = prisma) {
  const categories = await db.category.findMany({
    where: { status: "Active" },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Admin Panel";
  workbook.created = new Date();

  // Hidden sheet for dropdown sources
  const listsSheet = workbook.addWorksheet("_Lists");
  listsSheet.state = "veryHidden";
  listsSheet.getCell("A1").value = "Categories";
  categories.forEach((c, i) => { listsSheet.getCell(`A${i + 2}`).value = c.name; });
  listsSheet.getCell("B1").value = "PetTypes";
  PET_TYPES.forEach((p, i) => { listsSheet.getCell(`B${i + 2}`).value = p; });

  const sheet = workbook.addWorksheet("Product Import Template");
  sheet.columns = TEMPLATE_COLUMNS.map((col) => ({ header: col.header, key: col.key, width: col.width }));

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17345F" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD9AA3D" } },
      bottom: { style: "thin", color: { argb: "FFD9AA3D" } },
      left: { style: "thin", color: { argb: "FFD9AA3D" } },
      right: { style: "thin", color: { argb: "FFD9AA3D" } },
    };
  });
  headerRow.height = 30;

  const variantExampleRows = [
    {
      sku: "PROD-001", name: "Example Product 1",
      category: categories[0]?.name || "Category Name", petType: "Dog",
      description: "A great product for dogs", price: 29.99, salePrice: 39.99,
      stock: 100, optionType: "size", optionLabel: "Size", capacities: "Small,Medium,Large",
      shippingReturns: "Ships in 2-3 days", returnPolicies: "30-day returns", status: "Active",
    },
    {
      sku: "PROD-002", name: "Example Product 2",
      category: categories[1]?.name || categories[0]?.name || "Category Name", petType: "Cat",
      description: "A great product for cats", price: 19.99, salePrice: 24.99,
      stock: 50, optionType: "weight", optionLabel: "Weight", capacities: "100g,250g,500g",
      shippingReturns: "", returnPolicies: "", status: "Active",
    },
  ];

  exampleRows.forEach((row, idx) => {
    const dataRow = sheet.addRow(row);
    dataRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFFFFDF7" : "FFFFF8E8" } };
      cell.font = { size: 10 };
      cell.border = {
        top: { style: "hair", color: { argb: "FFD9AA3D4D" } },
        bottom: { style: "hair", color: { argb: "FFD9AA3D4D" } },
        left: { style: "hair", color: { argb: "FFD9AA3D4D" } },
        right: { style: "hair", color: { argb: "FFD9AA3D4D" } },
      };
    });
  });

  const catCount = categories.length;
  if (catCount > 0) {
    sheet.dataValidations.add("C2:C10000", {
      type: "list", allowBlank: false,
      formulae: [`_Lists!$A$2:$A$${catCount + 1}`],
      showErrorMessage: true, errorTitle: "Invalid Category",
      error: "Please select a valid active category from the dropdown.",
    });
  }

  sheet.dataValidations.add("D2:D10000", {
    type: "list", allowBlank: true,
    formulae: [`_Lists!$B$2:$B$${PET_TYPES.length + 1}`],
    showErrorMessage: true, errorTitle: "Invalid Pet Type",
    error: `Pet Type must be one of: ${PET_TYPES.join(", ")}.`,
  });

  sheet.dataValidations.add("N2:N10000", {
    type: "list", allowBlank: true, formulae: ['"Active,Inactive"'],
    showErrorMessage: true, errorTitle: "Invalid Status",
    error: "Status must be Active or Inactive.",
  });

  sheet.dataValidations.add("I2:I10000", {
    type: "list", allowBlank: true,
    formulae: ['"size,weight,volume,length,custom"'],
  });

  sheet.dataValidations.add("O2:O10000", {
    type: "list", allowBlank: true,
    formulae: ['"SIMPLE,FAMILY"'],
    showErrorMessage: true, errorTitle: "Invalid Product Structure",
    error: "Choose SIMPLE or FAMILY.",
  });

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Instructions sheet
  const instrSheet = workbook.addWorksheet("Instructions");
  instrSheet.columns = [{ key: "col", width: 80 }];
  const instructions = [
    ["BULK PRODUCT IMPORT — INSTRUCTIONS", true, "FF17345F", "FFFFFFFF", 14],
    ["", false],
    ["REQUIRED FIELDS", true, "FFD9AA3D", "FF17345F", 11],
    ["• SKU — Unique product identifier. Cannot be duplicated.", false],
    ["• Product Name — Full product name.", false],
    ["• Category — Must exactly match an existing active category.", false],
    ["• Price (Selling) — Required. Must be a positive number.", false],
    ["• Stock — Required. Must be a whole number >= 0.", false],
    ["", false],
    ["OPTIONAL FIELDS", true, "FFD9AA3D", "FF17345F", 11],
    ["• Pet Type — Dog, Cat, Mouse, Horse, Bird, Fish, Rabbit, Other", false],
    ["• MRP (Sale Price) — Must be >= Selling Price.", false],
    ["• Option Type — size | weight | volume | length | custom", false],
    ["• Capacities — Comma-separated e.g. 100ml,250ml,500ml", false],
    ["• Product Structure — SIMPLE or FAMILY. Family products require Family Variants JSON.", false],
    ["• Option Variants / Family Variants / Color Variants — JSON arrays matching Add Product data.", false],
    ["• Product Details — JSON object. Use the content property for rich-text HTML.", false],
    ["• Main Image URL / Gallery URLs — Public URLs; separate gallery URLs with commas.", false],
    ["• One Excel row equals one product. Put all of that product's variants in its JSON column.", false],
    ["• See the Variant Examples sheet for copy-ready SIMPLE and FAMILY JSON examples.", false],
    ["• Status — Active or Inactive. Active rows require an image URL.", false],
    ["", false],
    ["IMPORT MODES", true, "FFD9AA3D", "FF17345F", 11],
    ["• Add New Only — Skip rows with existing SKUs.", false],
    ["• Update Existing — Skip rows with new SKUs.", false],
    ["• Add + Update — Insert new and update existing.", false],
    ["", false],
    ["AVAILABLE CATEGORIES (Active only)", true, "FFD9AA3D", "FF17345F", 11],
    ...categories.map((c) => [`• ${c.name}`, false]),
  ];
  instructions.forEach(([text, bold, bgColor, fontColor, fontSize]) => {
    const row = instrSheet.addRow([text]);
    const cell = row.getCell(1);
    cell.font = { bold: !!bold, size: fontSize || 10, color: { argb: fontColor || "FF122A50" } };
    if (bgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.alignment = { wrapText: true, vertical: "middle" };
    row.height = bold ? 22 : 16;
  });

  // Copy-ready examples for the two product structures supported by Add Product.
  const examplesSheet = workbook.addWorksheet("Variant Examples");
  examplesSheet.columns = [
    { header: "Product Structure", key: "productType", width: 22 },
    { header: "Product Name", key: "name", width: 28 },
    { header: "Option Variants JSON (SIMPLE)", key: "optionVariants", width: 95 },
    { header: "Family Variants JSON (FAMILY)", key: "familyVariants", width: 115 },
    { header: "How It Works", key: "notes", width: 65 },
  ];
  const simpleExample = JSON.stringify([
    { label: "Small", size: "Small", dose: "", sku: "DEMO-S", price: 12.99, regularPrice: 14.99, stock: 10, status: "Active" },
    { label: "Large", size: "Large", dose: "", sku: "DEMO-L", price: 14.99, regularPrice: 16.99, stock: 8, status: "Active" },
  ]);
  const familyExample = JSON.stringify([
    {
      name: "Small",
      slug: "small",
      weightRange: "2-10 lbs",
      status: "Active",
      skus: [
        { packLabel: "3 Doses", sku: "FAMILY-S-3", regularPrice: 31.24, price: 24.99, stock: 10, status: "Active" },
        { packLabel: "6 Doses", sku: "FAMILY-S-6", regularPrice: 59.98, price: 47.98, stock: 5, status: "Active" },
      ],
    },
  ]);
  const exampleRows = [
    {
      productType: "SIMPLE",
      name: "Example Simple Product",
      optionVariants: simpleExample,
      familyVariants: "",
      notes: "Put this JSON in Option Variants (JSON). Each option is one purchasable SKU.",
    },
    {
      productType: "FAMILY",
      name: "Example Product Family",
      optionVariants: "",
      familyVariants: familyExample,
      notes: "Put this JSON in Family Variants (JSON). Each family variant contains its own SKU rows.",
    },
  ];
  variantExampleRows.forEach((example, index) => {
    const row = examplesSheet.addRow(example);
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 === 0 ? "FFFFFDF7" : "FFFFF8E8" } };
      cell.font = { size: 10 };
    });
    row.height = 110;
  });
  const examplesHeader = examplesSheet.getRow(1);
  examplesHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17345F" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  examplesHeader.height = 30;
  examplesSheet.views = [{ state: "frozen", ySplit: 1 }];

  const addExampleSheet = (name, columns, rows, note) => {
    const sheet = workbook.addWorksheet(name);
    sheet.columns = columns;
    const noteRow = sheet.addRow([note]);
    sheet.mergeCells(1, 1, 1, columns.length);
    noteRow.height = 34;
    noteRow.getCell(1).font = { bold: true, color: { argb: "FF17345F" }, size: 11 };
    noteRow.getCell(1).alignment = { wrapText: true, vertical: "middle" };
    const header = sheet.addRow(columns.map((column) => column.header));
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17345F" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    header.height = 30;
    rows.forEach((rowData, index) => {
      const row = sheet.addRow(rowData);
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 === 0 ? "FFFFFDF7" : "FFFFF8E8" } };
        cell.alignment = { vertical: "top", wrapText: true };
      });
    });
    sheet.views = [{ state: "frozen", ySplit: 2 }];
    return sheet;
  };

  addExampleSheet(
    "Simple Variant Example",
    [
      { header: "Product SKU", key: "productSku", width: 18 },
      { header: "Product Name", key: "productName", width: 28 },
      { header: "Structure", key: "productType", width: 14 },
      { header: "Category", key: "category", width: 22 },
      { header: "Option Type", key: "optionType", width: 14 },
      { header: "Variant Size / Weight", key: "size", width: 22 },
      { header: "Dose / Pack", key: "dose", width: 18 },
      { header: "Variant SKU", key: "sku", width: 18 },
      { header: "Selling Price", key: "price", width: 16 },
      { header: "MRP", key: "regularPrice", width: 16 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Status", key: "status", width: 14 },
    ],
    [
      { productSku: "SIMPLE-001", productName: "Example Collar", productType: "SIMPLE", category: "Apparel", optionType: "size", size: "Small", dose: "", sku: "SIMPLE-001-S", price: 12.99, regularPrice: 14.99, stock: 10, status: "Active" },
      { productSku: "SIMPLE-001", productName: "Example Collar", productType: "SIMPLE", category: "Apparel", optionType: "size", size: "Large", dose: "", sku: "SIMPLE-001-L", price: 14.99, regularPrice: 16.99, stock: 8, status: "Active" },
    ],
    "This is a visual example only. In the Product Import Template sheet, combine these variant rows into one product row and paste the matching JSON into Option Variants (JSON).",
  );

  addExampleSheet(
    "Family Variant Example",
    [
      { header: "Product SKU", key: "productSku", width: 18 },
      { header: "Product Name", key: "productName", width: 28 },
      { header: "Structure", key: "productType", width: 14 },
      { header: "Family Variant", key: "familyVariant", width: 20 },
      { header: "Family Slug", key: "familySlug", width: 18 },
      { header: "Weight Range", key: "weightRange", width: 18 },
      { header: "Pack / Dose", key: "packLabel", width: 18 },
      { header: "Variant SKU", key: "sku", width: 20 },
      { header: "Selling Price", key: "price", width: 16 },
      { header: "MRP", key: "regularPrice", width: 16 },
      { header: "Stock", key: "stock", width: 12 },
      { header: "Status", key: "status", width: 14 },
    ],
    [
      { productSku: "FAMILY-001", productName: "Example Dog Chews", productType: "FAMILY", familyVariant: "Small", familySlug: "small", weightRange: "2-10 lbs", packLabel: "3 Doses", sku: "FAMILY-S-3", price: 24.99, regularPrice: 31.24, stock: 10, status: "Active" },
      { productSku: "FAMILY-001", productName: "Example Dog Chews", productType: "FAMILY", familyVariant: "Small", familySlug: "small", weightRange: "2-10 lbs", packLabel: "6 Doses", sku: "FAMILY-S-6", price: 47.98, regularPrice: 59.98, stock: 5, status: "Active" },
      { productSku: "FAMILY-001", productName: "Example Dog Chews", productType: "FAMILY", familyVariant: "Large", familySlug: "large", weightRange: "41-80 lbs", packLabel: "3 Doses", sku: "FAMILY-L-3", price: 29.99, regularPrice: 37.49, stock: 7, status: "Active" },
    ],
    "This is a visual example only. In the Product Import Template sheet, group these rows into Family Variants (JSON). Each family variant contains its pack/SKU rows.",
  );

  return workbook;
}

// ─── Parse Uploaded Excel File ────────────────────────────────────────────────
async function parseExcelFile(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.getWorksheet("Product Import Template") || workbook.getWorksheet(2) || workbook.getWorksheet(1);
  if (!sheet) throw new ApiError(400, "Excel file has no worksheets");

  const headers = [];
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = getCellText(cell).trim();
  });

  const headerKeyMap = {};
  TEMPLATE_COLUMNS.forEach((col) => {
    const normalizedHeader = col.header.replace(" *", "").toLowerCase().trim();
    for (let i = 1; i <= headers.length; i++) {
      const h = (headers[i] || "").replace(" *", "").toLowerCase().trim();
      if (h === normalizedHeader || h === col.key.toLowerCase()) {
        headerKeyMap[i] = col.key;
      }
    }
  });

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    let hasData = false;
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = headerKeyMap[colNumber];
      if (key) {
        obj[key] = getCellText(cell).trim();
        if (obj[key]) hasData = true;
      }
    });
    if (hasData) rows.push({ rowNumber, data: obj });
  });

  return rows;
}

// ─── Validate Rows ────────────────────────────────────────────────────────────
async function validateRows(rows, importMode = "AddNew", db = prisma) {
  const errors = [];
  const valid = [];
  const seenSkus = new Set();

  const [existingSkus, categories] = await Promise.all([
    db.product.findMany({ select: { sku: true } }).then((p) => new Set(p.map((x) => x.sku.toLowerCase()))),
    db.category.findMany({ where: { status: "Active" }, select: { id: true, name: true } }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase().trim(), c]));

  for (const { rowNumber, data } of rows) {
    const rowErrors = [];

    // SKU
    if (!data.sku) {
      rowErrors.push("SKU is required");
    } else {
      const skuLower = data.sku.toLowerCase();
      if (seenSkus.has(skuLower)) {
        rowErrors.push(`Duplicate SKU "${data.sku}" within this file`);
      } else {
        seenSkus.add(skuLower);
        if (importMode === "AddNew" && existingSkus.has(skuLower)) {
          rowErrors.push(`SKU "${data.sku}" already exists`);
        }
        if (importMode === "UpdateExisting" && !existingSkus.has(skuLower)) {
          rowErrors.push(`SKU "${data.sku}" not found (Update mode)`);
        }
      }
    }

    // Name
    if (!data.name) rowErrors.push("Product Name is required");

    // Category
    if (!data.category) {
      rowErrors.push("Category is required");
    } else {
      const cat = categoryMap.get(data.category.toLowerCase().trim());
      if (!cat) rowErrors.push(`Category "${data.category}" not found or inactive`);
      else data._categoryId = cat.id;
    }

    // Price
    if (data.price !== undefined && data.price !== "") {
      const price = Number(data.price);
      if (isNaN(price) || price <= 0) rowErrors.push("Price must be a positive number");
      else data.price = price;
    } else {
      rowErrors.push("Price (Selling) is required");
    }

    // MRP
    if (data.salePrice !== undefined && data.salePrice !== "") {
      const mrp = Number(data.salePrice);
      if (isNaN(mrp) || mrp < 0) rowErrors.push("MRP must be a non-negative number");
      else {
        data.salePrice = mrp;
        if (data.price && Number(data.price) > mrp) rowErrors.push("Selling price cannot be greater than MRP");
      }
    } else {
      data.salePrice = null;
    }

    // Stock
    if (data.stock !== undefined && data.stock !== "") {
      const stock = Number(data.stock);
      if (isNaN(stock) || !Number.isInteger(stock) || stock < 0) rowErrors.push("Stock must be a whole number >= 0");
      else data.stock = stock;
    } else {
      data.stock = 0;
    }

    // Status
    if (data.status && !["Active", "Inactive"].includes(data.status)) {
      rowErrors.push(`Status must be "Active" or "Inactive"`);
    }
    if (!data.status) data.status = "Inactive";

    const productType = String(data.productType || "SIMPLE").trim().toUpperCase();
    if (!["SIMPLE", "FAMILY"].includes(productType)) {
      rowErrors.push('Product Structure must be "SIMPLE" or "FAMILY"');
    } else {
      data.productType = productType;
    }

    for (const [key, label, fallback] of [
      ["productDetails", "Product Details", {}],
      ["optionVariants", "Option Variants", []],
      ["familyVariants", "Family Variants", []],
      ["colorVariants", "Color Variants", []],
    ]) {
      if (!data[key]) {
        data[key] = fallback;
        continue;
      }
      try {
        data[key] = parseJsonCell(data[key], label, fallback);
        if (key === "productDetails" ? (Array.isArray(data[key]) || typeof data[key] !== "object") : !Array.isArray(data[key])) {
          rowErrors.push(`${label} must be a ${key === "productDetails" ? "JSON object" : "JSON array"}`);
        }
      } catch (error) {
        rowErrors.push(error.message);
      }
    }

    if (data.productType === "FAMILY" && data.familyVariants.length === 0) {
      rowErrors.push("Family products require Family Variants JSON");
    }
    if (data.status === "Active" && !data.image && !String(data.gallery || "").trim()) {
      rowErrors.push("Active products require a Main Image URL or Gallery URL");
    }

    // Option type
    const validOptionTypes = ["size", "weight", "volume", "length", "custom"];
    if (data.optionType && !validOptionTypes.includes(data.optionType.toLowerCase())) {
      rowErrors.push(`Option Type must be one of: ${validOptionTypes.join(", ")}`);
    }

    if (rowErrors.length > 0) {
      errors.push({ rowNumber, sku: data.sku || "", name: data.name || "", reasons: rowErrors });
    } else {
      valid.push({ rowNumber, data });
    }
  }

  return { valid, errors };
}

// ─── Import Valid Rows ────────────────────────────────────────────────────────
async function importRows(validRows, importMode = "AddNew", importedBy = "Admin", db = prisma) {
  const startTime = Date.now();
  let successCount = 0;
  const failedRows = [];

  for (const { rowNumber, data } of validRows) {
    try {
      const productData = buildProductData(data);
      if (importMode === "UpdateExisting") {
        await db.product.update({ where: { sku: data.sku }, data: productData });
      } else if (importMode === "AddOrUpdate") {
        const existing = await db.product.findUnique({ where: { sku: data.sku } });
        if (existing) await db.product.update({ where: { sku: data.sku }, data: productData });
        else await db.product.create({ data: { id: generateId("product"), ...productData } });
      } else {
        await db.product.create({ data: { id: generateId("product"), ...productData } });
      }
      successCount++;
    } catch (err) {
      failedRows.push({ rowNumber, sku: data.sku || "", name: data.name || "", reason: err.message || "Unknown error" });
    }
  }

  return { successCount, failedRows, durationMs: Date.now() - startTime };
}

function buildProductData(data) {
  const capacities = data.capacities
    ? data.capacities.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const productType = data.productType === "FAMILY" ? "FAMILY" : "SIMPLE";
  const parsedOptionVariants = Array.isArray(data.optionVariants) ? data.optionVariants : [];
  const parsedFamilyVariants = Array.isArray(data.familyVariants) ? data.familyVariants : [];

  // Build simple option variants from capacities when explicit variant JSON is not supplied.
  const basePrice = Number(data.price);
  const baseMrp = data.salePrice != null ? Number(data.salePrice) : basePrice;
  const baseStock = Number(data.stock || 0);
  const generatedOptionVariants = capacities.map((label, i) => ({
    id: `${data.sku}-var-${i + 1}`,
    label,
    sku: `${data.sku}-${i + 1}`,
    price: basePrice,
    regularPrice: baseMrp,
    stock: baseStock,
    status: "Active",
  }));
  const optionVariants = productType === "FAMILY"
    ? []
    : (parsedOptionVariants.length ? parsedOptionVariants : generatedOptionVariants);

  const familyVariants = productType === "FAMILY" ? parsedFamilyVariants : [];
  const familySkus = familyVariants.flatMap((variant) => (Array.isArray(variant.skus) ? variant.skus : []));
  const activeFamilySkus = familySkus.filter((sku) => String(sku.status || "Active").toLowerCase() === "active");
  const familyPriceSource = (activeFamilySkus.filter((sku) => Number(sku.stock) > 0).length
    ? activeFamilySkus.filter((sku) => Number(sku.stock) > 0)
    : activeFamilySkus)
    .sort((a, b) => Number(a.price || a.salePrice || a.regularPrice) - Number(b.price || b.salePrice || b.regularPrice))[0];
  const resolvedPrice = productType === "FAMILY"
    ? Number(familyPriceSource?.price || familyPriceSource?.salePrice || familyPriceSource?.regularPrice || basePrice)
    : basePrice;
  const resolvedMrp = productType === "FAMILY"
    ? Number(familyPriceSource?.regularPrice || familyPriceSource?.mrp || resolvedPrice)
    : baseMrp;
  const resolvedStock = productType === "FAMILY"
    ? activeFamilySkus.reduce((total, sku) => total + (Number(sku.stock) || 0), 0)
    : optionVariants.reduce((total, variant) => total + (Number(variant.stock) || 0), 0) || baseStock;
  const gallery = data.gallery
    ? String(data.gallery).split(/[,\n]/).map((url) => url.trim()).filter(Boolean)
    : [];

  return {
    name: data.name,
    description: data.description || null,
    productType,
    price: resolvedPrice,
    salePrice: resolvedMrp,
    stock: resolvedStock,
    sku: data.sku,
    status: data.status || "Inactive",
    petType: data.petType || null,
    optionType: data.optionType || "size",
    optionLabel: data.optionLabel || null,
    capacities,
    optionVariants,
    familyVariants,
    shippingReturns: data.shippingReturns || null,
    returnPolicies: data.returnPolicies || null,
    categoryId: data._categoryId,
    colorVariants: Array.isArray(data.colorVariants) ? data.colorVariants : [],
    image: data.image || null,
    gallery,
    parentContent: data.parentContent || null,
    productDetails: data.productDetails || {},
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    prescriptionRequired: parseBooleanCell(data.prescriptionRequired),
    vetOnly: parseBooleanCell(data.vetOnly),
  };
}

// ─── Save Import History — always uses masterPrisma ─────────────────────────
async function saveImportHistory({ fileName, importedBy, importMode, totalRows, successRows, failedRows, durationMs, errors }) {
  const status = failedRows === 0 ? "Completed" : successRows === 0 ? "Failed" : "PartialSuccess";

  const history = await masterPrisma.productImportHistory.create({
    data: { fileName, importedBy, importMode: importMode || "AddNew", totalRows, successRows, failedRows, durationMs, status },
  });

  if (errors?.length > 0) {
    await masterPrisma.productImportError.createMany({
      data: errors.map((e) => ({
        importId: history.id,
        rowNumber: e.rowNumber,
        sku: e.sku || null,
        name: e.name || null,
        reason: Array.isArray(e.reasons) ? e.reasons.join("; ") : e.reason || "Unknown",
      })),
    });
  }

  return history;
}

// ─── Get Import History — always uses masterPrisma ────────────────────────────
async function getImportHistory() {
  return masterPrisma.productImportHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { errors: true } } },
  });
}

// ─── Get Import Errors — always uses masterPrisma ────────────────────────────
async function getImportErrors(importId) {
  const history = await masterPrisma.productImportHistory.findUnique({ where: { id: importId } });
  if (!history) throw new ApiError(404, "Import history not found");
  const errors = await masterPrisma.productImportError.findMany({ where: { importId }, orderBy: { rowNumber: "asc" } });
  return { history, errors };
}

// ─── Generate Error Report Excel ──────────────────────────────────────────────
async function generateErrorReport(importId) {
  const { history, errors } = await getImportErrors(importId);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Import Error Report");
  sheet.columns = [
    { header: "Row #", key: "rowNumber", width: 10 },
    { header: "SKU", key: "sku", width: 20 },
    { header: "Product Name", key: "name", width: 30 },
    { header: "Reason", key: "reason", width: 60 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 24;

  errors.forEach((err, idx) => {
    const row = sheet.addRow({ rowNumber: err.rowNumber, sku: err.sku || "", name: err.name || "", reason: err.reason });
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFFFF5F5" : "FFFFFFFF" } };
      cell.font = { size: 10 };
    });
  });

  return { workbook, fileName: `Import_Error_Report_${history.fileName}` };
}

// ─── Export Products as Excel ─────────────────────────────────────────────────
async function exportProducts(db = prisma) {
  const products = await db.product.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products Export");
  sheet.columns = TEMPLATE_COLUMNS.map((col) => ({ header: col.header, key: col.key, width: col.width }));

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17345F" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  headerRow.height = 28;

  products.forEach((p, idx) => {
    const row = sheet.addRow({
      sku: p.sku, name: p.name, category: p.category?.name || "",
      petType: p.petType || "", description: p.description || "",
      price: p.price, salePrice: p.salePrice || "", stock: p.stock,
      optionType: p.optionType || "size", optionLabel: p.optionLabel || "",
      capacities: Array.isArray(p.capacities) ? p.capacities.join(",") : "",
      shippingReturns: p.shippingReturns || "", returnPolicies: p.returnPolicies || "",
      status: p.status,
      productType: p.productType || "SIMPLE",
      image: p.image || "",
      gallery: Array.isArray(p.gallery) ? p.gallery.join(",") : "",
      parentContent: p.parentContent || "",
      productDetails: JSON.stringify(p.productDetails || {}),
      optionVariants: JSON.stringify(p.optionVariants || []),
      familyVariants: JSON.stringify(p.familyVariants || []),
      colorVariants: JSON.stringify(p.colorVariants || []),
      seoTitle: p.seoTitle || "",
      seoDescription: p.seoDescription || "",
      prescriptionRequired: p.prescriptionRequired ? "TRUE" : "FALSE",
      vetOnly: p.vetOnly ? "TRUE" : "FALSE",
    });
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFFFFDF7" : "FFFFF8E8" } };
      cell.font = { size: 10 };
    });
  });

  return workbook;
}

module.exports = {
  generateTemplate,
  parseExcelFile,
  validateRows,
  importRows,
  saveImportHistory,
  getImportHistory,
  getImportErrors,
  generateErrorReport,
  exportProducts,
};
