"use strict";

/**
 * Small storefront smoke-test catalog.
 *
 * Seeds exactly 8 products in every active tenant database:
 * - 5 family products with selectable variants
 * - 3 simple products without variants
 *
 * This file intentionally does not modify or import prisma/seedProducts.js.
 * It is safe to run repeatedly because it only upserts these 8 records.
 * Run: npm run seed:eight-products
 * Run one store: npm run seed:eight-products -- --store=STORE_KEY
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { getTenantClient } = require("../src/config/tenantDatabaseManager");

const masterPrisma = new PrismaClient();

const CATEGORY_DEFINITIONS = [
  ["SEED8-DENTAL", "Dental Care"],
  ["SEED8-EAR", "Ear Care"],
  ["SEED8-SKIN", "Skin & Coat Care"],
  ["SEED8-CALMING", "Calming & Anxiety Support"],
  ["SEED8-JOINT", "Joint & Mobility Care"],
  ["SEED8-DIGESTIVE", "Digestive Care"],
];

const IMAGES = {
  toothpaste: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/4/8/9/2/22984-1-eng-GB/f24ba0b83054-309623_Packshot_Enzymatic-Toothpaste_70g_face.png",
  allermyl: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/1/5/2/22518-1-eng-GB/47f38817c5ce-400317_Bottle_Allermyl_250ml_face.png",
  anxitane: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/6/7/2/22767-1-eng-GB/9e8d991077ea-307614_Box_Anxitane_S-x30tabs_face.png",
  movoflex: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/0/1/8/4/144810-1-eng-GB/4ee68ffdff6c-309953_Packshot_Movoflex_S-x30_face.png",
  aquadent: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/5/0/5/2/22505-1-eng-GB/744d55555d27-308911_Bottle-metering_Vet-Aquadent-Fresh_250ml_face.png",
  sebolytic: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/2/5/2/22527-1-eng-GB/f6b5c2b7f625-400550_Bottle_Sebolytic_250ml_face.png",
  epiotic: "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/8/5/2/22588-1-eng-GB/7aa2cc3c683e-309712_Bottle_Epiotic_60ml_face.png",
};

const categoryIdByName = Object.fromEntries(
  CATEGORY_DEFINITIONS.map(([id, name]) => [name, id]),
);
const categoryNameById = Object.fromEntries(
  CATEGORY_DEFINITIONS.map(([id, name]) => [id, name]),
);

const variant = ({ sku, label, price, regularPrice = price, stock = 20, image, details }) => ({
  id: sku,
  label,
  packLabel: label,
  size: label,
  sku,
  price,
  regularPrice,
  stock,
  image,
  description: details,
  details,
  status: "Active",
});

const familyProduct = ({ id, name, sku, category, petType, image, description, variants }) => ({
  id,
  name,
  slug: `seed8-${id.toLowerCase()}`,
  description,
  productType: "FAMILY",
  familyVariants: variants.map((item) => ({
    id: item.id,
    name: item.label,
    displayName: item.label,
    slug: item.id.toLowerCase(),
    image: item.image,
    shortDescription: item.details,
    status: "Active",
    skus: [item],
  })),
  optionVariants: variants,
  optionType: "size",
  optionLabel: "Size / Pack",
  capacities: variants.map((item) => item.label),
  price: variants[0].price,
  salePrice: variants[0].regularPrice,
  stock: variants.reduce((total, item) => total + item.stock, 0),
  sku,
  status: "Active",
  image,
  gallery: [image],
  petType,
  categoryId: categoryIdByName[category],
  productDetails: {
    overview: description,
    benefits: [
      `Designed for ${petType.toLowerCase()}.`,
      "Clearly labeled options make it easy to choose the right pack.",
      "Suitable for routine pet-care use when used according to the product label.",
    ],
    directions: ["Choose the required size or pack above, then select Add.", "Follow the product label and veterinary guidance where applicable."],
    safety: "Keep out of reach of children and pets unless being used as directed. Store according to the product label.",
  },
  prescriptionRequired: false,
  vetOnly: false,
  shippingReturns: "Ships according to store policy.",
  returnPolicies: "Returns accepted for unopened products according to store policy.",
});

const simpleProduct = ({ id, name, sku, category, petType, image, price, description }) => ({
  id,
  name,
  slug: `seed8-${id.toLowerCase()}`,
  description,
  productType: "SIMPLE",
  familyVariants: [],
  optionVariants: [],
  optionType: "none",
  optionLabel: null,
  capacities: [],
  price,
  salePrice: null,
  stock: 25,
  sku,
  status: "Active",
  image,
  gallery: [image],
  petType,
  categoryId: categoryIdByName[category],
  productDetails: {
    overview: description,
    benefits: [`Designed for ${petType.toLowerCase()}.`, "Convenient single product option for everyday pet care."],
    directions: ["Review the product information before adding it to your cart.", "Follow the product label and veterinary guidance where applicable."],
    safety: "Keep out of reach of children and pets unless being used as directed. Store according to the product label.",
  },
  prescriptionRequired: false,
  vetOnly: false,
  shippingReturns: "Ships according to store policy.",
  returnPolicies: "Returns accepted for unopened products according to store policy.",
});

const products = [
  familyProduct({
    id: "FAMILY-TOOTHPASTE",
    name: "Virbac C.E.T. Enzymatic Toothpaste",
    sku: "SEED8-FAMILY-TOOTHPASTE",
    category: "Dental Care",
    petType: "Dog, Cat",
    image: IMAGES.toothpaste,
    description: "Enzymatic toothpaste for routine dental care in dogs and cats.",
    variants: [
      variant({ sku: "SEED8-FAMILY-TOOTHPASTE-70G", label: "70 g tube", price: 9.5, image: IMAGES.toothpaste, details: "70 g tube." }),
      variant({ sku: "SEED8-FAMILY-TOOTHPASTE-2PACK", label: "2 x 70 g tubes", price: 17.5, regularPrice: 19, image: IMAGES.toothpaste, details: "Two 70 g tubes." }),
    ],
  }),
  familyProduct({
    id: "FAMILY-ALLERMYL",
    name: "Virbac Allermyl Shampoo",
    sku: "SEED8-FAMILY-ALLERMYL",
    category: "Skin & Coat Care",
    petType: "Dog, Cat",
    image: IMAGES.allermyl,
    description: "Soothing shampoo for sensitive and itchy pet skin.",
    variants: [
      variant({ sku: "SEED8-FAMILY-ALLERMYL-200ML", label: "200 ml bottle", price: 13.99, image: IMAGES.allermyl, details: "200 ml bottle." }),
      variant({ sku: "SEED8-FAMILY-ALLERMYL-250ML", label: "250 ml bottle", price: 15.99, image: IMAGES.allermyl, details: "250 ml bottle." }),
    ],
  }),
  familyProduct({
    id: "FAMILY-ANXITANE",
    name: "Virbac Anxitane Calming Tablets",
    sku: "SEED8-FAMILY-ANXITANE",
    category: "Calming & Anxiety Support",
    petType: "Dog, Cat",
    image: IMAGES.anxitane,
    description: "Palatable calming tablets to support relaxed pets.",
    variants: [
      variant({ sku: "SEED8-FAMILY-ANXITANE-30", label: "30 tablets", price: 16, image: IMAGES.anxitane, details: "30 tablets." }),
      variant({ sku: "SEED8-FAMILY-ANXITANE-60", label: "60 tablets", price: 29, regularPrice: 32, image: IMAGES.anxitane, details: "60 tablets." }),
    ],
  }),
  familyProduct({
    id: "FAMILY-MOVOFLEX",
    name: "Virbac MOVOFLEX Joint Chews",
    sku: "SEED8-FAMILY-MOVOFLEX",
    category: "Joint & Mobility Care",
    petType: "Dog",
    image: IMAGES.movoflex,
    description: "Soft chews to support joint health and mobility in dogs.",
    variants: [
      variant({ sku: "SEED8-FAMILY-MOVOFLEX-30", label: "30 chews", price: 24.99, image: IMAGES.movoflex, details: "30 chews." }),
      variant({ sku: "SEED8-FAMILY-MOVOFLEX-60", label: "60 chews", price: 44.99, regularPrice: 49.99, image: IMAGES.movoflex, details: "60 chews." }),
    ],
  }),
  familyProduct({
    id: "FAMILY-AQUADENT",
    name: "Virbac Vet Aquadent FR3SH",
    sku: "SEED8-FAMILY-AQUADENT",
    category: "Dental Care",
    petType: "Dog, Cat",
    image: IMAGES.aquadent,
    description: "Fresh water additive for daily oral hygiene support.",
    variants: [
      variant({ sku: "SEED8-FAMILY-AQUADENT-250ML", label: "250 ml bottle", price: 14.5, image: IMAGES.aquadent, details: "250 ml bottle." }),
      variant({ sku: "SEED8-FAMILY-AQUADENT-500ML", label: "500 ml bottle", price: 23.5, regularPrice: 26, image: IMAGES.aquadent, details: "500 ml bottle." }),
    ],
  }),
  simpleProduct({
    id: "SIMPLE-SEBOLYTIC",
    name: "Virbac Sebolytic Shampoo",
    sku: "SEED8-SIMPLE-SEBOLYTIC",
    category: "Skin & Coat Care",
    petType: "Dog, Cat",
    image: IMAGES.sebolytic,
    price: 15.99,
    description: "Shampoo for routine skin and coat hygiene.",
  }),
  simpleProduct({
    id: "SIMPLE-EPIOTIC",
    name: "Virbac EpiOtic Ear Cleaner",
    sku: "SEED8-SIMPLE-EPIOTIC",
    category: "Ear Care",
    petType: "Dog, Cat",
    image: IMAGES.epiotic,
    price: 8.99,
    description: "Gentle ear cleanser for dogs and cats.",
  }),
  simpleProduct({
    id: "SIMPLE-MOVOFLEX-CAT",
    name: "Virbac MOVOFLEX Soft Chews for Cats",
    sku: "SEED8-SIMPLE-MOVOFLEX-CAT",
    category: "Joint & Mobility Care",
    petType: "Cat",
    image: IMAGES.movoflex,
    price: 22.99,
    description: "Soft joint-support chews for cats.",
  }),
];

if (products.length !== 8 || products.filter((item) => item.productType === "FAMILY").length !== 5 || products.filter((item) => item.productType === "SIMPLE").length !== 3) {
  throw new Error("seedEightProducts.js must contain exactly 5 family products and 3 simple products.");
}

async function seedStore(store) {
  const prisma = await getTenantClient(store);
  const categoryIds = {};
  for (const [id, name] of CATEGORY_DEFINITIONS) {
    const existing = await prisma.category.findUnique({ where: { name } });
    if (existing) {
      categoryIds[name] = existing.id;
      await prisma.category.update({ where: { id: existing.id }, data: { status: "Active" } });
    } else {
      categoryIds[name] = id;
      await prisma.category.create({
        data: { id, name, status: "Active", description: `${name} products.` },
      });
    }
  }

  for (const item of products) {
    const { id, ...data } = { ...item, categoryId: categoryIds[categoryNameById[item.categoryId]] };
    await prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  await prisma.$disconnect();
  return { storeKey: store.storeKey, products: products.length, familyProducts: 5, simpleProducts: 3 };
}

async function main() {
  const storeArg = process.argv.find((arg) => arg.startsWith("--store="));
  const storeFilter = storeArg ? { storeKey: storeArg.split("=")[1] } : { status: "ACTIVE" };
  const stores = await masterPrisma.store.findMany({ where: storeFilter, orderBy: { storeKey: "asc" } });
  if (!stores.length) throw new Error("No active stores found.");

  const results = [];
  for (const store of stores) {
    try {
      results.push(await seedStore(store));
      console.log(`[seed:eight-products] ${store.storeKey}: seeded 5 family + 3 simple products`);
    } catch (error) {
      results.push({ storeKey: store.storeKey, error: error.message || String(error) });
      console.error(`[seed:eight-products] ${store.storeKey}: ${error.message || error}`);
    }
  }

  const failures = results.filter((result) => result.error);
  console.log(JSON.stringify({ stores: results.length, succeeded: results.length - failures.length, failed: failures.length, results }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(() => masterPrisma.$disconnect());
