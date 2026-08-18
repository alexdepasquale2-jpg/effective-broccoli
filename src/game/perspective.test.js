import { describe, expect, it } from "vitest";
import { invertPerspT, perspT, projectPoint, unprojectPoint } from "./perspective.js";

const world = { width: 400, height: 800 };
const camera = { shear: 0.2, punch: 0 };

describe("perspective mapping", () => {
  it("inverts the depth curve", () => {
    expect(invertPerspT(perspT(0.4))).toBeCloseTo(0.4, 5);
  });

  it("round-trips a floor point through the 4D well camera", () => {
    const projected = projectPoint(120, 520, world, camera);
    const back = unprojectPoint(projected.x, projected.y, world, camera);
    expect(back.x).toBeCloseTo(120, 0);
    expect(back.y).toBeCloseTo(520, 0);
  });

  it("makes nearer points larger and lower on screen", () => {
    const far = projectPoint(200, 80, world, camera);
    const near = projectPoint(200, 720, world, camera);
    expect(near.s).toBeGreaterThan(far.s);
    expect(near.y).toBeGreaterThan(far.y);
  });

  it("shears the vanishing point with ANA/KATA", () => {
    const ana = projectPoint(200, 400, world, { shear: 1, punch: 0 });
    const kata = projectPoint(200, 400, world, { shear: -1, punch: 0 });
    expect(ana.vpX).toBeGreaterThan(kata.vpX);
  });
});
