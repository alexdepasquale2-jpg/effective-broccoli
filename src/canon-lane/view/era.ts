import { LEVELS_PER_TIER } from '../sim/constants.ts';
import type { ColumnProgress } from '../sim/types.ts';

export type EraId =
    | 'cathode'
    | 'vcs'
    | 'arcade'
    | 'nes'
    | 'snes'
    | 'temple'
    | 'olympus'
    | 'canon'
    | 'aether'
    | 'perfect';

export interface Era {
    id: EraId;
    title: string;
    blurb: string;
    minLevel: number;
    font: string;
    display: string;
    bg: number;
    panel: number;
    panelAlt: number;
    ink: number;
    gold: number;
    goldHex: string;
    ivory: string;
    mute: string;
    ally: number;
    enemy: number;
    wine: number;
    sea: number;
    ok: number;
    lane: number;
    laneHot: number;
    pixel: number;
    frames: number;
    bob: number;
    scanlines: number;
    rounded: number;
    particles: boolean;
    trails: boolean;
    shadows: boolean;
    portraits: boolean;
    sleek: boolean;
    perfect: boolean;
}

export const ERAS: Era[] = [
    {
        id: 'cathode',
        title: 'CATHODE',
        blurb: 'Two colors. Square lanes. A cabinet that has not learned its own name.',
        minLevel: 0,
        font: '"Courier New", Courier, monospace',
        display: '"Courier New", Courier, monospace',
        bg: 0x000000,
        panel: 0x101010,
        panelAlt: 0x181818,
        ink: 0x202020,
        gold: 0xc4a035,
        goldHex: '#c4a035',
        ivory: '#e8d888',
        mute: '#887830',
        ally: 0x5a8ab4,
        enemy: 0xb03a30,
        wine: 0x802020,
        sea: 0x204060,
        ok: 0x306030,
        lane: 0x101010,
        laneHot: 0x303000,
        pixel: 5,
        frames: 1,
        bob: 0,
        scanlines: 0.18,
        rounded: 0,
        particles: false,
        trails: false,
        shadows: false,
        portraits: false,
        sleek: false,
        perfect: false,
    },
    {
        id: 'vcs',
        title: 'VCS',
        blurb: 'Four colors. Chunky sprites. The first faces appear on the phosphor.',
        minLevel: 3,
        font: '"Courier New", Courier, monospace',
        display: '"Courier New", Courier, monospace',
        bg: 0x0a0810,
        panel: 0x16121c,
        panelAlt: 0x1c1824,
        ink: 0x241c28,
        gold: 0xd4b24a,
        goldHex: '#d4b24a',
        ivory: '#f0e0a0',
        mute: '#908050',
        ally: 0x4a90b8,
        enemy: 0xc04038,
        wine: 0x8a2830,
        sea: 0x1a4a68,
        ok: 0x3a6a38,
        lane: 0x141018,
        laneHot: 0x2a2430,
        pixel: 5,
        frames: 1,
        bob: 0.4,
        scanlines: 0.14,
        rounded: 0,
        particles: false,
        trails: false,
        shadows: false,
        portraits: true,
        sleek: false,
        perfect: false,
    },
    {
        id: 'arcade',
        title: 'ARCADE',
        blurb: 'The cabinet learns to bounce. Walk cycles. A coin-slot heartbeat.',
        minLevel: 8,
        font: '"Courier New", Courier, monospace',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x0c0a12,
        panel: 0x18141f,
        panelAlt: 0x201828,
        ink: 0x2a2030,
        gold: 0xe0bc50,
        goldHex: '#e0bc50',
        ivory: '#f3ead0',
        mute: '#9a8860',
        ally: 0x3d8ab0,
        enemy: 0xc44840,
        wine: 0x8a2d3c,
        sea: 0x1a5270,
        ok: 0x3d7a4a,
        lane: 0x181420,
        laneHot: 0x302838,
        pixel: 6,
        frames: 2,
        bob: 1.2,
        scanlines: 0.1,
        rounded: 2,
        particles: false,
        trails: false,
        shadows: false,
        portraits: true,
        sleek: false,
        perfect: false,
    },
    {
        id: 'nes',
        title: '8-BIT',
        blurb: 'Each champion gets a face. Unique silhouettes. The pantheon is drawn.',
        minLevel: 15,
        font: 'Arial, Helvetica, sans-serif',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x0c0a14,
        panel: 0x16101f,
        panelAlt: 0x1c1528,
        ink: 0x2a2038,
        gold: 0xe2c36b,
        goldHex: '#e2c36b',
        ivory: '#f3efe4',
        mute: '#8b80a0',
        ally: 0x3d7ea6,
        enemy: 0x8b2e3a,
        wine: 0x6b2d3c,
        sea: 0x1a5276,
        ok: 0x3d7a4a,
        lane: 0x1a1424,
        laneHot: 0x2e243c,
        pixel: 6,
        frames: 2,
        bob: 1.6,
        scanlines: 0.07,
        rounded: 4,
        particles: false,
        trails: false,
        shadows: true,
        portraits: true,
        sleek: false,
        perfect: false,
    },
    {
        id: 'snes',
        title: '16-BIT',
        blurb: 'Shadows under the wave. Attack flashes. The HUD starts to breathe.',
        minLevel: 25,
        font: 'Arial, Helvetica, sans-serif',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x0b0913,
        panel: 0x17111f,
        panelAlt: 0x1e1628,
        ink: 0x2c2240,
        gold: 0xe8c96e,
        goldHex: '#e8c96e',
        ivory: '#f6f1e8',
        mute: '#9488a8',
        ally: 0x4a8fba,
        enemy: 0xa03442,
        wine: 0x722e40,
        sea: 0x1c5a80,
        ok: 0x448a52,
        lane: 0x1c1628,
        laneHot: 0x342848,
        pixel: 7,
        frames: 3,
        bob: 2,
        scanlines: 0.04,
        rounded: 8,
        particles: true,
        trails: false,
        shadows: true,
        portraits: true,
        sleek: true,
        perfect: false,
    },
    {
        id: 'temple',
        title: 'TEMPLE',
        blurb: 'Marble, gold leaf, rounded stone. The house remembers it is a temple.',
        minLevel: 40,
        font: 'Arial, Helvetica, sans-serif',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x0c0a14,
        panel: 0x16101f,
        panelAlt: 0x1c1528,
        ink: 0x2a2038,
        gold: 0xe2c36b,
        goldHex: '#e2c36b',
        ivory: '#f3efe4',
        mute: '#8b80a0',
        ally: 0x3d7ea6,
        enemy: 0x8b2e3a,
        wine: 0x6b2d3c,
        sea: 0x1a5276,
        ok: 0x3d7a4a,
        lane: 0x241c32,
        laneHot: 0x3a2c4e,
        pixel: 7,
        frames: 3,
        bob: 2.2,
        scanlines: 0,
        rounded: 14,
        particles: true,
        trails: true,
        shadows: true,
        portraits: true,
        sleek: true,
        perfect: false,
    },
    {
        id: 'olympus',
        title: 'OLYMPUS',
        blurb: 'Trails, sparks, laurel light. The mountain is in the glass.',
        minLevel: 70,
        font: 'Arial, Helvetica, sans-serif',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x0a0812,
        panel: 0x181222,
        panelAlt: 0x22182e,
        ink: 0x322448,
        gold: 0xf0d078,
        goldHex: '#f0d078',
        ivory: '#fff8ee',
        mute: '#a898b8',
        ally: 0x5aa0c8,
        enemy: 0xc04050,
        wine: 0x8a3048,
        sea: 0x246888,
        ok: 0x4a9a58,
        lane: 0x261c38,
        laneHot: 0x443058,
        pixel: 8,
        frames: 3,
        bob: 2.6,
        scanlines: 0,
        rounded: 18,
        particles: true,
        trails: true,
        shadows: true,
        portraits: true,
        sleek: true,
        perfect: false,
    },
    {
        id: 'canon',
        title: 'CANON',
        blurb: 'Sleek chrome. Measured type. Every tap lands like a typeset mark.',
        minLevel: 120,
        font: 'Arial, Helvetica, sans-serif',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x09070f,
        panel: 0x14101c,
        panelAlt: 0x1c1626,
        ink: 0x2a2438,
        gold: 0xedc96a,
        goldHex: '#edc96a',
        ivory: '#faf6ef',
        mute: '#9a90a8',
        ally: 0x5aa8cc,
        enemy: 0xc44858,
        wine: 0x7a3044,
        sea: 0x206078,
        ok: 0x4a9860,
        lane: 0x201830,
        laneHot: 0x3c2c50,
        pixel: 8,
        frames: 3,
        bob: 2.8,
        scanlines: 0,
        rounded: 20,
        particles: true,
        trails: true,
        shadows: true,
        portraits: true,
        sleek: true,
        perfect: false,
    },
    {
        id: 'aether',
        title: 'AETHER',
        blurb: 'The glass thins. Motion is silk. Almost the game that was promised.',
        minLevel: 250,
        font: 'Arial, Helvetica, sans-serif',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x07060c,
        panel: 0x12101a,
        panelAlt: 0x1a1624,
        ink: 0x282436,
        gold: 0xf4d88a,
        goldHex: '#f4d88a',
        ivory: '#fffaf2',
        mute: '#b0a8bc',
        ally: 0x68b4d4,
        enemy: 0xd05060,
        wine: 0x8a3850,
        sea: 0x287090,
        ok: 0x58a868,
        lane: 0x1c1830,
        laneHot: 0x403060,
        pixel: 8,
        frames: 3,
        bob: 3,
        scanlines: 0,
        rounded: 22,
        particles: true,
        trails: true,
        shadows: true,
        portraits: true,
        sleek: true,
        perfect: false,
    },
    {
        id: 'perfect',
        title: 'PERFECT GAME',
        blurb: 'Nothing left to sand. The lane, the shop, the rite — one instrument.',
        minLevel: 500,
        font: 'Arial, Helvetica, sans-serif',
        display: 'Georgia, "Times New Roman", serif',
        bg: 0x06050a,
        panel: 0x100e18,
        panelAlt: 0x181420,
        ink: 0x262030,
        gold: 0xffe29a,
        goldHex: '#ffe29a',
        ivory: '#fffdf6',
        mute: '#c0b8c8',
        ally: 0x70c0dc,
        enemy: 0xe05868,
        wine: 0x983848,
        sea: 0x307898,
        ok: 0x60b070,
        lane: 0x1a1630,
        laneHot: 0x483868,
        pixel: 8,
        frames: 3,
        bob: 3.2,
        scanlines: 0,
        rounded: 24,
        particles: true,
        trails: true,
        shadows: true,
        portraits: true,
        sleek: true,
        perfect: true,
    },
];

export function resolveEra(column: ColumnProgress | undefined): Era {
    const level = column?.level ?? 0;
    const tierBonus = Math.max(0, (column?.tier ?? 1) - 1) * 40;
    const score = Math.min(LEVELS_PER_TIER, level + tierBonus);
    let current = ERAS[0];
    for (const era of ERAS) {
        if (score >= era.minLevel) {
            current = era;
        }
    }
    return current;
}

export function nextEra(column: ColumnProgress | undefined): Era | null {
    const current = resolveEra(column);
    const index = ERAS.findIndex((era) => era.id === current.id);
    return ERAS[index + 1] ?? null;
}

export function eraProgress(column: ColumnProgress | undefined): number {
    const current = resolveEra(column);
    const upcoming = nextEra(column);
    const level = column?.level ?? 0;
    const tierBonus = Math.max(0, (column?.tier ?? 1) - 1) * 40;
    const score = level + tierBonus;
    if (!upcoming) {
        return 1;
    }
    const span = upcoming.minLevel - current.minLevel;
    return span <= 0 ? 1 : Math.max(0, Math.min(1, (score - current.minLevel) / span));
}

export function hex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
}
