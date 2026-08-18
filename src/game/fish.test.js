import { describe, expect, it } from "vitest";
import { canHook, maxRarity, pickSpecies, speciesById } from "./fish.js";

describe("fish catalog", () => {
  it("caps rarity by sonar level", () => {
    expect(maxRarity(0)).toBe(2);
    expect(maxRarity(4)).toBe(5);
  });

  it("picks legal species from the pool", () => {
    const species = pickSpecies(() => 0.01, 1);
    expect(species.rarity).toBeLessThanOrEqual(2);
    expect(speciesById(species.id).id).toBe(species.id);
  });

  it("lets stronger line hook bigger fish", () => {
    const tuna = speciesById("tuna");
    expect(canHook(tuna, 0)).toBe(false);
    expect(canHook(tuna, 3)).toBe(true);
  });
});
