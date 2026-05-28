import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  getPatternItems,
  getPatternLessons,
  getPatternsByTrack,
  getTrack,
} from "../lib/contentLoader";
import { useProgressStore } from "../store";
import { ProgressBar } from "../components/ProgressBar";
import type { TrackId } from "../types";

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

  // Latest correct per item — copy of progressStore.trackMasteryPct logic.
  const latestCorrectByItem = new Map<string, boolean>();
  for (const a of attempts) latestCorrectByItem.set(a.itemId, a.correct);

  return (
    <div className="space-y-8">
      <header>
        <Link to={`/track/${track.id}`} className="text-sm text-[var(--color-text-dim)] hover:text-white">
          ← {track.title}
        </Link>
        <h1 className="text-3xl font-bold text-white mt-2">
          {track.emoji} {track.title} patterns
        </h1>
        <p className="mt-2 text-[var(--color-text-dim)] max-w-2xl">
          Each pattern is a self-contained mini-curriculum: lesson + 4–8 drill
          problems. Recommended order respects prerequisites.
        </p>
      </header>

      <section className="space-y-4">
        {patterns.map((p) => {
          const lessons = getPatternLessons(p);
          const items = getPatternItems(p);
          const totalSlots = p.itemIds.length;
          const authored = items.length;
          const correctCount = items.filter(
            (i) => latestCorrectByItem.get(i.id) === true,
          ).length;
          const pct = authored === 0 ? 0 : Math.round((correctCount / authored) * 100);
          const lessonsDone = lessons.filter((l) => completedLessons[l.id]).length;

          return (
            <article
              key={p.id}
              id={p.id}
              className="p-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white">{p.title}</h2>
                  <p className="text-sm text-[var(--color-text-dim)] mt-1">{p.blurb}</p>
                  {p.prerequisites.length > 0 && (
                    <div className="text-xs text-[var(--color-text-muted)] mt-2">
                      Prereqs: {p.prerequisites.join(", ")}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {authored}/{totalSlots} authored
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    Lessons: {lessonsDone}/{lessons.length}
                  </div>
                </div>
              </div>

              {authored > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
                    <span>mastery</span>
                    <span>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {lessons.map((l) => (
                  <Link
                    key={l.id}
                    to={`/lesson/${l.id}`}
                    className="px-2.5 py-1 rounded text-xs bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-success)] hover:text-white"
                  >
                    📖 {l.title}
                  </Link>
                ))}
                {items.map((it) => (
                  <Link
                    key={it.id}
                    to={`/quiz/${it.track}/${it.topic}`}
                    className={`px-2.5 py-1 rounded text-xs border ${
                      latestCorrectByItem.get(it.id) === true
                        ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/40 text-[var(--color-success)]"
                        : "bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white"
                    }`}
                    title={it.type === "mcq" ? it.question : it.prompt}
                  >
                    {it.type === "coding" ? "🐍" : it.type === "sql" ? "🗃️" : "❓"} {it.id}
                  </Link>
                ))}
                {authored === 0 && (
                  <span className="text-xs italic text-[var(--color-text-muted)]">
                    No problems authored yet — see CONTENT.md for the queue.
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
