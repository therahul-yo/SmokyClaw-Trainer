import { useMemo } from "react";
import type { Attempt } from "../types";

type Props = {
  attempts: Attempt[];
  weeks?: number;
};

const WEEKS_DEFAULT = 13;
const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "short" });
}

export function AttemptHeatmap({ attempts, weeks = WEEKS_DEFAULT }: Props) {
  const grid = useMemo(() => {
    // Count attempts and correct per day key.
    const map = new Map<string, { total: number; correct: number }>();
    for (const a of attempts) {
      const k = dayKey(a.attemptedAt);
      const cur = map.get(k) ?? { total: 0, correct: 0 };
      cur.total += 1;
      if (a.correct) cur.correct += 1;
      map.set(k, cur);
    }

    // Find the most recent Monday-anchored grid that ends at today.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 0 = Sun ... 6 = Sat ; we want Mon=0 .. Sun=6
    const dow = (today.getDay() + 6) % 7;
    const lastColEnd = new Date(today.getTime() + (6 - dow) * DAY_MS); // upcoming sunday
    const startDay = new Date(lastColEnd.getTime() - (weeks * 7 - 1) * DAY_MS);

    type Cell = { date: Date; count: number; correct: number; isFuture: boolean };
    const cols: Cell[][] = [];
    let cursor = startDay.getTime();
    for (let w = 0; w < weeks; w++) {
      const col: Cell[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        const key = dayKey(cursor);
        const entry = map.get(key);
        const isFuture = cursor > today.getTime();
        col.push({
          date,
          count: entry?.total ?? 0,
          correct: entry?.correct ?? 0,
          isFuture,
        });
        cursor += DAY_MS;
      }
      cols.push(col);
    }
    return cols;
  }, [attempts, weeks]);

  const maxCount = useMemo(
    () => Math.max(1, ...grid.flat().map((c) => c.count)),
    [grid],
  );

  function shade(count: number): { char: string; color: string } {
    if (count === 0) return { char: "·", color: "var(--color-text-muted)" };
    const ratio = count / maxCount;
    if (ratio < 0.25) return { char: "░", color: "var(--color-amber-dim)" };
    if (ratio < 0.5) return { char: "▒", color: "var(--color-amber)" };
    if (ratio < 0.85) return { char: "▓", color: "var(--color-accent)" };
    return { char: "█", color: "var(--color-accent)" };
  }

  const monthHeader = useMemo(() => {
    return grid.map((col, i) => {
      if (i === 0) return monthLabel(col[0].date);
      const prevMonth = grid[i - 1][0].date.getMonth();
      const curMonth = col[0].date.getMonth();
      return prevMonth !== curMonth ? monthLabel(col[0].date) : "";
    });
  }, [grid]);

  const totals = useMemo(() => {
    let total = 0;
    let correct = 0;
    let active = 0;
    for (const col of grid) {
      for (const cell of col) {
        if (cell.isFuture) continue;
        total += cell.count;
        correct += cell.correct;
        if (cell.count > 0) active += 1;
      }
    }
    return { total, correct, active };
  }, [grid]);

  const accuracy = totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0;

  return (
    <div className="font-mono text-xs select-none">
      <div className="flex items-center gap-4 mb-2">
        <span style={{ color: "var(--color-text-muted)" }}>
          // last {weeks * 7} days
        </span>
        <span style={{ color: "var(--color-text-dim)" }}>
          <span style={{ color: "var(--color-accent)" }}>{totals.total}</span>{" "}
          attempts ·{" "}
          <span style={{ color: "var(--color-accent)" }}>{totals.active}</span>{" "}
          active days ·{" "}
          <span style={{ color: "var(--color-accent)" }}>{accuracy}%</span> accuracy
        </span>
      </div>

      <div className="flex gap-3">
        {/* day labels */}
        <div
          className="flex flex-col gap-[2px] pt-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className="h-3 leading-none flex items-center"
              style={{
                visibility: i % 2 === 0 ? "visible" : "hidden",
                fontSize: 9,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          {/* month labels */}
          <div className="flex gap-[2px] mb-1" style={{ color: "var(--color-text-muted)" }}>
            {monthHeader.map((m, i) => (
              <div
                key={i}
                className="w-3 text-[9px] leading-none"
                style={{ minWidth: 12 }}
              >
                {m}
              </div>
            ))}
          </div>

          {/* grid */}
          <div className="flex gap-[2px]">
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[2px]">
                {col.map((cell, ri) => {
                  if (cell.isFuture) {
                    return (
                      <span
                        key={ri}
                        className="w-3 h-3 leading-none text-center"
                        style={{ color: "var(--color-bg)" }}
                      >
                        ·
                      </span>
                    );
                  }
                  const { char, color } = shade(cell.count);
                  return (
                    <span
                      key={ri}
                      className="w-3 h-3 leading-none text-center"
                      style={{ color, fontSize: 14 }}
                      title={`${dayKey(cell.date.getTime())} · ${cell.count} attempts (${cell.correct} correct)`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {/* legend */}
          <div className="flex items-center gap-2 mt-3 text-[10px]">
            <span style={{ color: "var(--color-text-muted)" }}>less</span>
            {[
              { ch: "·", co: "var(--color-text-muted)" },
              { ch: "░", co: "var(--color-amber-dim)" },
              { ch: "▒", co: "var(--color-amber)" },
              { ch: "▓", co: "var(--color-accent)" },
              { ch: "█", co: "var(--color-accent)" },
            ].map((c, i) => (
              <span key={i} style={{ color: c.co, fontSize: 14 }}>
                {c.ch}
              </span>
            ))}
            <span style={{ color: "var(--color-text-muted)" }}>more</span>
          </div>
        </div>
      </div>
    </div>
  );
}
