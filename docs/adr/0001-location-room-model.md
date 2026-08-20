# ADR 0001: Authoritative location rooms

**Status:** accepted · **Date:** 2026-08-20

## Context

The server needs a concurrency and ownership model for world state. The usual options for a 2D
multiplayer game are a single global simulation, a spatial grid with interest management, or discrete
scene-scoped rooms.

Glitch's own world is already a graph of discrete **locations** — streets you travel between, not a
continuous space you roam. Players in one street can neither see nor affect another.

The project is also solo and needs to run on one small VPS, while not foreclosing on the concept's
"improved server infrastructure" goal.

## Decision

Model each location as an authoritative in-memory `LocationRoom` that:

- owns its occupants and mutable entity state,
- runs a fixed 20 Hz tick and broadcasts deltas to its occupants,
- hydrates from Postgres on first entry and is dropped when empty,
- and **shares no mutable state with any other room**.

## Consequences

**Good**

- Matches the domain exactly, so no impedance mismatch between world design and runtime.
- Concurrency is trivially safe: one room, one owner, no cross-room references.
- Idle locations cost nothing — an empty world is an empty process.
- Sharding rooms across processes later is _additive_: put a directory service in front and move
  rooms. No room logic changes, because no room ever reached into another.
- Straightforward to test: a room can be constructed with injected clocks and RNG.

**Bad**

- Anything genuinely global — a world-wide market, cross-location chat — needs a mechanism this model
  does not provide. Acceptable: none of it is in v1, and it wants a message bus rather than shared
  memory when it arrives.
- Every occupant currently receives every actor each tick. Fine for a street; needs interest
  management before a crowd.
- A room's state lives in memory between flushes, so a hard crash loses up to one flush interval
  (5 seconds).

## Alternatives rejected

- **Single global simulation** — simpler at first, but couples every location's performance to every
  other and has no sharding story at all.
- **Spatial grid with interest management** — the right answer for a continuous world. Glitch's world
  is not continuous, so this would be paying for generality the game does not use.
