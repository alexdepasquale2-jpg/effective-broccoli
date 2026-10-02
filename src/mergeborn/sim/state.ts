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
    SHUFFLE_STAGE,
    ESSENCE_POW,
    ESSENCE_SCALE,
    ESSENCE_OFFSET,
    SHIELD_MULT,
    SPLIT_HP,
    STARTING_GOLD,
    SUMMON_BASE_COST,
    SUMMON_COST_RATE,
    TAP_DPS_SHARE,
    UPGRADE_COST_RATE,
    HERO_SUMMON_CHANCE,
} from './constants.ts';
import { ELEMENTS, HEROES, counterMult, elementId, heroById } from './heroes.ts';

export type UpgradeKey = 'tap' | 'summon' | 'merge' | 'battle';
export type UnlockKey = 'combo' | 'multi' | 'bounty' | 'traits' | 'board5';
export type ShopKey = 'might' | 'fortune' | 'headstart';
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
    /** Layer 1 (Shuffle): kept across Shuffles. */
    essence: number;
    shuffles: number;
    bestStage: number;
    shop: Record<ShopKey, number>;
    /** Per-slot card element id (0 = neutral) and hero id ('' = plain card). */
    elem: number[];
    hero: string[];
    /** Per-slot latent chi: element id stamped on cards summoned there. Re-rolled each run. */
    chi: number[];
    taps: number;
    /** Hero timers (seconds): run clock, time since last tap, auto-tap and Thunder Hawk accumulators. */
    clock: number;
    idle: number;
    autoTap: number;
    hawk: number;
    /** Bellringer: foes left to spawn weakened. */
    weakened: number;
    /** Layer 2 (Ascend): kept across Ascends. */
    ascends: number;
    heroes: string[];
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

/** Essence shop: permanent boosts bought with Essence. */
export const SHOP: Record<ShopKey, { label: string; effect: string; base: number; rate: number }> = {
    might: { label: 'Might', effect: 'All damage ×1.5', base: 1, rate: 2.5 },
    fortune: { label: 'Fortune', effect: 'All gold ×1.25', base: 1, rate: 2.5 },
    headstart: { label: 'Headstart', effect: 'Summons +1 tier', base: 10, rate: 6 },
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
        essence: 0,
        shuffles: 0,
        bestStage: 1,
        shop: { might: 0, fortune: 0, headstart: 0 },
        elem: new Array(BOARD_SIZE).fill(0),
        hero: new Array(BOARD_SIZE).fill(''),
        chi: new Array(BOARD_SIZE).fill(0),
        taps: 0,
        clock: 0,
        idle: 0,
        autoTap: 0,
        hawk: 0,
        weakened: 0,
        ascends: 0,
        heroes: [],
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

/** Elements unlocked so far: one per Ascend. */
export const unlockedElements = (s: GameState) => Math.min(s.ascends, ELEMENTS.length);
export const heroOnBoard = (s: GameState, id: string) => s.hero.some((x, i) => x === id && s.board[i] > 0);
const neighbours = (slot: number) => {
    const c = slot % BOARD_STRIDE;
    return [slot - BOARD_STRIDE, slot + BOARD_STRIDE, c > 0 ? slot - 1 : -1, c < BOARD_STRIDE - 1 ? slot + 1 : -1].filter(
        (n) => n >= 0 && n < BOARD_SIZE,
    );
};
const nextTo = (s: GameState, slot: number, id: string) => neighbours(slot).some((n) => s.hero[n] === id && s.board[n] > 0);

/** Enemy element: cycles through unlocked elements; neutral before the first Ascend. */
export const enemyElement = (s: GameState) => {
    const n = unlockedElements(s);
    return n ? ((s.stage * 3 + s.kills) % n) + 1 : 0;
};

export const cardPower = (tier: number) => (tier > 0 ? MERGE_POWER_RATE ** (tier - 1) : 0);
export const slotPower = (s: GameState, slot: number) =>
    cardPower(s.board[slot]) *
    (slot === POWER_TILE && has(s, 'board5') ? POWER_TILE_MULT : 1) *
    (nextTo(s, slot, 'fire-bellows') ? 1.25 : 1) *
    counterMult(s.elem[slot], enemyElement(s)) +
    prismShare(s, slot);
/** Prism Knight: each adjacent knight lends 30% of its card power. */
const prismShare = (s: GameState, slot: number) =>
    s.board[slot] ? neighbours(slot).reduce((sum, n) => sum + (s.hero[n] === 'prism-knight' && s.board[n] ? 0.3 * cardPower(s.board[n]) : 0), 0) : 0;
export const mightMult = (s: GameState) => 1.5 ** s.shop.might;
export const fortuneMult = (s: GameState) => 1.25 ** s.shop.fortune;
/** Whole-board multiplier from hunter heroes against the current enemy's element. */
const huntMult = (s: GameState) => {
    const e = enemyElement(s);
    let m = 1;
    if (e === elementId('earth') && heroOnBoard(s, 'wildfire-hound')) m *= 1.5;
    if (e === elementId('fire') && heroOnBoard(s, 'abyss-diver')) m *= 1.5;
    if (e === elementId('air') && heroOnBoard(s, 'stone-warden')) m *= 1.5;
    if (e === elementId('water') && heroOnBoard(s, 'cyclone-dervish')) m *= 1.5;
    if (e === elementId('void') && heroOnBoard(s, 'radiant-judge')) m *= 2;
    if (e === elementId('light') && heroOnBoard(s, 'abyssal-seer')) m *= 2;
    return m;
};
/** Whole-board multiplier from support heroes. */
const supportMult = (s: GameState) => {
    let m = 1;
    if (heroOnBoard(s, 'quarry-golem')) m *= 1 + 0.1 * s.elem.filter((e, i) => e === elementId('earth') && s.board[i] > 0).length;
    if (heroOnBoard(s, 'moss-hermit') && s.idle >= 10) m *= 2;
    if (heroOnBoard(s, 'lantern-saint')) m *= 1.1;
    return m;
};
export const boardDps = (s: GameState) =>
    s.board.reduce((sum, _t, i) => sum + slotPower(s, i), 0) * (1 + 0.1 * s.upgrades.battle) * mightMult(s) * huntMult(s) * supportMult(s);
export const comboMult = (s: GameState) => (has(s, 'combo') ? 1 + COMBO_STEP * Math.max(0, s.combo - 1) : 1);
export const tapDamage = (s: GameState) => (1 + s.upgrades.tap) * comboMult(s) * mightMult(s) + TAP_DPS_SHARE * boardDps(s);
export const summonCost = (s: GameState, count = 1) => {
    let total = 0;
    const discount = heroOnBoard(s, 'rain-smuggler') ? 0.85 : 1;
    for (let i = 0; i < count; i++) total += Math.ceil(SUMMON_BASE_COST * SUMMON_COST_RATE ** (s.summons + i) * discount);
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
    ENEMY_BASE_HP * ENEMY_HP_RATE ** (s.stage - 1) * (isBoss(s) ? BOSS_HP_MULT * (heroOnBoard(s, 'tremor-ram') ? 0.8 : 1) : 1);
export const killGold = (s: GameState) =>
    Math.ceil(KILL_BASE_GOLD * KILL_GOLD_RATE ** (s.stage - 1) * fortuneMult(s)) * (isBoss(s) ? BOSS_GOLD_MULT : 1);
const TRAIT_CYCLE: Trait[] = ['none', 'shield', 'regen', 'split'];
export const enemyTrait = (s: GameState): Trait => {
    const t = has(s, 'traits') ? TRAIT_CYCLE[(s.stage + s.kills) % TRAIT_CYCLE.length] : 'none';
    // Eclipse Widow: bosses can't regen or split.
    return isBoss(s) && heroOnBoard(s, 'eclipse-widow') && (t === 'regen' || t === 'split') ? 'none' : t;
};

function spawnEnemy(s: GameState) {
    s.enemyHp = enemyMaxHp(s);
    if (s.kills === 0 && heroOnBoard(s, 'dawn-herald')) {
        s.enemyHp = 1;
    }
    if (s.weakened > 0) {
        s.enemyHp *= 0.7;
        s.weakened -= 1;
    }
    s.split = false;
    s.bossTimer = isBoss(s) ? BOSS_SECONDS + (heroOnBoard(s, 'magma-turtle') ? 5 : 0) : 0;
}

function addGold(s: GameState, amount: number) {
    s.gold += amount;
    s.maxGold = Math.max(s.maxGold, s.gold);
}

/** Deals damage to the current enemy. Overkill does not carry over. */
export function damageEnemy(s: GameState, amount: number, rng: Rng = Math.random): Kill | null {
    s.enemyHp -= amount;
    if (s.enemyHp > 0) {
        return null;
    }
    if (enemyTrait(s) === 'split' && !s.split) {
        s.split = true;
        s.enemyHp = enemyMaxHp(s) * SPLIT_HP;
        return null;
    }
    let gold = killGold(s);
    if (heroOnBoard(s, 'gem-miner') && rng() < 0.05) gold *= 10;
    if (heroOnBoard(s, 'null-jester')) gold = rng() < 0.5 ? gold * 3 : 0;
    const kill: Kill = { gold, boss: isBoss(s) };
    addGold(s, kill.gold);
    if (kill.boss) {
        s.stage += 1;
        s.bestStage = Math.max(s.bestStage, s.stage);
        s.kills = 0;
        kill.unlock = UNLOCKS.find((u) => u.stage === s.stage);
        if (heroOnBoard(s, 'drowned-bellringer')) {
            s.weakened = 3;
        }
    } else {
        s.kills += 1;
    }
    spawnEnemy(s);
    return kill;
}

export function tap(s: GameState): Kill | null {
    s.combo = s.comboTimer > 0 ? Math.min(COMBO_CAP + (heroOnBoard(s, 'storm-bard') ? 5 : 0), s.combo + 1) : 1;
    s.comboTimer = COMBO_WINDOW;
    s.taps += 1;
    s.idle = 0;
    const duel = heroOnBoard(s, 'ifrit-duelist') && s.taps % 10 === 0 ? 10 : 1;
    const dmg = tapDamage(s) * duel;
    if (heroOnBoard(s, 'kite-thief')) addGold(s, dmg * 0.02);
    return damageEnemy(s, dmg);
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
        const pity = has(s, 'multi') && s.summons % (heroOnBoard(s, 'mirror-oracle') ? 7 : PITY_EVERY) === 0;
        const tier = 1 + s.shop.headstart + (pity || rng() < summonLuck(s) ? 1 : 0);
        placeCard(s, slot, tier, rng);
        slots.push(slot);
        if (heroOnBoard(s, 'flare-sprite')) {
            const roll = rng();
            if (roll < 0.1) {
                s.board[slot] = 0; // burned
            } else if (roll < 0.35) {
                const extra = freeSlot(s);
                if (extra >= 0) {
                    placeCard(s, extra, tier + 1, rng);
                    slots.push(extra);
                }
            }
        }
    }
    return slots;
}
/** Puts a card on a slot: it takes the tile's chi, and may roll as an unlocked hero of that element. */
function placeCard(s: GameState, slot: number, tier: number, rng: Rng) {
    s.board[slot] = tier;
    s.elem[slot] = s.chi[slot];
    s.hero[slot] = '';
    const pool = s.heroes.filter((id) => elementId(heroById(id)!.element) === s.chi[slot]);
    if (pool.length && rng() < HERO_SUMMON_CHANCE) {
        s.hero[slot] = pool[Math.floor(rng() * pool.length) % pool.length];
    }
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
    const ea = s.elem[from];
    const eb = s.elem[to];
    const rift = s.hero[from] === 'rift-walker' || s.hero[to] === 'rift-walker';
    if (a === b && (!ea || !eb || ea === eb || rift)) {
        const chance = (has(s, 'bounty') ? LUCKY_MERGE_CHANCE : 0) + (heroOnBoard(s, 'feather-monk') ? 0.03 : 0) +
            (s.hero[to] === 'hollow-king' ? 0.15 : 0);
        const lucky = rng() < chance;
        const smelt = s.hero[from] === 'smelter' && s.hero[to] === 'smelter';
        const eel = nextTo(s, to, 'mirror-eel') || nextTo(s, from, 'mirror-eel');
        s.board[to] = a + (lucky ? 2 : 1);
        s.elem[to] = eb || ea;
        s.hero[to] = s.hero[to] || s.hero[from];
        s.board[from] = 0;
        s.hero[from] = '';
        if (eel && rng() < 0.1) {
            s.board[from] = 1;
            s.elem[from] = s.elem[to];
        }
        if (has(s, 'bounty') || smelt) {
            addGold(s, mergeGold(s, s.board[to]) * (smelt ? 3 : 1));
        }
        return 'merge';
    }
    const swap = <T,>(arr: T[]) => ([arr[from], arr[to]] = [arr[to], arr[from]]);
    swap(s.board);
    swap(s.elem);
    swap(s.hero);
    return b ? 'swap' : 'move';
}

export const mergeGold = (s: GameState, tier: number) =>
    Math.ceil(KILL_BASE_GOLD * KILL_GOLD_RATE ** (s.stage - 1) * MERGE_BOUNTY * tier * (1 + 0.25 * s.upgrades.merge) * fortuneMult(s));

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
    const before = s.clock;
    s.clock += dt;
    s.idle += dt;
    if (heroOnBoard(s, 'root-weaver') && Math.floor(s.clock / 300) > Math.floor(before / 300)) {
        s.board.forEach((_t, i) => s.hero[i] === 'root-weaver' && s.board[i] &&
            neighbours(i).forEach((n) => s.board[n] && isOpen(s, n) && (s.board[n] += 1)));
    }
    if (heroOnBoard(s, 'gale-courier')) {
        s.autoTap += dt * 2;
        for (; s.autoTap >= 1; s.autoTap -= 1) {
            const k = tap(s);
            if (k) kills.push(k);
        }
    }
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
    const shield = trait === 'shield' && !heroOnBoard(s, 'undertow-siren') ? SHIELD_MULT : 1;
    let dmg = boardDps(s) * dt * shield;
    if (heroOnBoard(s, 'ink-wraith')) dmg += enemyMaxHp(s) * 0.01 * dt;
    if (heroOnBoard(s, 'thunder-hawk')) {
        s.hawk += dt;
        if (s.hawk >= 5) {
            s.hawk -= 5;
            dmg += boardDps(s) * 5 * shield;
        }
    }
    const kill = damageEnemy(s, dmg);
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
    const clerk = heroOnBoard(s, 'tide-clerk') ? 1.5 : 1;
    const gold = Math.floor((dps / hp) * perKill * fortuneMult(s) * clerk * seconds * OFFLINE_RATE);
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
        } else if (![2, 3, SAVE_VERSION].includes(v) || !Array.isArray(data.board) || data.board.length !== BOARD_SIZE) {
            return null;
        }
        const base = createGame(data.savedAt);
        return { ...base, ...data, upgrades: { ...base.upgrades, ...data.upgrades }, shop: { ...base.shop, ...data.shop } };
    } catch {
        return null;
    }
}

export const canShuffle = (s: GameState) => s.stage >= SHUFFLE_STAGE;
export const essenceGain = (s: GameState) =>
    canShuffle(s) ? Math.floor(((s.stage - ESSENCE_OFFSET) / ESSENCE_SCALE) ** ESSENCE_POW * (heroOnBoard(s, 'sun-forger') ? 1.2 : 1)) : 0;

/** Layer 1 reset: trade the run for Essence. Keeps Essence, shop, and records. */
export function shuffle(s: GameState): number {
    const gain = essenceGain(s);
    if (!gain) {
        return 0;
    }
    const fresh = createGame(s.savedAt);
    Object.assign(s, {
        ...fresh,
        essence: s.essence + gain,
        shuffles: s.shuffles + 1,
        bestStage: s.bestStage,
        shop: s.shop,
        ascends: s.ascends,
        heroes: s.heroes,
    });
    rollChi(s);
    return gain;
}

/** Lays latent chi across the board from unlocked elements; about a third of tiles stay neutral. */
export function rollChi(s: GameState, rng: Rng = Math.random) {
    const n = unlockedElements(s);
    s.chi = s.chi.map(() => (n && rng() > 0.33 ? 1 + Math.floor(rng() * n) % n : 0));
}

export const canAscend = (s: GameState) => s.shuffles >= 1;

/** Heroes you could still unlock: from elements you have, not yet owned. */
export const heroPool = (s: GameState) =>
    HEROES.filter((x) => ELEMENTS.indexOf(x.element) < unlockedElements(s) && !s.heroes.includes(x.id));

/**
 * Layer 2 reset: wipes the run, Essence and the shop. Unlocks the next element and
 * spends the Ascend token on one random hero. Returns the new hero id ('' if none left).
 */
export function ascend(s: GameState, rng: Rng = Math.random): string | null {
    if (!canAscend(s)) {
        return null;
    }
    const fresh = createGame(s.savedAt);
    Object.assign(s, { ...fresh, bestStage: s.bestStage, ascends: s.ascends + 1, heroes: s.heroes });
    const pool = heroPool(s);
    const pick = pool.length ? pool[Math.floor(rng() * pool.length) % pool.length].id : '';
    if (pick) {
        s.heroes = [...s.heroes, pick];
    }
    rollChi(s, rng);
    return pick;
}

export const shopCost = (s: GameState, key: ShopKey) => SHOP[key].base * SHOP[key].rate ** s.shop[key];

export function buyShop(s: GameState, key: ShopKey): boolean {
    const cost = shopCost(s, key);
    if (s.essence < cost) {
        return false;
    }
    s.essence -= cost;
    s.shop[key] += 1;
    return true;
}

export interface Goal {
    label: string;
    progress: number;
}

/** The next three goals for the goal ladder: upcoming unlocks, then Shuffle. */
export function goals(s: GameState): Goal[] {
    const list: Goal[] = UNLOCKS.filter((u) => s.stage < u.stage).map((u) => ({
        label: `Stage ${u.stage}: ${u.label.split(':')[0]}`,
        progress: s.stage / u.stage,
    }));
    list.push(
        canShuffle(s)
            ? { label: `Shuffle now: +${essenceGain(s)} Essence`, progress: 1 }
            : { label: `Stage ${SHUFFLE_STAGE}: Shuffle`, progress: s.stage / SHUFFLE_STAGE },
    );
    return list.slice(0, 3);
}
