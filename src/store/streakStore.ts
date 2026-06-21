import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dayKeyLocal, diffDaysLocal } from "../lib/dateKey";

type StreakState = {
  lastActiveDay: string | null;
  currentStreak: number;
  longestStreak: number;
  ping: () => void;
  resetAll: () => void;
};

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      lastActiveDay: null,
      currentStreak: 0,
      longestStreak: 0,

      ping: () => {
        const today = dayKeyLocal();
        const last = get().lastActiveDay;
        if (last === today) return; // already counted today
        let current = get().currentStreak;
        if (last === null) {
          current = 1;
        } else {
          const delta = diffDaysLocal(last, today);
          current = delta === 1 ? current + 1 : 1;
        }
        const longest = Math.max(get().longestStreak, current);
        set({ lastActiveDay: today, currentStreak: current, longestStreak: longest });
      },

      resetAll: () =>
        set({ lastActiveDay: null, currentStreak: 0, longestStreak: 0 }),
    }),
    // Persist key intentionally not renamed here — see PR notes.
    { name: "interview-trainer/streak" },
  ),
);