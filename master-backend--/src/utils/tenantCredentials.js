const crypto = require("crypto");

function slugToIdentifier(slug) {
  return String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function generateDatabaseName(slug) {
  return `store_${slugToIdentifier(slug)}`;
}

function generateRoleName(slug) {
  return `store_${slugToIdentifier(slug)}_app`;
}

function generateStorePassword() {
  return crypto.randomBytes(24).toString("base64url");
}

module.exports = {
  slugToIdentifier,
  generateDatabaseName,
  generateRoleName,
  generateStorePassword,
};
