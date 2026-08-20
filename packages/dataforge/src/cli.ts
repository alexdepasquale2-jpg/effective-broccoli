import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');

try {
  await build({ root });
} catch (err) {
  console.error(`dataforge failed: ${(err as Error).message}`);
  process.exitCode = 1;
}
