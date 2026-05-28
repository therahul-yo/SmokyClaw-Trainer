import { Link } from "react-router-dom";
import { usePlanStore } from "../store";
import { todayBucket } from "../lib/planner";

// Home-page widget. If a plan is active, shows today's bucket summary +
// progress. Otherwise: CTA to build one.
export function DailyTargetCard() {
  const plan = usePlanStore((s) => s.plan);
  const completedByDay = usePlanStore((s) => s.completedItemsByDay);

  if (!plan) {
    return (
      <Link
        to="/plan/setup"
        className="block p-4 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 hover:bg-[var(--color-accent)]/10"
      >
        <div className="font-semibold text-white">📅 Build a study plan</div>
        <div className="text-sm text-[var(--color-text-dim)] mt-1">
          1 week, 2 weeks, or 1 month — daily targets, weakness-prioritized.
        </div>
      </Link>
    );
  }

  const today = todayBucket(plan);
  if (!today) {
    return (
      <Link
        to="/plan"
        className="block p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]"
      >
        <div className="font-semibold text-white">📅 Plan finished</div>
        <div className="text-sm text-[var(--color-text-dim)] mt-1">
          Deadline passed — rebuild a new plan or jump into mock tests.
        </div>
      </Link>
    );
  }

  const total =
    today.lessonIds.length + today.itemIds.length + today.reviewItemIds.length;
  const done = (completedByDay[today.dayIndex] ?? []).length;

  return (
    <Link
      to="/plan"
      className="block p-4 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 hover:bg-[var(--color-accent)]/10"
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white">
          📅 Today · day {today.dayIndex + 1} of {plan.days.length}
        </div>
        <div className="text-xs text-[var(--color-text-muted)]">
          {done}/{total} done · ~{today.estMinutes}m
        </div>
      </div>
      <div className="text-sm text-[var(--color-text-dim)] mt-1">
        {today.note ?? `${today.itemIds.length} drill · ${today.reviewItemIds.length} review · ${today.lessonIds.length} lesson`}
      </div>
    </Link>
  );
}
