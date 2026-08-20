// Four verbs, four prices. Doing nothing is the only free one.
export const CHOICES = ["pass", "watch", "tend", "act"];

export const COSTS = {
  pass: { vitality: 0, stillness: 0 },
  watch: { vitality: 3, stillness: -4 },
  tend: { vitality: 8, stillness: -10 },
  act: { vitality: 22, stillness: -26 },
};

// How far a choice sits from what the moment actually called for.
// Watching is not a choice; it reads the moment and leaves it open.
const REACH = { pass: 0, tend: 1, act: 2 };

export function pressureFor(choice, need) {
  const distance = Math.abs(REACH[choice] - REACH[need]);
  if (distance === 0) return -2;
  if (distance === 1) return 1;
  return 4;
}

export function createResources() {
  return {
    stillness: 0,
    peakStillness: 0,
    vitality: 100,
    vitalityMax: 100,
    standing: 50,
    attunement: 0,
    fatigue: 0,
    collapses: 0,
  };
}

export const DEPTHS = [
  { level: 0, name: "Restless", at: 0 },
  { level: 1, name: "Idle", at: 80 },
  { level: 2, name: "Settling", at: 220 },
  { level: 3, name: "Still", at: 460 },
  { level: 4, name: "Quiet", at: 820 },
  { level: 5, name: "Deep", at: 1320 },
  { level: 6, name: "Vast", at: 2000 },
  { level: 7, name: "Nothing", at: 2900 },
];

export function depthFor(stillness) {
  let found = DEPTHS[0];
  for (const depth of DEPTHS) if (stillness >= depth.at) found = depth;
  return found;
}

export function nextDepth(stillness) {
  return DEPTHS.find((d) => d.at > stillness) || null;
}

export function streakMultiplier(seconds) {
  return 1 + Math.min(Math.max(seconds, 0) / 40, 1) * 2;
}

export function stillnessRate(depthLevel, streakSeconds) {
  return 1.4 * (1 + depthLevel * 0.28) * streakMultiplier(streakSeconds);
}

// Rest is only rest if you are actually leaving things alone.
export function vitalityRate(secondsSinceAction, depthLevel) {
  const settled = secondsSinceAction > 4;
  return (settled ? 4.2 : 1.1) * (1 + depthLevel * 0.12);
}

// Each intervention inside a single day makes the next one heavier.
export function fatigueMultiplier(fatigue) {
  return 1 + Math.min(fatigue, 6) * 0.22;
}

export function costOf(choice, fatigue = 0) {
  const base = COSTS[choice] || COSTS.pass;
  const mult = choice === "pass" ? 1 : fatigueMultiplier(fatigue);
  return {
    vitality: Math.round(base.vitality * mult),
    stillness: Math.round(base.stillness * mult),
  };
}

export function canAfford(resources, choice, fatigue = 0) {
  return resources.vitality >= costOf(choice, fatigue).vitality;
}

export function spend(resources, choice, fatigue = 0) {
  const cost = costOf(choice, fatigue);
  return {
    ...resources,
    vitality: Math.max(0, resources.vitality - cost.vitality),
    stillness: Math.max(0, resources.stillness + cost.stillness),
    fatigue: choice === "pass" ? resources.fatigue : resources.fatigue + 1,
  };
}

// Reading the world well is a skill that grows.
export const ATTUNE_LEVELS = [
  { level: 0, at: 0, name: "Unread", reveals: "none" },
  { level: 1, at: 30, name: "Noticing", reveals: "loud" },
  { level: 2, at: 75, name: "Discerning", reveals: "quiet" },
  { level: 3, at: 140, name: "Clear", reveals: "all" },
];

export function attuneLevel(attunement) {
  let found = ATTUNE_LEVELS[0];
  for (const row of ATTUNE_LEVELS) if (attunement >= row.at) found = row;
  return found;
}

export function autoRevealed(resources, thread) {
  const reveals = attuneLevel(resources.attunement).reveals;
  if (reveals === "all") return true;
  if (reveals === "quiet") return true;
  if (reveals === "loud") return Boolean(thread.loud);
  return false;
}

export function gainAttunement(resources, amount) {
  return { ...resources, attunement: Math.min(200, resources.attunement + amount) };
}

export function adjustStanding(resources, delta) {
  return { ...resources, standing: Math.max(0, Math.min(100, resources.standing + delta)) };
}
