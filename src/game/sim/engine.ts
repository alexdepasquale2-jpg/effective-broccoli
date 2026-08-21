import { controlOf, factionName, opponent, tag } from './control';
import { clearCuts, cutRegion, isSupplied, pipelineFlow } from './logistics';
import { REGIONS, REGION_BY_ID } from './map';
import type { ActionType, Faction, GameState, Order, Outcome, RegionState, Stocks } from './types';

export { controlOf, factionName, opponent } from './control';
export const MAX_TURNS = 8;
export const AP_PER_TURN = 3;
export const WIN_REGIONS = 8;

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
    britain: 72, nordics: 62, west: 76, germany: 64, central: 19,
    baltics: 16, italy: 18, iberia: 50, balkans: 8, ukraine: -8,
    belarus: -72, russia: -88, blacksea: -36,
};

const START_PIPE: Record<string, number> = {
    west: 82, germany: 76, italy: 58, baltics: 52, ukraine: 38, blacksea: 72, russia: 88,
};

const SUPPLY_COST: Record<ActionType, number> = {
    shape: 5, grid: 6, net: 4, hold: 3, troops: 8, drone: 4, missile: 6, talk: 2,
};

export function createGame(player: Faction): GameState {
    const regions: Record<string, RegionState> = {};
    for (const region of REGIONS) {
        regions[region.id] = {
            id: region.id,
            lean: START_LEAN[region.id],
            shield: 0,
            troopsEu: 0,
            troopsRu: 0,
            dronesEu: 0,
            dronesRu: 0,
            batteries: 0,
            depot: region.supplyHub ? 40 : 12,
            pipeline: region.pipeHub ? (START_PIPE[region.id] || 50) : 0,
        };
    }
    regions.ukraine.troopsEu = 1;
    regions.ukraine.troopsRu = 2;
    regions.baltics.troopsEu = 1;
    regions.baltics.dronesEu = 1;
    regions.germany.troopsEu = 2;
    regions.germany.batteries = 1;
    regions.west.dronesEu = 1;
    regions.central.troopsEu = 1;
    regions.britain.batteries = 1;
    regions.belarus.troopsRu = 2;
    regions.russia.troopsRu = 3;
    regions.russia.batteries = 2;
    regions.blacksea.troopsRu = 1;
    regions.blacksea.dronesRu = 1;
    regions.blacksea.batteries = 1;

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
        stocks: {
            eu: { troops: 8, drones: 6, missiles: 3, supplies: 62 },
            ru: { troops: 9, drones: 5, missiles: 6, supplies: 58 },
        },
        cuts: {},
        log: [
            player === 'eu'
                ? 'SITREP: Troops, drones, missiles, and the pipes are on the board. Keep Heat down.'
                : 'SITREP: Formations, drones, missiles, and the export grid are live. Do not trip the hot war.',
        ],
        lastKinetic: null,
        apPenalty: { eu: 0, ru: 0 },
    };
}

export function seasonName(turn: number): string {
    return SEASONS[Math.min(turn, SEASONS.length - 1)];
}

export function countControlled(state: GameState, faction: Faction): number {
    return REGIONS.filter((region) => controlOf(state.regions[region.id].lean) === faction).length;
}

export function actionLabel(type: ActionType): string {
    switch (type) {
        case 'shape': return 'SHAPE';
        case 'grid': return 'GRID';
        case 'net': return 'NET';
        case 'hold': return 'HOLD';
        case 'troops': return 'TROOPS';
        case 'drone': return 'DRONE';
        case 'missile': return 'STRIKE';
        case 'talk': return 'TALK';
    }
}

export function cloneState(state: GameState): GameState {
    return {
        ...state,
        regions: Object.fromEntries(
            Object.entries(state.regions).map(([id, region]) => [id, { ...region }]),
        ),
        stocks: {
            eu: { ...state.stocks.eu },
            ru: { ...state.stocks.ru },
        },
        cuts: { ...state.cuts },
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
    const bag = next.stocks[actor];
    const cost = SUPPLY_COST[order.type];
    const sign = actor === 'eu' ? 1 : -1;
    const shielded = region.shield > 0 && order.type !== 'hold' && order.type !== 'talk';
    const fed = isSupplied(next, order.regionId, actor);

    if (bag.supplies < cost) {
        pushLog(next, `REFUSED: ${actionLabel(order.type)} needs ${cost} supplies (have ${Math.round(bag.supplies)}).`);
        return next;
    }
    if (order.type === 'troops' && bag.troops < 1) {
        pushLog(next, 'REFUSED: no formations left in reserve.');
        return next;
    }
    if (order.type === 'drone' && bag.drones < 1) {
        pushLog(next, 'REFUSED: no drone packages in reserve.');
        return next;
    }
    if (order.type === 'missile' && bag.missiles < 1) {
        pushLog(next, 'REFUSED: no missiles on the rail.');
        return next;
    }

    bag.supplies -= cost;

    switch (order.type) {
        case 'shape': {
            let delta = 12 + Math.floor(Math.random() * 5) + def.value * 0.3;
            if (!fed) {
                delta *= 0.7;
            }
            if (actor === 'eu' && next.energyEu < 38) {
                delta -= 4;
            }
            if (shielded) {
                delta *= 0.45;
            }
            region.lean = clamp(region.lean + sign * delta, -100, 100);
            pushLog(next, `${tag(actor)} SHAPE ${def.short}: lean ${fmtLean(region.lean)}.`);
            break;
        }
        case 'grid': {
            if (def.pipeHub) {
                region.pipeline = clamp(region.pipeline + (controlOf(region.lean) === actor ? 14 : -12), 0, 100);
            }
            if (actor === 'eu') {
                next.energyEu = clamp(next.energyEu + 6 + pipelineFlow(next, 'eu') * 0.04, 0, 100);
                next.energyRu = clamp(next.energyRu - 2, 0, 100);
                pushLog(next, `EUROPE GRID ${def.short}: interconnects and LNG. Pipe ${Math.round(region.pipeline)}.`);
            } else {
                next.energyEu = clamp(next.energyEu - 8, 0, 100);
                next.energyRu = clamp(next.energyRu + 5, 0, 100);
                if (def.pipeHub) {
                    region.pipeline = clamp(region.pipeline - 6, 0, 100);
                }
                pushLog(next, `RUSSIA GRID ${def.short}: export squeeze. EU energy ${Math.round(next.energyEu)}.`);
            }
            region.lean = clamp(region.lean + sign * 3, -100, 100);
            region.depot = clamp(region.depot + 6, 0, 100);
            bag.supplies = clamp(bag.supplies + 4, 0, 100);
            break;
        }
        case 'net': {
            next.heat = clamp(next.heat + 5, 0, 100);
            cutRegion(next, order.regionId, 2);
            if (def.pipeHub) {
                region.pipeline = clamp(region.pipeline - 10, 0, 100);
            }
            let delta = 7 + def.value * 0.3;
            if (shielded) {
                delta *= 0.4;
            }
            region.lean = clamp(region.lean + sign * delta, -100, 100);
            if (Math.random() < 0.4) {
                next.apPenalty[opponent(actor)] += 1;
                pushLog(next, `${tag(actor)} NET ${def.short}: supply lines cut. Heat +5. Enemy AP -1.`);
            } else {
                pushLog(next, `${tag(actor)} NET ${def.short}: lines flickering. Heat +5.`);
            }
            break;
        }
        case 'hold': {
            region.shield = Math.max(region.shield, 2);
            region.depot = clamp(region.depot + 8, 0, 100);
            region.lean = clamp(region.lean + sign * 3, -100, 100);
            if (def.pipeHub) {
                region.pipeline = clamp(region.pipeline + 4, 0, 100);
            }
            pushLog(next, `${tag(actor)} HOLD ${def.short}: depots and shield up.`);
            break;
        }
        case 'troops': {
            bag.troops -= 1;
            if (actor === 'eu') {
                region.troopsEu += 1;
            } else {
                region.troopsRu += 1;
            }
            next.heat = clamp(next.heat + 8, 0, 100);
            next.lastKinetic = actor;
            const clash = resolveClash(next, region, actor, fed);
            region.lean = clamp(region.lean + sign * (8 + clash.lean), -100, 100);
            const supplyNote = fed ? 'supplied' : 'forward, thin supply';
            pushLog(next, `${tag(actor)} TROOPS ${def.short}: +1 formation (${supplyNote}). Heat +8.${clash.note}`);
            break;
        }
        case 'drone': {
            bag.drones -= 1;
            if (actor === 'eu') {
                region.dronesEu += 1;
            } else {
                region.dronesRu += 1;
            }
            cutRegion(next, order.regionId, 1);
            const enemyTroops = actor === 'eu' ? region.troopsRu : region.troopsEu;
            if (enemyTroops > 0 && Math.random() < 0.5) {
                if (actor === 'eu') {
                    region.troopsRu -= 1;
                } else {
                    region.troopsEu -= 1;
                }
                pushLog(next, `${tag(actor)} DRONE ${def.short}: interdict + strike. Enemy troop -1. Heat +4.`);
            } else {
                pushLog(next, `${tag(actor)} DRONE ${def.short}: ISR and interdiction. Line cut. Heat +4.`);
            }
            if (def.pipeHub) {
                region.pipeline = clamp(region.pipeline - 7, 0, 100);
            }
            next.heat = clamp(next.heat + 4, 0, 100);
            region.lean = clamp(region.lean + sign * 6, -100, 100);
            region.depot = clamp(region.depot - 5, 0, 100);
            break;
        }
        case 'missile': {
            bag.missiles -= 1;
            next.heat = clamp(next.heat + 14, 0, 100);
            next.lastKinetic = actor;
            const tHit = actor === 'eu' ? Math.min(2, region.troopsRu) : Math.min(2, region.troopsEu);
            const dHit = actor === 'eu' ? Math.min(1, region.dronesRu) : Math.min(1, region.dronesEu);
            if (actor === 'eu') {
                region.troopsRu -= tHit;
                region.dronesRu -= dHit;
            } else {
                region.troopsEu -= tHit;
                region.dronesEu -= dHit;
            }
            if (def.pipeHub) {
                region.pipeline = clamp(region.pipeline - 16, 0, 100);
            }
            region.depot = clamp(region.depot - 12, 0, 100);
            region.lean = clamp(region.lean + sign * (10 + tHit * 3), -100, 100);
            pushLog(next, `${tag(actor)} STRIKE ${def.short}: troops -${tHit} drones -${dHit}. Pipe ${Math.round(region.pipeline)}. Heat +14.`);
            break;
        }
        case 'talk': {
            next.heat = clamp(next.heat - 10, 0, 100);
            clearCuts(next, order.regionId);
            region.lean = clamp(region.lean + sign * 5, -100, 100);
            bag.supplies = clamp(bag.supplies + 3, 0, 100);
            pushLog(next, `${tag(actor)} TALK ${def.short}: corridors reopen. Heat -10.`);
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

    if (next.current === next.player) {
        tickLogistics(next);
        next.heat = clamp(next.heat - 2, 0, 100);
        for (const region of Object.values(next.regions)) {
            if (region.shield > 0) {
                region.shield -= 1;
            }
        }
        for (const key of Object.keys(next.cuts)) {
            next.cuts[key] -= 1;
            if (next.cuts[key] <= 0) {
                delete next.cuts[key];
            }
        }
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
    const supplyTax = next.stocks[next.current].supplies < 12 ? 1 : 0;
    next.ap = Math.max(1, AP_PER_TURN - penalty - energyTax - supplyTax);
    next.maxAp = next.ap;
    const who = factionName(next.current).toUpperCase();
    pushLog(next, `${who} // ${seasonName(next.turn)} — ${next.ap} ops. SUP ${Math.round(next.stocks[next.current].supplies)}.`);
    next.over = evaluate(next);
    return next;
}

function tickLogistics(state: GameState): void {
    for (const faction of ['eu', 'ru'] as Faction[]) {
        const flow = pipelineFlow(state, faction);
        const bag = state.stocks[faction];
        bag.supplies = clamp(bag.supplies + 5 + flow * 0.08, 0, 100);
        if (faction === 'eu') {
            state.energyEu = clamp(state.energyEu * 0.72 + flow * 0.35, 0, 100);
        } else {
            state.energyRu = clamp(state.energyRu * 0.72 + flow * 0.35, 0, 100);
        }
        for (const def of REGIONS) {
            const region = state.regions[def.id];
            const fed = isSupplied(state, def.id, faction);
            const troops = faction === 'eu' ? region.troopsEu : region.troopsRu;
            if (fed) {
                region.depot = clamp(region.depot + 5, 0, 100);
                if (region.batteries > 0 && controlOf(region.lean) === faction) {
                    bag.missiles = clamp(bag.missiles + region.batteries, 0, 16);
                }
                if (def.id === 'west' && faction === 'eu') {
                    bag.drones = clamp(bag.drones + 1, 0, 16);
                }
                if (def.id === 'blacksea' && faction === 'ru') {
                    bag.drones = clamp(bag.drones + 1, 0, 16);
                }
            } else if (troops > 0 && Math.random() < 0.4) {
                if (faction === 'eu') {
                    region.troopsEu -= 1;
                } else {
                    region.troopsRu -= 1;
                }
                pushLog(state, `ATTRITION ${def.short}: ${tag(faction)} formation unsupplied.`);
            }
            if (troops > 0) {
                bag.supplies = clamp(bag.supplies - troops, 0, 100);
            }
            if (def.pipeHub && controlOf(region.lean) === faction) {
                region.pipeline = clamp(region.pipeline + 3, 0, 100);
            }
        }
        if (bag.troops < 12) {
            bag.troops += 1;
        }
    }
    pushLog(state, `LOGISTICS: EU pipe ${Math.round(pipelineFlow(state, 'eu'))}  RU pipe ${Math.round(pipelineFlow(state, 'ru'))}.`);
}

function resolveClash(state: GameState, region: RegionState, actor: Faction, fed: boolean): { lean: number; note: string } {
    const mine = actor === 'eu' ? region.troopsEu : region.troopsRu;
    const theirs = actor === 'eu' ? region.troopsRu : region.troopsEu;
    const drones = actor === 'eu' ? region.dronesEu : region.dronesRu;
    if (theirs <= 0) {
        return { lean: 4 + drones, note: '' };
    }
    const mineEff = (fed ? mine : Math.max(1, Math.ceil(mine * 0.6))) + drones * 0.5 + (region.shield > 0 && actor === state.current ? 1 : 0);
    let note = ' Contact.';
    if (Math.random() < 0.45 + mineEff * 0.08) {
        if (actor === 'eu') {
            region.troopsRu = Math.max(0, region.troopsRu - 1);
        } else {
            region.troopsEu = Math.max(0, region.troopsEu - 1);
        }
        note = ' Enemy formation broken.';
        state.heat = clamp(state.heat + 4, 0, 100);
        return { lean: 8, note };
    }
    if (Math.random() < 0.35) {
        if (actor === 'eu') {
            region.troopsEu = Math.max(0, region.troopsEu - 1);
        } else {
            region.troopsRu = Math.max(0, region.troopsRu - 1);
        }
        note = ' Own formation pinned.';
        return { lean: -2, note };
    }
    return { lean: 2, note: ' Standoff.' };
}

function evaluate(state: GameState): Outcome | undefined {
    if (state.heat >= 100) {
        return {
            kind: 'hot',
            winner: 'none',
            title: 'HOT WAR',
            blurb: 'Heat hit the red line. Missiles and troops are no longer a warm-war tool. Nobody claims a political victory.',
        };
    }
    const eu = countControlled(state, 'eu');
    const ru = countControlled(state, 'ru');
    if (eu >= WIN_REGIONS) {
        return {
            kind: 'political',
            winner: 'eu',
            title: 'EUROPE HOLDS',
            blurb: 'Eight theaters lean Brussels. The pipes and the lines still run west.',
        };
    }
    if (ru >= WIN_REGIONS) {
        return {
            kind: 'political',
            winner: 'ru',
            title: 'MOSCOW SETS TERMS',
            blurb: 'Eight theaters lean Russia. Europe is bargaining from a thinner grid.',
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
    if (state.log.length > 16) {
        state.log.splice(0, state.log.length - 16);
    }
}

function fmtLean(lean: number): string {
    const n = Math.round(lean);
    return n > 0 ? `+${n}` : `${n}`;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export function stocksLine(stocks: Stocks): string {
    return `SUP ${Math.round(stocks.supplies)}  T ${stocks.troops}  D ${stocks.drones}  M ${stocks.missiles}`;
}
