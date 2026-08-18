import { describe, expect, it } from "vitest";
import { applyBoon, createMods, createRun, nextDraftThreshold, pickDraft, relicChips } from "./boons.js";
import { orbMultiplier, pickSlice, shardCollides, sliceName } from "./slice.js";

describe("draft cadence", () => {
  it("spaces boon picks further apart each time", () => {
    expect(nextDraftThreshold(0)).toBe(6);
    expect(nextDraftThreshold(1)).toBe(14);
    expect(nextDraftThreshold(2)).toBe(22);
  });
});

describe("boon stacking", () => {
  it("stacks a boon and rebuilds mods", () => {
    const run = createRun();
    const once = applyBoon(run, "anaFold");
    const twice = applyBoon(run, "anaFold");
    expect(run.stacks.anaFold).toBe(2);
    expect(twice.foldDuration).toBeGreaterThan(once.foldDuration);
    expect(twice.foldCooldown).toBeLessThan(once.foldCooldown);
    expect(run.nextDraft).toBe(22);
  });

  it("Glass W adds a charge per stack", () => {
    const run = createRun();
    applyBoon(run, "glass");
    applyBoon(run, "glass");
    expect(run.glassCharges).toBe(2);
  });
});

describe("pickDraft", () => {
  it("returns unique boons", () => {
    const picks = pickDraft({}, 3, () => 0);
    const ids = picks.map((boon) => boon.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(picks).toHaveLength(3);
  });
});

describe("relicChips", () => {
  it("only lists stacked boons", () => {
    const run = createRun();
    applyBoon(run, "frenzy");
    const chips = relicChips(run.stacks);
    expect(chips).toHaveLength(1);
    expect(chips[0].id).toBe("frenzy");
    expect(chips[0].cursed).toBe(true);
  });
});

describe("createMods", () => {
  it("makes cursed tessellation spawn more shards and score", () => {
    const mods = createMods({ tessellate: 2, thin: 1 });
    expect(mods.shardExtra).toBe(2);
    expect(mods.scoreMult).toBeGreaterThan(1);
    expect(mods.hitScale).toBeLessThan(1);
  });
});

describe("slice combat", () => {
  it("lets you phase the opposite color except during sticky occupancy", () => {
    expect(shardCollides({ shardSlice: 1, polarity: 1, folding: false, bulkPhased: false })).toBe(true);
    expect(shardCollides({ shardSlice: -1, polarity: 1, folding: false, bulkPhased: false })).toBe(false);
    expect(shardCollides({ shardSlice: 1, polarity: 1, folding: true, bulkPhased: false })).toBe(false);
    expect(shardCollides({ shardSlice: 0, polarity: 1, folding: true, bulkPhased: true })).toBe(false);
    expect(shardCollides({ shardSlice: 0, polarity: 1, folding: true, bulkPhased: false })).toBe(true);
  });

  it("pays aligned orbs and taxes mismatches", () => {
    expect(orbMultiplier({ orbSlice: 1, polarity: 1, alignedStacks: 2 })).toBe(5);
    expect(orbMultiplier({ orbSlice: -1, polarity: 1, alignedStacks: 2 })).toBe(0.5);
    expect(orbMultiplier({ orbSlice: 0, polarity: 1, alignedStacks: 2 })).toBe(1);
  });

  it("names slices and can roll bulk", () => {
    expect(sliceName(1)).toBe("ANA");
    expect(sliceName(-1)).toBe("KATA");
    expect(pickSlice(() => 0, 0.2)).toBe(0);
    expect(pickSlice(() => 0.9, 0.2)).toBe(-1);
  });
});
