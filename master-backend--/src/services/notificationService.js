const { prisma: defaultPrisma } = require("../config/db");

function getDb(db) {
  return db || defaultPrisma;
}

async function createNotification({ recipient, userId, title, message, type }, db) {
  const client = getDb(db);
  return client.notification.create({
    data: {
      recipient,
      userId: userId || null,
      title,
      message,
      type,
    },
  }).catch(() => null);
}

module.exports = { createNotification };
