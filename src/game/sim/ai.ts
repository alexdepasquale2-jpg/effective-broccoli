import { REGIONS } from './map';
import { controlOf, opponent } from './control';
import { isSupplied } from './logistics';
import type { ActionType, GameState, Order } from './types';

const ACTIONS: ActionType[] = ['shape', 'grid', 'net', 'hold', 'troops', 'drone', 'missile', 'talk'];

export function chooseAiOrder(state: GameState): Order | 'end' {
    if (state.ap <= 0 || state.over) {
        return 'end';
    }

    let best: { score: number; order: Order } | undefined;
    for (const type of ACTIONS) {
        for (const region of REGIONS) {
            const score = scoreOrder(state, type, region.id) + Math.random() * 3.2;
            if (!best || score > best.score) {
                best = { score, order: { type, regionId: region.id } };
            }
        }
    }
    if (!best || best.score < 2) {
        return 'end';
    }
    return best.order;
}

function scoreOrder(state: GameState, type: ActionType, regionId: string): number {
    const side = state.current;
    const bag = state.stocks[side];
    const region = state.regions[regionId];
    const def = REGIONS.find((item) => item.id === regionId);
    if (!region || !def) {
        return -999;
    }
    if (type === 'troops' && bag.troops < 1) {
        return -50;
    }
    if (type === 'drone' && bag.drones < 1) {
        return -50;
    }
    if (type === 'missile' && bag.missiles < 1) {
        return -50;
    }

    const lean = region.lean;
    const control = controlOf(lean);
    const mine = control === side;
    const theirs = control === opponent(side);
    const closeness = 40 - Math.min(40, Math.abs(lean));
    const enemyTroops = side === 'eu' ? region.troopsRu : region.troopsEu;
    const fed = isSupplied(state, regionId, side);
    let score = def.value;
    if (bag.supplies < 8 && (type === 'talk' || type === 'grid' || type === 'hold')) {
        score += type === 'talk' ? 8 : 4;
    }

    switch (type) {
        case 'shape':
            score += closeness * 0.45 + (mine ? 0 : 8);
            break;
        case 'grid':
            score = 9 + (side === 'ru' ? state.energyEu * 0.12 : (70 - state.energyEu) * 0.2);
            if (def.pipeHub) {
                score += 8;
            }
            if (bag.supplies < 30) {
                score += 6;
            }
            break;
        case 'net':
            score += theirs ? 8 : 3;
            if (def.pipeHub || !fed) {
                score += 5;
            }
            if (state.heat > 78) {
                score -= 12;
            }
            break;
        case 'hold':
            score = mine || control === 'contested' ? 6 + def.value * 0.4 : -4;
            if (region.shield > 0) {
                score -= 10;
            }
            break;
        case 'troops':
            score = closeness * 0.5 + enemyTroops * 3 + def.value;
            if (!fed) {
                score -= 6;
            }
            if (state.heat > 72) {
                score -= 14;
            }
            if (['ukraine', 'baltics', 'central', 'balkans'].includes(regionId)) {
                score += 6;
            }
            break;
        case 'drone':
            score = 8 + enemyTroops * 2 + (def.pipeHub ? 5 : 0);
            if (theirs) {
                score += 4;
            }
            if (state.heat > 82) {
                score -= 8;
            }
            break;
        case 'missile':
            score = enemyTroops * 4 + (def.pipeHub ? 7 : 2) + closeness * 0.2;
            if (state.heat > 64) {
                score -= 16;
            }
            if (state.heat > 82) {
                score -= 40;
            }
            break;
        case 'talk':
            score = state.heat > 68 ? 18 + (state.heat - 68) * 0.4 : 1;
            if (state.heat < 48) {
                score -= 8;
            }
            break;
    }
    return score;
}
