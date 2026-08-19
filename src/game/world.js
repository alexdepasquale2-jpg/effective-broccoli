export const DOMAINS = [
  { id: "self", name: "Self", label: "your own hours" },
  { id: "kin", name: "Kin", label: "the people who are yours" },
  { id: "work", name: "Work", label: "the thing you make" },
  { id: "town", name: "Town", label: "the valley you live in" },
  { id: "world", name: "World", label: "everything further out" },
];

export const SEASONS = [
  { id: "thaw", name: "Thaw", sky: ["#4a6b8a", "#8fa9b8"], ground: "#5e7a4a", weather: "rain" },
  { id: "high", name: "High Sun", sky: ["#3f7fb0", "#a8cfe0"], ground: "#6f9c4a", weather: "none" },
  { id: "turn", name: "The Turning", sky: ["#7a5f4a", "#c49a6c"], ground: "#8a7a3a", weather: "leaves" },
  { id: "still", name: "Deep Cold", sky: ["#2b3a52", "#6b7f96"], ground: "#8fa0a8", weather: "snow" },
];

export const DAYS_PER_SEASON = 3;
export const TOTAL_DAYS = 12;

export function createWorld() {
  return {
    day: 1,
    domains: { self: 62, kin: 58, work: 54, town: 56, world: 48 },
    marks: [],
  };
}

export function seasonIndex(day) {
  return Math.min(SEASONS.length - 1, Math.floor((day - 1) / DAYS_PER_SEASON));
}

export function seasonFor(day) {
  return SEASONS[seasonIndex(day)];
}

export function clampDomain(value) {
  return Math.max(0, Math.min(100, value));
}

export function applyEffects(world, effects = {}) {
  const domains = { ...world.domains };
  for (const [key, delta] of Object.entries(effects)) {
    if (domains[key] === undefined) continue;
    domains[key] = clampDomain(domains[key] + delta);
  }
  return { ...world, domains };
}

export function addMark(world, mark) {
  return { ...world, marks: [...world.marks, mark] };
}

export const CONDITIONS = [
  { key: "failing", at: 0, name: "failing" },
  { key: "struggling", at: 28, name: "struggling" },
  { key: "steady", at: 50, name: "steady" },
  { key: "warm", at: 70, name: "warm" },
  { key: "flourishing", at: 86, name: "flourishing" },
];

export function conditionOf(world, domainId) {
  const value = world.domains[domainId] ?? 50;
  let found = CONDITIONS[0];
  for (const row of CONDITIONS) if (value >= row.at) found = row;
  return found;
}

export function worldAverage(world) {
  const values = Object.values(world.domains);
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function weakestDomain(world) {
  return Object.entries(world.domains).sort((a, b) => a[1] - b[1])[0][0];
}

// Weaker corners of the world generate more of what happens next.
export function seedWeights(world) {
  const weights = {};
  for (const domain of DOMAINS) {
    const value = world.domains[domain.id] ?? 50;
    weights[domain.id] = 1 + Math.max(0, (60 - value) / 18);
  }
  return weights;
}

export function worldVerdict(world) {
  const avg = worldAverage(world);
  if (avg >= 78) return "The valley is better than you found it, and very little of that was your doing.";
  if (avg >= 62) return "The valley held. Most of it held without you.";
  if (avg >= 46) return "The valley is roughly where it was. You were present for all of it.";
  if (avg >= 30) return "Things frayed. Some of the fraying was yours.";
  return "It came apart. You were very busy while it did.";
}
