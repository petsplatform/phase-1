const { prisma: defaultPrisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const {
  getEmailBrand,
  renderPrintableInvoicePage,
  renderPrintableShipmentLabelPage,
  sendOrderStatusUpdateEmail,
} = require("./emailService");

const FINAL_ORDER_STATUSES = new Set(["Delivered", "Cancelled"]);
const ORDER_STATUS_TRANSITIONS = {
  Pending: ["Processing"],
  Confirmed: ["Processing"],
  Processing: ["Shipped"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const ORDER_STATUS_FILTERS = new Map(
  ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => [
    status.toLowerCase(),
    status,
  ]),
);
const PAYMENT_STATUS_FILTERS = new Map(
  ["Paid", "Pending", "Failed", "Refunded"].map((status) => [status.toLowerCase(), status]),
);

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

function getDb(db) {
  return db || defaultPrisma;
}

function normalizeFilterValue(value, allowedValues) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.toLowerCase() === "all") return undefined;
  return allowedValues.get(normalized.toLowerCase());
}

function getDayBoundary(value, endOfDay = false) {
  if (!value) return undefined;
  const dateOnlyMatch = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return date;
}

async function listOrders({ q, status, paymentStatus, startDate, endDate, page, limit }, db) {
  const client = getDb(db);
  const take = limit ? Math.min(Math.max(Number(limit) || 20, 1), 100) : undefined;
  const currentPage = Math.max(Number(page) || 1, 1);
  const query = String(q || "").trim().slice(0, 120);
  const normalizedStatus = normalizeFilterValue(status, ORDER_STATUS_FILTERS);
  const normalizedPaymentStatus = normalizeFilterValue(paymentStatus, PAYMENT_STATUS_FILTERS);
  const fromDate = getDayBoundary(startDate);
  const toDate = getDayBoundary(endDate, true);
  const orderDate = {};

  if (fromDate) orderDate.gte = fromDate;
  if (toDate) orderDate.lte = toDate;

  const where = {
    orderStatus: normalizedStatus,
    paymentStatus: normalizedPaymentStatus,
    orderDate: Object.keys(orderDate).length ? orderDate : undefined,
    OR: query
      ? [
          { id: { contains: query, mode: "insensitive" } },
          { customerName: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ]
      : undefined,
  };

  const orders = await client.order.findMany({
    where,
    include: { shipmentHistory: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: take ? (currentPage - 1) * take : undefined,
    take,
  });
  return orders.map(withLatestShipmentDetails);
}

async function getOrder(id, db) {
  const client = getDb(db);
  const order = await client.order.findUnique({
    where: { id },
    include: { shipmentHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) throw new ApiError(404, "Order not found");
  return order;
}

async function updateOrderStatus(id, orderStatus, db, store) {
  const client = getDb(db);
  const existing = await getOrder(id, client);
  if (existing.orderStatus === orderStatus) return existing;

  if (FINAL_ORDER_STATUSES.has(existing.orderStatus)) {
    throw new ApiError(
      409,
      `Order status cannot be changed after it is ${existing.orderStatus.toLowerCase()}`,
    );
  }

  const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[existing.orderStatus] || [];
  if (!allowedNextStatuses.includes(orderStatus)) {
    throw new ApiError(
      400,
      `Order status cannot be changed from ${existing.orderStatus} to ${orderStatus}`,
    );
  }

  const order = await client.order.update({
    where: { id },
    data: {
      orderStatus,
      timeline: [
        ...(Array.isArray(existing.timeline) ? existing.timeline : []),
        `Status changed to ${orderStatus}`,
      ],
    },
  });
  await deliverOrderStatusUpdateEmail(order, existing.orderStatus, getEmailBrand(store));
  return order;
}

async function deleteOrder(id, db) {
  const client = getDb(db);
  const order = await getOrder(id, client);
  await client.order.delete({ where: { id } });
  return order;
}

async function getInvoiceHtml(id, store, db) {
  const order = await getOrder(id, db);
  return renderPrintableInvoicePage(order, getEmailBrand(store));
}

async function getShipmentLabelHtml(id, store, db) {
  const order = await getOrder(id, db);
  if (!order.shipmentCreatedAt && !order.trackingNumber && !order.awbNumber) {
    throw new ApiError(400, "Create shipment details before printing a label");
  }
  return renderPrintableShipmentLabelPage(order, getEmailBrand(store));
}

async function deliverOrderStatusUpdateEmail(order, previousStatus, brand = getEmailBrand()) {
  if (!order?.email) return { delivered: false, skipped: true };
  try {
    return await sendOrderStatusUpdateEmail(order, previousStatus, brand);
  } catch (error) {
    console.error(`[${brand.name}] Order status email failed`, {
      orderId: order.id,
      to: order.email,
      status: order.orderStatus,
      message: error.message,
    });
    return {
      delivered: false,
      error: "Order status email could not be sent. Please check SMTP configuration.",
    };
  }
}

module.exports = {
  deleteOrder,
  getInvoiceHtml,
  getOrder,
  getShipmentLabelHtml,
  listOrders,
  updateOrderStatus,
};
