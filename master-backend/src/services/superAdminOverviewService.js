const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");
const ApiError = require("../utils/apiError");
const {
  getEmailBrand,
  renderPrintableShipmentLabelPage,
} = require("./emailService");

function storeMeta(store) {
  return {
    storeId: store.id,
    storeName: store.name,
    storeKey: store.storeKey,
  };
}

function withStore(store, record) {
  return {
    ...record,
    originalId: record.id,
    id: `${store.storeKey}:${record.id}`,
    store: storeMeta(store),
    storeId: store.id,
    storeName: store.name,
    storeKey: store.storeKey,
  };
}

async function activeStores(filters = {}) {
  const storeKey = String(filters.storeKey || "")
    .trim()
    .toUpperCase();
  const stores = await masterPrisma.store.findMany({
    where: {
      status: "ACTIVE",
    },
    orderBy: { storeKey: "asc" },
  });
  if (!storeKey || storeKey === "ALL_STORES") return stores;
  return stores.filter(
    (store) => String(store.storeKey || "").toUpperCase() === storeKey,
  );
}

function assertTenantConnectionConfig(store) {
  const missing = [
    ["databaseName", store.databaseName],
    ["databaseHost", store.databaseHost],
    ["databaseUser", store.databaseUser],
    ["encryptedDatabasePass", store.encryptedDatabasePass],
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missing.length) {
    throw new Error(`Missing tenant DB config: ${missing.join(", ")}`);
  }
}

async function collectFromStores(fetcher, filters = {}) {
  const stores = await activeStores(filters);
  const results = await Promise.all(
    stores.map(async (store) => {
      try {
        assertTenantConnectionConfig(store);
        const tenantDb = await getTenantClient(store);
        const records = await fetcher(tenantDb);
        return { records: records.map((record) => withStore(store, record)) };
      } catch (error) {
        return {
          error: {
            storeKey: store.storeKey,
            storeName: store.name,
            message: error.message,
          },
        };
      }
    }),
  );

  const failures = results.map((result) => result.error).filter(Boolean);
  if (failures.length) {
    const message = failures
      .map((failure) => `${failure.storeKey}: ${failure.message}`)
      .join("; ");
    throw new ApiError(
      503,
      `Super admin could not load all stores. ${message}`,
    );
  }

  return results.flatMap((result) => result.records);
}

function groupCountsByStore(items) {
  return items.reduce((groups, item) => {
    const key = item.storeKey || "UNKNOWN";
    if (!groups[key]) {
      groups[key] = {
        storeKey: item.storeKey,
        storeName: item.storeName,
        count: 0,
      };
    }
    groups[key].count += 1;
    return groups;
  }, {});
}

function isLowStockProduct(product) {
  const stock = Number(product.stock || 0);
  return stock > 0 && stock <= 5;
}

function isPendingOrder(order) {
  return order.orderStatus === "Pending";
}

function isRevenueOrder(order) {
  return order.paymentStatus === "Paid" && order.orderStatus !== "Cancelled";
}

function normalizeFilterValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.toLowerCase() === "all") return "";
  return normalized.toLowerCase();
}

function getDayBoundary(value, endOfDay = false) {
  if (!value) return undefined;
  const dateOnlyMatch = String(value)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setHours(
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  return date;
}

function getOrderSearchText(order) {
  const itemNames = Array.isArray(order.items)
    ? order.items
        .map(
          (item) =>
            item?.name ||
            item?.productName ||
            item?.product?.name ||
            item?.title,
        )
        .filter(Boolean)
        .join(" ")
    : "";

  return [
    order.id,
    order.originalId,
    order.customerName,
    order.email,
    order.phone,
    order.orderStatus,
    order.paymentStatus,
    order.storeName,
    order.storeKey,
    itemNames,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterOrders(orders = [], filters = {}) {
  const query = String(filters.q || "")
    .trim()
    .toLowerCase();
  const status = normalizeFilterValue(filters.status);
  const paymentStatus = normalizeFilterValue(filters.paymentStatus);
  const fromDate = getDayBoundary(filters.startDate);
  const toDate = getDayBoundary(filters.endDate, true);

  return orders.filter((order) => {
    if (query && !getOrderSearchText(order).includes(query)) return false;
    if (status && String(order.orderStatus || "").toLowerCase() !== status)
      return false;
    if (
      paymentStatus &&
      String(order.paymentStatus || "").toLowerCase() !== paymentStatus
    )
      return false;

    const orderDateValue = order.orderDate || order.createdAt;
    if (fromDate || toDate) {
      const orderDate = new Date(orderDateValue || 0);
      if (Number.isNaN(orderDate.getTime())) return false;
      if (fromDate && orderDate < fromDate) return false;
      if (toDate && orderDate > toDate) return false;
    }

    return true;
  });
}

function sumRevenue(orders) {
  return orders
    .filter(isRevenueOrder)
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
}

function withLatestShipmentDetails(order) {
  const latestDetail = (order.shipmentHistory || [])
    .slice()
    .reverse()
    .find((entry) => entry.location || entry.description);
  if (!latestDetail) return order;
  return {
    ...order,
    shipmentLocation: latestDetail.location || null,
    shipmentNotes: latestDetail.description || null,
  };
}

async function listOrders(filters = {}) {
  const orders = await collectFromStores(
    (db) =>
      db.order.findMany({
        include: { shipmentHistory: { orderBy: { createdAt: "asc" } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    filters,
  );
  return filterOrders(orders.map(withLatestShipmentDetails), filters).sort(
    (a, b) =>
      new Date(b.createdAt || b.orderDate || 0) -
      new Date(a.createdAt || a.orderDate || 0),
  );
}

async function listProducts(filters = {}) {
  const products = await collectFromStores(
    (db) =>
      db.product.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
    filters,
  );
  return products.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}

async function listCustomers(filters = {}) {
  const customers = await collectFromStores(async (db) => {
    const records = await db.customer.findMany({
      include: { orders: true },
      orderBy: { joined: "desc" },
    });

    return records.map((customer) => ({
      ...customer,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce(
        (sum, order) => sum + Number(order.total || 0),
        0,
      ),
    }));
  }, filters);
  return customers.sort(
    (a, b) => new Date(b.joined || 0) - new Date(a.joined || 0),
  );
}

async function listCategories(filters = {}) {
  const categories = await collectFromStores(
    (db) =>
      db.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: "desc" },
      }),
    filters,
  );
  return categories.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
}

function getVetVerificationSearchText(application) {
  return [
    application.id,
    application.originalId,
    application.fullName,
    application.email,
    application.phone,
    application.clinicName,
    application.licenseNumber,
    application.licenseState,
    application.status,
    application.storeName,
    application.storeKey,
    application.customer?.name,
    application.customer?.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterVetVerifications(applications = [], filters = {}) {
  const query = String(filters.q || "")
    .trim()
    .toLowerCase();
  const status = normalizeFilterValue(filters.status);

  return applications.filter((application) => {
    if (query && !getVetVerificationSearchText(application).includes(query))
      return false;
    if (status && String(application.status || "").toLowerCase() !== status)
      return false;
    return true;
  });
}

async function listVetVerifications(filters = {}) {
  const take = Math.min(Math.max(Number(filters.limit) || 100, 1), 200);
  const page = Math.max(Number(filters.page) || 1, 1);
  const applications = await collectFromStores(
    (db) =>
      db.vetVerification.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
    filters,
  );
  const normalized = applications.map((application) => ({
    ...application,
    customer: application.user || undefined,
    user: undefined,
  }));
  const filtered = filterVetVerifications(normalized, filters).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  );
  const total = filtered.length;
  return {
    items: filtered.slice((page - 1) * take, page * take),
    total,
    page,
    limit: take,
    totalPages: Math.max(Math.ceil(total / take), 1),
  };
}

async function getVetVerification(compositeId) {
  const [storeKey, applicationId] = String(compositeId || "").split(":");
  if (!storeKey || !applicationId)
    throw new ApiError(400, "Invalid vet verification id");
  const stores = await activeStores({ storeKey });
  const store = stores[0];
  if (!store) throw new ApiError(404, "Store not found");
  assertTenantConnectionConfig(store);
  const db = await getTenantClient(store);
  const application = await db.vetVerification.findUnique({
    where: { id: applicationId },
    include: {
      user: { include: { orders: { orderBy: { orderDate: "desc" } } } },
    },
  });
  if (!application)
    throw new ApiError(404, "Vet verification application not found");
  return withStore(store, {
    ...application,
    customer: application.user || undefined,
    user: undefined,
  });
}

async function getShipmentLabelHtml(compositeId) {
  const [storeKey, orderId] = String(compositeId || "").split(":");
  if (!storeKey || !orderId) throw new ApiError(400, "Invalid order id");
  const stores = await activeStores({ storeKey });
  const store = stores[0];
  if (!store) throw new ApiError(404, "Store not found");
  assertTenantConnectionConfig(store);
  const db = await getTenantClient(store);
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { shipmentHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.shipmentCreatedAt && !order.trackingNumber && !order.awbNumber) {
    throw new ApiError(400, "Create shipment details before printing a label");
  }
  return renderPrintableShipmentLabelPage(order, getEmailBrand(store));
}

async function overview(filters = {}) {
  const [orders, products, customers, categories] = await Promise.all([
    listOrders(filters),
    listProducts(filters),
    listCustomers(filters),
    listCategories(filters),
  ]);

  return {
    range: {
      storeKey: filters.storeKey || null,
    },
    totals: {
      orders: orders.length,
      products: products.length,
      customers: customers.length,
      categories: categories.length,
      revenue: sumRevenue(orders),
      pendingOrders: orders.filter(isPendingOrder).length,
      lowStock: products.filter(isLowStockProduct).length,
      stores: new Set([
        ...orders.map((item) => item.storeKey),
        ...products.map((item) => item.storeKey),
        ...customers.map((item) => item.storeKey),
        ...categories.map((item) => item.storeKey),
      ]).size,
    },
    storeCounts: {
      orders: Object.values(groupCountsByStore(orders)),
      products: Object.values(groupCountsByStore(products)),
      customers: Object.values(groupCountsByStore(customers)),
      categories: Object.values(groupCountsByStore(categories)),
    },
    orders,
    products,
    customers,
    categories,
  };
}

module.exports = {
  getShipmentLabelHtml,
  getVetVerification,
  listCategories,
  listCustomers,
  listVetVerifications,
  listOrders,
  listProducts,
  overview,
};
