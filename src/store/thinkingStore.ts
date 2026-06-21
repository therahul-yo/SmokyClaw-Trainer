import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MistakeTag, ThinkingTrace, ThinkingTraceField } from "../lib/thinkingTrace";
import { EMPTY_TRACE } from "../lib/thinkingTrace";
import { migrateStorageKey } from "./migration";

// Phase 5 audit: localStorage key rename from "interview-trainer/thinking" → "smokyclaw/thinking".
migrateStorageKey("interview-trainer/thinking", "smokyclaw/thinking");

type ThinkingState = {
  traces: Record<string, ThinkingTrace>;
  updateField: (targetId: string, field: ThinkingTraceField, value: string) => void;
  toggleMistakeTag: (targetId: string, tag: MistakeTag) => void;
  resetTrace: (targetId: string) => void;
};

function ensureTrace(trace: ThinkingTrace | undefined): ThinkingTrace {
  return { ...EMPTY_TRACE, ...(trace ?? {}) };
}

export const useThinkingStore = create<ThinkingState>()(
  persist(
    (set) => ({
      traces: {},

      updateField: (targetId, field, value) =>
        set((state) => ({
          traces: {
            ...state.traces,
            [targetId]: {
              ...ensureTrace(state.traces[targetId]),
              [field]: value,
            },
          },
        })),

      toggleMistakeTag: (targetId, tag) =>
        set((state) => {
          const trace = ensureTrace(state.traces[targetId]);
          const hasTag = trace.mistakeTags.includes(tag);
          return {
            traces: {
              ...state.traces,
              [targetId]: {
                ...trace,
                mistakeTags: hasTag
                  ? trace.mistakeTags.filter((t) => t !== tag)
                  : [...trace.mistakeTags, tag],
              },
            },
          };
        }),

      resetTrace: (targetId) =>
        set((state) => {
          const rest = { ...state.traces };
          delete rest[targetId];
          return { traces: rest };
        }),
    }),
    { name: "smokyclaw/thinking" },
  ),
);
