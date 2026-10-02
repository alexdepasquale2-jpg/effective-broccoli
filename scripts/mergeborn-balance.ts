/**
 * Headless balance bot: plays Mergeborn through every layer with a simple greedy policy
 * and prints when each milestone lands. Run: npm run balance [hours]
 */
import { SHOP, UPGRADES, ascend, buyShop, buyUpgrade, canAscend, canEra, canRevolt, canShuffle, canUpgrade, createGame, isOpen, moveCard, multiSummonCount, nextEra, revolt, shopCost, shuffle, summon, summonCost, tap, tick, upgradeCost } from '../src/mergeborn/sim/state.ts';
import type { ShopKey, UpgradeKey } from '../src/mergeborn/sim/state.ts';

const HOURS = Number(process.argv[2] ?? 12);
const DT = 0.25;
const TAPS_PER_SEC = 4;
const STALL = 60;

const s = createGame(0);
const log: string[] = [];
const fmt = (t: number) => (t < 3600 ? `${(t / 60).toFixed(1)} min` : `${(t / 3600).toFixed(2)} h`);
const mark = (t: number, what: string) => log.push(`${fmt(t).padStart(9)}  ${what}`);

let lastStage = 1;
let lastStageAt = 0;
let runStart = 0;
let tapAcc = 0;

function mergeAll() {
    for (let a = 0; a < s.board.length; a++) {
        if (!s.board[a] || !isOpen(s, a)) continue;
        for (let b = a + 1; b < s.board.length; b++) {
            if (s.board[b] === s.board[a] && isOpen(s, b) && (!s.elem[a] || !s.elem[b] || s.elem[a] === s.elem[b])) {
                moveCard(s, a, b);
                break;
            }
        }
    }
}

function spendEssence() {
    for (;;) {
        const k = (Object.keys(SHOP) as ShopKey[]).sort((x, y) => shopCost(s, x) - shopCost(s, y))[0];
        if (!buyShop(s, k)) return;
    }
}

for (let t = 0; t < HOURS * 3600; t += DT) {
    tapAcc += TAPS_PER_SEC * DT;
    for (; tapAcc >= 1; tapAcc -= 1) tap(s);
    tick(s, DT);
    mergeAll();
    const keys = (Object.keys(UPGRADES) as UpgradeKey[]).filter((k) => canUpgrade(s, k)).sort((x, y) => upgradeCost(s, x) - upgradeCost(s, y));
    if (keys.length && upgradeCost(s, keys[0]) < summonCost(s) * 2) buyUpgrade(s, keys[0]);
    summon(s, multiSummonCount(s));

    if (s.stage !== lastStage) {
        lastStage = s.stage;
        lastStageAt = t;
    }
    const stalled = t - lastStageAt > STALL;
    if (!stalled) continue;

    const where = `era ${s.era} rev ${s.revolutions}`;
    if (canRevolt(s)) {
        revolt(s);
        mark(t, `REVOLUTION ${s.revolutions}  (best stage ${s.bestStage})`);
    } else if (canEra(s)) {
        nextEra(s);
        mark(t, `Era ${s.era}  (rev ${s.revolutions}, best ${s.bestStage})`);
    } else if (canAscend(s) && s.shuffles >= 3 && s.ascends < 6) {
        ascend(s);
        mark(t, `  Ascend ${s.ascends}  (${where}, heroes ${s.heroes.length})`);
    } else if (canShuffle(s)) {
        const stage = s.stage;
        const gain = shuffle(s);
        if (s.shuffles <= 3 || s.shuffles % 10 === 0) mark(t, `    Shuffle #${s.shuffles} at stage ${stage}: +${gain} Essence, run ${fmt(t - runStart)}  (${where})`);
        runStart = t;
    } else {
        continue;
    }
    spendEssence();
    lastStage = 1;
    lastStageAt = t;
}
console.log(log.join('\n'));
console.log(`\nAfter ${HOURS} h: era ${s.era}, revolutions ${s.revolutions}, stage ${s.stage}, best ${s.bestStage}, heroes ${s.heroes.length}`);
