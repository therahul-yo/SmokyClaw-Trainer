import { create } from "zustand";
import { persist } from "zustand/middleware";
import { diffDaysLocal } from "../lib/dateKey";

type DailyState = {
  completedDates: Record<string, true>; // YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  markCompleted: (dateKey: string) => void;
  isCompleted: (dateKey: string) => boolean;
  resetAll: () => void;
};

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
          const gap = diffDaysLocal(last, dateKey);
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
    // Persist key intentionally not renamed here — see PR notes.
    { name: "smokyclaw/daily" },
  ),
);