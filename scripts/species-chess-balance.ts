/**
 * Headless balance run: bots play every species pairing from both colors and print score rates.
 * Run: npm run chess-balance [gamesPerPairing=4] [depth=2]
 */
import { botTurn, mulberry32 } from '../src/species-chess/sim/ai.ts';
import { Match, SPECIES } from '../src/species-chess/sim/species.ts';

const GAMES = Number(process.argv[2] ?? 4);
const DEPTH = Number(process.argv[3] ?? 2);
const MAX_PLIES = 300;

const ids = SPECIES.map(s => s.id);
// score[a][b] = points species a scored against b (win 1, draw 0.5)
const score: Record<string, Record<string, number>> = {};
const played: Record<string, Record<string, number>> = {};
for (const a of ids) { score[a] = {}; played[a] = {}; for (const b of ids) { score[a][b] = 0; played[a][b] = 0; } }
let whitePts = 0, total = 0, plies = 0, capped = 0;
const techTurn: Record<string, number[]> = {};

let seed = 1;
const t0 = Date.now();
for (const w of SPECIES) {
    for (const b of SPECIES) {
        for (let g = 0; g < GAMES; g++) {
            const m = new Match(w, b);
            const bot = { depth: DEPTH, rng: mulberry32(seed++) };
            let n = 0;
            const seen = { w: 0, b: 0 };
            while (!m.chess.isGameOver() && n < MAX_PLIES && botTurn(m, bot)) {
                n++;
                for (const c of ['w', 'b'] as const) {
                    for (const id of m.owned[c].slice(seen[c])) (techTurn[id] ??= []).push(Math.ceil(n / 2));
                    seen[c] = m.owned[c].length;
                }
            }
            if (n >= MAX_PLIES) capped++;
            const wp = m.chess.isCheckmate() ? (m.chess.turn() === 'b' ? 1 : 0) : 0.5;
            score[w.id][b.id] += wp; played[w.id][b.id]++;
            score[b.id][w.id] += 1 - wp; played[b.id][w.id]++;
            whitePts += wp; total++; plies += n;
        }
    }
}

const pct = (x: number) => `${(x * 100).toFixed(0)}%`.padStart(6);
console.log(`${total} games, depth ${DEPTH}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
console.log(`White score ${pct(whitePts / total)} | avg ${(plies / total).toFixed(0)} plies | ${capped} hit ${MAX_PLIES}-ply cap (draw)\n`);
console.log('row vs col'.padEnd(12) + ids.map(i => i.padStart(8)).join('') + '   overall');
for (const a of ids) {
    const all = ids.reduce((s, b) => s + score[a][b], 0) / ids.reduce((s, b) => s + played[a][b], 0);
    console.log(a.padEnd(12) + ids.map(b => pct(score[a][b] / played[a][b]).padStart(8)).join('') + '  ' + pct(all));
}
console.log('\nAvg turn each tech was bought (count):');
for (const s of SPECIES) for (const t of s.techs) {
    const xs = techTurn[t.id] ?? [];
    console.log(`  ${(s.id + '/' + t.id).padEnd(22)} ${xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '-'} (${xs.length})`);
}
