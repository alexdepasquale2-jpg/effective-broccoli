import { CROPS, META_UPGRADES } from "./farmingData.js";

const SAVE_KEY = "farmsurvivor_meta_save_v1";

export function createInitialMeta() {
  return {
    totalGold: 120, // Start with starter gold for seeds!
    highestNight: 1,
    totalCropsHarvested: 0,
    totalMonstersSlain: 0,
    upgrades: {
      startingGold: 0,
      plotCount: 0,
      tractor: 0,
      vitality: 0,
      scarecrowBuff: 0,
    },
  };
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialMeta();
    const parsed = JSON.parse(raw);
    const initial = createInitialMeta();
    return {
      ...initial,
      ...parsed,
      upgrades: { ...initial.upgrades, ...(parsed.upgrades || {}) },
    };
  } catch {
    return createInitialMeta();
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

export function buyMetaUpgrade(meta, upgradeId) {
  const upgrade = META_UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return { ok: false, reason: "Upgrade not found" };

  const currentLevel = meta.upgrades[upgradeId] || 0;
  if (currentLevel >= upgrade.max) {
    return { ok: false, reason: "Max level reached" };
  }

  const cost = upgrade.cost(currentLevel);
  if (meta.totalGold < cost) {
    return { ok: false, reason: `Not enough Gold (Need ${cost}g)` };
  }

  meta.totalGold -= cost;
  meta.upgrades[upgradeId] = currentLevel + 1;
  saveMeta(meta);
  return { ok: true, meta };
}
