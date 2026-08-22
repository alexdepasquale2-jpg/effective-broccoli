import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BLESSING_COUNT, blessingName } from './blessings.ts';
import { LEVELS_PER_TIER } from './constants.ts';
import {
    columnPower,
    derivePower,
    levelCost,
    maxAffordableLevels,
    milestoneMultiplier,
    tierCost,
    tierMultiplier,
} from './economy.ts';
import { createGame, buyTreeLevels, tickGame } from './state.ts';
import { TREE_DEFS } from './types.ts';

describe('9000-blessing catalog', () => {
    it('has exactly 9000 unique names', () => {
        assert.equal(BLESSING_COUNT, 9000);
        assert.equal(LEVELS_PER_TIER, 9000);
        const names = new Set<string>();
        for (let i = 0; i < LEVELS_PER_TIER; i += 1) {
            names.add(blessingName(i));
        }
        assert.equal(names.size, 9000);
    });
});

describe('upgrade economy', () => {
    it('costs rise for every level in a tier', () => {
        let prev = 0;
        for (let level = 0; level < 400; level += 1) {
            const cost = levelCost(5, level, 1);
            assert.ok(cost > prev, `level ${level}`);
            prev = cost;
        }
        assert.ok(levelCost(5, 8999, 1) > levelCost(5, 1000, 1));
        assert.equal(levelCost(5, 9000, 1), Number.POSITIVE_INFINITY);
    });

    it('tiers multiply power and cost Glory, not gold', () => {
        const t1 = columnPower(1, { level: 10, tier: 1 });
        const t2 = columnPower(1, { level: 10, tier: 2 });
        assert.ok(t2 > t1 * 2);
        assert.equal(tierMultiplier(1), 1);
        assert.ok(tierCost(2) > tierCost(1));
    });

    it('milestones fire on the 25 / 100 / 1000 / 9000 ladder', () => {
        assert.equal(milestoneMultiplier(0), 1);
        assert.ok(milestoneMultiplier(25) > milestoneMultiplier(24));
        assert.ok(milestoneMultiplier(100) > milestoneMultiplier(99));
        assert.ok(milestoneMultiplier(1000) > milestoneMultiplier(999));
        assert.ok(milestoneMultiplier(9000) > milestoneMultiplier(8999));
    });

    it('bulk-buy spends only what the player can afford', () => {
        const { bought, spent } = maxAffordableLevels(40, 5, 0, 1, 10);
        assert.ok(bought >= 1);
        assert.ok(bought <= 10);
        assert.ok(spent <= 40 + 1e-9);
        const cap = maxAffordableLevels(Number.MAX_VALUE, 5, 8990, 1, -1);
        assert.equal(cap.bought, 10);
    });
});

describe('reasonable grind', () => {
    it('reaches Strike 25 in a few minutes of active tapping', () => {
        const state = createGame(0);
        let seconds = 0;
        while (state.trees.strike.level < 25 && seconds < 900) {
            const power = derivePower(state);
            state.gold += power.goldPerSecond + power.goldPerClick * 3.2;
            state.bulk = 1;
            buyTreeLevels(state, 'strike');
            if (state.trees.harvest.level < 12) {
                buyTreeLevels(state, 'harvest');
            }
            tickGame(state, 1);
            seconds += 1;
        }
        assert.ok(state.trees.strike.level >= 25, `only reached ${state.trees.strike.level} in ${seconds}s`);
        assert.ok(seconds >= 8, 'first 25 levels should not be instant');
        assert.ok(seconds <= 600, `took ${seconds}s — too long for the opening grind`);
    });

    it('every tree, lane, champion, and shop column is upgradeable', () => {
        const state = createGame();
        state.gold = 1e12;
        state.glory = 1e6;
        for (const id of Object.keys(TREE_DEFS) as (keyof typeof TREE_DEFS)[]) {
            const before = state.trees[id].level;
            const { bought } = buyTreeLevels(state, id);
            assert.ok(bought > 0, id);
            assert.ok(state.trees[id].level > before);
        }
        const power = derivePower(state);
        assert.ok(power.clickDamage > 1);
        assert.ok(power.dps > 0);
        assert.ok(power.costMult <= 1);
    });
});
