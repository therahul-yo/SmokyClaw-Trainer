import { useParams, Link, Navigate } from "react-router-dom";
import {
  getTrack,
  getLessonsByTrack,
  getQuizItemsByTrack,
  getPatternsByTrack,
} from "../lib/contentLoader";
import type { TrackId } from "../types";
import { useProgressStore } from "../store";
import { ProgressBar } from "../components/ProgressBar";

export function TrackPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getTrack(trackId as TrackId);
  if (!track) return <Navigate to="/" replace />;

  const lessons = getLessonsByTrack(track.id);
  const items = getQuizItemsByTrack(track.id);
  const patterns = getPatternsByTrack(track.id);
  const completedLessons = useProgressStore((s) => s.completedLessons);

  const itemIds = items.map((q) => q.id);
  const pct = useProgressStore.getState().trackMasteryPct(track.id, itemIds);

  // Group items by topic
  const byTopic = new Map<string, typeof items>();
  for (const it of items) {
    const arr = byTopic.get(it.topic) ?? [];
    arr.push(it);
    byTopic.set(it.topic, arr);
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="text-4xl mb-2">{track.emoji}</div>
        <h1 className="text-3xl font-bold text-white">{track.title}</h1>
        <p className="mt-2 text-[var(--color-text-dim)] max-w-2xl">{track.blurb}</p>
        <div className="mt-4 max-w-md">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
            <span>track mastery</span>
            <span>
              {pct}% — {items.length} quiz items, {lessons.length} lessons
            </span>
          </div>
          <ProgressBar value={pct} />
        </div>
      </header>

      {patterns.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-white">Patterns</h2>
            <Link
              to={`/patterns/${track.id}`}
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              View all {patterns.length} →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {patterns.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                to={`/patterns/${track.id}#${p.id}`}
                className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white hover:bg-[var(--color-bg-card-hover)]"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Lessons</h2>
        {lessons.length === 0 ? (
          <div className="text-sm text-[var(--color-text-dim)] italic">
            No lessons yet. Add markdown files in <code>src/content/{track.id}/</code>.
          </div>
        ) : (
          <ol className="space-y-2">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link
                  to={`/lesson/${l.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--color-text-muted)] font-mono">
                      {String(l.order).padStart(2, "0")}.
                    </span>
                    <div>
                      <div className="font-semibold text-white">{l.title}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        {l.estMinutes} min · {l.topic}
                      </div>
                    </div>
                  </div>
                  {completedLessons[l.id] ? (
                    <span className="text-xs text-[var(--color-success)]">✓ done</span>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]">read →</span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-3">Practice by topic</h2>
        {byTopic.size === 0 ? (
          <div className="text-sm text-[var(--color-text-dim)] italic">
            No quiz items yet. Add them to <code>src/data/quizzes/{track.id}.json</code>.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from(byTopic.entries()).map(([topic, list]) => (
              <Link
                key={topic}
                to={`/quiz/${track.id}/${topic}`}
                className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)]"
              >
                <div className="font-semibold text-white capitalize">{topic}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {list.length} items ·{" "}
                  {[
                    list.filter((q) => q.type === "mcq").length && `${list.filter((q) => q.type === "mcq").length} MCQ`,
                    list.filter((q) => q.type === "coding").length && `${list.filter((q) => q.type === "coding").length} coding`,
                    list.filter((q) => q.type === "sql").length && `${list.filter((q) => q.type === "sql").length} SQL`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
