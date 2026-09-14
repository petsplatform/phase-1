const { masterPrisma } = require("../config/db");

function normalizeAuditEntity(metadata = {}) {
  const entityType =
    metadata.entityType ||
    metadata.module ||
    metadata.resourceType ||
    metadata.type ||
    null;
  const entityId =
    metadata.entityId ||
    metadata.applicationId ||
    metadata.customerId ||
    metadata.orderId ||
    metadata.productId ||
    metadata.userId ||
    null;
  const entityName =
    metadata.entityName ||
    metadata.customerName ||
    metadata.fullName ||
    metadata.name ||
    null;
  const entityEmail =
    metadata.entityEmail ||
    metadata.customerEmail ||
    metadata.email ||
    null;

  return { entityType, entityId, entityName, entityEmail };
}

function buildAuditSummary({ action, module: mod, description, metadata } = {}) {
  const entity = normalizeAuditEntity({ module: mod, ...(metadata || {}) });
  const details = [
    entity.entityName,
    entity.entityEmail,
    entity.entityId,
  ].filter(Boolean);

  if (!details.length) return description || null;
  const prefix = description || `${action || "Action"}${mod ? ` ${mod}` : ""}`;
  return `${prefix} (${details.join(" · ")})`;
}

/**
 * Write an audit log entry (call this from any controller/service)
 * @param {{ actorId?: string, storeId?: string, action: string, module?: string, description?: string, ipAddress?: string, metadata?: object }} opts
 */
async function writeAuditLog({ actorId, storeId, action, module: mod, description, ipAddress, metadata } = {}) {
  try {
    const entity = normalizeAuditEntity({ module: mod, ...(metadata || {}) });
    await masterPrisma.masterAuditLog.create({
      data: {
        actorId: actorId || null,
        storeId: storeId || null,
        action,
        message: buildAuditSummary({ action, module: mod, description, metadata }),
        metadata: metadata
          ? { module: mod || null, ipAddress: ipAddress || null, ...entity, ...metadata }
          : { module: mod || null, ipAddress: ipAddress || null, ...entity },
      },
    });
  } catch {
    // never crash the main request because of audit logging
  }
}

async function getAuditLogs({ action, module: mod, from, to, page = 1, limit = 100, storeId, storeKey } = {}) {
  const where = {};

  // Critical: filter by store for non-super-admin users
  if (storeId) {
    where.storeId = storeId;
  } else if (storeKey && storeKey !== "ALL_STORES") {
    // Super admin filtering by a specific store
    where.store = { storeKey };
  }

  if (action && action !== "all") {
    where.action = { equals: action, mode: "insensitive" };
  }

  if (mod && mod !== "all") {
    where.metadata = { path: ["module"], equals: mod };
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    masterPrisma.masterAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
      include: {
        actor: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true, storeKey: true } },
      },
    }),
    masterPrisma.masterAuditLog.count({ where }),
  ]);

  return {
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      module: l.metadata?.module || null,
      description: l.message || null,
      performedBy: l.actor?.email || l.actor?.name || "System",
      actorId: l.actorId,
      storeId: l.storeId,
      storeName: l.store?.name || null,
      ipAddress: l.metadata?.ipAddress || null,
      entityType: l.metadata?.entityType || null,
      entityId: l.metadata?.entityId || null,
      entityName: l.metadata?.entityName || null,
      entityEmail: l.metadata?.entityEmail || null,
      metadata: l.metadata,
      createdAt: l.createdAt,
    })),
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)),
  };
}

module.exports = { writeAuditLog, getAuditLogs };
