export const BOONS = [
  {
    id: "anaFold",
    name: "Long Fold",
    tag: "FOLD",
    cursed: false,
    text: "Stay in 4D transit longer. Fold recharges faster.",
  },
  {
    id: "echo",
    name: "Echo Body",
    tag: "4D",
    cursed: false,
    text: "Fold leaves a ghost that steals orbs from another slice.",
  },
  {
    id: "thin",
    name: "Thin Slice",
    tag: "W",
    cursed: false,
    text: "Your 3-sphere shrinks. Harder to hit, weaker vacuum.",
  },
  {
    id: "appetite",
    name: "Tesseract Appetite",
    tag: "HUNGER",
    cursed: false,
    text: "Pull orbs from farther. They linger in this plane.",
  },
  {
    id: "hypercombo",
    name: "Hypercombo",
    tag: "CURSE",
    cursed: true,
    text: "Combo refuses to die. Shards get meaner.",
  },
  {
    id: "glass",
    name: "Glass W",
    tag: "LIFE",
    cursed: false,
    text: "A lethal hit becomes a fold instead. Once per stack.",
  },
  {
    id: "burst",
    name: "Unfold Burst",
    tag: "FOLD",
    cursed: false,
    text: "Fold detonates the opposite slice into orbs.",
  },
  {
    id: "tessellate",
    name: "Cursed Tessellation",
    tag: "CURSE",
    cursed: true,
    text: "Twice the shards. Extra score for surviving the mess.",
  },
  {
    id: "orbit",
    name: "16-Cell Orbit",
    tag: "DUAL",
    cursed: false,
    text: "Dual vertices collect orbs while they swing through 3-space.",
  },
  {
    id: "aligned",
    name: "Aligned Light",
    tag: "W",
    cursed: false,
    text: "Orbs that match your slice explode in value. Mismatched ones fade.",
  },
  {
    id: "bulkCurse",
    name: "Thick Space",
    tag: "CURSE",
    cursed: true,
    text: "More 4D-thick bulk shards. Transit can phase them briefly.",
  },
  {
    id: "frenzy",
    name: "Polytopal Frenzy",
    tag: "MAD",
    cursed: true,
    text: "Everything faster. Combos of 4+ recharge Fold.",
  },
];

export function createRun() {
  return {
    stacks: {},
    orbs: 0,
    drafts: 0,
    nextDraft: nextDraftThreshold(0),
    polarity: 1,
    glassCharges: 0,
    echoes: [],
    foldTimer: 0,
    foldCooldown: 0,
  };
}

export function nextDraftThreshold(draftsTaken) {
  return 6 + draftsTaken * 8;
}

export function stackCount(stacks, id) {
  return stacks[id] || 0;
}

export function createMods(stacks) {
  const s = (id) => stackCount(stacks, id);
  return {
    foldDuration: 0.42 + s("anaFold") * 0.22,
    foldCooldown: Math.max(0.8, 2.35 - s("anaFold") * 0.32 - s("frenzy") * 0.12),
    hitScale: Math.max(0.6, 1 - s("thin") * 0.12),
    magnet: Math.max(70, 150 + s("appetite") * 70 - s("thin") * 35),
    shardSpeed: 1 + s("hypercombo") * 0.1 + s("tessellate") * 0.08 + s("frenzy") * 0.14,
    shardExtra: s("tessellate") + (s("frenzy") ? 1 : 0),
    scoreMult: 1 + s("tessellate") * 0.35 + s("frenzy") * 0.2,
    comboHold: 1.25 + s("hypercombo") * 0.75,
    orbLife: 7 + s("appetite") * 3,
    echoLife: 1.6 + s("echo") * 0.7,
    burstRadius: 70 + s("burst") * 38,
    orbit: s("orbit"),
    aligned: s("aligned"),
    bulkChance: Math.min(0.55, 0.16 + s("bulkCurse") * 0.14),
    bulkPhase: s("bulkCurse") > 0 ? 0.12 + s("bulkCurse") * 0.1 : 0.05,
    frenzy: s("frenzy"),
    echo: s("echo"),
    burst: s("burst"),
  };
}

export function applyBoon(run, id) {
  run.stacks[id] = stackCount(run.stacks, id) + 1;
  if (id === "glass") run.glassCharges += 1;
  run.drafts += 1;
  run.nextDraft = nextDraftThreshold(run.drafts);
  return createMods(run.stacks);
}

export function pickDraft(stacks, count = 3, randFn = Math.random) {
  const pool = BOONS.slice();
  const picks = [];
  while (picks.length < count && pool.length) {
    const index = Math.floor(randFn() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}

export function relicChips(stacks) {
  return BOONS.filter((boon) => stackCount(stacks, boon.id) > 0).map((boon) => ({
    id: boon.id,
    name: boon.name,
    tag: boon.tag,
    cursed: boon.cursed,
    level: stackCount(stacks, boon.id),
  }));
}
