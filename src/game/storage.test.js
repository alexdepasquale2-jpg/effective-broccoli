import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyRecord, loadRecord, mergeRun, recordLine, saveRecord } from "./storage.js";
import { createChronicle } from "./chronicle.js";
import { applyEffects, createWorld } from "./world.js";

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
    expect(loadRecord().runs).toBe(0);
    saveRecord({ ...emptyRecord(), bestValley: 71 });
    expect(loadRecord().bestValley).toBe(71);
  });

  it("keeps the best valley and accumulates lifetime totals", () => {
    const chronicle = { ...createChronicle(), beats: 20, tended: 3, acted: 2, threadsChanged: 1, threadsWorsened: 1 };
    const good = applyEffects(createWorld(), { self: 20, kin: 20, work: 20, town: 20, world: 20 });

    let record = mergeRun(emptyRecord(), { world: good, chronicle, peakStillness: 812.6 });
    expect(record.bestStillness).toBe(812);
    expect(record.lifetimeInterventions).toBe(5);

    const poor = applyEffects(createWorld(), { self: -30, kin: -30, work: -30, town: -30, world: -30 });
    record = mergeRun(record, { world: poor, chronicle, peakStillness: 100 });
    expect(record.bestValley).toBeGreaterThan(50);
    expect(record.runs).toBe(2);
    expect(record.lifetimeBeats).toBe(40);
  });

  it("says so plainly when you have never intervened", () => {
    const record = { ...emptyRecord(), runs: 2 };
    expect(recordLine(record)).toContain("never once put your hand in");
  });
});
