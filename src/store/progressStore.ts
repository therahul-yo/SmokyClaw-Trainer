import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Attempt, LessonProgress, TrackId } from "../types";
import { migrateStorageKey } from "./migration";

// Phase 5 audit: localStorage key rename from "interview-trainer/progress" → "smokyclaw/progress".
migrateStorageKey("interview-trainer/progress", "smokyclaw/progress");

export type RecognitionAttempt = {
  itemId: string;
  pattern: string;
  correct: boolean;
  timeMs: number;
  attemptedAt: number;
};

// Cap to keep the persisted progress blob under a safe localStorage
// budget (most browsers cap at ~5MB; an unbounded attempts[] would
// eventually throw QuotaExceededError and brick the app).
const ATTEMPTS_CAP = 2000;

function prune<T>(arr: T[]): T[] {
  if (arr.length <= ATTEMPTS_CAP) return arr;
  return arr.slice(arr.length - ATTEMPTS_CAP);
}

type ProgressState = {
  completedLessons: Record<string, LessonProgress>; // keyed by lessonId
  attempts: Attempt[];
  recognitionAttempts: RecognitionAttempt[];
  speedChallengeHighScores: Record<string, number>; // keyed by challengeId
  // Public actions
  markLessonCompleted: (lessonId: string) => void;
  recordAttempt: (a: Omit<Attempt, "attemptedAt">) => void;
  recordRecognitionAttempt: (a: Omit<RecognitionAttempt, "attemptedAt">) => void;
  recordSpeedChallengeScore: (challengeId: string, score: number) => void;
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
      recognitionAttempts: [],
      speedChallengeHighScores: {},

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
          attempts: prune([...s.attempts, { ...a, attemptedAt: Date.now() }]),
        }));
      },

      recordRecognitionAttempt: (a) => {
        set((s) => ({
          recognitionAttempts: prune([...s.recognitionAttempts, { ...a, attemptedAt: Date.now() }]),
        }));
      },

      recordSpeedChallengeScore: (challengeId, score) => {
        const current = get().speedChallengeHighScores[challengeId] ?? 0;
        if (score > current) {
          set((s) => ({
            speedChallengeHighScores: {
              ...s.speedChallengeHighScores,
              [challengeId]: score,
            },
          }));
        }
      },

      resetAll: () =>
        set({
          completedLessons: {},
          attempts: [],
          recognitionAttempts: [],
          speedChallengeHighScores: {},
        }),

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
    { name: "smokyclaw/progress" },
  ),
);
