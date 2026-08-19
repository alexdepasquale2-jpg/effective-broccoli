# Sector Command

Grid-based sector defence — a dependency-free foundation for a web-based
mobile game. Plain ES modules, canvas 2D, no build step: open it on a phone
and it plays.

Hostile contacts drop into sectors on a fuse. Tap a sector to strike it before
the fuse runs out; allied convoys share the board and clear on their own, so
firing on one costs you. A weapon cooldown between strikes is what turns the
board into a decision — which sector gets the next shot — rather than a race
to tap everything.

The game is deliberately small; it exists to exercise every part of the
foundation so you can replace it with your own and keep the plumbing.

## Running it

ES modules need a real server — `file://` will not work.

```bash
npx http-server -p 8080 -c-1 .   # or: python3 -m http.server 8080
```

Then open `http://localhost:8080`. To try it on a phone on the same network,
use your machine's LAN IP. Chrome DevTools device emulation covers most of it,
but tap targets and safe-area insets are worth checking on real hardware.

## Controls

| | |
|---|---|
| Touch | Tap a sector to strike it |
| Desktop | Arrows or WASD to aim, Space/Enter to fire |

## What's in the box

```
index.html            markup + DOM overlay (HUD, briefing, debrief)
css/style.css         full-viewport mobile shell, tactical theme
sw.js                 cache-first service worker (offline play)
manifest.webmanifest  installable to the home screen
src/
  main.js             entry point: builds context, wires buttons, starts loop
  ui.js               HUD readouts and panel visibility
  engine/
    viewport.js       canvas sizing, DPR, design-unit coordinate system
    loop.js           fixed-timestep update + decoupled render
    input.js          pointer + keyboard, normalised and polled
    scene.js          scene registry and deferred switching
    audio.js          synthesised WebAudio blips, gesture-unlocked
    storage.js        localStorage with graceful failure
  game/
    config.js         all gameplay tuning values
    grid.js           sector geometry, hit testing, callsigns, board drawing
    contacts.js       pooled contacts + strike effects
    background.js     tactical map backdrop with radar sweep
  scenes/
    menu.js  play.js  gameover.js
```

## The parts that matter on mobile

**Design units.** Everything draws in a coordinate space ~360 units wide.
`Viewport` maps that to the device, handling DPR and the notch. Both
`viewport.width` and `viewport.height` vary with the screen, so read them each
frame rather than caching — a rotation changes both, and `Grid.layout()` is
re-run every frame for exactly that reason.

**The board is measured against the real HUD.** The HUD is DOM, so its height
in design units differs on every screen size; a constant top inset overlaps it
on small phones. The play scene asks `ui.hudBottomPx` for the measured value
and converts it through `viewport.scale`. That measurement is taken on demand
and cached, never per frame — reading layout every frame would thrash.

**Fixed timestep.** `update(dt)` always gets 1/60s, so behaviour is identical
on 60Hz and 120Hz displays. Rendering is decoupled and receives an
interpolation alpha. The loop stops when the tab is hidden and never simulates
more than 0.25s in one go, so a backgrounded tab doesn't resume with every fuse
already expired.

**Polled input.** Touch, mouse and keyboard collapse into one state object read
during update, which keeps input in step with the fixed timestep. Two
edge-triggered reads exist because a press can begin and end between updates:
`consumeTap()` for pointers and `consumeKey(key)` for the keyboard. Both clear
on read, so one press drives exactly one strike.

**DOM for UI, canvas for the game.** The HUD, briefing and debrief are real
elements: sharp text at any DPR, proper tap targets, accessible for free, and
no per-frame redraw. The overlay is `pointer-events: none` except on controls,
so taps pass through to the board.

**No per-frame allocation.** Contacts, rings and sparks come from fixed-size
pools. Allocating hundreds of short-lived objects a minute is what produces
visible GC hitches on a mid-range phone.

## Making it your game

1. Tune first: grid size, drop rate, fuse length, friendly ratio, cooldown and
   scoring all live in `src/game/config.js`. Difficulty is a pure function of
   score, so the ramp is reproducible.
2. Replace the scenes in `src/scenes/`. A scene is any object with optional
   `enter`, `exit`, `update(dt, ctx)` and `render(ctx2d, ctx, alpha)` methods;
   register it in `main.js` with `scenes.add(name, scene)` and switch with
   `ctx.scenes.go(name, params)` (switching is deferred to the end of the
   frame, so calling it from inside `update` is safe).
3. `ctx` carries the shared services — `viewport`, `input`, `audio`, `ui`,
   `background`, `scenes` — so scenes import no globals.
4. Add sounds by extending the `SOUNDS` table in `engine/audio.js`; they're
   synthesised, so there's nothing to load.
5. Bump `CACHE` in `sw.js` on every release and keep its `ASSETS` list in sync,
   or returning players get a stale mix of old and new files.

`window.game` exposes the live objects for poking at things from the console.

## Browser support

Anything with ES modules and canvas 2D: iOS Safari 14+, Chrome/Android 90+.
The service worker and `backdrop-filter` degrade quietly where missing.
