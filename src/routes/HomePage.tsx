import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getTracks, getAllQuizItems, getAllLessons } from "../lib/contentLoader";
import {
  useProgressStore,
  useReviewQueueStore,
  useStreakStore,
  useBookmarksStore,
} from "../store";
import { dueRecords } from "../lib/leitner";
import { ProgressBar } from "../components/ProgressBar";
import { OnboardingModal } from "../components/OnboardingModal";
import { DailyTargetCard } from "../components/DailyTargetCard";

export function HomePage() {
  const tracks = getTracks();
  const allItems = getAllQuizItems();
  const allLessons = getAllLessons();
  const reviewRecords = useReviewQueueStore((s) => s.records);
  const dueIds = useMemo(
    () => dueRecords(Object.values(reviewRecords)).map((r) => r.itemId),
    [reviewRecords],
  );
  const streak = useStreakStore((s) => s.currentStreak);
  const bookmarksCount = useBookmarksStore((s) => Object.keys(s.items).length);
  const completedLessons = useProgressStore((s) => Object.keys(s.completedLessons).length);
  const totalAttempts = useProgressStore((s) => s.attempts.length);

  return (
    <div className="space-y-8">
      <OnboardingModal />
      <header>
        <h1 className="text-3xl font-bold text-white">
          Train your interview brain like a machine.
        </h1>
        <p className="mt-2 text-[var(--color-text-dim)] max-w-2xl">
          Python · DSA · LeetCode patterns · SQL · Aptitude — one adaptive
          system for building recall, speed, and problem-solving under time
          pressure. Learn the concept, recognize the pattern, code it, review
          mistakes, and repeat until it becomes automatic.
        </p>
      </header>

      <DailyTargetCard />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Streak" value={`${streak}d`} hint="🔥 keep it going" />
        <StatCard label="Due for review" value={String(dueIds.length)} hint="🔁 in the Leitner box" />
        <StatCard label="Lessons read" value={`${completedLessons}/${allLessons.length}`} />
        <StatCard label="Attempts" value={String(totalAttempts)} hint={`${bookmarksCount} bookmarked`} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Tracks</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {tracks.map((t) => {
            const trackItems = allItems.filter((q) => q.track === t.id);
            const ids = trackItems.map((q) => q.id);
            const pct = useProgressStore.getState().trackMasteryPct(t.id, ids);
            return (
              <Link
                key={t.id}
                to={`/track/${t.id}`}
                className="block p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl mb-1">{t.emoji}</div>
                    <div className="font-semibold text-white">{t.title}</div>
                    <div className="text-sm text-[var(--color-text-dim)] mt-1">
                      {t.blurb}
                    </div>
                  </div>
                  <div className="text-right text-xs text-[var(--color-text-muted)]">
                    {trackItems.length} items
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
                    <span>mastery</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Today</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Link
            to="/review"
            className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]"
          >
            <div className="font-semibold text-white">
              🔁 Machine recall queue ({dueIds.length} due)
            </div>
            <div className="text-sm text-[var(--color-text-dim)] mt-1">
              Wrong answers resurface until the concept is fast, clean, and
              reliable under pressure.
            </div>
          </Link>
          <Link
            to="/mock/tcs-nqt"
            className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]"
          >
            <div className="font-semibold text-white">🎯 Take a mock test</div>
            <div className="text-sm text-[var(--color-text-dim)] mt-1">
              TCS NQT or Infosys SP, exact format. Timer + score.
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <div className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {hint && <div className="text-xs text-[var(--color-text-dim)] mt-1">{hint}</div>}
    </div>
  );
}
