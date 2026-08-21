import { REGIONS } from './map';
import { controlOf, opponent } from './engine';
import type { ActionType, GameState, Order } from './types';

const ACTIONS: ActionType[] = ['shape', 'grid', 'net', 'hold', 'posture', 'talk'];

export function chooseAiOrder(state: GameState): Order | 'end' {
    if (state.ap <= 0 || state.over) {
        return 'end';
    }

    let best: { score: number; order: Order } | undefined;
    for (const type of ACTIONS) {
        for (const region of REGIONS) {
            const score = scoreOrder(state, type, region.id) + Math.random() * 3.5;
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
    const region = state.regions[regionId];
    const def = REGIONS.find((item) => item.id === regionId);
    if (!region || !def) {
        return -999;
    }
    const lean = region.lean;
    const control = controlOf(lean);
    const mine = control === side;
    const theirs = control === opponent(side);
    const toward = side === 'eu' ? 1 : -1;
    const closeness = 40 - Math.min(40, Math.abs(lean));
    let score = def.value;

    switch (type) {
        case 'shape':
            score += closeness * 0.45;
            if (!mine) {
                score += 8;
            }
            if (theirs && def.value >= 7) {
                score += 6;
            }
            if (side === 'eu' && state.energyEu < 36) {
                score -= 5;
            }
            break;
        case 'grid':
            if (side === 'ru') {
                score = 10 + state.energyEu * 0.18 + def.energyDemand * 8;
                if (['west', 'germany', 'italy'].includes(regionId)) {
                    score += 6;
                }
            } else {
                score = 12 + (70 - state.energyEu) * 0.25;
                if (['west', 'germany', 'italy', 'iberia'].includes(regionId)) {
                    score += 5;
                }
            }
            break;
        case 'net':
            score += theirs ? 10 : 4;
            score += def.value * 0.6;
            if (state.heat > 78) {
                score -= 12;
            }
            break;
        case 'hold':
            score = mine || control === 'contested' ? 7 + def.value * 0.5 : -4;
            if (region.shield > 0) {
                score -= 10;
            }
            if (mine && def.value >= 7) {
                score += 4;
            }
            break;
        case 'posture':
            score = closeness * 0.7 + def.value;
            if (state.heat > 68) {
                score -= 18;
            }
            if (state.heat > 84) {
                score -= 40;
            }
            if (Math.abs(lean) < 28) {
                score += 8;
            }
            break;
        case 'talk':
            score = state.heat > 70 ? 16 + (state.heat - 70) * 0.4 : 1;
            if (state.heat < 50) {
                score -= 8;
            }
            break;
    }

    if (toward * lean > 70 && type === 'shape') {
        score -= 8;
    }
    return score;
}
