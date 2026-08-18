import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { nextRank, rankFor } from '@/content';

const KEY = 'rm-field-progress-v1';

export type FieldReport = {
  id: string;
  at: number;
  text: string;
  felt: number;
  source: 'drill' | 'survival' | 'manual' | 'free';
  sourceId?: string;
};

export type DailyId = 'body' | 'craft' | 'human';

type Persist = {
  onboarded: boolean;
  callsign: string;
  freezeId: string;
  xp: number;
  streak: number;
  lastActiveDay: string;
  read: Record<string, number>;
  stamped: Record<string, boolean>;
  drillsDone: Record<string, number>;
  protocols: Record<string, number>;
  reports: FieldReport[];
  daily: { day: string; checks: DailyId[] };
  bookmarks: string[];
  lastEntryId: string;
};

const empty: Persist = {
  onboarded: false,
  callsign: '',
  freezeId: 'cant-start',
  xp: 0,
  streak: 0,
  lastActiveDay: '',
  read: {},
  stamped: {},
  drillsDone: {},
  protocols: {},
  reports: [],
  daily: { day: '', checks: [] },
  bookmarks: [],
  lastEntryId: 'the-brief',
};

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function yesterdayKey(d = new Date()) {
  const x = new Date(d);
  x.setDate(x.getDate() - 1);
  return todayKey(x);
}

type Ctx = Persist & {
  hydrated: boolean;
  completeOnboarding: (callsign: string, freezeId: string) => void;
  markRead: (id: string) => void;
  stamp: (id: string) => void;
  completeDrill: (id: string, note: string, felt: number) => void;
  completeProtocol: (id: string) => void;
  addReport: (text: string, felt: number, source?: FieldReport['source'], sourceId?: string) => void;
  toggleDaily: (id: DailyId) => void;
  toggleBookmark: (id: string) => void;
  setLastEntry: (id: string) => void;
  resetAll: () => void;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<Persist>(empty);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = { ...empty, ...JSON.parse(raw) } as Persist;
          const day = todayKey();
          if (parsed.daily.day !== day) {
            parsed.daily = { day, checks: [] };
          }
          setState(parsed);
        } else {
          setState({ ...empty, daily: { day: todayKey(), checks: [] } });
        }
      } catch {
        setState({ ...empty, daily: { day: todayKey(), checks: [] } });
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const commit = useCallback((updater: (prev: Persist) => Persist) => {
    setState((prev) => {
      const day = todayKey();
      let base = prev;
      if (base.daily.day !== day) {
        base = { ...base, daily: { day, checks: [] } };
      }
      let next = updater(base);
      if (next.lastActiveDay !== day) {
        const streak =
          next.lastActiveDay === yesterdayKey() ? next.streak + 1 : next.lastActiveDay === day ? next.streak : 1;
        next = { ...next, lastActiveDay: day, streak: Math.max(1, streak) };
      }
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(
    (callsign: string, freezeId: string) => {
      commit((p) => ({
        ...p,
        onboarded: true,
        callsign: callsign.trim() || 'OPERATOR',
        freezeId,
        xp: p.xp + 15,
        lastEntryId: 'the-brief',
      }));
    },
    [commit],
  );

  const markRead = useCallback(
    (id: string) => {
      commit((p) => {
        if (p.read[id]) return p.lastEntryId === id ? p : { ...p, lastEntryId: id };
        return { ...p, read: { ...p.read, [id]: Date.now() }, xp: p.xp + 8, lastEntryId: id };
      });
    },
    [commit],
  );

  const stamp = useCallback(
    (id: string) => {
      commit((p) => {
        if (p.stamped[id]) return p;
        return { ...p, stamped: { ...p.stamped, [id]: true }, xp: p.xp + 10 };
      });
    },
    [commit],
  );

  const addReport = useCallback(
    (text: string, felt: number, source: FieldReport['source'] = 'free', sourceId?: string) => {
      const report: FieldReport = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: Date.now(),
        text: text.trim(),
        felt,
        source,
        sourceId,
      };
      commit((p) => ({ ...p, reports: [report, ...p.reports].slice(0, 80), xp: p.xp + 12 }));
    },
    [commit],
  );

  const completeDrill = useCallback(
    (id: string, note: string, felt: number) => {
      commit((p) => {
        const reports: FieldReport[] = note.trim()
          ? [
              {
                id: `${Date.now()}-d`,
                at: Date.now(),
                text: note.trim(),
                felt,
                source: 'drill' as const,
                sourceId: id,
              },
              ...p.reports,
            ].slice(0, 80)
          : p.reports;
        const first = !p.drillsDone[id];
        return {
          ...p,
          drillsDone: { ...p.drillsDone, [id]: (p.drillsDone[id] ?? 0) + 1 },
          reports,
          xp: p.xp + (first ? 22 : 10) + (note.trim() ? 12 : 0),
        };
      });
    },
    [commit],
  );

  const completeProtocol = useCallback(
    (id: string) => {
      commit((p) => {
        if (p.protocols[id]) return p;
        return { ...p, protocols: { ...p.protocols, [id]: Date.now() }, xp: p.xp + 18 };
      });
    },
    [commit],
  );

  const toggleDaily = useCallback(
    (id: DailyId) => {
      commit((p) => {
        const has = p.daily.checks.includes(id);
        const checks = has ? p.daily.checks.filter((x) => x !== id) : [...p.daily.checks, id];
        return {
          ...p,
          daily: { ...p.daily, checks },
          xp: has ? p.xp : p.xp + 6,
        };
      });
    },
    [commit],
  );

  const toggleBookmark = useCallback(
    (id: string) => {
      commit((p) => ({
        ...p,
        bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter((x) => x !== id) : [...p.bookmarks, id],
      }));
    },
    [commit],
  );

  const setLastEntry = useCallback(
    (id: string) => {
      commit((p) => ({ ...p, lastEntryId: id }));
    },
    [commit],
  );

  const resetAll = useCallback(() => {
    const next = { ...empty, daily: { day: todayKey(), checks: [] } };
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      hydrated,
      completeOnboarding,
      markRead,
      stamp,
      completeDrill,
      completeProtocol,
      addReport,
      toggleDaily,
      toggleBookmark,
      setLastEntry,
      resetAll,
    }),
    [
      state,
      hydrated,
      completeOnboarding,
      markRead,
      stamp,
      completeDrill,
      completeProtocol,
      addReport,
      toggleDaily,
      toggleBookmark,
      setLastEntry,
      resetAll,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress outside provider');
  return ctx;
}

export function useRank() {
  const { xp } = useProgress();
  return { rank: rankFor(xp), next: nextRank(xp), xp };
}
