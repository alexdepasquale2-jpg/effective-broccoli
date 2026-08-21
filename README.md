# Mobile Game Starter

A playable [Phaser](https://phaser.io/) starter you can run in a browser in about a minute. It is based on the official [`phaserjs/template-vite-ts`](https://github.com/phaserjs/template-vite-ts) template (Phaser 4 + Vite + TypeScript), with mobile-web defaults: responsive scaling, multi-touch, and an installable PWA shell.

Tap through Main Menu → Game → Game Over, then replace the scenes in `src/game/scenes` with your own game.

![screenshot](screenshot.png)

## Run it

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080). On a phone, use the same URL on your network, or install it to the home screen from the browser share sheet.

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server with hot reload on port 8080 |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Serve the production build on port 8080 |

## Why this starter

Native Unity / Godot / Xcode projects need heavy SDKs. This one is a **mobile web game**: the same code runs in desktop Chrome, Safari on iPhone, and Chrome on Android. When you want app-store builds, wrap `dist/` with [Capacitor](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor).

## Project layout

| Path | Description |
|------|-------------|
| `index.html` | Page that hosts the game canvas |
| `public/assets` | Sprites and other files Phaser loads at runtime |
| `public/manifest.webmanifest` | Add-to-home-screen metadata |
| `src/main.ts` | Bootstraps the Phaser game |
| `src/game/main.ts` | Game config (size, scale, scenes) |
| `src/game/scenes` | `Boot`, `Preloader`, `MainMenu`, `Game`, `GameOver` |

Edit files under `src/` while `npm run dev` is running. Vite reloads the browser automatically.

## Optional: native iOS / Android

After `npm run build`:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Mobile Game Starter" com.example.mobilestarter --web-dir dist
npx cap add ios      # needs macOS + Xcode
npx cap add android  # needs Android Studio
npx cap sync
```

## License

MIT. Template copyright [Phaser Studio](https://phaser.io/). See `LICENSE`.
