/**
 * Proves every authored song can actually be woven, and reports the budget the
 * solver needed. Run: node zhaelim/tools/verify-songs.mjs
 *
 * The Kor insist on this before a song is allowed into the vessel. A lattice
 * that cannot be woven is not a hard song, it is a lie.
 */
import { SONGS } from '../src/game/songs.js';
import { autoSolve } from '../src/game/solver.js';

let bad = 0;
const rows = [];

for (const song of SONGS) {
  const t0 = Date.now();
  const res = autoSolve(song);
  const ms = Date.now() - t0;
  const headroom = song.breaths - res.breaths;
  const ok = res.solved && headroom >= 0;
  if (!ok) bad++;
  rows.push({
    song: song.id,
    seeds: song.seeds,
    solved: res.solved ? 'yes' : 'NO',
    woke: `${res.braided}/${res.seeds}`,
    needs: res.breaths,
    budget: song.breaths,
    slack: headroom,
    casts: res.casts,
    ms,
  });
}

const widths = {};
const cols = Object.keys(rows[0]);
for (const c of cols) widths[c] = Math.max(c.length, ...rows.map((r) => String(r[c]).length));
const line = (r) => cols.map((c) => String(r[c]).padStart(widths[c])).join('  ');
console.log(line(Object.fromEntries(cols.map((c) => [c, c]))));
console.log(cols.map((c) => '-'.repeat(widths[c])).join('  '));
for (const r of rows) console.log(line(r));

if (bad) {
  console.error(`\n${bad} song(s) unsolvable or over budget.`);
  process.exit(1);
}
console.log('\nAll songs weave. The lattice is honest.');
