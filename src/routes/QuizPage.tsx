import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate, useSearchParams } from "react-router-dom";
import { getQuizItemsByTopic, getTrack } from "../lib/contentLoader";
import type { TrackId } from "../types";
import { McqCard } from "../components/McqCard";
import { CodingSandbox } from "../components/CodingSandbox";
import { SqlSandbox } from "../components/SqlSandbox";
import { HumanCompilerPanel } from "../components/HumanCompilerPanel";
import { Prompt } from "../components/terminal/Prompt";
import { BracketButton } from "../components/terminal/BracketButton";
import { useDailyStore, useProgressStore } from "../store";
import { todayKey } from "../lib/daily";

export function QuizPage() {
  const { trackId, topic } = useParams<{ trackId: string; topic: string }>();
  const [search] = useSearchParams();
  const dailyParam = search.get("daily");
  const track = getTrack(trackId as TrackId);
  const [idx, setIdx] = useState(0);

  // Mark daily challenge complete on a successful attempt logged while the
  // ?daily=YYYY-MM-DD param is set AND the dateKey matches today.
  const attempts = useProgressStore((s) => s.attempts);
  const markCompleted = useDailyStore((s) => s.markCompleted);
  const lastAttemptId = useMemo(
    () => attempts.length > 0 ? attempts[attempts.length - 1] : null,
    [attempts],
  );
  useEffect(() => {
    if (!dailyParam) return;
    const key = todayKey();
    if (dailyParam !== key) return;
    if (!lastAttemptId || !lastAttemptId.correct) return;
    markCompleted(key);
  }, [dailyParam, lastAttemptId, markCompleted]);

  if (!track || !topic) return <Navigate to="/" replace />;

  const items = getQuizItemsByTopic(track.id, topic);
  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <Prompt path={`~/tracks/${track.id}/${topic}`}>
          <span style={{ color: "var(--color-danger)" }}>
            ls: no items found
          </span>
        </Prompt>
        <Link
          to={`/track/${track.id}`}
          className="underline"
          style={{ color: "var(--color-cyan)" }}
        >
          ← back to {track.id}/
        </Link>
      </div>
    );
  }

  const current = items[Math.min(idx, items.length - 1)];
  const position = Math.min(idx + 1, items.length);

  return (
    <div className="space-y-4">
      <Prompt path={`~/tracks/${track.id}/${topic}`}>
        <span>run --item={position}/{items.length}</span>
        {dailyParam && (
          <span style={{ color: "var(--color-amber)" }} className="ml-2">
            // daily challenge ({dailyParam})
          </span>
        )}
      </Prompt>

      <div
        className="flex items-center justify-between px-3 py-2 text-xs"
        style={{
          background: "var(--color-bg-alt)",
          border: `1px solid ${dailyParam ? "var(--color-amber)" : "var(--color-border-bright)"}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Link
            to={`/track/${track.id}`}
            className="underline"
            style={{ color: "var(--color-cyan)" }}
          >
            ../{track.id}
          </Link>
          <span style={{ color: "var(--color-text-muted)" }}>/</span>
          <span style={{ color: "var(--color-amber)" }}>{topic}</span>
          <span style={{ color: "var(--color-text-muted)" }}>·</span>
          <span style={{ color: "var(--color-text-dim)" }}>
            item {position} / {items.length}
          </span>
        </div>
        <div className="flex gap-2">
          <BracketButton
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
          >
            ← prev
          </BracketButton>
          <BracketButton
            disabled={idx >= items.length - 1}
            onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
          >
            next →
          </BracketButton>
        </div>
      </div>

      <HumanCompilerPanel key={`trace:${current.id}`} mode="item" item={current} />

      {current.type === "mcq" && <McqCard key={current.id} item={current} />}
      {current.type === "coding" && <CodingSandbox key={current.id} item={current} />}
      {current.type === "sql" && <SqlSandbox key={current.id} item={current} />}
    </div>
  );
}
