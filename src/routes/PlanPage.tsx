import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllLessons, getAllQuizItems } from "../lib/contentLoader";
import { todayBucket } from "../lib/planner";
import { usePlanStore } from "../store";
import type { StudyPlanDay } from "../types";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { BracketButton } from "../components/terminal/BracketButton";

export function PlanPage() {
  const navigate = useNavigate();
  const plan = usePlanStore((s) => s.plan);
  const isCompleted = usePlanStore((s) => s.isCompleted);
  const toggleCompleted = usePlanStore((s) => s.toggleCompleted);
  const clearPlan = usePlanStore((s) => s.clearPlan);

  const items = useMemo(
    () => new Map(getAllQuizItems().map((q) => [q.id, q])),
    [],
  );
  const lessons = useMemo(
    () => new Map(getAllLessons().map((l) => [l.id, l])),
    [],
  );

  if (!plan) {
    return (
      <div className="space-y-4 max-w-xl">
        <Prompt path="~/plan">
          <span style={{ color: "var(--color-danger)" }}>
            ls: no active plan
          </span>
        </Prompt>
        <Box title="$ help">
          <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            no plan is loaded. build one — pick a deadline and daily minutes,
            we'll thread weak topics first.
          </div>
          <div className="mt-3">
            <Link to="/plan/setup">
              <BracketButton variant="primary">create a plan →</BracketButton>
            </Link>
          </div>
        </Box>
      </div>
    );
  }

  const today = todayBucket(plan);
  const daysLeft = Math.max(
    0,
    Math.ceil((plan.deadline - Date.now()) / (24 * 60 * 60 * 1000)),
  );

  function renderItem(
    itemId: string,
    dayIndex: number,
    kind: "review" | "practice",
  ) {
    const item = items.get(itemId);
    const done = isCompleted(dayIndex, itemId);
    if (!item) return null;
    const href = `/quiz/${item.track}/${item.topic}`;
    const kindColor =
      kind === "review" ? "var(--color-amber)" : "var(--color-accent)";
    return (
      <li
        key={`${itemId}-${kind}`}
        className="flex items-center gap-2 px-2 py-1.5 font-mono text-sm"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleCompleted(dayIndex, itemId)}
          className="accent-[var(--color-accent)]"
          aria-label={`Mark ${item.id} done`}
        />
        <span
          className="text-[10px] px-1"
          style={{
            border: `1px solid ${kindColor}`,
            color: kindColor,
          }}
        >
          {kind === "review" ? "rev" : item.type}
        </span>
        <Link
          to={href}
          className="flex-1 truncate hover:underline"
          style={{
            color: done ? "var(--color-text-muted)" : "var(--color-text)",
            textDecoration: done ? "line-through" : undefined,
          }}
        >
          {item.type === "mcq"
            ? item.question.slice(0, 80)
            : item.prompt.slice(0, 80)}
        </Link>
        <span
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
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
        className="flex items-center gap-2 px-2 py-1.5 font-mono text-sm"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <input
          type="checkbox"
          checked={done}
          onChange={() => toggleCompleted(dayIndex, lessonId)}
          className="accent-[var(--color-accent)]"
          aria-label={`Mark ${lesson.id} done`}
        />
        <span
          className="text-[10px] px-1"
          style={{
            border: "1px solid var(--color-cyan)",
            color: "var(--color-cyan)",
          }}
        >
          lsn
        </span>
        <Link
          to={`/lesson/${lesson.id}`}
          className="flex-1 truncate hover:underline"
          style={{
            color: done ? "var(--color-text-muted)" : "var(--color-text)",
            textDecoration: done ? "line-through" : undefined,
          }}
        >
          {lesson.title}
        </Link>
        <span
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {lesson.estMinutes}m
        </span>
      </li>
    );
  }

  return (
    <div className="space-y-4">
      <Prompt path="~/plan">
        <span>cat plan.json</span>
      </Prompt>

      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <div
            className="text-2xl font-bold crt-glow"
            style={{ color: "var(--color-accent)" }}
          >
            {plan.mode === "cram" ? "cram.plan" : "study.plan"}
          </div>
          <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            {plan.days.length}-day · {plan.dailyMinutes}m/day ·{" "}
            <span style={{ color: "var(--color-amber)" }}>
              {daysLeft} days left
            </span>
          </div>
        </div>
        <div className="flex gap-2 text-sm">
          <BracketButton onClick={() => navigate("/plan/setup")}>
            rebuild
          </BracketButton>
          <BracketButton
            variant="danger"
            onClick={() => {
              if (confirm("Discard this study plan?")) clearPlan();
            }}
          >
            clear
          </BracketButton>
        </div>
      </div>

      {today && <DaySection bucket={today} title="today" highlighted />}

      <Box title="$ week --at-a-glance" trailing={`${plan.days.length} days`}>
        <div className="space-y-3">
          {plan.days.map((d) => {
            const isToday = d === today;
            return (
              <DaySection
                key={d.dayIndex}
                bucket={d}
                title={
                  isToday
                    ? "today"
                    : `day ${String(d.dayIndex + 1).padStart(2, "0")} · ${d.date}`
                }
                compact={!isToday}
              />
            );
          })}
        </div>
      </Box>
    </div>
  );

  function DaySection({
    bucket,
    title,
    compact,
    highlighted,
  }: {
    bucket: StudyPlanDay;
    title: string;
    compact?: boolean;
    highlighted?: boolean;
  }) {
    const totalCount =
      bucket.lessonIds.length +
      bucket.itemIds.length +
      bucket.reviewItemIds.length;
    return (
      <section
        className="p-3"
        style={{
          background: compact
            ? "var(--color-bg)"
            : highlighted
              ? "rgba(255, 140, 0, 0.04)"
              : "var(--color-bg-alt)",
          border: highlighted
            ? "1px solid var(--color-accent)"
            : "1px solid var(--color-border-bright)",
        }}
      >
        <div className="flex items-center justify-between mb-2 font-mono">
          <div
            className="text-sm font-bold"
            style={{
              color: highlighted ? "var(--color-accent)" : "var(--color-text)",
            }}
          >
            {highlighted ? "▸ " : ""}
            {title}
          </div>
          <div
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {totalCount} items · ~{bucket.estMinutes}m
          </div>
        </div>
        {bucket.note && (
          <div
            className="text-xs mb-2 font-mono"
            style={{ color: "var(--color-amber)" }}
          >
            // {bucket.note}
          </div>
        )}
        {totalCount === 0 ? (
          <div
            className="text-sm italic font-mono"
            style={{ color: "var(--color-text-muted)" }}
          >
            rest day — review queue empty.
          </div>
        ) : (
          <ul className="space-y-1">
            {bucket.lessonIds.map((id) => renderLesson(id, bucket.dayIndex))}
            {bucket.reviewItemIds.map((id) =>
              renderItem(id, bucket.dayIndex, "review"),
            )}
            {bucket.itemIds.map((id) =>
              renderItem(id, bucket.dayIndex, "practice"),
            )}
          </ul>
        )}
      </section>
    );
  }
}
