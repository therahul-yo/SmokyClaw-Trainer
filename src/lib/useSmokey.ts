import { useMemo, useState } from "react";
import {
  useProgressStore,
  useReviewQueueStore,
  useStreakStore,
} from "../store";
import { getAllLessons, getAllQuizItems } from "./contentLoader";
import { BLUEPRINTS } from "./mockTestFormats";
import { nowMs } from "./daily";
import { runSmokey, type SmokeyReport } from "./smokey";

// Gathers live store state and runs the (pure) smokey engine. The wall-clock
// read is captured once on mount via a lazy initializer routed through nowMs()
// so render-purity lint stays quiet — advisories don't need to re-tick mid-view.
export function useSmokey(): SmokeyReport {
  const [now] = useState(() => nowMs());

  const attempts = useProgressStore((s) => s.attempts);
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const reviewRecords = useReviewQueueStore((s) => s.records);
  const streakCurrent = useStreakStore((s) => s.currentStreak);
  const streakLongest = useStreakStore((s) => s.longestStreak);

  return useMemo(
    () =>
      runSmokey(
        {
          attempts,
          items: getAllQuizItems(),
          lessons: getAllLessons(),
          completedLessonIds: Object.keys(completedLessons),
          reviewRecords: Object.values(reviewRecords),
          streak: { current: streakCurrent, longest: streakLongest },
          blueprints: BLUEPRINTS,
        },
        now,
      ),
    [attempts, completedLessons, reviewRecords, streakCurrent, streakLongest, now],
  );
}
