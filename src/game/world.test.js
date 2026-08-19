import { describe, expect, it } from "vitest";
import {
  DOMAINS,
  SEASONS,
  applyEffects,
  conditionOf,
  createWorld,
  seasonFor,
  seedWeights,
  weakestDomain,
  worldAverage,
  worldVerdict,
} from "./world.js";

describe("world", () => {
  it("starts with every domain in play", () => {
    const world = createWorld();
    for (const domain of DOMAINS) {
      expect(world.domains[domain.id]).toBeGreaterThan(0);
    }
  });

  it("applies effects and clamps them to the range", () => {
    const world = createWorld();
    expect(applyEffects(world, { kin: 10 }).domains.kin).toBe(world.domains.kin + 10);
    expect(applyEffects(world, { kin: -999 }).domains.kin).toBe(0);
    expect(applyEffects(world, { kin: 999 }).domains.kin).toBe(100);
    expect(applyEffects(world, { nonsense: 5 }).domains.nonsense).toBeUndefined();
  });

  it("names the condition of each place", () => {
    const world = applyEffects(createWorld(), { town: -56 });
    expect(conditionOf(world, "town").key).toBe("failing");
    expect(conditionOf(applyEffects(createWorld(), { town: 40 }), "town").key).toBe("flourishing");
  });

  it("turns the season as days pass", () => {
    expect(seasonFor(1).id).toBe(SEASONS[0].id);
    expect(seasonFor(12).id).toBe(SEASONS[3].id);
  });

  it("seeds more trouble where the world is weakest", () => {
    const world = applyEffects(createWorld(), { work: -40 });
    expect(weakestDomain(world)).toBe("work");
    const weights = seedWeights(world);
    expect(weights.work).toBeGreaterThan(weights.self);
  });

  it("judges the valley you leave behind", () => {
    const good = applyEffects(createWorld(), { self: 30, kin: 30, work: 30, town: 30, world: 40 });
    const bad = applyEffects(createWorld(), { self: -50, kin: -50, work: -50, town: -50, world: -40 });
    expect(worldAverage(good)).toBeGreaterThan(worldAverage(bad));
    expect(worldVerdict(good)).not.toBe(worldVerdict(bad));
  });
});
