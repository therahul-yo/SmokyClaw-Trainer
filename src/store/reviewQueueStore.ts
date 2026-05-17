import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReviewRecord } from "../types";
import { applyAttempt, dueRecords, newRecord } from "../lib/leitner";

type ReviewQueueState = {
  records: Record<string, ReviewRecord>;
  registerAttempt: (itemId: string, correct: boolean) => void;
  dueIds: () => string[];
  recordFor: (itemId: string) => ReviewRecord | undefined;
  resetAll: () => void;
};

export const useReviewQueueStore = create<ReviewQueueState>()(
  persist(
    (set, get) => ({
      records: {},

      registerAttempt: (itemId, correct) => {
        const existing = get().records[itemId] ?? newRecord(itemId);
        const updated = applyAttempt(existing, correct);
        set((s) => ({ records: { ...s.records, [itemId]: updated } }));
      },

      dueIds: () => dueRecords(Object.values(get().records)).map((r) => r.itemId),

      recordFor: (itemId) => get().records[itemId],

      resetAll: () => set({ records: {} }),
    }),
    { name: "interview-trainer/review-queue" },
  ),
);
