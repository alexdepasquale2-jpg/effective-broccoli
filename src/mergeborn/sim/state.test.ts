import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOSS_SECONDS, KILLS_PER_STAGE, OFFLINE_CAP_SECONDS } from './constants.ts';
import {
    applyOffline,
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
        assert.equal(summon(s), 0);
        assert.equal(s.board[0], 1);
        assert.equal(s.gold, 10 - cost);
        assert.ok(summonCost(s) > cost);
    });
    it('fails without gold or a free slot', () => {
        const s = createGame(0);
        s.gold = 0;
        assert.equal(summon(s), -1);
        s.gold = 1e9;
        s.board.fill(1);
        assert.equal(summon(s), -1);
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
        s.board[4] = 2;
        assert.equal(moveCard(s, 3, 4), 'swap');
        assert.deepEqual([s.board[3], s.board[4]], [2, 1]);
        assert.equal(moveCard(s, 7, 4), 'none');
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
