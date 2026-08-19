# Let It Pass

A quiet game about inaction.

Things arrive. Each one offers you something to do about it. You can act — or you can sit there and let it resolve on its own. The game keeps a ledger, and at the end it tells you how many of your interventions changed anything at all.

## The idea

Most of what asks for your attention does not need it. The game encodes that literally:

- Every event has two written outcomes: one if you act, one if you don't.
- For most events those outcomes are **identical**. Acting cost you Stillness and changed nothing.
- For some, acting actively made things **worse**.
- For a minority, acting genuinely **helped** — and skipping it is a real loss.

The tell is loudness. Loud, urgent, high-drama events almost never need you. The quiet ones — a friend gone silent, a body signal ignored, an apology owed — are where action is actually right. Inaction is the correct default, not a universal rule, and the game is won by learning the difference rather than by refusing to move.

## Playing

- **Do nothing.** Stillness accrues on its own, faster the longer you go untouched (up to ×3) and the deeper you are.
- **Tap an event card** to act on it. This always costs Stillness and resets your streak, whether or not it helped.
- **Let a card's window drain** to let it pass. This pays a bonus.
- **Depth** rises with Stillness: Restless → Idle → Settling → Still → Quiet → Deep → Vast → Nothing. Deeper depths breathe slower, pay more, and the world sends fewer events — it quiets down as you do.
- **DO SOMETHING** is a button that does nothing. It is there because you will want to press it. It is counted.
- **Ledger** shows the running tally at any time. **Stop** ends the session and shows the full accounting.

Reaching the depth called *Nothing* ends the session.

Progress persists in `localStorage`.

## Controls

Tap or click a card to act. Everything else is optional. `Esc` closes the ledger; `Enter` begins.

## Scripts

```bash
npm run dev      # Vite dev server
npm test         # Vitest suite
npm run build    # Production build into docs/
```

## Layout

- `src/game/events.js` — the event catalog and resolution rules (tested)
- `src/game/stillness.js` — accrual, depth thresholds, world pacing (tested)
- `src/game/ledger.js` — what you did and what it changed (tested)
- `src/game/storage.js` — persistence across sessions (tested)
- `src/game/game.js` — loop, canvas rendering, input
- `src/game/audio.js` — soft synthesized tones
