"use strict";

const { _private } = require("./vobizStreamGateway");

describe("vobizStreamGateway speech detection", () => {
  it("does not treat silent PCM frames as customer speech", () => {
    const silence = Buffer.alloc(320).toString("base64");

    expect(_private.hasSpeechEnergy(silence)).toBe(false);
  });

  it("detects real PCM energy for first-turn fallback", () => {
    const speech = Buffer.alloc(320);
    for (let offset = 0; offset + 1 < speech.length; offset += 2) {
      speech.writeInt16LE(1200, offset);
    }

    expect(_private.hasSpeechEnergy(speech.toString("base64"))).toBe(true);
  });
});
