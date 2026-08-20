/**
 * XP curve. Level n requires BASE * n^EXP cumulative XP.
 * Deliberately gentle: Glitch was a game about pottering about, not grinding.
 */
const BASE = 100;
const EXP = 1.6;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE * Math.pow(level - 1, EXP));
}

export function levelForXp(xp: number): number {
  if (xp < 0) return 1;
  let level = 1;
  while (level < 99 && xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** Progress through the current level, 0..1. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  if (ceil <= floor) return 1;
  return Math.min(1, Math.max(0, (xp - floor) / (ceil - floor)));
}
