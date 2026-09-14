"use strict";

function createVoiceCallLifecycle({ onHangup, setTimer = setTimeout, clearTimer = clearTimeout } = {}) {
  let noInputTimer = null;
  let validCustomerTurnActive = false;
  let state = "IDLE";

  function cancelNoInputTimer() {
    if (!noInputTimer) return false;
    clearTimer(noInputTimer);
    noInputTimer = null;
    return true;
  }

  function startNoInputTimer(durationMs, reason) {
    cancelNoInputTimer();
    noInputTimer = setTimer(() => {
      noInputTimer = null;
      if (validCustomerTurnActive) return;
      if (onHangup) onHangup({ reason: reason || "no_input_timeout", state });
    }, durationMs);
  }

  function openingStarted() {
    state = "AGENT_SPEAKING_OPENING";
  }

  function openingCompleted() {
    state = "WAITING_FOR_CUSTOMER";
  }

  function customerSpeechDetected() {
    validCustomerTurnActive = true;
    cancelNoInputTimer();
    state = state === "AGENT_SPEAKING_OPENING" ? "INTERRUPTED_BY_CUSTOMER" : "CUSTOMER_SPEAKING";
  }

  function finalTranscriptReceived(transcript) {
    const text = String(transcript || "").trim();
    if (!text) return false;
    validCustomerTurnActive = true;
    state = "PROCESSING_CUSTOMER_TURN";
    return true;
  }

  function aiAudioSent() {
    validCustomerTurnActive = false;
    state = "AGENT_SPEAKING_REPLY";
  }

  function snapshot() {
    return {
      state,
      noInputTimerActive: Boolean(noInputTimer),
      validCustomerTurnActive,
    };
  }

  return {
    aiAudioSent,
    cancelNoInputTimer,
    customerSpeechDetected,
    finalTranscriptReceived,
    openingCompleted,
    openingStarted,
    snapshot,
    startNoInputTimer,
  };
}

module.exports = {
  createVoiceCallLifecycle,
};
