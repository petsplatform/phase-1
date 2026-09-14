const { prisma: defaultPrisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { sendEmail, getEmailBrand } = require("./emailService");
const { generateId } = require("../utils/ids");

function getDb(db) {
  return db || defaultPrisma;
}

async function listCustomers({ q, status }, db) {
  const client = getDb(db);
  const customers = await client.customer.findMany({
    where: {
      status: status && status !== "All" ? status : undefined,
      OR: q
        ? [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ]
        : undefined,
    },
    include: { orders: true },
    orderBy: { joined: "desc" },
  });

  return customers.map(withCustomerTotals);
}

async function getCustomer(id, db) {
  const client = getDb(db);
  const customer = await client.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { orderDate: "desc" } } },
  });

  if (!customer) throw new ApiError(404, "Customer not found");
  return withCustomerTotals(customer);
}

async function createCustomer(payload, db) {
  const client = getDb(db);
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = String(payload.phone || "").trim();
  if (!name) throw new ApiError(400, "Customer name is required");
  if (!email) throw new ApiError(400, "Customer email is required");
  if (!phone) throw new ApiError(400, "Customer phone is required");

  const existing = await client.customer.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "Customer with this email already exists");

  const customer = await client.customer.create({
    data: {
      id: generateId("customer"),
      name,
      email,
      phone,
      whatsappNumber: String(payload.whatsappNumber || phone).trim() || null,
      city: String(payload.city || "").trim() || null,
      status: "Active",
      consentStatus: "opted_in",
    },
    include: { orders: true },
  });
  return withCustomerTotals(customer);
}

function withCustomerTotals(customer) {
  const totalOrders = customer.orders.length;
  const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
  return { ...customer, totalOrders, totalSpent };
}

async function updateCustomer(id, payload, db) {
  const client = getDb(db);
  const customer = await client.customer.findUnique({ where: { id } });
  if (!customer) throw new ApiError(404, "Customer not found");
  const data = {};
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.phone !== undefined) data.phone = payload.phone || null;
  if (payload.email !== undefined) data.email = payload.email;
  return client.customer.update({ where: { id }, data });
}

async function updateCustomerStatus(id, status, db) {
  const client = getDb(db);
  const customer = await client.customer.findUnique({ where: { id } });
  if (!customer) throw new ApiError(404, "Customer not found");
  return client.customer.update({ where: { id }, data: { status } });
}

async function blockCustomer(id, reason, db, store) {
  const client = getDb(db);
  const customer = await client.customer.findUnique({ where: { id } });
  if (!customer) throw new ApiError(404, "Customer not found");
  const updated = await client.customer.update({
    where: { id },
    data: { status: "Inactive", blockedReason: reason || "Your account has been blocked. Please contact support." },
  });
  if (customer.email) {
    const brand = getEmailBrand(store);
    sendEmail({
      to: customer.email,
      brand,
      subject: `Your ${brand.name} account has been blocked`,
      text: `Hi ${customer.name},\n\nYour account has been blocked.\nReason: ${updated.blockedReason}\n\nPlease contact our support team for assistance.\n\n${brand.name}`,
      html: `<p>Hi <strong>${customer.name}</strong>,</p><p>Your account has been <strong>blocked</strong>.</p><p><strong>Reason:</strong> ${updated.blockedReason}</p><p>Please contact our support team for assistance.</p><p>${brand.name}</p>`,
    }).catch(() => {});
  }
  return updated;
}

async function unblockCustomer(id, db, store) {
  const client = getDb(db);
  const customer = await client.customer.findUnique({ where: { id } });
  if (!customer) throw new ApiError(404, "Customer not found");
  const updated = await client.customer.update({
    where: { id },
    data: { status: "Active", blockedReason: null },
  });
  if (customer.email) {
    const brand = getEmailBrand(store);
    sendEmail({
      to: customer.email,
      brand,
      subject: `Your ${brand.name} account has been unblocked`,
      text: `Hi ${customer.name},\n\nGreat news! Your account has been unblocked. You can now log in and continue shopping.\n\n${brand.name}`,
      html: `<p>Hi <strong>${customer.name}</strong>,</p><p>Great news! Your account has been <strong>unblocked</strong>. You can now log in and continue shopping.</p><p>${brand.name}</p>`,
    }).catch(() => {});
  }
  return updated;
}

async function deleteCustomer(id, db) {
  const client = getDb(db);
  const customer = await client.customer.findUnique({ where: { id } });
  if (!customer) throw new ApiError(404, "Customer not found");
  await client.customer.delete({ where: { id } });
  return customer;
}

module.exports = { blockCustomer, createCustomer, deleteCustomer, getCustomer, listCustomers, unblockCustomer, updateCustomer, updateCustomerStatus };
