const { masterPrisma } = require("./db");
const { normalizeDomain } = require("../utils/domain");

const localOrigins = new Set([
  "http://168.231.69.231:9006",
  "http://168.231.69.231:9007",
  "http://168.231.69.231:9008",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "http://127.0.0.1:5176",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://192.168.1.3:5173",
  "http://192.168.137.1:5173",
  "http://69.62.76.32:5001",
  "http://69.62.76.32:5003",
  "https://best-vet-care.vercel.app",
]);

let domainCache = { loadedAt: 0, domains: new Set() };
const CACHE_MS = 60_000;

async function loadAllowedDomains() {
  const now = Date.now();
  if (now - domainCache.loadedAt < CACHE_MS) return domainCache.domains;

  const rows = await masterPrisma.storeDomain.findMany({
    where: { isActive: true, store: { status: "ACTIVE" } },
    select: { domain: true },
  });
  domainCache = {
    loadedAt: now,
    domains: new Set(
      rows.map((row) => normalizeDomain(row.domain)).filter(Boolean),
    ),
  };
  return domainCache.domains;
}

function corsOptions() {
  return {
    credentials: true,
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "X-Store-Domain",
      "X-Store-Key",
      "Cache-Control",
      "Pragma",
    ],
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (localOrigins.has(origin)) return callback(null, true);

      loadAllowedDomains()
        .then((domains) => {
          const domain = normalizeDomain(origin);
          if (domain && domains.has(domain)) return callback(null, true);
          return callback(new Error("Origin is not allowed by CORS"));
        })
        .catch(() => callback(new Error("Origin is not allowed by CORS")));
    },
  };
}

module.exports = corsOptions;
