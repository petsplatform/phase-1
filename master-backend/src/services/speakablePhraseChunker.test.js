"use strict";

const { createSpeakablePhraseChunker } = require("./speakablePhraseChunker");

describe("speakablePhraseChunker", () => {
  it("emits the first natural phrase before the full response is complete", () => {
    const phrases = [];
    const chunker = createSpeakablePhraseChunker({
      minChars: 8,
      onPhrase: (phrase) => phrases.push(phrase),
    });

    chunker.add("Yes, we have dog medicine.");
    expect(phrases).toEqual(["Yes, we have dog medicine."]);

    chunker.add(" Should I send details on WhatsApp?");
    chunker.flush();
    expect(phrases).toEqual([
      "Yes, we have dog medicine.",
      "Should I send details on WhatsApp?",
    ]);
  });

  it("does not wait forever for punctuation", () => {
    const phrases = [];
    const chunker = createSpeakablePhraseChunker({
      minChars: 10,
      maxChars: 32,
      onPhrase: (phrase) => phrases.push(phrase),
    });

    chunker.add("We can share the available product details on WhatsApp now");
    chunker.flush();

    expect(phrases[0].length).toBeLessThanOrEqual(32);
    expect(phrases.join(" ")).toContain("available product details");
  });

  it("flushes very short OpenAI responses", () => {
    const phrases = [];
    const chunker = createSpeakablePhraseChunker({
      onPhrase: (phrase) => phrases.push(phrase),
    });

    chunker.add("Sure.");
    chunker.flush();

    expect(phrases).toEqual(["Sure."]);
  });

  it("holds a short first acknowledgement until the next phrase arrives", () => {
    const phrases = [];
    const chunker = createSpeakablePhraseChunker({
      minChars: 4,
      onPhrase: (phrase) => phrases.push(phrase),
    });

    chunker.add("Sure.");
    expect(phrases).toEqual([]);

    chunker.add(" What pet-care product or medicine are you looking for today?");
    expect(phrases).toEqual(["Sure. What pet-care product or medicine are you looking for today?"]);
  });

  it("does not split common short acknowledgement prefixes by themselves", () => {
    const phrases = [];
    const chunker = createSpeakablePhraseChunker({
      minChars: 4,
      onPhrase: (phrase) => phrases.push(phrase),
    });

    chunker.add("Got it.");
    chunker.add(" I will send the product details by email now.");

    expect(phrases).toEqual(["Got it. I will send the product details by email now."]);
  });

  it("flushes short Gujarati responses", () => {
    const phrases = [];
    const chunker = createSpeakablePhraseChunker({
      onPhrase: (phrase) => phrases.push(phrase),
    });

    chunker.add("હા, ચોક્કસ.");
    chunker.flush();

    expect(phrases).toEqual(["હા, ચોક્કસ."]);
  });
});
