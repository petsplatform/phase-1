const WARNING_THRESHOLD_MS = Number(process.env.VOICE_LATENCY_WARNING_MS || 2500);

function logVoiceTrace(callId, turnId, message, metadata = {}) {
  const parts = [`[VOICE TRACE] callId=${callId}`];
  if (turnId) parts.push(`turnId=${turnId}`);
  if (metadata.generationId) parts.push(`generationId=${metadata.generationId}`);
  parts.push(message);
  
  console.log(parts.join(" "), Object.keys(metadata).length ? JSON.stringify(metadata) : "");
}

function logStateTransition(callId, turnId, from, to) {
  logVoiceTrace(callId, turnId, `State transition: ${from} -> ${to}`);
}

function logTurnLatency(callId, turnId, metrics) {
  console.log(`[VOICE_TURN_LATENCY] callId=${callId} turnId=${turnId}`, JSON.stringify(metrics));

  if (metrics.speechEndToAgentAudioMs > WARNING_THRESHOLD_MS) {
    console.warn(`[VOICE_LATENCY_WARNING] Latency exceeded threshold! speechEndToAgentAudioMs=${metrics.speechEndToAgentAudioMs}ms (threshold=${WARNING_THRESHOLD_MS}ms)`);
  }
}

module.exports = {
  logVoiceTrace,
  logStateTransition,
  logTurnLatency
};
