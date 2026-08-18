import { describe, expect, it } from "vitest";
import {
  circleHit,
  clamp,
  comboMultiplier,
  keepAwayFrom,
  lerp,
  orbPoints,
  spawnIntervals,
} from "./utils.js";

describe("clamp", () => {
  it("limits values to the inclusive range", () => {
    expect(clamp(3, 0, 2)).toBe(2);
    expect(clamp(-1, 0, 2)).toBe(0);
    expect(clamp(1, 0, 2)).toBe(1);
  });
});

describe("lerp", () => {
  it("interpolates between two values", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(2, 6, 0)).toBe(2);
    expect(lerp(2, 6, 1)).toBe(6);
  });
});

describe("circleHit", () => {
  it("detects overlapping circles", () => {
    expect(circleHit(0, 0, 10, 15, 0, 6)).toBe(true);
    expect(circleHit(0, 0, 10, 20, 0, 6)).toBe(false);
  });

  it("counts exact edge contact as a hit", () => {
    expect(circleHit(0, 0, 10, 16, 0, 6)).toBe(true);
  });
});

describe("scoring", () => {
  it("raises the multiplier with combo", () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(5)).toBe(2);
  });

  it("awards rounded orb points from the combo", () => {
    expect(orbPoints(1)).toBe(10);
    expect(orbPoints(5)).toBe(20);
  });
});

describe("spawnIntervals", () => {
  it("speeds up as time passes but stays above a floor", () => {
    const early = spawnIntervals(0);
    const late = spawnIntervals(90);
    expect(late.orb).toBeLessThan(early.orb);
    expect(late.shard).toBeLessThan(early.shard);
    expect(late.shardSpeed).toBeGreaterThan(early.shardSpeed);
    expect(late.orb).toBeGreaterThanOrEqual(0.32);
    expect(late.shard).toBeGreaterThanOrEqual(0.26);
  });
});

describe("keepAwayFrom", () => {
  it("pushes a spawn point away from the player", () => {
    const overlap = keepAwayFrom(100, 100, 100, 100, 80);
    expect(overlap).toEqual({ x: 180, y: 100 });

    const near = keepAwayFrom(110, 100, 100, 100, 50);
    expect(Math.hypot(near.x - 100, near.y - 100)).toBeCloseTo(50);
  });
});
