import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudyPlan } from "../types";
import { migrateStorageKey } from "./migration";

// Phase 5 audit: localStorage key rename from "interview-trainer/plan" → "smokyclaw/plan".
migrateStorageKey("interview-trainer/plan", "smokyclaw/plan");

type PlanState = {
  plan: StudyPlan | null;
  completedItemsByDay: Record<number, string[]>; // dayIndex -> itemIds checked off
  setPlan: (plan: StudyPlan | null) => void;
  toggleCompleted: (dayIndex: number, itemId: string) => void;
  isCompleted: (dayIndex: number, itemId: string) => boolean;
  clearPlan: () => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      plan: null,
      completedItemsByDay: {},

      setPlan: (plan) =>
        set({
          plan,
          // New plan resets per-day completion.
          completedItemsByDay: {},
        }),

      toggleCompleted: (dayIndex, itemId) => {
        const cur = get().completedItemsByDay[dayIndex] ?? [];
        const next = cur.includes(itemId)
          ? cur.filter((id) => id !== itemId)
          : [...cur, itemId];
        set((s) => ({
          completedItemsByDay: { ...s.completedItemsByDay, [dayIndex]: next },
        }));
      },

      isCompleted: (dayIndex, itemId) =>
        (get().completedItemsByDay[dayIndex] ?? []).includes(itemId),

      clearPlan: () => set({ plan: null, completedItemsByDay: {} }),
    }),
    { name: "smokyclaw/plan" },
  ),
);
