# Warm War 2026

A turn-based hybrid strategy game: **Russia · Europe · 2026**. You command either the European Coalition or the Russian Federation. The fight is for grids, narratives, pipelines, and the nerve of governments. Win the continent **without** lighting the match.

This is a strategy game, not a forecast.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). Works in a desktop or phone browser.

## How to play

Each season you have **3 operations**. Tap a theater, then an action:

| Action | What it does |
|--------|----------------|
| SHAPE | Influence campaign. Shifts a theater toward you. |
| GRID | Energy. Europe stocks LNG; Russia squeezes exports. |
| NET | Cyber. Moves the map, raises Heat, may cut enemy AP. |
| HOLD | Harden a theater against the next season of pressure. |
| POSTURE | Limited force. Strong map effect, sharp Heat spike. |
| TALK | Back-channel. Lowers Heat. |

**Win:** control 8 of 13 theaters (lean past ±22).  
**Lose together:** Heat hits 100 — the warm war goes hot.  
**Clock:** 8 seasons, Winter 2026 through Autumn 2027. Most theaters wins.

Starting map: Europe holds the west; Russia holds Belarus, Western Russia, and the Black Sea; Baltics, Central Europe, Italy, Balkans, and Ukraine are contested.

## Stack

Phaser 4 + Vite + TypeScript. Same code on desktop Chrome and a phone home screen. Optional later: wrap `dist/` with Capacitor for store builds.
