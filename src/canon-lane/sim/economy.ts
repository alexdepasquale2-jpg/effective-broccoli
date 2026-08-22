import { LEVEL_COST_RATE, LEVELS_PER_TIER, TIER_POWER_RATE } from './constants.ts';
import { CHAMPIONS, championById } from './champions.ts';
import type { ChampionProgress, ColumnProgress, GameState, MetaProgress, PlayerPower, TreeId } from './types.ts';
import { TREE_DEFS, TREE_IDS } from './types.ts';

export function clampLevel(level: number): number {
    return Math.max(0, Math.min(LEVELS_PER_TIER, Math.floor(level)));
}

/**
 * Milestone ladder: every 25 / 100 / 1000 / 9000 levels.
 * Tuned so geometric costs stay within a reasonable time-to-buy band
 * once harvest, relic, and match gold come online.
 */
export function milestoneMultiplier(level: number): number {
    const capped = clampLevel(level);
    let mult = 1;
    mult *= Math.pow(1.85, Math.floor(capped / 25));
    mult *= Math.pow(2.2, Math.floor(capped / 100));
    mult *= Math.pow(6, Math.floor(capped / 1000));
    if (capped >= LEVELS_PER_TIER) {
        mult *= 12;
    }
    return mult;
}

export function tierMultiplier(tier: number): number {
    const t = Math.max(1, Math.floor(tier));
    return Math.pow(TIER_POWER_RATE, t - 1);
}

export function levelCost(baseCost: number, level: number, costMult = 1): number {
    const lv = clampLevel(level);
    if (lv >= LEVELS_PER_TIER) {
        return Number.POSITIVE_INFINITY;
    }
    return baseCost * Math.pow(LEVEL_COST_RATE, lv) * Math.max(0.4, costMult);
}

export function columnPower(basePower: number, column: ColumnProgress): number {
    if (column.level <= 0) {
        return 0;
    }
    return basePower * column.level * milestoneMultiplier(column.level) * tierMultiplier(column.tier);
}

/** Glory to raise a column from `tier` to `tier + 1`. Quadratic-exponential, not a wall. */
export function tierCost(tier: number): number {
    const t = Math.max(1, Math.floor(tier));
    return Math.ceil(4 * Math.pow(t, 1.55) * Math.pow(1.32, t - 1));
}

export function championLevelCost(level: number, costMult: number): number {
    return levelCost(20, level, costMult);
}

export function championTierCost(tier: number): number {
    return Math.ceil(tierCost(tier) * 1.25);
}

export function laneLevelCost(level: number, costMult: number): number {
    return levelCost(10, level, costMult);
}

export function efficiencyCost(level: number): number {
    return Math.ceil(40 * Math.pow(1.55, level));
}

export function hapticCost(level: number): number {
    return Math.ceil(15 * Math.pow(1.8, level));
}

export function insightCost(level: number): number {
    return Math.ceil(25 * Math.pow(1.6, level));
}

export function costMultiplier(meta: MetaProgress): number {
    return Math.pow(0.985, meta.efficiency);
}

export function hapticCritBonus(haptic: number): number {
    return haptic * 0.008;
}

export function maxAffordableLevels(
    gold: number,
    baseCost: number,
    level: number,
    costMult: number,
    want: number,
): { bought: number; spent: number } {
    const room = LEVELS_PER_TIER - level;
    const cap = want < 0 ? room : Math.min(room, want);
    let bought = 0;
    let spent = 0;
    while (bought < cap) {
        const cost = levelCost(baseCost, level + bought, costMult);
        if (!Number.isFinite(cost) || spent + cost > gold + 1e-9) {
            break;
        }
        spent += cost;
        bought += 1;
    }
    return { bought, spent };
}

export function derivePower(state: GameState): PlayerPower {
    const costMult = costMultiplier(state.meta);
    const relic = 1 + columnPower(TREE_DEFS.relic.basePower, state.trees.relic);
    const idle = 1 + columnPower(TREE_DEFS.idle.basePower, state.trees.idle);
    const vessel = 1 + columnPower(TREE_DEFS.gui.basePower, state.trees.gui ?? { level: 0, tier: 1 });
    const champ = championById(state.selectedChampion);
    const progress = state.champions[state.selectedChampion];
    const champLevel = progress?.level ?? 0;
    const champTier = progress?.tier ?? 1;
    const champScale = (1 + champLevel * 0.012) * tierMultiplier(champTier);

    const strike = columnPower(TREE_DEFS.strike.basePower, state.trees.strike);
    const fury = columnPower(TREE_DEFS.fury.basePower, state.trees.fury);
    const aegis = columnPower(TREE_DEFS.aegis.basePower, state.trees.aegis);
    const wave = columnPower(TREE_DEFS.wave.basePower, state.trees.wave);
    const siege = columnPower(TREE_DEFS.siege.basePower, state.trees.siege);
    const harvest = columnPower(TREE_DEFS.harvest.basePower, state.trees.harvest);
    const fate = columnPower(TREE_DEFS.fate.basePower, state.trees.fate);
    const wilds = columnPower(TREE_DEFS.wilds.basePower, state.trees.wilds);
    const omen = columnPower(TREE_DEFS.omen.basePower, state.trees.omen);
    const nexus = columnPower(TREE_DEFS.nexus.basePower, state.trees.nexus);

    const lane = state.lanes[state.selectedLane];
    const laneMult = 1 + columnPower(0.02, lane);

    const clickDamage = (1 + strike) * champ.click * champScale * relic * laneMult * (1 + (vessel - 1) * 0.15);
    const dps = (0.35 + fury) * champ.idle * champScale * relic * idle * laneMult;
    const champHp = (40 + aegis) * champScale * relic;
    const minionDamage = (1.2 + wave) * relic;
    const minionHp = (8 + wave * 4) * relic;
    const towerDamage = (2.2 + siege) * relic;
    const towerHp = (80 + siege * 18) * relic;
    const goldPerClick = (0.35 + harvest * 0.35) * champ.gold * relic * vessel;
    const goldPerSecond = (0.12 + harvest) * champ.gold * relic * idle * vessel;
    const lastHitBonus = (2 + harvest * 2.4) * champ.gold * relic * vessel;
    const critChance = Math.min(0.72, 0.06 + fate * 0.015 + hapticCritBonus(state.meta.haptic) + (champ.crit - 1) * 0.08);
    const critDamage = 2 + fate * 0.04 + (champ.crit - 1);
    const jungleGold = (0.8 + wilds) * relic;
    const omenBurst = omen * relic * champScale;
    const matchGold = (18 + nexus * 14) * relic;
    const matchGlory = 1 + Math.floor(nexus * 0.35) + Math.floor(state.match.index / 6);

    return {
        clickDamage,
        dps,
        champHp,
        minionDamage,
        minionHp,
        towerDamage,
        towerHp,
        goldPerClick,
        goldPerSecond,
        lastHitBonus,
        critChance,
        critDamage,
        jungleGold,
        omenBurst,
        idleMult: idle,
        globalMult: relic,
        matchGold,
        matchGlory,
        costMult,
    };
}

export function emptyColumn(): ColumnProgress {
    return { level: 0, tier: 1 };
}

export function starterChampions(): Record<string, ChampionProgress> {
    const out: Record<string, ChampionProgress> = {};
    for (const champion of CHAMPIONS) {
        out[champion.id] = {
            unlocked: champion.unlockGlory === 0,
            level: champion.unlockGlory === 0 ? 1 : 0,
            tier: 1,
        };
    }
    return out;
}

export function cheapestTree(state: GameState, power: PlayerPower): { id: TreeId; cost: number } | null {
    let best: { id: TreeId; cost: number } | null = null;
    for (const id of TREE_IDS) {
        const column = state.trees[id];
        if (column.level >= LEVELS_PER_TIER) {
            continue;
        }
        const cost = levelCost(TREE_DEFS[id].baseCost, column.level, power.costMult);
        if (!best || cost < best.cost) {
            best = { id, cost };
        }
    }
    return best;
}

export function etaSeconds(cost: number, gold: number, gps: number, clickGold: number, clicksPerSec: number): number {
    const income = gps + clickGold * clicksPerSec;
    if (gold >= cost) {
        return 0;
    }
    if (income <= 0) {
        return Number.POSITIVE_INFINITY;
    }
    return (cost - gold) / income;
}
