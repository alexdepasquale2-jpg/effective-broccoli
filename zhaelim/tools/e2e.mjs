/**
 * End-to-end: opens the vessel in a real phone-sized browser, weaves the first
 * song to completion using the solver's own plan, and checks that the weave
 * closes, the codex opens and nothing was logged to the console.
 *
 *   npm i playwright && node zhaelim/serve.mjs &
 *   node zhaelim/tools/e2e.mjs
 *
 * Playwright is not a dependency of this project. If it is not installed, this
 * says so and exits quietly; the unit tests cover the rules either way.
 */
const ORIGIN = process.env.ZHAELIM_ORIGIN ?? 'http://localhost:5178';

let pw;
try {
  pw = await import('playwright');
} catch {
  console.log('playwright is not installed — skipping the end-to-end pass');
  process.exit(0);
}

const { SONGS } = await import('../src/game/songs.js');
const { autoSolve } = await import('../src/game/solver.js');
const { fitLattice, cellCenter } = await import('../src/render/lattice-view.js');

const song = SONGS[0];
const plan = autoSolve(song);
if (!plan.solved) throw new Error('the solver cannot weave the first song');

const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
const browser = await pw.chromium.launch(launch);
const ctx = await browser.newContext({ ...pw.devices['iPhone 13'], hasTouch: true });
const page = await ctx.newPage();

const noise = [];
page.on('pageerror', (e) => noise.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && noise.push(`console: ${m.text()}`));

await page.goto(`${ORIGIN}/index.html`, { waitUntil: 'networkidle' });
await page.evaluate(() =>
  localStorage.setItem('zhaelim.vessel.v1', JSON.stringify({ seenPrologue: true })),
);
await page.reload({ waitUntil: 'networkidle' });

await page.locator('.song').first().click();
await page.getByRole('button', { name: 'begin' }).click();
await page.getByRole('button', { name: 'hold', exact: true }).click(); // step by hand, no waiting

const box = await page.locator('canvas.lattice').boundingBox();
const fit = fitLattice(song.cells, box.width, box.height);
const lastPulse = Math.max(...plan.log.map((c) => c.pulse));

for (let pulse = 0; pulse <= lastPulse + song.breaths; pulse++) {
  for (const c of plan.log.filter((l) => l.pulse === pulse)) {
    await page.locator(`.chip-${c.caste}`).click();
    const p = cellCenter(c.q, c.r, fit);
    await page.mouse.move(box.x + p.x, box.y + p.y);
    await page.mouse.down();
    await page.mouse.up();
  }
  if (await page.locator('.overlay:not(.hidden)').count()) break;
  await page.getByRole('button', { name: 'breathe' }).click();
}

await page.waitForSelector('.card.won', { timeout: 4000 });
const result = await page.locator('.card-stats').innerText();

await page.getByRole('button', { name: 'the weave' }).click();
const second = await page.locator('.song').nth(1).isEnabled();
const braids = await page.evaluate(
  () => JSON.parse(localStorage.getItem('zhaelim.vessel.v1')).braidsTotal,
);

await browser.close();

const problems = [];
if (!second) problems.push('weaving the first song did not open the second');
if (braids < song.seeds) problems.push(`the nest kept ${braids} braids, expected ${song.seeds}`);
if (noise.length) problems.push(...noise);

console.log(`${song.title} — ${result}`);
console.log(`second song open: ${second} · braids kept: ${braids}`);
if (problems.length) {
  console.error('\n' + problems.join('\n'));
  process.exit(1);
}
console.log('\nThe vessel opens, weaves and closes. Nothing complained.');
