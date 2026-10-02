import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOSS_SECONDS, KILLS_PER_STAGE, OFFLINE_CAP_SECONDS, POWER_TILE } from './constants.ts';
import {
    UNLOCKS,
    applyOffline,
    boardCols,
    buyUpgrade,
    enemyMaxHp,
    enemyTrait,
    freeSlot,
    tapDamage,
    boardDps,
    cardPower,
    createGame,
    deserialize,
    isBoss,
    moveCard,
    serialize,
    summon,
    summonCost,
    tap,
    tick,
} from './state.ts';

describe('summon', () => {
    it('spends gold, places a tier-1 card, raises cost', () => {
        const s = createGame(0);
        const cost = summonCost(s);
        assert.deepEqual(summon(s), [0]);
        assert.equal(s.board[0], 1);
        assert.equal(s.gold, 10 - cost);
        assert.ok(summonCost(s) > cost);
    });
    it('fails without gold or a free slot', () => {
        const s = createGame(0);
        s.gold = 0;
        assert.deepEqual(summon(s), []);
        s.gold = 1e9;
        s.board.fill(1);
        assert.deepEqual(summon(s), []);
    });
});

describe('moveCard', () => {
    it('merges equal tiers into one higher tier', () => {
        const s = createGame(0);
        s.board[0] = 2;
        s.board[5] = 2;
        assert.equal(moveCard(s, 0, 5), 'merge');
        assert.deepEqual([s.board[0], s.board[5]], [0, 3]);
    });
    it('moves into empty slots and swaps different tiers', () => {
        const s = createGame(0);
        s.board[0] = 1;
        assert.equal(moveCard(s, 0, 3), 'move');
        s.board[6] = 2;
        assert.equal(moveCard(s, 3, 6), 'swap');
        assert.deepEqual([s.board[3], s.board[6]], [2, 1]);
        assert.equal(moveCard(s, 7, 6), 'none');
    });
    it('merging always beats keeping the pair', () => {
        assert.ok(cardPower(3) > 2 * cardPower(2));
    });
});

describe('combat', () => {
    it('taps kill enemies and pay gold', () => {
        const s = createGame(0);
        const gold = s.gold;
        let kill = null;
        for (let i = 0; i < 100 && !kill; i++) kill = tap(s);
        assert.ok(kill);
        assert.equal(s.gold, gold + kill.gold);
        assert.equal(s.kills, 1);
    });
    it('board auto-attacks on tick', () => {
        const s = createGame(0);
        s.board[0] = 5;
        const hp = s.enemyHp;
        tick(s, 0.1);
        assert.ok(s.enemyHp < hp);
        assert.equal(boardDps(s), cardPower(5));
    });
    it('beating the boss advances the stage', () => {
        const s = createGame(0);
        s.kills = KILLS_PER_STAGE - 2;
        s.enemyHp = 0.5;
        tap(s);
        assert.ok(isBoss(s));
        assert.equal(s.bossTimer, BOSS_SECONDS);
        s.enemyHp = 0.5;
        assert.equal(tap(s)?.boss, true);
        assert.deepEqual([s.stage, s.kills], [2, 0]);
    });
    it('an escaped boss replays the stage', () => {
        const s = createGame(0);
        s.kills = KILLS_PER_STAGE - 1;
        s.bossTimer = 0.05;
        tick(s, 0.1);
        assert.deepEqual([s.stage, s.kills], [1, 0]);
    });
});

describe('save', () => {
    it('round-trips and rejects junk', () => {
        const s = createGame(0);
        s.board[2] = 4;
        const back = deserialize(serialize(s, 123));
        assert.equal(back?.board[2], 4);
        assert.equal(back?.savedAt, 123);
        assert.equal(deserialize('{bad'), null);
        assert.equal(deserialize(JSON.stringify({ v: 99 })), null);
    });
    it('offline gold is capped and needs a board', () => {
        const s = createGame(0);
        assert.equal(applyOffline(s, 3600_000).gold, 0);
        s.board[0] = 3;
        s.savedAt = 0;
        const capped = applyOffline(s, 1e12);
        assert.equal(capped.seconds, OFFLINE_CAP_SECONDS);
        assert.ok(capped.gold > 0);
    });
});

const never = () => 1;
const always = () => 0;
const atStage = (stage: number) => {
    const s = createGame(0);
    s.stage = stage;
    return s;
};

describe('unlocks', () => {
    it('a boss kill reports the unlock it reaches', () => {
        const s = atStage(UNLOCKS[0].stage - 1);
        s.kills = KILLS_PER_STAGE - 1;
        s.enemyHp = 0.5;
        assert.equal(tap(s)?.unlock?.key, 'combo');
    });
    it('tap combo multiplies chained taps only once unlocked', () => {
        const early = createGame(0);
        tap(early);
        tap(early);
        assert.equal(tapDamage(early), 1);
        const s = atStage(3);
        s.enemyHp = 1e9;
        for (let i = 0; i < 5; i++) tap(s);
        assert.ok(Math.abs(tapDamage(s) - 1.4) < 1e-9);
        tick(s, 1.1);
        assert.equal(s.combo, 0);
    });
    it('multi-summon with pity makes every 10th summon T2', () => {
        const s = atStage(6);
        s.gold = 1e9;
        summon(s, 5, never);
        const slots = summon(s, 5, never);
        assert.equal(slots.length, 5);
        assert.equal(s.board[slots[4]], 2);
        assert.equal(s.board[slots[3]], 1);
    });
    it('summon luck can roll T2', () => {
        const s = createGame(0);
        s.gold = 1e9;
        s.upgrades.summon = 5;
        assert.equal(s.board[summon(s, 1, always)[0]], 2);
    });
    it('merge bounty pays gold and can jump +2 tiers', () => {
        const s = atStage(10);
        s.board[0] = 2;
        s.board[1] = 2;
        const gold = s.gold;
        moveCard(s, 0, 1, always);
        assert.equal(s.board[1], 4);
        assert.ok(s.gold > gold);
    });
    it('5×5 board opens new slots and the power tile doubles a card', () => {
        const s = atStage(17);
        s.board.fill(1);
        s.board[4] = 0;
        assert.equal(freeSlot(s), -1);
        assert.equal(moveCard(s, 0, 4), 'none'); // column 5 is closed on 4×4
        s.stage = 18;
        assert.equal(boardCols(s), 5);
        assert.equal(freeSlot(s), 4);
        s.board[POWER_TILE] = 0;
        const before = boardDps(s);
        s.board[POWER_TILE] = 1;
        assert.equal(boardDps(s) - before, 2);
    });
});

describe('enemy traits', () => {
    it('none before stage 14', () => {
        for (let k = 0; k < 4; k++) assert.equal(enemyTrait({ ...atStage(13), kills: k }), 'none');
    });
    it('shield halves board damage', () => {
        const s = atStage(15); // trait = (stage + kills) % 4 → none, shield, regen, split
        s.kills = 2;
        assert.equal(enemyTrait(s), 'shield');
        s.board[0] = 1;
        const hp = s.enemyHp;
        tick(s, 1);
        assert.ok(Math.abs(hp - s.enemyHp - 0.5) < 1e-9);
    });
    it('regen heals over time', () => {
        const s = atStage(14);
        assert.equal(enemyTrait(s), 'regen');
        s.enemyHp = 1;
        tick(s, 1);
        assert.ok(s.enemyHp > 1);
    });
    it('split enemies come back once at half HP', () => {
        const s = atStage(15);
        assert.equal(enemyTrait(s), 'split');
        s.enemyHp = 0.5;
        assert.equal(tap(s), null);
        assert.equal(s.enemyHp, enemyMaxHp(s) * 0.5);
        s.enemyHp = 0.5;
        assert.ok(tap(s));
    });
});

describe('upgrades', () => {
    it('spend gold, raise level and cost; merge needs its unlock', () => {
        const s = createGame(0);
        s.gold = 1e6;
        assert.ok(buyUpgrade(s, 'tap'));
        assert.equal(tapDamage(s), 2);
        assert.equal(buyUpgrade(s, 'merge'), false);
        s.stage = 10;
        assert.ok(buyUpgrade(s, 'merge'));
    });
});

describe('save migration', () => {
    it('v1 4×4 boards map onto the 5×5 grid', () => {
        const board = new Array(16).fill(0);
        board[5] = 3; // row 1, col 1
        const s = deserialize(JSON.stringify({ v: 1, gold: 5, stage: 2, kills: 0, board, savedAt: 0 }));
        assert.equal(s?.board[6], 3);
        assert.equal(s?.upgrades.tap, 0);
    });
});
