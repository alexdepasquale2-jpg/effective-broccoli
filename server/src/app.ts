import cors from "cors";
import express, { type Express } from "express";
import { TaskStore } from "./store.js";
import { isTaskStatus } from "./types.js";

export function createApp(store: TaskStore = new TaskStore()): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/tasks", (_req, res) => {
    res.json(store.list());
  });

  app.post("/api/tasks", (req, res) => {
    const title = req.body?.title;
    if (typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "title is required" });
    }
    const task = store.create(title);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { title, status } = req.body ?? {};

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return res.status(400).json({ error: "title must be a non-empty string" });
    }
    if (status !== undefined && !isTaskStatus(status)) {
      return res.status(400).json({ error: "status is invalid" });
    }

    const updated = store.update(req.params.id, { title, status });
    if (!updated) {
      return res.status(404).json({ error: "task not found" });
    }
    res.json(updated);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const removed = store.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "task not found" });
    }
    res.status(204).end();
  });

  return app;
}
