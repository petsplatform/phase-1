// In-memory TTL cache for expensive, read-heavy aggregate queries (e.g. dashboard KPIs).
// No Redis in this stack; per-process cache is acceptable since each cached value is
// cheap to recompute and short-lived.
const store = new Map();

async function getOrCompute(key, ttlMs, compute) {
  const cached = store.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const value = await compute();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

module.exports = { getOrCompute };
