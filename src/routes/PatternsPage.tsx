import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  getPatternItems,
  getPatternLessons,
  getPatternsByTrack,
  getTrack,
} from "../lib/contentLoader";
import { useProgressStore } from "../store";
import type { TrackId } from "../types";
import { Prompt } from "../components/terminal/Prompt";
import { Box } from "../components/terminal/Box";
import { AsciiProgress } from "../components/terminal/AsciiProgress";

export function PatternsPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getTrack(trackId as TrackId);
  const patterns = useMemo(
    () => (track ? getPatternsByTrack(track.id) : []),
    [track],
  );
  const attempts = useProgressStore((s) => s.attempts);
  const completedLessons = useProgressStore((s) => s.completedLessons);

  if (!track) return <Navigate to="/" replace />;

  const latestCorrectByItem = new Map<string, boolean>();
  for (const a of attempts) latestCorrectByItem.set(a.itemId, a.correct);

  return (
    <div className="space-y-4">
      <Prompt path={`~/tracks/${track.id}/patterns`}>
        <span>ls --patterns</span>
      </Prompt>
      <div>
        <Link
          to={`/track/${track.id}`}
          className="text-xs underline"
          style={{ color: "var(--color-cyan)" }}
        >
          ← {track.id}/
        </Link>
        <div
          className="text-2xl font-bold crt-glow mt-1"
          style={{ color: "var(--color-accent)" }}
        >
          {track.id}.patterns
        </div>
        <div
          className="text-sm font-mono"
          style={{ color: "var(--color-text-dim)" }}
        >
          // each pattern = lesson + 4-8 drills. ordered by prereqs.
        </div>
      </div>

      <div className="space-y-3">
        {patterns.map((p) => {
          const lessons = getPatternLessons(p);
          const items = getPatternItems(p);
          const totalSlots = p.itemIds.length;
          const authored = items.length;
          const correctCount = items.filter(
            (i) => latestCorrectByItem.get(i.id) === true,
          ).length;
          const pct =
            authored === 0 ? 0 : Math.round((correctCount / authored) * 100);
          const lessonsDone = lessons.filter((l) => completedLessons[l.id])
            .length;

          return (
            <Box
              key={p.id}
              title={
                <span id={p.id}>
                  <span style={{ color: "var(--color-amber)" }}>#{p.id}</span>
                  <span style={{ color: "var(--color-text-muted)" }}> · </span>
                  <span>{p.title}</span>
                </span>
              }
              trailing={
                <span style={{ color: "var(--color-text-muted)" }}>
                  {authored}/{totalSlots} authored · L {lessonsDone}/
                  {lessons.length}
                </span>
              }
            >
              <div className="text-sm font-mono space-y-3">
                <div style={{ color: "var(--color-text-dim)" }}>{p.blurb}</div>

                {p.prerequisites.length > 0 && (
                  <div
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    // prereqs: {p.prerequisites.join(", ")}
                  </div>
                )}

                {authored > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "var(--color-text-muted)" }}>
                      mastery
                    </span>
                    <AsciiProgress value={pct} width={20} showPercent />
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {lessons.map((l) => (
                    <Link
                      key={l.id}
                      to={`/lesson/${l.id}`}
                      className="px-2 py-0.5 text-xs hover:brightness-110"
                      style={{
                        border: "1px solid var(--color-cyan)",
                        color: "var(--color-cyan)",
                        background: "rgba(255, 217, 163, 0.04)",
                      }}
                    >
                      lsn/{l.id}
                    </Link>
                  ))}
                  {items.map((it) => {
                    const passed = latestCorrectByItem.get(it.id) === true;
                    return (
                      <Link
                        key={it.id}
                        to={`/quiz/${it.track}/${it.topic}`}
                        className="px-2 py-0.5 text-xs hover:brightness-110"
                        style={{
                          border: `1px solid ${
                            passed
                              ? "var(--color-accent)"
                              : "var(--color-border-bright)"
                          }`,
                          color: passed
                            ? "var(--color-accent)"
                            : "var(--color-text-dim)",
                          background: passed
                            ? "rgba(var(--accent-rgb), 0.04)"
                            : "transparent",
                        }}
                        title={it.type === "mcq" ? it.question : it.prompt}
                      >
                        {passed ? "✓ " : ""}
                        {it.id}
                      </Link>
                    );
                  })}
                  {authored === 0 && (
                    <span
                      className="text-xs italic"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      // no problems authored yet
                    </span>
                  )}
                </div>
              </div>
            </Box>
          );
        })}
      </div>
    </div>
  );
}
