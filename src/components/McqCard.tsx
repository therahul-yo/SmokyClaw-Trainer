import { useMemo, useState } from "react";
import type { McqItem } from "../types";
import { useProgressStore, useReviewQueueStore, useStreakStore } from "../store";
import { shuffleOptions } from "../lib/shuffleOptions";
import { BookmarkButton } from "./BookmarkButton";
import { LessonRenderer } from "./LessonRenderer";
import { Box } from "./terminal/Box";

export function McqCard({
  item,
  onAnswered,
}: {
  item: McqItem;
  onAnswered?: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startedAt = useState(() => Date.now())[0];

  // Seeded, stable per-item shuffle so the correct answer isn't always in the
  // authored position (kills position memorization). answerIndex is remapped.
  const shuffled = useMemo(
    () => shuffleOptions(item.id, item.options, item.answerIndex),
    [item.id, item.options, item.answerIndex],
  );

  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const registerAttempt = useReviewQueueStore((s) => s.registerAttempt);
  const ping = useStreakStore((s) => s.ping);

  const handleSubmit = (idx: number, clickedAt: number) => {
    if (submitted) return;
    setSelected(idx);
    setSubmitted(true);
    const correct = idx === shuffled.answerIndex;
    // clickedAt is sampled in the onClick handler (an event-handler context),
    // so no impure Date.now() runs in this render-scope function.
    recordAttempt({ itemId: item.id, correct, timeMs: clickedAt - startedAt });
    registerAttempt(item.id, correct);
    ping();
    onAnswered?.(correct);
  };

  const correct = submitted && selected === shuffled.answerIndex;

  return (
    <Box
      title={
        <span>
          <span style={{ color: "var(--color-amber)" }}>{item.id}</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>{item.track}/{item.topic}</span>
          <span style={{ color: "var(--color-text-muted)" }}> · </span>
          <span>{item.difficulty}</span>
        </span>
      }
      trailing={<BookmarkButton itemId={item.id} />}
    >
      <div className="space-y-4">
        <div style={{ color: "var(--color-text)" }}>
          <LessonRenderer body={item.question} />
        </div>

        <ul className="space-y-2" role="group" aria-label="Answer options">
          {shuffled.options.map((opt, i) => {
            const chosen = i === selected;
            const isAnswer = i === shuffled.answerIndex;
            // Non-color state cue (don't rely on border color alone).
            const mark = submitted
              ? isAnswer
                ? "✓"
                : chosen
                  ? "✗"
                  : ""
              : "";
            const srState = submitted
              ? isAnswer
                ? " (correct answer)"
                : chosen
                  ? " (your answer, incorrect)"
                  : ""
              : "";
            let borderColor = "var(--color-border-bright)";
            let bgColor = "transparent";
            let opacity = 1;
            if (submitted) {
              if (isAnswer) {
                borderColor = "var(--color-success)";
                bgColor = "rgba(255, 140, 0, 0.07)";
              } else if (chosen) {
                borderColor = "var(--color-danger)";
                bgColor = "rgba(255, 68, 68, 0.07)";
              } else {
                opacity = 0.5;
              }
            }
            return (
              <li key={i}>
                <button
                  onClick={() => handleSubmit(i, Date.now())}
                  disabled={submitted}
                  aria-label={`Option ${String.fromCharCode(65 + i)}${srState}`}
                  className="w-full text-left px-3 py-2 font-mono text-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed"
                  style={{
                    border: `1px solid ${borderColor}`,
                    background: bgColor,
                    opacity,
                  }}
                >
                  {mark && (
                    <span
                      aria-hidden="true"
                      className="mr-1 font-bold"
                      style={{
                        color: isAnswer ? "var(--color-success)" : "var(--color-danger)",
                      }}
                    >
                      {mark}
                    </span>
                  )}
                  <span
                    className="mr-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    [{String.fromCharCode(65 + i)}]
                  </span>
                  <span style={{ color: "var(--color-text)" }}>
                    <LessonRenderer body={opt} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {submitted && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 text-sm"
            style={{
              borderLeft: `3px solid ${correct ? "var(--color-success)" : "var(--color-danger)"}`,
              background: correct
                ? "rgba(255, 140, 0, 0.05)"
                : "rgba(255, 68, 68, 0.05)",
            }}
          >
            <div
              className="font-bold mb-1 font-mono"
              style={{
                color: correct ? "var(--color-success)" : "var(--color-danger)",
              }}
            >
              {correct ? "PASS // ✓ correct" : "FAIL // ✗ wrong"}
            </div>
            <div style={{ color: "var(--color-text-dim)" }}>
              <LessonRenderer body={item.explanation} />
            </div>
          </div>
        )}
      </div>
    </Box>
  );
}
