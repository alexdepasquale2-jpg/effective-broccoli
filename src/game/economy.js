import { speciesById } from "./fish.js";

export const UPGRADES = [
  { id: "range", name: "Harpoon Reach", desc: "Shoot farther across the reef.", max: 8 },
  { id: "reel", name: "Turbo Winch", desc: "Reel hooked fish faster.", max: 10 },
  { id: "line", name: "Titanium Line", desc: "Hook heavier rare fish.", max: 8 },
  { id: "sonar", name: "Rare Sonar", desc: "Legendary fish enter the map.", max: 5 },
  { id: "hold", name: "Cargo Hold", desc: "Stack more fish before selling.", max: 6 },
  { id: "trade", name: "Trader's Tongue", desc: "+12% sell price per level.", max: 5 },
];

export const TRADES = [
  { id: "pearl", name: "Pearl Broker", text: "Trade rare fins for pearls.", need: { angelfin: 2 }, reward: { pearls: 1, coins: 80 } },
  { id: "sun", name: "Sun Shrine", text: "Holy rays want gold.", need: { sunray: 1 }, reward: { pearls: 2, coins: 200 } },
  { id: "abyss", name: "Abyss Crate", text: "Void koi open the deep market.", need: { voidkoi: 1, moongill: 1 }, reward: { pearls: 5, coins: 600 } },
];

export function createSave() {
  return {
    coins: 0,
    pearls: 0,
    upgrades: Object.fromEntries(UPGRADES.map((u) => [u.id, 0])),
    cargo: {},
    discovered: [],
    caught: 0,
    sold: 0,
  };
}

export function upgradeCost(id, level) {
  const base = { range: 45, reel: 35, line: 55, sonar: 90, hold: 40, trade: 65 }[id] || 50;
  return Math.floor(base * 1.55 ** level);
}

export function statFor(save, id) {
  const lvl = save.upgrades[id] || 0;
  switch (id) {
    case "range":
      return 180 + lvl * 38;
    case "reel":
      return 120 + lvl * 28;
    case "line":
      return lvl;
    case "sonar":
      return lvl;
    case "hold":
      return 6 + lvl * 3;
    case "trade":
      return lvl;
    default:
      return lvl;
  }
}

export function cargoCount(cargo) {
  return Object.values(cargo).reduce((sum, n) => sum + n, 0);
}

export function cargoCapacity(save) {
  return statFor(save, "hold");
}

export function sellPrice(speciesId, save) {
  const species = speciesById(speciesId);
  const bonus = 1 + statFor(save, "trade") * 0.12;
  return Math.floor(species.value * bonus);
}

export function sellAll(save) {
  let coins = save.coins;
  let sold = 0;
  const cargo = { ...save.cargo };
  for (const [id, count] of Object.entries(cargo)) {
    if (!count) continue;
    coins += sellPrice(id, save) * count;
    sold += count;
    cargo[id] = 0;
  }
  return { ...save, coins, cargo, sold: save.sold + sold };
}

export function addToCargo(save, speciesId) {
  const cap = cargoCapacity(save);
  if (cargoCount(save.cargo) >= cap) return { ok: false, reason: "Cargo full. Sell at the market.", save };
  const cargo = { ...save.cargo };
  cargo[speciesId] = (cargo[speciesId] || 0) + 1;
  const discovered = save.discovered.includes(speciesId) ? save.discovered : [...save.discovered, speciesId];
  return {
    ok: true,
    save: { ...save, cargo, discovered, caught: save.caught + 1 },
    species: speciesById(speciesId),
  };
}

export function buyUpgrade(save, id) {
  const row = UPGRADES.find((u) => u.id === id);
  if (!row) return { ok: false, reason: "Unknown upgrade.", save };
  const level = save.upgrades[id] || 0;
  if (level >= row.max) return { ok: false, reason: "Maxed out.", save };
  const cost = upgradeCost(id, level);
  if (save.coins < cost) return { ok: false, reason: `Need $${cost}.`, save };
  const upgrades = { ...save.upgrades, [id]: level + 1 };
  return { ok: true, save: { ...save, coins: save.coins - cost, upgrades }, cost };
}

export function canTrade(save, trade) {
  for (const [id, need] of Object.entries(trade.need)) {
    if ((save.cargo[id] || 0) < need) return false;
  }
  return true;
}

export function executeTrade(save, trade) {
  if (!canTrade(save, trade)) return { ok: false, reason: "Missing fish for this trade.", save };
  const cargo = { ...save.cargo };
  for (const [id, need] of Object.entries(trade.need)) {
    cargo[id] -= need;
    if (cargo[id] <= 0) delete cargo[id];
  }
  return {
    ok: true,
    save: {
      ...save,
      cargo,
      coins: save.coins + (trade.reward.coins || 0),
      pearls: save.pearls + (trade.reward.pearls || 0),
    },
    text: `Traded for ${trade.reward.pearls ? `${trade.reward.pearls} pearls` : ""}${trade.reward.coins ? ` $${trade.reward.coins}` : ""}.`.trim(),
  };
}
