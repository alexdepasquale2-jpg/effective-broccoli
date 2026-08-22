import { CHAMPIONS, championById } from './champions.ts';
import { OFFLINE_CAP_SECONDS, STARTING_GOLD, TICK_HZ } from './constants.ts';
import { clickCamp, clickTarget, createMatch, estimatedMatchSeconds, tickMatch } from './combat.ts';
import {
    championLevelCost,
    championTierCost,
    cheapestTree,
    costMultiplier,
    derivePower,
    efficiencyCost,
    emptyColumn,
    hapticCost,
    insightCost,
    laneLevelCost,
    levelCost,
    maxAffordableLevels,
    starterChampions,
    tierCost,
} from './economy.ts';
import type { BulkMode, GameState, LaneId, MatchEvent, TreeId } from './types.ts';
import { TREE_DEFS, TREE_IDS } from './types.ts';

export interface TickResult {
    events: MatchEvent[];
    goldGained: number;
    gloryGained: number;
    matchEnded: 'victory' | 'defeat' | null;
}

export function createGame(now = Date.now()): GameState {
    const trees = Object.fromEntries(TREE_IDS.map((id) => [id, emptyColumn()])) as GameState['trees'];
    const state: GameState = {
        gold: STARTING_GOLD,
        glory: 0,
        totalGold: STARTING_GOLD,
        clicks: 0,
        lastHits: 0,
        crits: 0,
        matchesWon: 0,
        matchesLost: 0,
        trees,
        lanes: { 0: emptyColumn(), 1: emptyColumn(), 2: emptyColumn() },
        champions: starterChampions(),
        selectedChampion: 'david',
        selectedLane: 1,
        meta: { efficiency: 0, autoBuy: false, haptic: 1, insight: 0 },
        bulk: 1,
        tab: 'trees',
        match: createMatch(0, {
            clickDamage: 1,
            dps: 0.4,
            champHp: 40,
            minionDamage: 1.2,
            minionHp: 8,
            towerDamage: 2.2,
            towerHp: 80,
            goldPerClick: 0.4,
            goldPerSecond: 0.12,
            lastHitBonus: 2,
            critChance: 0.06,
            critDamage: 2,
            jungleGold: 0.8,
            omenBurst: 0,
            idleMult: 1,
            globalMult: 1,
            matchGold: 18,
            matchGlory: 1,
            costMult: 1,
        }),
        lastTick: now,
        createdAt: now,
    };
    state.match = createMatch(0, derivePower(state));
    return state;
}

function grantGold(state: GameState, amount: number) {
    if (amount <= 0) {
        return;
    }
    state.gold += amount;
    state.totalGold += amount;
}

function resolveBulk(bulk: BulkMode): number {
    return bulk === 'max' ? -1 : bulk;
}

export function buyTreeLevels(state: GameState, id: TreeId): { bought: number; spent: number } {
    const power = derivePower(state);
    const column = state.trees[id];
    const want = resolveBulk(state.bulk);
    const { bought, spent } = maxAffordableLevels(state.gold, TREE_DEFS[id].baseCost, column.level, power.costMult, want);
    column.level += bought;
    state.gold -= spent;
    return { bought, spent };
}

export function buyTreeTier(state: GameState, id: TreeId): boolean {
    const cost = tierCost(state.trees[id].tier);
    if (state.glory < cost) {
        return false;
    }
    state.glory -= cost;
    state.trees[id].tier += 1;
    return true;
}

export function buyLaneLevels(state: GameState, lane: LaneId): { bought: number; spent: number } {
    const power = derivePower(state);
    const column = state.lanes[lane];
    const want = resolveBulk(state.bulk);
    const { bought, spent } = maxAffordableLevels(state.gold, 10, column.level, power.costMult, want);
    column.level += bought;
    state.gold -= spent;
    return { bought, spent };
}

export function buyLaneTier(state: GameState, lane: LaneId): boolean {
    const cost = tierCost(state.lanes[lane].tier);
    if (state.glory < cost) {
        return false;
    }
    state.glory -= cost;
    state.lanes[lane].tier += 1;
    return true;
}

export function unlockChampion(state: GameState, id: string): boolean {
    const def = championById(id);
    const progress = state.champions[id];
    if (!progress || progress.unlocked) {
        return false;
    }
    if (state.glory < def.unlockGlory) {
        return false;
    }
    state.glory -= def.unlockGlory;
    progress.unlocked = true;
    progress.level = Math.max(1, progress.level);
    return true;
}

export function selectChampion(state: GameState, id: string): boolean {
    const progress = state.champions[id];
    if (!progress?.unlocked) {
        return false;
    }
    state.selectedChampion = id;
    return true;
}

export function buyChampionLevels(state: GameState, id: string): { bought: number; spent: number } {
    const progress = state.champions[id];
    if (!progress?.unlocked) {
        return { bought: 0, spent: 0 };
    }
    const power = derivePower(state);
    const want = resolveBulk(state.bulk);
    const { bought, spent } = maxAffordableLevels(state.gold, 20, progress.level, power.costMult, want);
    progress.level += bought;
    state.gold -= spent;
    return { bought, spent };
}

export function buyChampionTier(state: GameState, id: string): boolean {
    const progress = state.champions[id];
    if (!progress?.unlocked) {
        return false;
    }
    const cost = championTierCost(progress.tier);
    if (state.glory < cost) {
        return false;
    }
    state.glory -= cost;
    progress.tier += 1;
    return true;
}

export function buyEfficiency(state: GameState): boolean {
    if (state.meta.efficiency >= 40) {
        return false;
    }
    const cost = efficiencyCost(state.meta.efficiency);
    if (state.gold < cost) {
        return false;
    }
    state.gold -= cost;
    state.meta.efficiency += 1;
    return true;
}

export function buyHaptic(state: GameState): boolean {
    if (state.meta.haptic >= 8) {
        return false;
    }
    const cost = hapticCost(state.meta.haptic);
    if (state.gold < cost) {
        return false;
    }
    state.gold -= cost;
    state.meta.haptic += 1;
    return true;
}

export function buyInsight(state: GameState): boolean {
    if (state.meta.insight >= 5) {
        return false;
    }
    const cost = insightCost(state.meta.insight);
    if (state.glory < cost) {
        return false;
    }
    state.glory -= cost;
    state.meta.insight += 1;
    return true;
}

export function toggleAutoBuy(state: GameState) {
    state.meta.autoBuy = !state.meta.autoBuy;
}

export function setBulk(state: GameState, bulk: BulkMode) {
    state.bulk = bulk;
}

export function setLane(state: GameState, lane: LaneId) {
    state.selectedLane = lane;
}

export function rollCrit(state: GameState, power = derivePower(state)): boolean {
    return Math.random() < power.critChance;
}

export function performClick(state: GameState, camp = false): MatchEvent[] {
    const power = derivePower(state);
    const crit = rollCrit(state, power);
    state.clicks += 1;
    grantGold(state, power.goldPerClick * (crit ? 1.25 : 1));
    if (crit) {
        state.crits += 1;
    }
    const events = camp
        ? clickCamp(state.match, state.selectedLane, power)
        : clickTarget(state.match, state.selectedLane, power, crit);
    for (const event of events) {
        if (event.kind === 'lastHit') {
            state.lastHits += 1;
        }
    }
    collectMatchGold(state);
    return events;
}

function collectMatchGold(state: GameState) {
    if (state.match.goldBanked > 0) {
        grantGold(state, state.match.goldBanked);
        state.match.goldBanked = 0;
    }
}

function settleMatch(state: GameState, power: ReturnType<typeof derivePower>): TickResult['matchEnded'] {
    const ended = state.match.over;
    if (!ended) {
        return null;
    }
    if (ended === 'victory') {
        state.matchesWon += 1;
        grantGold(state, power.matchGold);
        state.glory += power.matchGlory;
        state.match = createMatch(state.match.index + 1, derivePower(state));
    } else {
        state.matchesLost += 1;
        grantGold(state, power.matchGold * 0.28);
        state.match = createMatch(state.match.index, derivePower(state));
    }
    return ended;
}

function autoBuyTick(state: GameState) {
    if (!state.meta.autoBuy) {
        return;
    }
    const power = derivePower(state);
    for (let i = 0; i < 4; i += 1) {
        const next = cheapestTree(state, power);
        if (!next || state.gold < next.cost) {
            break;
        }
        const column = state.trees[next.id];
        const cost = levelCost(TREE_DEFS[next.id].baseCost, column.level, power.costMult);
        if (state.gold < cost) {
            break;
        }
        state.gold -= cost;
        column.level += 1;
    }
}

export function tickGame(state: GameState, dt: number): TickResult {
    const power = derivePower(state);
    grantGold(state, power.goldPerSecond * dt);
    const events = tickMatch(state.match, dt, power, state.selectedLane);
    collectMatchGold(state);
    const matchEnded = settleMatch(state, power);
    autoBuyTick(state);
    state.lastTick = Date.now();
    let gloryGained = 0;
    let goldGained = power.goldPerSecond * dt;
    if (matchEnded === 'victory') {
        gloryGained = power.matchGlory;
        goldGained += power.matchGold;
    }
    return { events, goldGained, gloryGained, matchEnded };
}

export function applyOffline(state: GameState, now = Date.now()): { gold: number; glory: number; seconds: number } {
    const raw = Math.max(0, (now - state.lastTick) / 1000);
    const seconds = Math.min(OFFLINE_CAP_SECONDS, raw);
    if (seconds < 2) {
        state.lastTick = now;
        return { gold: 0, glory: 0, seconds };
    }
    const power = derivePower(state);
    const gold = power.goldPerSecond * seconds * (0.85 + Math.min(0.4, power.idleMult * 0.08));
    const matches = Math.floor(seconds / estimatedMatchSeconds(power, state.match.index));
    const glory = Math.floor(matches * power.matchGlory * 0.65);
    grantGold(state, gold);
    state.glory += glory;
    state.matchesWon += Math.floor(matches * 0.65);
    if (matches > 0) {
        state.match = createMatch(state.match.index + Math.floor(matches * 0.5), derivePower(state));
    }
    state.lastTick = now;
    return { gold, glory, seconds };
}

export function tickHz(): number {
    return TICK_HZ;
}

export function treeNextCost(state: GameState, id: TreeId): number {
    return levelCost(TREE_DEFS[id].baseCost, state.trees[id].level, costMultiplier(state.meta));
}

export function laneNextCost(state: GameState, lane: LaneId): number {
    return laneLevelCost(state.lanes[lane].level, costMultiplier(state.meta));
}

export function championNextCost(state: GameState, id: string): number {
    return championLevelCost(state.champions[id]?.level ?? 0, costMultiplier(state.meta));
}

export { championTierCost, efficiencyCost, hapticCost, insightCost, tierCost };

export function rosterCount(): number {
    return CHAMPIONS.length;
}

export function serialize(state: GameState): string {
    return JSON.stringify(state);
}

export function deserialize(raw: string | null): GameState | null {
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as GameState;
        if (!parsed?.trees || !parsed.champions || !parsed.match) {
            return null;
        }
        for (const id of TREE_IDS) {
            parsed.trees[id] ??= emptyColumn();
        }
        for (const champion of CHAMPIONS) {
            parsed.champions[champion.id] ??= {
                unlocked: champion.unlockGlory === 0,
                level: 0,
                tier: 1,
            };
        }
        return parsed;
    } catch {
        return null;
    }
}
