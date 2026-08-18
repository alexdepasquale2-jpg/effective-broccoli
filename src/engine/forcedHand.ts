import {
  COMPLICATIONS,
  DEFAULT_VERBS,
  LOCATIONS,
  NPCS,
  PRESSURES,
  SENSORY,
} from "./banks";
import type { ForcedHand } from "../types";

/** Mulberry32 — small, seedable, enough for a writing desk. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(list: readonly T[], rand: () => number, used: Set<string>): T {
  if (list.length === 0) {
    throw new Error("Cannot pick from an empty list");
  }
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const item = list[Math.floor(rand() * list.length)] as T;
    const key = String(item);
    if (!used.has(key)) {
      used.add(key);
      return item;
    }
  }
  return list[Math.floor(rand() * list.length)] as T;
}

export interface ForcedHandOptions {
  seed?: string | number;
  preferredVerbs?: string[];
}

export function drawForcedHand(options: ForcedHandOptions = {}): ForcedHand {
  const seedValue =
    typeof options.seed === "number"
      ? options.seed
      : seedFromString(options.seed ?? `hand-${Date.now()}`);
  const rand = mulberry32(seedValue);
  const used = new Set<string>();
  const verbPool =
    options.preferredVerbs && options.preferredVerbs.length > 0
      ? options.preferredVerbs
      : DEFAULT_VERBS;

  return {
    location: pick(LOCATIONS, rand, used),
    pressure: pick(PRESSURES, rand, used),
    verb: pick(verbPool, rand, used),
    complication: pick(COMPLICATIONS, rand, used),
    npc: pick(NPCS, rand, used),
    sensory: pick(SENSORY, rand, used),
  };
}

export function formatForcedHand(hand: ForcedHand): string {
  return [
    `Location: ${hand.location}`,
    `Pressure: ${hand.pressure}`,
    `Verb: ${hand.verb}`,
    `Complication: ${hand.complication}`,
    `NPC: ${hand.npc}`,
    `Sensory: ${hand.sensory}`,
  ].join("\n");
}
