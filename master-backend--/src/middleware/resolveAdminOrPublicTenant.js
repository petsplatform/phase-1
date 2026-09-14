const jwt = require("jsonwebtoken");
const resolveAdminTenant = require("./resolveAdminTenant");
const resolvePublicTenant = require("./resolvePublicTenant");
const ApiError = require("../utils/apiError");

function resolveAdminOrPublicTenant(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return resolvePublicTenant(req, res, next);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type === "customer") {
      return resolvePublicTenant(req, res, next);
    }

    req.user = payload;
    return resolveAdminTenant(req, res, next);
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

module.exports = resolveAdminOrPublicTenant;
