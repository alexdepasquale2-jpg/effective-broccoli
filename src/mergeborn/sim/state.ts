import {
    BOARD_SIZE,
    BOARD_STRIDE,
    BOSS_GOLD_MULT,
    BOSS_HP_MULT,
    BOSS_SECONDS,
    COMBO_CAP,
    COMBO_STEP,
    COMBO_WINDOW,
    ENEMY_BASE_HP,
    ENEMY_HP_RATE,
    KILL_BASE_GOLD,
    KILL_GOLD_RATE,
    KILLS_PER_STAGE,
    LUCK_CAP,
    LUCK_PER_LEVEL,
    LUCKY_MERGE_CHANCE,
    MERGE_BOUNTY,
    MERGE_POWER_RATE,
    MULTI_SUMMON,
    OFFLINE_CAP_SECONDS,
    OFFLINE_RATE,
    PITY_EVERY,
    POWER_TILE,
    POWER_TILE_MULT,
    REGEN_PER_SEC,
    SAVE_VERSION,
    SHIELD_MULT,
    SPLIT_HP,
    STARTING_GOLD,
    SUMMON_BASE_COST,
    SUMMON_COST_RATE,
    TAP_DPS_SHARE,
    UPGRADE_COST_RATE,
} from './constants.ts';

export type UpgradeKey = 'tap' | 'summon' | 'merge' | 'battle';
export type UnlockKey = 'combo' | 'multi' | 'bounty' | 'traits' | 'board5';
export type Trait = 'none' | 'shield' | 'regen' | 'split';

export interface GameState {
    gold: number;
    maxGold: number;
    stage: number;
    /** Enemies killed in this stage; the 10th enemy (kills === 9) is the boss. */
    kills: number;
    enemyHp: number;
    /** A split enemy has already split once. */
    split: boolean;
    bossTimer: number;
    summons: number;
    combo: number;
    comboTimer: number;
    upgrades: Record<UpgradeKey, number>;
    /** Card tier per slot (5×5, stride 5); 0 = empty. */
    board: number[];
    savedAt: number;
}

export interface Kill {
    gold: number;
    boss: boolean;
    /** Set when this boss kill reached a stage that unlocks something. */
    unlock?: Unlock;
}

export interface Unlock {
    key: UnlockKey;
    stage: number;
    label: string;
}

/** Boss rewards: reaching these stages evolves a system to its stage 2. */
export const UNLOCKS: Unlock[] = [
    { key: 'combo', stage: 3, label: 'Tap combo: chain taps for up to ×1.9 damage' },
    { key: 'multi', stage: 6, label: 'Summon ×5 and pity: every 10th summon is T2' },
    { key: 'bounty', stage: 10, label: 'Merge bounty: merges pay gold, 5% jump +2 tiers' },
    { key: 'traits', stage: 14, label: 'Enemy traits: shield, regen, split' },
    { key: 'board5', stage: 18, label: 'Board grows to 5×5 with a ×2 power tile' },
];

export const UPGRADES: Record<UpgradeKey, { label: string; base: number; needs?: UnlockKey }> = {
    tap: { label: 'Tap power', base: 15 },
    summon: { label: 'Summon luck', base: 40 },
    battle: { label: 'Board power', base: 50 },
    merge: { label: 'Merge bounty', base: 60, needs: 'bounty' },
};

export type Rng = () => number;

export function createGame(now = Date.now()): GameState {
    const state: GameState = {
        gold: STARTING_GOLD,
        maxGold: STARTING_GOLD,
        stage: 1,
        kills: 0,
        enemyHp: 0,
        split: false,
        bossTimer: 0,
        summons: 0,
        combo: 0,
        comboTimer: 0,
        upgrades: { tap: 0, summon: 0, merge: 0, battle: 0 },
        board: new Array(BOARD_SIZE).fill(0),
        savedAt: now,
    };
    spawnEnemy(state);
    return state;
}

export const has = (s: GameState, key: UnlockKey) => s.stage >= UNLOCKS.find((u) => u.key === key)!.stage;
export const nextUnlock = (s: GameState) => UNLOCKS.find((u) => s.stage < u.stage) ?? null;
export const boardCols = (s: GameState) => (has(s, 'board5') ? 5 : 4);
export const isOpen = (s: GameState, slot: number) =>
    slot % BOARD_STRIDE < boardCols(s) && Math.floor(slot / BOARD_STRIDE) < boardCols(s);
export const freeSlot = (s: GameState) => s.board.findIndex((t, i) => t === 0 && isOpen(s, i));

export const cardPower = (tier: number) => (tier > 0 ? MERGE_POWER_RATE ** (tier - 1) : 0);
export const slotPower = (s: GameState, slot: number) =>
    cardPower(s.board[slot]) * (slot === POWER_TILE && has(s, 'board5') ? POWER_TILE_MULT : 1);
export const boardDps = (s: GameState) =>
    s.board.reduce((sum, _t, i) => sum + slotPower(s, i), 0) * (1 + 0.1 * s.upgrades.battle);
export const comboMult = (s: GameState) => (has(s, 'combo') ? 1 + COMBO_STEP * Math.max(0, s.combo - 1) : 1);
export const tapDamage = (s: GameState) => (1 + s.upgrades.tap) * comboMult(s) + TAP_DPS_SHARE * boardDps(s);
export const summonCost = (s: GameState, count = 1) => {
    let total = 0;
    for (let i = 0; i < count; i++) total += Math.ceil(SUMMON_BASE_COST * SUMMON_COST_RATE ** (s.summons + i));
    return total;
};
export const summonLuck = (s: GameState) => Math.min(LUCK_CAP, LUCK_PER_LEVEL * s.upgrades.summon);
export const upgradeCost = (s: GameState, key: UpgradeKey) =>
    Math.ceil(UPGRADES[key].base * UPGRADE_COST_RATE ** s.upgrades[key]);
export const canUpgrade = (s: GameState, key: UpgradeKey) => {
    const needs = UPGRADES[key].needs;
    return !needs || has(s, needs);
};

export const isBoss = (s: GameState) => s.kills === KILLS_PER_STAGE - 1;
export const enemyMaxHp = (s: GameState) =>
    ENEMY_BASE_HP * ENEMY_HP_RATE ** (s.stage - 1) * (isBoss(s) ? BOSS_HP_MULT : 1);
export const killGold = (s: GameState) =>
    Math.ceil(KILL_BASE_GOLD * KILL_GOLD_RATE ** (s.stage - 1)) * (isBoss(s) ? BOSS_GOLD_MULT : 1);
const TRAIT_CYCLE: Trait[] = ['none', 'shield', 'regen', 'split'];
export const enemyTrait = (s: GameState): Trait =>
    has(s, 'traits') ? TRAIT_CYCLE[(s.stage + s.kills) % TRAIT_CYCLE.length] : 'none';

function spawnEnemy(s: GameState) {
    s.enemyHp = enemyMaxHp(s);
    s.split = false;
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
    if (enemyTrait(s) === 'split' && !s.split) {
        s.split = true;
        s.enemyHp = enemyMaxHp(s) * SPLIT_HP;
        return null;
    }
    const kill: Kill = { gold: killGold(s), boss: isBoss(s) };
    addGold(s, kill.gold);
    if (kill.boss) {
        s.stage += 1;
        s.kills = 0;
        kill.unlock = UNLOCKS.find((u) => u.stage === s.stage);
    } else {
        s.kills += 1;
    }
    spawnEnemy(s);
    return kill;
}

export function tap(s: GameState): Kill | null {
    s.combo = s.comboTimer > 0 ? Math.min(COMBO_CAP, s.combo + 1) : 1;
    s.comboTimer = COMBO_WINDOW;
    return damageEnemy(s, tapDamage(s));
}

/** Summons up to `count` cards into free slots. Returns the filled slots. */
export function summon(s: GameState, count = 1, rng: Rng = Math.random): number[] {
    const slots: number[] = [];
    for (let i = 0; i < count; i++) {
        const cost = summonCost(s);
        const slot = freeSlot(s);
        if (slot < 0 || s.gold < cost) {
            break;
        }
        s.gold -= cost;
        s.summons += 1;
        const pity = has(s, 'multi') && s.summons % PITY_EVERY === 0;
        s.board[slot] = pity || rng() < summonLuck(s) ? 2 : 1;
        slots.push(slot);
    }
    return slots;
}
export const multiSummonCount = (s: GameState) => (has(s, 'multi') ? MULTI_SUMMON : 1);

export type MoveResult = 'merge' | 'move' | 'swap' | 'none';

/** Drag a card from one slot onto another: merges equal tiers, otherwise moves or swaps. */
export function moveCard(s: GameState, from: number, to: number, rng: Rng = Math.random): MoveResult {
    const a = s.board[from];
    const b = s.board[to];
    if (from === to || !a || !isOpen(s, to)) {
        return 'none';
    }
    if (a === b) {
        const lucky = has(s, 'bounty') && rng() < LUCKY_MERGE_CHANCE;
        s.board[to] = a + (lucky ? 2 : 1);
        s.board[from] = 0;
        if (has(s, 'bounty')) {
            addGold(s, mergeGold(s, s.board[to]));
        }
        return 'merge';
    }
    s.board[to] = a;
    s.board[from] = b;
    return b ? 'swap' : 'move';
}

export const mergeGold = (s: GameState, tier: number) =>
    Math.ceil(KILL_BASE_GOLD * KILL_GOLD_RATE ** (s.stage - 1) * MERGE_BOUNTY * tier * (1 + 0.25 * s.upgrades.merge));

export function buyUpgrade(s: GameState, key: UpgradeKey): boolean {
    const cost = upgradeCost(s, key);
    if (!canUpgrade(s, key) || s.gold < cost) {
        return false;
    }
    s.gold -= cost;
    s.upgrades[key] += 1;
    return true;
}

/** Advances auto-battle by dt seconds. Returns kills that happened. */
export function tick(s: GameState, dt: number): Kill[] {
    const kills: Kill[] = [];
    s.comboTimer = Math.max(0, s.comboTimer - dt);
    if (s.comboTimer === 0) {
        s.combo = 0;
    }
    if (isBoss(s)) {
        s.bossTimer -= dt;
        if (s.bossTimer <= 0) {
            // Boss escaped: replay the stage.
            s.kills = 0;
            spawnEnemy(s);
        }
    }
    const trait = enemyTrait(s);
    if (trait === 'regen') {
        s.enemyHp = Math.min(enemyMaxHp(s), s.enemyHp + enemyMaxHp(s) * REGEN_PER_SEC * dt);
    }
    const kill = damageEnemy(s, boardDps(s) * dt * (trait === 'shield' ? SHIELD_MULT : 1));
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
        const { v, ...data } = JSON.parse(raw);
        if (v === 1 && Array.isArray(data.board) && data.board.length === 16) {
            // v1 stored a 4×4 board with stride 4.
            const board = new Array(BOARD_SIZE).fill(0);
            data.board.forEach((t: number, i: number) => (board[Math.floor(i / 4) * BOARD_STRIDE + (i % 4)] = t));
            data.board = board;
        } else if (v !== SAVE_VERSION || !Array.isArray(data.board) || data.board.length !== BOARD_SIZE) {
            return null;
        }
        const base = createGame(data.savedAt);
        return { ...base, ...data, upgrades: { ...base.upgrades, ...data.upgrades } };
    } catch {
        return null;
    }
}
