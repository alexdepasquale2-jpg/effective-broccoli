import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadBestScore, saveBestScore } from "./storage.js";

const KEY = "aether-best-score";
const memory = new Map();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => {
      memory.set(key, String(value));
    },
    clear: () => memory.clear(),
  };
});

afterEach(() => {
  memory.clear();
});

describe("high score storage", () => {
  it("starts at zero when nothing is saved", () => {
    expect(loadBestScore()).toBe(0);
  });

  it("keeps the highest score", () => {
    expect(saveBestScore(40)).toBe(40);
    expect(saveBestScore(15)).toBe(40);
    expect(loadBestScore()).toBe(40);
    expect(localStorage.getItem(KEY)).toBe("40");
  });
});
