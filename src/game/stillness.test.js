import { describe, expect, it } from "vitest";
import {
  DEPTHS,
  arrivalInterval,
  depthForStillness,
  nextDepth,
  passBonus,
  stillnessRate,
  streakMultiplier,
  tierForDepth,
} from "./stillness.js";

describe("depth", () => {
  it("starts restless and ends at nothing", () => {
    expect(depthForStillness(0).name).toBe("Restless");
    expect(depthForStillness(99999).name).toBe("Nothing");
  });

  it("reports the next threshold until there is none", () => {
    expect(nextDepth(0).name).toBe("Idle");
    expect(nextDepth(DEPTHS[DEPTHS.length - 1].at)).toBe(null);
  });
});

describe("stillness accrual", () => {
  it("compounds uninterrupted quiet up to triple", () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(45)).toBe(3);
    expect(streakMultiplier(500)).toBe(3);
  });

  it("pays more the deeper and the longer you stay", () => {
    expect(stillnessRate(3, 45)).toBeGreaterThan(stillnessRate(3, 0));
    expect(stillnessRate(5, 10)).toBeGreaterThan(stillnessRate(0, 10));
  });

  it("rewards letting an event resolve on its own", () => {
    expect(passBonus(0)).toBeGreaterThan(0);
    expect(passBonus(5)).toBeGreaterThan(passBonus(0));
  });
});

describe("world pacing", () => {
  it("quiets the world as you settle", () => {
    expect(arrivalInterval(6)).toBeGreaterThan(arrivalInterval(0));
  });

  it("opens heavier events only at depth", () => {
    expect(tierForDepth(0)).toBe(1);
    expect(tierForDepth(3)).toBe(2);
    expect(tierForDepth(6)).toBe(3);
  });
});
