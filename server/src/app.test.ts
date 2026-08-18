import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { TaskStore } from "./store.js";

function makeApp() {
  return createApp(new TaskStore());
}

describe("task API", () => {
  it("reports health", async () => {
    const res = await request(makeApp()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("starts with no tasks", async () => {
    const res = await request(makeApp()).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("creates a task with default status todo", async () => {
    const app = makeApp();
    const res = await request(app).post("/api/tasks").send({ title: "Write docs" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Write docs", status: "todo" });
    expect(res.body.id).toBeTruthy();
  });

  it("rejects an empty title", async () => {
    const res = await request(makeApp()).post("/api/tasks").send({ title: "   " });
    expect(res.status).toBe(400);
  });

  it("updates a task status", async () => {
    const app = makeApp();
    const created = await request(app).post("/api/tasks").send({ title: "Ship it" });
    const id = created.body.id;

    const patched = await request(app)
      .patch(`/api/tasks/${id}`)
      .send({ status: "in_progress" });
    expect(patched.status).toBe(200);
    expect(patched.body.status).toBe("in_progress");
  });

  it("rejects an invalid status", async () => {
    const app = makeApp();
    const created = await request(app).post("/api/tasks").send({ title: "Task" });
    const res = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ status: "nope" });
    expect(res.status).toBe(400);
  });

  it("deletes a task", async () => {
    const app = makeApp();
    const created = await request(app).post("/api/tasks").send({ title: "Temp" });
    const del = await request(app).delete(`/api/tasks/${created.body.id}`);
    expect(del.status).toBe(204);

    const after = await request(app).get("/api/tasks");
    expect(after.body).toEqual([]);
  });

  it("returns 404 for a missing task", async () => {
    const res = await request(makeApp())
      .patch("/api/tasks/does-not-exist")
      .send({ status: "done" });
    expect(res.status).toBe(404);
  });
});
