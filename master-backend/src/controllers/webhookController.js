const { masterPrisma } = require("../config/db");
const { getTenantClient } = require("../config/tenantDatabaseManager");
const stripeService = require("../services/stripeService");

const tenantEnabled = () => String(process.env.MULTI_TENANT_ENABLED).trim().toLowerCase() === "true";

async function applyPaymentUpdate(db, intent, paymentStatus) {
  const order = await db.order.findUnique({ where: { stripePaymentIntentId: intent.id } });
  if (!order) return;
  await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus,
      timeline: { push: `Payment ${paymentStatus.toLowerCase()} (Stripe webhook)` },
    },
  });
}

const handleStripeWebhook = async (req, res) => {
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, req.headers["stripe-signature"]);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const existing = await masterPrisma.masterWebhookEvent.findUnique({ where: { eventId: event.id } });
    if (existing) {
      return res.json({ received: true, duplicate: true });
    }

    let resolvedStoreId = null;

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const paymentStatus = event.type === "payment_intent.succeeded" ? "Paid" : "Failed";
      resolvedStoreId = intent.metadata?.storeId || null;

      if (!tenantEnabled()) {
        await applyPaymentUpdate(masterPrisma, intent, paymentStatus);
      } else if (resolvedStoreId) {
        const store = await masterPrisma.store.findUnique({ where: { id: resolvedStoreId } });
        if (!store || store.status !== "ACTIVE") {
          console.warn("[Stripe Webhook] Unknown or inactive store for metadata storeId", resolvedStoreId);
        } else {
          const tenantDb = await getTenantClient(store);
          await applyPaymentUpdate(tenantDb, intent, paymentStatus);
        }
      } else {
        console.warn("[Stripe Webhook] Missing storeId metadata on payment intent", intent.id);
      }
    }

    await masterPrisma.masterWebhookEvent.create({
      data: { provider: "stripe", eventId: event.id, storeId: resolvedStoreId, type: event.type },
    });

    return res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Failed to process event", event.id, error.message);
    return res.status(500).json({ received: false });
  }
};

module.exports = { handleStripeWebhook };
