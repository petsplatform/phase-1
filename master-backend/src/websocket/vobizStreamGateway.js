const WebSocket = require("ws");
const { WebSocketServer } = WebSocket;
const { getTenantClient } = require("../config/tenantDatabaseManager");
const { masterPrisma } = require("../config/db");
const { runWithTenant } = require("../config/tenantContext");
const aiCallingService = require("../services/aiCallingService");
const callingAgentService = require("../services/callingAgentService");
const { getEmailBrand } = require("../services/emailService");
const { buildSttWebSocketUrl, synthesizeSpeech, synthesizeSpeechCached } = require("../services/sarvamSpeechService");
const vobizService = require("../services/vobizService");

const HEARTBEAT_MS = 25000;
const L16_8KHZ_20MS_BYTES = 320;
const USER_TURN_DEBOUNCE_MS = 250;
const STT_FLUSH_DELAY_MS = 350;
const STT_RECONNECT_DELAY_MS = 500;
const CUSTOMER_SILENCE_TIMEOUT_MS = Number(process.env.AI_CALLING_CUSTOMER_SILENCE_TIMEOUT_MS || 30000);
const CUSTOMER_SILENCE_FINAL_TIMEOUT_MS = Number(process.env.AI_CALLING_CUSTOMER_SILENCE_FINAL_TIMEOUT_MS || 10000);
const CUSTOMER_SILENCE_PROMPT_TEXT = String(
  process.env.AI_CALLING_CUSTOMER_SILENCE_PROMPT || "Hello, can you hear me?",
).trim();

function parseJson(value) {
  if (typeof value !== "string" && !Buffer.isBuffer(value)) return null;
  try {
    return JSON.parse(value.toString());
  } catch {
    return null;
  }
}

async function findTenantContext(storeKey) {
  if (!storeKey) return { db: masterPrisma, store: null };
  const store = await masterPrisma.store.findFirst({
    where: { storeKey: String(storeKey), status: "ACTIVE" },
  });
  if (!store) return { db: masterPrisma, store: null };
  if (String(process.env.MULTI_TENANT_ENABLED || "").toLowerCase() !== "true") {
    return { db: masterPrisma, store };
  }
  return { db: await getTenantClient(store), store };
}

async function recordGatewayMessage(db, callId, content, metadata = {}) {
  if (!callId || !db?.aiCallMessage) return;
  await db.aiCallMessage
    .create({
      data: {
        callId,
        role: "system",
        content,
        metadata,
      },
    })
    .catch(() => undefined);
}

async function updateCallStatus(db, callId, status, extra = {}) {
  if (!callId || !db?.aiCall) return;
  await db.aiCall
    .update({
      where: { id: callId },
      data: { status, ...extra },
    })
    .catch(() => undefined);
}

function sendCheckpoint(ws, streamId, name) {
  if (!streamId || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event: "checkpoint", streamId, name }));
}

function brandText(value) {
  return String(value || "").replace(/\bBest\s+Vet\s+Care\b/gi, getEmailBrand().name);
}

function nowMs() {
  return Number(performance.now().toFixed(3));
}

function voiceGapLog(callId, turnId, eventName, metadata = {}) {
  console.log(`[VOICE_GAP] callId=${callId} turnId=${turnId || "-"} event=${eventName}`, JSON.stringify({
    atMs: nowMs(),
    at: new Date().toISOString(),
    ...metadata,
  }));
}

async function playAudioBuffer(ws, audio, { contentType, sampleRate, streamId, checkpointName, onFirstAudioSent }) {
  const chunkSize = Number(sampleRate) === 8000 && contentType === "audio/x-l16" ? L16_8KHZ_20MS_BYTES : 960;
  let firstAudioSent = false;
  for (let offset = 0; offset < audio.length; offset += chunkSize) {
    if (ws.readyState !== WebSocket.OPEN) return;
    const chunk = audio.subarray(offset, offset + chunkSize);
    ws.send(JSON.stringify({
      event: "playAudio",
      streamId,
      media: {
        contentType,
        sampleRate,
        payload: chunk.toString("base64"),
      },
    }));
    if (!firstAudioSent) {
      firstAudioSent = true;
      if (onFirstAudioSent) onFirstAudioSent({ bytes: chunk.length });
    }
  }
  sendCheckpoint(ws, streamId, checkpointName || `playback-${Date.now()}`);
  return audio.length;
}

async function playOpeningMessage(ws, db, callId, streamId) {
  const call = await aiCallingService.getCall(callId, db);
  const text = brandText(call.agent?.openingMessage).trim();
  if (!text) return 0;

  const speech = await synthesizeSpeechCached(text, call.agent);
  await playAudioBuffer(ws, speech.audio, {
    contentType: speech.contentType,
    sampleRate: speech.sampleRate,
    streamId,
    checkpointName: `opening-${Date.now()}`,
  });
  aiCallingService.recordMessage(callId, {
    role: "agent",
    content: text,
    metadata: { source: "stream_opening_tts" },
  }, db).catch(() => undefined);
  return speech.audio.length;
}

function transcriptFromSarvamEvent(event) {
  if (!event || event.type === "error") return "";
  return String(
    event.data?.transcript ||
      event.transcript ||
      event.text ||
      event.data?.text ||
      "",
  ).trim();
}

function connectSarvamStt({ call, db, callId, onTranscript, onClose }) {
  const apiKey = String(process.env.SARVAM_API_KEY || "").trim();
  if (!apiKey) throw new Error("SARVAM_API_KEY is not configured");

  const stt = new WebSocket(buildSttWebSocketUrl(call.agent), {
    headers: { "Api-Subscription-Key": apiKey },
  });
  let opened = false;
  let closed = false;
  let queuedAudio = [];

  stt.on("open", async () => {
    opened = true;
    await recordGatewayMessage(db, callId, "Sarvam STT connected");
    const pending = queuedAudio;
    queuedAudio = [];
    for (const payload of pending) sendAudioToStt(stt, payload);
  });

  stt.on("message", (message) => {
    const event = parseJson(message);
    const transcript = transcriptFromSarvamEvent(event);
    if (transcript) onTranscript(transcript, event);
  });

  stt.on("close", async (code, reason) => {
    closed = true;
    if (onClose) onClose();
    const reasonText = reason?.toString() || "";
    await recordGatewayMessage(db, callId, "Sarvam STT closed", {
      code,
      reason: reasonText,
    });
    if (code === 1003 || /credit|exhaust/i.test(reasonText)) {
      await updateCallStatus(db, callId, "failed", {
        endedAt: new Date(),
        outcome: "failed",
        error: `Sarvam STT closed: ${reasonText || code}`,
      });
    }
  });

  stt.on("error", async (error) => {
    await recordGatewayMessage(db, callId, "Sarvam STT error", { message: error.message });
  });

  return {
    send(payload) {
      if (closed) return;
      if (!opened) {
        queuedAudio.push(payload);
        if (queuedAudio.length > 100) queuedAudio.shift();
        return;
      }
      sendAudioToStt(stt, payload);
    },
    flush() {
      if (!opened || closed || stt.readyState !== WebSocket.OPEN) return;
      stt.send(JSON.stringify({ type: "flush" }));
    },
    close() {
      closed = true;
      if (stt.readyState === WebSocket.OPEN || stt.readyState === WebSocket.CONNECTING) stt.close();
    },
    get closed() {
      return closed;
    },
  };
}

function sendAudioToStt(stt, payload) {
  if (stt.readyState !== WebSocket.OPEN) return;
  stt.send(JSON.stringify({
    audio: {
      data: payload,
      sample_rate: String(process.env.SARVAM_STT_SAMPLE_RATE || 8000),
      encoding: "audio/wav",
    },
  }));
}

function hasSpeechEnergy(base64Payload) {
  let audio;
  try {
    audio = Buffer.from(String(base64Payload || ""), "base64");
  } catch {
    return false;
  }
  for (let offset = 0; offset + 1 < audio.length; offset += 2) {
    if (Math.abs(audio.readInt16LE(offset)) > 400) return true;
  }
  return false;
}

function initVobizStreamGateway(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (request, socket, head) => {
    let url;
    try {
      url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    } catch {
      socket.destroy();
      return;
    }

    if (url.pathname !== "/api/ai-calling/vobiz-stream") return;

    const expectedToken = String(process.env.VOBIZ_WEBHOOK_TOKEN || "").trim();
    const suppliedToken = String(url.searchParams.get("token") || request.headers["x-ai-calling-token"] || "").trim();
    if (expectedToken && suppliedToken !== expectedToken) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, url);
    });
  });

  wss.on("connection", async (ws, request, url) => {
    const callId = url.searchParams.get("callId");
    const storeKey = url.searchParams.get("storeKey");
    const tenantPromise = findTenantContext(storeKey);
    let resolvedTenant = null;
    let streamId = null;
    let audioFrames = 0;
    let openingPlayed = false;
    let callContext = null;
    let sttSession = null;
    let lastTranscript = "";
    let pendingTurnTimer = null;
    let pendingFlushTimer = null;
    let silenceTimer = null;
    let responding = false;
    let sttEnabled = false;
    let reconnectingStt = false;
    let endingCall = false;
    let pendingEndAfterPlayback = null;
    let agentSpeakingUntil = 0;
    let silencePromptPlayed = false;
    let turnCounter = 0;
    const speechCache = new Map();
    const playbackMarks = new Map();

    async function getTenant() {
      if (!resolvedTenant) resolvedTenant = await tenantPromise;
      return resolvedTenant;
    }

    async function getDb() {
      return (await getTenant()).db;
    }

    async function runInTenant(callback) {
      const tenant = await getTenant();
      return runWithTenant({ db: tenant.db, store: tenant.store, role: "AI_CALLING_STREAM" }, callback);
    }

    async function getBrandName() {
      const tenant = await getTenant();
      return getEmailBrand(tenant.store).name;
    }

    function warmSpeechCache(key, text) {
      if (!callContext?.agent || speechCache.has(key)) return speechCache.get(key);
      const promise = synthesizeSpeech(text, callContext.agent)
        .catch((error) => {
          console.warn("[VOICE_GAP] speech_cache_failed", JSON.stringify({ callId, key, message: error.message }));
          speechCache.delete(key);
          return null;
        });
      speechCache.set(key, promise);
      return promise;
    }

    function cachedSpeechForReply(reply) {
      const discoveryReply = "Sure. What pet-care product or medicine are you looking for today?";
      if (reply === discoveryReply) return speechCache.get("discoveryReply") || null;
      return null;
    }

    function clearSilenceTimer() {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = null;
    }

    async function finishConversation(outcome, reason, closeDelayMs = 700) {
      if (endingCall) return;
      endingCall = true;
      clearSilenceTimer();
      const db = await getDb();
      const call = await db.aiCall.findUnique({
        where: { id: callId },
        select: {
          vobizCallId: true,
          customerId: true,
          customer: { select: { leadStatus: true } },
        },
      }).catch(() => null);
      const terminalStatus = outcome === "failed"
        ? "failed"
        : outcome === "no_answer"
          ? "no_answer"
          : "completed";
      await updateCallStatus(db, callId, terminalStatus, {
        endedAt: new Date(),
        outcome: outcome || "completed",
        error: outcome === "failed" ? reason : undefined,
      });
      if (outcome === "no_answer" && call?.customerId && call.customer?.leadStatus !== "do_not_call") {
        await aiCallingService.updateCustomerLeadStatus({
          customerId: call.customerId,
          callId,
          status: "no_answer",
          reason: reason || "Customer did not receive or answer the call",
          user: null,
        }, db).catch(() => undefined);
      }
      await recordGatewayMessage(db, callId, "AI conversation ended by agent", {
        outcome,
        reason,
        streamId,
      });
      setTimeout(async () => {
        if (call?.vobizCallId) {
          await vobizService.hangupCall(call.vobizCallId)
            .then((result) => recordGatewayMessage(db, callId, "Vobiz active call hangup requested", {
              providerCallId: call.vobizCallId,
              result,
            }))
            .catch((error) => recordGatewayMessage(db, callId, "Vobiz active call hangup failed", {
              providerCallId: call.vobizCallId,
              message: error.message,
            }));
        }
        if (ws.readyState === WebSocket.OPEN) ws.close(1000, "conversation-ended");
      }, closeDelayMs);
    }

    async function armEndAfterPlayback(playbackName, outcome, reason) {
      if (!playbackName || endingCall) return;
      pendingEndAfterPlayback = { playbackName, outcome, reason };
      clearSilenceTimer();
      await recordGatewayMessage(await getDb(), callId, "AI conversation will end after playback", {
        playbackName,
        outcome,
        reason,
        streamId,
      });
    }

    async function playSilenceCheckPrompt(reason) {
      if (endingCall || responding || pendingEndAfterPlayback || silencePromptPlayed) return false;
      silencePromptPlayed = true;
      responding = true;
      try {
        const db = await getDb();
        if (!callContext) callContext = await runInTenant(() => aiCallingService.getCall(callId, db));
        const promptText = brandText(CUSTOMER_SILENCE_PROMPT_TEXT).trim();
        if (!promptText) return false;
        const playbackName = `silence-check-${callId}-${Date.now()}`;
        await recordGatewayMessage(db, callId, "Customer silence check prompt sent", {
          reason,
          promptText,
          streamId,
          nextTimeoutMs: CUSTOMER_SILENCE_FINAL_TIMEOUT_MS,
        });
        await aiCallingService.recordMessage(callId, {
          role: "agent",
          content: promptText,
          metadata: { source: "customer_silence_check" },
        }, db).catch(() => undefined);
        const speech = await synthesizeSpeech(promptText, callContext?.agent);
        const audioBytes = await playAudioBuffer(ws, speech.audio, {
          contentType: speech.contentType,
          sampleRate: speech.sampleRate,
          streamId,
          checkpointName: playbackName,
        }) || 0;
        const playbackMs = Math.max(800, Math.ceil(audioBytes / L16_8KHZ_20MS_BYTES) * 20);
        agentSpeakingUntil = Date.now() + playbackMs + 400;
        setTimeout(() => {
          if (!endingCall && ws.readyState === WebSocket.OPEN) {
            scheduleCustomerSilenceTimeout("Customer did not respond after silence check prompt");
          }
        }, Math.max(500, playbackMs));
        return true;
      } catch (error) {
        const db = await getDb().catch(() => null);
        if (db) await recordGatewayMessage(db, callId, "Customer silence check prompt failed", {
          reason,
          message: error.message,
          streamId,
        });
        return false;
      } finally {
        responding = false;
      }
    }

    function scheduleCustomerSilenceTimeout(reason) {
      clearSilenceTimer();
      if (!CUSTOMER_SILENCE_TIMEOUT_MS || CUSTOMER_SILENCE_TIMEOUT_MS < 1000) return;
      const timeoutMs = silencePromptPlayed
        ? CUSTOMER_SILENCE_FINAL_TIMEOUT_MS
        : CUSTOMER_SILENCE_TIMEOUT_MS;
      silenceTimer = setTimeout(async () => {
        if (responding || endingCall || ws.readyState !== WebSocket.OPEN) return;
        const db = await getDb().catch(() => null);
        if (db) {
          await recordGatewayMessage(db, callId, "Customer silence timeout", {
            reason,
            timeoutMs,
            silencePromptPlayed,
            streamId,
          });
        }
        if (!silencePromptPlayed) {
          const promptSent = await playSilenceCheckPrompt(reason);
          if (promptSent) return;
        }
        await finishConversation("no_answer", reason || "Customer did not respond", 300);
      }, timeoutMs);
    }

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    async function handleTranscript(transcript, event) {
      const normalized = transcript.trim();
      if (!normalized || normalized === lastTranscript) return;
      if (endingCall || pendingEndAfterPlayback || Date.now() < agentSpeakingUntil) return;

      clearSilenceTimer();
      lastTranscript = normalized;
      const turnId = `turn-${++turnCounter}`;
      const marks = { transcriptReceivedAt: nowMs() };
      voiceGapLog(callId, turnId, "CUSTOMER_TRANSCRIPT_RECEIVED", {
        transcript: normalized,
        streamId,
        sarvamEventType: event?.type || null,
      });
      if (pendingTurnTimer) clearTimeout(pendingTurnTimer);
      pendingTurnTimer = setTimeout(async () => {
        if (responding || endingCall || pendingEndAfterPlayback || ws.readyState !== WebSocket.OPEN || Date.now() < agentSpeakingUntil) return;
        responding = true;
        try {
          const db = await getDb();
          marks.customerSpeechEndAt = nowMs();
          voiceGapLog(callId, turnId, "CUSTOMER_SPEAKING_END", {
            transcript: normalized,
            streamId,
            transcriptToEndMs: Number((marks.customerSpeechEndAt - marks.transcriptReceivedAt).toFixed(3)),
            debounceMs: USER_TURN_DEBOUNCE_MS,
          });
          await recordGatewayMessage(db, callId, "Customer speech transcribed", {
            transcript: normalized,
            sarvamEvent: event,
          });
          const brandName = await getBrandName();
          marks.agentStartAt = nowMs();
          voiceGapLog(callId, turnId, "AGENT_START", { streamId, transcript: normalized });
          const result = await runInTenant(() => callingAgentService.respondToTurn({
            callId,
            transcript: normalized,
            db,
            brandName,
          }));
          marks.agentReadyAt = nowMs();
          voiceGapLog(callId, turnId, "AGENT_READY", {
            streamId,
            agentMs: Number((marks.agentReadyAt - marks.agentStartAt).toFixed(3)),
            endCall: Boolean(result.endCall),
            replyChars: String(result.message || "").length,
          });
          const reply = String(result.message || "").trim();
          let replyAudioBytes = 0;
          if (reply) {
            marks.ttsStartAt = nowMs();
            voiceGapLog(callId, turnId, "TTS_START", { streamId, replyChars: reply.length });
            const cachedSpeech = await cachedSpeechForReply(reply);
            const speech = cachedSpeech || await synthesizeSpeech(reply, callContext?.agent);
            marks.ttsReadyAt = nowMs();
            voiceGapLog(callId, turnId, "TTS_READY", {
              streamId,
              ttsMs: Number((marks.ttsReadyAt - marks.ttsStartAt).toFixed(3)),
              cacheHit: Boolean(cachedSpeech),
              audioBytes: speech.audio?.length || 0,
              contentType: speech.contentType,
              sampleRate: speech.sampleRate,
            });
            const replyPlaybackName = result.endCall
              ? `closing-${callId}-${Date.now()}`
              : `reply-${callId}-${Date.now()}`;
            marks.audioSendStartAt = nowMs();
            voiceGapLog(callId, turnId, "AUDIO_SEND_START", {
              streamId,
              playbackName: replyPlaybackName,
              audioBytes: speech.audio?.length || 0,
            });
            replyAudioBytes = await playAudioBuffer(ws, speech.audio, {
              contentType: speech.contentType,
              sampleRate: speech.sampleRate,
              streamId,
              checkpointName: replyPlaybackName,
              onFirstAudioSent: ({ bytes }) => {
                marks.firstAudioSentAt = nowMs();
                voiceGapLog(callId, turnId, "FIRST_AUDIO_SENT", {
                  streamId,
                  playbackName: replyPlaybackName,
                  bytes,
                  customerEndToFirstAudioMs: Number((marks.firstAudioSentAt - marks.customerSpeechEndAt).toFixed(3)),
                  ttsReadyToFirstAudioMs: Number((marks.firstAudioSentAt - marks.ttsReadyAt).toFixed(3)),
                });
              },
            }) || 0;
            marks.audioSendEndAt = nowMs();
            const replyPlaybackMs = Math.ceil(replyAudioBytes / L16_8KHZ_20MS_BYTES) * 20;
            playbackMarks.set(replyPlaybackName, {
              turnId,
              firstAudioSentAt: marks.firstAudioSentAt || null,
              audioSendEndAt: marks.audioSendEndAt,
              estimatedPlaybackMs: replyPlaybackMs,
            });
            const totalMs = marks.firstAudioSentAt ? marks.firstAudioSentAt - marks.customerSpeechEndAt : null;
            const summary = {
              streamId,
              playbackName: replyPlaybackName,
              transcriptToEndMs: Number((marks.customerSpeechEndAt - marks.transcriptReceivedAt).toFixed(3)),
              agentMs: Number((marks.agentReadyAt - marks.agentStartAt).toFixed(3)),
              ttsMs: Number((marks.ttsReadyAt - marks.ttsStartAt).toFixed(3)),
              audioSendMs: Number((marks.audioSendEndAt - marks.audioSendStartAt).toFixed(3)),
              customerEndToFirstAudioMs: totalMs === null ? null : Number(totalMs.toFixed(3)),
              totalTranscriptToFirstAudioMs: marks.firstAudioSentAt ? Number((marks.firstAudioSentAt - marks.transcriptReceivedAt).toFixed(3)) : null,
              estimatedPlaybackMs: replyPlaybackMs,
            };
            voiceGapLog(callId, turnId, "TURN_SUMMARY", summary);
            if (totalMs > Number(process.env.VOICE_LATENCY_WARNING_MS || 2500)) {
              console.warn("[VOICE_LATENCY_WARNING]", JSON.stringify({ callId, turnId, ...summary }));
            }
            agentSpeakingUntil = Date.now() + replyPlaybackMs + 400;
            if (result.endCall) {
              await armEndAfterPlayback(replyPlaybackName, result.outcome, result.endReason);
            }
          }
          if (result.endCall) {
            if (sttSession) {
              sttSession.close();
              sttSession = null;
            }
            if (!reply) {
              await finishConversation(result.outcome, result.endReason, 0);
            }
          } else if (reply) {
            const playbackMs = Math.ceil(replyAudioBytes / L16_8KHZ_20MS_BYTES) * 20;
            setTimeout(() => {
              if (!endingCall && ws.readyState === WebSocket.OPEN) {
                scheduleCustomerSilenceTimeout("Customer did not respond after agent reply");
              }
            }, Math.max(500, playbackMs));
          }
        } catch (error) {
          const db = await getDb().catch(() => null);
          if (db) {
            await recordGatewayMessage(db, callId, "AI turn failed", {
              message: error.message,
              transcript: normalized,
              streamId,
            });
          }
        } finally {
          responding = false;
        }
      }, USER_TURN_DEBOUNCE_MS);
    }

    async function startSttSession() {
      if (!sttEnabled || sttSession || ws.readyState !== WebSocket.OPEN) return;
      try {
        const db = await getDb();
        if (!callContext) callContext = await runInTenant(() => aiCallingService.getCall(callId, db));
        sttSession = connectSarvamStt({
          call: callContext,
          db,
          callId,
          onTranscript: handleTranscript,
          onClose: () => {
            sttSession = null;
          },
        });
      } catch (error) {
        const db = await getDb().catch(() => null);
        if (db) await recordGatewayMessage(db, callId, "Sarvam STT start failed", { message: error.message });
      }
    }

    function ensureSttSession() {
      if (!sttEnabled || sttSession || reconnectingStt || ws.readyState !== WebSocket.OPEN) return;
      reconnectingStt = true;
      setTimeout(() => {
        reconnectingStt = false;
        startSttSession();
      }, STT_RECONNECT_DELAY_MS);
    }

    function scheduleSttFlush() {
      if (!sttSession) return;
      if (pendingFlushTimer) clearTimeout(pendingFlushTimer);
      pendingFlushTimer = setTimeout(() => {
        if (sttSession) sttSession.flush();
      }, STT_FLUSH_DELAY_MS);
    }

    function forwardAudioToStt(payload) {
      if (Date.now() < agentSpeakingUntil) {
        return; // Suppress echo while agent is outputting sound to phone speaker
      }
      if (sttSession) {
        sttSession.send(payload);
        scheduleSttFlush();
        return;
      }
      ensureSttSession();
    }

    ws.on("message", async (message, isBinary) => {
      const db = await getDb();
      if (isBinary) {
        audioFrames += 1;
        forwardAudioToStt(Buffer.from(message).toString("base64"));
        return;
      }

      const event = parseJson(message);
      if (!event) return;
      streamId = event.streamId || event.stream_id || event.start?.streamId || event.start?.stream_id || streamId;

      if (event.event === "media") {
        audioFrames += 1;
        const payload = event.media?.payload;
        if (payload) forwardAudioToStt(payload);
        return;
      }

      if (["start", "connected", "mark", "playedStream", "clearedAudio", "stop"].includes(event.event)) {
        await recordGatewayMessage(db, callId, `Vobiz stream event: ${event.event}`, {
          streamId,
          event,
        });
      }

      if (event.event === "playedStream" && String(event.name || "").startsWith("opening-")) {
        sttEnabled = true;
        await startSttSession();
      }

      if (event.event === "playedStream") {
        const playbackName = String(event.name || "");
        const playbackMark = playbackMarks.get(playbackName);
        if (playbackMark) {
          playbackMarks.delete(playbackName);
          voiceGapLog(callId, playbackMark.turnId, "PLAYED_STREAM", {
            streamId,
            playbackName,
            firstAudioToPlayedStreamMs: playbackMark.firstAudioSentAt ? Number((nowMs() - playbackMark.firstAudioSentAt).toFixed(3)) : null,
            audioSendEndToPlayedStreamMs: Number((nowMs() - playbackMark.audioSendEndAt).toFixed(3)),
            estimatedPlaybackMs: playbackMark.estimatedPlaybackMs,
          });
        }
      }

      if (
        event.event === "playedStream" &&
        pendingEndAfterPlayback &&
        String(event.name || "") === pendingEndAfterPlayback.playbackName
      ) {
        const pendingEnd = pendingEndAfterPlayback;
        pendingEndAfterPlayback = null;
        await recordGatewayMessage(db, callId, "Closing playback completed", {
          playbackName: pendingEnd.playbackName,
          outcome: pendingEnd.outcome,
          reason: pendingEnd.reason,
          streamId,
        });
        await finishConversation(pendingEnd.outcome, pendingEnd.reason, 0);
      }

      if (!openingPlayed && event.event === "start") {
        openingPlayed = true;
        (async () => {
          callContext = await runInTenant(() => aiCallingService.getCall(callId, db));
          warmSpeechCache("discoveryReply", "Sure. What pet-care product or medicine are you looking for today?");
          const openingStartAt = nowMs();
          voiceGapLog(callId, null, "OPENING_BACKEND_TTS_START", { streamId });
          const audioBytes = await runInTenant(() => playOpeningMessage(ws, db, callId, streamId));
          await recordGatewayMessage(db, callId, "Opening TTS playback sent", {
            streamId,
            audioBytes,
          });
          const openingPlaybackMs = Math.max(1500, Math.ceil((audioBytes || 0) / L16_8KHZ_20MS_BYTES) * 20);
          agentSpeakingUntil = Date.now() + openingPlaybackMs + 400;
          const openingMs = Number((nowMs() - openingStartAt).toFixed(3));
          voiceGapLog(callId, null, "OPENING_BACKEND_TTS_SENT", {
            streamId,
            audioBytes,
            openingMs,
            estimatedPlaybackMs: openingPlaybackMs,
          });
          if (openingMs > Number(process.env.GREETING_LATENCY_WARNING_MS || 2000)) {
            console.warn("[GREETING_LATENCY_WARNING]", JSON.stringify({ callId, streamId, openingMs }));
          }
          sttEnabled = true;
          await startSttSession();

          setTimeout(() => {
            scheduleCustomerSilenceTimeout("Customer did not respond after opening message");
          }, openingPlaybackMs);
        })().catch(async (error) => {
          await recordGatewayMessage(db, callId, "Stream setup or opening playback failed", {
            message: error.message,
            streamId,
          });
          await finishConversation("failed", error.message, 300);
        });
      }
    });

    ws.on("close", async (code, reason) => {
      if (pendingTurnTimer) clearTimeout(pendingTurnTimer);
      if (pendingFlushTimer) clearTimeout(pendingFlushTimer);
      clearSilenceTimer();
      if (sttSession) sttSession.close();
      const db = await getDb();
      await recordGatewayMessage(db, callId, "Vobiz media stream closed", {
        code,
        reason: reason?.toString(),
        streamId,
        audioFrames,
      });
    });

    ws.on("error", async (error) => {
      const db = await getDb();
      await recordGatewayMessage(db, callId, "Vobiz media stream error", {
        message: error.message,
        streamId,
      });
    });

    getDb()
      .then(async (db) => {
        await updateCallStatus(db, callId, "answered", { answeredAt: new Date() });
        await recordGatewayMessage(db, callId, "Vobiz media stream connected", {
          storeKey,
          remoteAddress: request.socket.remoteAddress,
        });
      })
      .catch(() => undefined);
  });

  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.isAlive === false) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_MS);

  wss.on("close", () => clearInterval(interval));
  return wss;
}

module.exports = {
  _private: {
    hasSpeechEnergy,
  },
  initVobizStreamGateway,
};
