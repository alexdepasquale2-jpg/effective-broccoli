export const MILESTONES = [
  { leaps: 1, name: "Night Watcher" },
  { leaps: 2, name: "Tool Knapper" },
  { leaps: 3, name: "Savanna Walker" },
];

export function emptyMeta() {
  return {
    leaps: 0,
    xp: 0,
    clan: null,
  };
}

export function titleForLeaps(leaps) {
  let name = "Lost Infant";
  for (const row of MILESTONES) {
    if (leaps >= row.leaps) name = row.name;
  }
  return name;
}

export function nextMilestone(meta) {
  const next = MILESTONES.find((row) => (meta.leaps || 0) < row.leaps);
  if (!next) return null;
  return {
    name: next.name,
    leaps: next.leaps,
    need: next.leaps - (meta.leaps || 0),
  };
}

export function applyLeapToMeta(meta, clan) {
  const gained = 120 + clan.reinforced.length * 40;
  meta.leaps = (meta.leaps || 0) + 1;
  meta.xp = (meta.xp || 0) + gained;
  return { gained, title: titleForLeaps(meta.leaps), next: nextMilestone(meta) };
}
