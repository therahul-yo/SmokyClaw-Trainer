import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { getQuizItemsByTopic, getTrack } from "../lib/contentLoader";
import type { TrackId } from "../types";
import { McqCard } from "../components/McqCard";
import { CodingSandbox } from "../components/CodingSandbox";
import { SqlSandbox } from "../components/SqlSandbox";
import { Prompt } from "../components/terminal/Prompt";
import { BracketButton } from "../components/terminal/BracketButton";

export function QuizPage() {
  const { trackId, topic } = useParams<{ trackId: string; topic: string }>();
  const track = getTrack(trackId as TrackId);
  const [idx, setIdx] = useState(0);

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
      </Prompt>

      <div
        className="flex items-center justify-between px-3 py-2 text-xs"
        style={{
          background: "var(--color-bg-alt)",
          border: "1px solid var(--color-border-bright)",
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

      {current.type === "mcq" && <McqCard key={current.id} item={current} />}
      {current.type === "coding" && <CodingSandbox key={current.id} item={current} />}
      {current.type === "sql" && <SqlSandbox key={current.id} item={current} />}
    </div>
  );
}
