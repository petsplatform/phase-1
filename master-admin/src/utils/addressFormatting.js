const ADDRESS_FIELD_ORDER = [
  "name",
  "phone",
  "address",
  "streetAddress",
  "street",
  "line1",
  "line2",
  "city",
  "state",
  "postalCode",
  "zip",
  "country",
];

const IGNORED_ADDRESS_KEYS = new Set(["id", "index", "isDefault", "default"]);

const toCleanString = (value) => String(value ?? "").trim();

const parseAddressValue = (address) => {
  if (!address) return null;
  if (typeof address === "object") return address;
  if (typeof address !== "string") return address;

  const trimmed = address.trim();
  if (!trimmed) return "";

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
};

export function formatAddress(address) {
  const parsed = parseAddressValue(address);

  if (!parsed) return "";
  if (typeof parsed !== "object") return toCleanString(parsed);

  const orderedParts = ADDRESS_FIELD_ORDER
    .map((key) => toCleanString(parsed[key]))
    .filter(Boolean);

  const fallbackParts = Object.entries(parsed)
    .filter(([key]) => !IGNORED_ADDRESS_KEYS.has(key) && !ADDRESS_FIELD_ORDER.includes(key))
    .map(([, value]) => toCleanString(value))
    .filter(Boolean);

  return [...orderedParts, ...fallbackParts].join(", ");
}
