import { SAVE_KEY } from './constants.ts';
import { applyOffline, createGame, deserialize, serialize } from './state.ts';
import type { GameState } from './types.ts';

export function loadGame(): { state: GameState; offline: { gold: number; glory: number; seconds: number } } {
    if (typeof localStorage === 'undefined') {
        return { state: createGame(), offline: { gold: 0, glory: 0, seconds: 0 } };
    }
    const state = deserialize(localStorage.getItem(SAVE_KEY)) ?? createGame();
    const offline = applyOffline(state);
    return { state, offline };
}

export function persistGame(state: GameState) {
    if (typeof localStorage === 'undefined') {
        return;
    }
    try {
        localStorage.setItem(SAVE_KEY, serialize(state));
    } catch {
        /* private mode or quota */
    }
}

export function resetGame(): GameState {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SAVE_KEY);
    }
    return createGame();
}
