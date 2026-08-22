import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ERAS, nextEra, resolveEra } from '../view/era.ts';
import { ALL_CHAMP_IDS, CHAMP_SHEETS, champSheet, parseSheet } from '../view/sprites.ts';
import { CHAMPIONS } from './champions.ts';
import { TREE_DEFS, TREE_IDS } from './types.ts';

describe('gui eras', () => {
    it('starts Atari-plain and ends at the Perfect Game', () => {
        assert.equal(resolveEra({ level: 0, tier: 1 }).id, 'cathode');
        assert.equal(resolveEra({ level: 3, tier: 1 }).id, 'vcs');
        assert.equal(resolveEra({ level: 15, tier: 1 }).id, 'nes');
        assert.equal(resolveEra({ level: 500, tier: 1 }).id, 'perfect');
        assert.equal(resolveEra({ level: 9000, tier: 1 }).title, 'PERFECT GAME');
        assert.equal(nextEra({ level: 0, tier: 1 })?.id, 'vcs');
        assert.equal(nextEra({ level: 9000, tier: 1 }), null);
    });

    it('has ten stacked eras with rising fidelity', () => {
        assert.equal(ERAS.length, 10);
        for (let i = 1; i < ERAS.length; i += 1) {
            assert.ok(ERAS[i].minLevel > ERAS[i - 1].minLevel);
            assert.ok(ERAS[i].pixel >= ERAS[i - 1].pixel);
        }
        assert.ok(ERAS[0].scanlines > 0);
        assert.ok(ERAS[ERAS.length - 1].perfect);
    });
});

describe('champion pixel art', () => {
    it('covers every roster champion with an 8-wide sheet', () => {
        for (const champion of CHAMPIONS) {
            assert.ok(CHAMP_SHEETS[champion.id], champion.id);
            const grid = parseSheet(champSheet(champion.id));
            assert.equal(grid[0].length, 8);
            assert.ok(grid.length >= 8);
        }
        assert.equal(ALL_CHAMP_IDS.length, CHAMPIONS.length);
    });
});

describe('screen tree', () => {
    it('is a first-class upgrade column', () => {
        assert.ok(TREE_IDS.includes('gui'));
        assert.equal(TREE_DEFS.gui.title, 'Screen');
        assert.ok(TREE_DEFS.gui.baseCost <= TREE_DEFS.strike.baseCost + 2);
    });
});
