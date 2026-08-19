import { describe, expect, it } from "vitest";
import {
  THREADS,
  applyChoice,
  counterfactualEnding,
  createRun,
  currentBeat,
  endingFor,
  finishRun,
  needsYou,
  passOnlyPressure,
  threadById,
} from "./threads.js";

const NEEDS = ["pass", "tend", "act"];

describe("thread catalog", () => {
  it("gives every beat three written outcomes and a declared need", () => {
    for (const thread of THREADS) {
      expect(thread.beats.length).toBeGreaterThan(0);
      for (const beat of thread.beats) {
        expect(NEEDS).toContain(beat.need);
        expect(beat.pass.text.length).toBeGreaterThan(0);
        expect(beat.tend.text.length).toBeGreaterThan(0);
        expect(beat.act.text.length).toBeGreaterThan(0);
        expect(beat.tend.label.length).toBeGreaterThan(0);
        expect(beat.act.label.length).toBeGreaterThan(0);
        expect(beat.window).toBeGreaterThan(0);
      }
    }
  });

  it("gives every thread three ranked endings in ascending order", () => {
    for (const thread of THREADS) {
      expect(thread.endings.length).toBe(3);
      const ats = thread.endings.map((e) => e.at);
      expect([...ats].sort((a, b) => a - b)).toEqual(ats);
      expect(thread.endings.map((e) => e.rank)).toEqual([0, 1, 2]);
    }
  });

  it("keeps leaving things alone the single most common right answer", () => {
    const allBeats = THREADS.flatMap((t) => t.beats);
    const passBeats = allBeats.filter((b) => b.need === "pass").length;
    const actBeats = allBeats.filter((b) => b.need === "act").length;
    expect(passBeats / allBeats.length).toBeGreaterThan(0.5);
    expect(actBeats / allBeats.length).toBeLessThan(0.25);
  });

  it("has threads that are genuinely best left alone", () => {
    const leaveAlone = THREADS.filter((t) => !needsYou(t));
    expect(leaveAlone.length).toBeGreaterThanOrEqual(3);
    for (const thread of leaveAlone) {
      expect(thread.beats.every((b) => b.need === "pass")).toBe(true);
    }
  });

  it("includes a loud thread that really does need you, so loudness cannot be a rule", () => {
    const river = threadById("river-rises");
    expect(river.loud).toBe(true);
    expect(needsYou(river)).toBe(true);
    expect(counterfactualEnding(river).rank).toBe(2);
  });
});

describe("pressure and endings", () => {
  it("gives the best ending only for playing a thread exactly right", () => {
    const thread = threadById("quiet-brother");
    let run = createRun(thread, 1);
    for (const beat of thread.beats) {
      run = applyChoice(run, beat.need).run;
    }
    expect(run.done).toBe(true);
    expect(finishRun(run).ending.rank).toBe(0);
  });

  it("punishes over-reaching exactly as hard as under-responding", () => {
    const overReach = endingFor(threadById("inheritance"), passOnlyPressure(threadById("quiet-brother")));
    const underRespond = endingFor(threadById("quiet-brother"), passOnlyPressure(threadById("quiet-brother")));
    expect(overReach.rank).toBe(2);
    expect(underRespond.rank).toBe(2);
  });

  it("computes what would have happened had you never touched it", () => {
    const idle = threadById("inheritance");
    expect(passOnlyPressure(idle)).toBe(-6);
    expect(counterfactualEnding(idle).rank).toBe(0);
    expect(needsYou(idle)).toBe(false);
  });

  it("reports whether your hand actually changed the ending", () => {
    const thread = threadById("inheritance");
    let untouched = createRun(thread, 1);
    for (const beat of thread.beats) untouched = applyChoice(untouched, "pass").run;
    expect(finishRun(untouched).changed).toBe(false);

    let meddled = createRun(thread, 1);
    for (const _ of thread.beats) meddled = applyChoice(meddled, "act").run;
    const result = finishRun(meddled);
    expect(result.changed).toBe(true);
    expect(result.ending.rank).toBeGreaterThan(result.counterfactual.rank);
  });

  it("advances one beat at a time and reports the written outcome", () => {
    const thread = threadById("river-rises");
    const run = createRun(thread, 1);
    expect(currentBeat(run).need).toBe("pass");
    const { run: after, resolution } = applyChoice(run, "act");
    expect(after.beatIndex).toBe(1);
    expect(resolution.right).toBe(false);
    expect(resolution.text).toBe(thread.beats[0].act.text);
  });
});
