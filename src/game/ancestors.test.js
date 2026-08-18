import { describe, expect, it } from "vitest";
import {
  bumpProgress,
  createClan,
  evolutionLeap,
  interact,
  investigate,
  leapReady,
  reinforce,
  rest,
  speciesFor,
} from "./ancestors.js";

describe("ancestors clan sim", () => {
  it("starts as a scared sahelanthropus", () => {
    const clan = createClan();
    expect(speciesFor(clan).name).toContain("Sahelanthropus");
    expect(clan.known).toContain("camp");
  });

  it("maps fear nodes and discovers amygdala", () => {
    let clan = createClan();
    const grove = { id: "grove", type: "fear", name: "Dark Grove", fear: 48, trigger: "amygdala" };
    const result = investigate(clan, grove);
    expect(result.ok).toBe(true);
    expect(result.clan.known).toContain("grove");
    clan = bumpProgress(result.clan, "amygdala", 1);
    expect(clan.discovered).toContain("amygdala");
  });

  it("eats berries and reinforces olfactory at camp", () => {
    let clan = createClan();
    clan = bumpProgress(clan, "olfactory", 2);
    expect(clan.discovered).toContain("olfactory");
    clan = { ...clan, neuronalEnergy: 2 };
    const reinforced = reinforce(clan, "olfactory");
    expect(reinforced.ok).toBe(true);
    expect(reinforced.clan.reinforced).toContain("olfactory");

    const berries = { id: "berries", type: "food", name: "Berry Bush", fear: 8, trigger: "olfactory", energy: 28 };
    const meal = interact(reinforced.clan, berries);
    expect(meal.ok).toBe(true);
    expect(meal.clan.energy).toBeGreaterThan(reinforced.clan.energy);
  });

  it("rests into neuronal energy", () => {
    const clan = createClan();
    const slept = rest(clan);
    expect(slept.clan.neuronalEnergy).toBeGreaterThan(clan.neuronalEnergy);
    expect(slept.clan.energy).toBeGreaterThan(clan.energy);
  });

  it("leaps generation after leap neuron and five reinforcements", () => {
    let clan = createClan();
    const ids = ["motricity", "olfactory", "amygdala", "bonding", "striking", "predator", "leap"];
    clan = { ...clan, discovered: ids, neuronalEnergy: 30, reinforced: [] };
    for (const id of ids) {
      clan = reinforce(clan, id).clan;
    }
    expect(leapReady(clan)).toBe(true);
    const leap = evolutionLeap(clan);
    expect(leap.ok).toBe(true);
    expect(leap.clan.generation).toBe(1);
    expect(leap.clan.reinforced).toContain("motricity");
  });
});
