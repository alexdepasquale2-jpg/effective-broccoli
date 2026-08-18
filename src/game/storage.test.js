import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadMeta, saveMeta } from "./storage.js";
import { emptyMeta } from "./meta.js";

const KEY = "harpoon-reef-v1";
const memory = new Map();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    clear: () => memory.clear(),
  };
});

afterEach(() => {
  memory.clear();
});

describe("reef save", () => {
  it("persists coins and cargo", () => {
    const meta = emptyMeta();
    meta.save.coins = 99;
    meta.save.cargo.tuna = 2;
    saveMeta(meta);
    const loaded = loadMeta(emptyMeta);
    expect(loaded.save.coins).toBe(99);
    expect(loaded.save.cargo.tuna).toBe(2);
  });
});
