const ExcelJS = require("exceljs");

const input = "C:/sarmanWork/7 connections/Product_Import_Template (2).xlsx";
const output = "C:/sarmanWork/7 connections/Product_Import_Template_TEST_25_FAMILY_5_SIMPLE.xlsx";

const columns = [
  ["SKU *", 20], ["Product Name *", 30], ["Category *", 24], ["Pet Type", 16],
  ["Description", 40], ["Price (Selling) *", 18], ["MRP (Sale Price)", 18], ["Stock *", 12],
  ["Option Type", 14], ["Option Label", 14], ["Capacities", 24], ["Shipping & Returns", 30],
  ["Return Policy", 30], ["Status", 12], ["Product Structure", 24], ["Main Image URL", 34],
  ["Gallery URLs", 40], ["Parent Content", 40], ["Product Details (JSON)", 55],
  ["Option Variants (JSON)", 85], ["Family Variants (JSON)", 110], ["Color Variants (JSON)", 45],
  ["SEO Title", 30], ["SEO Description", 45], ["Prescription Required", 20], ["Vet Only", 12],
];

const money = (value) => Number(value.toFixed(2));
const json = (value) => JSON.stringify(value);

function makeSimple(index) {
  const sku = `BULK-SIMPLE-${String(index).padStart(3, "0")}`;
  const options = ["Small", "Large"].map((size, optionIndex) => ({
    id: `${sku}-${optionIndex + 1}`,
    label: size,
    size,
    dose: "",
    sku: `${sku}-${size.slice(0, 1)}`,
    price: money(12 + index + optionIndex * 2),
    regularPrice: money(15 + index + optionIndex * 2),
    stock: 10 + optionIndex,
    status: "Active",
  }));
  return [
    sku, `Bulk Simple Product ${index}`, "Dental Care", "Dog", "Simple product variant test data.",
    options[0].price, options[0].regularPrice, 21, "size", "Size", "Small,Large",
    "Ships in 2-3 days", "30-day returns", "Inactive", "SIMPLE", "", "", "",
    json({ content: `<p>Bulk simple product ${index} content.</p>`, overview: "Simple product test record." }),
    json(options), "[]", "[]", `Bulk Simple Product ${index}`, "Simple product bulk import test.", "FALSE", "FALSE",
  ];
}

function makeFamily(index) {
  const sku = `BULK-FAMILY-${String(index).padStart(3, "0")}`;
  const familyVariants = ["Small", "Large"].map((name, variantIndex) => ({
    id: `${sku}-${name.toLowerCase()}`,
    name,
    slug: `${sku.toLowerCase()}-${name.toLowerCase()}`,
    displayName: name,
    weightRange: variantIndex === 0 ? "2-10 lbs" : "41-80 lbs",
    status: "Active",
    skus: ["3 Doses", "6 Doses"].map((packLabel, packIndex) => {
      const price = money(20 + index + variantIndex * 3 + packIndex * 8);
      return {
        id: `${sku}-${variantIndex + 1}-${packIndex + 1}`,
        packLabel,
        sku: `${sku}-${variantIndex + 1}-${packIndex + 1}`,
        regularPrice: money(price * 1.25),
        price,
        stock: 8 + packIndex,
        status: "Active",
      };
    }),
  }));
  const firstSku = familyVariants[0].skus[0];
  return [
    sku, `Bulk Family Product ${index}`, "Flea & Tick Care", "Dog", "Family product variant test data.",
    firstSku.price, firstSku.regularPrice, 34, "custom", "Pack", "",
    "Ships in 2-3 days", "30-day returns", "Inactive", "FAMILY", "", "", "",
    json({ content: `<p>Bulk family product ${index} content.</p>`, overview: "Family product test record." }),
    "[]", json(familyVariants), "[]", `Bulk Family Product ${index}`, "Family product bulk import test.", "FALSE", "FALSE",
  ];
}

(async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(input);
  const existingSheet = workbook.getWorksheet("Product Import Template") || workbook.worksheets[1];
  workbook.removeWorksheet(existingSheet.id);
  const sheet = workbook.addWorksheet("Product Import Template");
  const header = sheet.addRow(columns.map(([label]) => label));
  header.height = 32;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17345F" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
  columns.forEach(([label, width], index) => {
    sheet.getColumn(index + 1).width = width;
  });

  const rows = [
    ...Array.from({ length: 25 }, (_, index) => makeFamily(index + 1)),
    ...Array.from({ length: 5 }, (_, index) => makeSimple(index + 1)),
  ];
  rows.forEach((values, index) => {
    const row = sheet.addRow(values);
    row.height = 72;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 === 0 ? "FFFFFDF7" : "FFFFF8E8" } };
    });
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  await workbook.xlsx.writeFile(output);
  console.log(`Created ${output} with ${rows.length} products.`);
})();
