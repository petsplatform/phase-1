const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { findCategoryThemeImage } = require("../src/utils/categoryThemeImages");

const prisma = new PrismaClient();

const image = {
  medication: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=240&q=80",
  petCare: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=240&q=80",
  dog: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=240&q=80",
  cat: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=240&q=80",
  clinic: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=240&q=80",
  customer: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
};

const categories = [
  {
    id: "CAT-01",
    name: "Flea & Tick",
    description: "Topical, oral, and collar-style parasite prevention products for pets.",
    image: image.dog,
    status: "Active",
  },
  {
    id: "CAT-02",
    name: "Heartworm",
    description: "Monthly heartworm preventives and broad parasite protection catalog items.",
    image: image.petCare,
    status: "Active",
  },
  {
    id: "CAT-03",
    name: "Allergy & Skin",
    description: "Demo allergy, itch relief, ear care, and medicated skin support products.",
    image: image.cat,
    status: "Active",
  },
  {
    id: "CAT-04",
    name: "Pain & Arthritis",
    description: "Veterinary pain management and joint support dummy products.",
    image: image.clinic,
    status: "Active",
  },
  {
    id: "CAT-05",
    name: "Anxiety & Calming",
    description: "Behavior, travel stress, and calming support medication-style products.",
    image: image.petCare,
    status: "Active",
  },
  {
    id: "CAT-06",
    name: "Antibiotic & Digestive",
    description: "Antibiotic, probiotic, stomach, and digestive care sample catalog items.",
    image: image.medication,
    status: "Active",
  },
].map((category) => ({
  ...category,
  image: findCategoryThemeImage(category),
}));

const products = [
  {
    id: "PRD-1001",
    name: "Canine Flea & Tick Monthly Chew",
    categoryId: "CAT-01",
    price: 58,
    salePrice: 49,
    stock: 42,
    sku: "PET-FLT-001",
    status: "Active",
    image: image.dog,
    description: "Demo oral flea and tick preventive for dogs. Use only with veterinarian guidance.",
  },
  {
    id: "PRD-1002",
    name: "Feline Flea Control Topical",
    categoryId: "CAT-01",
    price: 44,
    salePrice: 39,
    stock: 36,
    sku: "PET-FLT-002",
    status: "Active",
    image: image.cat,
    description: "Sample topical flea control product for cats in a monthly-dose format.",
  },
  {
    id: "PRD-1003",
    name: "Tick Defense Collar for Dogs",
    categoryId: "CAT-01",
    price: 72,
    salePrice: 64,
    stock: 18,
    sku: "PET-FLT-003",
    status: "Active",
    image: image.dog,
    description: "Long-wear parasite protection collar product for storefront demo data.",
  },
  {
    id: "PRD-1004",
    name: "Puppy Flea Relief Spray",
    categoryId: "CAT-01",
    price: 24,
    salePrice: 21,
    stock: 28,
    sku: "PET-FLT-004",
    status: "Active",
    image: image.petCare,
    description: "Gentle flea relief spray-style dummy item for young dogs.",
  },
  {
    id: "PRD-1005",
    name: "Heartworm Monthly Soft Chews",
    categoryId: "CAT-02",
    price: 66,
    salePrice: 58,
    stock: 31,
    sku: "PET-HRT-001",
    status: "Active",
    image: image.medication,
    description: "Monthly heartworm preventive sample product for dogs.",
  },
  {
    id: "PRD-1006",
    name: "Broad Spectrum Dewormer Tablets",
    categoryId: "CAT-02",
    price: 38,
    salePrice: 34,
    stock: 22,
    sku: "PET-HRT-002",
    status: "Active",
    image: image.medication,
    description: "Demo deworming tablet product for catalog and order testing.",
  },
  {
    id: "PRD-1007",
    name: "Kitten Parasite Prevention Drops",
    categoryId: "CAT-02",
    price: 46,
    salePrice: 41,
    stock: 15,
    sku: "PET-HRT-003",
    status: "Active",
    image: image.cat,
    description: "Sample kitten parasite prevention drops for seeded storefront data.",
  },
  {
    id: "PRD-1008",
    name: "Multi-Guard Dog Preventive",
    categoryId: "CAT-02",
    price: 82,
    salePrice: 73,
    stock: 19,
    sku: "PET-HRT-004",
    status: "Active",
    image: image.dog,
    description: "Broad monthly preventive-style product for dogs.",
  },
  {
    id: "PRD-1009",
    name: "Itch Relief Allergy Tablets",
    categoryId: "CAT-03",
    price: 52,
    salePrice: 46,
    stock: 27,
    sku: "PET-ALG-001",
    status: "Active",
    image: image.medication,
    description: "Allergy and itch relief tablet sample item for pets.",
  },
  {
    id: "PRD-1010",
    name: "Medicated Ear Cleansing Solution",
    categoryId: "CAT-03",
    price: 29,
    salePrice: 25,
    stock: 33,
    sku: "PET-ALG-002",
    status: "Active",
    image: image.clinic,
    description: "Ear cleansing and skin-support demo product for cats and dogs.",
  },
  {
    id: "PRD-1011",
    name: "Hot Spot Recovery Spray",
    categoryId: "CAT-03",
    price: 26,
    salePrice: 22,
    stock: 24,
    sku: "PET-ALG-003",
    status: "Active",
    image: image.petCare,
    description: "Skin recovery spray-style product for storefront dummy data.",
  },
  {
    id: "PRD-1012",
    name: "Dermal Support Soft Chews",
    categoryId: "CAT-03",
    price: 34,
    salePrice: 29,
    stock: 20,
    sku: "PET-ALG-004",
    status: "Active",
    image: image.dog,
    description: "Skin and coat support chew product for a pet medication catalog.",
  },
  {
    id: "PRD-1013",
    name: "Senior Dog Joint Comfort Tablets",
    categoryId: "CAT-04",
    price: 64,
    salePrice: 56,
    stock: 12,
    sku: "PET-PAN-001",
    status: "Active",
    image: image.dog,
    description: "Joint comfort and arthritis support demo medication-style product.",
  },
  {
    id: "PRD-1014",
    name: "Feline Mobility Support Capsules",
    categoryId: "CAT-04",
    price: 48,
    salePrice: 42,
    stock: 14,
    sku: "PET-PAN-002",
    status: "Active",
    image: image.cat,
    description: "Mobility support capsules for cats, created as safe dummy product data.",
  },
  {
    id: "PRD-1015",
    name: "Post-Surgery Pain Relief Suspension",
    categoryId: "CAT-04",
    price: 76,
    salePrice: null,
    stock: 8,
    sku: "PET-PAN-003",
    status: "Active",
    image: image.clinic,
    description: "Prescription-style pain relief suspension placeholder for admin testing.",
  },
  {
    id: "PRD-1016",
    name: "Joint Care Omega Liquid",
    categoryId: "CAT-04",
    price: 31,
    salePrice: 28,
    stock: 25,
    sku: "PET-PAN-004",
    status: "Active",
    image: image.petCare,
    description: "Liquid joint support product for older pets.",
  },
  {
    id: "PRD-1017",
    name: "Travel Anxiety Calming Chews",
    categoryId: "CAT-05",
    price: 33,
    salePrice: 29,
    stock: 30,
    sku: "PET-CAL-001",
    status: "Active",
    image: image.dog,
    description: "Calming chew product for travel, grooming, and stressful events.",
  },
  {
    id: "PRD-1018",
    name: "Feline Stress Support Drops",
    categoryId: "CAT-05",
    price: 37,
    salePrice: 32,
    stock: 17,
    sku: "PET-CAL-002",
    status: "Active",
    image: image.cat,
    description: "Cat calming support drops for seeded customer panel testing.",
  },
  {
    id: "PRD-1019",
    name: "Thunderstorm Comfort Tablets",
    categoryId: "CAT-05",
    price: 45,
    salePrice: 39,
    stock: 11,
    sku: "PET-CAL-003",
    status: "Active",
    image: image.medication,
    description: "Behavior support product for noise-sensitive pets.",
  },
  {
    id: "PRD-1020",
    name: "Daily Calm Probiotic Chews",
    categoryId: "CAT-05",
    price: 41,
    salePrice: 36,
    stock: 21,
    sku: "PET-CAL-004",
    status: "Active",
    image: image.petCare,
    description: "Daily calming and digestive support chew product.",
  },
  {
    id: "PRD-1021",
    name: "Canine Antibiotic Suspension",
    categoryId: "CAT-06",
    price: 54,
    salePrice: null,
    stock: 16,
    sku: "PET-DIG-001",
    status: "Active",
    image: image.clinic,
    description: "Prescription-style antibiotic suspension placeholder for dogs.",
  },
  {
    id: "PRD-1022",
    name: "Cat Digestive Probiotic Powder",
    categoryId: "CAT-06",
    price: 28,
    salePrice: 24,
    stock: 29,
    sku: "PET-DIG-002",
    status: "Active",
    image: image.cat,
    description: "Digestive support powder product for cats.",
  },
  {
    id: "PRD-1023",
    name: "Anti-Nausea Pet Tablets",
    categoryId: "CAT-06",
    price: 39,
    salePrice: 35,
    stock: 13,
    sku: "PET-DIG-003",
    status: "Active",
    image: image.medication,
    description: "Stomach support tablet product for demo medication orders.",
  },
  {
    id: "PRD-1024",
    name: "Oral Rehydration Gel for Pets",
    categoryId: "CAT-06",
    price: 22,
    salePrice: 19,
    stock: 26,
    sku: "PET-DIG-004",
    status: "Active",
    image: image.petCare,
    description: "Hydration support gel for pets, seeded as storefront sample data.",
  },
];

function categoryPayload(category) {
  return {
    name: category.name,
    description: category.description,
    image: category.image,
    status: category.status,
  };
}

const categoryVariantLabels = {
  "CAT-01": ["Small Pet", "Medium Pet", "Large Pet"],
  "CAT-02": ["Up to 25 lb", "26-50 lb", "51-100 lb"],
  "CAT-03": ["30 count", "60 count", "90 count"],
  "CAT-04": ["Small", "Medium", "Large"],
  "CAT-05": ["30 chews", "60 chews", "120 chews"],
  "CAT-06": ["Small pack", "Medium pack", "Large pack"],
};

function toMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function getVariantLabels(product) {
  if (Array.isArray(product.capacities) && product.capacities.length > 0) {
    return product.capacities;
  }
  return categoryVariantLabels[product.categoryId] || ["Small", "Medium", "Large"];
}

function buildOptionVariants(product) {
  const labels = getVariantLabels(product);
  const sellingPrice = toMoney(product.salePrice ?? product.price);
  const mrp = toMoney(product.price);
  const totalStock = Math.max(0, Number(product.stock) || 0);
  const stockSeed = totalStock || labels.length;
  const baseStock = Math.floor(stockSeed / labels.length);
  const remainder = stockSeed % labels.length;
  const priceMultipliers = labels.length === 1 ? [1] : [1, 1.18, 1.35, 1.55, 1.75, 1.95];

  return labels.map((label, index) => {
    const multiplier = priceMultipliers[index] || (1 + index * 0.18);
    const variantMrp = toMoney(mrp * multiplier);
    const variantPrice = toMoney(sellingPrice * multiplier);
    const stock = baseStock + (index < remainder ? 1 : 0);

    return {
      id: `${product.id}-VAR-${index + 1}`,
      label,
      sku: `${product.sku}-${index + 1}`,
      price: variantPrice,
      regularPrice: Math.max(variantMrp, variantPrice),
      stock,
      status: stock > 0 ? "Active" : "Inactive",
    };
  });
}

function deriveProductValuesFromVariants(optionVariants) {
  const primaryVariant =
    optionVariants.find((variant) => variant.status === "Active") ||
    optionVariants[0];
  const stock = optionVariants.reduce(
    (total, variant) => total + (variant.status === "Active" ? Number(variant.stock) || 0 : 0),
    0,
  );

  return {
    price: primaryVariant.price,
    salePrice: primaryVariant.regularPrice,
    stock,
  };
}

function productPayload(product) {
  const optionVariants = buildOptionVariants(product);
  const derived = deriveProductValuesFromVariants(optionVariants);

  return {
    name: product.name,
    categoryId: product.categoryId,
    price: derived.price,
    salePrice: derived.salePrice,
    stock: derived.stock,
    sku: product.sku,
    status: derived.stock > 0 ? product.status : "Inactive",
    image: product.image,
    gallery: [product.image, image.medication].filter(Boolean),
    description: product.description,
    optionType: product.optionType || "size",
    optionLabel: product.optionLabel || "Variant",
    capacities: getVariantLabels(product),
    optionVariants,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
  const customerPasswordHash = await bcrypt.hash(process.env.CUSTOMER_PASSWORD || "customer123", 10);

  await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL || "owner@petmedstore.com" },
    update: {
      name: process.env.ADMIN_NAME || "Pet Med Store",
      role: "Store Owner",
      passwordHash,
      avatar: image.avatar,
    },
    create: {
      name: process.env.ADMIN_NAME || "Pet Med Store",
      role: "Store Owner",
      email: process.env.ADMIN_EMAIL || "owner@petmedstore.com",
      passwordHash,
      avatar: image.avatar,
    },
  });

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: categoryPayload(category),
      create: { id: category.id, ...categoryPayload(category) },
    });
  }

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: productPayload(product),
      create: { id: product.id, ...productPayload(product) },
    });
  }

  const customers = [
    ["CUS-1001", "Angel Uroiste", "angel.uroiste@example.com", "+1 (512) 634-7892", "Active"],
    ["CUS-1002", "Mina Patel", "mina.patel@example.com", "+1 (415) 555-0118", "Active"],
    ["CUS-1003", "Noah King", "noah.king@example.com", "+1 (650) 555-0180", "Inactive"],
  ];

  for (const [id, name, email, phone, status] of customers) {
    await prisma.customer.upsert({
      where: { id },
      update: { name, email, phone, status, passwordHash: customerPasswordHash, avatar: image.customer },
      create: {
        id,
        name,
        email,
        passwordHash: customerPasswordHash,
        phone,
        status,
        avatar: image.customer,
        addresses: ["124 Market Street, San Francisco, CA 94105"],
        joined: new Date("2026-01-08"),
      },
    });
  }

  await prisma.order.upsert({
    where: { id: "ORD-2048" },
    update: {
      customerId: "CUS-1001",
      customerName: "Angel Uroiste",
      email: "angel.uroiste@example.com",
      phone: "+1 (512) 634-7892",
      orderDate: new Date("2026-06-10"),
      total: 156.6,
      subtotal: 145,
      shipping: 0,
      tax: 11.6,
      paymentStatus: "Paid",
      orderStatus: "Processing",
      shippingAddress: "124 Market Street, Apartment 8B, San Francisco, CA 94105",
      items: [
        { name: "Canine Flea & Tick Monthly Chew", sku: "PET-FLT-001", qty: 1, price: 49 },
        { name: "Heartworm Monthly Soft Chews", sku: "PET-HRT-001", qty: 1, price: 58 },
        { name: "Travel Anxiety Calming Chews", sku: "PET-CAL-001", qty: 1, price: 29 },
        { name: "Medicated Ear Cleansing Solution", sku: "PET-ALG-002", qty: 1, price: 25 },
      ],
      timeline: ["Order placed", "Vet prescription verified", "Payment confirmed", "Ready for pharmacy packing"],
    },
    create: {
      id: "ORD-2048",
      customerId: "CUS-1001",
      customerName: "Angel Uroiste",
      email: "angel.uroiste@example.com",
      phone: "+1 (512) 634-7892",
      orderDate: new Date("2026-06-10"),
      total: 156.6,
      subtotal: 145,
      shipping: 0,
      tax: 11.6,
      paymentStatus: "Paid",
      orderStatus: "Processing",
      shippingAddress: "124 Market Street, Apartment 8B, San Francisco, CA 94105",
      items: [
        { name: "Canine Flea & Tick Monthly Chew", sku: "PET-FLT-001", qty: 1, price: 49 },
        { name: "Heartworm Monthly Soft Chews", sku: "PET-HRT-001", qty: 1, price: 58 },
        { name: "Travel Anxiety Calming Chews", sku: "PET-CAL-001", qty: 1, price: 29 },
        { name: "Medicated Ear Cleansing Solution", sku: "PET-ALG-002", qty: 1, price: 25 },
      ],
      timeline: ["Order placed", "Vet prescription verified", "Payment confirmed", "Ready for pharmacy packing"],
    },
  });

  await prisma.banner.upsert({
    where: { id: "BAN-01" },
    update: {
      title: "Pet Medication Essentials",
      subtitle: "Flea, tick, heartworm, allergy, and calming care for cats and dogs",
      buttonText: "Shop Pet Meds",
      link: "/collections/pet-medications",
      image: image.petCare,
      status: "Inactive",
    },
    create: {
      id: "BAN-01",
      title: "Pet Medication Essentials",
      subtitle: "Flea, tick, heartworm, allergy, and calming care for cats and dogs",
      buttonText: "Shop Pet Meds",
      link: "/collections/pet-medications",
      image: image.petCare,
      status: "Inactive",
    },
  });

  if (prisma.blog) {
    await prisma.blog.upsert({
      where: { id: "BLG-01" },
      update: {
        title: "How to Organize Your Pet Medication Schedule",
        category: "Pet Health",
        author: "Pet Med Store Team",
        publishedDate: new Date("2026-06-02"),
        content: "Keep refill dates, dosing notes, and veterinarian instructions in one place for safer pet care.",
        image: image.clinic,
        status: "Published",
      },
      create: {
        id: "BLG-01",
        title: "How to Organize Your Pet Medication Schedule",
        category: "Pet Health",
        author: "Pet Med Store Team",
        publishedDate: new Date("2026-06-02"),
        content: "Keep refill dates, dosing notes, and veterinarian instructions in one place for safer pet care.",
        image: image.clinic,
        status: "Published",
      },
    });
  }

  await prisma.popup.upsert({
    where: { id: "default" },
    update: {
      title: "Save on your pet care refill",
      message: "Create an account to manage refills, pet profiles, and medication orders.",
      buttonText: "Create Account",
      link: "/register",
      image: image.cat,
      status: "Active",
    },
    create: {
      id: "default",
      title: "Save on your pet care refill",
      message: "Create an account to manage refills, pet profiles, and medication orders.",
      buttonText: "Create Account",
      link: "/register",
      image: image.cat,
      status: "Active",
    },
  });

  await prisma.announcement.upsert({
    where: { id: "default" },
    update: {
      text: "Demo pet medication data only. Always follow veterinarian instructions.",
      link: "/pet-medication-safety",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-30"),
      status: "Active",
    },
    create: {
      id: "default",
      text: "Demo pet medication data only. Always follow veterinarian instructions.",
      link: "/pet-medication-safety",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-30"),
      status: "Active",
    },
  });

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {
      storeName: process.env.TENANT_STORE_NAME || "Pet Med Store",
      supportEmail: process.env.TENANT_SUPPORT_EMAIL || "support@petmedstore.com",
      supportPhone: "+1 (555) 210-9088",
      currency: "USD",
      timezone: "America/New_York",
    },
    create: {
      id: "default",
      storeName: process.env.TENANT_STORE_NAME || "Pet Med Store",
      supportEmail: process.env.TENANT_SUPPORT_EMAIL || "support@petmedstore.com",
      supportPhone: "+1 (555) 210-9088",
      currency: "USD",
      timezone: "America/New_York",
    },
  });

  console.log(`Seeded ${categories.length} pet medication categories and ${products.length} products.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
