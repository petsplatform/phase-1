"use strict";

const { simulateRealtimeTurn } = require("./voiceRealtimeSimulationService");

describe("voice realtime simulation harness", () => {
  it("keeps first-turn app latency near the simulated provider path", async () => {
    const result = await simulateRealtimeTurn({
      sttFinalMs: 30,
      llmFirstPhraseMs: 40,
      ttsFirstAudioMs: 30,
      bridgeMs: 5,
      appEndOfTurnMs: 0,
    });

    expect(result.totalMs).toBeLessThan(250);
    expect(result.criticalPath.sttFinalToLlmFirstPhraseMs).toBeLessThan(90);
  });

  it("keeps the second turn free of stale opening or playback delay", async () => {
    await simulateRealtimeTurn({
      sttFinalMs: 20,
      llmFirstPhraseMs: 20,
      ttsFirstAudioMs: 20,
      bridgeMs: 5,
      appEndOfTurnMs: 0,
    });
    const secondTurn = await simulateRealtimeTurn({
      sttFinalMs: 20,
      llmFirstPhraseMs: 20,
      ttsFirstAudioMs: 20,
      bridgeMs: 5,
      appEndOfTurnMs: 0,
    });

    expect(secondTurn.totalMs).toBeLessThan(200);
  });
});
