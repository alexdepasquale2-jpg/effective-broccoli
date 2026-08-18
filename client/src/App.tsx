import { useEffect, useMemo, useState } from "react";
import { api, type Task, type TaskStatus } from "./api.ts";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "done", label: "Done" },
];

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: "in_progress",
  in_progress: "done",
  done: null,
};

const PREV_STATUS: Record<TaskStatus, TaskStatus | null> = {
  todo: null,
  in_progress: "todo",
  done: "in_progress",
};

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listTasks()
      .then(setTasks)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) groups[task.status].push(task);
    return groups;
  }, [tasks]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const created = await api.createTask(trimmed);
      setTasks((prev) => [...prev, created]);
      setTitle("");
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function move(task: Task, status: TaskStatus) {
    try {
      const updated = await api.updateTask(task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(task: Task) {
    try {
      await api.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Task Board</h1>
        <p>A tiny full-stack demo — React + Vite talking to an Express API.</p>
      </header>

      <form className="composer" onSubmit={addTask}>
        <input
          className="composer__input"
          placeholder="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="New task title"
        />
        <button className="composer__button" type="submit">
          Add task
        </button>
      </form>

      {error && <div className="banner banner--error">{error}</div>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="board">
          {COLUMNS.map(({ status, label }) => (
            <section className="column" key={status}>
              <h2 className="column__title">
                {label}
                <span className="column__count">{byStatus[status].length}</span>
              </h2>
              <ul className="column__list">
                {byStatus[status].map((task) => (
                  <li className="card" key={task.id}>
                    <span className="card__title">{task.title}</span>
                    <div className="card__actions">
                      {PREV_STATUS[task.status] && (
                        <button
                          className="icon-button"
                          title="Move back"
                          onClick={() => move(task, PREV_STATUS[task.status]!)}
                        >
                          ←
                        </button>
                      )}
                      {NEXT_STATUS[task.status] && (
                        <button
                          className="icon-button"
                          title="Move forward"
                          onClick={() => move(task, NEXT_STATUS[task.status]!)}
                        >
                          →
                        </button>
                      )}
                      <button
                        className="icon-button icon-button--danger"
                        title="Delete"
                        onClick={() => remove(task)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
                {byStatus[status].length === 0 && (
                  <li className="card card--empty">No tasks</li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
