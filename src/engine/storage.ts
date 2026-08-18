import { createSession } from "./session";
import type { AppStore, Session } from "../types";

export const STORAGE_KEY = "next-beat.sessions.v1";

export function emptyStore(): AppStore {
  return { sessions: [], activeId: null };
}

export function serializeStore(store: AppStore): string {
  return JSON.stringify(store);
}

export function parseStore(raw: string | null): AppStore {
  if (!raw) {
    return emptyStore();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppStore>;
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.map((session) => createSession(session as Session))
      : [];
    const activeId =
      typeof parsed.activeId === "string" && sessions.some((session) => session.id === parsed.activeId)
        ? parsed.activeId
        : sessions[0]?.id ?? null;
    return { sessions, activeId };
  } catch {
    return emptyStore();
  }
}

export function loadStore(): AppStore {
  if (typeof localStorage === "undefined") {
    return emptyStore();
  }
  return parseStore(localStorage.getItem(STORAGE_KEY));
}

export function saveStore(store: AppStore): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, serializeStore(store));
}

export function upsertSession(store: AppStore, session: Session): AppStore {
  const index = store.sessions.findIndex((item) => item.id === session.id);
  const sessions = [...store.sessions];
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  return { sessions, activeId: session.id };
}

export function deleteSession(store: AppStore, id: string): AppStore {
  const sessions = store.sessions.filter((session) => session.id !== id);
  const activeId = store.activeId === id ? (sessions[0]?.id ?? null) : store.activeId;
  return { sessions, activeId };
}
