const { prisma: defaultPrisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { sendEmail, getEmailBrand } = require("./emailService");
const { writeAuditLog } = require("./auditLogService");
const { createNotification } = require("./notificationService");
const courierService = require("./courierService");
const ManualCourierProvider = require("./couriers/manualCourierProvider");

const provider = new ManualCourierProvider();

const STATUS_TO_ORDER_STATUS = {
  Packed: "Processing",
  ReadyToShip: "Processing",
  Shipped: "Shipped",
  InTransit: "Shipped",
  OutForDelivery: "Shipped",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
  Returned: "Cancelled",
};

const STATUS_SEQUENCE = {
  Pending: 0,
  Packed: 1,
  ReadyToShip: 2,
  Shipped: 3,
  InTransit: 4,
  OutForDelivery: 5,
  Delivered: 6,
};

function getDb(db) {
  return db || defaultPrisma;
}

function getLatestShipmentDetail(order) {
  return (order?.shipmentHistory || [])
    .slice()
    .reverse()
    .find((entry) => entry.location || entry.description) || {};
}

function serializeShipment(order) {
  if (!order) return null;
  const latestDetail = getLatestShipmentDetail(order);
  return {
    orderId: order.id,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    awbNumber: order.awbNumber,
    trackingUrl: order.trackingUrl,
    shipmentLocation: latestDetail.location || null,
    shipmentNotes: latestDetail.description || null,
    shipmentStatus: order.shipmentStatus,
    shipmentCreatedAt: order.shipmentCreatedAt,
    shippedAt: order.shippedAt,
    outForDeliveryAt: order.outForDeliveryAt,
    deliveredAt: order.deliveredAt,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    customerName: order.customerName,
    email: order.email,
    phone: order.phone,
    shippingAddress: order.shippingAddress,
    orderStatus: order.orderStatus,
    timeline: order.shipmentHistory || [],
  };
}

async function listShipments({ q, shipmentStatus, courierName, startDate, endDate, page = 1, limit = 20 } = {}, db) {
  const client = getDb(db);
  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const createdRange = {};
  if (startDate) createdRange.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    createdRange.lte = end;
  }
  const where = {
    shipmentCreatedAt: Object.keys(createdRange).length ? createdRange : { not: null },
    shipmentStatus: shipmentStatus && shipmentStatus !== "All" ? shipmentStatus : undefined,
    courierName: courierName ? { contains: courierName, mode: "insensitive" } : undefined,
    OR: q
      ? [
          { id: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { trackingNumber: { contains: q, mode: "insensitive" } },
          { awbNumber: { contains: q, mode: "insensitive" } },
        ]
      : undefined,
  };
  const [items, total] = await Promise.all([
    client.order.findMany({
      where,
      include: { shipmentHistory: { orderBy: { createdAt: "desc" } } },
      orderBy: [{ shipmentCreatedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    client.order.count({ where }),
  ]);
  return { items: items.map(serializeShipment), total, page: Number(page), limit: take, totalPages: Math.max(Math.ceil(total / take), 1) };
}

async function getShipment(orderId, db, customerId = null) {
  const client = getDb(db);
  const order = await client.order.findFirst({
    where: { id: orderId, customerId: customerId || undefined },
    include: { shipmentHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) throw new ApiError(404, "Order not found");
  return serializeShipment(order);
}

async function createOrUpdateShipment(orderId, payload, meta = {}, db) {
  const client = getDb(db);
  const existing = await client.order.findUnique({
    where: { id: orderId },
    include: { shipmentHistory: true },
  });
  if (!existing) throw new ApiError(404, "Order not found");
  if (existing.orderStatus === "Cancelled") {
    throw new ApiError(400, "Cannot create shipment for cancelled orders");
  }

  const duplicate = await client.order.findFirst({
    where: { trackingNumber: payload.trackingNumber, NOT: { id: orderId } },
  });
  if (duplicate) throw new ApiError(409, "Tracking number already exists");

  const courier = await resolveCourier(payload.courierName, client);
  const providerShipment = await provider.createShipment(payload);
  const trackingUrl = payload.trackingUrl || buildTrackingUrl(courier?.trackingUrlPattern, payload.trackingNumber);
  const action = existing.shipmentCreatedAt ? "Shipment Updated" : "Shipment Created";
  const now = new Date();
  const shipmentLocation = payload.location || null;
  const shipmentNotes = payload.notes || null;

  const order = await client.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        courierName: providerShipment.courierName,
        trackingNumber: providerShipment.trackingNumber,
        awbNumber: providerShipment.awbNumber,
        trackingUrl,
        estimatedDeliveryDate: payload.estimatedDeliveryDate || null,
        shipmentStatus: existing.shipmentStatus || "Pending",
        shipmentCreatedAt: existing.shipmentCreatedAt || now,
      },
      include: { shipmentHistory: { orderBy: { createdAt: "asc" } } },
    });
    await tx.shipmentHistory.create({
      data: {
        orderId,
        status: updated.shipmentStatus,
        location: shipmentLocation,
        description: shipmentNotes || action,
        createdBy: meta.adminId || null,
      },
    });
    await createNotification({
      recipient: "admin",
      title: "Shipment Created",
      message: `Shipment saved for order ${orderId}.`,
      type: "shipment_created",
    }, tx);
    return updated;
  });

  audit(meta, action, orderId, {
    oldValue: pickShipmentFields(existing),
    newValue: pickShipmentFields(order),
  });
  notifyCustomer(order, action, meta.store);
  return serializeShipment(order);
}

async function updateShipmentStatus(orderId, { status, location, description }, meta = {}, db) {
  const client = getDb(db);
  const existing = await client.order.findUnique({ where: { id: orderId } });
  if (!existing) throw new ApiError(404, "Order not found");
  if (status !== "Cancelled") validateShipmentDetails(existing, { location, description });
  validateStatusTransition(existing, status);
  const now = new Date();
  const data = {
    shipmentStatus: status,
    orderStatus: STATUS_TO_ORDER_STATUS[status] || existing.orderStatus,
    timeline: [...(Array.isArray(existing.timeline) ? existing.timeline : []), `Shipment ${formatShipmentStatus(status)}`],
  };
  if (status === "Shipped" && !existing.shippedAt) data.shippedAt = now;
  if (status === "OutForDelivery" && !existing.outForDeliveryAt) data.outForDeliveryAt = now;
  if (status === "Delivered" && !existing.deliveredAt) data.deliveredAt = now;
  if (!existing.shipmentCreatedAt) data.shipmentCreatedAt = now;

  const order = await client.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data,
      include: { shipmentHistory: { orderBy: { createdAt: "asc" } } },
    });
    await tx.shipmentHistory.create({
      data: {
        orderId,
        status,
        location: location || null,
        description: description || `Shipment ${formatShipmentStatus(status)}`,
        createdBy: meta.adminId || null,
      },
    });
    await createNotification({
      recipient: "customer",
      userId: existing.customerId || null,
      title: shipmentNotificationTitle(status),
      message: `Order ${orderId}: ${formatShipmentStatus(status)}`,
      type: `shipment_${String(status).toLowerCase()}`,
    }, tx);
    if (status === "Delivered") {
      await createNotification({
        recipient: "admin",
        title: "Delivery Completed",
        message: `Order ${orderId} was delivered.`,
        type: "shipment_delivered",
      }, tx);
    }
    return updated;
  });

  audit(meta, status, orderId, { oldValue: existing.shipmentStatus, newValue: status });
  notifyCustomer(order, shipmentNotificationTitle(status), meta.store);
  return serializeShipment(order);
}

async function deleteShipment(orderId, meta = {}, db) {
  return updateShipmentStatus(orderId, { status: "Cancelled", description: "Shipment cancelled" }, meta, db);
}

async function bulkCreateShipments({ courierName, shipments = [] }, meta = {}, db) {
  const results = [];
  for (const item of shipments) {
    try {
      const shipment = await createOrUpdateShipment(item.orderId, { ...item, courierName }, meta, db);
      results.push({ orderId: item.orderId, success: true, shipment });
    } catch (error) {
      results.push({ orderId: item.orderId, success: false, message: error.message });
    }
  }
  return {
    successCount: results.filter((item) => item.success).length,
    failedCount: results.filter((item) => !item.success).length,
    results,
  };
}

async function getTracking(orderId, db, customerId = null) {
  const shipment = await getShipment(orderId, db, customerId);
  return {
    ...shipment,
    progress: STATUS_SEQUENCE[shipment.shipmentStatus] || 0,
    progressTotal: STATUS_SEQUENCE.Delivered,
  };
}

async function resolveCourier(name, db) {
  if (!name) return null;
  return db.courier.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, status: "Active" },
  });
}

function buildTrackingUrl(pattern, trackingNumber) {
  if (!pattern || !trackingNumber) return null;
  return pattern.replace(/\{trackingNumber\}/g, encodeURIComponent(trackingNumber));
}

function pickShipmentFields(order) {
  return {
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    awbNumber: order.awbNumber,
    trackingUrl: order.trackingUrl,
    shipmentStatus: order.shipmentStatus,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
  };
}

function validateStatusTransition(order, nextStatus) {
  if (nextStatus === "Cancelled") return;
  const currentStatus = order.shipmentStatus || "Pending";
  const currentStep = STATUS_SEQUENCE[currentStatus] ?? 0;
  const nextStep = STATUS_SEQUENCE[nextStatus] ?? 0;
  if (nextStep <= currentStep) {
    throw new ApiError(400, `Cannot change shipment status from ${formatShipmentStatus(currentStatus)} to ${formatShipmentStatus(nextStatus)}`);
  }
  if (nextStatus === "Delivered" && STATUS_SEQUENCE[order.shipmentStatus || "Pending"] < STATUS_SEQUENCE.Shipped) {
    throw new ApiError(400, "Cannot mark Delivered before Shipped");
  }
  if (order.orderStatus === "Cancelled" && nextStatus !== "Cancelled") {
    throw new ApiError(400, "Cancelled orders cannot be shipped");
  }
}

function validateShipmentDetails(order, payload = {}) {
  const missing = [];
  if (!String(order.courierName || "").trim()) missing.push("Courier");
  if (!String(order.trackingNumber || "").trim()) missing.push("Tracking number");
  if (!String(order.awbNumber || "").trim()) missing.push("AWB number");
  if (!order.estimatedDeliveryDate) missing.push("Estimated delivery date");
  if (!String(payload.location || "").trim()) missing.push("Location");
  if (!String(payload.description || "").trim()) missing.push("Shipment notes");

  if (missing.length) {
    throw new ApiError(400, `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required`);
  }

  const estimatedDeliveryDate = new Date(order.estimatedDeliveryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  estimatedDeliveryDate.setHours(0, 0, 0, 0);
  if (Number.isNaN(estimatedDeliveryDate.getTime()) || estimatedDeliveryDate < today) {
    throw new ApiError(400, "Estimated delivery date must be today or a future date");
  }
}

function formatShipmentStatus(status) {
  return String(status || "Pending").replace(/([A-Z])/g, " $1").trim();
}

function shipmentNotificationTitle(status) {
  const labels = {
    Packed: "Order Packed",
    Shipped: "Order Shipped",
    OutForDelivery: "Out For Delivery",
    Delivered: "Delivered",
    Returned: "Returned",
    Cancelled: "Shipment Cancelled",
  };
  return labels[status] || `Shipment ${formatShipmentStatus(status)}`;
}

function notifyCustomer(order, subject, store) {
  if (!order?.email) return;
  const brand = getEmailBrand(store);
  sendEmail({
    to: order.email,
    brand,
    subject,
    text: `Hi ${order.customerName},\n\n${subject} for order ${order.id}.\nTracking number: ${order.trackingNumber || "N/A"}\nCourier: ${order.courierName || "N/A"}\n\n${brand.name}`,
    html: `<p>Hi <strong>${order.customerName}</strong>,</p><p>${subject} for order <strong>${order.id}</strong>.</p><p><strong>Courier:</strong> ${order.courierName || "N/A"}<br/><strong>Tracking Number:</strong> ${order.trackingNumber || "N/A"}</p><p>${brand.name}</p>`,
  }).catch(() => {});
}

function audit(meta, action, orderId, metadata) {
  writeAuditLog({
    actorId: meta.adminId,
    storeId: meta.storeId,
    action: "update",
    module: "Shipments",
    description: `${action}: ${orderId}`,
    ipAddress: meta.ip,
    metadata,
  });
}

module.exports = {
  bulkCreateShipments,
  createOrUpdateShipment,
  deleteShipment,
  getShipment,
  getTracking,
  listShipments,
  updateShipmentStatus,
};
