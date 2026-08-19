import { describe, expect, it } from "vitest";
import {
  attuneLevel,
  autoRevealed,
  canAfford,
  costOf,
  createResources,
  depthFor,
  fatigueMultiplier,
  gainAttunement,
  nextDepth,
  pressureFor,
  spend,
  stillnessRate,
  streakMultiplier,
  vitalityRate,
} from "./resources.js";

describe("pressure", () => {
  it("rewards matching the moment and punishes both directions equally", () => {
    expect(pressureFor("pass", "pass")).toBe(-2);
    expect(pressureFor("tend", "tend")).toBe(-2);
    expect(pressureFor("act", "pass")).toBe(pressureFor("pass", "act"));
    expect(pressureFor("tend", "pass")).toBe(1);
  });
});

describe("costs", () => {
  it("makes doing nothing the only free move", () => {
    expect(costOf("pass").vitality).toBe(0);
    expect(costOf("tend").vitality).toBeGreaterThan(0);
    expect(costOf("act").vitality).toBeGreaterThan(costOf("tend").vitality);
  });

  it("makes each intervention in a day heavier than the last", () => {
    expect(fatigueMultiplier(0)).toBe(1);
    expect(costOf("act", 4).vitality).toBeGreaterThan(costOf("act", 0).vitality);
    expect(costOf("pass", 4).vitality).toBe(0);
  });

  it("spends vitality and stillness, and only fatigues on intervention", () => {
    const base = { ...createResources(), stillness: 200 };
    const acted = spend(base, "act");
    expect(acted.vitality).toBeLessThan(base.vitality);
    expect(acted.stillness).toBeLessThan(base.stillness);
    expect(acted.fatigue).toBe(1);
    expect(spend(base, "pass").fatigue).toBe(0);
  });

  it("blocks actions you cannot pay for", () => {
    const drained = { ...createResources(), vitality: 4 };
    expect(canAfford(drained, "pass")).toBe(true);
    expect(canAfford(drained, "act")).toBe(false);
  });
});

describe("stillness and rest", () => {
  it("compounds uninterrupted quiet and pays more at depth", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(40)).toBe(3);
    expect(stillnessRate(4, 40)).toBeGreaterThan(stillnessRate(0, 0));
  });

  it("only restores you properly once you have actually settled", () => {
    expect(vitalityRate(10, 0)).toBeGreaterThan(vitalityRate(1, 0));
  });

  it("names depths and the next threshold", () => {
    expect(depthFor(0).name).toBe("Restless");
    expect(depthFor(99999).name).toBe("Nothing");
    expect(nextDepth(0).name).toBe("Idle");
  });
});

describe("attunement", () => {
  it("reads loud things before quiet ones", () => {
    expect(attuneLevel(0).reveals).toBe("none");
    const noticing = gainAttunement(createResources(), 35);
    expect(autoRevealed(noticing, { loud: true })).toBe(true);
    expect(autoRevealed(noticing, { loud: false })).toBe(false);

    const clear = gainAttunement(createResources(), 150);
    expect(autoRevealed(clear, { loud: false })).toBe(true);
  });
});
