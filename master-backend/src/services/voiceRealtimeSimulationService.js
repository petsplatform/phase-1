"use strict";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateRealtimeTurn({
  sttFinalMs = 300,
  llmFirstPhraseMs = 400,
  ttsFirstAudioMs = 300,
  bridgeMs = 50,
  appEndOfTurnMs = 0,
} = {}) {
  const startedAt = Date.now();
  const marks = { customerSpeechEndedAt: startedAt };
  await delay(appEndOfTurnMs);
  marks.turnProcessingStartedAt = Date.now();
  await delay(sttFinalMs);
  marks.sttFinalAt = Date.now();
  await delay(llmFirstPhraseMs);
  marks.llmFirstPhraseAt = Date.now();
  await delay(ttsFirstAudioMs);
  marks.ttsFirstAudioAt = Date.now();
  await delay(bridgeMs);
  marks.vobizFirstAudioAt = Date.now();

  return {
    marks,
    totalMs: marks.vobizFirstAudioAt - marks.customerSpeechEndedAt,
    criticalPath: {
      speechEndToSttFinalMs: marks.sttFinalAt - marks.customerSpeechEndedAt,
      sttFinalToLlmFirstPhraseMs: marks.llmFirstPhraseAt - marks.sttFinalAt,
      firstPhraseToTtsFirstAudioMs: marks.ttsFirstAudioAt - marks.llmFirstPhraseAt,
      ttsFirstAudioToVobizSendMs: marks.vobizFirstAudioAt - marks.ttsFirstAudioAt,
    },
  };
}

module.exports = {
  simulateRealtimeTurn,
};
