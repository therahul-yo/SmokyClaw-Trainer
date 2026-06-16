import { create } from "zustand";
import { persist } from "zustand/middleware";

type BookmarksState = {
  items: Record<string, { addedAt: number; note?: string }>;
  toggle: (itemId: string) => void;
  setNote: (itemId: string, note: string) => void;
  isBookmarked: (itemId: string) => boolean;
  ids: () => string[];
  resetAll: () => void;
};

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      items: {},

      toggle: (itemId) => {
        const existing = get().items[itemId];
        if (existing) {
          const rest = { ...get().items };
          delete rest[itemId];
          set({ items: rest });
        } else {
          set((s) => ({
            items: { ...s.items, [itemId]: { addedAt: Date.now() } },
          }));
        }
      },

      setNote: (itemId, note) => {
        const existing = get().items[itemId];
        if (!existing) return;
        set((s) => ({
          items: { ...s.items, [itemId]: { ...existing, note } },
        }));
      },

      isBookmarked: (itemId) => Boolean(get().items[itemId]),

      ids: () =>
        Object.entries(get().items)
          .sort((a, b) => b[1].addedAt - a[1].addedAt)
          .map(([id]) => id),

      resetAll: () => set({ items: {} }),
    }),
    { name: "interview-trainer/bookmarks" },
  ),
);
