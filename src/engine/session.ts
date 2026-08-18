import { BLOCKS } from "./blocks";
import { getProtocol } from "./protocols";
import type { BlockId, GameContext, ProtocolId, Session } from "../types";
import { drawForcedHand } from "./forcedHand";

export const emptyContext = (): GameContext => ({
  title: "",
  fantasy: "",
  verbs: [],
  alreadyTrue: "",
  stuckSentence: "",
});

export function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `beat-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function createSession(partial?: Partial<Session>): Session {
  const now = new Date().toISOString();
  return {
    id: partial?.id ?? createSessionId(),
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    completedAt: partial?.completedAt ?? null,
    context: partial?.context ?? emptyContext(),
    blockId: partial?.blockId ?? null,
    protocolId: partial?.protocolId ?? null,
    answers: partial?.answers ?? {},
    constraints: partial?.constraints ?? [],
    forcedHand: partial?.forcedHand ?? null,
    stepIndex: partial?.stepIndex ?? 0,
  };
}

export function startProtocol(session: Session, protocolId: ProtocolId, blockId: BlockId | null): Session {
  getProtocol(protocolId);
  const now = new Date().toISOString();
  return {
    ...session,
    protocolId,
    blockId,
    stepIndex: 0,
    completedAt: null,
    updatedAt: now,
    forcedHand:
      session.forcedHand ??
      drawForcedHand({
        seed: `${session.id}:${protocolId}`,
        preferredVerbs: session.context.verbs,
      }),
    answers: { ...session.answers },
    constraints: [...session.constraints],
  };
}

export function answerStep(session: Session, stepId: string, value: string): Session {
  return {
    ...session,
    answers: { ...session.answers, [stepId]: value },
    updatedAt: new Date().toISOString(),
  };
}

export function goToStep(session: Session, index: number): Session {
  if (!session.protocolId) {
    return session;
  }
  const protocol = getProtocol(session.protocolId);
  const stepIndex = Math.max(0, Math.min(index, protocol.steps.length - 1));
  return { ...session, stepIndex, updatedAt: new Date().toISOString() };
}

export function completeSession(session: Session): Session {
  const now = new Date().toISOString();
  return { ...session, completedAt: now, updatedAt: now };
}

export function sessionTitle(session: Session): string {
  const named = session.context.title.trim();
  if (named) {
    return named;
  }
  const block = BLOCKS.find((item) => item.id === session.blockId);
  if (block) {
    return block.title;
  }
  if (session.protocolId) {
    return getProtocol(session.protocolId).name;
  }
  return "Untitled session";
}

export function isProtocolComplete(session: Session): boolean {
  if (!session.protocolId) {
    return false;
  }
  const protocol = getProtocol(session.protocolId);
  return protocol.steps.every((step) => (session.answers[step.id] ?? "").trim().length > 0);
}

export function filledStepCount(session: Session): number {
  if (!session.protocolId) {
    return 0;
  }
  const protocol = getProtocol(session.protocolId);
  return protocol.steps.filter((step) => (session.answers[step.id] ?? "").trim().length > 0).length;
}
