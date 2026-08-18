export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function damp(from, to, lambda, dt) {
  return lerp(from, to, 1 - Math.exp(-lambda * dt));
}

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function circleHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const range = ar + br;
  return dx * dx + dy * dy <= range * range;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

export function comboMultiplier(combo) {
  return 1 + Math.max(0, combo - 1) * 0.25;
}

export function orbPoints(combo) {
  return Math.round(10 * comboMultiplier(combo));
}

export function spawnIntervals(elapsedSeconds) {
  const t = Math.max(0, elapsedSeconds);
  return {
    orb: Math.max(0.32, 0.85 - t * 0.006),
    shard: Math.max(0.26, 1.2 - t * 0.014),
    shardSpeed: 90 + t * 6,
  };
}

export function keepAwayFrom(x, y, px, py, minDistance) {
  const d = distance(x, y, px, py);
  if (d >= minDistance) {
    return { x, y };
  }
  if (d === 0) {
    return { x: px + minDistance, y: py };
  }
  const scale = minDistance / d;
  return {
    x: px + (x - px) * scale,
    y: py + (y - py) * scale,
  };
}
