import { randomUUID } from "node:crypto";
import type { Task, TaskStatus } from "./types.js";

/**
 * Simple in-memory task store. Swappable for a real database later; the API
 * layer only depends on this interface, not on the storage mechanism.
 */
export class TaskStore {
  private tasks = new Map<string, Task>();

  list(): Task[] {
    return [...this.tasks.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0,
    );
  }

  get(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  create(title: string): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: randomUUID(),
      title: title.trim(),
      status: "todo",
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(
    id: string,
    changes: { title?: string; status?: TaskStatus },
  ): Task | undefined {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;

    const updated: Task = {
      ...existing,
      ...(changes.title !== undefined ? { title: changes.title.trim() } : {}),
      ...(changes.status !== undefined ? { status: changes.status } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this.tasks.delete(id);
  }

  seed(titles: string[]): void {
    for (const title of titles) {
      this.create(title);
    }
  }
}
