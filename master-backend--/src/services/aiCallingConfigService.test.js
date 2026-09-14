"use strict";

const { providerStatus } = require("./aiCallingConfigService");

describe("aiCallingConfigService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("reports missing providers without exposing secrets", () => {
    delete process.env.VOBIZ_AUTH_ID;
    delete process.env.VOBIZ_AUTH_TOKEN;
    delete process.env.SARVAM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.PUBLIC_API_BASE_URL;
    delete process.env.VOBIZ_MEDIA_STREAM_URL;
    process.env.WHATSAPP_PROVIDER = "none";

    const status = providerStatus();

    expect(status.providers.vobiz.configured).toBe(false);
    expect(status.providers.sarvam.configured).toBe(false);
    expect(status.providers.openai.configured).toBe(false);
    expect(status.providers.whatsapp.configured).toBe(false);
    expect(JSON.stringify(status)).not.toContain("secret");
  });

  it("reports provider readiness from required environment variables", () => {
    process.env.VOBIZ_AUTH_ID = "auth-id";
    process.env.VOBIZ_AUTH_TOKEN = "auth-token";
    process.env.VOBIZ_PHONE_NUMBER = "+10000000000";
    process.env.PUBLIC_API_BASE_URL = "https://example.test";
    process.env.VOBIZ_MEDIA_STREAM_URL = "wss://example.test/api/ai-calling/vobiz-stream";
    process.env.SARVAM_API_KEY = "sarvam-key";
    process.env.OPENAI_API_KEY = "openai-key";
    process.env.WHATSAPP_PROVIDER = "approved-provider";

    const status = providerStatus();

    expect(status.providers.vobiz.configured).toBe(true);
    expect(status.providers.sarvam.configured).toBe(true);
    expect(status.providers.openai.configured).toBe(true);
    expect(status.providers.whatsapp.configured).toBe(true);
  });

  it("rejects mismatched public webhook and media stream hosts", () => {
    process.env.VOBIZ_AUTH_ID = "auth-id";
    process.env.VOBIZ_AUTH_TOKEN = "auth-token";
    process.env.VOBIZ_PHONE_NUMBER = "+10000000000";
    process.env.PUBLIC_API_BASE_URL = "https://current-tunnel.ngrok-free.dev";
    process.env.VOBIZ_MEDIA_STREAM_URL = "wss://old-tunnel.ngrok-free.dev/api/ai-calling/vobiz-stream";
    process.env.SARVAM_API_KEY = "sarvam-key";
    process.env.OPENAI_API_KEY = "openai-key";

    const status = providerStatus();

    expect(status.providers.vobiz.configured).toBe(false);
    expect(status.providers.vobiz.issues).toContain(
      "PUBLIC_API_BASE_URL and VOBIZ_MEDIA_STREAM_URL must use the same public host",
    );
  });
});
