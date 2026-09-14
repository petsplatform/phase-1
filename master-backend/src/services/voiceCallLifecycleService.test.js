"use strict";

const { createVoiceCallLifecycle } = require("./voiceCallLifecycleService");

describe("voiceCallLifecycleService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the exact opening to yes scenario active after 15 seconds", () => {
    const onHangup = jest.fn();
    const lifecycle = createVoiceCallLifecycle({ onHangup });

    lifecycle.openingStarted();
    lifecycle.openingCompleted();
    lifecycle.startNoInputTimer(15000, "no_input_timeout");
    lifecycle.customerSpeechDetected();
    expect(lifecycle.finalTranscriptReceived("yes")).toBe(true);

    jest.advanceTimersByTime(15000);

    expect(onHangup).not.toHaveBeenCalled();
    expect(lifecycle.snapshot()).toMatchObject({
      state: "PROCESSING_CUSTOMER_TURN",
      noInputTimerActive: false,
      validCustomerTurnActive: true,
    });

    lifecycle.aiAudioSent();
    expect(lifecycle.snapshot().state).toBe("AGENT_SPEAKING_REPLY");
  });

  it("preserves early customer speech while opening playback state is stale", () => {
    const onHangup = jest.fn();
    const lifecycle = createVoiceCallLifecycle({ onHangup });

    lifecycle.openingStarted();
    lifecycle.startNoInputTimer(15000, "no_input_timeout");
    lifecycle.customerSpeechDetected();
    expect(lifecycle.finalTranscriptReceived("yes")).toBe(true);

    jest.advanceTimersByTime(15000);

    expect(onHangup).not.toHaveBeenCalled();
    expect(lifecycle.snapshot()).toMatchObject({
      state: "PROCESSING_CUSTOMER_TURN",
      noInputTimerActive: false,
      validCustomerTurnActive: true,
    });
  });

  it("accepts short Gujarati customer turns", () => {
    const lifecycle = createVoiceCallLifecycle();

    lifecycle.customerSpeechDetected();

    expect(lifecycle.finalTranscriptReceived("હા")).toBe(true);
  });

  it("hangs up only when no customer input arrives", () => {
    const onHangup = jest.fn();
    const lifecycle = createVoiceCallLifecycle({ onHangup });

    lifecycle.openingCompleted();
    lifecycle.startNoInputTimer(15000, "no_input_timeout");
    jest.advanceTimersByTime(15000);

    expect(onHangup).toHaveBeenCalledWith({
      reason: "no_input_timeout",
      state: "WAITING_FOR_CUSTOMER",
    });
  });
});
