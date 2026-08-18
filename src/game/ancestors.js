export const WORLD_WIDTH = 2800;

export const SPECIES = [
  { generation: 0, name: "Sahelanthropus Stick", year: 10_000_000 },
  { generation: 1, name: "Orrorin Stick", year: 6_000_000 },
  { generation: 2, name: "Australopithecus Stick", year: 3_800_000 },
  { generation: 3, name: "Homo Stick", year: 2_000_000 },
];

export const NEURONS = [
  { id: "motricity", name: "Motor Cortex", cat: "motricity", cost: 1, need: 2, prereq: [], text: "Move faster through the wilds." },
  { id: "olfactory", name: "Olfactory Bulb", cat: "senses", cost: 1, need: 2, prereq: [], text: "Smell food from farther away." },
  { id: "amygdala", name: "Amygdala Control", cat: "intelligence", cost: 2, need: 2, prereq: [], text: "Fear rises slower in the unknown." },
  { id: "hydration", name: "Thirst Mapping", cat: "senses", cost: 1, need: 2, prereq: ["olfactory"], text: "Find water without panic." },
  { id: "striking", name: "Precise Striking", cat: "intelligence", cost: 2, need: 3, prereq: ["motricity"], text: "Crack rocks into tools." },
  { id: "predator", name: "Predator Sense", cat: "senses", cost: 2, need: 3, prereq: ["amygdala"], text: "Feel danger in tall grass." },
  { id: "bonding", name: "Social Bonding", cat: "communication", cost: 2, need: 2, prereq: [], text: "Groom clanmates to steady fear." },
  { id: "metabolism", name: "Metabolism", cat: "motricity", cost: 2, need: 3, prereq: ["olfactory"], text: "Food lasts longer in your belly." },
  { id: "leap", name: "Generational Memory", cat: "intelligence", cost: 3, need: 4, prereq: ["striking", "predator"], text: "Required to evolve the clan." },
];

export const NODES = [
  { id: "camp", x: 220, type: "camp", name: "Clan Camp", fear: 0, safe: true },
  { id: "berries", x: 520, type: "food", name: "Berry Bush", fear: 8, trigger: "olfactory", energy: 28 },
  { id: "river", x: 860, type: "water", name: "River Bend", fear: 18, trigger: "hydration", thirst: 40 },
  { id: "grove", x: 1180, type: "fear", name: "Dark Grove", fear: 48, trigger: "amygdala" },
  { id: "rocks", x: 1520, type: "alter", name: "Rock Pile", fear: 32, trigger: "striking", tool: "rock" },
  { id: "clanmate", x: 360, type: "bond", name: "Clanmate", fear: 0, trigger: "bonding", atCamp: true },
  { id: "grass", x: 1960, type: "danger", name: "Tall Grass", fear: 62, trigger: "predator" },
  { id: "cave", x: 2380, type: "fear", name: "Echoing Cave", fear: 78, trigger: "amygdala" },
  { id: "figs", x: 640, type: "food", name: "Fig Tree", fear: 22, trigger: "metabolism", energy: 34, need: "olfactory" },
];

export function createClan() {
  return {
    generation: 0,
    year: SPECIES[0].year,
    energy: 88,
    energyMax: 100,
    thirst: 72,
    thirstMax: 100,
    fear: 18,
    fearMax: 100,
    bonding: 24,
    neuronalEnergy: 0,
    reinforced: [],
    discovered: [],
    progress: {},
    known: ["camp", "berries", "clanmate"],
    tools: { rock: false },
    rested: 0,
    leapCount: 0,
  };
}

export function speciesFor(clan) {
  const row = [...SPECIES].reverse().find((s) => clan.generation >= s.generation);
  return row || SPECIES[0];
}

export function neuronById(id) {
  return NEURONS.find((n) => n.id === id) || null;
}

export function hasNeuron(clan, id) {
  return clan.reinforced.includes(id);
}

export function neuronReady(clan, neuron) {
  if (hasNeuron(clan, neuron.id)) return false;
  if (clan.discovered.includes(neuron.id)) return true;
  return (clan.progress[neuron.id] || 0) >= neuron.need;
}

export function discoverableNeurons(clan) {
  return NEURONS.filter((n) => neuronReady(clan, n) && !hasNeuron(clan, n));
}

export function bumpProgress(clan, neuronId, amount = 1) {
  const neuron = neuronById(neuronId);
  if (!neuron || hasNeuron(clan, neuronId)) return clan;
  if (neuron.prereq.some((id) => !hasNeuron(clan, id))) return clan;
  const next = { ...clan, progress: { ...clan.progress }, discovered: [...clan.discovered] };
  next.progress[neuronId] = (next.progress[neuronId] || 0) + amount;
  if (next.progress[neuronId] >= neuron.need && !next.discovered.includes(neuronId)) {
    next.discovered.push(neuronId);
  }
  return next;
}

export function effectiveFear(node, clan) {
  let fear = node.fear || 0;
  if (hasNeuron(clan, "amygdala")) fear *= 0.72;
  if (hasNeuron(clan, "predator") && node.type === "danger") fear *= 0.55;
  if (clan.known.includes(node.id)) fear *= 0.35;
  if (clan.bonding > 60) fear *= 0.9;
  return Math.max(0, Math.round(fear));
}

export function canUseNode(node, clan) {
  if (node.need && !hasNeuron(clan, node.need)) return `Need ${neuronById(node.need)?.name || node.need} reinforced.`;
  if (node.atCamp && node.type === "bond") return null;
  return null;
}

export function investigate(clan, node) {
  if (clan.known.includes(node.id)) {
    return { ok: false, reason: "Already mapped this place.", clan };
  }
  const fearHit = effectiveFear(node, clan);
  let next = { ...clan, known: [...clan.known], fear: Math.min(clan.fearMax, clan.fear + fearHit * 0.45) };
  next.known.push(node.id);
  if (node.trigger) next = bumpProgress(next, node.trigger, 2);
  if (node.type === "fear" || node.type === "danger") next = bumpProgress(next, "amygdala", 1);
  const text =
    fearHit > 40
      ? `Terror in ${node.name}. Your clan shakes — but the map grows.`
      : `You memorized ${node.name}. The wilds feel smaller.`;
  return { ok: true, clan: next, text, fearHit };
}

export function interact(clan, node) {
  const blocked = canUseNode(node, clan);
  if (blocked) return { ok: false, reason: blocked, clan };

  if (!clan.known.includes(node.id) && !node.safe) {
    return investigate(clan, node);
  }

  let next = { ...clan };
  let text = "";

  switch (node.type) {
    case "camp":
      text = "Home nest. Rest here to grow neurons.";
      break;
    case "food":
      next.energy = Math.min(next.energyMax, next.energy + (node.energy || 20));
      next = bumpProgress(next, node.trigger || "olfactory", 1);
      text = `You eat from ${node.name}. Energy rises.`;
      break;
    case "water":
      next.thirst = Math.min(next.thirstMax, next.thirst + (node.thirst || 35));
      next = bumpProgress(next, node.trigger || "hydration", 1);
      text = `You drink at ${node.name}. Thirst fades.`;
      break;
    case "bond":
      next.bonding = Math.min(100, next.bonding + 18);
      next.fear = Math.max(0, next.fear - 12);
      next = bumpProgress(next, "bonding", 1);
      text = "You groom a clanmate. Fear loosens its grip.";
      break;
    case "alter":
      if (!hasNeuron(next, "striking")) {
        return { ok: false, reason: "Discover Precise Striking first.", clan };
      }
      next.tools = { ...next.tools, rock: true };
      next = bumpProgress(next, "striking", 1);
      text = "Sharp rock in hand. The jungle looks negotiable.";
      break;
    case "danger":
      if (!hasNeuron(next, "predator")) {
        const fearHit = effectiveFear(node, clan);
        next.fear = Math.min(next.fearMax, next.fear + fearHit);
        next.energy = Math.max(0, next.energy - 20);
        return { ok: true, clan: next, text: "Something moved. You flee, bleeding nerve.", fearHit };
      }
      next = bumpProgress(next, "predator", 1);
      text = "You read the grass and back away alive.";
      break;
    case "fear":
      return investigate(next, node);
    default:
      text = `You poke ${node.name}.`;
  }

  if (!next.known.includes(node.id)) next = { ...next, known: [...next.known, node.id] };
  return { ok: true, clan: next, text };
}

export function reinforce(clan, neuronId) {
  const neuron = neuronById(neuronId);
  if (!neuron) return { ok: false, reason: "Missing neuron.", clan };
  if (hasNeuron(clan, neuronId)) return { ok: false, reason: "Already reinforced.", clan };
  if (!clan.discovered.includes(neuronId)) return { ok: false, reason: "Not discovered yet.", clan };
  if (neuron.prereq.some((id) => !hasNeuron(clan, id))) return { ok: false, reason: "Prerequisites missing.", clan };
  if (clan.neuronalEnergy < neuron.cost) return { ok: false, reason: `Need ${neuron.cost} neuronal energy.`, clan };

  const next = {
    ...clan,
    neuronalEnergy: clan.neuronalEnergy - neuron.cost,
    reinforced: [...clan.reinforced, neuronId],
  };
  if (neuron.id === "metabolism") next.energyMax = Math.min(130, next.energyMax + 8);
  if (neuron.id === "motricity") next.energyMax = Math.min(120, next.energyMax + 4);
  return { ok: true, clan: next, text: `${neuron.name} reinforced.`, neuron };
}

export function rest(clan) {
  let next = {
    ...clan,
    energy: Math.min(clan.energyMax, clan.energy + 42),
    thirst: Math.max(0, clan.thirst - 8),
    fear: Math.max(0, clan.fear - 22),
    neuronalEnergy: clan.neuronalEnergy + 2 + Math.floor(clan.discovered.length / 2),
    rested: clan.rested + 1,
  };
  next.year = Math.max(0, next.year - 120_000);
  return { ok: true, clan: next, text: "The clan sleeps. Neuronal energy gathers." };
}

export function tickNeeds(clan, dt) {
  const walkCost = hasNeuron(clan, "metabolism") ? 0.8 : 1.2;
  const next = { ...clan };
  next.energy = Math.max(0, next.energy - dt * 1.4 * walkCost);
  next.thirst = Math.max(0, next.thirst - dt * 1.1);
  if (next.energy < 25 || next.thirst < 20) next.fear = Math.min(next.fearMax, next.fear + dt * 2.2);
  else next.fear = Math.max(0, next.fear - dt * 0.35);
  return next;
}

export function leapReady(clan) {
  return hasNeuron(clan, "leap") && clan.reinforced.length >= 5;
}

export function evolutionLeap(clan) {
  if (!leapReady(clan)) return { ok: false, reason: "Reinforce Generational Memory and 5 total neurons.", clan };
  const generation = Math.min(SPECIES.length - 1, clan.generation + 1);
  const species = SPECIES.find((s) => s.generation === generation) || SPECIES[SPECIES.length - 1];
  const next = {
    ...createClan(),
    generation,
    year: species.year,
    leapCount: clan.leapCount + 1,
    reinforced: [...clan.reinforced],
    discovered: [...new Set([...clan.reinforced, ...clan.discovered])],
    progress: { ...clan.progress },
    known: [...new Set([...clan.known, "camp", "berries", "clanmate"])],
    neuronalEnergy: 2 + clan.reinforced.length,
    bonding: 42,
    energy: 100,
    thirst: 82,
    fear: 8,
    tools: { ...clan.tools },
  };
  return { ok: true, clan: next, text: `Evolution leap: ${species.name}. ${species.year.toLocaleString()} BC.` };
}

export function clanLine(clan) {
  const sp = speciesFor(clan);
  return `${sp.name} · ${(clan.year / 1_000_000).toFixed(1)}M BC · Gen ${clan.generation + 1}`;
}

export function yearLabel(year) {
  if (year >= 1_000_000) return `${(year / 1_000_000).toFixed(1)}M BC`;
  if (year >= 1000) return `${Math.round(year / 1000)}K BC`;
  return `${year} BC`;
}
