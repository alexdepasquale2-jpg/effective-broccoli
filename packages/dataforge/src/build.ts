import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ContentManifestSchema,
  ItemDefSchema,
  LocationSchema,
  SkillDefSchema,
  type ContentManifest,
  type ItemDef,
  type Location,
  type SkillDef,
} from '@glimmer/shared';
import { importItems, importSkills } from './gsjs.ts';
import { checkReachability } from './reachability.ts';

export interface BuildOptions {
  /** Repo root. Defaults to walking up from this file. */
  root: string;
  /** Suppress progress output (tests). */
  quiet?: boolean;
}

export interface BuildResult {
  manifest: ContentManifest;
  locations: Location[];
  outDir: string;
}

async function exists(p: string): Promise<boolean> {
  try {
    await readdir(p);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, 'utf8'));
}

/**
 * Merges imported definitions over authored ones by id.
 *
 * Authored entries are stubs keyed by real Glitch ids, so an import upgrades
 * them in place rather than creating a duplicate catalogue. Authored sprite
 * choices win, because the importer has no opinion about presentation.
 */
function mergeById<T extends { id: string; sprite?: string | undefined }>(
  authored: T[],
  imported: T[],
): T[] {
  const byId = new Map<string, T>();
  for (const a of authored) byId.set(a.id, a);
  for (const i of imported) {
    const a = byId.get(i.id);
    byId.set(i.id, a ? { ...a, ...i, sprite: a.sprite ?? i.sprite } : i);
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export async function build(opts: BuildOptions): Promise<BuildResult> {
  const { root, quiet = false } = opts;
  const log = (msg: string) => {
    if (!quiet) console.log(msg);
  };

  const contentDir = path.join(root, 'packages', 'content');
  const authoredDir = path.join(contentDir, 'authored');
  const outDir = path.join(contentDir, 'generated');
  const gsjsRoot = path.join(root, 'vendor', 'glitch-gsjs');

  const sources: string[] = ['authored'];

  // ---- authored baseline -------------------------------------------------
  const authoredItems = ItemDefSchema.array().parse(
    await readJson(path.join(authoredDir, 'items.json')),
  );
  const authoredSkills = SkillDefSchema.array().parse(
    await readJson(path.join(authoredDir, 'skills.json')),
  );

  const locationsDir = path.join(authoredDir, 'locations');
  const locationFiles = (await readdir(locationsDir)).filter((f) => f.endsWith('.json'));
  const locations: Location[] = [];
  for (const file of locationFiles) {
    locations.push(LocationSchema.parse(await readJson(path.join(locationsDir, file))));
  }
  log(
    `authored: ${authoredItems.length} items, ${authoredSkills.length} skills, ${locations.length} locations`,
  );

  // ---- CC0 import, when the sources are present --------------------------
  let items: ItemDef[] = authoredItems;
  let skills: SkillDef[] = authoredSkills;

  if (await exists(path.join(gsjsRoot, 'items'))) {
    const [importedItems, importedSkills] = await Promise.all([
      importItems(gsjsRoot),
      importSkills(gsjsRoot),
    ]);
    items = mergeById(authoredItems, ItemDefSchema.array().parse(importedItems));
    skills = mergeById(authoredSkills, SkillDefSchema.array().parse(importedSkills));
    sources.push('gsjs');
    log(`gsjs:     ${importedItems.length} items, ${importedSkills.length} skills`);
  } else {
    log('gsjs:     not present -- run ./scripts/fetch-cc0-sources.sh to import the full catalogue');
  }

  // ---- validate cross-references -----------------------------------------
  const itemIds = new Set(items.map((i) => i.id));
  const skillIds = new Set(skills.map((s) => s.id));
  const problems: string[] = [];
  for (const loc of locations) {
    for (const e of loc.entities) {
      if (!e.yield) continue;
      if (!itemIds.has(e.yield.item)) {
        problems.push(`${loc.id}/${e.id}: yields unknown item "${e.yield.item}"`);
      }
      if (!skillIds.has(e.yield.skill)) {
        problems.push(`${loc.id}/${e.id}: trains unknown skill "${e.yield.skill}"`);
      }
      if (e.yield.min > e.yield.max) {
        problems.push(`${loc.id}/${e.id}: yield min ${e.yield.min} exceeds max ${e.yield.max}`);
      }
    }

    // Geometry a player cannot actually stand on is content that does not exist.
    for (const r of checkReachability(loc)) {
      problems.push(`${loc.id}: ${r.detail}`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`content validation failed:\n  ${problems.join('\n  ')}`);
  }

  // ---- emit --------------------------------------------------------------
  const manifest = ContentManifestSchema.parse({
    generatedAt: new Date().toISOString(),
    sources,
    items,
    skills,
    locations: locations.map((l) => l.id),
  });

  await rm(outDir, { recursive: true, force: true });
  await mkdir(path.join(outDir, 'locations'), { recursive: true });
  await writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  for (const loc of locations) {
    await writeFile(path.join(outDir, 'locations', `${loc.id}.json`), JSON.stringify(loc, null, 2));
  }

  log(
    `wrote:    ${items.length} items, ${skills.length} skills, ${locations.length} locations -> ${path.relative(root, outDir)}`,
  );
  return { manifest, locations, outDir };
}
