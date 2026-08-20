import { describe, expect, it } from "vitest";
import { clamp, distance, formatDuration, lerp, pointInRect } from "./utils.js";

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

describe("distance", () => {
  it("measures the straight line between points", () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
});

describe("pointInRect", () => {
  it("detects taps inside a card", () => {
    expect(pointInRect(10, 10, 0, 0, 20, 20)).toBe(true);
    expect(pointInRect(30, 10, 0, 0, 20, 20)).toBe(false);
  });
});

describe("formatDuration", () => {
  it("renders minutes and padded seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
  });
});
