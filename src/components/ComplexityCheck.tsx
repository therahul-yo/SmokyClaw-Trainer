import { useState } from "react";
import type { ComplexityChoice } from "../types";

// Post-pass modal: "what's the time complexity of your solution?"
// Drives the habit interviewers actually care about. Cosmetic — gates the
// editorial reveal but doesn't change Leitner state.
export function ComplexityCheck({
  question,
  choices,
  onPass,
  onSkip,
}: {
  question: string;
  choices: ComplexityChoice[];
  onPass: () => void;
  onSkip: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const pickedChoice = picked !== null ? choices[picked] : null;

  return (
    <div className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5 p-4 space-y-3">
      <div className="font-semibold text-white">🧮 Complexity check</div>
      <div className="text-sm text-[var(--color-text)]">{question}</div>
      <div className="grid grid-cols-2 gap-2">
        {choices.map((c, i) => (
          <button
            key={i}
            type="button"
            disabled={showResult}
            onClick={() => setPicked(i)}
            className={`px-3 py-2 rounded-md text-sm border text-left transition-colors ${
              picked === i
                ? showResult
                  ? c.correct
                    ? "bg-[var(--color-success)]/20 border-[var(--color-success)] text-white"
                    : "bg-[var(--color-danger)]/20 border-[var(--color-danger)] text-white"
                  : "bg-[var(--color-accent-dim)] border-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-white"
            }`}
          >
            <span className="font-mono">{c.label}</span>
            {showResult && c.correct && (
              <span className="ml-2 text-[var(--color-success)]">✓</span>
            )}
          </button>
        ))}
      </div>
      {showResult ? (
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {pickedChoice?.correct ? (
              <span className="text-[var(--color-success)]">Correct.</span>
            ) : (
              <span className="text-[var(--color-warning)]">
                Not quite — see editorial.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onPass}
            className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white"
          >
            Show editorial →
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={picked === null}
            onClick={() => setShowResult(true)}
            className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-accent-dim)] hover:bg-[var(--color-accent)] text-white disabled:opacity-40"
          >
            Check
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-3 py-1.5 rounded-md text-sm text-[var(--color-text-muted)] hover:text-white"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}
