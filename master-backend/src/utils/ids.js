const PREFIXES = {
  product: "PRD",
  category: "CAT",
  order: "ORD",
  customer: "CUS",
  banner: "BAN",
  coupon: "CPN",
  inquiry: "INQ",
  support: "SUP",
};

function generateId(type) {
  const prefix = PREFIXES[type] || "REC";
  return `${prefix}-${Date.now()}`;
}

module.exports = { generateId };
