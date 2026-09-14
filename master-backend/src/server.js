const app = require("./app.js");
const publicWebhookApp = require("./publicWebhookApp");
const { prisma } = require("./config/db");
const { startVetVerificationExpiryJob } = require("./jobs/vetVerificationExpiryJob");
const { startAutoOrderJob } = require("./jobs/autoOrderJob");
const { startAbandonedCartJob } = require("./jobs/abandonedCartJob");
const { initVobizStreamGateway } = require("./websocket/vobizStreamGateway");

const PORT = process.env.PORT || 5000;
const PUBLIC_WEBHOOK_PORT = process.env.PUBLIC_WEBHOOK_PORT || null;

app.get("/", (req, res) => {
  res.send("Admin panelserver is running 🚀");
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
  console.log("Multi-tenant mode", process.env.MULTI_TENANT_ENABLED === "true" ? "enabled" : "disabled");
});
const vobizStreamGateway = initVobizStreamGateway(server);
const publicWebhookServer =
  PUBLIC_WEBHOOK_PORT && String(PUBLIC_WEBHOOK_PORT) !== String(PORT)
    ? publicWebhookApp.listen(PUBLIC_WEBHOOK_PORT, "0.0.0.0", () => {
        console.log("AI calling public webhook server running on port", PUBLIC_WEBHOOK_PORT);
      })
    : null;
const publicWebhookStreamGateway = publicWebhookServer ? initVobizStreamGateway(publicWebhookServer) : null;
const vetExpiryJob = startVetVerificationExpiryJob();
const autoOrderJob = startAutoOrderJob();
const abandonedCartJob = startAbandonedCartJob();

const shutdown = async () => {
  if (vetExpiryJob) clearInterval(vetExpiryJob);
  if (autoOrderJob) clearInterval(autoOrderJob);
  if (abandonedCartJob) clearInterval(abandonedCartJob);
  if (vobizStreamGateway) vobizStreamGateway.close();
  if (publicWebhookStreamGateway) publicWebhookStreamGateway.close();
  await prisma.$disconnect();
  if (publicWebhookServer) publicWebhookServer.close(() => undefined);
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
