function normalizeDomain(input) {
  if (!input || typeof input !== "string") return null;
  let value = input.trim().toLowerCase();
  if (!value) return null;

  try {
    value = new URL(value).hostname;
  } catch (error) {
    value = value.split("/")[0];
  }

  value = value.split(":")[0].replace(/^www\./, "");
  return value || null;
}

module.exports = { normalizeDomain };
