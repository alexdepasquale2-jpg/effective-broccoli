import { describe, expect, it } from "vitest";
import { CROPS, WEAPONS, ALLIES, checkEvolution } from "./farmingData.js";
import { FarmPlot, createFarmGrid } from "./farmPlot.js";
import { Ally } from "./allySystem.js";

describe("Merge-Farming & Ally Summoning System", () => {
  it("defines all allies and crop summoning mappings", () => {
    expect(CROPS.parsnip.allySummon).toBe("carrotSprite");
    expect(CROPS.starfruit.allySummon).toBe("cosmicDragon");

    expect(ALLIES.carrotSprite.damage).toBeGreaterThan(0);
    expect(ALLIES.cosmicDragon.damage).toBeGreaterThan(ALLIES.carrotSprite.damage);
  });

  it("merges identical level crops up to Giant level 3", () => {
    const plotA = new FarmPlot(0, 0, 0);
    const plotB = new FarmPlot(1, 50, 0);

    plotA.plant("potato", 1);
    plotB.plant("potato", 1);

    expect(plotA.canMergeWith(plotB)).toBe(true);

    // Merge A into B -> B becomes level 2 (Large)
    const merge1 = plotA.mergeInto(plotB);
    expect(merge1.level).toBe(2);
    expect(merge1.isGiant).toBe(false);
    expect(plotA.crop).toBe(null);
    expect(plotB.crop.level).toBe(2);

    // Now plant another level 2 potato in plotA and merge into plotB -> Level 3 (Giant!)
    plotA.plant("potato", 2);
    expect(plotA.canMergeWith(plotB)).toBe(true);

    const merge2 = plotA.mergeInto(plotB);
    expect(merge2.level).toBe(3);
    expect(merge2.isGiant).toBe(true);

    // Harvest Giant crop -> summons ally!
    plotB.crop.progress = plotB.crop.maxTime; // Mature
    plotB.crop.isReady = true;

    const harvest = plotB.harvest();
    expect(harvest.isGiant).toBe(true);
    expect(harvest.allyType).toBe("potatoGolem");
    expect(harvest.yieldValue).toBeGreaterThan(CROPS.potato.yieldValue);
  });

  it("instantiates summon ally and checks attack routine", () => {
    const ally = new Ally("carrotSprite", 0, 0);
    expect(ally.name).toBe("Root Sprite");
    expect(ally.hp).toBe(120);

    const monster = {
      x: 100,
      y: 0,
      size: 15,
      takeDamage: (amt) => amt,
    };

    const projectiles = [];
    ally.update(1.0, [monster], 0, 0, (p) => projectiles.push(p), () => {});
    expect(projectiles.length).toBeGreaterThan(0);
  });

  it("includes unique weapons in WEAPONS registry", () => {
    expect(WEAPONS.eggBlaster).toBeDefined();
    expect(WEAPONS.seedGatling).toBeDefined();
    expect(WEAPONS.fertilizerMortar).toBeDefined();
    expect(WEAPONS.eggBlaster.evolutionReq).toBe("hayBale");
    expect(WEAPONS.seedGatling.evolutionReq).toBe("boots");
  });
});
