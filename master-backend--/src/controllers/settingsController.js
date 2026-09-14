const settingsService = require("../services/settingsService");
const { sendEmail, getEmailBrand } = require("../services/emailService");
const abandonedCartService = require("../services/abandonedCartService");
const asyncHandler = require("../utils/asyncHandler");

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings({ includeSmtp: Boolean(req.user) }, req.tenantDb);
  res.json({ success: true, data: settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.validated.body, req.tenantDb);
  res.json({ success: true, data: settings });
});

const clearSmtpSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.clearSmtpSettings(req.tenantDb);
  res.json({ success: true, data: settings, message: "SMTP credentials removed" });
});

const sendTestEmail = asyncHandler(async (req, res) => {
  const { to } = req.body;
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ success: false, message: "A valid recipient email is required." });
  }
  const brand = getEmailBrand();
  await sendEmail({
    to,
    brand,
    subject: `Test email from ${brand.name}`,
    text: `This is a test email from ${brand.name}. Your SMTP credentials are working correctly.`,
    html: `<p>This is a test email from <strong>${brand.name}</strong>.</p><p>Your SMTP credentials are working correctly.</p>`,
  });
  res.json({ success: true, message: "Test email sent successfully." });
});

const runAbandonedCartEmails = asyncHandler(async (req, res) => {
  const results = await abandonedCartService.processAbandonedCarts(req.tenantDb, {
    force: req.body?.force === true,
    limit: req.body?.limit,
  });
  res.json({ success: true, data: results });
});

module.exports = { clearSmtpSettings, getSettings, runAbandonedCartEmails, updateSettings, sendTestEmail };
