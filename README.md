# effective-broccoli

A small full-stack TypeScript task board used as a development-environment demo.

- **`server/`** — Express + TypeScript REST API for tasks (in-memory store), tested with Vitest + Supertest.
- **`client/`** — React + Vite + TypeScript single-page app that talks to the API.

## Requirements

- Node.js >= 20 (developed against Node 22)
- npm >= 10

## Getting started

```bash
npm ci          # install all workspace dependencies
npm run dev     # start API (:3001) and client (:5173) together
```

Then open http://localhost:5173. The Vite dev server proxies `/api` to the
Express server on port 3001.

## Scripts (run from the repo root)

| Command | Description |
| --- | --- |
| `npm run dev` | Run the API and client together (watch mode). |
| `npm run build` | Type-check and build both workspaces. |
| `npm test` | Run the server test suite (Vitest). |
| `npm run lint` | Lint all TypeScript with ESLint. |
| `npm run typecheck` | Type-check both workspaces without emitting. |
| `npm start` | Run the built API (`server/dist/index.js`). |

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check. |
| `GET` | `/api/tasks` | List tasks (oldest first). |
| `POST` | `/api/tasks` | Create a task (`{ "title": string }`). |
| `PATCH` | `/api/tasks/:id` | Update `title` and/or `status`. |
| `DELETE` | `/api/tasks/:id` | Delete a task. |

A task's `status` is one of `todo`, `in_progress`, or `done`.
