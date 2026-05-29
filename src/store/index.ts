// Centralized export + JSON export/import for cross-store backup.
import { useProgressStore } from "./progressStore";
import { useStreakStore } from "./streakStore";
import { useReviewQueueStore } from "./reviewQueueStore";
import { useBookmarksStore } from "./bookmarksStore";
import { usePlanStore } from "./planStore";
import { useDailyStore } from "./dailyStore";

export { useProgressStore } from "./progressStore";
export { useStreakStore } from "./streakStore";
export { useReviewQueueStore } from "./reviewQueueStore";
export { useBookmarksStore } from "./bookmarksStore";
export { usePlanStore } from "./planStore";
export { useDailyStore } from "./dailyStore";

type ExportShape = {
  version: 1;
  exportedAt: number;
  progress: ReturnType<typeof useProgressStore.getState>;
  streak: ReturnType<typeof useStreakStore.getState>;
  review: ReturnType<typeof useReviewQueueStore.getState>;
  bookmarks: ReturnType<typeof useBookmarksStore.getState>;
  plan?: ReturnType<typeof usePlanStore.getState>;
};

export function exportAllStores(): string {
  const data: ExportShape = {
    version: 1,
    exportedAt: Date.now(),
    progress: useProgressStore.getState(),
    streak: useStreakStore.getState(),
    review: useReviewQueueStore.getState(),
    bookmarks: useBookmarksStore.getState(),
    plan: usePlanStore.getState(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllStores(json: string): void {
  const data = JSON.parse(json) as ExportShape;
  if (data.version !== 1) throw new Error(`Unsupported export version ${data.version}`);
  useProgressStore.setState({
    completedLessons: data.progress.completedLessons ?? {},
    attempts: data.progress.attempts ?? [],
  });
  useStreakStore.setState({
    lastActiveDay: data.streak.lastActiveDay ?? null,
    currentStreak: data.streak.currentStreak ?? 0,
    longestStreak: data.streak.longestStreak ?? 0,
  });
  useReviewQueueStore.setState({
    records: data.review.records ?? {},
  });
  useBookmarksStore.setState({
    items: data.bookmarks.items ?? {},
  });
  if (data.plan) {
    usePlanStore.setState({
      plan: data.plan.plan ?? null,
      completedItemsByDay: data.plan.completedItemsByDay ?? {},
    });
  }
}

export function resetAllStores(): void {
  useProgressStore.getState().resetAll();
  useStreakStore.getState().resetAll();
  useReviewQueueStore.getState().resetAll();
  useBookmarksStore.getState().resetAll();
  usePlanStore.getState().clearPlan();
  useDailyStore.getState().resetAll();
}
