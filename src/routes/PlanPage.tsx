import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllLessons, getAllQuizItems } from "../lib/contentLoader";
import { todayBucket } from "../lib/planner";
import { usePlanStore } from "../store";
import type { StudyPlanDay } from "../types";

export function PlanPage() {
  const navigate = useNavigate();
  const plan = usePlanStore((s) => s.plan);
  const isCompleted = usePlanStore((s) => s.isCompleted);
  const toggleCompleted = usePlanStore((s) => s.toggleCompleted);
  const clearPlan = usePlanStore((s) => s.clearPlan);

  const items = useMemo(() => {
    const map = new Map(getAllQuizItems().map((q) => [q.id, q]));
    return map;
  }, []);
  const lessons = useMemo(() => {
    const map = new Map(getAllLessons().map((l) => [l.id, l]));
    return map;
  }, []);

  if (!plan) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-bold text-white">No active plan</h1>
        <p className="text-[var(--color-text-dim)]">
          Build a study plan to get daily targets generated for you.
        </p>
        <Link
          to="/plan/setup"
          className="inline-block px-4 py-2 rounded-md bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white font-semibold text-sm"
        >
          Create a plan
        </Link>
      </div>
    );
  }

  const today = todayBucket(plan);
  const daysLeft = Math.max(
    0,
    Math.ceil((plan.deadline - Date.now()) / (24 * 60 * 60 * 1000)),
  );

  function renderItem(itemId: string, dayIndex: number, kind: "review" | "practice") {
    const item = items.get(itemId);
    const done = isCompleted(dayIndex, itemId);
    if (!item) return null;
    const href =
      item.type === "mcq"
        ? `/quiz/${item.track}/${item.topic}`
        : item.type === "sql"
          ? `/quiz/${item.track}/${item.topic}`
          : `/quiz/${item.track}/${item.topic}`;
    return (
      <li
        key={`${itemId}-${kind}`}
        className="flex items-center gap-3 p-2.5 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)]"
      >
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleCompleted(dayIndex, itemId)}
          className="accent-[var(--color-accent)]"
          aria-label={`Mark ${item.id} done`}
        />
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            kind === "review"
              ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
              : "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
          }`}
        >
          {kind === "review" ? "review" : item.type}
        </span>
        <Link
          to={href}
          className={`flex-1 text-sm hover:underline ${
            done ? "line-through text-[var(--color-text-muted)]" : "text-white"
          }`}
        >
          {item.type === "mcq" ? item.question.slice(0, 80) : item.prompt.slice(0, 80)}
        </Link>
        <span className="text-xs text-[var(--color-text-muted)] uppercase">
          {item.topic}
        </span>
      </li>
    );
  }

  function renderLesson(lessonId: string, dayIndex: number) {
    const lesson = lessons.get(lessonId);
    const done = isCompleted(dayIndex, lessonId);
    if (!lesson) return null;
    return (
      <li
        key={lessonId}
        className="flex items-center gap-3 p-2.5 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)]"
      >
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleCompleted(dayIndex, lessonId)}
          className="accent-[var(--color-accent)]"
          aria-label={`Mark ${lesson.id} done`}
        />
        <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">
          lesson
        </span>
        <Link
          to={`/lesson/${lesson.id}`}
          className={`flex-1 text-sm hover:underline ${
            done ? "line-through text-[var(--color-text-muted)]" : "text-white"
          }`}
        >
          {lesson.title}
        </Link>
        <span className="text-xs text-[var(--color-text-muted)]">
          {lesson.estMinutes}m
        </span>
      </li>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {plan.mode === "cram" ? "Cram plan" : "Study plan"}
          </h1>
          <p className="mt-1 text-[var(--color-text-dim)]">
            {plan.days.length}-day plan · {plan.dailyMinutes} min/day · {daysLeft} days left
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate("/plan/setup")}
            className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white"
          >
            Rebuild
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Discard this study plan?")) clearPlan();
            }}
            className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-danger)]"
          >
            Clear
          </button>
        </div>
      </header>

      {today && <DaySection bucket={today} title="Today" />}

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Week at a glance</h2>
        <div className="space-y-3">
          {plan.days.map((d) => (
            <DaySection
              key={d.dayIndex}
              bucket={d}
              title={d === today ? "Today" : `Day ${d.dayIndex + 1} · ${d.date}`}
              compact={d !== today}
            />
          ))}
        </div>
      </section>
    </div>
  );

  function DaySection({
    bucket,
    title,
    compact,
  }: {
    bucket: StudyPlanDay;
    title: string;
    compact?: boolean;
  }) {
    const totalCount =
      bucket.lessonIds.length + bucket.itemIds.length + bucket.reviewItemIds.length;
    return (
      <section
        className={
          compact
            ? "p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
            : "p-5 rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-bg-card)]"
        }
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">{title}</h3>
          <div className="text-xs text-[var(--color-text-muted)]">
            {totalCount} items · ~{bucket.estMinutes}m
          </div>
        </div>
        {bucket.note && (
          <div className="text-xs text-[var(--color-warning)] mb-2">📌 {bucket.note}</div>
        )}
        {totalCount === 0 ? (
          <div className="text-sm text-[var(--color-text-muted)]">
            Rest day — review queue is empty.
          </div>
        ) : (
          <ul className="space-y-1.5">
            {bucket.lessonIds.map((id) => renderLesson(id, bucket.dayIndex))}
            {bucket.reviewItemIds.map((id) => renderItem(id, bucket.dayIndex, "review"))}
            {bucket.itemIds.map((id) => renderItem(id, bucket.dayIndex, "practice"))}
          </ul>
        )}
      </section>
    );
  }
}
