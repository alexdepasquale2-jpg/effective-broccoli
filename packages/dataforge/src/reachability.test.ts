import { describe, expect, it } from 'vitest';
import { LocationSchema, maxJumpHeight, type Location } from '@glimmer/shared';
import { checkReachability } from './reachability.ts';

function location(over: Partial<Location> = {}): Location {
  return LocationSchema.parse({
    id: 'test',
    name: 'Test',
    width: 2400,
    height: 900,
    spawn: { x: 300, y: 700 },
    platforms: [{ x1: 0, x2: 2400, y: 700 }],
    entities: [],
    ...over,
  });
}

const tree = (x: number, y: number, id = 'tree') => ({
  id,
  kind: 'tree' as const,
  x,
  y,
  verbs: ['harvest' as const],
  cooldownMs: 1000,
  yield: { item: 'apple', min: 1, max: 1, skill: 'light_green_thumb_1', xp: 5 },
});

describe('checkReachability', () => {
  it('accepts a tree standing on the ground', () => {
    expect(checkReachability(location({ entities: [tree(500, 700)] }))).toEqual([]);
  });

  it('accepts a ledge within a jump of the ground', () => {
    const jump = maxJumpHeight();
    const y = Math.round(700 - jump + 10);
    const loc = location({
      platforms: [
        { x1: 0, x2: 2400, y: 700 },
        { x1: 700, x2: 1000, y },
      ],
      entities: [tree(850, y)],
    });
    expect(checkReachability(loc)).toEqual([]);
  });

  it('rejects a ledge just out of jump range -- the bug this check exists for', () => {
    // 140px above ground, which reads fine in a location file and is not
    // reachable: a jump clears ~112px.
    const loc = location({
      platforms: [
        { x1: 0, x2: 2400, y: 700 },
        { x1: 760, x2: 1040, y: 560 },
      ],
      entities: [tree(900, 560)],
    });
    const problems = checkReachability(loc);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.map((p) => p.kind)).toContain('unreachable-platform');
  });

  it('allows climbing a staircase of ledges that would be unreachable in one jump', () => {
    const loc = location({
      platforms: [
        { x1: 0, x2: 2400, y: 700 },
        { x1: 1300, x2: 1620, y: 610 },
        { x1: 1360, x2: 1560, y: 520 },
      ],
      entities: [tree(1460, 520)],
    });
    expect(checkReachability(loc)).toEqual([]);
  });

  it('rejects an entity floating in mid-air', () => {
    const loc = location({ entities: [tree(500, 400)] });
    expect(checkReachability(loc).map((p) => p.kind)).toContain('floating-entity');
  });

  it('ignores decor, which nobody needs to reach', () => {
    const loc = location({
      platforms: [
        { x1: 0, x2: 2400, y: 700 },
        { x1: 760, x2: 1040, y: 300 },
      ],
      entities: [{ id: 'cloud', kind: 'decor', x: 900, y: 300, verbs: [], cooldownMs: 0 }],
    });
    expect(checkReachability(loc)).toEqual([]);
  });

  it('rejects a spawn point floating over nothing', () => {
    const loc = location({ spawn: { x: 3000, y: 700 } });
    expect(checkReachability(loc).map((p) => p.kind)).toContain('unreachable-platform');
  });

  it('passes the authored bootstrap location', async () => {
    const { readFile } = await import('node:fs/promises');
    const raw = JSON.parse(
      await readFile(
        new URL('../../content/authored/locations/home-street.json', import.meta.url),
        'utf8',
      ),
    );
    expect(checkReachability(LocationSchema.parse(raw))).toEqual([]);
  });
});
