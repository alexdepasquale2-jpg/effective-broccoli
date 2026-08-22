import { LEVELS_PER_TIER } from './constants.ts';

/** Biblical virtues, offices, and sanctuary images — 30 prefixes. */
export const PREFIXES = [
    'Anointed',
    'Covenant',
    'Exodus',
    'Jubilee',
    'Manna',
    'Psalm',
    'Cherub',
    'Seraph',
    'Zion',
    'Eden',
    'Ark',
    'Staff',
    'Altar',
    'Mercy',
    'Tithe',
    'Nazarite',
    'Prophet',
    'Judge',
    'Shepherd',
    'Oil',
    'Scroll',
    'Temple',
    'Shofar',
    'Olive',
    'Cedar',
    'Myrrh',
    'Incense',
    'Rainbow',
    'Lamb',
    'Mantle',
] as const;

/** Greek god-weapons, places, and ichor — 30 stems. */
export const STEMS = [
    'Aegis',
    'Keraunos',
    'Caduceus',
    'Trident',
    'Laurel',
    'Ambrosia',
    'Nectar',
    'Labyrinth',
    'Hydra',
    'Chimera',
    'Olympus',
    'Styx',
    'Helios',
    'Nyx',
    'Gorgon',
    'Pegasus',
    'Cornucopia',
    'Thyrsus',
    'Ichor',
    'Lyre',
    'Harpe',
    'Xiphos',
    'Hoplon',
    'Phalanx',
    'Omphalos',
    'Iris',
    'Erebus',
    'Thalassa',
    'Aether',
    'Aegle',
] as const;

/** Ten domain suffixes — one for each combat/economy column. */
export const SUFFIXES = [
    'of Strike',
    'of Waves',
    'of Siege',
    'of Harvest',
    'of Fury',
    'of Fate',
    'of Wilds',
    'of Idle',
    'of Relics',
    'of the Nexus',
] as const;

const PREFIX_COUNT = PREFIXES.length;
const STEM_COUNT = STEMS.length;
const SUFFIX_COUNT = SUFFIXES.length;

/** 30 × 30 × 10 = 9000 unique names, one per upgrade slot in a tier. */
export const BLESSING_COUNT = PREFIX_COUNT * STEM_COUNT * SUFFIX_COUNT;

if (BLESSING_COUNT !== LEVELS_PER_TIER) {
    throw new Error(`Blessing catalog is ${BLESSING_COUNT}, expected ${LEVELS_PER_TIER}`);
}

export function blessingParts(id: number): { prefix: string; stem: string; suffix: string } {
    const slot = ((id % LEVELS_PER_TIER) + LEVELS_PER_TIER) % LEVELS_PER_TIER;
    const prefix = PREFIXES[slot % PREFIX_COUNT];
    const stem = STEMS[Math.floor(slot / PREFIX_COUNT) % STEM_COUNT];
    const suffix = SUFFIXES[Math.floor(slot / (PREFIX_COUNT * STEM_COUNT)) % SUFFIX_COUNT];
    return { prefix, stem, suffix };
}

export function blessingName(id: number): string {
    const { prefix, stem, suffix } = blessingParts(id);
    return `${prefix} ${stem} ${suffix}`;
}

export function blessingForLevel(level: number): string {
    return blessingName(level);
}
