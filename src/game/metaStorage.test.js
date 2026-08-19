import { describe, expect, it, beforeEach } from "vitest";
import { createInitialMeta, loadMeta, saveMeta, buyMetaUpgrade } from "./metaStorage.js";

const memory = new Map();

describe("Meta Progression & Storage", () => {
  beforeEach(() => {
    memory.clear();
    globalThis.localStorage = {
      getItem: (key) => (memory.has(key) ? memory.get(key) : null),
      setItem: (key, val) => memory.set(key, String(val)),
      clear: () => memory.clear(),
    };
  });

  it("loads default meta state", () => {
    const meta = loadMeta();
    expect(meta.totalGold).toBeGreaterThanOrEqual(100);
    expect(meta.upgrades.vitality).toBe(0);
  });

  it("buys persistent meta upgrades using gold", () => {
    const meta = createInitialMeta();
    meta.totalGold = 500;

    const result = buyMetaUpgrade(meta, "vitality");
    expect(result.ok).toBe(true);
    expect(meta.upgrades.vitality).toBe(1);
    expect(meta.totalGold).toBe(420); // 500 - 80
  });
});
