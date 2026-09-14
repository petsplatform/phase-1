"use strict";

/**
 * Local product catalog upsert + verified pet healthcare seed.
 * Run: npm run seed:products
 *
 * This script is intentionally safety-gated. It only runs against a clearly
 * local PostgreSQL database and it does not delete users, orders, payments,
 * settings, customers, or admin accounts.
 *
 * Product names, pack sizes, direct manufacturer prices where available,
 * descriptions, and product images below were checked against official Virbac
 * UK product pages.
 * Prices are stored as the source numeric amount because the current Product
 * model has no currency column; store admins should update sale prices for the
 * active selling market before production use. Products without source prices
 * are seeded Inactive with 0 stock/price for admin review so the storefront and
 * Pet Assistant do not recommend unsellable items.
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { getTenantClient } = require("../src/config/tenantDatabaseManager");

const masterPrisma = new PrismaClient();
let prisma = masterPrisma;
let tenantPrisma = null;

const SOURCE_NOTE =
  "Product information sourced from official Virbac UK product pages. Use according to product label and veterinary guidance. No dosage guidance is provided by this catalog.";

const CATEGORY_DEFINITIONS = [
  ["MED-CAT-FLEA-TICK", "Flea & Tick Care"],
  ["MED-CAT-HEARTWORM", "Heartworm Prevention"],
  ["MED-CAT-DEWORMING", "Deworming"],
  ["MED-CAT-SKIN-COAT", "Skin & Coat Care"],
  ["MED-CAT-EAR-CARE", "Ear Care"],
  ["MED-CAT-EYE-CARE", "Eye Care"],
  ["MED-CAT-DENTAL", "Dental Care"],
  ["MED-CAT-DIGESTIVE", "Digestive Care"],
  ["MED-CAT-JOINT", "Joint & Mobility Care"],
  ["MED-CAT-WOUND-FIRST-AID", "Wound & First Aid"],
  ["MED-CAT-ALLERGY-ITCH", "Allergy & Itch Care"],
  ["MED-CAT-CALMING", "Calming & Anxiety Support"],
  ["MED-CAT-VITAMINS", "Vitamins & Supplements"],
  ["MED-CAT-PROBIOTICS", "Probiotics & Gut Health"],
  ["MED-CAT-KIDNEY-URINARY", "Kidney & Urinary Care"],
  ["MED-CAT-LIVER", "Liver Support"],
  ["MED-CAT-HEART", "Heart Support"],
  ["MED-CAT-RECOVERY", "Recovery & Nutrition"],
  ["MED-CAT-VET-DIET", "Veterinary Diet"],
];

const categoryIdByName = Object.fromEntries(CATEGORY_DEFINITIONS.map(([id, name]) => [name, id]));
const categoryNameById = Object.fromEntries(CATEGORY_DEFINITIONS);

const IMAGES = {
  epiotic:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/8/5/2/22588-1-eng-GB/7aa2cc3c683e-309712_Bottle_Epiotic_60ml_face.png",
  toothpaste:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/4/8/9/2/22984-1-eng-GB/f24ba0b83054-309623_Packshot_Enzymatic-Toothpaste_70g_face.png",
  allermyl:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/1/5/2/22518-1-eng-GB/47f38817c5ce-400317_Bottle_Allermyl_250ml_face.png",
  pyoderm:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/5/8/2/22857-1-eng-GB/63cf1d7c41ac-400523_Bottle_Pyoderm_250ml_face.png",
  anxitane:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/6/7/2/22767-1-eng-GB/9e8d991077ea-307614_Box_Anxitane_S-x30tabs_face.png",
  zenidogCollar:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/2/7/5/2/22572-1-eng-GB/564dfa3d2269-309359_Packshot_Zenidog_Collar-S-x1_face.png",
  sebolytic:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/2/5/2/22527-1-eng-GB/f6b5c2b7f625-400550_Bottle_Sebolytic_250ml_face.png",
  allerdermDry:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/4/3/8/2/22834-1-eng-GB/e9cb2a1d9c85-400546_Bottle_Allerderm_Shampoo-Dry-Skin_250ml_face.png",
  movoflexDog:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/0/1/8/4/144810-1-eng-GB/4ee68ffdff6c-309953_Packshot_Movoflex_S-x30_face.png",
  movoflexCat:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/3/9/2/22938-1-eng-GB/0064204cde3b-400504_Jar_Movoflex_Cat-x30_face.png",
  dentalKit:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/2/0/0/7/77002-1-eng-GB/99581de045d0-303443_Kit_Dental-kit_Fish-flavor_face.jpg",
  toothbrush:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/6/8/5/3/23586-1-eng-GB/3338ae2d92a8-300164_CET_Dual-ended-toothbrush_face.png",
  veggiedentFresh:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/7/5/4/2/22457-1-eng-GB/36e00b9e744a-307864_Bag_Veggiedent-Fr3sh_XS_face.png",
  veggiedentZen:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/1/8/8/2/22881-1-eng-GB/cbe48ca88e07-308303_Bag_Veggiedent-Zen_XS_face.png",
  hexarinse:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/4/0/4/5/115404-1-eng-GB/66739e0b4ff1-303701_Bottle_Hexarinse_237ml_face.png",
  aquadent:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/5/0/5/2/22505-1-eng-GB/744d55555d27-308911_Bottle-metering_Vet-Aquadent-Fresh_250ml_face.png",
  endogard:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/3/5/4/1/21453-1-eng-GB/d47952b77a35-Family-packshot_Endogard.jpg",
  effiproDog:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/3/1/4/1/21413-1-eng-GB/c299e53fdb12-Family-packshot_Effipro-Spot-On.jpg",
  effiproCat:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/5/7/6/3/23675-1-eng-GB/5f63e1319895-309050_Box_Effipro_Cat-x4pip_face.png",
  indorex:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/1/6/6/3/23661-1-eng-GB/94119f097ada-308695_Indorex_Spray_500ml_face.png",
  zenidogDiffuser:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/8/3/5/2/22538-1-eng-GB/37ea5cfd38a9-309361_Packshot_Zenidog_Gel-Diffuser-x1_face.png",
  pronefra:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/6/9/6/2/22696-1-eng-GB/7ce39785fd91-308979_Packshot_Pronefra_60ml_face.png",
  hypoallergyCatA2:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/0/5/6/1/21650-1-eng-GB/b7898a2c72e0-Bag_HPM-A2_cat_face_Packaging-without-kg.jpg",
  digestiveCatG1:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/2/6/1/1/21162-1-eng-GB/cc97e40e7fb8-Bag_HPM-G1_cat_face_Packaging-without-kg.jpg",
  weightCatW1:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/9/5/2/0/20259-1-eng-GB/98cc2c25173e-Bag_HPM-W1_cat_face_Packaging-without-kg.jpg",
  dermatologyCatD1:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/9/2/2/0/20229-1-eng-GB/a91af3c12a45-Bag_HPM-D1_cat_face_Packaging-without-kg.jpg",
  weightDogW1:
    "https://uk.virbac.com/var/site/storage/images/_aliases/metadata_inbound_1200x630/1/0/2/0/20201-1-eng-GB/f2cab2cd9480-Bag_HPM-W1_dog_face_Packaging-without-kg.jpg",
  bravectoToyDog:
    "https://canadapetcare.b-cdn.net/images/ProductImagesNew/bravecto-for-toy-dogs-44-to-99-lbs-yellow.jpg?class=img200",
  bravectoSmallDog:
    "https://canadapetcare.b-cdn.net/images/ProductImagesNew/bravecto-for-small-dogs-99-22lbs-orange.jpg?class=img200",
  bravectoMediumDog:
    "https://canadapetcare.b-cdn.net/images/ProductImagesNew/bravecto-for-medium-dogs-22-44-lbs-green.jpg?class=img200",
  bravectoLargeDog:
    "https://canadapetcare.b-cdn.net/images/ProductImagesNew/bravecto-for-large-dogs-44-88lbs-blue.jpg?class=img200",
  bravectoExtraLargeDog:
    "https://canadapetcare.b-cdn.net/images/ProductImagesNew/bravecto-for-extra-large-dogs-88-123lbs-pink.jpg?class=img200",
};

const CATEGORY_IMAGES = {
  "Flea & Tick Care": IMAGES.allermyl,
  Deworming: IMAGES.epiotic,
  "Skin & Coat Care": IMAGES.allermyl,
  "Ear Care": IMAGES.epiotic,
  "Eye Care": IMAGES.epiotic,
  "Dental Care": IMAGES.toothpaste,
  "Digestive Care": IMAGES.epiotic,
  "Joint & Mobility Care": IMAGES.anxitane,
  "Wound & First Aid": IMAGES.pyoderm,
  "Allergy & Itch Care": IMAGES.allermyl,
  "Calming & Anxiety Support": IMAGES.zenidogCollar,
  "Vitamins & Supplements": IMAGES.anxitane,
  "Probiotics & Gut Health": IMAGES.epiotic,
  "Kidney & Urinary Care": IMAGES.pronefra,
  "Liver Support": IMAGES.pronefra,
  "Heart Support": IMAGES.movoflexDog,
  "Recovery & Nutrition": IMAGES.digestiveCatG1,
  "Veterinary Diet": IMAGES.hypoallergyCatA2,
};

const SOURCE_URLS = {
  epiotic: "https://uk.virbac.com/products/epiotic-ear-cleaner-for-dogs-cats-cleans-deodorises",
  toothpaste: "https://uk.virbac.com/products/enzymatic-toothpaste-for-dogs-cats?variant=3828",
  allermyl: "https://uk.virbac.com/products/skin-care/allermyl-shampoo-dogs-and-cats",
  pyoderm: "https://uk.virbac.com/products/pyoderm-shampoo-for-dogs-cats-anti-bacterial-anti-fungal",
  anxitane: "https://uk.virbac.com/products/anxitane-for-dogs-cats-help-calm-reduce-anxiety?category=126",
  zenidogCollar: "https://uk.virbac.com/products/zenidog-collar-with-calming-pheromones-for-dogs",
  sebolytic: "https://uk.virbac.com/products/sebolytic-shampoo-for-dogs-cats-greasy-scaly-skin",
  allerdermDry: "https://uk.virbac.com/products/allerderm-shampoo-for-cats-dogs-dry-scaly-skin",
  movoflexDog: "https://uk.virbac.com/products/movoflex-soft-chews-joint-supplements-for-dogs",
  movoflexCat: "https://uk.virbac.com/products/movoflex-soft-chews-joint-supplements-for-cats",
  dentalKit: "https://uk.virbac.com/products/oral-hygiene-kit-toothbrush-paste-for-dogs-cats",
  toothbrush: "https://uk.virbac.com/products/dual-ended-toothbrush-for-dogs-cats-for-easy-brushing",
  veggiedentFresh: "https://uk.virbac.com/products/veggiedent-fresh-dental-chews-for-dogs",
  veggiedentZen: "https://uk.virbac.com/products/veggiedent-zen-dental-chews-calming-treats-for-dogs",
  hexarinse: "https://uk.virbac.com/products/hexarinse-oral-rinse-oral-hygiene-for-dogs-cats",
  aquadent: "https://uk.virbac.com/products/vet-aquadent-fresh-water-additive-for-dogs-cats",
  endogard: "https://uk.virbac.com/products/endogard-plus-broad-spectrum-worming-tablet-for-dogs",
  effiproDog: "https://uk.virbac.com/products/effipro-spot-on-for-dogs-flea-tick-treatment",
  effiproCat: "https://uk.virbac.com/products/effipro-spot-on-for-cats-flea-tick-treatment",
  indorex: "https://uk.virbac.com/products/indorex-defence-household-flea-spray",
  zenidogDiffuser: "https://uk.virbac.com/products/zenidog-gel-diffuser-with-calming-pheromones-for-dogs",
  pronefra: "https://uk.virbac.com/products/pronefra-kidney-support-supplement-for-cats-dogs",
  hypoallergyCatA2: "https://uk.virbac.com/products/hypoallergy-cat-food-a2-for-cats-with-food-allergies",
  digestiveCatG1: "https://uk.virbac.com/products/digestive-support-cat-food-g1-for-digestive-issues",
  weightCatW1: "https://uk.virbac.com/products/weight-loss-diabetes-cat-food-w1-healthy-weight-loss",
  dermatologyCatD1: "https://uk.virbac.com/products/dermatology-support-cat-food-skin-hair-health",
  weightDogW1: "https://uk.virbac.com/products/dog-weight-loss-diabetes-w1-dry-food-for-dogs",
};

function variant({
  code,
  size,
  weightRange,
  dose,
  packSize,
  packLabel,
  familyVariantId,
  familyVariantName,
  familyVariantSlug,
  regularPrice,
  salePrice,
  stock,
  image,
  details,
}) {
  return {
    id: code,
    label: size,
    size,
    weightRange: weightRange ?? null,
    dose: dose ?? null,
    packSize: packSize ?? null,
    packLabel: packLabel ?? null,
    familyVariantId: familyVariantId ?? null,
    familyVariantName: familyVariantName ?? null,
    familyVariantSlug: familyVariantSlug ?? null,
    sku: code,
    price: salePrice ?? regularPrice,
    regularPrice,
    stock,
    image,
    description: details,
    details,
    status: "Active",
  };
}

function product({
  id,
  name,
  brand,
  category,
  sku,
  petType,
  productType,
  image,
  sourceUrl,
  description,
  variants = [],
  family = false,
  price,
  stock = 25,
  status = "Active",
  prescriptionRequired = false,
  vetOnly = false,
}) {
  const activeVariants = variants.filter((item) => item.status === "Active");
  const primaryVariant = activeVariants[0] || variants[0] || null;
  const aggregateStock = variants.length
    ? activeVariants.reduce((total, item) => total + Number(item.stock || 0), 0)
    : stock;

  return {
    id,
    name,
    categoryId: categoryIdByName[category],
    sku,
    productType: family ? "FAMILY" : "SIMPLE",
    petType,
    optionType: "pack",
    optionLabel: "Pack / Size",
    capacities: variants.map((item) => item.label),
    optionVariants: variants,
    price: primaryVariant ? primaryVariant.price : price,
    salePrice: primaryVariant ? primaryVariant.regularPrice : null,
    stock: aggregateStock,
    status,
    image,
    gallery: [image],
    description: [
      `Brand: ${brand}.`,
      `Product type: ${productType}.`,
      description,
      prescriptionRequired ? "Veterinary prescription may be required. Use under veterinary guidance." : "Non-prescription pet healthcare product; follow the product label.",
      SOURCE_NOTE,
      `Source: ${sourceUrl}`,
    ].join(" "),
    shippingReturns: "Healthcare products ship according to store policy. Keep sealed and inspect packaging on delivery.",
    returnPolicies: "Returns accepted only for unopened products according to store policy. Prescription products may have additional restrictions.",
    prescriptionRequired,
    vetOnly,
  };
}

const products = [
  product({
    id: "MED-PRD-VIRBAC-EPIOTIC",
    name: "Virbac EpiOtic Ear Cleaner for Dogs & Cats",
    brand: "Virbac",
    category: "Ear Care",
    sku: "VIRBAC-EPIOTIC",
    petType: "Dog, Cat",
    productType: "Ear Cleaner",
    image: IMAGES.epiotic,
    sourceUrl: SOURCE_URLS.epiotic,
    description: "Gentle ear cleanser that helps remove dirt and excess wax and neutralise ear odours in dogs and cats.",
    variants: [
      variant({ code: "VIRBAC-EPIOTIC-60ML", size: "60 ml bottle", packSize: 60, regularPrice: 8.99, stock: 24, image: IMAGES.epiotic, details: "60 ml bottle." }),
      variant({ code: "VIRBAC-EPIOTIC-125ML", size: "125 ml bottle", packSize: 125, regularPrice: 12.5, stock: 18, image: IMAGES.epiotic, details: "125 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-CET-TOOTHPASTE",
    name: "Virbac C.E.T. Enzymatic Toothpaste for Dogs & Cats",
    brand: "Virbac",
    category: "Dental Care",
    sku: "VIRBAC-CET-TOOTHPASTE",
    petType: "Dog, Cat",
    productType: "Dental Product",
    image: IMAGES.toothpaste,
    sourceUrl: SOURCE_URLS.toothpaste,
    description: "Enzymatic toothpaste formulated for dogs and cats to support routine plaque control and breath freshness.",
    variants: [
      variant({ code: "VIRBAC-CET-70G-POULTRY", size: "70 g tube - Poultry", packSize: 70, regularPrice: 9.5, stock: 30, image: IMAGES.toothpaste, details: "70 g poultry-flavour tube." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-ALLERMYL",
    name: "Virbac Allermyl Shampoo for Dogs & Cats",
    brand: "Virbac",
    category: "Allergy & Itch Care",
    sku: "VIRBAC-ALLERMYL",
    petType: "Dog, Cat",
    productType: "Shampoo",
    image: IMAGES.allermyl,
    sourceUrl: SOURCE_URLS.allermyl,
    description: "Soothing moisturising shampoo for dogs and cats with itchy skin, sensitivities, or allergic-type skin.",
    variants: [
      variant({ code: "VIRBAC-ALLERMYL-250ML", size: "250 ml bottle", packSize: 250, regularPrice: 15.99, stock: 20, image: IMAGES.allermyl, details: "250 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-PYODERM",
    name: "Virbac Pyoderm Shampoo for Dogs & Cats",
    brand: "Virbac",
    category: "Skin & Coat Care",
    sku: "VIRBAC-PYODERM",
    petType: "Dog, Cat",
    productType: "Shampoo",
    image: IMAGES.pyoderm,
    sourceUrl: SOURCE_URLS.pyoderm,
    description: "Pet shampoo with chlorhexidine and skin-supporting technology for routine skin and coat hygiene.",
    variants: [
      variant({ code: "VIRBAC-PYODERM-250ML", size: "250 ml bottle", packSize: 250, regularPrice: 15.99, stock: 16, image: IMAGES.pyoderm, details: "250 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-SEBOLYTIC",
    name: "Virbac Sebolytic Shampoo for Dogs & Cats",
    brand: "Virbac",
    category: "Skin & Coat Care",
    sku: "VIRBAC-SEBOLYTIC",
    petType: "Dog, Cat",
    productType: "Shampoo",
    image: IMAGES.sebolytic,
    sourceUrl: SOURCE_URLS.sebolytic,
    description: "Shampoo for dogs and cats with greasy, scaly, or odorous skin; supports routine skin hygiene.",
    variants: [
      variant({ code: "VIRBAC-SEBOLYTIC-250ML", size: "250 ml bottle", packSize: 250, regularPrice: 15.99, stock: 9, image: IMAGES.sebolytic, details: "250 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-ANXITANE",
    name: "Virbac Anxitane Tablets for Dogs & Cats",
    brand: "Virbac",
    category: "Calming & Anxiety Support",
    sku: "VIRBAC-ANXITANE",
    petType: "Dog, Cat",
    productType: "Tablet",
    image: IMAGES.anxitane,
    sourceUrl: SOURCE_URLS.anxitane,
    description: "Palatable L-theanine calming tablets to help maintain calm and relaxation in dogs and cats.",
    variants: [
      variant({ code: "VIRBAC-ANXITANE-S-30", size: "Small dog & Cat - 30 tablets", packSize: 30, regularPrice: 16, stock: 22, image: IMAGES.anxitane, details: "30 tablets for small dogs and cats." }),
      variant({ code: "VIRBAC-ANXITANE-ML-30", size: "Medium & Large dog - 30 tablets", packSize: 30, regularPrice: 18, stock: 18, image: IMAGES.anxitane, details: "30 tablets for medium and large dogs." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-ZENIDOG-COLLAR",
    name: "Virbac Zenidog Collar with Calming Pheromones for Dogs",
    brand: "Virbac",
    category: "Calming & Anxiety Support",
    sku: "VIRBAC-ZENIDOG-COLLAR",
    petType: "Dog",
    productType: "Calming Collar",
    image: IMAGES.zenidogCollar,
    sourceUrl: SOURCE_URLS.zenidogCollar,
    description: "Dog calming collar that releases canine appeasing pheromone analogue and lasts up to 3 months.",
    variants: [
      variant({ code: "VIRBAC-ZENIDOG-S", size: "Small dog collar", packSize: 1, regularPrice: 29.95, stock: 12, image: IMAGES.zenidogCollar, details: "Small dog collar." }),
      variant({ code: "VIRBAC-ZENIDOG-ML", size: "Medium & Large dog collar", packSize: 1, regularPrice: 29.95, stock: 12, image: IMAGES.zenidogCollar, details: "Medium and large dog collar." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-ALLERDERM-DRY-SCALY",
    name: "Virbac Allerderm Shampoo for Cats & Dogs - Dry & Scaly Skin",
    brand: "Virbac",
    category: "Skin & Coat Care",
    sku: "VIRBAC-ALLERDERM-DRY-SCALY",
    petType: "Dog, Cat, Puppy, Kitten",
    productType: "Shampoo",
    image: IMAGES.allerdermDry,
    sourceUrl: SOURCE_URLS.allerdermDry,
    description: "Soap-free shampoo for dogs and cats with dry, flaky, or scaly skin; suitable for all ages according to the source product page.",
    variants: [
      variant({ code: "VIRBAC-ALLERDERM-DRY-250ML", size: "250 ml bottle", packSize: 250, regularPrice: 15.99, salePrice: 7.95, stock: 1, image: IMAGES.allerdermDry, details: "250 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-MOVOFLEX-DOG",
    name: "Virbac MOVOFLEX Soft Chews - Joint Supplements for Dogs",
    brand: "Virbac",
    category: "Joint & Mobility Care",
    sku: "VIRBAC-MOVOFLEX-DOG",
    petType: "Dog, Senior Dog",
    productType: "Chewable",
    image: IMAGES.movoflexDog,
    sourceUrl: SOURCE_URLS.movoflexDog,
    description: "Soft chew joint supplement formulated to support joint health, mobility, structure, and flexibility in dogs.",
    variants: [
      variant({ code: "VIRBAC-MOVOFLEX-DOG-S-30", size: "Small dog - 30 chews", packSize: 30, regularPrice: 24.99, stock: 1, image: IMAGES.movoflexDog, details: "Small dog pack." }),
      variant({ code: "VIRBAC-MOVOFLEX-DOG-M-30", size: "Medium dog - 30 chews", packSize: 30, regularPrice: 27.99, stock: 1, image: IMAGES.movoflexDog, details: "Medium dog pack." }),
      variant({ code: "VIRBAC-MOVOFLEX-DOG-L-30", size: "Large dog - 30 chews", packSize: 30, regularPrice: 33.99, stock: 1, image: IMAGES.movoflexDog, details: "Large dog pack." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-MOVOFLEX-CAT",
    name: "Virbac MOVOFLEX Soft Chews - Joint Supplements for Cats",
    brand: "Virbac",
    category: "Joint & Mobility Care",
    sku: "VIRBAC-MOVOFLEX-CAT",
    petType: "Cat, Senior Cat",
    productType: "Chewable",
    image: IMAGES.movoflexCat,
    sourceUrl: SOURCE_URLS.movoflexCat,
    description: "Soft chew joint supplement formulated to support joint health, mobility, structure, and flexibility in cats.",
    variants: [
      variant({ code: "VIRBAC-MOVOFLEX-CAT-30", size: "30 chews", packSize: 30, regularPrice: 24.99, stock: 1, image: IMAGES.movoflexCat, details: "30 chews." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-DENTAL-KIT",
    name: "Virbac Oral Hygiene Kit - Toothbrush & Paste for Dogs & Cats",
    brand: "Virbac",
    category: "Dental Care",
    sku: "VIRBAC-DENTAL-KIT",
    petType: "Dog, Cat",
    productType: "Dental Product",
    image: IMAGES.dentalKit,
    sourceUrl: SOURCE_URLS.dentalKit,
    description: "Complete oral hygiene kit with finger brush, dual-head toothbrush, and dual-enzyme toothpaste.",
    variants: [
      variant({ code: "VIRBAC-DENTAL-KIT-43G", size: "43 g kit", packSize: 43, regularPrice: 11.99, stock: 1, image: IMAGES.dentalKit, details: "43 g kit." }),
      variant({ code: "VIRBAC-DENTAL-KIT-70G", size: "70 g kit", packSize: 70, regularPrice: 27.88, stock: 1, image: IMAGES.dentalKit, details: "70 g kit." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-DUAL-TOOTHBRUSH",
    name: "Virbac Dual-Ended Toothbrush for Dogs & Cats",
    brand: "Virbac",
    category: "Dental Care",
    sku: "VIRBAC-DUAL-TOOTHBRUSH",
    petType: "Dog, Cat",
    productType: "Dental Product",
    image: IMAGES.toothbrush,
    sourceUrl: SOURCE_URLS.toothbrush,
    description: "Ergonomic dual-ended toothbrush for cleaning large and small mouth areas in dogs and cats.",
    variants: [
      variant({ code: "VIRBAC-DUAL-TOOTHBRUSH-1", size: "1 unit", packSize: 1, regularPrice: 6.99, stock: 1, image: IMAGES.toothbrush, details: "1 toothbrush." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-VEGGIEDENT-FR3SH",
    name: "Virbac VEGGIEDENT FR3SH Dental Chews for Dogs",
    brand: "Virbac",
    category: "Dental Care",
    sku: "VIRBAC-VEGGIEDENT-FR3SH",
    petType: "Dog",
    productType: "Dental Product",
    image: IMAGES.veggiedentFresh,
    sourceUrl: SOURCE_URLS.veggiedentFresh,
    description: "Natural-origin dental chews for dogs that help clean teeth and support fresher breath.",
    variants: [
      variant({ code: "VIRBAC-VEGGIEDENT-FR3SH-XS", size: "Extra small dog", packSize: 1, regularPrice: 8.00, stock: 1, image: IMAGES.veggiedentFresh, details: "Extra small dog pack." }),
      variant({ code: "VIRBAC-VEGGIEDENT-FR3SH-S", size: "Small dog", packSize: 1, regularPrice: 8.25, stock: 1, image: IMAGES.veggiedentFresh, details: "Small dog pack." }),
      variant({ code: "VIRBAC-VEGGIEDENT-FR3SH-M", size: "Medium dog", packSize: 1, regularPrice: 10.75, stock: 1, image: IMAGES.veggiedentFresh, details: "Medium dog pack." }),
      variant({ code: "VIRBAC-VEGGIEDENT-FR3SH-L", size: "Large dog", packSize: 1, regularPrice: 12.25, stock: 1, image: IMAGES.veggiedentFresh, details: "Large dog pack." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-VEGGIEDENT-ZEN",
    name: "Virbac VeggieDent ZEN Dental Chews - Calming Treats for Dogs",
    brand: "Virbac",
    category: "Calming & Anxiety Support",
    sku: "VIRBAC-VEGGIEDENT-ZEN",
    petType: "Dog",
    productType: "Chewable",
    image: IMAGES.veggiedentZen,
    sourceUrl: SOURCE_URLS.veggiedentZen,
    description: "Dog dental chew product positioned by the source page as a calming treat that also supports dental hygiene.",
    variants: [
      variant({ code: "VIRBAC-VEGGIEDENT-ZEN-XS", size: "Extra small dog", packSize: 1, regularPrice: 8.25, stock: 1, image: IMAGES.veggiedentZen, details: "Extra small dog pack." }),
      variant({ code: "VIRBAC-VEGGIEDENT-ZEN-S", size: "Small dog", packSize: 1, regularPrice: 9.50, stock: 1, image: IMAGES.veggiedentZen, details: "Small dog pack." }),
      variant({ code: "VIRBAC-VEGGIEDENT-ZEN-M", size: "Medium dog", packSize: 1, regularPrice: 12.75, stock: 1, image: IMAGES.veggiedentZen, details: "Medium dog pack." }),
      variant({ code: "VIRBAC-VEGGIEDENT-ZEN-L", size: "Large dog", packSize: 1, regularPrice: 15.95, stock: 1, image: IMAGES.veggiedentZen, details: "Large dog pack." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-HEXARINSE",
    name: "Virbac Hexarinse Oral Rinse for Dogs & Cats",
    brand: "Virbac",
    category: "Dental Care",
    sku: "VIRBAC-HEXARINSE",
    petType: "Dog, Cat",
    productType: "Dental Product",
    image: IMAGES.hexarinse,
    sourceUrl: SOURCE_URLS.hexarinse,
    description: "Oral hygiene rinse for cats and dogs to help control oral bacteria, plaque, minor gum irritation, and bad breath.",
    variants: [
      variant({ code: "VIRBAC-HEXARINSE-237ML", size: "237 ml bottle", packSize: 237, regularPrice: 10.99, stock: 1, image: IMAGES.hexarinse, details: "237 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-AQUADENT-FR3SH",
    name: "Virbac Vet Aquadent FR3SH Water Additive for Dogs & Cats",
    brand: "Virbac",
    category: "Dental Care",
    sku: "VIRBAC-AQUADENT-FR3SH",
    petType: "Dog, Cat",
    productType: "Dental Product",
    image: IMAGES.aquadent,
    sourceUrl: SOURCE_URLS.aquadent,
    description: "Water additive for dogs and cats positioned by the source page for routine oral hygiene and fresher breath.",
    variants: [
      variant({ code: "VIRBAC-AQUADENT-FR3SH-250ML", size: "250 ml bottle", packSize: 250, regularPrice: 9.99, stock: 1, image: IMAGES.aquadent, details: "250 ml bottle." }),
      variant({ code: "VIRBAC-AQUADENT-FR3SH-500ML", size: "500 ml bottle", packSize: 500, regularPrice: 13.45, stock: 1, image: IMAGES.aquadent, details: "500 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-ENDOGARD-PLUS-DOG",
    name: "Virbac Endogard Plus Broad-Spectrum Worming Tablets for Dogs",
    brand: "Virbac",
    category: "Deworming",
    sku: "VIRBAC-ENDOGARD-PLUS-DOG",
    petType: "Dog, Puppy",
    productType: "Tablet",
    image: IMAGES.endogard,
    sourceUrl: SOURCE_URLS.endogard,
    description: "Broad-spectrum dog worming tablets for roundworms, tapeworms, and hookworms. Price was not listed on the official product page.",
    status: "Inactive",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-ENDOGARD-PLUS-100", size: "100 tablets", packSize: 100, regularPrice: 0, stock: 0, image: IMAGES.endogard, details: "100 tablets." }),
      variant({ code: "VIRBAC-ENDOGARD-PLUS-XL-12", size: "12 tablets", packSize: 12, regularPrice: 0, stock: 0, image: IMAGES.endogard, details: "12 tablets." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-EFFIPRO-DOG",
    name: "Virbac Effipro Spot-On Flea & Tick Treatment for Dogs",
    brand: "Virbac",
    category: "Flea & Tick Care",
    sku: "VIRBAC-EFFIPRO-DOG",
    petType: "Dog, Puppy",
    productType: "Spot-On",
    image: IMAGES.effiproDog,
    sourceUrl: SOURCE_URLS.effiproDog,
    description: "Fipronil spot-on flea and tick treatment for dogs, available in multiple dog weight sizes. Price was not listed on the official product page.",
    status: "Inactive",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-EFFIPRO-DOG-S", size: "Small dog - 4 pipettes", packSize: 4, regularPrice: 0, stock: 0, image: IMAGES.effiproDog, details: "Small dog pack." }),
      variant({ code: "VIRBAC-EFFIPRO-DOG-M", size: "Medium dog - 4 pipettes", packSize: 4, regularPrice: 0, stock: 0, image: IMAGES.effiproDog, details: "Medium dog pack." }),
      variant({ code: "VIRBAC-EFFIPRO-DOG-L", size: "Large dog - 4 pipettes", packSize: 4, regularPrice: 0, stock: 0, image: IMAGES.effiproDog, details: "Large dog pack." }),
      variant({ code: "VIRBAC-EFFIPRO-DOG-XL", size: "Extra large dog - 4 pipettes", packSize: 4, regularPrice: 0, stock: 0, image: IMAGES.effiproDog, details: "Extra large dog pack." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-EFFIPRO-CAT",
    name: "Virbac Effipro Spot-On Flea & Tick Treatment for Cats",
    brand: "Virbac",
    category: "Flea & Tick Care",
    sku: "VIRBAC-EFFIPRO-CAT",
    petType: "Cat, Kitten",
    productType: "Spot-On",
    image: IMAGES.effiproCat,
    sourceUrl: SOURCE_URLS.effiproCat,
    description: "Fipronil spot-on flea and tick treatment for cats supplied as a 4 pipette pack. Price was not listed on the official product page.",
    status: "Inactive",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-EFFIPRO-CAT-4", size: "4 pipettes", packSize: 4, regularPrice: 0, stock: 0, image: IMAGES.effiproCat, details: "4 pipettes." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-INDOREX",
    name: "Virbac Indorex Defence Household Flea Spray",
    brand: "Virbac",
    category: "Flea & Tick Care",
    sku: "VIRBAC-INDOREX",
    petType: "Dog, Cat",
    productType: "Spray",
    image: IMAGES.indorex,
    sourceUrl: SOURCE_URLS.indorex,
    description: "Household flea spray for environmental flea control. Price was not listed on the official product page.",
    status: "Inactive",
    variants: [
      variant({ code: "VIRBAC-INDOREX-500ML", size: "500 ml spray", packSize: 500, regularPrice: 0, stock: 0, image: IMAGES.indorex, details: "500 ml spray." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-ZENIDOG-DIFFUSER",
    name: "Virbac Zenidog Gel Diffuser with Calming Pheromones for Dogs",
    brand: "Virbac",
    category: "Calming & Anxiety Support",
    sku: "VIRBAC-ZENIDOG-DIFFUSER",
    petType: "Dog",
    productType: "Calming Diffuser",
    image: IMAGES.zenidogDiffuser,
    sourceUrl: SOURCE_URLS.zenidogDiffuser,
    description: "Electric-free portable calming pheromone gel diffuser for dogs.",
    variants: [
      variant({ code: "VIRBAC-ZENIDOG-DIFFUSER-230G", size: "230 g diffuser", packSize: 230, regularPrice: 30.95, stock: 1, image: IMAGES.zenidogDiffuser, details: "230 g diffuser." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-PRONEFRA",
    name: "Virbac Pronefra Kidney Support for Cats & Dogs",
    brand: "Virbac",
    category: "Kidney & Urinary Care",
    sku: "VIRBAC-PRONEFRA",
    petType: "Dog, Cat",
    productType: "Oral Suspension",
    image: IMAGES.pronefra,
    sourceUrl: SOURCE_URLS.pronefra,
    description: "Palatable liquid kidney-support product for cats and dogs, with 60 ml and 180 ml packs listed on the source page.",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-PRONEFRA-60ML", size: "60 ml bottle", packSize: 60, regularPrice: 16.99, stock: 1, image: IMAGES.pronefra, details: "60 ml bottle." }),
      variant({ code: "VIRBAC-PRONEFRA-180ML", size: "180 ml bottle", packSize: 180, regularPrice: 41.99, stock: 1, image: IMAGES.pronefra, details: "180 ml bottle." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-HPM-HYPOALLERGY-CAT-A2",
    name: "Virbac Veterinary HPM Hypoallergy Cat Food A2",
    brand: "Virbac",
    category: "Veterinary Diet",
    sku: "VIRBAC-HPM-HYPOALLERGY-CAT-A2",
    petType: "Cat",
    productType: "Veterinary Diet",
    image: IMAGES.hypoallergyCatA2,
    sourceUrl: SOURCE_URLS.hypoallergyCatA2,
    description: "Veterinary HPM hypoallergenic dry cat food for cats with food allergies or intolerances, according to the source page.",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-HPM-HYPOALLERGY-CAT-A2-3KG", size: "3 kg bag", packSize: 3, regularPrice: 58.00, stock: 1, image: IMAGES.hypoallergyCatA2, details: "3 kg bag." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-HPM-DIGESTIVE-CAT-G1",
    name: "Virbac Veterinary HPM Digestive Support Cat Food G1",
    brand: "Virbac",
    category: "Digestive Care",
    sku: "VIRBAC-HPM-DIGESTIVE-CAT-G1",
    petType: "Cat",
    productType: "Veterinary Diet",
    image: IMAGES.digestiveCatG1,
    sourceUrl: SOURCE_URLS.digestiveCatG1,
    description: "Veterinary HPM dry cat food positioned for digestive health and recovery in cats with gastrointestinal difficulties.",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-HPM-DIGESTIVE-CAT-G1-1-5KG", size: "1.5 kg bag", packSize: 1.5, regularPrice: 29.50, stock: 1, image: IMAGES.digestiveCatG1, details: "1.5 kg bag." }),
      variant({ code: "VIRBAC-HPM-DIGESTIVE-CAT-G1-3KG", size: "3 kg bag", packSize: 3, regularPrice: 50.00, stock: 1, image: IMAGES.digestiveCatG1, details: "3 kg bag." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-HPM-WEIGHT-CAT-W1",
    name: "Virbac Veterinary HPM Weight Loss Cat Food W1",
    brand: "Virbac",
    category: "Veterinary Diet",
    sku: "VIRBAC-HPM-WEIGHT-CAT-W1",
    petType: "Cat",
    productType: "Veterinary Diet",
    image: IMAGES.weightCatW1,
    sourceUrl: SOURCE_URLS.weightCatW1,
    description: "Veterinary HPM dry cat food positioned for healthy weight loss and diabetes-related weight management support.",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-HPM-WEIGHT-CAT-W1-1-5KG", size: "1.5 kg bag", packSize: 1.5, regularPrice: 21.50, stock: 1, image: IMAGES.weightCatW1, details: "1.5 kg bag." }),
      variant({ code: "VIRBAC-HPM-WEIGHT-CAT-W1-3KG", size: "3 kg bag", packSize: 3, regularPrice: 36.50, stock: 1, image: IMAGES.weightCatW1, details: "3 kg bag." }),
      variant({ code: "VIRBAC-HPM-WEIGHT-CAT-W1-7KG", size: "7 kg bag", packSize: 7, regularPrice: 80.00, stock: 1, image: IMAGES.weightCatW1, details: "7 kg bag." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-HPM-DERMATOLOGY-CAT-D1",
    name: "Virbac Veterinary HPM Dermatology Support Cat Food D1",
    brand: "Virbac",
    category: "Skin & Coat Care",
    sku: "VIRBAC-HPM-DERMATOLOGY-CAT-D1",
    petType: "Cat",
    productType: "Veterinary Diet",
    image: IMAGES.dermatologyCatD1,
    sourceUrl: SOURCE_URLS.dermatologyCatD1,
    description: "Veterinary HPM dry cat food positioned by the source page for skin and coat support.",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-HPM-DERMATOLOGY-CAT-D1-3KG", size: "3 kg bag", packSize: 3, regularPrice: 51.00, stock: 1, image: IMAGES.dermatologyCatD1, details: "3 kg bag." }),
    ],
  }),
  product({
    id: "MED-PRD-VIRBAC-HPM-WEIGHT-DOG-W1",
    name: "Virbac Veterinary HPM Weight Loss Dog Food W1",
    brand: "Virbac",
    category: "Veterinary Diet",
    sku: "VIRBAC-HPM-WEIGHT-DOG-W1",
    petType: "Dog",
    productType: "Veterinary Diet",
    image: IMAGES.weightDogW1,
    sourceUrl: SOURCE_URLS.weightDogW1,
    description: "Veterinary HPM dry dog food positioned for healthy weight loss and diabetes-related weight management support.",
    prescriptionRequired: true,
    variants: [
      variant({ code: "VIRBAC-HPM-WEIGHT-DOG-W1-3KG", size: "3 kg bag", packSize: 3, regularPrice: 31.95, stock: 1, image: IMAGES.weightDogW1, details: "3 kg bag." }),
      variant({ code: "VIRBAC-HPM-WEIGHT-DOG-W1-7KG", size: "7 kg bag", packSize: 7, regularPrice: 59.00, stock: 1, image: IMAGES.weightDogW1, details: "7 kg bag." }),
      variant({ code: "VIRBAC-HPM-WEIGHT-DOG-W1-12KG", size: "12 kg bag", packSize: 12, regularPrice: 83.00, stock: 1, image: IMAGES.weightDogW1, details: "12 kg bag." }),
    ],
  }),
  product({
    id: "MED-PRD-BRAVECTO-DOG-CHEWS",
    name: "Bravecto Chewables for Dogs - 3 Month Flea & Tick Protection",
    brand: "Bravecto",
    category: "Flea & Tick Care",
    sku: "BRAVECTO-DOG-CHEWS",
    petType: "Dog",
    productType: "Flea & Tick Chewable",
    image: IMAGES.bravectoToyDog,
    sourceUrl: "https://www.canadapetcare.com/bravecto-for-dogs/flea-and-tick-control-treatment-278.aspx",
    description: "Fluralaner chewable treatment for dogs that kills adult fleas, treats and prevents flea infestations, and treats and controls multiple tick species for up to 12 weeks. The product is offered in five dog weight bands and should be used according to the product label and veterinary guidance.",
    prescriptionRequired: true,
    variants: [
      variant({ code: "BRAVECTO-DOG-TOY-1-CHEW", size: "Toy dogs 4.4-9.9 lbs - 1 chew", packSize: 1, regularPrice: 57.16, salePrice: 40.83, stock: 1, image: IMAGES.bravectoToyDog, details: "112.5 mg fluralaner chew for dogs weighing 4.4-9.9 lbs. One chew." }),
      variant({ code: "BRAVECTO-DOG-TOY-2-CHEWS", size: "Toy dogs 4.4-9.9 lbs - 2 chews", packSize: 2, regularPrice: 110.08, salePrice: 78.63, stock: 1, image: IMAGES.bravectoToyDog, details: "112.5 mg fluralaner chews for dogs weighing 4.4-9.9 lbs. Two chews." }),
      variant({ code: "BRAVECTO-DOG-TOY-3-CHEWS", size: "Toy dogs 4.4-9.9 lbs - 3 chews", packSize: 3, regularPrice: 157.12, salePrice: 112.23, stock: 1, image: IMAGES.bravectoToyDog, details: "112.5 mg fluralaner chews for dogs weighing 4.4-9.9 lbs. Three chews." }),
      variant({ code: "BRAVECTO-DOG-SMALL-1-CHEW", size: "Small dogs 9.9-22 lbs - 1 chew", packSize: 1, regularPrice: 61.57, salePrice: 43.98, stock: 1, image: IMAGES.bravectoSmallDog, details: "250 mg fluralaner chew for dogs weighing 9.9-22 lbs. One chew." }),
      variant({ code: "BRAVECTO-DOG-SMALL-2-CHEWS", size: "Small dogs 9.9-22 lbs - 2 chews", packSize: 2, regularPrice: 117.43, salePrice: 83.88, stock: 1, image: IMAGES.bravectoSmallDog, details: "250 mg fluralaner chews for dogs weighing 9.9-22 lbs. Two chews." }),
      variant({ code: "BRAVECTO-DOG-SMALL-3-CHEWS", size: "Small dogs 9.9-22 lbs - 3 chews", packSize: 3, regularPrice: 168.88, salePrice: 120.63, stock: 1, image: IMAGES.bravectoSmallDog, details: "250 mg fluralaner chews for dogs weighing 9.9-22 lbs. Three chews." }),
      variant({ code: "BRAVECTO-DOG-MEDIUM-1-CHEW", size: "Medium dogs 22-44 lbs - 1 chew", packSize: 1, regularPrice: 68.92, salePrice: 49.23, stock: 1, image: IMAGES.bravectoMediumDog, details: "500 mg fluralaner chew for dogs weighing 22-44 lbs. One chew." }),
      variant({ code: "BRAVECTO-DOG-MEDIUM-2-CHEWS", size: "Medium dogs 22-44 lbs - 2 chews", packSize: 2, regularPrice: 132.13, salePrice: 94.38, stock: 1, image: IMAGES.bravectoMediumDog, details: "500 mg fluralaner chews for dogs weighing 22-44 lbs. Two chews." }),
      variant({ code: "BRAVECTO-DOG-MEDIUM-3-CHEWS", size: "Medium dogs 22-44 lbs - 3 chews", packSize: 3, regularPrice: 185.05, salePrice: 132.18, stock: 1, image: IMAGES.bravectoMediumDog, details: "500 mg fluralaner chews for dogs weighing 22-44 lbs. Three chews." }),
      variant({ code: "BRAVECTO-DOG-LARGE-1-CHEW", size: "Large dogs 44-88 lbs - 1 chew", packSize: 1, regularPrice: 76.27, salePrice: 54.48, stock: 1, image: IMAGES.bravectoLargeDog, details: "1000 mg fluralaner chew for dogs weighing 44-88 lbs. One chew." }),
      variant({ code: "BRAVECTO-DOG-LARGE-2-CHEWS", size: "Large dogs 44-88 lbs - 2 chews", packSize: 2, regularPrice: 146.83, salePrice: 104.88, stock: 1, image: IMAGES.bravectoLargeDog, details: "1000 mg fluralaner chews for dogs weighing 44-88 lbs. Two chews." }),
      variant({ code: "BRAVECTO-DOG-LARGE-3-CHEWS", size: "Large dogs 44-88 lbs - 3 chews", packSize: 3, regularPrice: 198.28, salePrice: 141.63, stock: 1, image: IMAGES.bravectoLargeDog, details: "1000 mg fluralaner chews for dogs weighing 44-88 lbs. Three chews." }),
      variant({ code: "BRAVECTO-DOG-XL-1-CHEW", size: "Extra large dogs 88-123 lbs - 1 chew", packSize: 1, regularPrice: 85.09, salePrice: 60.78, stock: 1, image: IMAGES.bravectoExtraLargeDog, details: "1400 mg fluralaner chew for dogs weighing 88-123 lbs. One chew." }),
      variant({ code: "BRAVECTO-DOG-XL-2-CHEWS", size: "Extra large dogs 88-123 lbs - 2 chews", packSize: 2, regularPrice: 165.94, salePrice: 118.53, stock: 1, image: IMAGES.bravectoExtraLargeDog, details: "1400 mg fluralaner chews for dogs weighing 88-123 lbs. Two chews." }),
      variant({ code: "BRAVECTO-DOG-XL-3-CHEWS", size: "Extra large dogs 88-123 lbs - 3 chews", packSize: 3, regularPrice: 237.97, salePrice: 169.98, stock: 1, image: IMAGES.bravectoExtraLargeDog, details: "1400 mg fluralaner chews for dogs weighing 88-123 lbs. Three chews." }),
    ],
  }),
];

function realCategoryImage(name) {
  return CATEGORY_IMAGES[name] || IMAGES.epiotic;
}

const CANADA_PETCARE_DOG_SUPPLIES_URL =
  "https://www.canadapetcare.com/dog-supplies-1.aspx";

const canadaPetCareCategoryMap = {
  "Flea & Tick Control": "Flea & Tick Care",
  Heartwormers: "Heartworm Prevention",
  Wormers: "Deworming",
  "Joint Care": "Joint & Mobility Care",
  "Wound Repair": "Wound & First Aid",
  Behavioral: "Calming & Anxiety Support",
  Behavioural: "Calming & Anxiety Support",
  Anxiety: "Calming & Anxiety Support",
  Skin: "Allergy & Itch Care",
  "Skin & Coat": "Skin & Coat Care",
};

function decodeHtml(value = "") {
  return String(value)
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toAbsoluteCanadaPetCareUrl(path) {
  return new URL(path, CANADA_PETCARE_DOG_SUPPLIES_URL).toString();
}

function stripHtml(value = "") {
  return decodeHtml(String(value).replace(/<[^>]+>/g, " "));
}

function parsePrice(value) {
  const price = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(price) ? price : null;
}

function parsePackSize(label) {
  const match = String(label || "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 1;
}

function slugifySeedValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCanadaPetCareDetailVariants(html, fallback) {
  const blocks = [
    ...html.matchAll(
      /<div class="clearfix pro-landing-box">([\s\S]*?)(?=<div class="clearfix pro-landing-box">|$)/gi,
    ),
  ];
  const variants = [];

  for (const [, block] of blocks) {
    const title = stripHtml(block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || fallback.name);
    const imagePath = block.match(/data-src="([^"]+)"/i)?.[1];
    const image = imagePath ? toAbsoluteCanadaPetCareUrl(imagePath) : fallback.image;
    const rows = [
      ...block.matchAll(
        /<form[\s\S]*?<input type="hidden" value="([^"]+)" name="AddToCartModel\.PackId"[\s\S]*?<div class="pro_pack_td">\s*([\s\S]*?)\s*<\/div>[\s\S]*?<div class="pro_price_td">\s*\$([0-9,.]+)\s*<\/div>\s*<div class="pro_you_pay_td">\s*\$([0-9,.]+)\s*<\/div>/gi,
      ),
    ];

    for (const [, packId, packLabelHtml, regularValue, saleValue] of rows) {
      const packLabel = stripHtml(packLabelHtml);
      const regularPrice = parsePrice(regularValue);
      const salePrice = parsePrice(saleValue);
      if (!regularPrice || salePrice === null || salePrice > regularPrice) continue;
      variants.push({
        blockTitle: title,
        packId,
        packLabel,
        regularPrice,
        salePrice,
        image,
      });
    }
  }

  if (!variants.length) {
    return [
      variant({
        code: `${fallback.sku}-LISTING`,
        size: "Catalog listing",
        packSize: 1,
        regularPrice: fallback.regularPrice,
        salePrice: fallback.salePrice,
        stock: 1,
        image: fallback.image,
        details: `CanadaPetCare catalog listing for ${fallback.name}. Product options and pack sizes are available on the source page.`,
      }),
    ];
  }

  return variants.map((item, index) =>
    variant({
      code: `${fallback.sku}-${item.packId || index + 1}`,
      size: `${item.blockTitle} - ${item.packLabel}`,
      weightRange: item.blockTitle,
      packLabel: item.packLabel,
      familyVariantId: `${fallback.sku}-${slugifySeedValue(item.blockTitle)}`,
      familyVariantName: item.blockTitle,
      familyVariantSlug: slugifySeedValue(item.blockTitle),
      packSize: parsePackSize(item.packLabel),
      regularPrice: item.regularPrice,
      salePrice: item.salePrice,
      stock: 1,
      image: item.image,
      details: `${item.blockTitle}; ${item.packLabel}; pack ID ${item.packId}.`,
    }),
  );
}

async function appendCanadaPetCareDogSupplies() {
  const response = await fetch(CANADA_PETCARE_DOG_SUPPLIES_URL);
  if (!response.ok) {
    throw new Error(`CanadaPetCare dog supplies request failed with HTTP ${response.status}.`);
  }

  const html = await response.text();
  const cards = [...html.matchAll(/<div class="category_col col-4">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi)];
  if (!cards.length) throw new Error("No product cards were found on the CanadaPetCare dog supplies page.");

  const catalogEntries = new Map();
  cards.forEach(([, card], index) => {
    const linkMatch = card.match(/<a\s+href="([^"]+)"[^>]*>\s*<img[\s\S]*?data-src="([^"]+)"/i);
    const titleMatch = card.match(/<span class="name">([\s\S]*?)<\/span>/i);
    const saleMatch = card.match(/class="pro_price_promo">\s*\$([0-9]+(?:\.[0-9]{1,2})?)/i);
    const regularMatch = card.match(/class="pro_price_crossout">\s*\$([0-9]+(?:\.[0-9]{1,2})?)/i);
    const categoryMatch = card.match(/ProductCategory="([^"]+)"/i);
    const productTypeMatch = card.match(/ProductType="([^"]+)"/i);
    const brandMatch = card.match(/ProductBrand="([^"]*)"/i);

    if (!linkMatch || !titleMatch || !saleMatch || !regularMatch || !categoryMatch) {
      throw new Error(`Could not parse CanadaPetCare product card ${index + 1}.`);
    }

    const productUrl = toAbsoluteCanadaPetCareUrl(linkMatch[1]);
    const name = decodeHtml(titleMatch[1]);
    const sourceCategory = decodeHtml(categoryMatch[1]);
    const category = canadaPetCareCategoryMap[sourceCategory];
    if (!category) throw new Error(`No local category mapping exists for "${sourceCategory}".`);
    if (catalogEntries.has(productUrl)) return;

    const sourcePath = new URL(productUrl).pathname;
    const numericId = sourcePath.match(/-(\d+)\.aspx$/i)?.[1] || String(index + 1);
    const safeName = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
    const safeSku = `CPC-DOG-${numericId}-${safeName}`;
    catalogEntries.set(productUrl, {
      name,
      category,
      sourceCategory,
      productUrl,
      productId: `CPC-DOG-${numericId}`,
      sku: safeSku,
      image: toAbsoluteCanadaPetCareUrl(linkMatch[2]),
      regularPrice: parsePrice(regularMatch[1]),
      salePrice: parsePrice(saleMatch[1]),
      brand: decodeHtml(brandMatch?.[1] || "CanadaPetCare catalog"),
      productType: decodeHtml(productTypeMatch?.[1] || "Dog healthcare product"),
    });
  });

  const entries = [...catalogEntries.values()];
  const importedProducts = [];
  const concurrency = 6;
  for (let start = 0; start < entries.length; start += concurrency) {
    const batch = entries.slice(start, start + concurrency);
    const batchProducts = await Promise.all(batch.map(async (entry) => {
      const detailResponse = await fetch(entry.productUrl);
      if (!detailResponse.ok) throw new Error(`Product detail request failed for ${entry.productUrl} with HTTP ${detailResponse.status}.`);
      const detailHtml = await detailResponse.text();
      const detailTitle = stripHtml(detailHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || entry.name);
      const variants = parseCanadaPetCareDetailVariants(detailHtml, entry);
      const familyNames = new Set(variants.map((item) => item.familyVariantName).filter(Boolean));
      return product({
        id: entry.productId,
        name: `${detailTitle} (CanadaPetCare)`,
        brand: entry.brand,
        category: entry.category,
        sku: entry.sku,
        petType: "Dog",
        productType: entry.productType,
        family: familyNames.size > 1,
        image: variants[0]?.image || entry.image,
        sourceUrl: entry.productUrl,
        description: `Family product imported from CanadaPetCare under ${entry.sourceCategory}. Each pack, weight band, and price is represented as a separate product variant from the detail page. Verify the label, availability, and veterinary suitability before sale.`,
        prescriptionRequired: ["Heartwormers", "Flea & Tick Control", "Wormers"].includes(entry.sourceCategory),
        variants,
      });
    }));
    importedProducts.push(...batchProducts);
    console.log(`[canadapetcare] detailed variants ${Math.min(start + batch.length, entries.length)}/${entries.length}`);
  }

  const existingIds = new Set(products.map((item) => item.id));
  const newProducts = importedProducts.filter((item) => !existingIds.has(item.id));
  products.push(...newProducts);
  console.log(`[canadapetcare] imported ${importedProducts.length} dog products; ${newProducts.length} new products added to this seed run.`);
}

function parseDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is missing.");
  const url = new URL(raw.replace(/^"|"$/g, ""));
  return {
    raw,
    database: url.pathname.replace(/^\//, ""),
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username || ""),
  };
}

function productionSeedAllowed() {
  return (
    process.argv.some((arg) => arg === "--allow-production-seed") ||
    String(process.env.ALLOW_PRODUCT_SEED_IN_PRODUCTION || "").trim().toLowerCase() === "true"
  );
}

function assertSafeLocalDatabase(identity, parsedUrl) {
  const host = String(parsedUrl.host || "").toLowerCase();
  const queriedHost = String(identity.host || "").toLowerCase();
  const database = String(identity.database || parsedUrl.database || "").toLowerCase();
  const env = String(process.env.NODE_ENV || "").toLowerCase();
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  const hostLooksLocal =
    localHosts.has(host) ||
    queriedHost === "::1/128" ||
    queriedHost === "127.0.0.1/32" ||
    queriedHost === "localhost";
  const nameLooksUnsafe = /prod|production|live/.test(database);
  const envLooksUnsafe = env === "production";
  const destructiveReset = process.argv.some((arg) => arg === "--reset");

  if (hostLooksLocal && envLooksUnsafe && !nameLooksUnsafe && !destructiveReset) {
    console.log("Production environment detected on a local database. Running non-destructive product upsert.");
    return;
  }

  if ((!hostLooksLocal || envLooksUnsafe) && productionSeedAllowed() && !nameLooksUnsafe) {
    console.log("Production product seed explicitly allowed.");
    return;
  }

  if (!hostLooksLocal || nameLooksUnsafe || envLooksUnsafe) {
    console.log("Database does not appear to be a safe local development database. No destructive operation was performed.");
    console.log(`Database: ${identity.database || parsedUrl.database}`);
    console.log(`Host: ${identity.host || parsedUrl.host}`);
    console.log(`Port: ${identity.port || parsedUrl.port}`);
    console.log(`User: ${identity.user || parsedUrl.user}`);
    process.exit(1);
  }
}

async function getDatabaseIdentity() {
  const rows = await prisma.$queryRawUnsafe(
    "select current_database() as database, inet_server_addr()::text as host, inet_server_port() as port, current_user as user",
  );
  return rows[0];
}

function getStoreKeyArg() {
  const flagIndex = process.argv.findIndex((arg) => arg === "--store-key" || arg === "--storeKey");
  if (flagIndex >= 0) return process.argv[flagIndex + 1] || "";
  const inlineArg = process.argv.find((arg) => arg.startsWith("--store-key=") || arg.startsWith("--storeKey="));
  if (inlineArg) return inlineArg.split("=")[1] || "";
  return process.env.SEED_STORE_KEY || "";
}

function hasFlag(...names) {
  return process.argv.some((arg) => names.includes(arg));
}

async function resolveSeedTarget() {
  const storeKey = String(getStoreKeyArg() || "").trim();
  if (!storeKey) {
    return { label: "MASTER", store: null };
  }

  const store = await masterPrisma.store.findFirst({
    where: { storeKey, status: "ACTIVE" },
  });
  if (!store) throw new Error(`Active store not found for store key "${storeKey}".`);

  tenantPrisma = await getTenantClient(store);
  prisma = tenantPrisma;
  return {
    label: `TENANT ${store.storeKey}`,
    store,
  };
}

async function tableExists(tableName) {
  const rows = await prisma.$queryRawUnsafe(
    "select to_regclass($1)::text as name",
    `public."${tableName.replace(/"/g, '""')}"`,
  );
  return Boolean(rows[0]?.name);
}

async function safeCount(modelName, tableName) {
  if (!(await tableExists(tableName))) return 0;
  return prisma[modelName].count();
}

async function seedCategories() {
  for (const [id, name] of CATEGORY_DEFINITIONS) {
    const data = {
      name,
      description: `${name} products for pet healthcare and veterinary support.`,
      image: realCategoryImage(name),
      status: "Active",
    };
    const existingByName = await prisma.category.findUnique({ where: { name } });
    if (existingByName) {
      categoryIdByName[name] = existingByName.id;
      await prisma.category.update({
        where: { id: existingByName.id },
        data,
      });
      continue;
    }

    await prisma.category.upsert({
      where: { id },
      update: data,
      create: {
        id,
        ...data,
      },
    });
    categoryIdByName[name] = id;
  }
}

function resolveProductCategoryId(item) {
  const categoryName = categoryNameById[item.categoryId];
  return categoryName ? categoryIdByName[categoryName] || item.categoryId : item.categoryId;
}

async function cleanupProductCatalog() {
  const autoOrderCount = await safeCount("autoOrder", "AutoOrder");
  if (autoOrderCount > 0) {
    if (!hasFlag("--delete-auto-orders", "--force-delete-auto-orders")) {
      throw new Error(`Found ${autoOrderCount} auto orders linked to products. Product cleanup stopped to avoid breaking local auto-order data. Re-run with --delete-auto-orders for disposable local data.`);
    }
    if (await tableExists("AutoOrderExecution")) {
      await prisma.autoOrderExecution.deleteMany({});
    }
    await prisma.autoOrder.deleteMany({});
  }

  if (await tableExists("SupportConversation")) {
    await prisma.supportConversation.updateMany({
      where: { productId: { not: null } },
      data: { productId: null },
    });
  }

  if (await tableExists("ProductReview")) {
    await prisma.productReview.deleteMany({});
  }

  const deletedProducts = await prisma.product.deleteMany({});
  const deletedCategories = await prisma.category.deleteMany({});
  return {
    deletedProducts: deletedProducts.count,
    deletedCategories: deletedCategories.count,
    deletedAutoOrders: autoOrderCount,
    deletedReviews: await safeCount("productReview", "ProductReview"),
  };
}

async function seedProducts() {
  let created = 0;
  let updated = 0;
  for (const item of products) {
    const data = {
      ...item,
      categoryId: resolveProductCategoryId(item),
    };
    const existing = await prisma.product.findUnique({ where: { id: item.id } });
    await prisma.product.upsert({
      where: { id: item.id },
      update: data,
      create: data,
    });
    if (existing) updated += 1;
    else created += 1;
  }
  return { created, updated };
}

async function updateImagesOnly() {
  let updatedProducts = 0;
  for (const item of products) {
    const existing = await prisma.product.findUnique({ where: { id: item.id } });
    if (!existing) continue;
    await prisma.product.update({
      where: { id: item.id },
      data: {
        image: item.image,
        gallery: item.gallery,
        optionVariants: item.optionVariants,
      },
    });
    updatedProducts += 1;
  }
  return updatedProducts;
}

async function updateCategoryImagesOnly() {
  let updatedCategories = 0;
  for (const [id, name] of CATEGORY_DEFINITIONS) {
    const existing =
      await prisma.category.findUnique({ where: { name } }) ||
      await prisma.category.findUnique({ where: { id } });
    if (!existing) continue;
    await prisma.category.update({
      where: { id: existing.id },
      data: { image: realCategoryImage(name) },
    });
    updatedCategories += 1;
  }
  return updatedCategories;
}

function flattenVariants() {
  return products.flatMap((item) =>
    (item.optionVariants || []).map((variantItem) => ({
      productId: item.id,
      productSku: item.sku,
      ...variantItem,
    })),
  );
}

function validateSeedData() {
  const productSkus = new Set();
  const variantSkus = new Set();
  const variantCombinations = new Set();
  const productNames = new Set();
  const errors = [];

  for (const item of products) {
    if (!item.categoryId) errors.push(`Missing category mapping: ${item.sku}`);
    if (!item.name) errors.push(`Missing product name: ${item.sku}`);
    if (!/Brand:\s*[^.]+/i.test(item.description || "")) errors.push(`Missing brand metadata: ${item.sku}`);
    if (!item.petType) errors.push(`Missing pet type: ${item.sku}`);
    if (!/Product type:\s*[^.]+/i.test(item.description || "")) errors.push(`Missing product type metadata: ${item.sku}`);
    if (productSkus.has(item.sku)) errors.push(`Duplicate product SKU: ${item.sku}`);
    productSkus.add(item.sku);
    const nameKey = item.name.toLowerCase();
    if (productNames.has(nameKey)) errors.push(`Duplicate product name: ${item.name}`);
    productNames.add(nameKey);
    if (!["Active", "Inactive"].includes(item.status)) errors.push(`Invalid product status: ${item.sku}`);
    if (typeof item.prescriptionRequired !== "boolean") errors.push(`Invalid prescription flag: ${item.sku}`);
    if (item.price < 0 || (item.salePrice !== null && item.salePrice < 0)) errors.push(`Invalid product price: ${item.sku}`);
    if (item.stock < 0) errors.push(`Negative product stock: ${item.sku}`);
    if (item.status === "Active" && (!Number.isFinite(Number(item.price)) || Number(item.price) <= 0)) errors.push(`Active product requires verified positive price: ${item.sku}`);
    if (item.status === "Active" && (!Number.isFinite(Number(item.stock)) || Number(item.stock) <= 0)) errors.push(`Active product requires positive local stock: ${item.sku}`);
    if (!item.image || /unsplash|placeholder|pexels|data:image/i.test(item.image)) errors.push(`Invalid product image source: ${item.sku}`);

    for (const variantItem of item.optionVariants || []) {
      if (variantSkus.has(variantItem.sku)) errors.push(`Duplicate variant SKU: ${variantItem.sku}`);
      variantSkus.add(variantItem.sku);
      const comboKey = [item.id, variantItem.weightRange || variantItem.size || variantItem.label, variantItem.dose || "", variantItem.packSize || ""].join("|").toLowerCase();
      if (variantCombinations.has(comboKey)) errors.push(`Duplicate variant combination: ${comboKey}`);
      variantCombinations.add(comboKey);
      if (variantItem.price < 0 || variantItem.regularPrice < 0 || variantItem.price > variantItem.regularPrice) errors.push(`Invalid variant price: ${variantItem.sku}`);
      if (variantItem.stock < 0) errors.push(`Negative variant stock: ${variantItem.sku}`);
      if (!variantItem.image || /unsplash|placeholder|pexels|data:image/i.test(variantItem.image)) errors.push(`Invalid variant image source: ${variantItem.sku}`);
    }
  }

  if (errors.length) throw new Error(`Seed data validation failed:\n${errors.join("\n")}`);
}

async function validateImageUrls() {
  const urls = [
    ...new Set(
      products.flatMap((item) => [
        item.image,
        ...(item.gallery || []),
        ...(item.optionVariants || []).map((variantItem) => variantItem.image),
      ]).filter(Boolean),
    ),
  ];
  const failures = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.startsWith("image/")) {
        failures.push({ url, status: response.status, contentType });
      }
    } catch (error) {
      failures.push({ url, error: error.message });
    }
  }
  return {
    checked: urls.length,
    passed: urls.length - failures.length,
    failed: failures,
  };
}

async function integrityReport(identity, cleanup) {
  const dbProducts = await prisma.product.findMany({ include: { category: true } });
  const variants = dbProducts.flatMap((item) =>
    Array.isArray(item.optionVariants)
      ? item.optionVariants.map((variantItem) => ({ productId: item.id, ...variantItem }))
      : [],
  );
  const productsWithVariants = dbProducts.filter((item) => Array.isArray(item.optionVariants) && item.optionVariants.length > 0).length;
  const productSkus = dbProducts.map((item) => item.sku).filter(Boolean);
  const variantSkus = variants.map((item) => item.sku).filter(Boolean);
  const duplicateProductSkus = productSkus.length - new Set(productSkus).size;
  const duplicateVariantSkus = variantSkus.length - new Set(variantSkus).size;
  const invalidPrices = variants.filter((item) => Number(item.price) < 0 || Number(item.regularPrice) < 0 || Number(item.price) > Number(item.regularPrice)).length;
  const negativeStock = variants.filter((item) => Number(item.stock) < 0).length + dbProducts.filter((item) => Number(item.stock) < 0).length;
  const brokenRelationships = dbProducts.filter((item) => !item.categoryId || !item.category).length;
  const imageCount = dbProducts.filter((item) => item.image).length + variants.filter((item) => item.image).length;

  return {
    database: identity.database,
    host: identity.host,
    port: identity.port,
    user: identity.user,
    cleanup,
    products: dbProducts.length,
    productsWithVariants,
    productsWithoutVariants: dbProducts.length - productsWithVariants,
    variants: variants.length,
    categories: await prisma.category.count(),
    healthcareCategories: CATEGORY_DEFINITIONS.length,
    images: imageCount,
    duplicateProductSkus,
    duplicateVariantSkus,
    orphanVariants: 0,
    invalidPrices,
    negativeStock,
    brokenRelationships,
    lowStockVariants: variants.filter((item) => Number(item.stock) > 0 && Number(item.stock) <= 5).length,
  };
}

async function seedAllActiveStores(parsedUrl) {
  if (hasFlag("--reset")) {
    throw new Error("--reset cannot be used with --all-stores. Use the normal single-store command for an intentional local reset.");
  }

  const stores = await masterPrisma.store.findMany({
    where: { status: "ACTIVE" },
    orderBy: { storeKey: "asc" },
  });

  if (!stores.length) throw new Error("No active stores found in the master database.");

  const results = [];
  for (const store of stores) {
    try {
      tenantPrisma = await getTenantClient(store);
      prisma = tenantPrisma;
      const identity = await getDatabaseIdentity();
      const identityUrl = {
        database: store.databaseName || parsedUrl.database,
        host: store.databaseHost || parsedUrl.host,
        port: store.databasePort || parsedUrl.port,
        user: store.databaseUser || parsedUrl.user,
      };
      assertSafeLocalDatabase(identity, identityUrl);
      await seedCategories();
      const seededProducts = await seedProducts();
      results.push({
        storeKey: store.storeKey,
        storeName: store.name,
        database: identity.database,
        host: identity.host,
        ...seededProducts,
      });
      console.log(`[all-stores] ${store.storeKey}: created ${seededProducts.created}, updated ${seededProducts.updated}`);
    } catch (error) {
      results.push({
        storeKey: store.storeKey,
        storeName: store.name,
        error: error.message || String(error),
      });
      console.error(`[all-stores] ${store.storeKey}: ${error.message || error}`);
    } finally {
      if (tenantPrisma) await tenantPrisma.$disconnect();
      tenantPrisma = null;
      prisma = masterPrisma;
    }
  }

  const failures = results.filter((result) => result.error);
  console.log("\nALL STORES UPSERT REPORT");
  console.log(JSON.stringify({ stores: results.length, succeeded: results.length - failures.length, failed: failures.length, results }, null, 2));
  if (failures.length) process.exitCode = 1;
}

async function main() {
  await appendCanadaPetCareDogSupplies();
  validateSeedData();

  const parsedUrl = parseDatabaseUrl();
  if (hasFlag("--all-stores")) {
    await seedAllActiveStores(parsedUrl);
    return;
  }

  const target = await resolveSeedTarget();
  const identity = await getDatabaseIdentity();
  const identityUrl = target.store
    ? {
        database: target.store.databaseName,
        host: target.store.databaseHost,
        port: target.store.databasePort || 5432,
        user: target.store.databaseUser,
      }
    : parsedUrl;
  assertSafeLocalDatabase(identity, identityUrl);

  console.log("LOCAL DATABASE IDENTITY");
  console.log(`Target: ${target.label}`);
  console.log(`Database: ${identity.database}`);
  console.log(`Host: ${identity.host}`);
  console.log(`Port: ${identity.port}`);
  console.log(`User: ${identity.user}`);
  console.log("Environment: LOCAL");

  if (hasFlag("--images-only", "--update-images-only")) {
    const updatedProducts = await updateImagesOnly();
    const updatedCategories = await updateCategoryImagesOnly();
    const nonHealthcareImageCount = await prisma.product
      .findMany({ select: { image: true, optionVariants: true } })
      .then((rows) =>
        rows.filter((item) => /unsplash|placeholder|pexels|data:image/i.test(String(item.image || ""))).length +
        rows.flatMap((item) => Array.isArray(item.optionVariants) ? item.optionVariants : [])
          .filter((item) => /unsplash|placeholder|pexels|data:image/i.test(String(item.image || ""))).length,
      );
    console.log("\nLOCAL IMAGE UPDATE REPORT");
    console.log(JSON.stringify({ updatedProducts, updatedCategories, nonHealthcareImageCount }, null, 2));
    console.log("READY FOR LOCAL TESTING");
    return;
  }

  if (hasFlag("--validate-only")) {
    console.log("\nSEED DATA VALIDATION REPORT");
    console.log(JSON.stringify({
      products: products.length,
      variants: flattenVariants().length,
      categories: CATEGORY_DEFINITIONS.length,
      activeProducts: products.filter((item) => item.status === "Active").length,
      inactiveProducts: products.filter((item) => item.status === "Inactive").length,
      prescriptionRequiredProducts: products.filter((item) => item.prescriptionRequired).length,
      nonPrescriptionProducts: products.filter((item) => !item.prescriptionRequired).length,
    }, null, 2));
    console.log("READY FOR LOCAL TESTING");
    return;
  }

  if (hasFlag("--validate-images")) {
    const imageReport = await validateImageUrls();
    console.log("\nSEED IMAGE VALIDATION REPORT");
    console.log(JSON.stringify(imageReport, null, 2));
    if (imageReport.failed.length) process.exit(1);
    console.log("READY FOR LOCAL TESTING");
    return;
  }

  const before = {
    products: await prisma.product.count(),
    categories: await prisma.category.count(),
    orders: await prisma.order.count().catch(() => 0),
    autoOrders: await safeCount("autoOrder", "AutoOrder"),
  };

  const cleanup = hasFlag("--reset") ? await cleanupProductCatalog() : {
    deletedProducts: 0,
    deletedCategories: 0,
    deletedAutoOrders: 0,
    deletedReviews: 0,
    before,
  };
  await seedCategories();
  const seededProducts = await seedProducts();
  const report = await integrityReport(identity, { ...cleanup, before, seededProducts });

  console.log(hasFlag("--reset") ? "\nLOCAL DATABASE RESET REPORT" : "\nLOCAL DATABASE UPSERT REPORT");
  console.log(JSON.stringify(report, null, 2));
  console.log("\nSeeded verified pet healthcare products from official product pages.");
  console.log("READY FOR LOCAL TESTING");
}

main()
  .then(async () => {
    if (tenantPrisma) await tenantPrisma.$disconnect();
    await masterPrisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error.message || error);
    if (tenantPrisma) await tenantPrisma.$disconnect();
    await masterPrisma.$disconnect();
    process.exit(1);
  });
