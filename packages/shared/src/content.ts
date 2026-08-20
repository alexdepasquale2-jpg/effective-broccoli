import { z } from 'zod';

/**
 * Content schemas. Everything dataforge emits, and everything the server loads
 * at boot, is validated against these. Authored bootstrap content and imported
 * CC0 content share one shape, so the importer can be developed against a
 * schema that already works.
 */

export const ItemDefSchema = z.object({
  /** Stable id, e.g. "wood_plank". Matches the GSJS class_tsid where imported. */
  id: z.string().min(1),
  name: z.string().min(1),
  /** Plural form, used in "you got 3 planks" messaging. */
  namePlural: z.string().optional(),
  stackMax: z.number().int().positive().default(1),
  /** Path of the sprite within the content bundle. */
  sprite: z.string().optional(),
  /** Where this definition came from, for provenance and debugging. */
  source: z.enum(['authored', 'gsjs']).default('authored'),
});
export type ItemDef = z.infer<typeof ItemDefSchema>;

export const SkillDefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /**
   * Glitch skills came in numbered tiers: Alchemy I, Alchemy II, ...
   * 25 of the 106 shipped skills are untiered and carry level 0.
   */
  level: z.number().int().nonnegative().default(1),
  description: z.string().default(''),
  /** Learning time in seconds in the original game; kept for curve tuning. */
  pointCost: z.number().int().nonnegative().default(0),
  /** Ids of skills that must be learned first. This is the real Glitch tech tree. */
  requires: z.array(z.string()).default([]),
  source: z.enum(['authored', 'gsjs']).default('authored'),
});
export type SkillDef = z.infer<typeof SkillDefSchema>;

/** A horizontal surface the player can stand on. */
export const PlatformSchema = z.object({
  x1: z.number(),
  x2: z.number(),
  y: z.number(),
});
export type Platform = z.infer<typeof PlatformSchema>;

/** A parallax-scrolled backdrop band. */
export const LayerSchema = z.object({
  id: z.string(),
  /** 0 = fixed to camera, 1 = moves with the world. */
  parallax: z.number().min(0).max(1),
  fill: z.string().optional(),
  sprite: z.string().optional(),
  y: z.number().default(0),
  height: z.number().optional(),
});
export type Layer = z.infer<typeof LayerSchema>;

/** What a harvestable entity gives up, and what it trains. */
export const YieldSchema = z.object({
  item: z.string().min(1),
  min: z.number().int().positive().default(1),
  max: z.number().int().positive().default(1),
  skill: z.string().min(1),
  xp: z.number().int().nonnegative().default(5),
});
export type Yield = z.infer<typeof YieldSchema>;

export const EntityDefSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['tree', 'rock', 'decor']),
  x: z.number(),
  y: z.number(),
  sprite: z.string().optional(),
  /** Verbs a player may use. An entity with no verbs is scenery. */
  verbs: z.array(z.enum(['harvest'])).default([]),
  cooldownMs: z.number().int().nonnegative().default(0),
  yield: YieldSchema.optional(),
});
export type EntityDef = z.infer<typeof EntityDefSchema>;

export const LocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  spawn: z.object({ x: z.number(), y: z.number() }),
  sky: z.string().default('#8fd0e8'),
  layers: z.array(LayerSchema).default([]),
  platforms: z.array(PlatformSchema).min(1),
  entities: z.array(EntityDefSchema).default([]),
});
export type Location = z.infer<typeof LocationSchema>;

export const ContentManifestSchema = z.object({
  generatedAt: z.string(),
  /** Which sources contributed, so the server can report provenance at boot. */
  sources: z.array(z.string()),
  items: z.array(ItemDefSchema),
  skills: z.array(SkillDefSchema),
  locations: z.array(z.string()),
});
export type ContentManifest = z.infer<typeof ContentManifestSchema>;
