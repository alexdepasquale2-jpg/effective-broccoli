import { clamp } from "./utils.js";

const A = 0.16;
const B = 0.58;

export function perspT(t) {
  const u = Math.max(-0.25, t);
  return (u + A) / (u + A + B);
}

export function invertPerspT(p) {
  const q = clamp(p, 0.002, 0.997);
  return (q * (A + B) - A) / (1 - q);
}

export function createCamera() {
  return { shear: 0, punch: 0 };
}

export function vanishingPoint(world, camera) {
  const punch = camera.punch || 0;
  return {
    x: world.width * 0.5 + camera.shear * world.width * 0.3,
    y: world.height * (0.11 - punch * 0.05),
  };
}

export function projectPoint(wx, wy, world, camera) {
  const t = world.height <= 0 ? 0 : wy / world.height;
  const p = perspT(t);
  const vp = vanishingPoint(world, camera);
  const nearY = world.height * 0.93;
  const half = world.width * (0.05 + 0.46 * p);
  const nx = world.width <= 0 ? 0 : (wx - world.width * 0.5) / (world.width * 0.5);
  return {
    x: vp.x + nx * half,
    y: vp.y + (nearY - vp.y) * p,
    s: 0.14 + 1.02 * p,
    p,
    vpX: vp.x,
    vpY: vp.y,
    half,
  };
}

export function unprojectPoint(sx, sy, world, camera) {
  const vp = vanishingPoint(world, camera);
  const nearY = world.height * 0.93;
  const span = Math.max(8, nearY - vp.y);
  const p = clamp((sy - vp.y) / span, 0.002, 0.997);
  const t = invertPerspT(p);
  const half = world.width * (0.05 + 0.46 * p);
  const nx = half === 0 ? 0 : (sx - vp.x) / half;
  return {
    x: world.width * 0.5 + nx * world.width * 0.5,
    y: t * world.height,
    p,
  };
}

export function floorCorners(world, camera) {
  const farLeft = projectPoint(0, 0, world, camera);
  const farRight = projectPoint(world.width, 0, world, camera);
  const nearLeft = projectPoint(0, world.height, world, camera);
  const nearRight = projectPoint(world.width, world.height, world, camera);
  return { farLeft, farRight, nearLeft, nearRight, vp: vanishingPoint(world, camera) };
}
