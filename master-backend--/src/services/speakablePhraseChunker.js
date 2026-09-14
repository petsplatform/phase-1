"use strict";

const DEFAULT_MIN_CHARS = 24;
const DEFAULT_MAX_CHARS = 150;
const PHRASE_END_RE = /[.!?।॥\n]/;
const SHORT_ACKNOWLEDGEMENTS = new Set([
  "sure",
  "okay",
  "ok",
  "alright",
  "right",
  "yes",
  "got it",
  "of course",
  "certainly",
  "absolutely",
]);

function trimPhrase(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizePhrase(value) {
  return trimPhrase(value)
    .toLowerCase()
    .replace(/[.!?,;:।॥]+$/g, "")
    .trim();
}

function isShortAcknowledgement(value) {
  return SHORT_ACKNOWLEDGEMENTS.has(normalizePhrase(value));
}

function createSpeakablePhraseChunker({ minChars = DEFAULT_MIN_CHARS, maxChars = DEFAULT_MAX_CHARS, onPhrase } = {}) {
  if (typeof onPhrase !== "function") {
    throw new Error("onPhrase callback is required");
  }
  let buffer = "";
  let closed = false;

  function emit(value) {
    const phrase = trimPhrase(value);
    if (phrase) onPhrase(phrase);
  }

  function findBoundary(value) {
    for (let index = 0; index < value.length; index += 1) {
      if (index + 1 >= minChars && PHRASE_END_RE.test(value[index])) {
        const boundary = index + 1;
        if (isShortAcknowledgement(value.slice(0, boundary))) continue;
        return boundary;
      }
    }
    if (value.length < maxChars) return -1;
    const softBoundary = value.lastIndexOf(" ", maxChars);
    return softBoundary >= minChars ? softBoundary + 1 : maxChars;
  }

  function add(delta) {
    if (closed) return;
    buffer += String(delta || "");
    let boundary = findBoundary(buffer);
    while (boundary > 0) {
      emit(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary);
      boundary = findBoundary(buffer);
    }
  }

  function flush() {
    if (closed) return;
    closed = true;
    emit(buffer);
    buffer = "";
  }

  return { add, flush };
}

module.exports = {
  createSpeakablePhraseChunker,
  trimPhrase,
};
