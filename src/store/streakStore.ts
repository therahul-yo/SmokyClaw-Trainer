import { create } from "zustand";
import { persist } from "zustand/middleware";

function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffDays(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (24 * 60 * 60 * 1000));
}

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
        const today = dayKey();
        const last = get().lastActiveDay;
        if (last === today) return; // already counted today
        let current = get().currentStreak;
        if (last === null) {
          current = 1;
        } else {
          const delta = diffDays(last, today);
          current = delta === 1 ? current + 1 : 1;
        }
        const longest = Math.max(get().longestStreak, current);
        set({ lastActiveDay: today, currentStreak: current, longestStreak: longest });
      },

      resetAll: () =>
        set({ lastActiveDay: null, currentStreak: 0, longestStreak: 0 }),
    }),
    { name: "interview-trainer/streak" },
  ),
);
