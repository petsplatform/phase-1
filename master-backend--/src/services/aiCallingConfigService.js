function has(value) {
  return Boolean(String(value || "").trim());
}

function isLocalHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(host)) return true;
  if (host.startsWith("127.")) return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  const private172 = host.match(/^172\.(\d+)\./);
  return private172 ? Number(private172[1]) >= 16 && Number(private172[1]) <= 31 : false;
}

function isPublicUrl(value, protocol) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === protocol && !isLocalHost(url.hostname);
  } catch {
    return false;
  }
}

function parseConfiguredUrl(value) {
  try {
    return new URL(String(value || "").trim());
  } catch {
    return null;
  }
}

function vobizIssues() {
  const issues = [];
  if (!has(process.env.VOBIZ_AUTH_ID)) issues.push("VOBIZ_AUTH_ID is missing");
  if (!has(process.env.VOBIZ_AUTH_TOKEN)) issues.push("VOBIZ_AUTH_TOKEN is missing");
  if (!has(process.env.VOBIZ_PHONE_NUMBER)) issues.push("VOBIZ_PHONE_NUMBER is missing");
  if (!has(process.env.PUBLIC_API_BASE_URL)) {
    issues.push("PUBLIC_API_BASE_URL is missing");
  } else if (!isPublicUrl(process.env.PUBLIC_API_BASE_URL, "https:")) {
    issues.push("PUBLIC_API_BASE_URL must be a public HTTPS URL, not localhost");
  }
  if (!has(process.env.VOBIZ_MEDIA_STREAM_URL)) {
    issues.push("VOBIZ_MEDIA_STREAM_URL is missing");
  } else if (!isPublicUrl(process.env.VOBIZ_MEDIA_STREAM_URL, "wss:")) {
    issues.push("VOBIZ_MEDIA_STREAM_URL must be a public WSS URL, not localhost");
  }
  const publicUrl = parseConfiguredUrl(process.env.PUBLIC_API_BASE_URL);
  const streamUrl = parseConfiguredUrl(process.env.VOBIZ_MEDIA_STREAM_URL);
  if (publicUrl && streamUrl && publicUrl.hostname !== streamUrl.hostname) {
    issues.push("PUBLIC_API_BASE_URL and VOBIZ_MEDIA_STREAM_URL must use the same public host");
  }
  return issues;
}

function providerStatus() {
  const vobizMissing = vobizIssues();
  const vobizConfigured = vobizMissing.length === 0;
  const sarvamConfigured = has(process.env.SARVAM_API_KEY);
  const openaiConfigured = has(process.env.OPENAI_API_KEY);
  const whatsappConfigured =
    has(process.env.WHATSAPP_PROVIDER) &&
    String(process.env.WHATSAPP_PROVIDER).toLowerCase() !== "none";

  return {
    enabled: String(process.env.AI_CALLING_ENABLED || "false").toLowerCase() === "true",
    providers: {
      vobiz: {
        configured: vobizConfigured,
        label: vobizConfigured ? "Connected" : "Missing Configuration",
        issues: vobizMissing,
        requiredEnv: [
          "VOBIZ_AUTH_ID",
          "VOBIZ_AUTH_TOKEN",
          "VOBIZ_PHONE_NUMBER",
          "PUBLIC_API_BASE_URL",
          "VOBIZ_MEDIA_STREAM_URL",
        ],
      },
      sarvam: {
        configured: sarvamConfigured,
        label: sarvamConfigured ? "Connected" : "Missing Configuration",
        sttModel: process.env.SARVAM_STT_MODEL || "saaras:v3",
        sttMode: process.env.SARVAM_STT_MODE || "codemix",
        ttsModel: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
        speaker: process.env.SARVAM_TTS_SPEAKER || "anushka",
      },
      openai: {
        configured: openaiConfigured,
        label: openaiConfigured ? "Connected" : "Missing Configuration",
        model: process.env.OPENAI_CALLING_MODEL || process.env.OPENAI_MODEL || "gpt-5.6-terra",
      },
      whatsapp: {
        configured: whatsappConfigured,
        label: whatsappConfigured ? "Connected" : "Not Configured",
        provider: process.env.WHATSAPP_PROVIDER || "none",
      },
      email: {
        configured: true,
        label: "Uses store SMTP settings",
      },
    },
  };
}

function assertAiCallingEnabled() {
  if (String(process.env.AI_CALLING_ENABLED || "false").toLowerCase() !== "true") {
    const error = new Error("AI Calling is disabled. Set AI_CALLING_ENABLED=true after provider configuration is ready.");
    error.statusCode = 400;
    throw error;
  }
}

module.exports = {
  assertAiCallingEnabled,
  isPublicUrl,
  providerStatus,
  vobizIssues,
};
