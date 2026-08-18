import { describe, expect, it } from "vitest";
import { BLOCKS, getBlock } from "./blocks";
import { PROTOCOLS, getProtocol, protocolDurationSeconds } from "./protocols";
import { drawForcedHand, formatForcedHand, mulberry32, seedFromString } from "./forcedHand";
import { drawConstraint, drawConstraints } from "./constraints";
import { CONSTRAINTS, DEFAULT_VERBS } from "./banks";
import {
  answerStep,
  completeSession,
  createSession,
  filledStepCount,
  goToStep,
  isProtocolComplete,
  sessionTitle,
  startProtocol,
} from "./session";
import { sessionToMarkdown, slugify } from "./exportMarkdown";
import { deleteSession, emptyStore, parseStore, serializeStore, upsertSession } from "./storage";
import { METHOD_SECTIONS } from "./method";

describe("blocks and protocols", () => {
  it("maps every block to an existing protocol", () => {
    for (const block of BLOCKS) {
      expect(getBlock(block.id)?.protocolId).toBe(block.protocolId);
      expect(() => getProtocol(block.protocolId)).not.toThrow();
    }
  });

  it("keeps each protocol under about 15 minutes", () => {
    for (const protocol of PROTOCOLS) {
      const seconds = protocolDurationSeconds(protocol);
      expect(seconds).toBeGreaterThan(120);
      expect(seconds).toBeLessThanOrEqual(15 * 60);
      expect(protocol.steps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives emergency protocol a 4-minute envelope", () => {
    const emergency = getProtocol("emergency");
    expect(emergency.durationMin).toBe(4);
    expect(protocolDurationSeconds(emergency)).toBeLessThanOrEqual(5 * 60);
  });
});

describe("forced hand", () => {
  it("is deterministic for a given seed", () => {
    const a = drawForcedHand({ seed: "ash-harbor" });
    const b = drawForcedHand({ seed: "ash-harbor" });
    expect(a).toEqual(b);
    expect(formatForcedHand(a).split("\n")).toHaveLength(6);
  });

  it("prefers the session's verbs", () => {
    const hand = drawForcedHand({ seed: 42, preferredVerbs: ["ladle", "stamp"] });
    expect(["ladle", "stamp"]).toContain(hand.verb);
  });

  it("seedFromString is stable", () => {
    expect(seedFromString("desk")).toBe(seedFromString("desk"));
    expect(seedFromString("desk")).not.toBe(seedFromString("table"));
    const rand = mulberry32(1);
    expect(rand()).toBeGreaterThanOrEqual(0);
    expect(rand()).toBeLessThan(1);
  });
});

describe("constraints", () => {
  it("avoids already drawn cards when possible", () => {
    const first = drawConstraint("alpha");
    const second = drawConstraint("alpha:1", [first]);
    expect(CONSTRAINTS).toContain(first);
    expect(second).not.toBe(first);
  });

  it("draws a unique set", () => {
    const drawn = drawConstraints(5, "batch");
    expect(new Set(drawn).size).toBe(5);
  });
});

describe("session flow", () => {
  it("starts a protocol with a forced hand and tracks answers", () => {
    const session = startProtocol(createSession({ id: "s1" }), "first-pressure", "blank");
    expect(session.protocolId).toBe("first-pressure");
    expect(session.blockId).toBe("blank");
    expect(session.forcedHand).not.toBeNull();
    expect(sessionTitle(session)).toBe("The blank table");

    const protocol = getProtocol("first-pressure");
    let current = session;
    for (const step of protocol.steps) {
      current = answerStep(current, step.id, `note for ${step.id}`);
    }
    expect(isProtocolComplete(current)).toBe(true);
    expect(filledStepCount(current)).toBe(protocol.steps.length);

    const last = goToStep(current, 99);
    expect(last.stepIndex).toBe(protocol.steps.length - 1);
    expect(completeSession(last).completedAt).toBeTruthy();
  });

  it("uses the working title when present", () => {
    const session = createSession({
      context: {
        title: "Ash Harbor",
        fantasy: "",
        verbs: ["bribe"],
        alreadyTrue: "",
        stuckSentence: "",
      },
    });
    expect(sessionTitle(session)).toBe("Ash Harbor");
  });
});

describe("markdown export", () => {
  it("includes protocol answers and forced hand", () => {
    let session = startProtocol(
      createSession({
        id: "export-1",
        context: {
          title: "Ash Harbor",
          fantasy: "worse ideas",
          verbs: ["bribe", "dive"],
          alreadyTrue: "The city floods on purpose.",
          stuckSentence: "I keep adding continents.",
        },
      }),
      "emergency",
      "blank",
    );
    session = answerStep(session, "accept-hand", "Customs office, keep the tide.");
    const md = sessionToMarkdown(session);
    expect(md).toContain("# Beat card — Ash Harbor");
    expect(md).toContain("Emergency Four");
    expect(md).toContain("worse ideas");
    expect(md).toContain("Customs office");
    expect(md).toContain("_unanswered_");
    expect(slugify("Ash Harbor")).toBe("ash-harbor");
    expect(slugify("???")).toBe("beat-card");
  });
});

describe("storage", () => {
  it("round-trips sessions and deletes by id", () => {
    const session = createSession({ id: "keep" });
    const other = createSession({ id: "drop" });
    let store = upsertSession(emptyStore(), session);
    store = upsertSession(store, other);
    const raw = serializeStore(store);
    let loaded = parseStore(raw);
    expect(loaded.sessions).toHaveLength(2);
    loaded = deleteSession(loaded, "drop");
    expect(loaded.sessions.map((item) => item.id)).toEqual(["keep"]);
    expect(parseStore("not-json").sessions).toHaveLength(0);
    expect(parseStore(null).sessions).toHaveLength(0);
  });
});

describe("method copy", () => {
  it("documents the four principles and diagnoses", () => {
    const text = METHOD_SECTIONS.map((section) => section.body).join("\n");
    expect(text).toMatch(/Play before plot/i);
    expect(text).toMatch(/Verb Tax/);
    expect(text).toContain("Forced Hand");
    expect(DEFAULT_VERBS.length).toBeGreaterThan(10);
  });
});
