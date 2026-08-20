import { describe, expect, it } from 'vitest';
import { PHYSICS, TICK_S } from './constants.ts';
import { stepBody, type Body } from './physics.ts';
import { levelForXp, levelProgress, xpForLevel } from './skills.ts';

const GROUND = [{ x1: 0, x2: 1000, y: 500 }];

function body(over: Partial<Body> = {}): Body {
  return { x: 100, y: 500, vx: 0, vy: 0, grounded: true, facing: 1, ...over };
}

describe('stepBody', () => {
  it('walks right and faces the direction of travel', () => {
    const b = body();
    stepBody(b, { dx: 1, jump: false }, GROUND, 1000);
    expect(b.x).toBeGreaterThan(100);
    expect(b.facing).toBe(1);
  });

  it('comes to rest when input stops', () => {
    const b = body({ vx: 200 });
    for (let i = 0; i < 30; i++) stepBody(b, { dx: 0, jump: false }, GROUND, 1000);
    expect(b.vx).toBe(0);
  });

  it('jumps and lands back on the platform', () => {
    const b = body();
    stepBody(b, { dx: 0, jump: true }, GROUND, 1000);
    expect(b.grounded).toBe(false);
    expect(b.y).toBeLessThan(500);

    let ticks = 0;
    while (!b.grounded && ticks++ < 200) stepBody(b, { dx: 0, jump: false }, GROUND, 1000);

    expect(b.grounded).toBe(true);
    expect(b.y).toBe(500);
  });

  it('cannot double jump while airborne', () => {
    const b = body();
    stepBody(b, { dx: 0, jump: true }, GROUND, 1000);
    const apexVy = b.vy;
    stepBody(b, { dx: 0, jump: true }, GROUND, 1000);
    // Second jump is ignored, so vy only ever increases under gravity.
    expect(b.vy).toBeGreaterThan(apexVy);
  });

  it('clamps to world bounds', () => {
    const b = body({ x: 5 });
    for (let i = 0; i < 20; i++) stepBody(b, { dx: -1, jump: false }, GROUND, 1000);
    expect(b.x).toBe(PHYSICS.playerHalfWidth);
    expect(b.vx).toBe(0);
  });

  it('falls through a gap between platforms', () => {
    const split = [
      { x1: 0, x2: 200, y: 500 },
      { x1: 400, x2: 1000, y: 500 },
    ];
    const b = body({ x: 300, y: 480, grounded: false });
    for (let i = 0; i < 10; i++) stepBody(b, { dx: 0, jump: false }, split, 1000);
    expect(b.grounded).toBe(false);
    expect(b.y).toBeGreaterThan(500);
  });

  it('is deterministic, so client prediction can replay it', () => {
    const inputs = [
      { dx: 1, jump: true },
      { dx: 1, jump: false },
      { dx: 0, jump: false },
      { dx: -1, jump: false },
    ];
    const run = () => {
      const b = body();
      for (const i of inputs) stepBody(b, i, GROUND, 1000);
      return b;
    };
    expect(run()).toEqual(run());
  });

  it('respects an explicit dt', () => {
    const slow = body();
    const fast = body();
    stepBody(slow, { dx: 0, jump: false }, [], 1000, TICK_S);
    stepBody(fast, { dx: 0, jump: false }, [], 1000, TICK_S * 2);
    expect(Math.abs(fast.y - 500)).toBeGreaterThan(Math.abs(slow.y - 500));
  });
});

describe('skill curve', () => {
  it('starts everyone at level 1 with no xp', () => {
    expect(levelForXp(0)).toBe(1);
    expect(xpForLevel(1)).toBe(0);
  });

  it('increases monotonically', () => {
    for (let l = 1; l < 20; l++) {
      expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    }
  });

  it('reports the level matching the xp threshold', () => {
    for (let l = 1; l < 20; l++) {
      expect(levelForXp(xpForLevel(l))).toBe(l);
      expect(levelForXp(xpForLevel(l + 1) - 1)).toBe(l);
    }
  });

  it('reports progress within a level', () => {
    expect(levelProgress(xpForLevel(5))).toBe(0);
    expect(levelProgress(xpForLevel(6) - 1)).toBeGreaterThan(0.9);
    expect(levelProgress(-10)).toBe(0);
  });
});
