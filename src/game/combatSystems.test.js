import { describe, expect, it } from "vitest";
import {
  createPlayerStats,
  recomputePlayerStats,
  pickLevelUpOptions,
  getRequiredXp,
} from "./combatSystems.js";

describe("Combat & Level-Up Systems", () => {
  it("initializes player stats and applies passive upgrades", () => {
    const baseStats = createPlayerStats({ vitality: 2, tractor: 1 });
    expect(baseStats.maxHp).toBe(150);
    expect(baseStats.cropSpeedMult).toBe(1.2);

    const recomputed = recomputePlayerStats(baseStats, {
      fertilizer: 2, // +30% dmg
      wateringCan: 2, // -20% cd
      boots: 2, // +24% speed
    });

    expect(recomputed.damageMult).toBeCloseTo(1.3);
    expect(recomputed.cooldownMult).toBeCloseTo(0.8);
    expect(recomputed.speedMult).toBeCloseTo(1.24);
  });

  it("generates level up draft options based on inventory", () => {
    const inventory = {
      weapons: { scythe: 1 },
      passives: {},
      evolutions: {},
    };

    const options = pickLevelUpOptions(inventory);
    expect(options.length).toBeGreaterThanOrEqual(1);
    expect(options.length).toBeLessThanOrEqual(3);
  });

  it("calculates XP thresholds progressively", () => {
    expect(getRequiredXp(1)).toBe(5);
    expect(getRequiredXp(5)).toBeGreaterThan(getRequiredXp(2));
    expect(getRequiredXp(25)).toBeGreaterThan(getRequiredXp(15));
  });
});
