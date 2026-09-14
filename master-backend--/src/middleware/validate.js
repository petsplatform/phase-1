const ApiError = require("../utils/apiError");

const formatPath = (path = []) =>
  path
    .filter((part) => part !== "body" && part !== "params" && part !== "query")
    .map((part) => (typeof part === "number" ? `[${part + 1}]` : part))
    .join(".");

const formatIssueMessage = (issue) => {
  const path = formatPath(issue.path);
  return path ? `${path}: ${issue.message}` : issue.message;
};

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    const message = result.error.issues.map(formatIssueMessage).join(", ");
    return next(new ApiError(400, message || "Invalid request payload"));
  }

  req.validated = result.data;
  return next();
};

module.exports = validate;
