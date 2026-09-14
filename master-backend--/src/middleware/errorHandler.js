function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

const uniqueFieldLabels = {
  code: "Coupon code",
  email: "Email",
  name: "Name",
  licenseNumber: "License number",
  trackingNumber: "Tracking number",
  sku: "Product SKU",
};

function getPrismaErrorResponse(err) {
  if (err.code === "P2002") {
    const target = Array.isArray(err.meta?.target)
      ? err.meta.target[0]
      : err.meta?.target;
    const label = uniqueFieldLabels[target] || target || "This value";

    return {
      status: 409,
      message: `${label} already exists. Please use a different ${label.toLowerCase()}.`,
    };
  }

  if (err.code === "P2025") {
    return {
      status: 404,
      message: "Requested record was not found.",
    };
  }

  if (err.code === "P2021") {
    return {
      status: 503,
      message: "Tenant database is missing required tables. Run tenant migrations and try again.",
    };
  }

  if (err.code === "P2022") {
    return {
      status: 503,
      message: "Database schema is out of date. Run migrations and try again.",
    };
  }

  return null;
}

function errorHandler(err, req, res, next) {
  console.error("[Global Error]:", err);
  const prismaError = getPrismaErrorResponse(err);
  let status = prismaError?.status || err.statusCode || err.status || 500;
  
  let message = prismaError?.message || err.message || "Something went wrong";
  if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "Image file size must be 5 MB or smaller";
  }
  if (status >= 500) {
    message = "Something went wrong";
  }

  const body = { success: false, message };
  if (Number.isFinite(err.retryAfterSeconds)) {
    body.retryAfterSeconds = Math.max(0, Math.ceil(err.retryAfterSeconds));
  }
  if (err.isBlocked) {
    body.isBlocked = true;
    body.blockedReason = err.blockedReason || message;
  }

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
