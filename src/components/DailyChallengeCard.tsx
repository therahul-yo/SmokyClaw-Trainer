import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getAllQuizItems } from "../lib/contentLoader";
import { pickDailyItem, todayKey, nowMs } from "../lib/daily";
import { useProgressStore, useDailyStore } from "../store";

const DAY_MS = 24 * 60 * 60 * 1000;

export function DailyChallengeCard() {
  const dateKey = todayKey();
  const yesterdayKey = todayKey(new Date(nowMs() - DAY_MS));
  const completed = useDailyStore((s) => Boolean(s.completedDates[dateKey]));
  const streak = useDailyStore((s) => s.currentStreak);
  const longest = useDailyStore((s) => s.longestStreak);
  const attempts = useProgressStore((s) => s.attempts);

  const item = useMemo(() => {
    const all = getAllQuizItems();
    // Latest attempt per item; consider 'recent wrong' = last 14 days incorrect
    const cutoff = nowMs() - 14 * DAY_MS;
    const wrongIds: string[] = [];
    const latest = new Map<string, { correct: boolean; at: number }>();
    for (const a of attempts) {
      const cur = latest.get(a.itemId);
      if (!cur || a.attemptedAt > cur.at) {
        latest.set(a.itemId, { correct: a.correct, at: a.attemptedAt });
      }
    }
    for (const [id, v] of latest) {
      if (!v.correct && v.at > cutoff) wrongIds.push(id);
    }
    const yesterdayItem = pickDailyItem({
      date: new Date(nowMs() - DAY_MS),
      allItems: all,
      recentWrongIds: wrongIds,
      yesterdayId: null,
    });
    return pickDailyItem({
      date: new Date(),
      allItems: all,
      recentWrongIds: wrongIds,
      yesterdayId: yesterdayItem?.id ?? null,
    });
  }, [attempts]);

  if (!item) return null;

  const completedNote = completed
    ? `✓ completed today · streak ${streak}d`
    : `streak ${streak}d · best ${longest}d`;

  const preview = item.type === "mcq" ? item.question : item.prompt;

  return (
    <Link
      to={`/quiz/${item.track}/${item.topic}?daily=${dateKey}`}
      className="block px-3 py-3 font-mono transition-colors hover:brightness-110"
      style={{
        background: completed
          ? "rgba(255, 140, 0, 0.04)"
          : "var(--color-bg-alt)",
        border: `1px solid ${
          completed ? "var(--color-accent)" : "var(--color-amber)"
        }`,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-sm font-bold"
          style={{
            color: completed ? "var(--color-accent)" : "var(--color-amber)",
          }}
        >
          {completed ? "✓ daily challenge · " : "⊙ daily challenge · "}
          <span style={{ color: "var(--color-text-dim)" }}>{dateKey}</span>
        </div>
        <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {completedNote}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span
          className="px-1.5 py-0.5"
          style={{
            border: "1px solid var(--color-border-bright)",
            color: "var(--color-amber)",
          }}
        >
          {item.type}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>
          {item.track}/{item.topic}
        </span>
        <span style={{ color: "var(--color-text-muted)" }}>·</span>
        <span style={{ color: "var(--color-text-muted)" }}>{item.difficulty}</span>
        {("estMinutes" in item && item.estMinutes) && (
          <>
            <span style={{ color: "var(--color-text-muted)" }}>·</span>
            <span style={{ color: "var(--color-text-muted)" }}>
              ~{item.estMinutes}m
            </span>
          </>
        )}
      </div>
      <div
        className="text-sm mt-1 line-clamp-2"
        style={{ color: "var(--color-text)" }}
      >
        {preview}
      </div>
      <div
        className="text-[10px] mt-2"
        style={{
          color: completed ? "var(--color-accent)" : "var(--color-text-muted)",
        }}
      >
        {completed
          ? "// you already crushed today's. tomorrow's drop at 00:00."
          : "// solve to bank a streak day. one item per day, picks by weakness."}
        {" · yesterday key: "}
        <span style={{ color: "var(--color-text-muted)" }}>{yesterdayKey}</span>
      </div>
    </Link>
  );
}
