const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey() {
  const rawKey = process.env.TENANT_DATABASE_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("TENANT_DATABASE_ENCRYPTION_KEY is required");
  }
  if (/^[a-f0-9]{64}$/i.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }
  return crypto.createHash("sha256").update(rawKey).digest();
}

function encryptSecret(value) {
  if (!value) return value;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

function decryptSecret(value) {
  if (!value) return value;
  const [iv, tag, encrypted] = String(value).split(":");
  if (!iv || !tag || !encrypted) {
    throw new Error("Invalid encrypted tenant secret format");
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

module.exports = { decryptSecret, encryptSecret };
