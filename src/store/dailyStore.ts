import { create } from "zustand";
import { persist } from "zustand/middleware";

type DailyState = {
  completedDates: Record<string, true>; // YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  markCompleted: (dateKey: string) => void;
  isCompleted: (dateKey: string) => boolean;
  resetAll: () => void;
};

function diffDays(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      completedDates: {},
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,

      markCompleted: (dateKey) => {
        if (get().completedDates[dateKey]) return;
        const last = get().lastCompletedDate;
        let next = 1;
        if (last) {
          const gap = diffDays(last, dateKey);
          if (gap === 0) return; // same day, ignore
          if (gap === 1) next = get().currentStreak + 1;
        }
        const longest = Math.max(get().longestStreak, next);
        set((s) => ({
          completedDates: { ...s.completedDates, [dateKey]: true },
          currentStreak: next,
          longestStreak: longest,
          lastCompletedDate: dateKey,
        }));
      },

      isCompleted: (dateKey) => Boolean(get().completedDates[dateKey]),

      resetAll: () =>
        set({
          completedDates: {},
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
        }),
    }),
    { name: "smokyclaw/daily" },
  ),
);
