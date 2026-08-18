import { describe, expect, it } from "vitest";
import {
  applyBoon,
  createMods,
  createRun,
  eligibleEvolutions,
  hungerText,
  nextDraftThreshold,
  pickDraft,
  relicChips,
} from "./boons.js";
const STARTER_IDS = ["anaFold", "echo", "appetite", "hypercombo"];
import { orbMultiplier, pickSlice, shardCollides, sliceName } from "./slice.js";

describe("draft cadence", () => {
  it("keeps drafts coming fast enough to feel thirsty", () => {
    expect(nextDraftThreshold(0)).toBe(4);
    expect(nextDraftThreshold(1)).toBe(9);
    expect(nextDraftThreshold(2)).toBe(14);
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
    expect(run.nextDraft).toBe(14);
  });

  it("Glass W adds a charge per stack", () => {
    const run = createRun();
    applyBoon(run, "glass");
    applyBoon(run, "prismW");
    expect(run.glassCharges).toBe(3);
  });
});

describe("pickDraft", () => {
  it("returns unique unlocked boons", () => {
    const picks = pickDraft({}, 3, () => 0, STARTER_IDS);
    const ids = picks.map((boon) => boon.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(picks).toHaveLength(3);
    expect(ids.every((id) => STARTER_IDS.includes(id))).toBe(true);
  });

  it("offers an evolution when the recipe is ready", () => {
    const stacks = { anaFold: 3 };
    expect(eligibleEvolutions(stacks).some((boon) => boon.id === "perpetual")).toBe(true);
    const picks = pickDraft(stacks, 3, () => 0, STARTER_IDS);
    expect(picks.some((boon) => boon.id === "perpetual")).toBe(true);
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

  it("lets Needle God shrink you and starve harder", () => {
    const mods = createMods({ needle: 1, thin: 2, appetite: 2 });
    expect(mods.hitScale).toBeLessThan(0.7);
    expect(mods.magnet).toBeGreaterThan(200);
  });
});

describe("hungerText", () => {
  it("counts down to the next draft", () => {
    const run = createRun();
    run.orbs = 2;
    expect(hungerText(run)).toBe("2 TO BOON");
    run.orbs = 4;
    expect(hungerText(run)).toBe("DRAFT");
  });
});

describe("slice combat", () => {
  it("lets you phase the opposite color except during sticky occupancy", () => {
    expect(shardCollides({ shardSlice: 1, polarity: 1, folding: false, bulkPhased: false })).toBe(true);
    expect(shardCollides({ shardSlice: -1, polarity: 1, folding: false, bulkPhased: false })).toBe(false);
    expect(shardCollides({ shardSlice: 1, polarity: 1, folding: true, bulkPhased: false })).toBe(false);
    expect(shardCollides({ shardSlice: 0, polarity: 1, folding: true, bulkPhased: true })).toBe(false);
    expect(shardCollides({ shardSlice: 0, polarity: 1, folding: true, bulkPhased: false })).toBe(true);
    expect(shardCollides({ shardSlice: -1, polarity: 1, folding: false, bulkPhased: false, twinSlice: true })).toBe(false);
  });

  it("pays aligned orbs, taxes mismatches, and detonates jackpots", () => {
    expect(orbMultiplier({ orbSlice: 1, polarity: 1, alignedStacks: 2 })).toBe(5);
    expect(orbMultiplier({ orbSlice: -1, polarity: 1, alignedStacks: 2 })).toBe(0.5);
    expect(orbMultiplier({ orbSlice: 0, polarity: 1, alignedStacks: 2 })).toBe(1);
    expect(orbMultiplier({ orbSlice: 0, polarity: 1, alignedStacks: 0, jackpot: true })).toBe(10);
  });

  it("names slices and can roll bulk", () => {
    expect(sliceName(1)).toBe("ANA");
    expect(sliceName(-1)).toBe("KATA");
    expect(pickSlice(() => 0, 0.2)).toBe(0);
    expect(pickSlice(() => 0.9, 0.2)).toBe(-1);
  });
});
