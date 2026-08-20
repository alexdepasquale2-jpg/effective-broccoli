# Architecture

TypeScript end to end, in an npm-workspaces monorepo.

```
packages/shared      wire protocol (zod), physics, content schemas, skill curve
packages/dataforge   build-time importer: CC0 sources -> validated JSON
packages/content     authored bootstrap content + generated output
packages/server      Fastify (auth) + ws (game socket) + Postgres
packages/client      Vite + PixiJS
```

## The one decision that matters: location rooms

Glitch's world is not a continuous space. It is a graph of discrete **locations** — streets — each a
self-contained scene with its own players, items and geometry. That maps exactly onto an
**authoritative per-location room**:

- Each active location is an in-memory `LocationRoom` owning its occupants and entity state.
- It runs a fixed 20 Hz tick: step every body, then broadcast the delta to everyone in the room.
- Rooms hydrate from Postgres on first entry and are dropped once empty, so an idle world costs
  nothing.
- **Rooms never share mutable state.**

That last point is the whole reason for the design. Scaling later means running rooms on more than
one process with a directory service in front — an _additive_ change, because nothing in a room
reaches into another one. The concept's "improved server infrastructure" is reachable without paying
distributed-systems tax on day one.

`packages/server/src/game/room.ts` is the core; `world.ts` owns the set of live rooms and their
write-back.

## Shared physics, and why it lives in `shared`

`stepBody()` in `packages/shared/src/physics.ts` is imported by **both** ends.

- The server runs it to decide truth.
- The client runs the same function to predict locally, and to replay unacknowledged inputs when a
  correction arrives.

Because it is literally the same code, agreement is the normal case and reconciliation is usually a
no-op. Two hand-written implementations that "should" match is the classic source of rubber-banding;
this design makes divergence a compile error rather than a bug report.

The physics is deterministic and has a test asserting so, because replay depends on it.

## Netcode

- **Client → server:** `input` (dx, jump, seq), `interact`, `chat`, `ping`. Every message is
  validated with zod before it touches game state. The socket is bound to one player id at upgrade,
  so no message can ever claim to be somebody else.
- **Server → client:** `welcome` (full location snapshot on join), `snapshot` (per-tick delta with
  `ackSeq` and the receiver's authoritative position), plus `inventory`, `skill`, `harvested`, `say`,
  `error`.
- **Prediction:** the local player moves on the input frame. On each snapshot the client replays
  pending inputs from the server's position and snaps only if the disagreement exceeds 2px.
- **Interpolation:** remote players arrive at 20 Hz and render at 60 fps, so they are eased toward
  their latest target rather than teleported.

Authentication is the same httpOnly session cookie the HTTP API uses, checked once at socket upgrade.
There is no second token to leak.

## The server is authoritative, always

Every precondition for an action is checked server-side: the entity exists and is harvestable, it is
off cooldown, the player is within `INTERACT_RANGE`, and there is room in their pack. The client's
job is to render and to ask; it is never trusted to assert.

## Persistence

Three tables (`packages/server/src/db/schema/`):

| Table            | Holds                                                        |
| ---------------- | ------------------------------------------------------------ |
| `players`        | identity, position, and **JSONB** inventory + skills         |
| `sessions`       | session id → player, with expiry                             |
| `location_state` | per-location mutable state, e.g. which trants are recovering |

Inventory and skills are JSONB because they are document-shaped: always read and written whole with
the player, never queried across rows. Plain SQL migrations, applied in filename order — at three
tables, readable SQL beats a generated migration toolchain.

Players are flushed on a 5-second timer while active and synchronously on disconnect, so a crash
costs at most one interval.

## Constraints worth knowing before you edit

- **No TypeScript parameter properties.** The server runs directly under
  `node --experimental-strip-types` with no build step, and strip-only mode rejects them. Write
  explicit fields. (Same applies to `enum` and namespaces.)
- **Relative imports carry `.ts` extensions**, so Node can resolve them directly; `tsc` rewrites them
  to `.js` on emit via `rewriteRelativeImportExtensions`.
- **TypeScript is pinned to 6.x**, not 7. `typescript-eslint` does not yet support TS 7, and losing
  lint is a worse trade than losing the newest compiler.
