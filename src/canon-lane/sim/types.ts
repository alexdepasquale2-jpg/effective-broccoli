export type TreeId =
    | 'gui'
    | 'strike'
    | 'fury'
    | 'aegis'
    | 'wave'
    | 'siege'
    | 'harvest'
    | 'fate'
    | 'wilds'
    | 'omen'
    | 'idle'
    | 'relic'
    | 'nexus';

export type LaneId = 0 | 1 | 2;

export type BulkMode = 1 | 10 | 100 | 1000 | 'max';

export type ShopTab = 'screen' | 'trees' | 'tiers' | 'roster' | 'lanes' | 'meta';

export interface ColumnProgress {
    level: number;
    tier: number;
}

export interface ChampionProgress {
    unlocked: boolean;
    level: number;
    tier: number;
}

export interface MetaProgress {
    efficiency: number;
    autoBuy: boolean;
    haptic: number;
    insight: number;
}

export interface PlayerPower {
    clickDamage: number;
    dps: number;
    champHp: number;
    minionDamage: number;
    minionHp: number;
    towerDamage: number;
    towerHp: number;
    goldPerClick: number;
    goldPerSecond: number;
    lastHitBonus: number;
    critChance: number;
    critDamage: number;
    jungleGold: number;
    omenBurst: number;
    idleMult: number;
    globalMult: number;
    matchGold: number;
    matchGlory: number;
    costMult: number;
}

export interface CombatUnit {
    id: number;
    team: 0 | 1;
    kind: 'minion' | 'champ' | 'tower' | 'nexus' | 'camp';
    lane: LaneId;
    pos: number;
    hp: number;
    maxHp: number;
    dmg: number;
    range: number;
    speed: number;
    gold: number;
    attackCd: number;
}

export interface MatchEvent {
    kind: 'damage' | 'gold' | 'lastHit' | 'crit' | 'tower' | 'victory' | 'defeat' | 'omen' | 'camp';
    lane: LaneId;
    amount: number;
    x?: number;
    y?: number;
}

export interface MatchState {
    index: number;
    elapsed: number;
    waveTimer: number;
    omenTimer: number;
    campTimer: number;
    units: CombatUnit[];
    nextId: number;
    over: 'victory' | 'defeat' | null;
    goldBanked: number;
}

export interface GameState {
    gold: number;
    glory: number;
    totalGold: number;
    clicks: number;
    lastHits: number;
    crits: number;
    matchesWon: number;
    matchesLost: number;
    trees: Record<TreeId, ColumnProgress>;
    lanes: Record<LaneId, ColumnProgress>;
    champions: Record<string, ChampionProgress>;
    selectedChampion: string;
    selectedLane: LaneId;
    meta: MetaProgress;
    bulk: BulkMode;
    tab: ShopTab;
    match: MatchState;
    lastTick: number;
    createdAt: number;
}

export interface TreeDef {
    id: TreeId;
    title: string;
    greek: string;
    blurb: string;
    color: number;
    baseCost: number;
    basePower: number;
}

export const TREE_IDS: TreeId[] = [
    'gui',
    'strike',
    'fury',
    'aegis',
    'wave',
    'siege',
    'harvest',
    'fate',
    'wilds',
    'omen',
    'idle',
    'relic',
    'nexus',
];

export const TREE_DEFS: Record<TreeId, TreeDef> = {
    gui: {
        id: 'gui',
        title: 'Screen',
        greek: 'Aegle',
        blurb: 'Upgrade the game itself — cathode to the Perfect Game.',
        color: 0xf4d88a,
        baseCost: 6,
        basePower: 0.05,
    },
    strike: {
        id: 'strike',
        title: 'Strike',
        greek: 'Harpe',
        blurb: 'Tap damage. The bow of David, the bolt of Zeus.',
        color: 0xe2c36b,
        baseCost: 5,
        basePower: 1.15,
    },
    fury: {
        id: 'fury',
        title: 'Fury',
        greek: 'Ares',
        blurb: 'Idle attacks. The lane fights while you look away.',
        color: 0xc45c4a,
        baseCost: 12,
        basePower: 0.55,
    },
    aegis: {
        id: 'aegis',
        title: 'Aegis',
        greek: 'Athena',
        blurb: 'Champion vitality. The shield that does not split.',
        color: 0x8fb4d4,
        baseCost: 18,
        basePower: 8,
    },
    wave: {
        id: 'wave',
        title: 'Wave',
        greek: 'Phalanx',
        blurb: 'Minion steel. Three hundred in every spawn.',
        color: 0x6a8f6a,
        baseCost: 15,
        basePower: 0.45,
    },
    siege: {
        id: 'siege',
        title: 'Siege',
        greek: 'Hoplon',
        blurb: 'Tower fire. Horns against the wall.',
        color: 0x9a7a4a,
        baseCost: 22,
        basePower: 0.7,
    },
    harvest: {
        id: 'harvest',
        title: 'Harvest',
        greek: 'Cornucopia',
        blurb: 'Gold from clicks, last-hits, and the idle glean.',
        color: 0xd4a017,
        baseCost: 8,
        basePower: 0.22,
    },
    fate: {
        id: 'fate',
        title: 'Fate',
        greek: 'Moirae',
        blurb: 'Crit chance and crit wounds.',
        color: 0xb56b9a,
        baseCost: 28,
        basePower: 0.12,
    },
    wilds: {
        id: 'wilds',
        title: 'Wilds',
        greek: 'Artemis',
        blurb: 'Jungle camps. Extra gold on the edges of the map.',
        color: 0x3d7a4a,
        baseCost: 35,
        basePower: 1.4,
    },
    omen: {
        id: 'omen',
        title: 'Omen',
        greek: 'Keraunos',
        blurb: 'A timed burst down the focused lane.',
        color: 0x7a6ad4,
        baseCost: 40,
        basePower: 4,
    },
    idle: {
        id: 'idle',
        title: 'Idle',
        greek: 'Hypnos',
        blurb: 'Offline gains and match tempo while you rest.',
        color: 0x5a6a8a,
        baseCost: 25,
        basePower: 0.08,
    },
    relic: {
        id: 'relic',
        title: 'Relic',
        greek: 'Omphalos',
        blurb: 'A global multiplier on every other column.',
        color: 0xc9a227,
        baseCost: 60,
        basePower: 0.04,
    },
    nexus: {
        id: 'nexus',
        title: 'Nexus',
        greek: 'Hestia',
        blurb: 'Match spoils — gold and glory when the crystal falls.',
        color: 0xd98ba0,
        baseCost: 48,
        basePower: 0.15,
    },
};

export const LANE_NAMES: Record<LaneId, string> = {
    0: 'Top',
    1: 'Mid',
    2: 'Bot',
};

export const LANE_GREEK: Record<LaneId, string> = {
    0: 'Olympus',
    1: 'Omphalos',
    2: 'Thalassa',
};
