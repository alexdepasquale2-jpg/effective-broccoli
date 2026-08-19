import { describe, expect, it } from "vitest";
import {
  CROPS,
  WEAPONS,
  PASSIVES,
  checkEvolution,
  META_UPGRADES,
  MONSTERS,
  ALLIES,
} from "./farmingData.js";

describe("FarmSurvivor Data Models", () => {
  it("defines all initial starter crops, weapons, and allies", () => {
    expect(CROPS.parsnip.yieldValue).toBeGreaterThan(0);
    expect(CROPS.starfruit.growTime).toBeGreaterThan(CROPS.parsnip.growTime);

    expect(WEAPONS.scythe.evolutionReq).toBe("fertilizer");
    expect(WEAPONS.sprinkler.evolutionReq).toBe("wateringCan");
    expect(WEAPONS.eggBlaster.evolutionReq).toBe("hayBale");
    expect(WEAPONS.seedGatling.evolutionReq).toBe("boots");
    expect(WEAPONS.fertilizerMortar.evolutionReq).toBe("honeyComb");
    expect(PASSIVES.fertilizer.stat).toBe("damageMult");
    expect(ALLIES.cosmicDragon.hp).toBe(1000);
  });

  it("checks weapon evolution conditions properly", () => {
    const inventory = {
      weapons: { scythe: 5 },
      passives: { fertilizer: 1 },
    };
    expect(checkEvolution("scythe", 5, inventory)).toBe(true);

    // If passive missing, evolution is false
    const noPassiveInventory = {
      weapons: { scythe: 5 },
      passives: {},
    };
    expect(checkEvolution("scythe", 5, noPassiveInventory)).toBe(false);

    // If weapon not at max level (5), evolution is false
    expect(checkEvolution("scythe", 4, inventory)).toBe(false);
  });

  it("defines scaling costs for meta upgrades", () => {
    const startingGold = META_UPGRADES.find((m) => m.id === "startingGold");
    expect(startingGold.cost(0)).toBe(100);
    expect(startingGold.cost(1)).toBe(250);
  });

  it("defines monster stats and behaviors", () => {
    expect(MONSTERS.crow.hp).toBeLessThan(MONSTERS.werewolf.hp);
    expect(MONSTERS.werewolf.isBoss).toBe(true);
  });
});
