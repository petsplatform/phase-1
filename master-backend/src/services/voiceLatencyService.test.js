"use strict";

const { createVoiceLatencyTurn, envNumber } = require("./voiceLatencyService");

describe("voiceLatencyService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    console.info.mockRestore();
    console.warn.mockRestore();
    process.env = originalEnv;
  });

  it("summarizes speech end to first audio latency and slowest stage", () => {
    const turn = createVoiceLatencyTurn({
      callId: "call_1",
      streamId: "stream_1",
      turnId: "turn_1",
      warningMs: 2500,
    });

    turn.mark("customerSpeechStartedAt", 1000);
    turn.mark("lastCustomerAudioAt", 1800);
    turn.mark("sttTranscriptAt", 2100);
    turn.mark("turnProcessingStartedAt", 2500);
    turn.mark("agentRequestStartedAt", 2500);
    turn.mark("agentResponseCompletedAt", 3300);
    turn.mark("ttsRequestStartedAt", 3300);
    turn.mark("ttsCompletedAt", 3900);
    turn.mark("vobizFirstAudioSentAt", 3920);
    turn.mark("turnCompletedAt", 4000);

    const summary = turn.summarize();

    expect(summary.type).toBe("VOICE_TURN_LATENCY");
    expect(summary.stages.speechEndToFirstAudioMs).toBe(2120);
    expect(summary.stages.agentThinkMs).toBe(800);
    expect(summary.slowestStage).toEqual({ name: "speechEndToFirstAudioMs", ms: 2120 });
  });

  it("logs a warning when first audio misses the configured target", () => {
    const turn = createVoiceLatencyTurn({ callId: "call_1", warningMs: 1000 });
    turn.mark("lastCustomerAudioAt", 100);
    turn.mark("vobizFirstAudioSentAt", 1300);

    const summary = turn.log();

    expect(summary.type).toBe("VOICE_LATENCY_WARNING");
    expect(console.warn).toHaveBeenCalledWith("VOICE_LATENCY_WARNING", expect.any(String));
    expect(console.info).not.toHaveBeenCalled();
  });

  it("reads positive numeric env values only", () => {
    process.env.VOICE_END_OF_TURN_MS = "700";
    expect(envNumber("VOICE_END_OF_TURN_MS", 650)).toBe(700);

    process.env.VOICE_END_OF_TURN_MS = "0";
    expect(envNumber("VOICE_END_OF_TURN_MS", 650)).toBe(650);
  });
});
