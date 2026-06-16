import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MockCodingResult, MockTestBlueprint } from "../types";

// Persisted in-flight mock run. A 100+ minute exam (e.g. TCS NQT) must survive
// an accidental refresh; this store holds the picked questions, deadlines, and
// answers so MockTestPage can resume exactly where it left off. The picker is
// seeded by `runId`, so even a from-scratch resume re-picks identical items.

export type MockRunState = {
  blueprintId: MockTestBlueprint["id"] | null;
  runId: string | null;
  startedAt: number | null;
  phase: "section" | "coding" | "done";
  sectionIdx: number;
  itemIdsBySection: string[][];
  codingItemIds: string[];
  sectionDeadlines: number[];
  codingDeadline: number | null;
  mcqAnswers: Record<string, number>;
  itemStartTsById: Record<string, number>;
  codingResultsById: Record<string, MockCodingResult>;

  startRun: (init: {
    blueprintId: MockTestBlueprint["id"];
    runId: string;
    startedAt: number;
    itemIdsBySection: string[][];
    codingItemIds: string[];
    sectionDeadlines: number[];
    codingDeadline: number | null;
  }) => void;
  setMcqAnswer: (itemId: string, optionIndex: number) => void;
  markItemSeen: (itemId: string, ts: number) => void;
  setSectionIdx: (idx: number) => void;
  setPhase: (phase: MockRunState["phase"]) => void;
  recordCoding: (result: MockCodingResult) => void;
  resetAll: () => void;
};

const EMPTY = {
  blueprintId: null,
  runId: null,
  startedAt: null,
  phase: "section" as const,
  sectionIdx: 0,
  itemIdsBySection: [] as string[][],
  codingItemIds: [] as string[],
  sectionDeadlines: [] as number[],
  codingDeadline: null,
  mcqAnswers: {} as Record<string, number>,
  itemStartTsById: {} as Record<string, number>,
  codingResultsById: {} as Record<string, MockCodingResult>,
};

export const useMockTestRunStore = create<MockRunState>()(
  persist(
    (set) => ({
      ...EMPTY,

      startRun: (init) =>
        set({
          ...EMPTY,
          ...init,
          phase: "section",
        }),

      setMcqAnswer: (itemId, optionIndex) =>
        set((s) => ({
          mcqAnswers: { ...s.mcqAnswers, [itemId]: optionIndex },
        })),

      // First-seen timestamp only; never overwritten, so timeMs measures from
      // the moment a question first appeared.
      markItemSeen: (itemId, ts) =>
        set((s) =>
          s.itemStartTsById[itemId] != null
            ? s
            : { itemStartTsById: { ...s.itemStartTsById, [itemId]: ts } },
        ),

      setSectionIdx: (idx) => set({ sectionIdx: idx }),
      setPhase: (phase) => set({ phase }),

      recordCoding: (result) =>
        set((s) => ({
          codingResultsById: {
            ...s.codingResultsById,
            [result.itemId]: result,
          },
        })),

      resetAll: () => set({ ...EMPTY }),
    }),
    { name: "smokyclaw/mock-test-run" },
  ),
);
