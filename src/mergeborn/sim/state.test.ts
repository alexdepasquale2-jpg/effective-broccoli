import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BOSS_SECONDS, KILLS_PER_STAGE, OFFLINE_CAP_SECONDS, POWER_TILE } from './constants.ts';
import { elementId } from './heroes.ts';
import {
    UNLOCKS,
    ascend,
    canAscend,
    enemyElement,
    rollChi,
    buyShop,
    essenceGain,
    goals,
    killGold,
    shuffle,
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

describe('shuffle', () => {
    it('locked before stage 25, pays more Essence the deeper you go', () => {
        assert.equal(shuffle(atStage(24)), 0);
        assert.equal(essenceGain(atStage(25)), 3);
        assert.ok(essenceGain(atStage(30)) > essenceGain(atStage(25)));
    });
    it('resets the run but keeps Essence, shop and records', () => {
        const s = atStage(30);
        s.bestStage = 30;
        s.gold = 1e9;
        s.board[0] = 6;
        s.upgrades.tap = 4;
        s.shop.might = 1;
        const gain = shuffle(s);
        assert.ok(gain > 0);
        assert.deepEqual([s.stage, s.gold, s.board[0], s.upgrades.tap], [1, 10, 0, 0]);
        assert.deepEqual([s.essence, s.shuffles, s.bestStage, s.shop.might], [gain, 1, 30, 1]);
    });
    it('shop boosts damage, gold and summon tier', () => {
        const s = createGame(0);
        s.essence = 100;
        const tap1 = tapDamage(s);
        const gold1 = killGold(s);
        assert.ok(buyShop(s, 'might'));
        assert.ok(buyShop(s, 'fortune'));
        assert.ok(buyShop(s, 'headstart'));
        assert.equal(tapDamage(s), tap1 * 1.5);
        assert.ok(killGold(s) > gold1);
        s.gold = 1e6;
        assert.equal(s.board[summon(s, 1, never)[0]], 2);
        assert.equal(s.essence, 100 - 1 - 1 - 10);
        s.essence = 0;
        assert.equal(buyShop(s, 'might'), false);
    });
    it('goal ladder shows three goals and ends with Shuffle', () => {
        assert.equal(goals(createGame(0)).length, 3);
        const late = goals(atStage(26));
        assert.equal(late.length, 1);
        assert.match(late[0].label, /Shuffle now/);
    });
    it('v2 saves load with an empty shop', () => {
        const s = deserialize(JSON.stringify({ v: 2, ...createGame(0), shop: undefined, essence: undefined }));
        assert.deepEqual(s?.shop, { might: 0, fortune: 0, headstart: 0 });
    });
});

describe('ascend and heroes', () => {
    const ascended = (n: number) => {
        const s = createGame(0);
        s.ascends = n;
        return s;
    };
    it('needs one Shuffle, wipes Essence and shop, adds an element and a hero', () => {
        const s = createGame(0);
        assert.equal(ascend(s), null);
        s.shuffles = 1;
        s.essence = 50;
        s.shop.might = 3;
        s.bestStage = 40;
        assert.ok(canAscend(s));
        const hero = ascend(s, () => 0);
        assert.equal(hero, 'fire-bellows');
        assert.deepEqual([s.ascends, s.essence, s.shop.might, s.shuffles, s.bestStage], [1, 0, 0, 0, 40]);
        assert.deepEqual(s.heroes, ['fire-bellows']);
        assert.ok(s.chi.every((c) => c === 0 || c === 1));
    });
    it('shuffle keeps heroes and re-rolls chi', () => {
        const s = ascended(2);
        s.heroes = ['smelter'];
        s.stage = 30;
        shuffle(s);
        assert.deepEqual([s.ascends, s.heroes], [2, ['smelter']]);
        assert.ok(s.chi.some((c) => c > 0));
    });
    it('summons take the tile chi; only same element or neutral merge', () => {
        const s = ascended(2);
        s.gold = 1e9;
        s.chi.fill(1);
        s.chi[1] = 2;
        summon(s, 2, never);
        assert.deepEqual([s.elem[0], s.elem[1]], [1, 2]);
        assert.equal(moveCard(s, 0, 1), 'swap');
        s.chi[2] = 0;
        summon(s, 1, never);
        assert.equal(moveCard(s, 2, 1), 'merge');
        assert.deepEqual([s.board[1], s.elem[1]], [2, 1]);
    });
    it('counter wheel: water ×2 vs fire, ×0.5 vs air', () => {
        const s = ascended(4);
        s.board[0] = 1;
        s.elem[0] = elementId('water');
        s.stage = 1;
        s.kills = 0; // enemy element = (3 + 0) % 4 + 1 = 4 = air
        assert.equal(enemyElement(s), elementId('air'));
        assert.equal(boardDps(s), 0.5);
        s.kills = 1; // (3 + 1) % 4 + 1 = 1 = fire
        assert.equal(enemyElement(s), elementId('fire'));
        assert.equal(boardDps(s), 2);
    });
    it('heroes roll from the tile element and keep their skill through merges', () => {
        const s = ascended(1);
        s.heroes = ['fire-bellows'];
        s.gold = 1e9;
        s.chi.fill(1);
        summon(s, 1, always);
        assert.equal(s.hero[0], 'fire-bellows');
        s.board[1] = 1;
        s.elem[1] = 1;
        assert.equal(moveCard(s, 1, 0, never), 'merge');
        assert.equal(s.hero[0], 'fire-bellows');
        s.board[1] = 1; // neighbour of the bellows
        assert.equal(boardDps(s), 2.5 + 1.25);
    });
    it('hero skills: duelist, turtle, siren, smuggler, bellringer', () => {
        const s = ascended(2);
        s.board[0] = 1;
        s.enemyHp = 1e9;
        s.hero[0] = 'ifrit-duelist';
        for (let i = 0; i < 9; i++) tap(s);
        const before = s.enemyHp;
        tap(s);
        assert.ok(Math.abs(before - s.enemyHp - 10 * tapDamage(s)) < 1e-6);
        s.hero[0] = 'rain-smuggler';
        assert.equal(summonCost(s), Math.ceil(10 * 0.85));
        s.hero[0] = 'magma-turtle';
        s.kills = KILLS_PER_STAGE - 2;
        s.enemyHp = 0.1;
        tap(s);
        assert.equal(s.bossTimer, BOSS_SECONDS + 5);
        s.hero[0] = 'drowned-bellringer';
        s.enemyHp = 0.1;
        tap(s);
        // Boss kill queues 3 weakened foes; the next spawn already used one.
        assert.equal(s.weakened, 2);
        assert.ok(Math.abs(s.enemyHp - enemyMaxHp(s) * 0.7) < 1e-9);
    });
    it('rollChi stays neutral before any Ascend', () => {
        const s = createGame(0);
        rollChi(s, always);
        assert.ok(s.chi.every((c) => c === 0));
    });
});
