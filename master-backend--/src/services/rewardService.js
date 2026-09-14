const { prisma } = require("../config/db");
const { generateId } = require("../utils/ids");

const DEFAULT_REWARD_SETTINGS = {
  rewardsEnabled: true,
  rewardSignupPoints: 40,
  rewardPointsPerCurrencyUnit: 1,
  rewardPointValue: 0.25,
  rewardMaxRedeemPercent: 20,
  rewardMinRedeemPoints: 1,
};

function normalizeRewardSettings(settings = {}) {
  return {
    rewardsEnabled: settings.rewardsEnabled !== false,
    rewardSignupPoints: Math.max(0, Math.floor(Number(settings.rewardSignupPoints ?? DEFAULT_REWARD_SETTINGS.rewardSignupPoints) || 0)),
    rewardPointsPerCurrencyUnit: Math.max(0, Number(settings.rewardPointsPerCurrencyUnit ?? DEFAULT_REWARD_SETTINGS.rewardPointsPerCurrencyUnit) || 0),
    rewardPointValue: Math.max(0, Number(settings.rewardPointValue ?? DEFAULT_REWARD_SETTINGS.rewardPointValue) || 0),
    rewardMaxRedeemPercent: Math.min(100, Math.max(0, Number(settings.rewardMaxRedeemPercent ?? DEFAULT_REWARD_SETTINGS.rewardMaxRedeemPercent) || 0)),
    rewardMinRedeemPoints: Math.max(1, Math.floor(Number(settings.rewardMinRedeemPoints ?? DEFAULT_REWARD_SETTINGS.rewardMinRedeemPoints) || 1)),
  };
}

async function getRewardSettings(db = prisma) {
  if (!db?.storeSettings?.findUnique) {
    return normalizeRewardSettings({});
  }
  const settings = await db.storeSettings.findUnique({ where: { id: "default" } }).catch(() => null);
  return normalizeRewardSettings(settings || {});
}

async function getCustomerBalance(customerId, db = prisma) {
  const rows = await db.$queryRawUnsafe(
    'SELECT "rewardPoints" FROM "Customer" WHERE id = $1',
    customerId,
  );
  return Math.max(0, Number(rows[0]?.rewardPoints || 0));
}

async function getRewardOverview(customerId, db = prisma) {
  const [settings, balance, transactions] = await Promise.all([
    getRewardSettings(db),
    getCustomerBalance(customerId, db),
    db.$queryRawUnsafe(
      'SELECT id, type, points, "balanceAfter", "orderId", description, metadata, "createdAt" FROM "RewardTransaction" WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT 50',
      customerId,
    ),
  ]);

  return {
    settings,
    balance,
    value: toMoney(balance * settings.rewardPointValue),
    transactions,
  };
}

function calculateEarnPoints(amount, settings) {
  if (!settings.rewardsEnabled) return 0;
  return Math.max(0, Math.floor(toMoney(amount) * settings.rewardPointsPerCurrencyUnit));
}

function calculateRedemption({ requestedPoints = 0, balance = 0, eligibleAmount = 0, settings }) {
  if (!settings.rewardsEnabled || settings.rewardPointValue <= 0) {
    return { requestedPoints: 0, points: 0, amount: 0, maxPoints: 0, maxAmount: 0 };
  }

  const safeBalance = Math.max(0, Math.floor(Number(balance) || 0));
  const cappedAmount = toMoney(Math.max(0, eligibleAmount) * (settings.rewardMaxRedeemPercent / 100));
  const maxByAmount = Math.floor(cappedAmount / settings.rewardPointValue);
  const maxPoints = Math.max(0, Math.min(safeBalance, maxByAmount));
  const requested = Math.max(0, Math.floor(Number(requestedPoints) || 0));
  let points = Math.min(requested, maxPoints);

  if (points > 0 && points < settings.rewardMinRedeemPoints) points = 0;

  return {
    requestedPoints: requested,
    points,
    amount: toMoney(points * settings.rewardPointValue),
    maxPoints,
    maxAmount: toMoney(maxPoints * settings.rewardPointValue),
  };
}

async function grantSignupReward(customerId, db = prisma) {
  const settings = await getRewardSettings(db);
  if (!settings.rewardsEnabled || settings.rewardSignupPoints <= 0) return null;

  const rows = await db.$queryRawUnsafe(
    'SELECT "rewardSignupGranted" FROM "Customer" WHERE id = $1',
    customerId,
  );
  if (rows[0]?.rewardSignupGranted) return null;

  return addPoints({
    customerId,
    points: settings.rewardSignupPoints,
    type: "signup",
    description: "Signup reward points",
  }, db, { markSignupGranted: true });
}

async function addPoints({ customerId, points, type, orderId, description, metadata }, db = prisma, options = {}) {
  const safePoints = Math.max(0, Math.floor(Number(points) || 0));
  if (!safePoints) return null;
  if (!db?.$queryRawUnsafe || !db?.$executeRawUnsafe) return null;
  const rows = await db.$queryRawUnsafe(
    `UPDATE "Customer"
       SET "rewardPoints" = "rewardPoints" + $1,
           "rewardSignupGranted" = CASE WHEN $3::boolean THEN true ELSE "rewardSignupGranted" END,
           "updatedAt" = NOW()
     WHERE id = $2
     RETURNING "rewardPoints"`,
    safePoints,
    customerId,
    Boolean(options.markSignupGranted),
  );
  const balanceAfter = Math.max(0, Number(rows[0]?.rewardPoints || 0));
  await createTransaction({ customerId, type, points: safePoints, balanceAfter, orderId, description, metadata }, db);
  return { points: safePoints, balanceAfter };
}

async function redeemPoints({ customerId, points, orderId, amount }, db = prisma) {
  const safePoints = Math.max(0, Math.floor(Number(points) || 0));
  if (!safePoints) return null;
  if (!db?.$queryRawUnsafe || !db?.$executeRawUnsafe) return null;
  const rows = await db.$queryRawUnsafe(
    `UPDATE "Customer"
       SET "rewardPoints" = "rewardPoints" - $1,
           "updatedAt" = NOW()
     WHERE id = $2 AND "rewardPoints" >= $1
     RETURNING "rewardPoints"`,
    safePoints,
    customerId,
  );
  if (!rows.length) throw new Error("Reward balance changed. Please refresh checkout and try again.");
  const balanceAfter = Math.max(0, Number(rows[0].rewardPoints || 0));
  await createTransaction({
    customerId,
    type: "redeem",
    points: -safePoints,
    balanceAfter,
    orderId,
    description: `Redeemed ${safePoints} reward points`,
    metadata: { amount },
  }, db);
  return { points: safePoints, balanceAfter };
}

async function createTransaction({ customerId, type, points, balanceAfter, orderId, description, metadata }, db = prisma) {
  await db.$executeRawUnsafe(
    `INSERT INTO "RewardTransaction" ("id", "customerId", type, points, "balanceAfter", "orderId", description, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    generateId("reward"),
    customerId,
    type,
    points,
    balanceAfter,
    orderId || null,
    description || null,
    JSON.stringify(metadata || {}),
  );
}

function toMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

module.exports = {
  DEFAULT_REWARD_SETTINGS,
  addPoints,
  calculateEarnPoints,
  calculateRedemption,
  getCustomerBalance,
  getRewardOverview,
  getRewardSettings,
  grantSignupReward,
  normalizeRewardSettings,
  redeemPoints,
};
