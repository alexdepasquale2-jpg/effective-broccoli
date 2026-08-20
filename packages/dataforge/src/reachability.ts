import { PHYSICS, maxJumpHeight, type Location, type Platform } from '@glimmer/shared';

/**
 * Static reachability check for a location.
 *
 * A location file is easy to write and impossible to eyeball: a ledge 140px
 * above the ground reads exactly like one 100px above it, but only one of them
 * can be stood on. Rather than discover that by playing, the build rejects it.
 *
 * The model is deliberately conservative -- it answers "could a player get
 * here at all", not "is it fun" -- so it never fails a location that is
 * genuinely playable.
 */

/** Horizontal slack when stepping between platforms, from jump airtime. */
const HORIZONTAL_REACH = PHYSICS.walkSpeed * 0.7;

function overlapsHorizontally(a: Platform, b: Platform, slack: number): boolean {
  return a.x1 - slack <= b.x2 && b.x1 - slack <= a.x2;
}

/** Can a player standing on `from` get onto `to`? */
function canStepBetween(from: Platform, to: Platform, jump: number): boolean {
  if (!overlapsHorizontally(from, to, HORIZONTAL_REACH)) return false;
  // Upward: only within a jump. Downward: always, by walking off the edge.
  const rise = from.y - to.y;
  return rise <= jump;
}

export interface ReachabilityProblem {
  kind: 'unreachable-platform' | 'floating-entity' | 'unreachable-entity';
  detail: string;
}

export function checkReachability(loc: Location): ReachabilityProblem[] {
  const problems: ReachabilityProblem[] = [];
  const jump = maxJumpHeight();
  const platforms = loc.platforms;

  // The spawn platform is whichever the player first lands on: the highest
  // platform at or below the spawn point, spanning the spawn x.
  const spawnCandidates = platforms
    .filter((p) => loc.spawn.x >= p.x1 && loc.spawn.x <= p.x2 && p.y >= loc.spawn.y)
    .sort((a, b) => a.y - b.y);
  const start = spawnCandidates[0];

  if (!start) {
    problems.push({
      kind: 'unreachable-platform',
      detail: `spawn (${loc.spawn.x}, ${loc.spawn.y}) is not above any platform`,
    });
    return problems;
  }

  // Flood fill from the spawn platform.
  const reached = new Set<Platform>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of platforms) {
      if (reached.has(next)) continue;
      if (!canStepBetween(current, next, jump)) continue;
      reached.add(next);
      queue.push(next);
    }
  }

  for (const p of platforms) {
    if (reached.has(p)) continue;
    // A platform nobody can reach is only a problem if something is on it.
    const carries = loc.entities.some(
      (e) => e.verbs.length > 0 && e.y === p.y && e.x >= p.x1 && e.x <= p.x2,
    );
    if (carries) {
      problems.push({
        kind: 'unreachable-platform',
        detail: `platform y=${p.y} x=${p.x1}..${p.x2} holds a usable entity but cannot be reached (jump clears ${jump.toFixed(0)}px)`,
      });
    }
  }

  for (const e of loc.entities) {
    if (e.verbs.length === 0) continue;

    const stands = platforms.find((p) => e.x >= p.x1 && e.x <= p.x2 && Math.abs(e.y - p.y) < 1);
    if (!stands) {
      problems.push({
        kind: 'floating-entity',
        detail: `entity "${e.id}" at (${e.x}, ${e.y}) does not sit on any platform`,
      });
      continue;
    }
    if (!reached.has(stands)) {
      problems.push({
        kind: 'unreachable-entity',
        detail: `entity "${e.id}" sits on a platform no player can reach`,
      });
    }
  }

  return problems;
}
