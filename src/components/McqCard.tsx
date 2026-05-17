import { useState } from "react";
import clsx from "clsx";
import type { McqItem } from "../types";
import { useProgressStore, useReviewQueueStore, useStreakStore } from "../store";
import { BookmarkButton } from "./BookmarkButton";
import { LessonRenderer } from "./LessonRenderer";

export function McqCard({
  item,
  onAnswered,
}: {
  item: McqItem;
  onAnswered?: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const startedAt = useState(() => Date.now())[0];

  const recordAttempt = useProgressStore((s) => s.recordAttempt);
  const registerAttempt = useReviewQueueStore((s) => s.registerAttempt);
  const ping = useStreakStore((s) => s.ping);

  const submit = (idx: number) => {
    if (submittedAt !== null) return;
    setSelected(idx);
    const correct = idx === item.answerIndex;
    const now = Date.now();
    setSubmittedAt(now);
    recordAttempt({ itemId: item.id, correct, timeMs: now - startedAt });
    registerAttempt(item.id, correct);
    ping();
    onAnswered?.(correct);
  };

  const submitted = submittedAt !== null;
  const correct = submitted && selected === item.answerIndex;

  return (
    <article className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
          {item.track} · {item.topic} · {item.difficulty}
        </div>
        <BookmarkButton itemId={item.id} />
      </div>

      <div className="text-[var(--color-text)]">
        <LessonRenderer body={item.question} />
      </div>

      <ul className="space-y-2">
        {item.options.map((opt, i) => {
          const chosen = i === selected;
          const isAnswer = i === item.answerIndex;
          return (
            <li key={i}>
              <button
                onClick={() => submit(i)}
                disabled={submitted}
                className={clsx(
                  "w-full text-left px-4 py-3 rounded-md border transition-colors",
                  !submitted &&
                    "border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)] hover:border-[var(--color-text-dim)]",
                  submitted && isAnswer && "border-[var(--color-success)] bg-green-900/20",
                  submitted &&
                    chosen &&
                    !isAnswer &&
                    "border-[var(--color-danger)] bg-red-900/20",
                  submitted &&
                    !chosen &&
                    !isAnswer &&
                    "border-[var(--color-border)] opacity-60",
                )}
              >
                <span className="font-mono text-[var(--color-text-muted)] mr-3">
                  {String.fromCharCode(65 + i)}.
                </span>
                <span>
                  <LessonRenderer body={opt} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {submitted && (
        <div
          className={clsx(
            "p-4 rounded-md border-l-4",
            correct
              ? "border-[var(--color-success)] bg-green-900/10"
              : "border-[var(--color-danger)] bg-red-900/10",
          )}
        >
          <div className="font-semibold mb-2">
            {correct ? "✓ Correct" : "✗ Wrong"}
          </div>
          <div className="text-sm text-[var(--color-text-dim)]">
            <LessonRenderer body={item.explanation} />
          </div>
        </div>
      )}
    </article>
  );
}
