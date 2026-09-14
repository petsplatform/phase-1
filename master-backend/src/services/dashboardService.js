const { prisma } = require("../config/db");
const { resolveDateRange } = require("../utils/dateRange");
const simpleCache = require("../utils/simpleCache");

const CACHE_TTL_MS = 30_000;
const PAID_NOT_CANCELLED = { paymentStatus: "Paid", orderStatus: { not: "Cancelled" } };

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function fixedWindow(days) {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date());
  if (days > 1) start.setDate(start.getDate() - (days - 1));
  return { start, end };
}

function currentMonthWindow() {
  const now = new Date();
  return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(now) };
}

function previousMonthWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start: startOfDay(start), end: endOfDay(end) };
}

async function revenueSum(db, { start, end }) {
  const result = await db.order.aggregate({
    where: { ...PAID_NOT_CANCELLED, orderDate: { gte: start, lte: end } },
    _sum: { total: true },
  });
  return result._sum.total || 0;
}

async function getTrend(db, start, end) {
  const rows = await db.$queryRaw`
    SELECT date_trunc('day', "orderDate") AS day,
           COUNT(*)::int AS orders,
           COALESCE(SUM(CASE WHEN "paymentStatus" = 'Paid' AND "orderStatus" != 'Cancelled' THEN "total" ELSE 0 END), 0)::float AS revenue
    FROM "Order"
    WHERE "orderDate" >= ${start} AND "orderDate" <= ${end}
    GROUP BY day
    ORDER BY day ASC
  `;
  return rows.map((row) => ({
    date: row.day.toISOString().split("T")[0],
    orders: row.orders,
    revenue: row.revenue,
  }));
}

async function getBestSellersAndTopCategories(db, start, end) {
  const rows = await db.$queryRaw`
    SELECT item->>'productId' AS "productId",
           SUM((item->>'quantity')::int)::int AS quantity
    FROM "Order", jsonb_array_elements(items::jsonb) AS item
    WHERE "orderDate" >= ${start} AND "orderDate" <= ${end}
      AND item->>'productId' IS NOT NULL
    GROUP BY item->>'productId'
    ORDER BY quantity DESC
    LIMIT 50
  `;

  if (rows.length === 0) return { bestSellers: [], topCategories: [] };

  const products = await db.product.findMany({
    where: { id: { in: rows.map((row) => row.productId) } },
    select: { id: true, name: true, sku: true, price: true, category: { select: { name: true } } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const bestSellers = rows
    .slice(0, 10)
    .map((row) => {
      const product = productById.get(row.productId);
      return product
        ? { productId: row.productId, name: product.name, sku: product.sku, price: product.price, quantitySold: row.quantity }
        : null;
    })
    .filter(Boolean);

  const categoryTotals = new Map();
  for (const row of rows) {
    const categoryName = productById.get(row.productId)?.category?.name || "Uncategorized";
    categoryTotals.set(categoryName, (categoryTotals.get(categoryName) || 0) + row.quantity);
  }
  const topCategories = [...categoryTotals.entries()]
    .map(([category, quantitySold]) => ({ category, quantitySold }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, 5);

  return { bestSellers, topCategories };
}

async function computeSummary(db, dateRange) {
  const { start, end } = dateRange;
  const rangeOrderDate = { orderDate: { gte: start, lte: end } };

  const [
    productCount,
    customerCount,
    recentOrders,
    revenueInRange,
    ordersInRange,
    paidOrdersInRange,
    statusCounts,
    refundAgg,
    lowStockProducts,
    lowStockCount,
    outOfStockCount,
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    currentMonthRevenue,
    previousMonthRevenue,
    newCustomersThisMonth,
    trend,
    bestSellersAndCategories,
  ] = await Promise.all([
    db.product.count(),
    db.customer.count(),
    db.order.findMany({ orderBy: { orderDate: "desc" }, take: 6 }),
    revenueSum(db, { start, end }),
    db.order.count({ where: rangeOrderDate }),
    db.order.count({ where: { ...PAID_NOT_CANCELLED, ...rangeOrderDate } }),
    db.order.groupBy({ by: ["orderStatus"], where: rangeOrderDate, _count: { orderStatus: true } }),
    db.order.aggregate({
      where: { paymentStatus: "Refunded", ...rangeOrderDate },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.product.findMany({ where: { stock: { gt: 0, lte: 5 } }, orderBy: { stock: "asc" }, take: 10 }),
    db.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
    db.product.count({ where: { stock: { lte: 0 } } }),
    revenueSum(db, fixedWindow(1)),
    revenueSum(db, fixedWindow(7)),
    revenueSum(db, currentMonthWindow()),
    revenueSum(db, currentMonthWindow()),
    revenueSum(db, previousMonthWindow()),
    db.customer.count({ where: { joined: { gte: currentMonthWindow().start, lte: currentMonthWindow().end } } }),
    getTrend(db, start, end),
    getBestSellersAndTopCategories(db, start, end),
  ]);

  const statusCountMap = Object.fromEntries(statusCounts.map((row) => [row.orderStatus, row._count.orderStatus]));
  const revenueChangePct = previousMonthRevenue > 0
    ? Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(2))
    : null;

  return {
    range: { key: dateRange.key, start, end },
    totals: {
      revenue: revenueInRange,
      orders: ordersInRange,
      customers: customerCount,
      products: productCount,
      lowStock: lowStockCount,
      pendingOrders: statusCountMap.Pending || 0,
    },
    orderStatusCounts: {
      pending: statusCountMap.Pending || 0,
      confirmed: statusCountMap.Confirmed || 0,
      processing: statusCountMap.Processing || 0,
      shipped: statusCountMap.Shipped || 0,
      delivered: statusCountMap.Delivered || 0,
      cancelled: statusCountMap.Cancelled || 0,
    },
    revenue: {
      inRange: revenueInRange,
      daily: dailyRevenue,
      weekly: weeklyRevenue,
      monthly: monthlyRevenue,
      currentMonth: currentMonthRevenue,
      previousMonth: previousMonthRevenue,
      changePct: revenueChangePct,
    },
    refunds: {
      count: refundAgg._count._all || 0,
      amount: refundAgg._sum.total || 0,
    },
    averageOrderValue: paidOrdersInRange > 0 ? Number((revenueInRange / paidOrdersInRange).toFixed(2)) : 0,
    conversionRate: {
      available: false,
      value: null,
      reason: "No visitor/session tracking table exists yet; add analytics event capture to enable this metric.",
    },
    newCustomersThisMonth,
    inventory: {
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      lowStockProducts,
    },
    trend,
    bestSellers: bestSellersAndCategories.bestSellers,
    topCategories: bestSellersAndCategories.topCategories,
    recentOrders,
  };
}

async function getSummary(db = prisma, query = {}, cacheKey = "default") {
  const dateRange = resolveDateRange(query);
  const key = `dashboard:${cacheKey}:${dateRange.key}:${dateRange.start.getTime()}:${dateRange.end.getTime()}`;
  return simpleCache.getOrCompute(key, CACHE_TTL_MS, () => computeSummary(db, dateRange));
}

module.exports = { getSummary };
