import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadMeta, saveMeta } from "./storage.js";
import { emptyMeta } from "./meta.js";

const KEY = "aether-meta-v1";
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

describe("clan save", () => {
  it("migrates old town saves into a fresh clan", () => {
    localStorage.setItem(KEY, JSON.stringify({ xp: 40, hero: { cash: 99 } }));
    const meta = loadMeta(emptyMeta);
    expect(meta.clan.energy).toBeGreaterThan(0);
    expect(meta.xp).toBe(40);
  });

  it("persists clan state", () => {
    const meta = loadMeta(emptyMeta);
    meta.clan.energy = 12;
    saveMeta(meta);
    const loaded = loadMeta(emptyMeta);
    expect(loaded.clan.energy).toBe(12);
  });
});
