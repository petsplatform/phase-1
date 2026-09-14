const ApiError = require("../utils/apiError");

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.storeRole || req.user?.role;
    if (!allowedRoles.includes(role)) {
      return next(new ApiError(403, "You do not have permission to access this resource"));
    }
    return next();
  };
}

module.exports = authorizeRole;
