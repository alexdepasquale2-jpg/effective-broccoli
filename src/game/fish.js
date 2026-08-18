export const RARITY = {
  1: { name: "Common", color: "#9ad5ff", glow: 0.2 },
  2: { name: "Uncommon", color: "#7dffb2", glow: 0.35 },
  3: { name: "Rare", color: "#c9a0ff", glow: 0.5 },
  4: { name: "Epic", color: "#ffb86b", glow: 0.65 },
  5: { name: "Legendary", color: "#ff6ad5", glow: 0.85 },
};

export const SPECIES = [
  { id: "minnow", name: "Minnow", rarity: 1, color: "#9ad5ff", value: 4, size: 11, speed: 62, fight: 1, weight: 40 },
  { id: "perch", name: "Perch", rarity: 1, color: "#7ec8a0", value: 6, size: 14, speed: 54, fight: 2, weight: 32 },
  { id: "snapper", name: "Snapper", rarity: 2, color: "#ff9f7a", value: 14, size: 18, speed: 48, fight: 4, weight: 22 },
  { id: "tuna", name: "Tuna", rarity: 2, color: "#5d8bff", value: 20, size: 22, speed: 72, fight: 5, weight: 16 },
  { id: "angelfin", name: "Angelfin", rarity: 3, color: "#d4a5ff", value: 55, size: 20, speed: 44, fight: 7, weight: 9 },
  { id: "swordbill", name: "Swordbill", rarity: 3, color: "#8ef0ff", value: 72, size: 28, speed: 80, fight: 9, weight: 6 },
  { id: "sunray", name: "Sun Ray", rarity: 4, color: "#ffd56a", value: 160, size: 24, speed: 38, fight: 11, weight: 3 },
  { id: "moongill", name: "Moongill", rarity: 4, color: "#b8c7ff", value: 210, size: 26, speed: 52, fight: 12, weight: 2 },
  { id: "voidkoi", name: "Void Koi", rarity: 5, color: "#ff6ad5", value: 520, size: 30, speed: 66, fight: 16, weight: 1 },
  { id: "leviathan", name: "Leviathan Fry", rarity: 5, color: "#ff5d7a", value: 900, size: 36, speed: 34, fight: 20, weight: 0.5 },
];

export function speciesById(id) {
  return SPECIES.find((s) => s.id === id) || SPECIES[0];
}

export function maxRarity(sonarLevel) {
  return Math.min(5, 2 + Math.floor(sonarLevel));
}

export function pickSpecies(rand, sonarLevel) {
  const cap = maxRarity(sonarLevel);
  const pool = SPECIES.filter((s) => s.rarity <= cap);
  const total = pool.reduce((sum, s) => sum + s.weight * (s.rarity >= 4 ? 1 + sonarLevel * 0.35 : 1), 0);
  let roll = rand() * total;
  for (const fish of pool) {
    const w = fish.weight * (fish.rarity >= 4 ? 1 + sonarLevel * 0.35 : 1);
    roll -= w;
    if (roll <= 0) return fish;
  }
  return pool[0];
}

export function spawnAround(boatX, boatY, rand, sonarLevel, distMin = 280, distMax = 520) {
  const species = pickSpecies(rand, sonarLevel);
  const angle = rand() * Math.PI * 2;
  const dist = distMin + rand() * (distMax - distMin);
  const heading = angle + Math.PI + rand() * 0.8 - 0.4;
  return {
    id: `${species.id}-${Math.floor(rand() * 1e9)}`,
    speciesId: species.id,
    x: boatX + Math.cos(angle) * dist,
    y: boatY + Math.sin(angle) * dist,
    vx: Math.cos(heading) * species.speed,
    vy: Math.sin(heading) * species.speed,
    wobble: rand() * Math.PI * 2,
    hooked: false,
    hp: species.fight,
  };
}

export function canHook(species, lineLevel) {
  return species.fight <= 2 + lineLevel * 2.2;
}
