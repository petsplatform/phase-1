const ApiError = require("../utils/apiError");

const buckets = new Map();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_ACCOUNT_LIMIT = 5;
const DEFAULT_IP_LIMIT = 50;

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwarded || req.ip || req.socket.remoteAddress || "unknown-ip";
}

function getAccountKey(req) {
  const body = req.body || {};
  const account = body.email || body.phone || body.username;
  return account ? String(account).trim().toLowerCase() : null;
}

function pruneBucket(key, windowMs, now = Date.now()) {
  const timestamps = (buckets.get(key) || []).filter(
    (time) => now - time < windowMs,
  );
  if (timestamps.length) {
    buckets.set(key, timestamps);
    ``;
  } else {
    buckets.delete(key);
  }
  return timestamps;
}

function getRetryAfterSeconds(timestamps, windowMs, now = Date.now()) {
  if (!timestamps.length) return Math.ceil(windowMs / 1000);
  return Math.max(1, Math.ceil((windowMs - (now - timestamps[0])) / 1000));
}

function record(key, windowMs) {
  const timestamps = pruneBucket(key, windowMs);
  timestamps.push(Date.now());
  buckets.set(key, timestamps);
}

function assertWithinLimit(req, res, keys, options) {
  const now = Date.now();
  const blocked = [];

  for (const { key, limit } of keys) {
    const timestamps = pruneBucket(key, options.windowMs, now);
    if (timestamps.length >= limit) {
      blocked.push({
        retryAfter: getRetryAfterSeconds(timestamps, options.windowMs, now),
      });
    }
  }

  if (!blocked.length) return;

  const retryAfter = Math.max(...blocked.map((item) => item.retryAfter));
  res.set("Retry-After", String(retryAfter));
  throw new ApiError(429, options.message, { retryAfterSeconds: retryAfter });
}

function rateLimiter(options = {}) {
  const settings = {
    action: options.action || (options.isOtpRequest ? "otp-request" : "auth"),
    windowMs: options.windowMs || DEFAULT_WINDOW_MS,
    accountLimit:
      options.accountLimit ||
      (options.isOtpRequest ? 3 : DEFAULT_ACCOUNT_LIMIT),
    ipLimit: options.ipLimit || (options.isOtpRequest ? 30 : DEFAULT_IP_LIMIT),
    countSuccessfulRequests: Boolean(
      options.isOtpRequest || options.countSuccessfulRequests,
    ),
    message:
      options.message || "Too many attempts. Please wait before trying again.",
  };

  return async (req, res, next) => {
    try {
      const ip = getClientIp(req);
      const account = getAccountKey(req);
      const keys = [
        { key: `${settings.action}:ip:${ip}`, limit: settings.ipLimit },
        ...(account
          ? [
              {
                key: `${settings.action}:account:${account}`,
                limit: settings.accountLimit,
              },
            ]
          : []),
      ];

      assertWithinLimit(req, res, keys, settings);

      const originalJson = res.json;
      res.json = function patchedJson(body) {
        const statusCode = res.statusCode;
        const isSuccess = statusCode < 400 && (!body || body.success !== false);
        const shouldCountFailure = [400, 401, 403].includes(statusCode);
        const shouldRecord = settings.countSuccessfulRequests
          ? isSuccess
          : shouldCountFailure; 

        if (shouldRecord) {
          keys.forEach(({ key }) => record(key, settings.windowMs));
        }

        return originalJson.apply(this, arguments);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = rateLimiter;
