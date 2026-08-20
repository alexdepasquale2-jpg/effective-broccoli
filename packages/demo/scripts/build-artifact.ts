import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Folds the Vite build into one self-contained page fragment.
 *
 * The Artifact host supplies its own <!doctype>, <html>, <head> and <body>, so
 * what we emit is the page *contents*: the title, the one permitted external
 * stylesheet (Google Fonts), the inlined CSS, the markup, and the inlined
 * module. No other host is reachable under the CSP, so nothing may stay as a
 * separate file.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, '..', 'dist-web');
const outDir = path.join(here, '..', 'dist-artifact');

const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const js = await readFile(path.join(dist, 'bundle.js'), 'utf8');
const css = await readFile(path.join(dist, 'bundle.css'), 'utf8');

const grab = (re: RegExp, what: string): string => {
  const m = html.match(re);
  if (!m?.[1]) throw new Error(`could not find ${what} in the built html`);
  return m[1];
};

const title = grab(/<title>([\s\S]*?)<\/title>/, 'title');
const fontLinks = [...html.matchAll(/<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>/g)].map(
  (m) => m[0],
);
if (fontLinks.length === 0) throw new Error('expected the Google Fonts links to survive the build');

const body = grab(/<body>([\s\S]*?)<\/body>/, 'body');
// Drop the module tag Vite injected; the script is inlined below instead.
const markup = body.replace(/<script[^>]*><\/script>/g, '').trim();

/** A closing script tag inside a string literal would end the block early. */
const escapeForScript = (s: string) => s.replace(/<\/(script)/gi, '<\\/$1');

const page = `<title>${title}</title>
${fontLinks.join('\n')}
<style>
${css}
</style>

${markup}

<script type="module">
${escapeForScript(js)}
</script>
`;

await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, 'groddle-meadow.html');
await writeFile(outFile, page);

const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;
console.log(`wrote ${path.relative(process.cwd(), outFile)} — ${kb(page.length)} total`);
if (/<\/body>|<\/html>|<!doctype/i.test(page)) {
  throw new Error('artifact fragment must not contain document wrapper tags');
}
