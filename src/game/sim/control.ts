import type { Control, Faction } from './types';

export const CONTROL_THRESHOLD = 22;

export function controlOf(lean: number): Control {
    if (lean >= CONTROL_THRESHOLD) {
        return 'eu';
    }
    if (lean <= -CONTROL_THRESHOLD) {
        return 'ru';
    }
    return 'contested';
}

export function opponent(faction: Faction): Faction {
    return faction === 'eu' ? 'ru' : 'eu';
}

export function factionName(faction: Faction): string {
    return faction === 'eu' ? 'Europe' : 'Russia';
}

export function tag(faction: Faction): string {
    return faction === 'eu' ? 'EU' : 'RU';
}
