import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ContentManifestSchema,
  LocationSchema,
  type ContentManifest,
  type ItemDef,
  type Location,
  type SkillDef,
} from '@glimmer/shared';
import { contentDir } from './config.ts';

/**
 * The content bundle, loaded once at boot and then immutable.
 *
 * Content is data the server owns and validates; the client never loads it from
 * disk, it receives what the server chooses to send. That keeps content a
 * server-side concern and leaves room for per-player filtering later.
 */
export class Content {
  readonly manifest: ContentManifest;
  private readonly locations: Map<string, Location>;
  private readonly items: Map<string, ItemDef>;
  private readonly skills: Map<string, SkillDef>;

  private constructor(
    manifest: ContentManifest,
    locations: Map<string, Location>,
    items: Map<string, ItemDef>,
    skills: Map<string, SkillDef>,
  ) {
    this.manifest = manifest;
    this.locations = locations;
    this.items = items;
    this.skills = skills;
  }

  static async load(dir: string = contentDir): Promise<Content> {
    let manifest: ContentManifest;
    try {
      manifest = ContentManifestSchema.parse(
        JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8')),
      );
    } catch (err) {
      throw new Error(
        `could not load content from ${dir}: ${(err as Error).message}\n` +
          'Run `npm run dataforge` to build it.',
        { cause: err },
      );
    }

    const locations = new Map<string, Location>();
    for (const id of manifest.locations) {
      const raw = JSON.parse(await readFile(path.join(dir, 'locations', `${id}.json`), 'utf8'));
      locations.set(id, LocationSchema.parse(raw));
    }

    return new Content(
      manifest,
      locations,
      new Map(manifest.items.map((i) => [i.id, i])),
      new Map(manifest.skills.map((s) => [s.id, s])),
    );
  }

  location(id: string): Location | undefined {
    return this.locations.get(id);
  }

  item(id: string): ItemDef | undefined {
    return this.items.get(id);
  }

  skill(id: string): SkillDef | undefined {
    return this.skills.get(id);
  }

  /** Where a brand new player wakes up. */
  get startingLocation(): Location {
    const first = this.locations.values().next().value;
    if (!first) throw new Error('content bundle contains no locations');
    return first;
  }

  describe(): string {
    return `${this.manifest.items.length} items, ${this.manifest.skills.length} skills, ${this.locations.size} locations (sources: ${this.manifest.sources.join(', ')})`;
  }
}
