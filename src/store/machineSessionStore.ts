import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MachineBlock } from "../lib/trainingMachine";

export type SessionResult = {
  itemId: string;
  blockId: string;
  correct: boolean;
  timeMs: number;
  skipped: boolean;
  gaveUp: boolean;
};

type MachineSessionState = {
  isActive: boolean;
  isCompleted: boolean;
  currentBlockIndex: number;
  currentItemIndex: number;
  blocks: MachineBlock[];
  results: Record<string, SessionResult>; // keyed by itemId
  sessionStartedAt: number | null;
  itemStartedAt: number | null;

  // Actions
  startSession: (blocks: MachineBlock[]) => void;
  recordItemResult: (itemId: string, blockId: string, result: Omit<SessionResult, "itemId" | "blockId">) => void;
  goToNext: () => void;
  endSession: () => void;
  resetAll: () => void;
};

export const useMachineSessionStore = create<MachineSessionState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isCompleted: false,
      currentBlockIndex: 0,
      currentItemIndex: 0,
      blocks: [],
      results: {},
      sessionStartedAt: null,
      itemStartedAt: null,

      startSession: (blocks) => {
        set({
          isActive: true,
          isCompleted: false,
          currentBlockIndex: 0,
          currentItemIndex: 0,
          blocks,
          results: {},
          sessionStartedAt: Date.now(),
          itemStartedAt: Date.now(),
        });
      },

      recordItemResult: (itemId, blockId, result) => {
        set((s) => ({
          results: {
            ...s.results,
            [itemId]: {
              ...result,
              itemId,
              blockId,
            },
          },
        }));
      },

      goToNext: () => {
        const { currentBlockIndex, currentItemIndex, blocks } = get();
        if (blocks.length === 0) return;

        const currentBlock = blocks[currentBlockIndex];
        const nextItemIndex = currentItemIndex + 1;

        if (nextItemIndex < currentBlock.itemIds.length) {
          set({
            currentItemIndex: nextItemIndex,
            itemStartedAt: Date.now(),
          });
        } else {
          // Move to next block
          const nextBlockIndex = currentBlockIndex + 1;
          if (nextBlockIndex < blocks.length) {
            set({
              currentBlockIndex: nextBlockIndex,
              currentItemIndex: 0,
              itemStartedAt: Date.now(),
            });
          } else {
            // End of all blocks, session done
            set({
              isActive: false,
              isCompleted: true,
            });
          }
        }
      },

      endSession: () => {
        set({
          isActive: false,
          isCompleted: false,
        });
      },

      resetAll: () => {
        set({
          isActive: false,
          isCompleted: false,
          currentBlockIndex: 0,
          currentItemIndex: 0,
          blocks: [],
          results: {},
          sessionStartedAt: null,
          itemStartedAt: null,
        });
      },
    }),
    { name: "smokyclaw/machine-session" },
  ),
);
