import { REGIONS, REGION_BY_ID } from './map';
import type { ActionType, Control, Faction, GameState, Order, Outcome, RegionState } from './types';

export const MAX_TURNS = 8;
export const AP_PER_TURN = 3;
export const WIN_REGIONS = 8;
export const CONTROL_THRESHOLD = 22;

export const SEASONS = [
    'Winter 2026',
    'Spring 2026',
    'Summer 2026',
    'Autumn 2026',
    'Winter 2027',
    'Spring 2027',
    'Summer 2027',
    'Autumn 2027',
];

const START_LEAN: Record<string, number> = {
    britain: 72,
    nordics: 62,
    west: 76,
    germany: 64,
    central: 19,
    baltics: 16,
    italy: 18,
    iberia: 50,
    balkans: 8,
    ukraine: -8,
    belarus: -72,
    russia: -88,
    blacksea: -36,
};

export function createGame(player: Faction): GameState {
    const regions: Record<string, RegionState> = {};
    for (const region of REGIONS) {
        regions[region.id] = { id: region.id, lean: START_LEAN[region.id], shield: 0 };
    }
    return {
        turn: 0,
        maxTurns: MAX_TURNS,
        player,
        current: player,
        ap: AP_PER_TURN,
        maxAp: AP_PER_TURN,
        energyEu: 56,
        energyRu: 74,
        heat: 18,
        regions,
        log: [
            player === 'eu'
                ? 'SITREP: Brussels takes the watch. Keep Heat below the red line.'
                : 'SITREP: Moscow takes the watch. Split the grid. Do not trip the hot war.',
        ],
        lastKinetic: null,
        apPenalty: { eu: 0, ru: 0 },
    };
}

export function seasonName(turn: number): string {
    return SEASONS[Math.min(turn, SEASONS.length - 1)];
}

export function controlOf(lean: number): Control {
    if (lean >= CONTROL_THRESHOLD) {
        return 'eu';
    }
    if (lean <= -CONTROL_THRESHOLD) {
        return 'ru';
    }
    return 'contested';
}

export function countControlled(state: GameState, faction: Faction): number {
    return REGIONS.filter((region) => controlOf(state.regions[region.id].lean) === faction).length;
}

export function opponent(faction: Faction): Faction {
    return faction === 'eu' ? 'ru' : 'eu';
}

export function factionName(faction: Faction): string {
    return faction === 'eu' ? 'Europe' : 'Russia';
}

export function actionLabel(type: ActionType): string {
    switch (type) {
        case 'shape':
            return 'SHAPE';
        case 'grid':
            return 'GRID';
        case 'net':
            return 'NET';
        case 'hold':
            return 'HOLD';
        case 'posture':
            return 'POSTURE';
        case 'talk':
            return 'TALK';
    }
}

export function cloneState(state: GameState): GameState {
    return {
        ...state,
        regions: Object.fromEntries(
            Object.entries(state.regions).map(([id, region]) => [id, { ...region }]),
        ),
        log: [...state.log],
        apPenalty: { ...state.apPenalty },
        over: state.over ? { ...state.over } : undefined,
    };
}

export function applyOrder(state: GameState, order: Order): GameState {
    const next = cloneState(state);
    if (next.over || next.ap <= 0) {
        return next;
    }
    const region = next.regions[order.regionId];
    const def = REGION_BY_ID[order.regionId];
    if (!region || !def) {
        return next;
    }

    const actor = next.current;
    const sign = actor === 'eu' ? 1 : -1;
    const shielded = region.shield > 0 && order.type !== 'hold' && order.type !== 'talk';

    switch (order.type) {
        case 'shape': {
            let delta = 13 + Math.floor(Math.random() * 6) + def.value * 0.35;
            if (actor === 'eu' && next.energyEu < 38) {
                delta -= 4;
            }
            if (actor === 'ru' && next.energyEu < 42) {
                delta += 3 * def.energyDemand;
            }
            if (shielded) {
                delta *= 0.45;
            }
            region.lean = clamp(region.lean + sign * delta, -100, 100);
            pushLog(next, `${tag(actor)} SHAPE ${def.short}: lean ${fmtLean(region.lean)}.`);
            break;
        }
        case 'grid': {
            if (actor === 'eu') {
                next.energyEu = clamp(next.energyEu + 9, 0, 100);
                next.energyRu = clamp(next.energyRu - 2, 0, 100);
                for (const id of ['west', 'germany', 'italy', 'iberia']) {
                    next.regions[id].lean = clamp(next.regions[id].lean + 5, -100, 100);
                }
                pushLog(next, 'EUROPE GRID: LNG and interconnects hold. Energy +9.');
            } else {
                next.energyEu = clamp(next.energyEu - 11, 0, 100);
                next.energyRu = clamp(next.energyRu + 4, 0, 100);
                for (const id of ['west', 'germany', 'italy', 'balkans', 'central']) {
                    const demand = REGION_BY_ID[id].energyDemand;
                    next.regions[id].lean = clamp(next.regions[id].lean - 6 * demand, -100, 100);
                }
                pushLog(next, 'RUSSIA GRID: export squeeze. European energy -11.');
            }
            region.lean = clamp(region.lean + sign * 4, -100, 100);
            break;
        }
        case 'net': {
            next.heat = clamp(next.heat + 5, 0, 100);
            let delta = 9 + def.value * 0.4;
            if (shielded) {
                delta *= 0.4;
            }
            region.lean = clamp(region.lean + sign * delta, -100, 100);
            if (Math.random() < 0.42) {
                next.apPenalty[opponent(actor)] += 1;
                pushLog(next, `${tag(actor)} NET ${def.short}: disruption. Heat +5. Enemy AP -1 next season.`);
            } else {
                pushLog(next, `${tag(actor)} NET ${def.short}: probes land. Heat +5.`);
            }
            break;
        }
        case 'hold': {
            region.shield = Math.max(region.shield, 2);
            region.lean = clamp(region.lean + sign * 3, -100, 100);
            pushLog(next, `${tag(actor)} HOLD ${def.short}: hardened for 2 seasons.`);
            break;
        }
        case 'posture': {
            next.heat = clamp(next.heat + 16, 0, 100);
            next.lastKinetic = actor;
            let delta = 20 + def.value * 0.6;
            if (shielded) {
                delta *= 0.55;
            }
            region.lean = clamp(region.lean + sign * delta, -100, 100);
            pushLog(next, `${tag(actor)} POSTURE ${def.short}: force on the line. Heat +16.`);
            break;
        }
        case 'talk': {
            next.heat = clamp(next.heat - 10, 0, 100);
            region.lean = clamp(region.lean + sign * 6, -100, 100);
            pushLog(next, `${tag(actor)} TALK ${def.short}: back-channel. Heat -10.`);
            break;
        }
    }

    next.ap -= 1;
    next.over = evaluate(next);
    return next;
}

export function endTurn(state: GameState): GameState {
    const next = cloneState(state);
    if (next.over) {
        return next;
    }

    const finishing = next.current;
    next.current = opponent(finishing);
    next.heat = clamp(next.heat - 2, 0, 100);
    for (const region of Object.values(next.regions)) {
        if (region.shield > 0) {
            region.shield -= 1;
        }
    }

    if (next.current === next.player) {
        next.turn += 1;
        if (next.turn >= next.maxTurns) {
            next.over = timedOutcome(next);
            pushLog(next, 'CLOCK: the 2026–27 window closes.');
            return next;
        }
    }

    const penalty = next.apPenalty[next.current] || 0;
    next.apPenalty[next.current] = 0;
    const energyTax = next.current === 'eu' && next.energyEu < 32 ? 1 : 0;
    next.ap = Math.max(1, AP_PER_TURN - penalty - energyTax);
    next.maxAp = next.ap;
    const who = factionName(next.current).toUpperCase();
    const season = seasonName(next.current === next.player ? next.turn : next.turn);
    pushLog(next, `${who} // ${season} — ${next.ap} operations.`);
    next.over = evaluate(next);
    return next;
}

function evaluate(state: GameState): Outcome | undefined {
    if (state.heat >= 100) {
        return {
            kind: 'hot',
            winner: 'none',
            title: 'HOT WAR',
            blurb: 'Heat hit the red line. The warm war is over. Nobody claims a political victory.',
        };
    }
    const eu = countControlled(state, 'eu');
    const ru = countControlled(state, 'ru');
    if (eu >= WIN_REGIONS) {
        return {
            kind: 'political',
            winner: 'eu',
            title: 'EUROPE HOLDS',
            blurb: 'Eight theaters lean Brussels. Moscow still has cards, but the continent did not split.',
        };
    }
    if (ru >= WIN_REGIONS) {
        return {
            kind: 'political',
            winner: 'ru',
            title: 'MOSCOW SETS TERMS',
            blurb: 'Eight theaters lean Russia. Europe is bargaining from a weaker map.',
        };
    }
    return undefined;
}

function timedOutcome(state: GameState): Outcome {
    const eu = countControlled(state, 'eu');
    const ru = countControlled(state, 'ru');
    if (eu === ru) {
        return {
            kind: 'timed',
            winner: 'none',
            title: 'FROZEN WARM WAR',
            blurb: `Clock runs out at ${eu}–${ru}. The map is still a bargain, not a peace.`,
        };
    }
    const winner: Faction = eu > ru ? 'eu' : 'ru';
    return {
        kind: 'timed',
        winner,
        title: winner === 'eu' ? 'EUROPE BY CLOCK' : 'RUSSIA BY CLOCK',
        blurb: `Seasons exhausted. Theaters ${eu} Europe / ${ru} Russia. Heat ${Math.round(state.heat)}.`,
    };
}

function pushLog(state: GameState, line: string): void {
    state.log.push(line);
    if (state.log.length > 14) {
        state.log.splice(0, state.log.length - 14);
    }
}

function tag(faction: Faction): string {
    return faction === 'eu' ? 'EU' : 'RU';
}

function fmtLean(lean: number): string {
    const n = Math.round(lean);
    return n > 0 ? `+${n}` : `${n}`;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
