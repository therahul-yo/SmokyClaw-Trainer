import { Link } from "react-router-dom";
import { usePlanStore } from "../store";
import { todayBucket } from "../lib/planner";
import { AsciiProgress } from "./terminal/AsciiProgress";

function CardLink({
  to,
  title,
  body,
  variant = "default",
  trailing,
}: {
  to: string;
  title: string;
  body: string;
  variant?: "default" | "accent";
  trailing?: React.ReactNode;
}) {
  const border =
    variant === "accent" ? "var(--color-accent)" : "var(--color-border-bright)";
  const bg = variant === "accent" ? "rgba(92, 255, 159, 0.04)" : "var(--color-bg-alt)";
  return (
    <Link
      to={to}
      className="block px-3 py-3 font-mono transition-colors hover:brightness-110"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-sm font-bold"
          style={{
            color:
              variant === "accent"
                ? "var(--color-accent)"
                : "var(--color-text)",
          }}
        >
          {title}
        </div>
        {trailing && (
          <div
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {trailing}
          </div>
        )}
      </div>
      <div
        className="text-xs mt-1"
        style={{ color: "var(--color-text-dim)" }}
      >
        {body}
      </div>
    </Link>
  );
}

export function DailyTargetCard() {
  const plan = usePlanStore((s) => s.plan);
  const completedByDay = usePlanStore((s) => s.completedItemsByDay);

  if (!plan) {
    return (
      <CardLink
        to="/plan/setup"
        variant="accent"
        title="$ plan --new"
        body="build a 7 / 14 / 30 day plan. weakness-prioritized daily targets."
      />
    );
  }

  const today = todayBucket(plan);
  if (!today) {
    return (
      <CardLink
        to="/plan"
        title="$ plan --status"
        body="deadline passed — rebuild a new plan or run mocks."
      />
    );
  }

  const total =
    today.lessonIds.length + today.itemIds.length + today.reviewItemIds.length;
  const done = (completedByDay[today.dayIndex] ?? []).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Link
      to="/plan"
      className="block px-3 py-3 font-mono transition-colors hover:brightness-110"
      style={{
        background: "rgba(92, 255, 159, 0.04)",
        border: "1px solid var(--color-accent)",
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-sm font-bold"
          style={{ color: "var(--color-accent)" }}
        >
          ▸ today · day {today.dayIndex + 1}/{plan.days.length}
        </div>
        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          ~{today.estMinutes}m
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <AsciiProgress value={pct} width={18} />
        <span
          className="text-xs tabular-nums"
          style={{ color: "var(--color-text-dim)" }}
        >
          {done}/{total} done
        </span>
      </div>
      <div className="text-xs mt-2" style={{ color: "var(--color-text-dim)" }}>
        {today.note ??
          `${today.itemIds.length} drill · ${today.reviewItemIds.length} review · ${today.lessonIds.length} lesson`}
      </div>
    </Link>
  );
}
