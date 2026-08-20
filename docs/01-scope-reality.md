# Scope and reality

The [concept](00-concept.md) describes a 21–33 month, four-phase build with guilds, player-created
quests, a player economy, mobile clients, seasonal events, and auto-scaling infrastructure.

Costed honestly, that is somewhere around 15–25 person-years. This is a solo project built on
evenings and weekends. The two numbers do not meet, and pretending otherwise is how revival projects
die: eighteen months of engine work, nothing playable, and then the tab closes.

So the concept stays as the destination, and the work is re-sequenced around one rule:

> **Something playable by week ten, and never not-playable again.**

## What that means in practice

Build the thinnest slice that touches every system, get it genuinely working, and only then widen it.
The slice is:

> Sign in → spawn in a street → walk and jump → click a trant → harvest → item in your pack → skill
> XP → it all persists → and someone else sees you do it.

That single loop exercises auth, persistence, real-time networking, the content pipeline, rendering,
inventory, skills, and multiplayer presence. **Everything else in the concept is an elaboration of
one of those seven axes**, which is what makes it the right slice rather than an arbitrary one.

That slice is now built and working. See [`20-roadmap.md`](20-roadmap.md) for what follows.

## The thing that makes this feasible at all

Tiny Speck released Glitch's art _and its complete server-side game code_ into the public domain
under CC0. The code release is the part people tend to overlook. `glitch-GameServerJS` is not a
skeleton — it is the shipped game: **1,288 item definitions, 106 skills with their full prerequisite
graph, 448 quests, 665 achievements**, and every line of dialogue.

For a solo developer that changes the economics completely. The single largest cost in an MMO is
content design, and here it already exists, already balanced, already play-tested by a real
player base. It is not a starting point — it is the finished article.

So the plan treats it as a **content database**, not as code to run. `packages/dataforge` imports it
into modern validated JSON in about three seconds. See [`11-data-pipeline.md`](11-data-pipeline.md).

## Deliberate deviations from the concept

Four, each a considered decision rather than an oversight.

### 1. We do not fork the original codebase

The concept's Phase 1 says "set up development environment with the Glitch source code." The live
community server (`ElevenGiants/eleven-server`, MIT) targets **Node 6 and Python 2.7** — both about a
decade past end-of-life — and carries a Rhino-era GSJS preprocessor.

Modernising that is more work than writing a clean TypeScript engine that consumes the same CC0 data,
and it inherits maintenance debt permanently. **We take the data, not the runtime.**

### 2. One server, not auto-scaling cloud

A solo hobby MMO peaking at perhaps thirty concurrent players needs one small VPS and one Postgres
instance. Auto-scaling is cost and operational complexity bought against traffic that will not
arrive for a year, if ever.

This is not a dead end: the [location-room architecture](10-architecture.md) shards cleanly across
processes whenever it needs to. The door is open; we just are not paying rent on it yet.

### 3. Free, with no store

The concept specifies free-to-play with cosmetic purchases. Taking money means payment processing,
sales-tax nexus, refunds, chargebacks, a store UI, and an implied support obligation — a real burden
on a hobby project, and it changes what the project _is_.

v1 ships free. Donations if people insist. Revisit only if a genuine population shows up.

### 4. No art import yet

The ~10,000 CC0 art assets are a separate, large download and an atlas-packing pipeline. The slice
renders procedurally — coloured shapes — which is enough to prove the loop. Art lands in M2, and
because the renderer is already built around named layers and entity kinds, it touches one file.

## Cut from v1

Parked in [`90-backlog.md`](90-backlog.md), not abandoned:

mobile clients · guild framework · player-created quest tools · seasonal calendar events ·
player-to-player economy and markets · player housing and construction · creature relationships ·
NPC dialogue · auto-scaling · monetisation

Every one of these is a multi-month system whose payoff requires a player population that will not
exist for at least a year. Building them first is building for users who are not there.
