import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyRecord, loadRecord, mergeSession, saveRecord } from "./storage.js";
import { createLedger } from "./ledger.js";

const memory = new Map();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    clear: () => memory.clear(),
  };
});

afterEach(() => memory.clear());

describe("record", () => {
  it("starts empty and round-trips", () => {
    expect(loadRecord().bestStillness).toBe(0);
    saveRecord({ ...emptyRecord(), bestStillness: 420 });
    expect(loadRecord().bestStillness).toBe(420);
  });

  it("keeps only the deepest session and accumulates lifetime totals", () => {
    const ledger = { ...createLedger(), seen: 6, acted: 2, changedAnything: 1 };
    let record = mergeSession(emptyRecord(), { stillness: 300.7, depthLevel: 3, ledger });
    expect(record.bestStillness).toBe(300);
    expect(record.deepestDepth).toBe(3);

    record = mergeSession(record, { stillness: 100, depthLevel: 1, ledger });
    expect(record.bestStillness).toBe(300);
    expect(record.deepestDepth).toBe(3);
    expect(record.lifetimeSeen).toBe(12);
    expect(record.lifetimeActed).toBe(4);
    expect(record.sessions).toBe(2);
  });
});
