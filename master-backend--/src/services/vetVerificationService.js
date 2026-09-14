const { prisma: defaultPrisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { sendEmail, getEmailBrand } = require("./emailService");
const { createNotification } = require("./notificationService");

function getDb(db) {
  return db || defaultPrisma;
}

function serializeApplication(application) {
  if (!application) return null;
  return {
    ...application,
    customer: application.user || undefined,
    user: undefined,
  };
}

function normalizePayload(payload, customer) {
  return {
    fullName: payload.fullName.trim(),
    clinicName: payload.clinicName.trim(),
    licenseNumber: payload.licenseNumber.trim(),
    licenseState: payload.licenseState.trim(),
    licenseExpiry: payload.licenseExpiry,
    phone: payload.phone.trim(),
    email: payload.email.trim().toLowerCase(),
    documentUrl: payload.documentUrl,
    userId: customer.id,
  };
}

async function getMine(customer, db) {
  const client = getDb(db);
  return serializeApplication(await client.vetVerification.findUnique({
    where: { userId: customer.id },
  }));
}

async function submit(customer, payload, meta = {}, db) {
  const client = getDb(db);
  const existing = await client.vetVerification.findUnique({
    where: { userId: customer.id },
  });

  if (existing?.status === "Pending") {
    throw new ApiError(409, "You already have a pending vet verification application.");
  }
  if (existing?.status === "Approved") {
    throw new ApiError(409, "Your vet verification is already approved.");
  }

  const duplicateLicense = await client.vetVerification.findFirst({
    where: {
      licenseNumber: payload.licenseNumber.trim(),
      NOT: { userId: customer.id },
    },
  });
  if (duplicateLicense) throw new ApiError(409, "License number is already registered.");

  const data = normalizePayload(payload, customer);
  const application = await client.$transaction(async (tx) => {
    const saved = existing
      ? await tx.vetVerification.update({
          where: { userId: customer.id },
          data: { ...data, status: "Pending", remarks: null, verifiedBy: null, verifiedAt: null },
        })
      : await tx.vetVerification.create({ data });

    await tx.customer.update({
      where: { id: customer.id },
      data: { isVetVerified: false, vetVerifiedAt: null },
    });
    await createNotification({
      recipient: "admin",
      title: "New Vet Verification Request",
      message: `${data.fullName} submitted a veterinarian verification request.`,
      type: "vet_verification_submitted",
      userId: customer.id,
    }, tx);
    return saved;
  });

  deliverVetEmail({
    to: data.email,
    subject: "Vet Verification Request Received",
    text: `Hi ${data.fullName},\n\nWe received your vet verification request and our admin team will review it soon.\n\n${getEmailBrand(meta.store).name}`,
  }, meta.store);

  return serializeApplication(application);
}

async function list({ status, q, page = 1, limit = 20 } = {}, db) {
  const client = getDb(db);
  const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
  const where = {
    status: status && status !== "All" ? status : undefined,
    OR: q
      ? [
          { fullName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { licenseNumber: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
        ]
      : undefined,
  };
  const [items, total] = await Promise.all([
    client.vetVerification.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    client.vetVerification.count({ where }),
  ]);
  return {
    items: items.map(serializeApplication),
    total,
    page: Math.max(Number(page) || 1, 1),
    limit: take,
    totalPages: Math.max(Math.ceil(total / take), 1),
  };
}

async function getById(id, db) {
  const client = getDb(db);
  const application = await client.vetVerification.findUnique({
    where: { id },
    include: { user: { include: { orders: { orderBy: { orderDate: "desc" } } } } },
  });
  if (!application) throw new ApiError(404, "Vet verification application not found");
  return serializeApplication(application);
}

async function approve(id, admin, meta = {}, db) {
  const client = getDb(db);
  const adminId = admin?.userId || admin?.id || null;
  const application = await client.$transaction(async (tx) => {
    const current = await tx.vetVerification.findUnique({ where: { id }, include: { user: true } });
    if (!current) throw new ApiError(404, "Vet verification application not found");
    if (current.licenseExpiry < new Date()) throw new ApiError(400, "Expired licenses cannot be approved");
    const verifiedAt = new Date();
    const updated = await tx.vetVerification.update({
      where: { id },
      data: { status: "Approved", remarks: null, verifiedBy: adminId, verifiedAt },
      include: { user: true },
    });
    await tx.customer.update({
      where: { id: current.userId },
      data: { isVetVerified: true, vetVerifiedAt: verifiedAt },
    });
    await createNotification({
      recipient: "customer",
      userId: current.userId,
      title: "Application Approved",
      message: "Your vet verification application has been approved.",
      type: "vet_verification_approved",
    }, tx);
    return updated;
  });

  deliverVetEmail({
    to: application.email,
    subject: "Vet Verification Approved",
    text: `Hi ${application.fullName},\n\nYour vet verification has been approved.\n\n${getEmailBrand(meta.store).name}`,
  }, meta.store);
  return serializeApplication(application);
}

async function reject(id, remarks, admin, meta = {}, db) {
  const client = getDb(db);
  const adminId = admin?.userId || admin?.id || null;
  const application = await client.$transaction(async (tx) => {
    const current = await tx.vetVerification.findUnique({ where: { id }, include: { user: true } });
    if (!current) throw new ApiError(404, "Vet verification application not found");
    const updated = await tx.vetVerification.update({
      where: { id },
      data: { status: "Rejected", remarks, verifiedBy: adminId, verifiedAt: null },
      include: { user: true },
    });
    await tx.customer.update({
      where: { id: current.userId },
      data: { isVetVerified: false, vetVerifiedAt: null },
    });
    await createNotification({
      recipient: "customer",
      userId: current.userId,
      title: "Application Rejected",
      message: remarks,
      type: "vet_verification_rejected",
    }, tx);
    return updated;
  });

  deliverVetEmail({
    to: application.email,
    subject: "Vet Verification Rejected",
    text: `Hi ${application.fullName},\n\nYour vet verification was rejected.\nReason: ${remarks}\n\n${getEmailBrand(meta.store).name}`,
  }, meta.store);
  return serializeApplication(application);
}

async function expireLicenses(db, meta = {}) {
  const client = getDb(db);
  const expired = await client.vetVerification.findMany({
    where: { status: "Approved", licenseExpiry: { lt: new Date() } },
    include: { user: true },
  });

  for (const application of expired) {
    await client.$transaction(async (tx) => {
      await tx.vetVerification.update({
        where: { id: application.id },
        data: { status: "Expired" },
      });
      await tx.customer.update({
        where: { id: application.userId },
        data: { isVetVerified: false, vetVerifiedAt: null },
      });
      await createNotification({
        recipient: "customer",
        userId: application.userId,
        title: "Vet Verification Expired",
        message: "Your veterinary license verification has expired.",
        type: "vet_verification_expired",
      }, tx);
    });
    deliverVetEmail({
      to: application.email,
      subject: "Vet Verification Expired",
      text: `Hi ${application.fullName},\n\nYour vet verification has expired. Please reapply with a current license.\n\n${getEmailBrand(meta.store).name}`,
    }, meta.store);
  }

  return { expiredCount: expired.length };
}

function deliverVetEmail(message, store) {
  const brand = getEmailBrand(store);
  sendEmail({
    ...message,
    brand,
    html: `<p>${String(message.text).replace(/\n/g, "<br />")}</p>`,
  }).catch((error) => {
    console.error("Vet verification email failed", { to: message.to, subject: message.subject, message: error.message });
  });
}

module.exports = {
  approve,
  expireLicenses,
  getById,
  getMine,
  list,
  reject,
  submit,
};
