import {
    BOARD_SIZE,
    BOSS_GOLD_MULT,
    BOSS_HP_MULT,
    BOSS_SECONDS,
    ENEMY_BASE_HP,
    ENEMY_HP_RATE,
    KILL_BASE_GOLD,
    KILL_GOLD_RATE,
    KILLS_PER_STAGE,
    MERGE_POWER_RATE,
    OFFLINE_CAP_SECONDS,
    OFFLINE_RATE,
    SAVE_VERSION,
    STARTING_GOLD,
    SUMMON_BASE_COST,
    SUMMON_COST_RATE,
    TAP_DPS_SHARE,
} from './constants.ts';

export interface GameState {
    gold: number;
    maxGold: number;
    stage: number;
    /** Enemies killed in this stage; the 10th enemy (kills === 9) is the boss. */
    kills: number;
    enemyHp: number;
    bossTimer: number;
    summons: number;
    /** Card tier per slot; 0 = empty. */
    board: number[];
    savedAt: number;
}

export interface Kill {
    gold: number;
    boss: boolean;
}

export function createGame(now = Date.now()): GameState {
    const state: GameState = {
        gold: STARTING_GOLD,
        maxGold: STARTING_GOLD,
        stage: 1,
        kills: 0,
        enemyHp: 0,
        bossTimer: 0,
        summons: 0,
        board: new Array(BOARD_SIZE).fill(0),
        savedAt: now,
    };
    spawnEnemy(state);
    return state;
}

export const cardPower = (tier: number) => (tier > 0 ? MERGE_POWER_RATE ** (tier - 1) : 0);
export const boardDps = (s: GameState) => s.board.reduce((sum, t) => sum + cardPower(t), 0);
export const tapDamage = (s: GameState) => 1 + TAP_DPS_SHARE * boardDps(s);
export const summonCost = (s: GameState) => Math.ceil(SUMMON_BASE_COST * SUMMON_COST_RATE ** s.summons);
export const isBoss = (s: GameState) => s.kills === KILLS_PER_STAGE - 1;
export const enemyMaxHp = (s: GameState) =>
    ENEMY_BASE_HP * ENEMY_HP_RATE ** (s.stage - 1) * (isBoss(s) ? BOSS_HP_MULT : 1);
export const killGold = (s: GameState) =>
    Math.ceil(KILL_BASE_GOLD * KILL_GOLD_RATE ** (s.stage - 1)) * (isBoss(s) ? BOSS_GOLD_MULT : 1);

function spawnEnemy(s: GameState) {
    s.enemyHp = enemyMaxHp(s);
    s.bossTimer = isBoss(s) ? BOSS_SECONDS : 0;
}

function addGold(s: GameState, amount: number) {
    s.gold += amount;
    s.maxGold = Math.max(s.maxGold, s.gold);
}

/** Deals damage to the current enemy. Overkill does not carry over. */
export function damageEnemy(s: GameState, amount: number): Kill | null {
    s.enemyHp -= amount;
    if (s.enemyHp > 0) {
        return null;
    }
    const kill = { gold: killGold(s), boss: isBoss(s) };
    addGold(s, kill.gold);
    if (kill.boss) {
        s.stage += 1;
        s.kills = 0;
    } else {
        s.kills += 1;
    }
    spawnEnemy(s);
    return kill;
}

export function tap(s: GameState): Kill | null {
    return damageEnemy(s, tapDamage(s));
}

/** Places a tier-1 card in the first empty slot. Returns the slot, or -1. */
export function summon(s: GameState): number {
    const cost = summonCost(s);
    const slot = s.board.indexOf(0);
    if (slot < 0 || s.gold < cost) {
        return -1;
    }
    s.gold -= cost;
    s.summons += 1;
    s.board[slot] = 1;
    return slot;
}

export type MoveResult = 'merge' | 'move' | 'swap' | 'none';

/** Drag a card from one slot onto another: merges equal tiers, otherwise moves or swaps. */
export function moveCard(s: GameState, from: number, to: number): MoveResult {
    const a = s.board[from];
    const b = s.board[to];
    if (from === to || !a) {
        return 'none';
    }
    if (a === b) {
        s.board[to] = a + 1;
        s.board[from] = 0;
        return 'merge';
    }
    s.board[to] = a;
    s.board[from] = b;
    return b ? 'swap' : 'move';
}

/** Advances auto-battle by dt seconds. Returns kills that happened. */
export function tick(s: GameState, dt: number): Kill[] {
    const kills: Kill[] = [];
    if (isBoss(s)) {
        s.bossTimer -= dt;
        if (s.bossTimer <= 0) {
            // Boss escaped: replay the stage.
            s.kills = 0;
            spawnEnemy(s);
        }
    }
    const kill = damageEnemy(s, boardDps(s) * dt);
    if (kill) {
        kills.push(kill);
    }
    return kills;
}

/** Grants gold for time away, at a reduced rate and without advancing stages. */
export function applyOffline(s: GameState, now = Date.now()): { gold: number; seconds: number } {
    const seconds = Math.min(Math.max(0, (now - s.savedAt) / 1000), OFFLINE_CAP_SECONDS);
    const dps = boardDps(s);
    const hp = ENEMY_BASE_HP * ENEMY_HP_RATE ** (s.stage - 1);
    const perKill = Math.ceil(KILL_BASE_GOLD * KILL_GOLD_RATE ** (s.stage - 1));
    const gold = Math.floor((dps / hp) * perKill * seconds * OFFLINE_RATE);
    addGold(s, gold);
    s.savedAt = now;
    return { gold, seconds };
}

export function serialize(s: GameState, now = Date.now()): string {
    return JSON.stringify({ v: SAVE_VERSION, ...s, savedAt: now });
}

export function deserialize(raw: string | null): GameState | null {
    if (!raw) {
        return null;
    }
    try {
        const data = JSON.parse(raw);
        if (data.v !== SAVE_VERSION || !Array.isArray(data.board) || data.board.length !== BOARD_SIZE) {
            return null;
        }
        delete data.v;
        return data as GameState;
    } catch {
        return null;
    }
}
