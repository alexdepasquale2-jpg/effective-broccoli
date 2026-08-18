# RETARDMAXX

Mobile field manual: an immersive encyclopedia and survival guide for **retardmaxxing** — the internet self-help doctrine of taking the next real action before your mind finishes building a perfect case for it.

The name is a shock wrapper from meme culture. This app is not a slur aimed at disabled people, not a dare to be reckless, and not a substitute for medical care. It is a working manual against analysis paralysis: read one page, stamp it by moving, leave.

## What’s inside

- **HQ** — rank, daily OS (body / craft / human), active freeze, continue reading
- **Encyclopedia** — six volumes (`FM-00`–`FM-05`) of field entries with stamp actions and cross-links
- **SOS** — ten interactive survival protocols that loop you if you pick the freeze, and clear you if you pick contact
- **Drills** — timed live-fire missions (10-second start, ugly four minutes, send imperfect, …)
- **Log** — field reports of what you actually did

Progress lives on-device (callsign, XP, stamps, streak, reports). No account.

## Run it

```bash
npm install
npx expo start
```

Then open iOS / Android (Expo Go) or press `w` for web. Portrait phone viewport is the intended surface.

```bash
npx expo start --web --port 8081
```

## Stack

Expo SDK 57, Expo Router, TypeScript, AsyncStorage. Content is local (`content/`).
