/**
 * Folds the whole vessel into one HTML file — script, styles, icon and all —
 * so it can be handed to anything that serves a single page and nothing else.
 *
 *   npm i esbuild && node zhaelim/tools/build-single.mjs
 *   → zhaelim/dist/zhaelim.html
 *
 * The result makes no network request of any kind, which was the point before
 * it was a convenience.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'dist', 'zhaelim.html');

let esbuild;
try {
  esbuild = await import('esbuild');
} catch {
  console.error('esbuild is not installed:  npm i esbuild');
  process.exit(1);
}

const bundle = await esbuild.build({
  entryPoints: [join(ROOT, 'src', 'main.js')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  minify: false,
  write: false,
  legalComments: 'inline',
});

const script = bundle.outputFiles[0].text;
const css = await readFile(join(ROOT, 'styles', 'vessel.css'), 'utf8');
const icon = await readFile(join(ROOT, 'assets', 'icon.svg'), 'utf8');
const iconHref = `data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}`;

/**
 * Body-only, so it can be dropped into a host that supplies its own <head>.
 * A standalone <head> is written too, for anyone opening the file directly.
 */
const page = `<title>Zha'elim</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, maximum-scale=1" />
<meta name="theme-color" content="#07070d" />
<link rel="icon" href="${iconHref}" type="image/svg+xml" />
<style>
${css}
/* The host may paint its own ground behind us. This page is a night sky. */
html,
body {
  background: #07070d;
}
</style>

<div id="app"></div>
<noscript>
  <p style="color: #e8eaf6; font-family: system-ui; padding: 2rem">
    The vessel needs script to run. The Kor apologise; the Vel do not.
  </p>
</noscript>

<script>
  window.ZHAELIM_STANDALONE = true;
</script>
<script type="module">
${script}
</script>
`;

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, page);
const kb = (page.length / 1024).toFixed(0);
console.log(`zhaelim/dist/zhaelim.html — ${kb} KB, one file, no requests`);
