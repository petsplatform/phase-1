const { prisma } = require("../config/db");

const DEFAULT_SETTINGS = {
  storeName: "Store",
  supportEmail: "support@example.com",
  supportPhone: null,
  currency: "USD",
  timezone: "UTC",
  rewardsEnabled: true,
  rewardSignupPoints: 40,
  rewardPointsPerCurrencyUnit: 1,
  rewardPointValue: 0.25,
  rewardMaxRedeemPercent: 20,
  rewardMinRedeemPoints: 1,
  abandonedCartEmailEnabled: false,
  abandonedCartDelayHours: 24,
  abandonedCartDiscountPercent: 10,
  abandonedCartMinimumAmount: 25,
  abandonedCartMaxEmails: 2,
  mobileAppEnabled: false,
  appStoreUrl: null,
  playStoreUrl: null,
};

function cleanSettingsPayload(payload = {}, existing = null) {
  const data = {};

  if (payload.clearSmtpCredentials) {
    return {
      smtpEmail: null,
      smtpPass: null,
      smtpHost: null,
      smtpPort: null,
    };
  }

  ["storeName", "supportEmail", "supportPhone", "currency", "timezone", "appStoreUrl", "playStoreUrl", "smtpEmail", "smtpHost"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      const value = payload[field];
      data[field] = typeof value === "string" ? value.trim() || null : value;
    }
  });

  if (Object.prototype.hasOwnProperty.call(payload, "rewardsEnabled")) {
    data.rewardsEnabled = Boolean(payload.rewardsEnabled);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "abandonedCartEmailEnabled")) {
    data.abandonedCartEmailEnabled = Boolean(payload.abandonedCartEmailEnabled);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "mobileAppEnabled")) {
    data.mobileAppEnabled = Boolean(payload.mobileAppEnabled);
  }

  ["rewardSignupPoints", "rewardMinRedeemPoints", "abandonedCartMaxEmails"].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      data[field] = Math.max(0, Math.floor(Number(payload[field]) || 0));
    }
  });

  [
    "rewardPointsPerCurrencyUnit",
    "rewardPointValue",
    "rewardMaxRedeemPercent",
    "abandonedCartDelayHours",
    "abandonedCartDiscountPercent",
    "abandonedCartMinimumAmount",
  ].forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      data[field] = Math.max(0, Number(payload[field]) || 0);
    }
  });

  if (Object.prototype.hasOwnProperty.call(payload, "smtpPort")) {
    data.smtpPort = payload.smtpPort === null ? null : Number(payload.smtpPort);
  }

  if (payload.smtpPass && String(payload.smtpPass).trim()) {
    data.smtpPass = String(payload.smtpPass).trim();
  } else if (existing?.smtpPass) {
    data.smtpPass = existing.smtpPass;
  }

  return data;
}

function serializeSettings(settings, { includeSmtp = false } = {}) {
  if (!settings) return null;
  const { smtpPass, ...publicSettings } = settings;
  if (!includeSmtp) {
    delete publicSettings.smtpEmail;
    delete publicSettings.smtpHost;
    delete publicSettings.smtpPort;
  }

  return {
    ...publicSettings,
    ...(includeSmtp ? { hasSmtpPass: Boolean(smtpPass) } : {}),
  };
}

async function ensureFeatureSettingsColumns(db = prisma) {
  if (typeof db.$executeRawUnsafe !== "function") return;
  try {
    await db.$executeRawUnsafe(`
      ALTER TABLE "StoreSettings"
        ADD COLUMN IF NOT EXISTS "abandonedCartEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "abandonedCartDelayHours" DOUBLE PRECISION NOT NULL DEFAULT 24,
        ADD COLUMN IF NOT EXISTS "abandonedCartDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
        ADD COLUMN IF NOT EXISTS "abandonedCartMinimumAmount" DOUBLE PRECISION NOT NULL DEFAULT 25,
        ADD COLUMN IF NOT EXISTS "abandonedCartMaxEmails" INTEGER NOT NULL DEFAULT 2,
        ADD COLUMN IF NOT EXISTS "mobileAppEnabled" BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "appStoreUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "playStoreUrl" TEXT
    `);
  } catch (error) {
    if (error?.code !== "P2021") throw error;
  }
}

const getSettings = async (options, db = prisma) => {
  await ensureFeatureSettingsColumns(db);
  const settings = await db.storeSettings.findUnique({ where: { id: "default" } });
  return serializeSettings(settings, options);
};

const getRawSettings = async (db = prisma) => {
  await ensureFeatureSettingsColumns(db);
  return db.storeSettings.findUnique({ where: { id: "default" } });
};

const updateSettings = async (payload, db = prisma) => {
  await ensureFeatureSettingsColumns(db);
  const existing = await getRawSettings(db);
  const data = cleanSettingsPayload(payload, existing);
  const createData = {
    id: "default",
    ...DEFAULT_SETTINGS,
    ...data,
  };

  const settings = await db.storeSettings.upsert({
    where: { id: "default" },
    create: createData,
    update: data,
  });

  return serializeSettings(settings, { includeSmtp: true });
};

const clearSmtpSettings = async (db = prisma) => {
  await ensureFeatureSettingsColumns(db);
  const settings = await db.storeSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      ...DEFAULT_SETTINGS,
      smtpEmail: null,
      smtpPass: null,
      smtpHost: null,
      smtpPort: null,
    },
    update: {
      smtpEmail: null,
      smtpPass: null,
      smtpHost: null,
      smtpPort: null,
    },
  });

  return serializeSettings(settings, { includeSmtp: true });
};

module.exports = { clearSmtpSettings, getRawSettings, getSettings, updateSettings };
