# Aether

A 2D mobile arcade game we can iterate on. You are a 4D entity (a tesseract and its 16-cell dual) projected into this plane. Drag to move, collect light orbs, and dodge dark shards.

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
- **Collect gold orbs** for points and combos
- **Avoid red shards**
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
- `src/game/utils.js` — collision, scoring, difficulty (tested)
- `src/game/audio.js` — tiny synthesized sound effects
- `src/game/storage.js` — local high score
