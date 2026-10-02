import { SAVE_KEY } from './constants.ts';
import { applyOffline, createGame, deserialize, serialize } from './state.ts';
import type { GameState } from './state.ts';

export function loadGame(): { state: GameState; offline: { gold: number; seconds: number } } {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(SAVE_KEY);
    } catch {
        /* storage blocked */
    }
    const state = deserialize(raw) ?? createGame();
    return { state, offline: applyOffline(state) };
}

export function persistGame(state: GameState) {
    try {
        localStorage.setItem(SAVE_KEY, serialize(state));
        state.savedAt = Date.now();
    } catch {
        /* private mode or quota */
    }
}
