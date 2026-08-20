import { z } from 'zod';
import { EntityDefSchema, LayerSchema, PlatformSchema } from './content.ts';

/**
 * The wire protocol. Both ends import these schemas, so a change that breaks
 * compatibility fails typecheck rather than showing up as a runtime mystery.
 *
 * Every client message is validated server-side before it touches game state:
 * the client is never trusted, only listened to.
 */

// ---------------------------------------------------------------- client -> server

export const InputMessageSchema = z.object({
  t: z.literal('input'),
  /** Monotonic per-connection sequence number, echoed back for reconciliation. */
  seq: z.number().int().nonnegative(),
  /** Horizontal intent: -1, 0, or 1. */
  dx: z.number().min(-1).max(1),
  jump: z.boolean(),
});

export const InteractMessageSchema = z.object({
  t: z.literal('interact'),
  seq: z.number().int().nonnegative(),
  entityId: z.string().min(1),
  verb: z.enum(['harvest']),
});

export const ChatMessageSchema = z.object({
  t: z.literal('chat'),
  text: z.string().min(1).max(240),
});

export const PingMessageSchema = z.object({
  t: z.literal('ping'),
  sentAt: z.number(),
});

export const ClientMessageSchema = z.discriminatedUnion('t', [
  InputMessageSchema,
  InteractMessageSchema,
  ChatMessageSchema,
  PingMessageSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ---------------------------------------------------------------- server -> client

/** A player as everyone else sees them. */
export const ActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  vx: z.number(),
  vy: z.number(),
  facing: z.union([z.literal(-1), z.literal(1)]),
  grounded: z.boolean(),
});
export type Actor = z.infer<typeof ActorSchema>;

/** Mutable runtime state of a world entity (what a snapshot adds to its definition). */
export const EntityStateSchema = z.object({
  id: z.string(),
  /** Epoch ms until which this entity cannot be used again. 0 = ready. */
  readyAt: z.number(),
});
export type EntityState = z.infer<typeof EntityStateSchema>;

export const InventorySlotSchema = z.object({
  slot: z.number().int().nonnegative(),
  item: z.string(),
  count: z.number().int().positive(),
});
export type InventorySlot = z.infer<typeof InventorySlotSchema>;

export const SkillStateSchema = z.object({
  id: z.string(),
  xp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
});
export type SkillState = z.infer<typeof SkillStateSchema>;

/** Sent once on join: everything needed to render the location from scratch. */
export const WelcomeMessageSchema = z.object({
  t: z.literal('welcome'),
  youId: z.string(),
  tick: z.number().int(),
  serverTime: z.number(),
  location: z.object({
    id: z.string(),
    name: z.string(),
    width: z.number(),
    height: z.number(),
    sky: z.string(),
    layers: z.array(LayerSchema),
    platforms: z.array(PlatformSchema),
    entities: z.array(EntityDefSchema),
  }),
  actors: z.array(ActorSchema),
  entityStates: z.array(EntityStateSchema),
  inventory: z.array(InventorySlotSchema),
  skills: z.array(SkillStateSchema),
});

/** Per-tick world delta. Only what changed. */
export const SnapshotMessageSchema = z.object({
  t: z.literal('snapshot'),
  tick: z.number().int(),
  serverTime: z.number(),
  actors: z.array(ActorSchema),
  left: z.array(z.string()),
  entityStates: z.array(EntityStateSchema),
  /** Echo of the last input this client sent that the server has simulated. */
  ackSeq: z.number().int().nonnegative().optional(),
  /** Authoritative position for the receiving client, for reconciliation. */
  you: ActorSchema.optional(),
});

export const InventoryMessageSchema = z.object({
  t: z.literal('inventory'),
  slots: z.array(InventorySlotSchema),
});

export const SkillMessageSchema = z.object({
  t: z.literal('skill'),
  id: z.string(),
  xp: z.number().int().nonnegative(),
  level: z.number().int().positive(),
  gained: z.number().int().nonnegative(),
  levelledUp: z.boolean(),
});

export const HarvestedMessageSchema = z.object({
  t: z.literal('harvested'),
  entityId: z.string(),
  byId: z.string(),
  item: z.string(),
  count: z.number().int().positive(),
});

export const ChatBroadcastSchema = z.object({
  t: z.literal('say'),
  fromId: z.string(),
  fromName: z.string(),
  text: z.string(),
});

export const PongMessageSchema = z.object({
  t: z.literal('pong'),
  sentAt: z.number(),
  serverTime: z.number(),
});

export const ErrorMessageSchema = z.object({
  t: z.literal('error'),
  code: z.enum([
    'unauthorized',
    'bad_message',
    'out_of_range',
    'not_ready',
    'inventory_full',
    'unknown',
  ]),
  message: z.string(),
});

export const ServerMessageSchema = z.discriminatedUnion('t', [
  WelcomeMessageSchema,
  SnapshotMessageSchema,
  InventoryMessageSchema,
  SkillMessageSchema,
  HarvestedMessageSchema,
  ChatBroadcastSchema,
  PongMessageSchema,
  ErrorMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

export type WelcomeMessage = z.infer<typeof WelcomeMessageSchema>;
export type SnapshotMessage = z.infer<typeof SnapshotMessageSchema>;
export type InventoryMessage = z.infer<typeof InventoryMessageSchema>;
export type SkillMessage = z.infer<typeof SkillMessageSchema>;
export type HarvestedMessage = z.infer<typeof HarvestedMessageSchema>;
