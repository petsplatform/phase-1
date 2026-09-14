const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const { getCurrentStore } = require("../config/tenantContext");
const ApiError = require("../utils/apiError");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication token is required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type === "customer") {
      return next(new ApiError(403, "Admin access required"));
    }
    req.user = payload;
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

async function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Customer authentication token is required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "customer") {
      throw new ApiError(401, "Invalid customer token");
    }

    const currentStore = getCurrentStore();
    if (currentStore && payload.storeId && payload.storeId !== currentStore.id) {
      throw new ApiError(403, "Customer token does not belong to this store");
    }

    const customer = await prisma.customer.findUnique({ where: { id: payload.id } });

    if (!customer) {
      throw new ApiError(401, "Customer account not found");
    }

    if (customer.status !== "Active") {
      const reason = customer.blockedReason || "Your account has been blocked. Please contact support.";
      const err = new ApiError(403, reason);
      err.blockedReason = reason;
      err.isBlocked = true;
      throw err;
    }

    req.customer = customer;
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, "Invalid or expired customer token"));
  }
}

module.exports = { requireAuth, requireCustomerAuth };
