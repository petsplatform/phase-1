// Centralized environment validation
const MIN_JWT_SECRET_LENGTH = 32;
const JWT_SECRET = String(process.env.JWT_SECRET || "").trim();

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not defined.");
  process.exit(1);
}

if (JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
  console.error(
    `FATAL ERROR: JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`,
  );
  process.exit(1);
}

module.exports = {
  JWT_SECRET,
};
