import { describe, expect, it } from "vitest";
import { actionLabel, applyAction, buildingAt, clockLabel, createHero, missingNeed, wellPayout } from "./rpg.js";

describe("Stick RPG time and needs", () => {
  it("prints a 12-hour clock", () => {
    expect(clockLabel(8)).toBe("8:00 AM");
    expect(clockLabel(0)).toBe("12:00 AM");
    expect(clockLabel(17)).toBe("5:00 PM");
  });

  it("blocks jobs you are too dumb or broke for", () => {
    const hero = createHero();
    expect(missingNeed(hero, { need: { int: 8 } })).toMatch(/INT/);
    expect(missingNeed(hero, { need: { cash: 40 }, cash: -40 })).toMatch(/\$40/);
  });

  it("pays, trains, and burns hours", () => {
    const hero = createHero();
    const result = applyAction(hero, { id: "flip", hours: 4, cash: 36, text: "grease" });
    expect(result.ok).toBe(true);
    expect(result.hero.cash).toBe(56);
    expect(result.hero.hour).toBe(12);
  });

  it("sleeps to 8 AM next day and heals", () => {
    const hero = { ...createHero(), hour: 23, hp: 10, day: 2 };
    const result = applyAction(hero, { id: "sleep", hours: 8, hp: 50 });
    expect(result.hero.hour).toBe(8);
    expect(result.hero.day).toBe(3);
    expect(result.hero.hp).toBe(100);
  });

  it("turns well scores into greasy cash", () => {
    expect(wellPayout(0)).toBe(8);
    expect(wellPayout(70)).toBe(10);
  });

  it("finds a building under a street x", () => {
    expect(buildingAt(180).id).toBe("pad");
    expect(buildingAt(10)).toBeNull();
  });

  it("pins a cool hat to your inventory", () => {
    const hero = { ...createHero(), cash: 40 };
    const result = applyAction(hero, {
      id: "hat",
      hours: 1,
      cha: 3,
      cash: -40,
      item: "hat",
      text: "hat",
    });
    expect(result.ok).toBe(true);
    expect(result.hero.items.hat).toBe(true);
    expect(result.hero.cha).toBe(4);
  });

  it("labels jobs like a Flash tooltip", () => {
    expect(actionLabel({ name: "Flip burgers", hours: 4, cash: 36 })).toBe("Flip burgers · 4h · +$36");
  });
});
