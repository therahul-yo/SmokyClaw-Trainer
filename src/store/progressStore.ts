import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Attempt, LessonProgress, TrackId } from "../types";

type ProgressState = {
  completedLessons: Record<string, LessonProgress>; // keyed by lessonId
  attempts: Attempt[];
  // Public actions
  markLessonCompleted: (lessonId: string) => void;
  recordAttempt: (a: Omit<Attempt, "attemptedAt">) => void;
  resetAll: () => void;
  // Selectors
  isLessonCompleted: (lessonId: string) => boolean;
  trackMasteryPct: (track: TrackId, itemIdsByTrack: string[]) => number;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: {},
      attempts: [],

      markLessonCompleted: (lessonId) => {
        if (get().completedLessons[lessonId]) return;
        set((s) => ({
          completedLessons: {
            ...s.completedLessons,
            [lessonId]: { lessonId, completedAt: Date.now() },
          },
        }));
      },

      recordAttempt: (a) => {
        set((s) => ({
          attempts: [...s.attempts, { ...a, attemptedAt: Date.now() }],
        }));
      },

      resetAll: () => set({ completedLessons: {}, attempts: [] }),

      isLessonCompleted: (lessonId) => Boolean(get().completedLessons[lessonId]),

      trackMasteryPct: (_track, itemIdsByTrack) => {
        if (itemIdsByTrack.length === 0) return 0;
        const attempts = get().attempts;
        // Most recent attempt per item.
        const lastByItem = new Map<string, boolean>();
        for (const a of attempts) {
          if (itemIdsByTrack.includes(a.itemId)) {
            lastByItem.set(a.itemId, a.correct);
          }
        }
        const correctCount = Array.from(lastByItem.values()).filter(Boolean).length;
        return Math.round((correctCount / itemIdsByTrack.length) * 100);
      },
    }),
    { name: "interview-trainer/progress" },
  ),
);
