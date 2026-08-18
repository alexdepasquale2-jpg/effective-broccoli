export const STARTER_IDS = ["anaFold", "echo", "appetite", "hypercombo"];

export const UNLOCK_LADDER = [
  { xp: 40, id: "thin" },
  { xp: 90, id: "burst" },
  { xp: 150, id: "glass" },
  { xp: 220, id: "orbit" },
  { xp: 300, id: "aligned" },
  { xp: 390, id: "tessellate" },
  { xp: 490, id: "bulkCurse" },
  { xp: 600, id: "frenzy" },
  { xp: 730, id: "cascade" },
  { xp: 880, id: "twinSlice" },
  { xp: 1050, id: "jackpot" },
  { xp: 1240, id: "hungryGhosts" },
  { xp: 1460, id: "splitRank" },
];

export const TITLES = [
  { xp: 0, name: "Slice Whelp" },
  { xp: 40, name: "Fold Beggar" },
  { xp: 150, name: "Boon Addict" },
  { xp: 390, name: "Tessellate Fiend" },
  { xp: 600, name: "Dimension Whale" },
  { xp: 1050, name: "Arcade God" },
  { xp: 1460, name: "4D Problem" },
];

export function emptyMeta() {
  return {
    xp: 0,
    best: 0,
    totalRuns: 0,
    totalScore: 0,
    unlocked: STARTER_IDS.slice(),
    seen: [],
  };
}

export function runXp({ score, orbs, drafts }) {
  return Math.max(0, Math.floor(Number(score) || 0) + (orbs || 0) * 10 + (drafts || 0) * 30);
}

export function titleForXp(xp) {
  let name = TITLES[0].name;
  for (const title of TITLES) {
    if (xp >= title.xp) name = title.name;
  }
  return name;
}

export function nextUnlock(meta, ladder = UNLOCK_LADDER) {
  const owned = new Set(meta.unlocked);
  const next = ladder.find((row) => !owned.has(row.id));
  if (!next) return null;
  return {
    id: next.id,
    xp: next.xp,
    have: meta.xp,
    need: Math.max(0, next.xp - meta.xp),
    progress: Math.min(1, meta.xp / next.xp),
  };
}

export function applyRunToMeta(meta, stats, ladder = UNLOCK_LADDER) {
  const gained = runXp(stats);
  const before = meta.xp;
  meta.xp += gained;
  meta.totalRuns += 1;
  meta.totalScore += Math.max(0, Math.floor(stats.score || 0));
  meta.best = Math.max(meta.best || 0, Math.floor(stats.score || 0));
  const unlocks = ladder.filter((row) => before < row.xp && meta.xp >= row.xp && !meta.unlocked.includes(row.id));
  for (const row of unlocks) meta.unlocked.push(row.id);
  return {
    gained,
    unlocks: unlocks.map((row) => row.id),
    next: nextUnlock(meta, ladder),
    title: titleForXp(meta.xp),
  };
}
