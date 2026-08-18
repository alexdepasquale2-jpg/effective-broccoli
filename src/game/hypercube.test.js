import { describe, expect, it } from "vitest";
import {
  cell16EdgeCount,
  hypersphereSliceRadius,
  norm4,
  project4to2,
  rotate4,
  tesseractEdgeCount,
  tesseractFaceCount,
  tesseractVertexCount,
} from "./hypercube.js";

describe("4D polytopes", () => {
  it("uses a tesseract with 16 vertices, 32 edges, and 24 cells-faces", () => {
    expect(tesseractVertexCount()).toBe(16);
    expect(tesseractEdgeCount()).toBe(32);
    expect(tesseractFaceCount()).toBe(24);
  });

  it("uses a 16-cell dual with 24 edges", () => {
    expect(cell16EdgeCount()).toBe(24);
  });
});

describe("rotate4", () => {
  it("preserves 4D length", () => {
    const point = { x: 1, y: -1, z: 0.5, w: 0.25 };
    const rotated = rotate4(point, { xy: 0.4, xz: 1.2, xw: 0.7, yz: 2.1, yw: 0.3, zw: 1.5 });
    expect(norm4(rotated)).toBeCloseTo(norm4(point), 8);
  });
});

describe("project4to2", () => {
  it("maps a 4D point to finite 2D coordinates", () => {
    const projected = project4to2({ x: 1, y: 1, z: 1, w: 1 });
    expect(Number.isFinite(projected.x)).toBe(true);
    expect(Number.isFinite(projected.y)).toBe(true);
  });
});

describe("hypersphereSliceRadius", () => {
  it("is the 3-sphere radius of a 4-sphere sliced at w", () => {
    expect(hypersphereSliceRadius(0, 1)).toBeCloseTo(1);
    expect(hypersphereSliceRadius(1, 1)).toBe(0);
    expect(hypersphereSliceRadius(0.6, 1)).toBeCloseTo(Math.sqrt(1 - 0.36));
  });
});
