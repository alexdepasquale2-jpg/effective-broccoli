# Canon Lane

A mobile **idle MOBA clicker**. Champions carry **biblical names** and **Greek god domains**. Three lanes fight without you. Taps last-hit the wave. Every column — trees, tiers, champions, lanes, the shop, **and the GUI itself** — upgrades at a balanced rate.

The screen starts as an Atari cathode: two colors, square lanes, coin-slot type. The **Screen** tree paints the pantheon, adds walk cycles, marble, sparks, then silk — all the way to the **Perfect Game**.

Each upgrade **tier** holds **9,000 named blessings** (30 biblical prefixes × 30 Greek stems × 10 domains). Tiers themselves ascend with Glory. Levels stay; the multiplier grows.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). Portrait, tap-first, installable as a PWA.

```bash
npm test
npm run build
```

**Warm War 2026** still lives in this repo: [http://localhost:8080/?game=war](http://localhost:8080/?game=war), or the title-screen button.

**Hosted build:** [https://alexdepasquale2-jpg.github.io/effective-broccoli/](https://alexdepasquale2-jpg.github.io/effective-broccoli/)

## How to play

1. Tap a lane. Damage the nearest foe. Last-hits gleam extra gold.
2. The match idles: minions, towers, your champion, jungle camps.
3. Spend gold on a **tree** (Strike, Fury, Harvest…). Each level is a unique blessing.
4. Win the enemy nexus for **Glory**. Spend Glory to **raise the tier** of any column.
5. Open **SCREEN**. Buy the GUI. At **16-BIT / TEMPLE** the shop becomes a cockpit — every tree, lane, and champion on one glass.
6. Unlock the roster. Field David as Apollo, Ruth as Demeter, Moses as Zeus…
7. Turn on **AUTO** when you pocket the phone. Offline gains cap at eight hours.

| Column | What it grows |
|--------|----------------|
| Strike / Fury / Fate | Tap damage, idle DPS, crits |
| Aegis / Wave / Siege | Champion, minions, towers |
| Harvest / Wilds / Idle | Gold, camps, offline |
| Omen / Relic / Nexus | Lane burst, global multiplier, match spoils |
| Screen | The GUI itself — Atari cathode to a high-tech cockpit, then the Perfect Game |
| Echo / Tempo / Focus / Chorus | Aftershock taps, faster waves, last-hit window, extra minions |
| Lanes / Roster / Meta | Corridor focus, champions, shop lens / rite / sight |

Costs are geometric (`×1.07` per level) with milestone multipliers every 25 / 100 / 1000 / 9,000 so the next buy stays in a reasonable grind band. Bulk `x1 / x10 / x100 / x1000 / MAX`. Tactile feedback: press squash, floating numbers, Web Audio blips, and `navigator.vibrate` patterns that deepen with the haptic rite.

Progress saves in `localStorage`.

## Stack

Phaser 4 + Vite + TypeScript. Simulation lives in `src/canon-lane/sim/` and is covered by `node:test`.

## Also in this repository

**Warm War 2026** — turn-based hybrid strategy, Russia · Europe · 2026. Launch with `?game=war`.

[`zhaelim/`](zhaelim/README.md) — **Zha'elim**, a hex-lattice timing puzzle with an invented language. No build step:

```bash
node zhaelim/serve.mjs
```
