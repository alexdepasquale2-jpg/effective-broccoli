# Aether

A 2D mobile arcade roguelite. You are a 4D entity projected into this plane. Drag to move, **Fold** to swap ANA/KATA slices, collect orbs, and stack boons until the run goes feral.

The genre and name are placeholders — this is a playable foundation with touch-first controls, scoring, and a full game loop.

## Play

**On a phone:** localhost will not work. Open the live HTTPS play link the agent gives you (a `trycloudflare.com` URL while this session is running).

Tap **Play**, then drag to move. Collect gold orbs and avoid red shards.

**On a computer:**

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

A static build also lives in `docs/` if you later host it (GitHub Pages, Netlify, and similar).

- **Drag** to move
- **Fold** (tap the button, tap the screen, or press Space) to swap ANA/KATA. Opposite-color shards pass through you; red bulk shards are 4D-thick and still hit
- **Collect orbs** for points, combos, and a boon draft every few pickups
- Cyan = ANA, magenta = KATA, gold/red = bulk
- High score is saved on the device

Add it to the home screen from a mobile browser for a fullscreen, app-like feel.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm test` | Run unit tests for 4D math, scoring, collision, and difficulty |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build |

## Project layout

- `src/main.js` — boots the canvas and UI
- `src/game/game.js` — loop, spawning, drawing, input
- `src/game/hypercube.js` — 4D rotations, tesseract / 16-cell, projection (tested)
- `src/game/boons.js` — roguelite drafts, stacking cursed mods (tested)
- `src/game/slice.js` — ANA/KATA collision and scoring (tested)
- `src/game/utils.js` — collision, scoring, difficulty (tested)
- `src/game/audio.js` — tiny synthesized sound effects
- `src/game/storage.js` — local high score
