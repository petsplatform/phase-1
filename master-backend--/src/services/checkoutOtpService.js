const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");
const { publicCustomer, signCustomerToken } = require("./customerPanelService");
const { sendOtpEmail } = require("./emailService");

const OTP_PURPOSE = "checkout-otp";
const LOGIN_OTP_PURPOSE = "customer-login-otp";
const OTP_EXPIRES_IN = "10m";
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || "").trim();
}

function normalizeName(name, email) {
  const value = String(name || "").trim();
  if (value) return value;
  const localPart = normalizeEmail(email).split("@")[0] || "Customer";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Customer";
}

function makeOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const otpSessions = new Map();

// Generate a random opaque session ID
function generateOpaqueSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

// Clean up expired sessions periodically (every minute)
const otpCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(id);
    }
  }
}, 60 * 1000);
otpCleanupInterval.unref?.();

async function requestOtp({ name, email, phone, purpose = OTP_PURPOSE }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const normalizedName = normalizeName(name, normalizedEmail);
  const code = makeOtpCode();
  const codeHash = await bcrypt.hash(code, 10);

  const otpSessionId = generateOpaqueSessionId();
  const expiresAt = Date.now() + OTP_TTL_MS;

  otpSessions.set(otpSessionId, {
    purpose,
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    codeHash,
    expiresAt,
    attempts: 0,
  });

  const delivery = await sendOtpEmail({ email: normalizedEmail, code });
  if (!delivery?.delivered) {
    otpSessions.delete(otpSessionId);
    throw new ApiError(502, "Could not send OTP email. Please try again.");
  }

  return {
    otpToken: otpSessionId,
    expiresInMinutes: 10,
  };
}

async function verifyOtp({ otpToken, code, purpose = OTP_PURPOSE }) {
  const session = otpSessions.get(otpToken);
  if (!session) {
    throw new ApiError(400, "Code expired, please request a new one");
  }

  if (Date.now() > session.expiresAt) {
    otpSessions.delete(otpToken);
    throw new ApiError(400, "Code expired, please request a new one");
  }

  if (session.purpose !== purpose) {
    throw new ApiError(400, "Invalid OTP request");
  }

  const matches = await bcrypt.compare(String(code || "").trim(), session.codeHash);
  if (!matches) {
    session.attempts = (Number(session.attempts) || 0) + 1;
    if (session.attempts >= OTP_MAX_ATTEMPTS) {
      otpSessions.delete(otpToken);
      throw new ApiError(400, "Too many incorrect codes. Please request a new code.");
    }
    throw new ApiError(400, "Incorrect code");
  }

  // Remove the OTP session after successful verification
  otpSessions.delete(otpToken);

  const normalizedEmail = normalizeEmail(session.email);
  const normalizedPhone = normalizePhone(session.phone);
  const include = { _count: { select: { orders: true } } };

  let customer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
    include,
  });

  if (!customer && normalizedPhone) {
    customer = await prisma.customer.findFirst({
      where: { phone: normalizedPhone },
      include,
    });
  }

  if (customer) {
    if (customer.status !== "Active") {
      const reason = customer.blockedReason || "Your account has been blocked. Please contact support.";
      const err = new ApiError(403, reason);
      err.blockedReason = reason;
      err.isBlocked = true;
      throw err;
    }
  } else if (purpose === LOGIN_OTP_PURPOSE) {
    throw new ApiError(404, "No account found for this email. Please register before logging in.");
  } else {
    customer = await prisma.customer.create({
      data: {
        id: generateId("customer"),
        name: normalizeName(session.name, normalizedEmail),
        email: normalizedEmail,
        phone: normalizedPhone || null,
        passwordHash: null,
        addresses: [],
      },
      include,
    });
  }

  return { token: signCustomerToken(customer), customer: publicCustomer(customer) };
}

async function requestLoginOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const customer = await prisma.customer.findUnique({
    where: { email: normalizedEmail },
    select: { status: true, blockedReason: true },
  });
  if (!customer) {
    throw new ApiError(404, "No account found for this email. Please register before logging in.");
  }
  if (customer && customer.status !== "Active") {
    const reason = customer.blockedReason || "Your account has been blocked. Please contact support.";
    const err = new ApiError(403, reason);
    err.isBlocked = true;
    err.blockedReason = reason;
    throw err;
  }
  return requestOtp({ email: normalizedEmail, purpose: LOGIN_OTP_PURPOSE });
}

function verifyLoginOtp({ otpToken, code }) {
  return verifyOtp({ otpToken, code, purpose: LOGIN_OTP_PURPOSE });
}

module.exports = {
  LOGIN_OTP_PURPOSE,
  OTP_PURPOSE,
  requestLoginOtp,
  requestOtp,
  verifyLoginOtp,
  verifyOtp,
  otpSessions,
};
