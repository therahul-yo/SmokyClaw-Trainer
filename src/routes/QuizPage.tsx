import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import {
  getQuizItemsByTopic,
  getTrack,
} from "../lib/contentLoader";
import type { TrackId } from "../types";
import { McqCard } from "../components/McqCard";
import { CodingSandbox } from "../components/CodingSandbox";
import { SqlSandbox } from "../components/SqlSandbox";

export function QuizPage() {
  const { trackId, topic } = useParams<{ trackId: string; topic: string }>();
  const track = getTrack(trackId as TrackId);
  const [idx, setIdx] = useState(0);

  if (!track || !topic) return <Navigate to="/" replace />;

  const items = getQuizItemsByTopic(track.id, topic);
  if (items.length === 0) {
    return (
      <div>
        <p className="text-[var(--color-text-dim)]">
          No items for {track.title} → {topic}.
        </p>
        <Link to={`/track/${track.id}`} className="text-[var(--color-accent)]">
          ← back
        </Link>
      </div>
    );
  }

  const current = items[Math.min(idx, items.length - 1)];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
            <Link to={`/track/${track.id}`} className="hover:text-white">
              ← {track.title}
            </Link>{" "}
            · {topic}
          </div>
          <div className="text-lg font-semibold text-white mt-1">
            Item {Math.min(idx + 1, items.length)} of {items.length}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="px-3 py-1.5 rounded border border-[var(--color-border)] disabled:opacity-40"
          >
            ← prev
          </button>
          <button
            disabled={idx >= items.length - 1}
            onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
            className="px-3 py-1.5 rounded border border-[var(--color-border)] disabled:opacity-40"
          >
            next →
          </button>
        </div>
      </div>

      {current.type === "mcq" && <McqCard key={current.id} item={current} />}
      {current.type === "coding" && <CodingSandbox key={current.id} item={current} />}
      {current.type === "sql" && <SqlSandbox key={current.id} item={current} />}
    </div>
  );
}
