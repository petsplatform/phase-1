const BULBUL_V3_SPEAKERS = new Set([
  "aditya",
  "ritu",
  "ashutosh",
  "priya",
  "neha",
  "rahul",
  "pooja",
  "rohan",
  "simran",
  "kavya",
  "amit",
  "dev",
  "ishita",
  "shreya",
  "ratan",
  "varun",
  "manan",
  "sumit",
  "roopa",
  "kabir",
  "aayan",
  "shubh",
  "advait",
  "anand",
  "tanya",
  "tarun",
  "sunny",
  "mani",
  "gokul",
  "vijay",
  "shruti",
  "suhani",
  "mohit",
  "kavitha",
  "rehan",
  "soham",
  "rupali",
  "niharika",
]);

const speechCache = new Map();

function speechCacheKey(text, agent = {}) {
  const voice =
    agent.voice && typeof agent.voice === "object" ? agent.voice : {};
  const model = voice.model || process.env.SARVAM_TTS_MODEL || "bulbul:v3";
  const languageCode = voice.languageCode || "en-IN";
  const speaker = normalizeTtsSpeaker(
    model,
    voice.speaker || process.env.SARVAM_TTS_SPEAKER,
  );
  const pace = Number(voice.pace || process.env.SARVAM_TTS_PACE || 1);
  return JSON.stringify({ text: String(text || ""), model, languageCode, speaker, pace });
}

function normalizeTtsSpeaker(model, speaker) {
  const value = String(speaker || "")
    .trim()
    .toLowerCase();
  if (model === "bulbul:v3" && !BULBUL_V3_SPEAKERS.has(value)) return "shubh";
  return value || (model === "bulbul:v3" ? "shubh" : "anushka");
}

function getSpeechConfig(agent = {}) {
  const voice =
    agent.voice && typeof agent.voice === "object" ? agent.voice : {};
  const ttsModel = voice.model || process.env.SARVAM_TTS_MODEL || "bulbul:v3";
  return {
    stt: {
      endpoint: "wss://api.sarvam.ai/speech-to-text/ws",
      apiKeyConfigured: Boolean(process.env.SARVAM_API_KEY),
      model: process.env.SARVAM_STT_MODEL || "saaras:v3",
      mode: process.env.SARVAM_STT_MODE || "codemix",
      languageCode: voice.languageCode || "en-IN",
      sampleRate: Number(process.env.SARVAM_STT_SAMPLE_RATE || 8000),
      inputAudioCodec: process.env.SARVAM_STT_AUDIO_CODEC || "pcm_s16le",
      vadSignals: true,
    },
    tts: {
      endpoint: "wss://api.sarvam.ai/text-to-speech/ws",
      apiKeyConfigured: Boolean(process.env.SARVAM_API_KEY),
      model: ttsModel,
      speaker: normalizeTtsSpeaker(
        ttsModel,
        voice.speaker || process.env.SARVAM_TTS_SPEAKER,
      ),
      targetLanguageCode: voice.languageCode || "en-IN",
      pace: Number(voice.pace || process.env.SARVAM_TTS_PACE || 1),
    },
  };
}   

function stripWavContainer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 44) return buffer;
  if (
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    return buffer;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    if (chunkId === "data")
      return buffer.subarray(dataStart, dataStart + chunkSize);
    offset = dataStart + chunkSize + (chunkSize % 2);
  }
  return buffer;
}

async function synthesizeSpeech(text, agent = {}) {
  const apiKey = String(process.env.SARVAM_API_KEY || "").trim();
  if (!apiKey) throw new Error("SARVAM_API_KEY is not configured");

  const voice =
    agent.voice && typeof agent.voice === "object" ? agent.voice : {};
  const languageCode =
    voice.languageCode || "en-IN";
  const model = voice.model || process.env.SARVAM_TTS_MODEL || "bulbul:v3";
  const speaker = normalizeTtsSpeaker(
    model,
    voice.speaker || process.env.SARVAM_TTS_SPEAKER,
  );
  const pace = Number(voice.pace || process.env.SARVAM_TTS_PACE || 1);

  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      target_language_code: languageCode,
      model,
      speaker,
      pace,
      speech_sample_rate: 8000,
      output_audio_codec: "linear16",
    }),
  });

  const body = await response.text();
  let payload = {};
  if (body) {
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      "Sarvam text-to-speech failed";
    throw new Error(message);
  }

  const audioBase64 = Array.isArray(payload.audios)
    ? payload.audios.join("")
    : "";
  if (!audioBase64) throw new Error("Sarvam text-to-speech returned no audio");
  return {
    audio: stripWavContainer(Buffer.from(audioBase64, "base64")),
    contentType: "audio/x-l16",
    sampleRate: 8000,
    requestId: payload.request_id || null,
  };
}

function prewarmSpeech(text, agent = {}) {
  const key = speechCacheKey(text, agent);
  if (!speechCache.has(key)) {
    speechCache.set(
      key,
      synthesizeSpeech(text, agent).catch((error) => {
        speechCache.delete(key);
        throw error;
      }),
    );
  }
  return speechCache.get(key);
}

async function synthesizeSpeechCached(text, agent = {}) {
  const key = speechCacheKey(text, agent);
  const cached = speechCache.get(key);
  if (cached) return cached;
  return prewarmSpeech(text, agent);
}

function buildSttWebSocketUrl(agent = {}) {
  const voice =
    agent.voice && typeof agent.voice === "object" ? agent.voice : {};
  const params = new URLSearchParams({
    "language-code":
      voice.languageCode || "en-IN",
    model: process.env.SARVAM_STT_MODEL || "saaras:v3",
    mode: process.env.SARVAM_STT_MODE || "codemix",
    sample_rate: String(process.env.SARVAM_STT_SAMPLE_RATE || 8000),
    input_audio_codec: process.env.SARVAM_STT_AUDIO_CODEC || "pcm_l16",
    vad_signals: "true",
    flush_signal: "true",
    high_vad_sensitivity: "true",
  });
  return `wss://api.sarvam.ai/speech-to-text/ws?${params.toString()}`;
}

module.exports = {
  buildSttWebSocketUrl,
  getSpeechConfig,
  prewarmSpeech,
  synthesizeSpeech,
  synthesizeSpeechCached,
};
