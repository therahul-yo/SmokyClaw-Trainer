import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStreakStore, useReviewQueueStore, useProgressStore } from "../store";
import { dueRecords } from "../lib/leitner";

function mode(pathname: string): { tag: string; color: string } {
  if (pathname === "/") return { tag: "HOME", color: "var(--color-accent)" };
  if (pathname.startsWith("/quiz") || pathname.startsWith("/sandbox"))
    return { tag: "PROBLEM", color: "var(--color-amber)" };
  if (pathname.startsWith("/mock")) return { tag: "MOCK", color: "var(--color-danger)" };
  if (pathname.startsWith("/lesson")) return { tag: "READ", color: "var(--color-cyan)" };
  if (pathname.startsWith("/plan")) return { tag: "PLAN", color: "var(--color-accent)" };
  if (pathname.startsWith("/review")) return { tag: "REVIEW", color: "var(--color-amber)" };
  if (pathname.startsWith("/progress")) return { tag: "STATS", color: "var(--color-cyan)" };
  if (pathname.startsWith("/track")) return { tag: "BROWSE", color: "var(--color-accent)" };
  return { tag: "MISC", color: "var(--color-text-dim)" };
}

export function StatusBar() {
  const location = useLocation();
  const streak = useStreakStore((s) => s.currentStreak);
  const longest = useStreakStore((s) => s.longestStreak);
  const attempts = useProgressStore((s) => s.attempts.length);
  const reviewRecords = useReviewQueueStore((s) => s.records);
  const dueCount = useMemo(
    () => dueRecords(Object.values(reviewRecords)).length,
    [reviewRecords],
  );
  const m = mode(location.pathname);

  return (
    <footer
      className="shrink-0 flex items-center justify-between px-3 text-[10px] sm:text-[11px] font-mono tabular-nums"
      style={{
        height: 24,
        borderTop: "1px solid var(--color-border-bright)",
        background: "var(--color-bg-alt)",
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="px-2 font-bold"
          style={{ background: m.color, color: "var(--color-bg)" }}
        >
          {m.tag}
        </span>
        <span className="hidden sm:inline" style={{ color: "var(--color-text-dim)" }}>{location.pathname}</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4" style={{ color: "var(--color-text-dim)" }}>
        <span>
          <span style={{ color: "var(--color-text-muted)" }}>streak </span>
          <span style={{ color: "var(--color-accent)" }}>{streak}d</span>
          <span style={{ color: "var(--color-text-muted)" }}> / best {longest}d</span>
        </span>
        <span>
          <span style={{ color: "var(--color-text-muted)" }}>due </span>
          <span style={{ color: dueCount > 0 ? "var(--color-amber)" : "var(--color-text-dim)" }}>
            {dueCount}
          </span>
        </span>
        <span>
          <span style={{ color: "var(--color-text-muted)" }}>attempts </span>
          <span>{attempts}</span>
        </span>
      </div>
    </footer>
  );
}
