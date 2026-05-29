import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  getTrack,
  getLessonsByTrack,
  getQuizItemsByTrack,
  getPatternsByTrack,
} from "../lib/contentLoader";
import type { TrackId } from "../types";
import { useProgressStore } from "../store";
import { Box } from "../components/terminal/Box";
import { AsciiProgress } from "../components/terminal/AsciiProgress";
import { Prompt } from "../components/terminal/Prompt";

export function TrackPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getTrack(trackId as TrackId);

  // Hooks must run unconditionally — keep them above the early return.
  // Subscribe to `attempts` (not just completedLessons) so the mastery bar
  // re-renders the moment a quiz answer is recorded, not only on lesson reads.
  const completedLessons = useProgressStore((s) => s.completedLessons);
  const attempts = useProgressStore((s) => s.attempts);

  const items = track ? getQuizItemsByTrack(track.id) : [];
  const itemIds = items.map((q) => q.id);
  const pct = useMemo(() => {
    if (!track) return 0;
    return useProgressStore.getState().trackMasteryPct(track.id, itemIds);
    // `attempts` drives recompute though it's read via getState() above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, attempts, itemIds]);

  if (!track) return <Navigate to="/" replace />;

  const lessons = getLessonsByTrack(track.id);
  const patterns = getPatternsByTrack(track.id);

  const byTopic = new Map<string, typeof items>();
  for (const it of items) {
    const arr = byTopic.get(it.topic) ?? [];
    arr.push(it);
    byTopic.set(it.topic, arr);
  }

  return (
    <div className="space-y-6">
      <Prompt path={`~/tracks/${track.id}`}>
        <span>cat README.md</span>
      </Prompt>

      <div>
        <div
          className="text-3xl font-bold crt-glow mb-1"
          style={{ color: "var(--color-accent)" }}
        >
          {track.id}/
        </div>
        <div className="text-sm" style={{ color: "var(--color-text-dim)" }}>
          {track.blurb}
        </div>
        <div className="mt-4 max-w-md flex items-center gap-3 text-xs">
          <span style={{ color: "var(--color-text-muted)" }}>mastery</span>
          <AsciiProgress value={pct} width={20} />
          <span className="tabular-nums" style={{ color: "var(--color-accent)" }}>
            {pct}%
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>
            · {items.length} items · {lessons.length} lessons
          </span>
        </div>
      </div>

      {patterns.length > 0 && (
        <Box
          title={`$ ls patterns/`}
          trailing={
            <Link
              to={`/patterns/${track.id}`}
              className="underline"
              style={{ color: "var(--color-cyan)" }}
            >
              view all {patterns.length} →
            </Link>
          }
        >
          <div className="flex flex-wrap gap-2 text-sm">
            {patterns.slice(0, 12).map((p) => (
              <Link
                key={p.id}
                to={`/patterns/${track.id}#${p.id}`}
                className="px-2 py-1 transition-colors hover:brightness-125"
                style={{
                  border: "1px solid var(--color-border-bright)",
                  background: "var(--color-bg-card)",
                  color: "var(--color-amber)",
                }}
              >
                #{p.id}
              </Link>
            ))}
          </div>
        </Box>
      )}

      <Box title={`$ ls lessons/`} trailing={`${lessons.length} files`}>
        {lessons.length === 0 ? (
          <div className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
            No lessons yet. Add markdown files in{" "}
            <code style={{ color: "var(--color-amber)" }}>
              src/content/{track.id}/
            </code>.
          </div>
        ) : (
          <ol className="font-mono text-sm">
            {lessons.map((l, i) => {
              const last = i === lessons.length - 1;
              const done = completedLessons[l.id];
              return (
                <li key={l.id}>
                  <Link
                    to={`/lesson/${l.id}`}
                    className="flex items-center gap-2 py-1 px-1 transition-colors"
                    style={{ color: done ? "var(--color-text-dim)" : "var(--color-text)" }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {last ? "└─" : "├─"}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }} className="tabular-nums">
                      {String(l.order).padStart(2, "0")}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {l.estMinutes}m
                    </span>
                    <span
                      className="text-xs w-12 text-right"
                      style={{
                        color: done ? "var(--color-accent)" : "var(--color-text-muted)",
                      }}
                    >
                      {done ? "[✓ done]" : "[ read ]"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </Box>

      <Box title={`$ ls practice/`} trailing={`${byTopic.size} topics`}>
        {byTopic.size === 0 ? (
          <div className="text-sm italic" style={{ color: "var(--color-text-dim)" }}>
            No quiz items yet. Add them under{" "}
            <code style={{ color: "var(--color-amber)" }}>src/data/quizzes/</code>.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-2 font-mono text-sm">
            {Array.from(byTopic.entries()).map(([topic, list]) => {
              const mcq = list.filter((q) => q.type === "mcq").length;
              const coding = list.filter((q) => q.type === "coding").length;
              const sql = list.filter((q) => q.type === "sql").length;
              return (
                <Link
                  key={topic}
                  to={`/quiz/${track.id}/${topic}`}
                  className="px-2 py-2 transition-colors hover:brightness-110"
                  style={{
                    background: "var(--color-bg-card)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--color-text-muted)" }}>▸</span>
                    <span
                      style={{ color: "var(--color-amber)" }}
                      className="font-bold capitalize"
                    >
                      {topic}
                    </span>
                    <span
                      className="ml-auto text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {list.length}
                    </span>
                  </div>
                  <div
                    className="text-xs mt-1 pl-5"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {[
                      mcq && `${mcq} mcq`,
                      coding && `${coding} coding`,
                      sql && `${sql} sql`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Box>
    </div>
  );
}
