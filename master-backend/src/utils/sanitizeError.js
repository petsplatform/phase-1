function sanitizeProvisioningError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "postgresql://[redacted]")
    .replace(/password[=:]\s*\S+/gi, "password=[redacted]")
    .slice(0, 500);
}

module.exports = { sanitizeProvisioningError };
