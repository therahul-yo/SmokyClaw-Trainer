import { useEffect, useMemo, useState } from "react";
import {
  useProgressStore,
  useReviewQueueStore,
  useStreakStore,
} from "../store";
import { getAllLessons, getAllQuizItems } from "./contentLoader";
import { BLUEPRINTS } from "./mockTestFormats";
import { nowMs } from "./daily";
import { runSmokey, type SmokeyReport } from "./smokey";

// One minute is fine-grained enough that streak-risk / mins-to-midnight
// advisories stay accurate within the visible minute, and coarse enough
// that the memo below doesn't churn every render.
const NOW_REFRESH_MS = 60_000;

// Gathers live store state and runs the (pure) smokey engine. `now` is
// refreshed on a 1-minute interval so streak / deadline advisories stay
// current without re-rendering on every second.
export function useSmokey(): SmokeyReport {
  const [now, setNow] = useState(() => nowMs());

  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMs()), NOW_REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

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
