const ApiError = require("../utils/apiError");

function superAdminReadOnly(req, res, next) {
  if (req.user?.role === "SUPER_ADMIN" && req.method !== "GET" && req.method !== "HEAD") {
    return next(new ApiError(403, "Permission denied"));
  }
  return next();
}

module.exports = superAdminReadOnly;
