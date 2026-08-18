import { STARTER_IDS } from "./meta.js";

export const BOONS = [
  { id: "anaFold", name: "Long Fold", tag: "FOLD", tier: 1, cursed: false, text: "Stay in 4D transit longer. Fold recharges faster." },
  { id: "echo", name: "Echo Body", tag: "4D", tier: 1, cursed: false, text: "Fold leaves a ghost that steals orbs from another slice." },
  { id: "appetite", name: "Tesseract Appetite", tag: "HUNGER", tier: 1, cursed: false, text: "Pull orbs from farther. They linger in this plane." },
  { id: "hypercombo", name: "Hypercombo", tag: "CURSE", tier: 1, cursed: true, text: "Combo refuses to die. Shards get meaner." },
  { id: "thin", name: "Thin Slice", tag: "W", tier: 1, cursed: false, text: "Your 3-sphere shrinks. Harder to hit, weaker vacuum." },
  { id: "burst", name: "Unfold Burst", tag: "FOLD", tier: 1, cursed: false, text: "Fold detonates the opposite slice into orbs." },
  { id: "glass", name: "Glass W", tag: "LIFE", tier: 2, cursed: false, text: "A lethal hit becomes a fold instead. Once per stack." },
  { id: "orbit", name: "16-Cell Orbit", tag: "DUAL", tier: 2, cursed: false, text: "Dual vertices collect orbs while they swing through 3-space." },
  { id: "aligned", name: "Aligned Light", tag: "W", tier: 2, cursed: false, text: "Orbs that match your slice explode in value." },
  { id: "tessellate", name: "Cursed Tessellation", tag: "CURSE", tier: 2, cursed: true, text: "Twice the shards. Extra score for surviving the mess." },
  { id: "bulkCurse", name: "Thick Space", tag: "CURSE", tier: 2, cursed: true, text: "More 4D-thick bulk shards. Transit can phase them briefly." },
  { id: "frenzy", name: "Polytopal Frenzy", tag: "MAD", tier: 3, cursed: true, text: "Everything faster. Combos of 4+ recharge Fold." },
  { id: "cascade", name: "Cascade Fold", tag: "FOLD", tier: 3, cursed: false, text: "Matching orbs dump Fold cooldown. Combos start to Fold for you." },
  { id: "twinSlice", name: "Twin Slice", tag: "W", tier: 3, cursed: false, text: "Smear across ANA and KATA. Colored shards ghost. Bulk gets jealous." },
  { id: "jackpot", name: "Jackpot Core", tag: "HUNGER", tier: 3, cursed: false, text: "Fat prism orbs. Hitting one feels illegal." },
  { id: "hungryGhosts", name: "Hungry Ghosts", tag: "4D", tier: 3, cursed: true, text: "Echoes eat shards of their own slice and spit orbs." },
  { id: "splitRank", name: "Split Rank", tag: "DUAL", tier: 3, cursed: false, text: "A second 4D body orbits you and farms like a gremlin." },
];

export const EVOLUTIONS = [
  { id: "perpetual", name: "Perpetual Fold", tag: "EVO", tier: 4, cursed: false, text: "You almost never leave transit.", requires: { anaFold: 3 } },
  { id: "chorus", name: "Chorus", tag: "EVO", tier: 4, cursed: false, text: "Fold births a choir of thieves.", requires: { echo: 3 } },
  { id: "needle", name: "Needle God", tag: "EVO", tier: 4, cursed: false, text: "Tiny. Starving. Unfair vacuum.", requires: { thin: 2, appetite: 2 } },
  { id: "phantomDual", name: "Phantom Dual", tag: "SYN", tier: 4, cursed: false, text: "Ghosts inherit the 16-cell. Two dimensions farm at once.", requires: { echo: 1, orbit: 1 } },
  { id: "prismBomb", name: "Prism Bomb", tag: "SYN", tier: 4, cursed: false, text: "Burst orbs snap to your slice and print money.", requires: { burst: 1, aligned: 1 } },
  { id: "arcadeGod", name: "Arcade God", tag: "SYN", tier: 4, cursed: true, text: "The cabinet starts cheating for you. And against you.", requires: { frenzy: 1, hypercombo: 1 } },
  { id: "hypertess", name: "Hypertessellate", tag: "EVO", tier: 4, cursed: true, text: "The plane fills. Score goes feral.", requires: { tessellate: 3 } },
  { id: "prismW", name: "Prism W", tag: "EVO", tier: 4, cursed: false, text: "Two extra Glass charges and a panic burst.", requires: { glass: 2 } },
];

export const ALL_BOONS = [...BOONS, ...EVOLUTIONS];

export function boonById(id) {
  return ALL_BOONS.find((boon) => boon.id === id) ?? null;
}

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
  return 4 + draftsTaken * 5;
}

export function stackCount(stacks, id) {
  return stacks[id] || 0;
}

export function eligibleEvolutions(stacks) {
  return EVOLUTIONS.filter((evo) => {
    if (stackCount(stacks, evo.id) > 0) return false;
    return Object.entries(evo.requires).every(([id, need]) => stackCount(stacks, id) >= need);
  });
}

export function createMods(stacks) {
  const s = (id) => stackCount(stacks, id);
  const hitScale = Math.max(0.52, (1 - s("thin") * 0.12) * (s("needle") ? 0.72 : 1));
  return {
    foldDuration: 0.42 + s("anaFold") * 0.22 + s("perpetual") * 1.15,
    foldCooldown: Math.max(
      0.28,
      (2.35 - s("anaFold") * 0.32 - s("frenzy") * 0.12) * (s("perpetual") ? 0.38 : 1) * (s("arcadeGod") ? 0.75 : 1),
    ),
    hitScale,
    magnet: Math.max(60, 150 + s("appetite") * 70 - s("thin") * 35 + s("needle") * 160 + s("splitRank") * 40),
    shardSpeed: 1 + s("hypercombo") * 0.1 + s("tessellate") * 0.08 + s("frenzy") * 0.14 + s("arcadeGod") * 0.28 + s("hypertess") * 0.1,
    shardExtra: s("tessellate") + (s("frenzy") ? 1 : 0) + s("hypertess") * 3 + s("arcadeGod"),
    scoreMult: 1 + s("tessellate") * 0.35 + s("frenzy") * 0.2 + s("arcadeGod") * 0.8 + s("hypertess") * 1.1 + s("jackpot") * 0.15,
    comboHold: 1.25 + s("hypercombo") * 0.75 + s("arcadeGod") * 0.4,
    orbLife: 7 + s("appetite") * 3,
    echoLife: 1.6 + s("echo") * 0.7 + s("chorus") * 0.6,
    burstRadius: 70 + s("burst") * 38 + s("prismBomb") * 40,
    orbit: s("orbit") + s("phantomDual") * 2,
    aligned: s("aligned") + s("prismBomb") * 2,
    bulkChance: Math.min(0.62, 0.16 + s("bulkCurse") * 0.14 + s("twinSlice") * 0.1),
    bulkPhase: s("bulkCurse") > 0 ? 0.12 + s("bulkCurse") * 0.1 : 0.05,
    frenzy: s("frenzy") + s("arcadeGod"),
    echo: s("echo") + s("chorus") + s("phantomDual"),
    burst: s("burst") + s("prismBomb"),
    echoCount: s("echo") > 0 || s("chorus") > 0 ? 1 + s("chorus") * 2 : 0,
    cascade: s("cascade"),
    twinSlice: s("twinSlice"),
    jackpot: s("jackpot"),
    hungryGhosts: s("hungryGhosts"),
    splitRank: s("splitRank"),
    prismBomb: s("prismBomb"),
    phantomDual: s("phantomDual"),
  };
}

export function applyBoon(run, id) {
  run.stacks[id] = stackCount(run.stacks, id) + 1;
  if (id === "glass") run.glassCharges += 1;
  if (id === "prismW") run.glassCharges += 2;
  run.drafts += 1;
  run.nextDraft = nextDraftThreshold(run.drafts);
  return createMods(run.stacks);
}

function shufflePick(list, randFn) {
  const index = Math.min(list.length - 1, Math.floor(randFn() * list.length));
  return list.splice(Math.max(0, index), 1)[0];
}

export function pickDraft(stacks, count = 3, randFn = Math.random, unlocked = STARTER_IDS) {
  const ownedUnlocked = BOONS.filter((boon) => unlocked.includes(boon.id));
  const evolutions = eligibleEvolutions(stacks);
  const picks = [];
  const used = new Set();

  const take = (boon) => {
    if (!boon || used.has(boon.id) || picks.length >= count) return;
    used.add(boon.id);
    picks.push(boon);
  };

  if (evolutions.length && randFn() < 0.62) {
    take(shufflePick(evolutions.slice(), randFn));
  }

  const fresh = ownedUnlocked.filter((boon) => !stackCount(stacks, boon.id));
  if (fresh.length && randFn() < 0.7) {
    take(shufflePick(fresh.slice(), randFn));
  }

  const rest = [...ownedUnlocked, ...evolutions].filter((boon) => !used.has(boon.id));
  while (picks.length < count && rest.length) {
    take(shufflePick(rest, randFn));
  }

  return picks;
}

export function relicChips(stacks) {
  return ALL_BOONS.filter((boon) => stackCount(stacks, boon.id) > 0).map((boon) => ({
    id: boon.id,
    name: boon.name,
    tag: boon.tag,
    cursed: boon.cursed,
    tier: boon.tier,
    level: stackCount(stacks, boon.id),
  }));
}

export function hungerText(run) {
  const remain = Math.max(0, run.nextDraft - run.orbs);
  if (remain <= 0) return "DRAFT";
  return `${remain} TO BOON`;
}
