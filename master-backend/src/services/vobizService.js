const ApiError = require("../utils/apiError");
const { getCurrentStore } = require("../config/tenantContext");
const { isPublicUrl, vobizIssues } = require("./aiCallingConfigService");
const { getEmailBrand } = require("./emailService");

function requireConfig() {
  const authId = String(process.env.VOBIZ_AUTH_ID || "").trim();
  const authToken = String(process.env.VOBIZ_AUTH_TOKEN || "").trim();
  const from = String(process.env.VOBIZ_PHONE_NUMBER || "").trim();
  const publicBaseUrl = String(process.env.PUBLIC_API_BASE_URL || "").replace(
    /\/+$/,
    "",
  );

  if (!authId || !authToken || !from || !publicBaseUrl) {
    throw new ApiError(
      500,
      "Vobiz is not configured. Required: VOBIZ_AUTH_ID, VOBIZ_AUTH_TOKEN, VOBIZ_PHONE_NUMBER, PUBLIC_API_BASE_URL.",
    );
  }
  const issues = vobizIssues();
  if (issues.length) {
    throw new ApiError(
      400,
      `Vobiz configuration is incomplete: ${issues.join("; ")}.`,
    );
  }

  return { authId, authToken, from, publicBaseUrl };
}

function extractCallId(payload = {}) {
  return (
    payload.request_uuid ||
    payload.call_uuid ||
    payload.CallUUID ||
    payload.uuid ||
    payload.id ||
    null
  );
}

async function ensurePublicWebhookReachable(publicBaseUrl) {
  const healthPaths = ["/api/ai-calling/vobiz/health", "/health"];
  const failures = [];
  try {
    for (const path of healthPaths) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(`${publicBaseUrl}${path}`, {
          method: "GET",
          signal: controller.signal,
        });
        if (response.ok) return;
        failures.push(`${path} returned ${response.status}`);
      } catch (error) {
        failures.push(`${path} ${error.name === "AbortError" ? "request timed out" : error.message || "request failed"}`);
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new Error(failures.join("; "));
  } catch (error) {
    const message = error.message || "request failed";
    throw new ApiError(
      400,
      `Vobiz public webhook URL is not reachable (${publicBaseUrl}). Make sure the tunnel forwards to the backend webhook port (${process.env.PUBLIC_WEBHOOK_PORT || process.env.PORT || 5000}), then update PUBLIC_API_BASE_URL and VOBIZ_MEDIA_STREAM_URL. Details: ${message}`,
    );
  }
}

async function ensureLocalWebhookReachable() {
  const port = String(
    process.env.PUBLIC_WEBHOOK_PORT || process.env.PORT || 5000,
  ).trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`local health returned ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureWebhookReachable(publicBaseUrl) {
  await ensurePublicWebhookReachable(publicBaseUrl);
}

async function createCall({ to, callId, campaignId }) {
  const config = requireConfig();
  await ensureWebhookReachable(config.publicBaseUrl);
  const endpoint = `https://api.vobiz.ai/api/v1/Account/${encodeURIComponent(config.authId)}/Call/`;
  const store = getCurrentStore();
  const webhookToken = String(process.env.VOBIZ_WEBHOOK_TOKEN || "").trim();
  const webhookParams = new URLSearchParams({ callId });
  if (store?.storeKey) webhookParams.set("storeKey", store.storeKey);
  if (webhookToken) webhookParams.set("token", webhookToken);
  const answerUrl = `${config.publicBaseUrl}/api/ai-calling/vobiz/answer?${webhookParams.toString()}`;
  const hangupUrl = `${config.publicBaseUrl}/api/ai-calling/vobiz/hangup?${webhookParams.toString()}`;
  const body = {
    from: config.from,
    to,
    answer_url: answerUrl,
    answer_method: "POST",
    hangup_url: hangupUrl,
    hangup_method: "POST",
    machine_detection: process.env.VOBIZ_MACHINE_DETECTION || "false",
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-Auth-ID": config.authId,
      "X-Auth-Token": config.authToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload.message || payload.error || "Vobiz outbound call failed",
    );
  }

  return {
    provider: "vobiz",
    providerCallId: extractCallId(payload),
    answerUrl,
    hangupUrl,
    campaignId: campaignId || null,
    raw: payload,
  };
}

async function hangupCall(callUuid) {
  const uuid = String(callUuid || "").trim();
  if (!uuid) return { skipped: true, reason: "missing call UUID" };
  const config = requireConfig();
  const endpoint = `https://api.vobiz.ai/api/v1/Account/${encodeURIComponent(config.authId)}/Call/${encodeURIComponent(uuid)}/`;
  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      "X-Auth-ID": config.authId,
      "X-Auth-Token": config.authToken,
      "Content-Type": "application/json",
    },
  });
  if (response.status === 204) return { hungUp: true, status: 204 };
  const text = await response.text().catch(() => "");
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }
  if (!response.ok) {
    throw new ApiError(response.status, payload.message || payload.error || "Vobiz hangup failed");
  }
  return { hungUp: true, status: response.status, payload };
}

function buildAnswerXml({ callId, openingMessage }) {
  const config = requireConfig();
  const streamUrl = String(process.env.VOBIZ_MEDIA_STREAM_URL || "").trim();
  const brand = getEmailBrand(getCurrentStore()).name;
  const intro =
    String(openingMessage || "").trim() ||
    `Hello, this is an automated assistant calling from ${brand}. We sell pet medicines, healthcare products, grooming products, food, supplements, and other pet-care essentials. Is this a good time to speak?`;
  if (!streamUrl) {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<Response>",
      `<Speak>${escapeXml(intro)}</Speak>`,
      "<Speak>AI calling audio stream is not fully configured. Goodbye.</Speak>",
      "</Response>",
    ].join("");
  }
  if (!isPublicUrl(streamUrl, "wss:")) {
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      "<Response>",
      `<Speak>${escapeXml(intro)}</Speak>`,
      "<Speak>AI calling audio stream is not configured. Goodbye.</Speak>",
      "</Response>",
    ].join("");
  }

  const store = getCurrentStore();
  const webhookToken = String(process.env.VOBIZ_WEBHOOK_TOKEN || "").trim();
  const streamParams = new URLSearchParams({ callId });
  if (store?.storeKey) streamParams.set("storeKey", store.storeKey);
  if (webhookToken) streamParams.set("token", webhookToken);
  const separator = streamUrl.includes("?") ? "&" : "?";
  const streamTarget = `${streamUrl}${separator}${streamParams.toString()}`;
  const statusCallbackUrl = `${config.publicBaseUrl}/api/ai-calling/vobiz/stream-status?${streamParams.toString()}`;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    `<Stream bidirectional="true" keepCallAlive="true" streamTimeout="300" statusCallbackUrl="${escapeXml(statusCallbackUrl)}" statusCallbackMethod="POST" contentType="audio/x-l16;rate=8000">`,
    escapeXml(streamTarget),
    "</Stream>",
    "</Response>",
  ].join("");
}

function escapeXml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = {
  buildAnswerXml,
  createCall,
  hangupCall,
};
